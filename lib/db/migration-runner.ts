import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: require('winston').format.json(),
  transports: [
    new require('winston').transports.File({ filename: '/var/log/blockstop/migrations.log' }),
    new require('winston').transports.Console(),
  ],
});

export interface MigrationRecord {
  id: number;
  name: string;
  hash: string;
  executed_at: Date;
}

export class MigrationRunner {
  private pool: Pool;
  private migrationsDir: string;

  constructor(databaseUrl: string, migrationsDir: string = './migrations') {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.migrationsDir = migrationsDir;
  }

  /**
   * Initialize migrations table
   */
  async initializeMigrationsTable(client: PoolClient): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        hash VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await client.query(query);
    logger.info('Migrations table initialized');
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(client: PoolClient): Promise<MigrationRecord[]> {
    const query = 'SELECT * FROM schema_migrations ORDER BY id ASC';
    const result = await client.query(query);
    return result.rows;
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<string[]> {
    const executedMigrations = await this.getExecutedMigrations(
      await this.pool.connect()
    );
    const executedNames = new Set(executedMigrations.map(m => m.name));

    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    return files.filter(f => !executedNames.has(f));
  }

  /**
   * Run pending migrations
   */
  async runPendingMigrations(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await this.initializeMigrationsTable(client);

      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      await client.query('BEGIN');

      for (const migrationFile of pendingMigrations) {
        const migrationPath = path.join(this.migrationsDir, migrationFile);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        try {
          logger.info(`Running migration: ${migrationFile}`);
          await client.query(migrationSQL);

          // Record migration
          const hash = require('crypto')
            .createHash('sha256')
            .update(migrationSQL)
            .digest('hex');

          await client.query(
            'INSERT INTO schema_migrations (name, hash) VALUES ($1, $2)',
            [migrationFile, hash]
          );

          logger.info(`Migration completed: ${migrationFile}`);
        } catch (error) {
          logger.error(`Migration failed: ${migrationFile}`, error);
          throw error;
        }
      }

      await client.query('COMMIT');
      logger.info(`Successfully ran ${pendingMigrations.length} migrations`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Migration rollback executed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLastMigration(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const migrations = await this.getExecutedMigrations(client);

      if (migrations.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const lastMigration = migrations[migrations.length - 1];
      const rollbackPath = path.join(
        this.migrationsDir,
        lastMigration.name.replace('.sql', '.rollback.sql')
      );

      if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found: ${rollbackPath}`);
      }

      const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');

      await client.query('BEGIN');
      await client.query(rollbackSQL);
      await client.query(
        'DELETE FROM schema_migrations WHERE id = $1',
        [lastMigration.id]
      );
      await client.query('COMMIT');

      logger.info(`Rollback completed: ${lastMigration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Rollback failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback to specific migration
   */
  async rollbackToMigration(targetName: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const migrations = await this.getExecutedMigrations(client);
      const targetIndex = migrations.findIndex(m => m.name === targetName);

      if (targetIndex === -1) {
        throw new Error(`Migration not found: ${targetName}`);
      }

      // Rollback migrations in reverse order
      for (let i = migrations.length - 1; i > targetIndex; i--) {
        const migration = migrations[i];
        const rollbackPath = path.join(
          this.migrationsDir,
          migration.name.replace('.sql', '.rollback.sql')
        );

        if (!fs.existsSync(rollbackPath)) {
          throw new Error(`Rollback file not found: ${rollbackPath}`);
        }

        const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');

        await client.query('BEGIN');
        await client.query(rollbackSQL);
        await client.query(
          'DELETE FROM schema_migrations WHERE id = $1',
          [migration.id]
        );
        await client.query('COMMIT');

        logger.info(`Rollback completed: ${migration.name}`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Rollback failed', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    executed: MigrationRecord[];
    pending: string[];
  }> {
    const client = await this.pool.connect();
    try {
      await this.initializeMigrationsTable(client);
      const executed = await this.getExecutedMigrations(client);
      const pending = await this.getPendingMigrations();

      return { executed, pending };
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * CLI Entry point for migrations
 */
if (require.main === module) {
  const command = process.argv[2];
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost/blockstop';
  const migrationsDir = process.argv[3] || './migrations';

  const runner = new MigrationRunner(databaseUrl, migrationsDir);

  (async () => {
    try {
      switch (command) {
        case 'up':
          await runner.runPendingMigrations();
          break;
        case 'down':
          await runner.rollbackLastMigration();
          break;
        case 'status':
          const status = await runner.getMigrationStatus();
          console.log('Executed migrations:', status.executed);
          console.log('Pending migrations:', status.pending);
          break;
        default:
          console.log('Usage: npm run migrate [up|down|status]');
      }
    } catch (error) {
      logger.error('Migration error', error);
      process.exit(1);
    } finally {
      await runner.close();
    }
  })();
}
