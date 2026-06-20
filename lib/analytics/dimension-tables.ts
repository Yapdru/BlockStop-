import { query } from '@/lib/db';

export interface ColumnDefinition {
  name: string;
  type: string;
}

export class DimensionTables {
  /**
   * Create a new dimension table
   */
  async createDimension(
    name: string,
    columns: ColumnDefinition[]
  ): Promise<void> {
    try {
      const columnDefs = columns
        .map((col) => `${col.name} ${col.type}`)
        .join(', ');

      const createSQL = `
        CREATE TABLE IF NOT EXISTS ${name} (
          id SERIAL PRIMARY KEY,
          ${columnDefs},
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          is_current BOOLEAN DEFAULT TRUE
        )
      `;

      await query(createSQL, []);

      // Create index on key columns for fast lookups
      if (columns.length > 0) {
        const keyColumn = columns[0].name;
        await query(
          `CREATE INDEX IF NOT EXISTS idx_${name}_${keyColumn} ON ${name}(${keyColumn})`,
          []
        );
      }

      // Create index on is_current for SCD Type 2
      await query(
        `CREATE INDEX IF NOT EXISTS idx_${name}_is_current ON ${name}(is_current)`,
        []
      );

      console.log(`Dimension table ${name} created successfully`);
    } catch (error) {
      console.error('Dimension creation error:', error);
      throw error;
    }
  }

  /**
   * Insert a dimension member
   */
  async insertDimension(tableName: string, data: Record<string, any>): Promise<number> {
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
      console.error('Dimension insertion error:', error);
      throw error;
    }
  }

  /**
   * Lookup a dimension member
   */
  async lookupDimension(dimensionName: string, key: any): Promise<any> {
    try {
      const result = await query(
        `SELECT * FROM ${dimensionName}
         WHERE id = $1 AND is_current = TRUE
         LIMIT 1`,
        [key]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Dimension lookup error:', error);
      return null;
    }
  }

  /**
   * Get slowly changing dimension (SCD Type 2)
   * Returns the version of a dimension valid as of a specific date
   */
  async getSlowlyChangingDimension(
    dimensionName: string,
    key: any,
    asOfDate: Date
  ): Promise<any> {
    try {
      const result = await query(
        `SELECT * FROM ${dimensionName}
         WHERE id = $1 AND created_at <= $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [key, asOfDate]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('SCD lookup error:', error);
      return null;
    }
  }

  /**
   * Update a dimension member (SCD Type 2)
   * Mark old record as historical and insert new record
   */
  async updateSlowlyChangingDimension(
    dimensionName: string,
    key: any,
    newData: Record<string, any>
  ): Promise<void> {
    try {
      // Mark old record as historical
      await query(
        `UPDATE ${dimensionName}
         SET is_current = FALSE, updated_at = NOW()
         WHERE id = $1 AND is_current = TRUE`,
        [key]
      );

      // Insert new version
      const columns = Object.keys(newData);
      const values = Object.values(newData);
      columns.push('id');
      values.push(key);

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      await query(
        `INSERT INTO ${dimensionName} (${columns.join(', ')}, created_at, is_current)
         VALUES (${placeholders}, NOW(), TRUE)`,
        values
      );
    } catch (error) {
      console.error('SCD update error:', error);
      throw error;
    }
  }

  /**
   * Get dimension history
   */
  async getDimensionHistory(
    dimensionName: string,
    key: any
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM ${dimensionName}
         WHERE id = $1
         ORDER BY created_at DESC`,
        [key]
      );

      return result.rows || [];
    } catch (error) {
      console.error('Dimension history retrieval error:', error);
      return [];
    }
  }

  /**
   * Get all current dimension members
   */
  async getCurrentDimension(dimensionName: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM ${dimensionName}
         WHERE is_current = TRUE
         ORDER BY created_at DESC`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Current dimension retrieval error:', error);
      return [];
    }
  }

  /**
   * Bulk upsert dimension members
   */
  async bulkUpsertDimension(
    dimensionName: string,
    data: Record<string, any>[]
  ): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    try {
      let totalUpserted = 0;

      for (const record of data) {
        const columns = Object.keys(record);
        const values = Object.values(record);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const result = await query(
          `INSERT INTO ${dimensionName} (${columns.join(', ')}, created_at, updated_at)
           VALUES (${placeholders}, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
          values
        );

        totalUpserted += result.rowCount || 0;
      }

      return totalUpserted;
    } catch (error) {
      console.error('Bulk upsert error:', error);
      throw error;
    }
  }

  /**
   * Get dimension member count
   */
  async getDimensionSize(dimensionName: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM ${dimensionName}
         WHERE is_current = TRUE`,
        []
      );

      return result.rows[0]?.count || 0;
    } catch (error) {
      console.error('Dimension size retrieval error:', error);
      return 0;
    }
  }

  /**
   * Get dimension statistics
   */
  async getDimensionStats(dimensionName: string): Promise<{
    totalMembers: number;
    currentMembers: number;
    historicalMembers: number;
    lastUpdate: Date | null;
  }> {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_members,
          SUM(CASE WHEN is_current = TRUE THEN 1 ELSE 0 END) as current_members,
          SUM(CASE WHEN is_current = FALSE THEN 1 ELSE 0 END) as historical_members,
          MAX(updated_at) as last_update
         FROM ${dimensionName}`,
        []
      );

      const stats = result.rows[0] || {};
      return {
        totalMembers: stats.total_members || 0,
        currentMembers: stats.current_members || 0,
        historicalMembers: stats.historical_members || 0,
        lastUpdate: stats.last_update ? new Date(stats.last_update) : null,
      };
    } catch (error) {
      console.error('Dimension stats retrieval error:', error);
      return {
        totalMembers: 0,
        currentMembers: 0,
        historicalMembers: 0,
        lastUpdate: null,
      };
    }
  }

  /**
   * Search dimension members
   */
  async searchDimensionMembers(
    dimensionName: string,
    searchField: string,
    searchValue: string
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT * FROM ${dimensionName}
         WHERE ${searchField} ILIKE $1 AND is_current = TRUE
         ORDER BY ${searchField}`,
        [`%${searchValue}%`]
      );

      return result.rows || [];
    } catch (error) {
      console.error('Dimension search error:', error);
      return [];
    }
  }

  /**
   * Create a dimension hierarchy
   */
  async createHierarchy(
    hierarchyName: string,
    parentTableName: string,
    childTableName: string
  ): Promise<void> {
    try {
      const createSQL = `
        CREATE TABLE IF NOT EXISTS ${hierarchyName} (
          id SERIAL PRIMARY KEY,
          parent_id INTEGER NOT NULL REFERENCES ${parentTableName}(id),
          child_id INTEGER NOT NULL REFERENCES ${childTableName}(id),
          hierarchy_level INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(parent_id, child_id)
        )
      `;

      await query(createSQL, []);

      // Create indexes for hierarchy traversal
      await query(
        `CREATE INDEX IF NOT EXISTS idx_${hierarchyName}_parent ON ${hierarchyName}(parent_id)`,
        []
      );
      await query(
        `CREATE INDEX IF NOT EXISTS idx_${hierarchyName}_child ON ${hierarchyName}(child_id)`,
        []
      );

      console.log(`Hierarchy ${hierarchyName} created successfully`);
    } catch (error) {
      console.error('Hierarchy creation error:', error);
      throw error;
    }
  }

  /**
   * Get dimension members by level in hierarchy
   */
  async getHierarchyLevel(
    hierarchyName: string,
    level: number
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT DISTINCT parent_id FROM ${hierarchyName}
         WHERE hierarchy_level = $1`,
        [level]
      );

      return result.rows || [];
    } catch (error) {
      console.error('Hierarchy level retrieval error:', error);
      return [];
    }
  }
}

export const dimensionTables = new DimensionTables();
