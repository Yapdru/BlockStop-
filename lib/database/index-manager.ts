/**
 * Index Manager - Manages database indexes and their lifecycle
 * Handles index creation, deletion, analysis, and optimization
 */

export interface IndexInfo {
  indexName: string;
  tableName: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gist' | 'gin';
  unique: boolean;
  size: number;
  usageCount: number;
}

export interface IndexStats {
  sizeBytes: number;
  scans: number;
  tuples: number;
  usagePercent: number;
  fragmentation: number;
}

export class IndexManager {
  private db: any;
  private logger: any;

  constructor(db: any, logger?: any) {
    this.db = db;
    this.logger = logger || console;
  }

  /**
   * List all indexes, optionally filtered by table name
   */
  async listIndexes(tableName?: string): Promise<IndexInfo[]> {
    try {
      let query = `
        SELECT
          i.indexname as index_name,
          t.tablename as table_name,
          ix.indisunique as is_unique,
          pg_size_pretty(pg_relation_size(i.indexname::regclass)) as index_size,
          idx.idx_scan as usage_count
        FROM pg_indexes i
        JOIN pg_tables t ON i.tablename = t.tablename
        LEFT JOIN pg_stat_user_indexes idx ON i.indexname = idx.indexrelname
      `;

      const params: any[] = [];

      if (tableName) {
        query += ' WHERE t.tablename = $1';
        params.push(tableName);
      }

      query += ' ORDER BY i.tablename, i.indexname';

      const result = await this.db.query(query, params);

      return result.rows.map((row: any) => ({
        indexName: row.index_name,
        tableName: row.table_name,
        columns: this.parseIndexColumns(row.index_definition),
        type: this.detectIndexType(row.index_definition),
        unique: row.is_unique,
        size: this.parseSizeBytes(row.index_size),
        usageCount: row.usage_count || 0,
      }));
    } catch (error) {
      this.logger.error('Error listing indexes:', error);
      throw error;
    }
  }

  /**
   * Create a new index
   */
  async createIndex(
    tableName: string,
    columns: string[],
    options?: { unique?: boolean; type?: string }
  ): Promise<IndexInfo> {
    try {
      const isUnique = options?.unique ?? false;
      const indexType = options?.type ?? 'btree';
      const indexName = this.generateIndexName(tableName, columns);
      const columnList = columns.join(', ');

      const uniqueKeyword = isUnique ? 'UNIQUE' : '';
      const typeKeyword = indexType !== 'btree' ? `USING ${indexType}` : '';

      const createQuery = `
        CREATE ${uniqueKeyword} INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
        ON ${tableName} ${typeKeyword} (${columnList})
      `;

      await this.db.query(createQuery);

      this.logger.info(`Created index: ${indexName}`);

      // Return the newly created index info
      const indexes = await this.listIndexes(tableName);
      const newIndex = indexes.find(idx => idx.indexName === indexName);

      if (!newIndex) {
        throw new Error(`Failed to create index ${indexName}`);
      }

      return newIndex;
    } catch (error) {
      this.logger.error('Error creating index:', error);
      throw error;
    }
  }

  /**
   * Drop an index
   */
  async dropIndex(indexName: string): Promise<void> {
    try {
      await this.db.query(
        `DROP INDEX CONCURRENTLY IF EXISTS ${indexName}`
      );

      this.logger.info(`Dropped index: ${indexName}`);
    } catch (error) {
      this.logger.error('Error dropping index:', error);
      throw error;
    }
  }

  /**
   * Analyze index usage and identify unused and fragmented indexes
   */
  async analyzeIndexUsage(): Promise<{
    unused: IndexInfo[];
    fragmented: IndexInfo[];
  }> {
    try {
      const allIndexes = await this.listIndexes();

      const unused: IndexInfo[] = [];
      const fragmented: IndexInfo[] = [];

      for (const index of allIndexes) {
        if (index.usageCount === 0) {
          unused.push(index);
        }

        const stats = await this.getIndexStats(index.indexName);
        if (stats.fragmentation > 20) {
          fragmented.push(index);
        }
      }

      return { unused, fragmented };
    } catch (error) {
      this.logger.error('Error analyzing index usage:', error);
      throw error;
    }
  }

  /**
   * Rebuild a fragmented index
   */
  async rebuildIndex(indexName: string): Promise<void> {
    try {
      // Get the table name for the index
      const result = await this.db.query(
        `
        SELECT tablename FROM pg_indexes
        WHERE indexname = $1
      `,
        [indexName]
      );

      if (result.rows.length === 0) {
        throw new Error(`Index not found: ${indexName}`);
      }

      const tableName = result.rows[0].tablename;

      // Drop and recreate the index
      await this.db.query(`DROP INDEX CONCURRENTLY IF EXISTS ${indexName}`);
      await this.db.query(
        `REINDEX INDEX CONCURRENTLY ${indexName}`
      );

      this.logger.info(`Rebuilt index: ${indexName}`);
    } catch (error) {
      this.logger.error('Error rebuilding index:', error);
      throw error;
    }
  }

  /**
   * Get detailed statistics for an index
   */
  async getIndexStats(indexName: string): Promise<IndexStats> {
    try {
      const result = await this.db.query(
        `
        SELECT
          pg_relation_size($1::regclass) as size_bytes,
          idx.idx_scan as scans,
          idx.idx_tup_read as tuples_read,
          idx.idx_tup_fetch as tuples_fetched,
          COALESCE(
            ROUND(100.0 * idx.idx_scan / NULLIF(
              (SELECT SUM(idx_scan) FROM pg_stat_user_indexes), 0
            ), 2),
            0
          ) as usage_percent
        FROM pg_stat_user_indexes idx
        WHERE idx.indexrelname = $1
      `,
        [indexName]
      );

      if (result.rows.length === 0) {
        throw new Error(`Index stats not found: ${indexName}`);
      }

      const row = result.rows[0];
      const fragmentation = await this.calculateFragmentation(indexName);

      return {
        sizeBytes: row.size_bytes || 0,
        scans: row.scans || 0,
        tuples: row.tuples_fetched || 0,
        usagePercent: parseFloat(row.usage_percent) || 0,
        fragmentation,
      };
    } catch (error) {
      this.logger.error('Error getting index stats:', error);
      return {
        sizeBytes: 0,
        scans: 0,
        tuples: 0,
        usagePercent: 0,
        fragmentation: 0,
      };
    }
  }

  // Private helper methods

  private parseIndexColumns(definition: string): string[] {
    // Parse index definition to extract column names
    const match = definition.match(/\((.*?)\)/);
    if (!match) return [];
    return match[1]
      .split(',')
      .map(col => col.trim())
      .filter(col => col.length > 0);
  }

  private detectIndexType(
    definition: string
  ): 'btree' | 'hash' | 'gist' | 'gin' {
    if (definition.includes('USING gin')) return 'gin';
    if (definition.includes('USING gist')) return 'gist';
    if (definition.includes('USING hash')) return 'hash';
    return 'btree';
  }

  private parseSizeBytes(sizeStr: string): number {
    if (!sizeStr) return 0;

    const units: { [key: string]: number } = {
      B: 1,
      kB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^([\d.]+)\s*([A-Z]B)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    return Math.floor(value * (units[unit] || 1));
  }

  private generateIndexName(tableName: string, columns: string[]): string {
    const columnPart = columns.join('_').replace(/[^a-z0-9]/gi, '_');
    return `idx_${tableName}_${columnPart}`.toLowerCase().substring(0, 63);
  }

  private async calculateFragmentation(indexName: string): Promise<number> {
    try {
      const result = await this.db.query(
        `
        SELECT
          ROUND(
            100.0 * (
              pg_relation_size($1::regclass) -
              pg_relation_size($1::regclass, 'main')
            ) / NULLIF(pg_relation_size($1::regclass), 0),
            2
          ) as fragmentation
      `,
        [indexName]
      );

      if (result.rows.length > 0) {
        return parseFloat(result.rows[0].fragmentation) || 0;
      }
      return 0;
    } catch (error) {
      this.logger.warn('Error calculating fragmentation:', error);
      return 0;
    }
  }
}

export default IndexManager;
