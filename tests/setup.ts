/**
 * Test Setup File
 * Configures test environment, mocks, and database for testing
 */

import { Pool } from 'pg';

// Global test configuration
export const testConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
    database: process.env.DB_NAME || 'blockstop_test'
  },
  app: {
    url: process.env.BASE_URL || 'http://localhost:3000',
    apiTimeout: 30000
  }
};

// Database pool for tests
let dbPool: Pool | null = null;

/**
 * Initialize test database connection
 */
export async function initializeTestDb() {
  if (dbPool) return dbPool;

  dbPool = new Pool({
    ...testConfig.database,
    connectionString: process.env.DATABASE_URL
  });

  // Verify connection
  try {
    const result = await dbPool.query('SELECT NOW()');
    console.log('✓ Test database connected');
  } catch (error) {
    console.error('✗ Failed to connect to test database:', error);
    throw error;
  }

  return dbPool;
}

/**
 * Cleanup test database
 */
export async function cleanupTestDb() {
  if (!dbPool) return;

  try {
    // Clear all tables
    await dbPool.query(`
      TRUNCATE TABLE schema_migrations CASCADE;
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE email_scans CASCADE;
      TRUNCATE TABLE file_scans CASCADE;
      TRUNCATE TABLE alerts CASCADE;
      TRUNCATE TABLE audit_logs CASCADE;
      TRUNCATE TABLE statistics CASCADE;
    `);

    await dbPool.end();
    dbPool = null;
    console.log('✓ Test database cleaned up');
  } catch (error) {
    console.error('✗ Failed to cleanup test database:', error);
  }
}

/**
 * Get database connection for tests
 */
export function getDb(): Pool {
  if (!dbPool) {
    throw new Error('Test database not initialized. Call initializeTestDb() first.');
  }
  return dbPool;
}

/**
 * Mock fetch for API tests
 */
global.fetch = jest.fn((url: string, options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
    text: async () => 'OK'
  } as Response);
});

/**
 * Setup and teardown for all tests
 */
beforeAll(async () => {
  await initializeTestDb();
});

afterAll(async () => {
  await cleanupTestDb();
});

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Test timeout
jest.setTimeout(30000);
