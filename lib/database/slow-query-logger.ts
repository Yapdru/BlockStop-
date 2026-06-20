/**
 * Slow Query Logger - Detects and logs queries exceeding performance thresholds
 * Tracks query performance metrics and patterns
 */

export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: Date;
  userId?: string;
  rowsAffected: number;
}

export interface SlowQueryFilter {
  userId?: string;
  startTime?: Date;
  endTime?: Date;
  minExecutionTime?: number;
  limit?: number;
}

export class SlowQueryLogger {
  private slowQueries: SlowQuery[] = [];
  private db: any;
  private logger: any;
  private slowQueryThreshold: number = 1000; // milliseconds
  private maxStoredQueries: number = 10000;

  constructor(db: any, logger?: any, threshold: number = 1000) {
    this.db = db;
    this.logger = logger || console;
    this.slowQueryThreshold = threshold;
  }

  /**
   * Log a slow query if it exceeds threshold
   */
  async logSlowQuery(
    query: string,
    executionTime: number,
    rowsAffected: number,
    userId?: string
  ): Promise<void> {
    try {
      if (executionTime < this.slowQueryThreshold) {
        return; // Not slow enough to log
      }

      const slowQuery: SlowQuery = {
        query: this.normalizeQuery(query),
        executionTime,
        timestamp: new Date(),
        userId,
        rowsAffected,
      };

      // Store in database
      await this.db.query(
        `
        INSERT INTO slow_queries (query, execution_time, timestamp, user_id, rows_affected)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          slowQuery.query,
          slowQuery.executionTime,
          slowQuery.timestamp,
          slowQuery.userId,
          slowQuery.rowsAffected,
        ]
      );

      // Also keep in memory
      this.slowQueries.push(slowQuery);

      // Maintain max size
      if (this.slowQueries.length > this.maxStoredQueries) {
        this.slowQueries = this.slowQueries.slice(-this.maxStoredQueries);
      }

      this.logger.warn(
        `Slow query detected: ${executionTime}ms - ${this.truncateQuery(query)}`
      );
    } catch (error) {
      this.logger.error('Error logging slow query:', error);
    }
  }

  /**
   * Get slow queries with optional filtering
   */
  async getSlowQueries(limit: number = 100): Promise<SlowQuery[]> {
    try {
      const result = await this.db.query(
        `
        SELECT
          query,
          execution_time,
          timestamp,
          user_id,
          rows_affected
        FROM slow_queries
        ORDER BY timestamp DESC
        LIMIT $1
      `,
        [limit]
      );

      return result.rows.map((row: any) => ({
        query: row.query,
        executionTime: parseFloat(row.execution_time),
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
        rowsAffected: parseInt(row.rows_affected),
      }));
    } catch (error) {
      this.logger.error('Error getting slow queries:', error);
      return [];
    }
  }

  /**
   * Get slow queries filtered by user
   */
  async getSlowQueriesByUser(userId: string, limit: number = 100): Promise<SlowQuery[]> {
    try {
      const result = await this.db.query(
        `
        SELECT
          query,
          execution_time,
          timestamp,
          user_id,
          rows_affected
        FROM slow_queries
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `,
        [userId, limit]
      );

      return result.rows.map((row: any) => ({
        query: row.query,
        executionTime: parseFloat(row.execution_time),
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
        rowsAffected: parseInt(row.rows_affected),
      }));
    } catch (error) {
      this.logger.error('Error getting slow queries by user:', error);
      return [];
    }
  }

  /**
   * Get slow queries with advanced filtering
   */
  async getSlowQueriesFiltered(filter: SlowQueryFilter): Promise<SlowQuery[]> {
    try {
      let query = 'SELECT * FROM slow_queries WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filter.userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filter.userId);
      }

      if (filter.startTime) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(filter.startTime);
      }

      if (filter.endTime) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(filter.endTime);
      }

      if (filter.minExecutionTime) {
        query += ` AND execution_time >= $${paramIndex++}`;
        params.push(filter.minExecutionTime);
      }

      query += ' ORDER BY timestamp DESC';

      if (filter.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filter.limit);
      }

      const result = await this.db.query(query, params);

      return result.rows.map((row: any) => ({
        query: row.query,
        executionTime: parseFloat(row.execution_time),
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
        rowsAffected: parseInt(row.rows_affected),
      }));
    } catch (error) {
      this.logger.error('Error getting filtered slow queries:', error);
      return [];
    }
  }

  /**
   * Get slow query statistics
   */
  async getSlowQueryStats(): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT
          COUNT(*) as total_queries,
          AVG(execution_time) as avg_execution_time,
          MAX(execution_time) as max_execution_time,
          MIN(execution_time) as min_execution_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time) as p95_execution_time,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time) as p99_execution_time,
          COUNT(DISTINCT user_id) as unique_users
        FROM slow_queries
        WHERE timestamp > NOW() - INTERVAL '24 hours'
      `);

      if (result.rows.length === 0) {
        return {
          totalQueries: 0,
          avgExecutionTime: 0,
          maxExecutionTime: 0,
          minExecutionTime: 0,
          p95ExecutionTime: 0,
          p99ExecutionTime: 0,
          uniqueUsers: 0,
        };
      }

      const row = result.rows[0];

      return {
        totalQueries: parseInt(row.total_queries),
        avgExecutionTime: parseFloat(row.avg_execution_time) || 0,
        maxExecutionTime: parseFloat(row.max_execution_time) || 0,
        minExecutionTime: parseFloat(row.min_execution_time) || 0,
        p95ExecutionTime: parseFloat(row.p95_execution_time) || 0,
        p99ExecutionTime: parseFloat(row.p99_execution_time) || 0,
        uniqueUsers: parseInt(row.unique_users),
      };
    } catch (error) {
      this.logger.error('Error getting slow query stats:', error);
      return {
        totalQueries: 0,
        avgExecutionTime: 0,
        maxExecutionTime: 0,
        minExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        uniqueUsers: 0,
      };
    }
  }

  /**
   * Clear old slow query logs
   */
  async clearOldLogs(daysToKeep: number = 7): Promise<number> {
    try {
      const result = await this.db.query(
        `
        DELETE FROM slow_queries
        WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING *
      `
      );

      const deletedCount = result.rows.length;

      this.logger.info(
        `Cleared ${deletedCount} slow query logs older than ${daysToKeep} days`
      );

      return deletedCount;
    } catch (error) {
      this.logger.error('Error clearing old logs:', error);
      return 0;
    }
  }

  /**
   * Set the slow query threshold
   */
  setThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
    this.logger.info(`Slow query threshold set to ${thresholdMs}ms`);
  }

  // Private helper methods

  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .substring(0, 1000); // Truncate to reasonable length
  }

  private truncateQuery(query: string, maxLength: number = 100): string {
    if (query.length <= maxLength) {
      return query;
    }
    return query.substring(0, maxLength) + '...';
  }
}

export default SlowQueryLogger;
