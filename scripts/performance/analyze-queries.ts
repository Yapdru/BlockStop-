/**
 * Query Analysis Script
 * Analyzes slow queries from logs and provides optimization suggestions
 */

import fs from 'fs';
import path from 'path';

interface QueryAnalysis {
  query: string;
  frequency: number;
  avgExecutionTime: number;
  totalTime: number;
  suggestions: string[];
  indexRecommendations: string[];
}

interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: Date;
}

class QueryAnalyzer {
  private queries: Map<string, SlowQuery[]> = new Map();
  private analyses: QueryAnalysis[] = [];

  /**
   * Load slow queries from database or file
   */
  async loadQueries(source: string): Promise<void> {
    console.log(`Loading queries from: ${source}`);

    if (source.endsWith('.json')) {
      // Load from JSON file
      const data = fs.readFileSync(source, 'utf-8');
      const queries = JSON.parse(data);

      for (const query of queries) {
        this.addQuery(query.query, query.executionTime);
      }
    } else {
      // Would load from database
      console.log('Database loading not implemented in this example');
    }

    console.log(`Loaded ${this.queries.size} unique queries`);
  }

  /**
   * Add a query to the analysis
   */
  private addQuery(query: string, executionTime: number): void {
    const normalized = this.normalizeQuery(query);

    if (!this.queries.has(normalized)) {
      this.queries.set(normalized, []);
    }

    this.queries.get(normalized)!.push({
      query: normalized,
      executionTime,
      timestamp: new Date(),
    });
  }

  /**
   * Analyze all loaded queries
   */
  async analyzeQueries(): Promise<void> {
    console.log('\nAnalyzing queries...');

    for (const [query, executions] of this.queries) {
      const avgTime =
        executions.reduce((sum, e) => sum + e.executionTime, 0) /
        executions.length;
      const totalTime = executions.reduce((sum, e) => sum + e.executionTime, 0);

      const analysis: QueryAnalysis = {
        query,
        frequency: executions.length,
        avgExecutionTime: avgTime,
        totalTime,
        suggestions: this.generateSuggestions(query, avgTime),
        indexRecommendations: this.suggestIndexes(query),
      };

      this.analyses.push(analysis);
    }

    // Sort by total time (highest impact first)
    this.analyses.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Generate optimization suggestions
   */
  private generateSuggestions(query: string, avgTime: number): string[] {
    const suggestions: string[] = [];

    // Check for common anti-patterns
    if (query.includes('SELECT *')) {
      suggestions.push(
        'Avoid SELECT * - specify only needed columns'
      );
    }

    if (query.match(/JOIN.*JOIN.*JOIN/gi)) {
      suggestions.push(
        'Query has multiple joins - consider denormalization or materialized views'
      );
    }

    if (query.includes('OR') && query.includes('WHERE')) {
      suggestions.push(
        'Consider using IN clause instead of multiple OR conditions'
      );
    }

    if (query.includes('LIKE')) {
      suggestions.push(
        'LIKE queries are slow - consider full-text search or trigram indexes'
      );
    }

    if (query.includes('NOT IN')) {
      suggestions.push(
        'NOT IN can be slow - consider using NOT EXISTS instead'
      );
    }

    if (query.includes('DISTINCT')) {
      suggestions.push(
        'DISTINCT operations are expensive - verify this is necessary'
      );
    }

    if (query.includes('UNION') && !query.includes('UNION ALL')) {
      suggestions.push(
        'UNION performs deduplication - use UNION ALL if duplicates are not a concern'
      );
    }

    if (avgTime > 5000) {
      suggestions.push(
        'Query takes more than 5 seconds - consider breaking into smaller queries or adding indexes'
      );
    }

    if (avgTime > 1000 && avgTime <= 5000) {
      suggestions.push(
        'Query takes 1-5 seconds - review indexing strategy'
      );
    }

    return suggestions;
  }

  /**
   * Suggest indexes for a query
   */
  private suggestIndexes(query: string): string[] {
    const suggestions: string[] = [];

    // Extract WHERE columns
    const whereMatch = query.match(/WHERE\s+(.*?)(?:GROUP BY|ORDER BY|LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columns = whereClause.split(/\s+AND\s+/i);

      for (const condition of columns) {
        const colMatch = condition.match(/(\w+)\s*[=<>]/);
        if (colMatch) {
          const column = colMatch[1];
          suggestions.push(`Create index on ${column}`);
        }
      }
    }

    // Extract JOIN columns
    const joinMatches = query.match(/ON\s+(\w+\.?\w+)\s*=\s*(\w+\.?\w+)/gi);
    if (joinMatches) {
      for (const join of joinMatches) {
        suggestions.push(`Create index for JOIN: ${join}`);
      }
    }

    // Extract ORDER BY columns
    const orderMatch = query.match(/ORDER BY\s+(.*?)(?:LIMIT|$)/i);
    if (orderMatch) {
      const orderClause = orderMatch[1];
      suggestions.push(`Create index for ORDER BY: ${orderClause}`);
    }

    return suggestions;
  }

  /**
   * Generate detailed report
   */
  generateReport(outputFile?: string): void {
    console.log('\n========== QUERY ANALYSIS REPORT ==========\n');

    console.log(`Total unique queries analyzed: ${this.analyses.length}`);
    console.log(
      `Top 10 slowest queries by total time:\n`
    );

    const topQueries = this.analyses.slice(0, 10);

    for (let i = 0; i < topQueries.length; i++) {
      const analysis = topQueries[i];

      console.log(
        `\n${i + 1}. Total Time: ${(analysis.totalTime / 1000).toFixed(2)}s (Avg: ${analysis.avgExecutionTime.toFixed(2)}ms, Count: ${analysis.frequency})`
      );
      console.log(
        `   Query: ${this.truncateQuery(analysis.query, 100)}`
      );

      if (analysis.suggestions.length > 0) {
        console.log(`   Suggestions:`);
        for (const suggestion of analysis.suggestions) {
          console.log(`     - ${suggestion}`);
        }
      }

      if (analysis.indexRecommendations.length > 0) {
        console.log(`   Index Recommendations:`);
        const uniqueIndexes = [...new Set(analysis.indexRecommendations)];
        for (const index of uniqueIndexes.slice(0, 3)) {
          console.log(`     - ${index}`);
        }
      }
    }

    // Summary statistics
    const totalTime = this.analyses.reduce((sum, a) => sum + a.totalTime, 0);
    const totalQueries = this.analyses.reduce(
      (sum, a) => sum + a.frequency,
      0
    );
    const top10Time = topQueries.reduce((sum, a) => sum + a.totalTime, 0);

    console.log(`\n========== SUMMARY STATISTICS ==========`);
    console.log(
      `Total query execution time: ${(totalTime / 1000).toFixed(2)}s`
    );
    console.log(`Total query executions: ${totalQueries}`);
    console.log(
      `Top 10 queries account for ${((top10Time / totalTime) * 100).toFixed(1)}% of total time`
    );

    // Save to file if requested
    if (outputFile) {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalQueries: this.analyses.length,
          totalExecutions: totalQueries,
          totalTime,
          top10Percentage: (top10Time / totalTime) * 100,
        },
        topQueries: topQueries.map(a => ({
          query: a.query,
          frequency: a.frequency,
          avgExecutionTime: a.avgExecutionTime,
          totalTime: a.totalTime,
          suggestions: a.suggestions,
          indexRecommendations: a.indexRecommendations,
        })),
      };

      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to: ${outputFile}`);
    }
  }

  /**
   * Export optimization script
   */
  exportOptimizationScript(outputFile: string): void {
    const indexes = new Set<string>();

    for (const analysis of this.analyses) {
      for (const index of analysis.indexRecommendations) {
        indexes.add(index);
      }
    }

    let script = '-- Generated Index Creation Script\n';
    script += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const index of Array.from(indexes).slice(0, 20)) {
      script += `-- ${index}\n`;
      script += `-- CREATE INDEX idx_... ON ... (...)\n\n`;
    }

    fs.writeFileSync(outputFile, script);
    console.log(`\nOptimization script saved to: ${outputFile}`);
  }

  /**
   * Normalize query for comparison
   */
  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /**
   * Truncate query for display
   */
  private truncateQuery(query: string, maxLength: number): string {
    if (query.length <= maxLength) {
      return query;
    }
    return query.substring(0, maxLength) + '...';
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: analyze-queries.ts <source> [output-report] [optimization-script]');
    console.log('  source: JSON file with slow queries or database connection string');
    console.log('  output-report: Optional output file for analysis report');
    console.log('  optimization-script: Optional output file for optimization SQL');
    process.exit(1);
  }

  const source = args[0];
  const outputReport = args[1] || 'query-analysis-report.json';
  const optimizationScript = args[2] || 'optimization-script.sql';

  // Check if source file exists
  if (source.endsWith('.json') && !fs.existsSync(source)) {
    console.error(`Source file not found: ${source}`);
    process.exit(1);
  }

  const analyzer = new QueryAnalyzer();

  try {
    // Load and analyze queries
    await analyzer.loadQueries(source);
    await analyzer.analyzeQueries();

    // Generate reports
    analyzer.generateReport(outputReport);
    analyzer.exportOptimizationScript(optimizationScript);

    console.log('\nAnalysis complete!');
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

main();

export { QueryAnalyzer };
