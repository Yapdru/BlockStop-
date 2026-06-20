import { query } from '@/lib/db';

export interface FactTableConfig {
  name: string;
  dimensions: string[];
  metrics: string[];
  partitionBy?: string;
}

export interface FactRecord {
  [key: string]: any;
}

export class FactTables {
  /**
   * Create a new fact table
   */
  async createFactTable(config: FactTableConfig): Promise<void> {
    try {
      // Build column definitions
      const dimensionCols = config.dimensions
        .map((dim) => `${dim} VARCHAR(255)`)
        .join(', ');
      const metricCols = config.metrics
        .map((metric) => `${metric} NUMERIC`)
        .join(', ');

      let createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${config.name} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ${dimensionCols},
          ${metricCols},
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      if (config.partitionBy) {
        createTableSQL += ` PARTITION BY RANGE (${config.partitionBy})`;
      }

      await query(createTableSQL, []);

      // Create indexes on dimensions for query performance
      for (const dimension of config.dimensions) {
        await query(
          `CREATE INDEX IF NOT EXISTS idx_${config.name}_${dimension} ON ${config.name}(${dimension})`,
          []
        );
      }

      // Create index on created_at for time-based queries
      await query(
        `CREATE INDEX IF NOT EXISTS idx_${config.name}_created_at ON ${config.name}(created_at DESC)`,
        []
      );

      console.log(`Fact table ${config.name} created successfully`);
    } catch (error) {
      console.error('Fact table creation error:', error);
      throw error;
    }
  }

  /**
   * Insert a single fact record
   */
  async insertFact(tableName: string, data: FactRecord): Promise<number> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      const result = await query(
        `INSERT INTO ${tableName} (${columns.join(', ')}, created_at)
         VALUES (${placeholders}, NOW())`,
        values
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Fact insertion error:', error);
      throw error;
    }
  }

  /**
   * Bulk insert multiple fact records
   */
  async bulkInsert(tableName: string, data: FactRecord[]): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    try {
      let totalInserted = 0;

      // Get column names from first record
      const columns = Object.keys(data[0]);

      // Insert in batches to avoid query size limits
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const values: any[] = [];
        let paramIndex = 1;
        let valuesSql = '';

        for (const record of batch) {
          const recordValues = columns.map((col) => record[col]);
          values.push(...recordValues);

          const placeholders = columns
            .map(() => `$${paramIndex++}`)
            .join(', ');

          if (valuesSql) {
            valuesSql += ', ';
          }
          valuesSql += `(${placeholders})`;
        }

        const result = await query(
          `INSERT INTO ${tableName} (${columns.join(', ')}, created_at)
           VALUES ${valuesSql}, (${columns
            .map(() => 'NOW()')
            .join(', ')})`,
          values
        );

        totalInserted += result.rowCount || 0;
      }

      return totalInserted;
    } catch (error) {
      console.error('Bulk insert error:', error);
      throw error;
    }
  }

  /**
   * Get metrics for a fact table
   */
  async getFactMetrics(tableName: string): Promise<any> {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_records,
          COUNT(DISTINCT created_at::date) as days_with_data,
          MIN(created_at) as earliest_record,
          MAX(created_at) as latest_record,
          (SELECT pg_size_pretty(pg_total_relation_size('${tableName}'))) as table_size
         FROM ${tableName}`,
        []
      );

      return result.rows[0] || {};
    } catch (error) {
      console.error('Fact metrics retrieval error:', error);
      throw error;
    }
  }

  /**
   * Partition a fact table
   */
  async partitionTable(tableName: string, column: string): Promise<void> {
    try {
      // Create partitions by date range
      const dates = await query(
        `SELECT MIN(${column}) as min_date, MAX(${column}) as max_date FROM ${tableName}`,
        []
      );

      if (dates.rows.length === 0) {
        return;
      }

      const minDate = new Date(dates.rows[0].min_date);
      const maxDate = new Date(dates.rows[0].max_date);

      // Create monthly partitions
      for (
        let d = new Date(minDate);
        d <= maxDate;
        d.setMonth(d.getMonth() + 1)
      ) {
        const monthStart = d.toISOString().split('T')[0];
        const nextMonth = new Date(d);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().split('T')[0];

        const partitionName = `${tableName}_${d.getFullYear()}_${String(
          d.getMonth() + 1
        ).padStart(2, '0')}`;

        try {
          await query(
            `CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF ${tableName}
             FOR VALUES FROM ('${monthStart}') TO ('${monthEnd}')`,
            []
          );
        } catch (error) {
          // Partition might already exist
          console.debug(`Partition ${partitionName} may already exist`);
        }
      }

      console.log(`Table ${tableName} partitioned successfully`);
    } catch (error) {
      console.error('Table partitioning error:', error);
      throw error;
    }
  }

  /**
   * Get fact table statistics
   */
  async getTableStats(tableName: string): Promise<{
    rowCount: number;
    sizeBytes: number;
    indexSizeBytes: number;
    lastVacuumed?: Date;
    lastAnalyzed?: Date;
  }> {
    try {
      const result = await query(
        `SELECT
          n_live_tup as row_count,
          pg_total_relation_size('${tableName}') as size_bytes,
          pg_indexes_size('${tableName}') as index_size_bytes,
          last_vacuum,
          last_analyze
         FROM pg_stat_user_tables
         WHERE relname = $1`,
        [tableName]
      );

      if (result.rows.length === 0) {
        return {
          rowCount: 0,
          sizeBytes: 0,
          indexSizeBytes: 0,
        };
      }

      const row = result.rows[0];
      return {
        rowCount: row.row_count || 0,
        sizeBytes: row.size_bytes || 0,
        indexSizeBytes: row.index_size_bytes || 0,
        lastVacuumed: row.last_vacuum ? new Date(row.last_vacuum) : undefined,
        lastAnalyzed: row.last_analyze ? new Date(row.last_analyze) : undefined,
      };
    } catch (error) {
      console.error('Table stats retrieval error:', error);
      return {
        rowCount: 0,
        sizeBytes: 0,
        indexSizeBytes: 0,
      };
    }
  }

  /**
   * Compact fact table to reclaim space
   */
  async compactTable(tableName: string): Promise<void> {
    try {
      // Vacuum and analyze the table
      await query(`VACUUM ANALYZE ${tableName}`, []);
      console.log(`Table ${tableName} compacted successfully`);
    } catch (error) {
      console.error('Table compaction error:', error);
      throw error;
    }
  }

  /**
   * Archive old fact data
   */
  async archiveOldData(
    tableName: string,
    archiveTable: string,
    beforeDate: Date
  ): Promise<number> {
    try {
      // Copy old data to archive table
      const copyResult = await query(
        `INSERT INTO ${archiveTable}
         SELECT * FROM ${tableName}
         WHERE created_at < $1`,
        [beforeDate]
      );

      // Delete from main table
      const deleteResult = await query(
        `DELETE FROM ${tableName}
         WHERE created_at < $1`,
        [beforeDate]
      );

      return deleteResult.rowCount || 0;
    } catch (error) {
      console.error('Data archival error:', error);
      throw error;
    }
  }

  /**
   * Get dimension cardinality
   */
  async getDimensionCardinality(
    tableName: string,
    dimensionColumn: string
  ): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(DISTINCT ${dimensionColumn}) as cardinality FROM ${tableName}`,
        []
      );

      return result.rows[0]?.cardinality || 0;
    } catch (error) {
      console.error('Cardinality calculation error:', error);
      return 0;
    }
  }
}

export const factTables = new FactTables();
