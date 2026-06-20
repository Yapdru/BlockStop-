/**
 * Statistics Updater - Manages database table statistics
 * Ensures query planner has accurate information for optimization
 */

export interface TableStatistics {
  tableName: string;
  lastAnalyzed: Date;
  rowCount: number;
  estimatedSize: number;
  analyzeTime: number;
}

export class StatisticsUpdater {
  private db: any;
  private logger: any;
  private updateInterval: NodeJS.Timeout | null = null;
  private statistics: Map<string, TableStatistics> = new Map();

  constructor(db: any, logger?: any) {
    this.db = db;
    this.logger = logger || console;
  }

  /**
   * Update statistics for a specific table
   */
  async updateTableStats(tableName: string): Promise<void> {
    try {
      const startTime = Date.now();

      // Run ANALYZE on the table
      await this.db.query(`ANALYZE ${tableName}`);

      const duration = Date.now() - startTime;

      // Fetch updated statistics
      const result = await this.db.query(
        `
        SELECT
          t.tablename,
          n_live_tup as row_count,
          pg_total_relation_size(t.tablename::regclass) as estimated_size,
          last_analyze
        FROM pg_stat_user_tables
        WHERE tablename = $1
      `,
        [tableName]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        const stats: TableStatistics = {
          tableName: row.tablename,
          lastAnalyzed: new Date(row.last_analyze),
          rowCount: parseInt(row.row_count) || 0,
          estimatedSize: parseInt(row.estimated_size) || 0,
          analyzeTime: duration,
        };

        this.statistics.set(tableName, stats);

        this.logger.info(
          `Updated statistics for ${tableName}: ${stats.rowCount} rows, ${duration}ms`
        );
      }
    } catch (error) {
      this.logger.error(`Error updating statistics for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update statistics for all tables
   */
  async updateAllStats(): Promise<void> {
    try {
      this.logger.info('Starting full database statistics update...');

      const result = await this.db.query(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
      `);

      const tables = result.rows.map((row: any) => row.tablename);

      for (const tableName of tables) {
        try {
          await this.updateTableStats(tableName);
        } catch (error) {
          this.logger.warn(
            `Failed to update statistics for ${tableName}:`,
            error
          );
        }
      }

      this.logger.info(
        `Statistics update complete for ${tables.length} tables`
      );
    } catch (error) {
      this.logger.error('Error updating all statistics:', error);
      throw error;
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(tableName: string): Promise<TableStatistics | null> {
    try {
      // Check cache first
      if (this.statistics.has(tableName)) {
        return this.statistics.get(tableName) || null;
      }

      const result = await this.db.query(
        `
        SELECT
          t.tablename,
          n_live_tup as row_count,
          pg_total_relation_size(t.tablename::regclass) as estimated_size,
          last_analyze
        FROM pg_stat_user_tables
        WHERE tablename = $1
      `,
        [tableName]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const stats: TableStatistics = {
        tableName: row.tablename,
        lastAnalyzed: new Date(row.last_analyze),
        rowCount: parseInt(row.row_count) || 0,
        estimatedSize: parseInt(row.estimated_size) || 0,
        analyzeTime: 0,
      };

      this.statistics.set(tableName, stats);

      return stats;
    } catch (error) {
      this.logger.error(`Error getting statistics for ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Get statistics for all tables
   */
  async getAllTableStats(): Promise<TableStatistics[]> {
    try {
      const result = await this.db.query(`
        SELECT
          t.tablename,
          n_live_tup as row_count,
          pg_total_relation_size(t.tablename::regclass) as estimated_size,
          last_analyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(t.tablename::regclass) DESC
      `);

      const stats: TableStatistics[] = result.rows.map((row: any) => ({
        tableName: row.tablename,
        lastAnalyzed: new Date(row.last_analyze),
        rowCount: parseInt(row.row_count) || 0,
        estimatedSize: parseInt(row.estimated_size) || 0,
        analyzeTime: 0,
      }));

      return stats;
    } catch (error) {
      this.logger.error('Error getting all table statistics:', error);
      return [];
    }
  }

  /**
   * Schedule automatic statistics updates
   */
  async scheduleAutoUpdate(intervalMs: number = 3600000): Promise<void> {
    try {
      this.logger.info(
        `Scheduling automatic statistics updates every ${intervalMs / 1000}s`
      );

      // Perform initial update
      await this.updateAllStats();

      // Schedule recurring updates
      this.updateInterval = setInterval(async () => {
        try {
          await this.updateAllStats();
        } catch (error) {
          this.logger.error('Error in scheduled statistics update:', error);
        }
      }, intervalMs);
    } catch (error) {
      this.logger.error('Error scheduling auto update:', error);
      throw error;
    }
  }

  /**
   * Stop automatic updates
   */
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.logger.info('Automatic statistics updates stopped');
    }
  }

  /**
   * Get statistics health report
   */
  async getStatsHealthReport(): Promise<any> {
    try {
      const allStats = await this.getAllTableStats();
      const now = new Date();

      const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours

      const staleStats = allStats.filter(
        stat =>
          now.getTime() - stat.lastAnalyzed.getTime() > staleThreshold
      );

      const totalSize = allStats.reduce((sum, stat) => sum + stat.estimatedSize, 0);
      const totalRows = allStats.reduce((sum, stat) => sum + stat.rowCount, 0);

      return {
        totalTables: allStats.length,
        totalSize,
        totalRows,
        staleCount: staleStats.length,
        stalePercentage: Math.round((staleStats.length / allStats.length) * 100),
        staleTables: staleStats.map(s => ({
          tableName: s.tableName,
          lastAnalyzed: s.lastAnalyzed,
          age: now.getTime() - s.lastAnalyzed.getTime(),
        })),
        recommendations: this.generateRecommendations(staleStats),
      };
    } catch (error) {
      this.logger.error('Error getting stats health report:', error);
      return {
        totalTables: 0,
        totalSize: 0,
        totalRows: 0,
        staleCount: 0,
        stalePercentage: 0,
        staleTables: [],
        recommendations: [],
      };
    }
  }

  /**
   * Vacuum table to reclaim space
   */
  async vacuumTable(tableName: string): Promise<void> {
    try {
      const startTime = Date.now();

      await this.db.query(`VACUUM ANALYZE ${tableName}`);

      const duration = Date.now() - startTime;

      this.logger.info(
        `Vacuumed table ${tableName} in ${duration}ms`
      );
    } catch (error) {
      this.logger.error(`Error vacuuming table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Reindex table for performance
   */
  async reindexTable(tableName: string): Promise<void> {
    try {
      const startTime = Date.now();

      await this.db.query(`REINDEX TABLE CONCURRENTLY ${tableName}`);

      const duration = Date.now() - startTime;

      this.logger.info(
        `Reindexed table ${tableName} in ${duration}ms`
      );
    } catch (error) {
      this.logger.error(`Error reindexing table ${tableName}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private generateRecommendations(staleStats: TableStatistics[]): string[] {
    const recommendations: string[] = [];

    if (staleStats.length > 0) {
      recommendations.push(
        `Update statistics for ${staleStats.length} stale table(s)`
      );
    }

    if (staleStats.length > 5) {
      recommendations.push('Consider enabling automatic statistics updates');
    }

    return recommendations;
  }
}

export default StatisticsUpdater;
