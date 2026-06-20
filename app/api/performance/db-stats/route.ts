/**
 * Database Statistics API Route
 * GET /api/performance/db-stats
 * Returns comprehensive database performance statistics
 */

import { NextRequest, NextResponse } from 'next/server';

export interface DBStats {
  totalConnections: number;
  activeConnections: number;
  cacheHitRate: number;
  avgQueryTime: number;
  slowQueries: number;
  replicationLag: number;
  indexes: {
    total: number;
    unused: number;
    fragmented: number;
  };
  diskUsage: {
    totalBytes: number;
    usedBytes: number;
    usagePercent: number;
  };
  tables: Array<{
    name: string;
    rowCount: number;
    sizeBytes: number;
  }>;
  timestamp: string;
}

interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
}

let db: DatabaseConnection | null = null;

/**
 * Initialize database connection
 */
function initializeDatabase(): DatabaseConnection {
  if (!db) {
    // This would be initialized with actual database connection
    // For now, returning a mock implementation
    db = {
      async query(sql: string, params?: any[]) {
        return { rows: [] };
      },
    };
  }
  return db;
}

/**
 * Get current database connection stats
 */
async function getConnectionStats(db: DatabaseConnection): Promise<{
  totalConnections: number;
  activeConnections: number;
}> {
  try {
    const result = await db.query(`
      SELECT
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_database
      WHERE datname = current_database()
    `);

    if (result.rows.length === 0) {
      return {
        totalConnections: 0,
        activeConnections: 0,
      };
    }

    const row = result.rows[0];
    return {
      totalConnections: parseInt(row.max_connections) || 0,
      activeConnections: parseInt(row.active_connections) || 0,
    };
  } catch (error) {
    console.error('Error getting connection stats:', error);
    return {
      totalConnections: 0,
      activeConnections: 0,
    };
  }
}

/**
 * Get cache hit rate
 */
async function getCacheHitRate(db: DatabaseConnection): Promise<number> {
  try {
    const result = await db.query(`
      SELECT
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as hit_rate
      FROM pg_stat_user_tables
    `);

    if (result.rows.length === 0 || result.rows[0].hit_rate === null) {
      return 0;
    }

    return parseFloat(result.rows[0].hit_rate) || 0;
  } catch (error) {
    console.error('Error getting cache hit rate:', error);
    return 0;
  }
}

/**
 * Get average query execution time
 */
async function getAvgQueryTime(db: DatabaseConnection): Promise<number> {
  try {
    const result = await db.query(`
      SELECT
        AVG(execution_time) as avg_time
      FROM query_log
      WHERE executed_at > NOW() - INTERVAL '1 hour'
    `);

    if (result.rows.length === 0 || result.rows[0].avg_time === null) {
      return 0;
    }

    return parseFloat(result.rows[0].avg_time) || 0;
  } catch (error) {
    console.error('Error getting average query time:', error);
    return 0;
  }
}

/**
 * Get slow query count
 */
async function getSlowQueryCount(db: DatabaseConnection): Promise<number> {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM slow_queries
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);

    if (result.rows.length === 0) {
      return 0;
    }

    return parseInt(result.rows[0].count) || 0;
  } catch (error) {
    console.error('Error getting slow query count:', error);
    return 0;
  }
}

/**
 * Get replication lag
 */
async function getReplicationLag(db: DatabaseConnection): Promise<number> {
  try {
    const result = await db.query(`
      SELECT
        EXTRACT(EPOCH FROM (now() - pg_last_wal_receive_time())) as lag_seconds
      FROM pg_stat_replication
    `);

    if (result.rows.length === 0) {
      return 0; // Not a replica or no replication active
    }

    return parseFloat(result.rows[0].lag_seconds) || 0;
  } catch (error) {
    console.error('Error getting replication lag:', error);
    return 0;
  }
}

/**
 * Get index statistics
 */
async function getIndexStats(
  db: DatabaseConnection
): Promise<{ total: number; unused: number; fragmented: number }> {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
        (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE idx_scan = 0) as unused_indexes
      FROM pg_tables
      WHERE schemaname = 'public'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return {
        total: 0,
        unused: 0,
        fragmented: 0,
      };
    }

    const row = result.rows[0];
    return {
      total: parseInt(row.total_indexes) || 0,
      unused: parseInt(row.unused_indexes) || 0,
      fragmented: 0, // Would need more complex calculation
    };
  } catch (error) {
    console.error('Error getting index stats:', error);
    return {
      total: 0,
      unused: 0,
      fragmented: 0,
    };
  }
}

/**
 * Get disk usage statistics
 */
async function getDiskUsage(db: DatabaseConnection): Promise<{
  totalBytes: number;
  usedBytes: number;
  usagePercent: number;
}> {
  try {
    const result = await db.query(`
      SELECT
        pg_database_size(current_database()) as database_size
    `);

    if (result.rows.length === 0) {
      return {
        totalBytes: 0,
        usedBytes: 0,
        usagePercent: 0,
      };
    }

    const usedBytes = parseInt(result.rows[0].database_size) || 0;

    // For this example, assuming 1TB available
    const totalBytes = 1024 * 1024 * 1024 * 1024;
    const usagePercent = Math.round((usedBytes / totalBytes) * 100);

    return {
      totalBytes,
      usedBytes,
      usagePercent,
    };
  } catch (error) {
    console.error('Error getting disk usage:', error);
    return {
      totalBytes: 0,
      usedBytes: 0,
      usagePercent: 0,
    };
  }
}

/**
 * Get table statistics
 */
async function getTableStats(
  db: DatabaseConnection
): Promise<
  Array<{
    name: string;
    rowCount: number;
    sizeBytes: number;
  }>
> {
  try {
    const result = await db.query(`
      SELECT
        schemaname,
        tablename,
        n_live_tup as row_count,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    return result.rows.map((row: any) => ({
      name: row.tablename,
      rowCount: parseInt(row.row_count) || 0,
      sizeBytes: parseInt(row.size_bytes) || 0,
    }));
  } catch (error) {
    console.error('Error getting table stats:', error);
    return [];
  }
}

/**
 * Main API handler
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize database
    const database = initializeDatabase();

    // Collect all statistics in parallel
    const [
      connectionStats,
      cacheHitRate,
      avgQueryTime,
      slowQueryCount,
      replicationLag,
      indexStats,
      diskUsage,
      tableStats,
    ] = await Promise.all([
      getConnectionStats(database),
      getCacheHitRate(database),
      getAvgQueryTime(database),
      getSlowQueryCount(database),
      getReplicationLag(database),
      getIndexStats(database),
      getDiskUsage(database),
      getTableStats(database),
    ]);

    // Construct response
    const stats: DBStats = {
      totalConnections: connectionStats.totalConnections,
      activeConnections: connectionStats.activeConnections,
      cacheHitRate,
      avgQueryTime,
      slowQueries: slowQueryCount,
      replicationLag,
      indexes: indexStats,
      diskUsage,
      tables: tableStats,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in db-stats API:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve database statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { status: 'ok' },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export default GET;
