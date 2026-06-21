/**
 * SaaS Metrics Calculator
 * Calculate key SaaS business metrics: MRR, ARR, CAC, LTV, Churn
 */

import { query } from '@/lib/db';

export interface SaaSMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  mrrGrowth: number; // Month-over-month growth percentage
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
  cacPaybackPeriod: number; // Months to recover CAC
  churnRate: number; // Monthly churn rate percentage
  annualChurnRate: number; // Annual churn rate percentage
  retentionRate: number; // Monthly retention rate percentage
  ndcExponent: number; // Net Dollar Churn Exponent
  grossMargin: number; // Percentage
  operatingMargin: number; // Percentage
  burnRate: number; // Monthly burn rate if not profitable
  runway: number; // Months of runway remaining
}

export interface CohortAnalysis {
  cohortMonth: string;
  totalUsersAtSignup: number;
  retentionByMonth: Array<{
    month: number;
    retainedUsers: number;
    retentionRate: number;
  }>;
  monthlyRevenueByMonth: Array<{
    month: number;
    revenue: number;
  }>;
}

export interface RevenueProjection {
  month: string;
  projectedMRR: number;
  projectedARR: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export class MetricsCalculator {
  /**
   * Calculate comprehensive SaaS metrics
   */
  async calculateSaaSMetrics(): Promise<SaaSMetrics> {
    try {
      // Get current month metrics
      const currentMetrics = await this.getCurrentMonthMetrics();
      // Get previous month metrics
      const previousMetrics = await this.getPreviousMonthMetrics();
      // Get user cohorts
      const cohorts = await this.getUserCohorts();
      // Get financial data
      const financials = await this.getFinancialData();

      const mrr = currentMetrics.mrr;
      const arr = mrr * 12;
      const mrrGrowth = previousMetrics.mrr > 0
        ? ((mrr - previousMetrics.mrr) / previousMetrics.mrr) * 100
        : 0;

      // Calculate CAC
      const cac = this.calculateCAC(financials.marketingSpend, currentMetrics.newCustomers);

      // Calculate LTV
      const ltv = this.calculateLTV(
        currentMetrics.averageMonthlyRevenue,
        currentMetrics.churnRate,
        financials.costOfGoodsSold
      );

      // Calculate CAC Payback Period
      const cacPaybackPeriod = cac > 0
        ? cac / (currentMetrics.averageMonthlyRevenue * (1 - (currentMetrics.churnRate / 100)))
        : 0;

      // Calculate churn rate
      const churnRate = currentMetrics.churnRate;
      const annualChurnRate = this.calculateAnnualChurnRate(churnRate);
      const retentionRate = 100 - churnRate;

      // Calculate Net Dollar Churn
      const ndcExponent = this.calculateNDCExponent(
        previousMetrics.mrr,
        currentMetrics.expansionRevenue,
        currentMetrics.churnedRevenue,
        currentMetrics.newMRR
      );

      // Calculate margins
      const grossMargin = (currentMetrics.mrr - financials.costOfGoodsSold) / currentMetrics.mrr * 100;
      const operatingMargin = (currentMetrics.mrr - financials.operatingExpenses) / currentMetrics.mrr * 100;

      // Calculate burn rate and runway
      const monthlyBurn = Math.max(0, financials.operatingExpenses - currentMetrics.mrr);
      const runway = financials.cashReserves > 0 ? financials.cashReserves / monthlyBurn : Infinity;

      return {
        mrr: parseFloat(mrr.toFixed(2)),
        arr: parseFloat(arr.toFixed(2)),
        mrrGrowth: parseFloat(mrrGrowth.toFixed(2)),
        cac: parseFloat(cac.toFixed(2)),
        ltv: parseFloat(ltv.toFixed(2)),
        cacPaybackPeriod: parseFloat(cacPaybackPeriod.toFixed(2)),
        churnRate: parseFloat(churnRate.toFixed(2)),
        annualChurnRate: parseFloat(annualChurnRate.toFixed(2)),
        retentionRate: parseFloat(retentionRate.toFixed(2)),
        ndcExponent: parseFloat(ndcExponent.toFixed(2)),
        grossMargin: parseFloat(grossMargin.toFixed(2)),
        operatingMargin: parseFloat(operatingMargin.toFixed(2)),
        burnRate: parseFloat(monthlyBurn.toFixed(2)),
        runway: parseFloat(runway.toFixed(2)),
      };
    } catch (error) {
      throw new Error(`Failed to calculate SaaS metrics: ${error}`);
    }
  }

  /**
   * Get current month metrics
   */
  private async getCurrentMonthMetrics(): Promise<any> {
    const result = await query(
      `SELECT
        COALESCE(SUM(s.monthly_amount), 0) as mrr,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN u.id END) as active_customers,
        COUNT(DISTINCT CASE WHEN u.created_at >= DATE_TRUNC('month', NOW()) THEN u.id END) as new_customers,
        COALESCE(AVG(s.monthly_amount), 0) as avg_monthly_revenue,
        COALESCE(SUM(CASE WHEN s.status = 'active' AND s.monthly_amount > (
          SELECT COALESCE(AVG(monthly_amount), 0)
          FROM subscriptions
          WHERE status = 'active'
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        ) THEN (s.monthly_amount - (
          SELECT COALESCE(AVG(monthly_amount), 0)
          FROM subscriptions
          WHERE status = 'active'
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        )) ELSE 0 END), 0) as expansion_revenue,
        COUNT(DISTINCT CASE WHEN s.status = 'cancelled' AND s.updated_at >= DATE_TRUNC('month', NOW()) THEN u.id END) as churned_customers,
        COALESCE(SUM(CASE WHEN s.status = 'cancelled' AND s.updated_at >= DATE_TRUNC('month', NOW()) THEN s.monthly_amount ELSE 0 END), 0) as churned_revenue,
        COALESCE(SUM(CASE WHEN u.created_at >= DATE_TRUNC('month', NOW()) THEN s.monthly_amount ELSE 0 END), 0) as new_mrr
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE DATE_TRUNC('month', u.created_at) = DATE_TRUNC('month', NOW())`,
      []
    );

    const data = result.rows[0];
    const activeCustomers = parseInt(data.active_customers) || 1;
    const churnedCustomers = parseInt(data.churned_customers) || 0;

    return {
      mrr: parseFloat(data.mrr) || 0,
      activeCustomers,
      newCustomers: parseInt(data.new_customers) || 0,
      averageMonthlyRevenue: parseFloat(data.avg_monthly_revenue) || 0,
      expansionRevenue: parseFloat(data.expansion_revenue) || 0,
      churnRate: activeCustomers > 0 ? (churnedCustomers / activeCustomers) * 100 : 0,
      churnedRevenue: parseFloat(data.churned_revenue) || 0,
      newMRR: parseFloat(data.new_mrr) || 0,
    };
  }

  /**
   * Get previous month metrics
   */
  private async getPreviousMonthMetrics(): Promise<any> {
    const result = await query(
      `SELECT
        COALESCE(SUM(s.monthly_amount), 0) as mrr
       FROM subscriptions s
       WHERE s.status = 'active'
       AND DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')`,
      []
    );

    return {
      mrr: parseFloat(result.rows[0]?.mrr) || 0,
    };
  }

  /**
   * Get user cohorts for analysis
   */
  private async getUserCohorts(): Promise<any[]> {
    const result = await query(
      `SELECT
        DATE_TRUNC('month', created_at) as cohort_month,
        COUNT(*) as cohort_size
       FROM users
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY cohort_month DESC
       LIMIT 12`,
      []
    );

    return result.rows;
  }

  /**
   * Get financial data
   */
  private async getFinancialData(): Promise<any> {
    // In production, this would fetch from accounting system
    // For now, returning reasonable defaults
    return {
      marketingSpend: 5000,
      operatingExpenses: 25000,
      costOfGoodsSold: 2000,
      cashReserves: 500000,
    };
  }

  /**
   * Calculate Customer Acquisition Cost
   */
  private calculateCAC(marketingSpend: number, newCustomers: number): number {
    if (newCustomers === 0) return 0;
    return marketingSpend / newCustomers;
  }

  /**
   * Calculate Lifetime Value
   */
  private calculateLTV(
    averageMonthlyRevenue: number,
    churnRate: number,
    costOfGoodsSold: number
  ): number {
    if (churnRate === 0 || churnRate === 100) return 0;

    const monthlyGrossProfit = averageMonthlyRevenue - costOfGoodsSold;
    const monthlyRetentionRate = 1 - churnRate / 100;
    const monthlyChurnRate = churnRate / 100;

    // LTV = ARPU / Monthly Churn Rate (simplified)
    // Or more accurately: LTV = AMGP / (1 - (1 / (1 + monthly churn rate)))
    return monthlyGrossProfit / monthlyChurnRate;
  }

  /**
   * Calculate annual churn rate from monthly
   */
  private calculateAnnualChurnRate(monthlyChurnRate: number): number {
    const monthlyRetention = 1 - monthlyChurnRate / 100;
    const annualRetention = Math.pow(monthlyRetention, 12);
    return (1 - annualRetention) * 100;
  }

  /**
   * Calculate Net Dollar Churn Exponent
   */
  private calculateNDCExponent(
    previousMRR: number,
    expansionRevenue: number,
    churnedRevenue: number,
    newMRR: number
  ): number {
    if (previousMRR === 0) return 0;
    return ((previousMRR + expansionRevenue - churnedRevenue + newMRR) / previousMRR - 1) * 100;
  }

  /**
   * Analyze user cohorts
   */
  async analyzeCohorts(): Promise<CohortAnalysis[]> {
    try {
      const cohorts: CohortAnalysis[] = [];

      const result = await query(
        `SELECT
          DATE_TRUNC('month', u.created_at) as cohort_month,
          COUNT(DISTINCT u.id) as users
         FROM users u
         GROUP BY DATE_TRUNC('month', u.created_at)
         ORDER BY cohort_month DESC
         LIMIT 12`,
        []
      );

      for (const row of result.rows) {
        const cohortMonth = row.cohort_month;

        // Get retention by month
        const retentionResult = await query(
          `SELECT
            DATE_TRUNC('month', s.created_at)::date - DATE_TRUNC('month', u.created_at)::date as month_offset,
            COUNT(DISTINCT u.id) as retained_users
           FROM users u
           LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
           WHERE DATE_TRUNC('month', u.created_at) = $1
           GROUP BY month_offset
           ORDER BY month_offset ASC`,
          [cohortMonth]
        );

        const totalUsersAtSignup = parseInt(row.users) || 0;

        const retentionByMonth = retentionResult.rows.map((r: any) => ({
          month: parseInt(r.month_offset) || 0,
          retainedUsers: parseInt(r.retained_users) || 0,
          retentionRate: totalUsersAtSignup > 0
            ? (parseInt(r.retained_users) / totalUsersAtSignup) * 100
            : 0,
        }));

        cohorts.push({
          cohortMonth: cohortMonth.toISOString().split('T')[0],
          totalUsersAtSignup,
          retentionByMonth,
          monthlyRevenueByMonth: [],
        });
      }

      return cohorts;
    } catch (error) {
      throw new Error(`Failed to analyze cohorts: ${error}`);
    }
  }

  /**
   * Generate revenue forecast
   */
  async forecastRevenue(months: number = 12): Promise<RevenueProjection[]> {
    try {
      const metrics = await this.calculateSaaSMetrics();
      const projections: RevenueProjection[] = [];

      let projectedMRR = metrics.mrr;
      const mrrGrowthRate = metrics.mrrGrowth / 100; // Convert percentage to decimal

      for (let i = 1; i <= months; i++) {
        const projectionDate = new Date();
        projectionDate.setMonth(projectionDate.getMonth() + i);

        // Project with growth rate, but slow it down over time (s-curve adoption)
        const decelerationFactor = 1 - (i / (months * 2)); // Slows growth over time
        const monthGrowth = mrrGrowthRate * decelerationFactor;

        projectedMRR = projectedMRR * (1 + monthGrowth);

        // Determine confidence level
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        let reasoning = 'Based on historical growth rate';

        if (i <= 3) {
          confidence = 'high';
          reasoning = 'Near-term forecast with high confidence';
        } else if (i > 9) {
          confidence = 'low';
          reasoning = 'Long-term forecast, subject to market changes';
        }

        projections.push({
          month: projectionDate.toISOString().split('T')[0],
          projectedMRR: parseFloat(projectedMRR.toFixed(2)),
          projectedARR: parseFloat((projectedMRR * 12).toFixed(2)),
          confidence,
          reasoning,
        });
      }

      return projections;
    } catch (error) {
      throw new Error(`Failed to forecast revenue: ${error}`);
    }
  }
}

export const metricsCalculator = new MetricsCalculator();
