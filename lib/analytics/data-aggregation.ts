import { query } from '@/lib/db';

export class DataAggregation {
  /**
   * Aggregate data by day
   */
  async aggregateDaily(tableName: string, targetTable: string): Promise<number> {
    try {
      const result = await query(
        `INSERT INTO ${targetTable} (date, metric_count, metric_sum, metric_avg, created_at)
         SELECT DATE(created_at) as date,
                COUNT(*) as metric_count,
                SUM(COALESCE(value, 0)) as metric_sum,
                AVG(COALESCE(value, 0)) as metric_avg,
                NOW()
         FROM ${tableName}
         GROUP BY DATE(created_at)`,
        []
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('Daily aggregation error:', error);
      throw error;
    }
  }

  /**
   * Aggregate data by hour
   */
  async aggregateHourly(tableName: string, targetTable: string): Promise<number> {
    try {
      const result = await query(
        `INSERT INTO ${targetTable} (hour, metric_count, metric_sum, metric_avg, created_at)
         SELECT DATE_TRUNC('hour', created_at) as hour,
                COUNT(*) as metric_count,
                SUM(COALESCE(value, 0)) as metric_sum,
                AVG(COALESCE(value, 0)) as metric_avg,
                NOW()
         FROM ${tableName}
         GROUP BY DATE_TRUNC('hour', created_at)`,
        []
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('Hourly aggregation error:', error);
      throw error;
    }
  }

  /**
   * Aggregate data by month
   */
  async aggregateMonthly(tableName: string, targetTable: string): Promise<number> {
    try {
      const result = await query(
        `INSERT INTO ${targetTable} (month, metric_count, metric_sum, metric_avg, created_at)
         SELECT DATE_TRUNC('month', created_at) as month,
                COUNT(*) as metric_count,
                SUM(COALESCE(value, 0)) as metric_sum,
                AVG(COALESCE(value, 0)) as metric_avg,
                NOW()
         FROM ${tableName}
         GROUP BY DATE_TRUNC('month', created_at)`,
        []
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('Monthly aggregation error:', error);
      throw error;
    }
  }

  /**
   * Perform a rollup operation
   * Groups data across multiple dimensions with all combinations
   */
  async rollup(dimensions: string[], metrics: string[]): Promise<any[]> {
    try {
      const dimensionList = dimensions.join(', ');
      const metricAggregations = metrics
        .map((metric) => `SUM(COALESCE(${metric}, 0)) as ${metric}_sum`)
        .join(', ');

      // Get unique combinations
      const result = await query(
        `SELECT ${dimensionList}, ${metricAggregations}
         FROM fact_table
         GROUP BY ${dimensionList}
         ORDER BY ${dimensionList}`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Rollup error:', error);
      throw error;
    }
  }

  /**
   * Perform a cube operation
   * Similar to rollup but includes all combinations of groupings
   */
  async cube(dimensions: string[], metrics: string[]): Promise<any[]> {
    try {
      const dimensionList = dimensions.join(', ');
      const metricAggregations = metrics
        .map((metric) => `SUM(COALESCE(${metric}, 0)) as ${metric}_sum`)
        .join(', ');

      // PostgreSQL CUBE operator creates all combinations
      const result = await query(
        `SELECT ${dimensionList}, ${metricAggregations}
         FROM fact_table
         GROUP BY CUBE (${dimensionList})
         ORDER BY ${dimensionList}`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Cube error:', error);
      throw error;
    }
  }

  /**
   * Calculate running totals
   */
  async calculateRunningTotal(
    tableName: string,
    metric: string,
    orderByColumn: string
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT *,
                SUM(${metric}) OVER (ORDER BY ${orderByColumn}) as running_total
         FROM ${tableName}
         ORDER BY ${orderByColumn}`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Running total calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate moving averages
   */
  async calculateMovingAverage(
    tableName: string,
    metric: string,
    windowSize: number,
    orderByColumn: string
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT *,
                AVG(${metric}) OVER (ORDER BY ${orderByColumn} ROWS BETWEEN ${windowSize - 1} PRECEDING AND CURRENT ROW) as moving_avg
         FROM ${tableName}
         ORDER BY ${orderByColumn}`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Moving average calculation error:', error);
      throw error;
    }
  }

  /**
   * Perform year-over-year comparison
   */
  async yearOverYearComparison(
    tableName: string,
    metric: string,
    dimensionColumn: string
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT DATE_PART('month', created_at) as month,
                DATE_PART('year', created_at) as year,
                ${dimensionColumn},
                SUM(${metric}) as total_metric
         FROM ${tableName}
         GROUP BY month, year, ${dimensionColumn}
         ORDER BY month, year, ${dimensionColumn}`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Year-over-year comparison error:', error);
      throw error;
    }
  }

  /**
   * Calculate cohort analysis
   */
  async cohortAnalysis(
    tableName: string,
    cohortColumn: string,
    periodColumn: string = 'created_at'
  ): Promise<any[]> {
    try {
      const result = await query(
        `SELECT DATE_TRUNC('month', ${periodColumn}) as period,
                ${cohortColumn} as cohort,
                COUNT(*) as count
         FROM ${tableName}
         GROUP BY DATE_TRUNC('month', ${periodColumn}), ${cohortColumn}
         ORDER BY period, cohort`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Cohort analysis error:', error);
      throw error;
    }
  }

  /**
   * Get time-series data
   */
  async getTimeSeries(
    tableName: string,
    metric: string,
    timeInterval: 'hour' | 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const truncIntervals: { [key: string]: string } = {
      hour: 'hour',
      day: 'day',
      week: 'week',
      month: 'month',
    };

    try {
      const result = await query(
        `SELECT DATE_TRUNC('${truncIntervals[timeInterval]}', created_at) as time_bucket,
                SUM(COALESCE(${metric}, 0)) as metric_value,
                COUNT(*) as record_count
         FROM ${tableName}
         GROUP BY DATE_TRUNC('${truncIntervals[timeInterval]}', created_at)
         ORDER BY time_bucket`,
        []
      );

      return result.rows || [];
    } catch (error) {
      console.error('Time-series retrieval error:', error);
      throw error;
    }
  }

  /**
   * Get percentile analysis
   */
  async getPercentiles(
    tableName: string,
    metric: string,
    percentiles: number[] = [25, 50, 75, 90, 95, 99]
  ): Promise<any> {
    try {
      const percentileSelects = percentiles
        .map(
          (p) =>
            `PERCENTILE_CONT(${p / 100}) WITHIN GROUP (ORDER BY ${metric}) as p${p}`
        )
        .join(', ');

      const result = await query(
        `SELECT ${percentileSelects}
         FROM ${tableName}`,
        []
      );

      return result.rows[0] || {};
    } catch (error) {
      console.error('Percentile calculation error:', error);
      throw error;
    }
  }

  /**
   * Materialize an aggregation to improve query performance
   */
  async materializeView(viewName: string, query: string): Promise<void> {
    try {
      // Drop existing view if it exists
      await query(`DROP MATERIALIZED VIEW IF EXISTS ${viewName}`, []);

      // Create new materialized view
      await query(`CREATE MATERIALIZED VIEW ${viewName} AS ${query}`, []);

      // Create indexes on the view for performance
      await query(
        `CREATE INDEX idx_${viewName}_created_at ON ${viewName}(created_at DESC)`,
        []
      );
    } catch (error) {
      console.error('Materialized view creation error:', error);
      throw error;
    }
  }
}

export const dataAggregation = new DataAggregation();
