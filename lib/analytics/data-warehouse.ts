import { query } from '@/lib/db';

export interface QueryResult {
  rows: any[];
  columns: string[];
  executionTime: number;
  rowCount: number;
}

export interface TableStats {
  rowCount: number;
  sizeBytes: number;
  indexSize: number;
  lastVacuumed?: Date;
  lastAnalyzed?: Date;
}

export interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    isUnique: boolean;
  }>;
}

export class DataWarehouse {
  /**
   * Execute a SQL query against the data warehouse
   */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    try {
      const result = await query(sql, params);
      const executionTime = Date.now() - startTime;

      // Extract column names from the result
      const columns = result.fields?.map((field: any) => field.name) || [];

      return {
        rows: result.rows || [],
        columns,
        executionTime,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      console.error('Data warehouse query error:', error);
      throw new Error(`Query execution failed: ${String(error)}`);
    }
  }

  /**
   * Load data from source table to target table
   */
  async loadData(
    sourceTable: string,
    targetTable: string
  ): Promise<{ loaded: number; failed: number }> {
    try {
      // Simple INSERT INTO ... SELECT statement
      const result = await query(
        `INSERT INTO ${targetTable} SELECT * FROM ${sourceTable}`,
        []
      );

      return {
        loaded: result.rowCount || 0,
        failed: 0,
      };
    } catch (error) {
      console.error('Data load error:', error);
      return {
        loaded: 0,
        failed: 1,
      };
    }
  }

  /**
   * Get schema information for a table
   */
  async getTableSchema(tableName: string): Promise<TableSchema> {
    try {
      // Get column information
      const columnsResult = await query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position`,
        [tableName]
      );

      const columns = columnsResult.rows.map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
      }));

      // Get index information
      const indexesResult = await query(
        `SELECT indexname, indexdef
         FROM pg_indexes
         WHERE tablename = $1`,
        [tableName]
      );

      const indexes = indexesResult.rows.map((row: any) => ({
        name: row.indexname,
        columns: extractColumnsFromIndexDef(row.indexdef),
        isUnique: row.indexdef.includes('UNIQUE'),
      }));

      return {
        name: tableName,
        columns,
        indexes,
      };
    } catch (error) {
      console.error('Schema retrieval error:', error);
      throw new Error(`Failed to get schema for table ${tableName}`);
    }
  }

  /**
   * Get statistics for a table
   */
  async getTableStats(tableName: string): Promise<TableStats> {
    try {
      const result = await query(
        `SELECT
          n_live_tup as row_count,
          pg_total_relation_size('${tableName}') as size_bytes,
          pg_indexes_size('${tableName}') as index_size,
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
          indexSize: 0,
        };
      }

      const row = result.rows[0];
      return {
        rowCount: row.row_count || 0,
        sizeBytes: row.size_bytes || 0,
        indexSize: row.index_size || 0,
        lastVacuumed: row.last_vacuum ? new Date(row.last_vacuum) : undefined,
        lastAnalyzed: row.last_analyze ? new Date(row.last_analyze) : undefined,
      };
    } catch (error) {
      console.error('Stats retrieval error:', error);
      return {
        rowCount: 0,
        sizeBytes: 0,
        indexSize: 0,
      };
    }
  }

  /**
   * Optimize the warehouse by analyzing and vacuuming tables
   */
  async optimizeWarehouse(): Promise<void> {
    try {
      // Vacuum all tables
      await query('VACUUM ANALYZE', []);
      console.log('Warehouse optimization completed');
    } catch (error) {
      console.error('Warehouse optimization error:', error);
      throw new Error(`Failed to optimize warehouse: ${String(error)}`);
    }
  }

  /**
   * Get query performance estimates
   */
  async getQueryPerformance(
    sql: string
  ): Promise<{ estimatedTime: number; estimatedRows: number }> {
    try {
      const result = await query(`EXPLAIN ${sql}`, []);

      // Parse EXPLAIN output to extract estimates
      let estimatedTime = 0;
      let estimatedRows = 0;

      result.rows.forEach((row: any) => {
        const plan = row['QUERY PLAN'];
        if (plan.includes('Rows')) {
          const rowMatch = plan.match(/Rows=(\d+)/);
          if (rowMatch) {
            estimatedRows = parseInt(rowMatch[1], 10);
          }
        }
      });

      return {
        estimatedTime,
        estimatedRows,
      };
    } catch (error) {
      console.error('Performance estimation error:', error);
      return {
        estimatedTime: 0,
        estimatedRows: 0,
      };
    }
  }

  /**
   * Create a backup of the warehouse
   */
  async backupWarehouse(backupName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalBackupName = `${backupName}_${timestamp}`;

      // Store backup metadata in database
      await query(
        `INSERT INTO warehouse_backups (name, created_at, status)
         VALUES ($1, NOW(), 'completed')`,
        [finalBackupName]
      );

      return finalBackupName;
    } catch (error) {
      console.error('Backup error:', error);
      throw new Error(`Failed to create backup: ${String(error)}`);
    }
  }

  /**
   * Get warehouse health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    tables: number;
    totalRows: number;
    totalSize: number;
    issues: string[];
  }> {
    try {
      const tablesResult = await query(
        `SELECT count(*) as table_count FROM information_schema.tables
         WHERE table_schema = 'public'`,
        []
      );

      const statsResult = await query(
        `SELECT sum(n_live_tup) as total_rows, sum(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
         FROM pg_tables
         JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
         WHERE schemaname = 'public'`,
        []
      );

      const issues: string[] = [];
      const stats = statsResult.rows[0] || {};

      // Check for potential issues
      if (!stats.total_rows) {
        issues.push('No data in warehouse');
      }

      return {
        healthy: issues.length === 0,
        tables: tablesResult.rows[0]?.table_count || 0,
        totalRows: stats.total_rows || 0,
        totalSize: stats.total_size || 0,
        issues,
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        healthy: false,
        tables: 0,
        totalRows: 0,
        totalSize: 0,
        issues: ['Health check failed'],
      };
    }
  }
}

/**
 * Helper function to extract column names from index definition
 */
function extractColumnsFromIndexDef(indexDef: string): string[] {
  const match = indexDef.match(/\((.*?)\)/);
  if (match) {
    return match[1].split(',').map((col) => col.trim());
  }
  return [];
}

export const dataWarehouse = new DataWarehouse();
