/**
 * Query Optimizer
 * Optimizes slow queries and provides indexing recommendations
 */

import { QueryResult } from 'pg';

export interface QueryMetrics {
  query: string;
  executionTime: number; // ms
  rowsReturned: number;
  rowsScanned: number;
  indexUsed: string[];
  isSlowQuery: boolean;
  timestamp: Date;
  plan?: string;
}

export interface SlowQueryThresholds {
  warning: number; // ms
  critical: number; // ms
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  expectedImprovement: number; // percentage
  priority: 'low' | 'medium' | 'high';
}

export class QueryOptimizer {
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThresholds: SlowQueryThresholds = {
    warning: 100,
    critical: 1000,
  };
  private maxMetricsSize: number = 10000;
  private connectionPooling: Map<string, any> = new Map();

  constructor() {
    this.initializeConnectionPooling();
  }

  /**
   * Initialize connection pooling configuration
   */
  private initializeConnectionPooling(): void {
    const poolConfig = {
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(
        process.env.DB_POOL_IDLE_TIMEOUT || '30000',
        10,
      ),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '2000',
        10,
      ),
    };

    this.connectionPooling.set('config', poolConfig);
  }

  /**
   * Record a query execution
   */
  recordQuery(
    query: string,
    executionTime: number,
    rowsReturned: number = 0,
    rowsScanned: number = 0,
    indexUsed: string[] = [],
  ): void {
    const isSlowQuery =
      executionTime >= this.slowQueryThresholds.warning;

    const metric: QueryMetrics = {
      query,
      executionTime,
      rowsReturned,
      rowsScanned,
      indexUsed,
      isSlowQuery,
      timestamp: new Date(),
    };

    this.queryMetrics.push(metric);

    // Keep metrics manageable
    if (this.queryMetrics.length > this.maxMetricsSize) {
      this.queryMetrics.shift();
    }

    if (isSlowQuery) {
      const level =
        executionTime >= this.slowQueryThresholds.critical
          ? 'CRITICAL'
          : 'WARNING';
      console.warn(
        `[${level}] Slow query detected (${executionTime}ms): ${query.substring(0, 100)}`,
      );
    }
  }

  /**
   * Get slow queries from the last N minutes
   */
  getSlowQueries(
    minutes: number = 60,
    limit: number = 100,
  ): QueryMetrics[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    return this.queryMetrics
      .filter((m) => m.timestamp >= cutoffTime && m.isSlowQuery)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Get top slow queries by total time
   */
  getTopSlowQueries(limit: number = 10): QueryMetrics[] {
    const queryTimeMap = new Map<string, QueryMetrics[]>();

    this.queryMetrics.forEach((metric) => {
      if (!queryTimeMap.has(metric.query)) {
        queryTimeMap.set(metric.query, []);
      }
      queryTimeMap.get(metric.query)!.push(metric);
    });

    const aggregated = Array.from(queryTimeMap.entries()).map(
      ([query, metrics]) => {
        const totalTime = metrics.reduce((sum, m) => sum + m.executionTime, 0);
        const avgTime = totalTime / metrics.length;

        return {
          query,
          totalTime,
          avgTime,
          count: metrics.length,
          maxTime: Math.max(...metrics.map((m) => m.executionTime)),
        };
      },
    );

    return aggregated
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit)
      .map((agg) => ({
        query: agg.query,
        executionTime: Math.round(agg.avgTime),
        rowsReturned: 0,
        rowsScanned: 0,
        indexUsed: [],
        isSlowQuery: true,
        timestamp: new Date(),
      }));
  }

  /**
   * Get index recommendations for slow queries
   */
  getIndexRecommendations(): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    const queryPatterns = new Map<string, number>();

    // Analyze slow queries
    this.getSlowQueries().forEach((metric) => {
      // Simple pattern matching for common slow query scenarios
      const whereMatch = metric.query.match(/WHERE\s+(\w+)/gi);
      const orderByMatch = metric.query.match(/ORDER\s+BY\s+(\w+)/gi);
      const joinMatch = metric.query.match(/JOIN.*ON\s+([^=]+)=([^=]+)/gi);

      if (whereMatch) {
        whereMatch.forEach((match) => {
          const key = match.toLowerCase();
          queryPatterns.set(key, (queryPatterns.get(key) || 0) + 1);
        });
      }
    });

    // Generate recommendations for frequently slow WHERE clauses
    queryPatterns.forEach((count, pattern) => {
      if (count >= 3) {
        const columnMatch = pattern.match(/(\w+)\s*$/);
        if (columnMatch) {
          recommendations.push({
            table: 'data',
            columns: [columnMatch[1]],
            reason: `Column frequently used in WHERE clause (${count} occurrences)`,
            expectedImprovement: 20,
            priority: count >= 10 ? 'high' : 'medium',
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Optimize a query string
   */
  optimizeQueryString(query: string): string {
    let optimized = query;

    // Remove extra whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // Simplify IN clauses with single value
    optimized = optimized.replace(/IN\s*\(\s*(.+?)\s*\)/gi, (match) => {
      const values = match.match(/'.+?'/g) || [];
      if (values.length === 1) {
        return `= ${values[0]}`;
      }
      return match;
    });

    // Add LIMIT if missing for SELECT queries
    if (
      optimized.match(/^SELECT/i) &&
      !optimized.match(/LIMIT\s+\d+/i)
    ) {
      optimized += ' LIMIT 1000';
    }

    return optimized;
  }

  /**
   * Get connection pooling statistics
   */
  getPoolStats() {
    const config = this.connectionPooling.get('config');
    return {
      minConnections: config.min,
      maxConnections: config.max,
      idleTimeout: config.idleTimeoutMillis,
      connectionTimeout: config.connectionTimeoutMillis,
    };
  }

  /**
   * Set slow query thresholds
   */
  setSlowQueryThresholds(thresholds: Partial<SlowQueryThresholds>): void {
    this.slowQueryThresholds = {
      ...this.slowQueryThresholds,
      ...thresholds,
    };
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Get query metrics summary
   */
  getMetricsSummary() {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        avgExecutionTime: 0,
        slowQueryPercentage: 0,
      };
    }

    const totalQueries = this.queryMetrics.length;
    const slowQueries = this.queryMetrics.filter((m) => m.isSlowQuery).length;
    const avgExecutionTime =
      this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
      totalQueries;

    return {
      totalQueries,
      slowQueries,
      avgExecutionTime: Math.round(avgExecutionTime),
      slowQueryPercentage: Math.round((slowQueries / totalQueries) * 100),
    };
  }

  /**
   * Get query metrics for a specific table
   */
  getTableMetrics(tableName: string) {
    const tableMetrics = this.queryMetrics.filter((m) =>
      m.query.toUpperCase().includes(tableName.toUpperCase()),
    );

    if (tableMetrics.length === 0) {
      return null;
    }

    const avgTime =
      tableMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
      tableMetrics.length;
    const slowCount = tableMetrics.filter((m) => m.isSlowQuery).length;

    return {
      tableName,
      queryCount: tableMetrics.length,
      avgExecutionTime: Math.round(avgTime),
      slowQueryCount: slowCount,
      slowQueryPercentage: Math.round(
        (slowCount / tableMetrics.length) * 100,
      ),
      maxExecutionTime: Math.max(...tableMetrics.map((m) => m.executionTime)),
    };
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    return {
      timestamp: new Date(),
      summary: this.getMetricsSummary(),
      slowQueries: this.getSlowQueries(60, 50),
      recommendations: this.getIndexRecommendations(),
      poolStats: this.getPoolStats(),
    };
  }
}

// Export singleton
export const queryOptimizer = new QueryOptimizer();
