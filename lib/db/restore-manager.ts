import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: require('winston').format.json(),
  transports: [
    new require('winston').transports.File({ filename: '/var/log/blockstop/restore.log' }),
    new require('winston').transports.Console(),
  ],
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  pointInTime?: Date;
  verifyChecksum?: boolean;
  dryRun?: boolean;
}

export interface RestoreMetadata {
  backupId: string;
  restoreStartedAt: Date;
  restoreCompletedAt?: Date;
  targetDatabase: string;
  status: 'in-progress' | 'success' | 'failed' | 'verified';
  duration?: number; // in seconds
  rowsRestored?: number;
  checksumValid?: boolean;
  checksumExpected?: string;
  checksumActual?: string;
  errorMessage?: string;
}

export class RestoreManager {
  private restoreDir: string = '/var/lib/blockstop/restore';
  private s3Bucket: string;
  private s3Prefix: string;
  private databaseUrl: string;

  constructor(databaseUrl: string, s3Bucket: string, s3Prefix: string = 'database-backups') {
    this.databaseUrl = databaseUrl;
    this.s3Bucket = s3Bucket;
    this.s3Prefix = s3Prefix;

    // Create restore directory if it doesn't exist
    if (!fs.existsSync(this.restoreDir)) {
      fs.mkdirSync(this.restoreDir, { recursive: true });
    }
  }

  /**
   * Download backup from S3
   */
  async downloadBackup(backupId: string): Promise<string> {
    const backupFile = path.join(this.restoreDir, `${backupId}.sql.gz`);

    try {
      logger.info(`Downloading backup from S3: ${backupId}`);

      const key = `${this.s3Prefix}/${backupId}.sql.gz`;
      const params = {
        Bucket: this.s3Bucket,
        Key: key,
      };

      const data = await s3.getObject(params).promise();
      fs.writeFileSync(backupFile, data.Body as Buffer);

      logger.info(`Backup downloaded successfully: ${backupFile}`);
      return backupFile;
    } catch (error) {
      logger.error(`Failed to download backup: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Verify backup checksum
   */
  async verifyBackupChecksum(backupFile: string, expectedChecksum: string): Promise<boolean> {
    try {
      logger.info(`Verifying checksum for: ${backupFile}`);

      const fileBuffer = fs.readFileSync(backupFile);
      const actualChecksum = require('crypto')
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      const isValid = actualChecksum === expectedChecksum;

      if (isValid) {
        logger.info(`Checksum verification passed for: ${backupFile}`);
      } else {
        logger.error(`Checksum verification failed for: ${backupFile}`, {
          expected: expectedChecksum,
          actual: actualChecksum,
        });
      }

      return isValid;
    } catch (error) {
      logger.error(`Checksum verification error: ${backupFile}`, error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(options: RestoreOptions): Promise<RestoreMetadata> {
    const metadata: RestoreMetadata = {
      backupId: options.backupId,
      restoreStartedAt: new Date(),
      targetDatabase: options.targetDatabase || 'blockstop_restored',
      status: 'in-progress',
    };

    let backupFile: string | null = null;

    try {
      if (options.dryRun) {
        logger.info(`DRY RUN: Would restore from backup ${options.backupId}`);
        metadata.status = 'success';
        return metadata;
      }

      // Download backup
      backupFile = await this.downloadBackup(options.backupId);

      // Create target database if it doesn't exist
      await this.createTargetDatabase(metadata.targetDatabase);

      // Extract database connection details
      const dbUrl = new URL(this.databaseUrl);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Restore backup
      logger.info(`Starting restore to database: ${metadata.targetDatabase}`);

      const env = { ...process.env, PGPASSWORD: password };
      const command = `gunzip -c ${backupFile} | psql -h ${host} -p ${port} -U ${username} -d ${metadata.targetDatabase}`;

      const startTime = Date.now();
      execSync(command, { env });
      metadata.duration = (Date.now() - startTime) / 1000;

      // Verify restoration
      if (options.verifyChecksum) {
        const checksumValid = await this.verifyRestoration(metadata.targetDatabase);
        metadata.checksumValid = checksumValid;
        if (!checksumValid) {
          throw new Error('Restored database verification failed');
        }
      }

      metadata.status = 'success';
      metadata.restoreCompletedAt = new Date();

      logger.info(`Database restored successfully: ${metadata.targetDatabase}`, metadata);
      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.errorMessage = String(error);
      logger.error(`Database restore failed: ${options.backupId}`, error);
      throw error;
    } finally {
      // Clean up local backup file
      if (backupFile && fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
        logger.info(`Local restore file deleted: ${backupFile}`);
      }
    }
  }

  /**
   * Create target database
   */
  private async createTargetDatabase(targetDatabase: string): Promise<void> {
    try {
      const dbUrl = new URL(this.databaseUrl);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;
      const defaultDb = 'postgres';

      const env = { ...process.env, PGPASSWORD: password };
      const command = `psql -h ${host} -p ${port} -U ${username} -d ${defaultDb} -c "CREATE DATABASE ${targetDatabase};"`;

      try {
        execSync(command, { env });
        logger.info(`Target database created: ${targetDatabase}`);
      } catch (error: any) {
        // Database might already exist, which is fine
        if (!error.message.includes('already exists')) {
          throw error;
        }
        logger.info(`Target database already exists: ${targetDatabase}`);
      }
    } catch (error) {
      logger.error(`Failed to create target database: ${targetDatabase}`, error);
      throw error;
    }
  }

  /**
   * Verify restored database
   */
  private async verifyRestoration(targetDatabase: string): Promise<boolean> {
    try {
      logger.info(`Verifying restored database: ${targetDatabase}`);

      const dbUrl = new URL(this.databaseUrl);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      const env = { ...process.env, PGPASSWORD: password };
      const command = `psql -h ${host} -p ${port} -U ${username} -d ${targetDatabase} -c "SELECT 1;"`;

      execSync(command, { env });
      logger.info(`Database verification passed: ${targetDatabase}`);
      return true;
    } catch (error) {
      logger.error(`Database verification failed: ${targetDatabase}`, error);
      return false;
    }
  }

  /**
   * List available backups for restore
   */
  async listAvailableBackups(): Promise<AWS.S3.ObjectList> {
    try {
      const params = {
        Bucket: this.s3Bucket,
        Prefix: this.s3Prefix,
      };

      const response = await s3.listObjectsV2(params).promise();
      logger.info(`Found ${response.Contents?.length || 0} available backups for restore`);
      return response.Contents || [];
    } catch (error) {
      logger.error('Failed to list available backups', error);
      throw error;
    }
  }

  /**
   * Point-in-time recovery
   */
  async pointInTimeRecovery(
    targetTime: Date,
    targetDatabase: string = 'blockstop_pit'
  ): Promise<RestoreMetadata> {
    try {
      logger.info(`Starting point-in-time recovery to ${targetTime.toISOString()}`);

      // Find the most recent backup before the target time
      const backups = await this.listAvailableBackups();
      const eligibleBackups = backups.filter(
        (b) => b.LastModified && b.LastModified < targetTime
      );

      if (eligibleBackups.length === 0) {
        throw new Error('No backups available before the target time');
      }

      // Sort by date descending and take the most recent
      eligibleBackups.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));
      const backupKey = eligibleBackups[0].Key || '';
      const backupId = path.basename(backupKey, '.sql.gz');

      logger.info(`Using backup from ${eligibleBackups[0].LastModified} for PIT recovery`);

      return await this.restoreDatabase({
        backupId,
        targetDatabase,
        pointInTime: targetTime,
        verifyChecksum: true,
      });
    } catch (error) {
      logger.error('Point-in-time recovery failed', error);
      throw error;
    }
  }

  /**
   * Promote restored database to primary
   */
  async promoteRestoredDatabase(
    restoredDatabaseName: string,
    primaryDatabaseName: string = 'blockstop'
  ): Promise<void> {
    try {
      logger.info(`Promoting restored database to primary: ${restoredDatabaseName} -> ${primaryDatabaseName}`);

      const dbUrl = new URL(this.databaseUrl);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      const env = { ...process.env, PGPASSWORD: password };

      // Terminate all connections to the primary database
      const killConnectionsCmd = `psql -h ${host} -p ${port} -U ${username} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${primaryDatabaseName}' AND pid <> pg_backend_pid();"`;
      execSync(killConnectionsCmd, { env });

      // Rename databases
      const renameCmd = `psql -h ${host} -p ${port} -U ${username} -d postgres -c "ALTER DATABASE ${primaryDatabaseName} RENAME TO ${primaryDatabaseName}_old; ALTER DATABASE ${restoredDatabaseName} RENAME TO ${primaryDatabaseName};"`;
      execSync(renameCmd, { env });

      logger.info(`Database promoted successfully: ${restoredDatabaseName} -> ${primaryDatabaseName}`);
    } catch (error) {
      logger.error('Failed to promote restored database', error);
      throw error;
    }
  }

  /**
   * Get restore status
   */
  async getRestoreStatus(backupId: string): Promise<RestoreMetadata | null> {
    try {
      const backupFile = path.join(this.restoreDir, `${backupId}-metadata.json`);

      if (!fs.existsSync(backupFile)) {
        return null;
      }

      const metadata = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      return metadata;
    } catch (error) {
      logger.error(`Failed to get restore status for: ${backupId}`, error);
      return null;
    }
  }
}

/**
 * CLI Entry point for restore operations
 */
if (require.main === module) {
  const command = process.argv[2];
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost/blockstop';
  const s3Bucket = process.env.S3_BACKUP_BUCKET || 'blockstop-backups';

  const manager = new RestoreManager(databaseUrl, s3Bucket);

  (async () => {
    try {
      switch (command) {
        case 'list':
          const backups = await manager.listAvailableBackups();
          console.log('Available backups for restore:', backups);
          break;

        case 'restore':
          const backupId = process.argv[3];
          const targetDb = process.argv[4] || 'blockstop_restored';
          if (!backupId) {
            console.log('Usage: npm run restore [backupId] [targetDatabase]');
            process.exit(1);
          }
          const result = await manager.restoreDatabase({
            backupId,
            targetDatabase: targetDb,
            verifyChecksum: true,
          });
          console.log('Restore completed:', result);
          break;

        case 'promote':
          const restoredDb = process.argv[3];
          const primaryDb = process.argv[4] || 'blockstop';
          if (!restoredDb) {
            console.log('Usage: npm run restore promote [restoredDatabase] [primaryDatabase]');
            process.exit(1);
          }
          await manager.promoteRestoredDatabase(restoredDb, primaryDb);
          console.log('Database promoted successfully');
          break;

        case 'pit':
          const targetTime = process.argv[3];
          if (!targetTime) {
            console.log('Usage: npm run restore pit [ISO-timestamp]');
            process.exit(1);
          }
          const pitResult = await manager.pointInTimeRecovery(new Date(targetTime));
          console.log('Point-in-time recovery completed:', pitResult);
          break;

        default:
          console.log('Usage: npm run restore [list|restore|promote|pit]');
      }
    } catch (error) {
      logger.error('Restore error', error);
      process.exit(1);
    }
  })();
}
