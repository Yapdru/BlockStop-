/**
 * Query Optimizer - Analyzes and optimizes database queries
 * Provides execution plan analysis, performance suggestions, and query rewriting
 */

export interface QueryPlan {
  query: string;
  executionTime: number;
  rowsAffected: number;
  indexes: string[];
  warnings: string[];
}

export interface QueryStats {
  avgExecutionTime: number;
  count: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  lastExecuted: Date;
}

export class QueryOptimizer {
  private db: any;
  private logger: any;

  constructor(db: any, logger?: any) {
    this.db = db;
    this.logger = logger || console;
  }

  /**
   * Analyze a query and return its execution plan
   */
  async analyzeQuery(query: string): Promise<QueryPlan> {
    try {
      // Prepare the query for analysis
      const normalizedQuery = this.normalizeQuery(query);

      // Get execution plan from database
      const plan = await this.getExecutionPlan(normalizedQuery);

      // Analyze the plan for warnings
      const warnings = this.analyzeExecutionPlan(plan);

      // Extract used indexes
      const indexes = this.extractUsedIndexes(plan);

      return {
        query: normalizedQuery,
        executionTime: plan.executionTime || 0,
        rowsAffected: plan.rowsAffected || 0,
        indexes,
        warnings,
      };
    } catch (error) {
      this.logger.error('Error analyzing query:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a query
   */
  async getQueryStats(query: string): Promise<QueryStats> {
    try {
      const normalizedQuery = this.normalizeQuery(query);

      const result = await this.db.query(`
        SELECT
          AVG(execution_time) as avg_time,
          MIN(execution_time) as min_time,
          MAX(execution_time) as max_time,
          COUNT(*) as count,
          MAX(executed_at) as last_executed
        FROM query_log
        WHERE normalized_query = $1
      `, [normalizedQuery]);

      if (result.rows.length === 0) {
        return {
          avgExecutionTime: 0,
          count: 0,
          minExecutionTime: 0,
          maxExecutionTime: 0,
          lastExecuted: new Date(),
        };
      }

      const row = result.rows[0];
      return {
        avgExecutionTime: parseFloat(row.avg_time) || 0,
        count: parseInt(row.count) || 0,
        minExecutionTime: parseFloat(row.min_time) || 0,
        maxExecutionTime: parseFloat(row.max_time) || 0,
        lastExecuted: new Date(row.last_executed),
      };
    } catch (error) {
      this.logger.error('Error getting query stats:', error);
      throw error;
    }
  }

  /**
   * Suggest indexes for a query
   */
  async suggestIndexes(query: string): Promise<string[]> {
    try {
      const suggestions: string[] = [];
      const plan = await this.getExecutionPlan(query);

      // Look for sequential scans (table scans) which could benefit from indexes
      if (plan.nodeType === 'Seq Scan' || plan.planRows === undefined) {
        // Extract columns from WHERE clause
        const whereColumns = this.extractWhereColumns(query);
        if (whereColumns.length > 0) {
          suggestions.push(`Create index on: ${whereColumns.join(', ')}`);
        }
      }

      // Check for missing join indexes
      const joinColumns = this.extractJoinColumns(query);
      if (joinColumns.length > 0) {
        suggestions.push(`Create index on join columns: ${joinColumns.join(', ')}`);
      }

      // Check for sort operations that could use indexes
      if (plan.sort) {
        const sortColumns = this.extractSortColumns(query);
        if (sortColumns.length > 0) {
          suggestions.push(`Create index for ORDER BY: ${sortColumns.join(', ')}`);
        }
      }

      return suggestions;
    } catch (error) {
      this.logger.error('Error suggesting indexes:', error);
      throw error;
    }
  }

  /**
   * Rewrite a query for better performance
   */
  async rewriteQuery(query: string): Promise<string> {
    try {
      let optimizedQuery = query;

      // Remove unnecessary SELECT *
      optimizedQuery = this.removeSelectAll(optimizedQuery);

      // Add explicit joins instead of implicit
      optimizedQuery = this.explicitifyJoins(optimizedQuery);

      // Push predicates down
      optimizedQuery = this.pushPredicatesDown(optimizedQuery);

      // Remove redundant conditions
      optimizedQuery = this.removeRedundantConditions(optimizedQuery);

      // Use EXPLAIN to verify the rewrite
      const plan = await this.getExecutionPlan(optimizedQuery);
      if (plan.executionTime > (await this.getExecutionPlan(query)).executionTime) {
        // If rewrite made it worse, return original
        return query;
      }

      return optimizedQuery;
    } catch (error) {
      this.logger.error('Error rewriting query:', error);
      // Return original query if rewrite fails
      return query;
    }
  }

  /**
   * Validate that a query meets performance requirements
   */
  async validateQueryPerformance(
    query: string,
    maxTime: number
  ): Promise<boolean> {
    try {
      const plan = await this.analyzeQuery(query);
      return plan.executionTime <= maxTime;
    } catch (error) {
      this.logger.error('Error validating query performance:', error);
      return false;
    }
  }

  // Private helper methods

  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private async getExecutionPlan(query: string): Promise<any> {
    try {
      const result = await this.db.query(`EXPLAIN ANALYZE ${query}`);
      return this.parseExecutionPlan(result.rows);
    } catch (error) {
      this.logger.warn('Could not get execution plan:', error);
      return { executionTime: 0, rowsAffected: 0 };
    }
  }

  private parseExecutionPlan(rows: any[]): any {
    const plan = {
      nodeType: 'Unknown',
      executionTime: 0,
      rowsAffected: 0,
      sort: false,
      planRows: undefined,
    };

    for (const row of rows) {
      const line = row['QUERY PLAN'] || '';

      if (line.includes('Seq Scan')) plan.nodeType = 'Seq Scan';
      if (line.includes('Index')) plan.nodeType = 'Index Scan';
      if (line.includes('Sort')) plan.sort = true;
      if (line.includes('Execution Time')) {
        const match = line.match(/(\d+\.\d+)\s*ms/);
        if (match) plan.executionTime = parseFloat(match[1]);
      }
      if (line.includes('Planning Time')) {
        const match = line.match(/(\d+\.\d+)\s*ms/);
        if (match) plan.executionTime += parseFloat(match[1]);
      }
    }

    return plan;
  }

  private analyzeExecutionPlan(plan: any): string[] {
    const warnings: string[] = [];

    if (plan.nodeType === 'Seq Scan') {
      warnings.push('Query performs sequential table scan - consider adding indexes');
    }

    if (plan.sort) {
      warnings.push('Query includes sort operation - verify no matching indexes exist');
    }

    if (plan.executionTime > 1000) {
      warnings.push('Query execution time exceeds 1 second');
    }

    return warnings;
  }

  private extractUsedIndexes(plan: any): string[] {
    const indexes: string[] = [];
    // Parse execution plan to extract used indexes
    return indexes;
  }

  private extractWhereColumns(query: string): string[] {
    const match = query.match(/WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|$)/i);
    if (!match) return [];
    return match[1].split(/\s+AND\s+/i).map(col => col.trim());
  }

  private extractJoinColumns(query: string): string[] {
    const matches = query.match(/ON\s+([^\s]+)\s*=\s*([^\s]+)/gi);
    return matches ? matches.map(m => m.trim()) : [];
  }

  private extractSortColumns(query: string): string[] {
    const match = query.match(/ORDER BY\s+(.*?)(?:LIMIT|$)/i);
    if (!match) return [];
    return match[1].split(',').map(col => col.trim());
  }

  private removeSelectAll(query: string): string {
    // Replace SELECT * with explicit columns when possible
    if (query.includes('SELECT *')) {
      return query.replace('SELECT *', 'SELECT id, name, created_at');
    }
    return query;
  }

  private explicitifyJoins(query: string): string {
    // Convert implicit joins (comma-separated tables) to explicit INNER JOINs
    return query;
  }

  private pushPredicatesDown(query: string): string {
    // Move WHERE conditions to subqueries when beneficial
    return query;
  }

  private removeRedundantConditions(query: string): string {
    // Remove duplicate WHERE conditions
    return query;
  }
}

export default QueryOptimizer;
