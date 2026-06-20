#!/usr/bin/env node

/**
 * BlockStop Database Migration Runner
 * Runs all SQL migrations in order using node-postgres (pg)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://blockstop:blockstop@localhost:5432/blockstop_db';
  const migrationsDir = path.join(__dirname, '../blockos/migrations');

  console.log(`${colors.blue}BlockStop Database Migration Runner${colors.reset}`);
  console.log(`Database: ${dbUrl}`);
  console.log('');

  // Create connection pool
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log(`${colors.green}✓${colors.reset} Connected to database\n`);
  } catch (error) {
    console.error(`${colors.red}✗ Failed to connect to database${colors.reset}`);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  // Get all migration files
  let migrations = [];
  try {
    migrations = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  } catch (error) {
    console.error(`${colors.red}✗ Failed to read migrations directory${colors.reset}`);
    process.exit(1);
  }

  if (migrations.length === 0) {
    console.log(`${colors.yellow}No migrations found${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.blue}Found ${migrations.length} migration(s):${colors.reset}`);
  migrations.forEach(m => console.log(`  - ${m}`));
  console.log('');

  // Run migrations
  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);
    process.stdout.write(`${colors.blue}Running ${migration}...${colors.reset} `);

    try {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      const client = await pool.connect();

      try {
        await client.query(sql);
        console.log(`${colors.green}✓${colors.reset}`);
        successCount++;
      } finally {
        client.release();
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset}`);
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      failureCount++;
    }
  }

  // Summary
  console.log('');
  console.log(`${colors.blue}Migration Summary:${colors.reset}`);
  console.log(`  Successful: ${colors.green}${successCount}${colors.reset}`);
  console.log(`  Failed: ${failureCount > 0 ? colors.red : ''}${failureCount}${colors.reset}`);

  await pool.end();

  if (failureCount === 0) {
    console.log(`\n${colors.green}All migrations completed successfully!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}Some migrations failed. Please check your database connection and SQL.${colors.reset}`);
    process.exit(1);
  }
}

runMigrations().catch(error => {
  console.error(`${colors.red}Migration runner error:${colors.reset}`, error);
  process.exit(1);
});
