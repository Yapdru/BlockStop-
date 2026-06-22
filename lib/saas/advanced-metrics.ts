/**
 * Advanced SaaS Metrics
 * Comprehensive business analytics: MRR, ARR, churn, CAC, LTV, cohort analysis, growth forecasting
 * Production-ready SaaS metrics calculation engine
 */

import { query } from '@/lib/db';

// ===== SaaS Metrics Types =====

export interface MRRMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  mrrGrowth: number; // Month-over-month growth percentage
  mrrBreakdown: {
    newMRR: number;
    expansion: number; // Upsells, add-ons
    contraction: number; // Downgrades
    churn: number; // Lost revenue
  };
  currency: string;
}

export interface ChurnMetrics {
  monthlyChurnRate: number; // Percentage
  annualChurnRate: number;
  customerChurn: {
    totalLost: number;
    rate: number; // Percentage
  };
  revenueChurn: {
    lostRevenue: number;
    rate: number; // Percentage
  };
  reasons: Record<string, number>; // Churn reason breakdown
  ndce: number; // Net Dollar Churn Exponent
}

export interface CAC {
  totalCAC: number; // Total customer acquisition cost
  byChannel: Record<string, number>;
  cacPaybackPeriod: number; // Months
  cacRecoveryRate: number; // Percentage
  trend: 'improving' | 'stable' | 'declining';
}

export interface LTV {
  ltv: number; // Lifetime Value
  bySegment: Record<string, number>;
  avgSubscriptionLifetime: number; // Months
  avgRevenuePerAccount: number;
  ltvToCACRatio: number;
}

export interface CohortAnalysis {
  cohortName: string;
  cohortDate: Date;
  initialSize: number;
  retentionByMonth: Array<{
    month: number;
    users: number;
    rate: number; // Percentage
  }>;
  revenueByMonth: Array<{
    month: number;
    revenue: number;
  }>;
  ltv: number;
  avgRevenuePerUser: number;
  totalRevenue: number;
}

export interface RevenueProjection {
  month: string;
  projectedMRR: number;
  projectedARR: number;
  confidence: 'high' | 'medium' | 'low';
  scenario: 'conservative' | 'base' | 'optimistic';
  reasoning: string;
}

export interface GrowthMetrics {
  periodMoMGrowth: number; // Month-over-month
  quarterlyGrowth: number; // Quarter-over-quarter
  annualGrowth: number; // Year-over-year
  growthRate: number; // Percentage
  projectedYearlyGrowth: number;
  doubleDateMonths: number; // Months until MRR doubles
  trendAnalysis: 'accelerating' | 'linear' | 'decelerating';
}

export interface ProfitabilityMetrics {
  grossMargin: number; // Percentage
  operatingMargin: number;
  netMargin: number;
  unitEconomics: {
    revenuePerUser: number;
    costPerUser: number;
    profit: number;
  };
  cogs: number; // Cost of goods sold
  operatingExpenses: number;
  runway: number; // Months of runway if unprofitable
  breakEvenMRR: number;
}

export interface SegmentMetrics {
  segmentName: string;
  customers: number;
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  cac: number;
  growthRate: number;
}

export interface ReportingPeriod {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
}

export interface SaaSDashboard {
  period: ReportingPeriod;
  mrrMetrics: MRRMetrics;
  churnMetrics: ChurnMetrics;
  cacMetrics: CAC;
  ltvMetrics: LTV;
  growthMetrics: GrowthMetrics;
  profitabilityMetrics: ProfitabilityMetrics;
  segmentMetrics: SegmentMetrics[];
  healthScore: number; // 0-100
  keyWarnings: string[];
  keyOpportunities: string[];
}

// ===== Advanced Metrics Calculator =====

export class AdvancedMetricsCalculator {
  /**
   * Calculate comprehensive SaaS dashboard
   */
  async calculateSaaSDashboard(
    year: number,
    month: number
  ): Promise<SaaSDashboard> {
    try {
      const period = this.getPeriodDates(year, month);

      const mrrMetrics = await this.calculateMRRMetrics(period);
      const churnMetrics = await this.calculateChurnMetrics(period);
      const cacMetrics = await this.calculateCAC(period);
      const ltvMetrics = await this.calculateLTV(period, cacMetrics);
      const growthMetrics = await this.calculateGrowthMetrics(period);
      const profitabilityMetrics = await this.calculateProfitabilityMetrics(period);
      const segmentMetrics = await this.calculateSegmentMetrics(period);

      const healthScore = this.calculateHealthScore(
        mrrMetrics,
        churnMetrics,
        growthMetrics,
        profitabilityMetrics
      );

      const keyWarnings = this.identifyKeyWarnings(
        mrrMetrics,
        churnMetrics,
        cacMetrics,
        ltvMetrics,
        profitabilityMetrics
      );

      const keyOpportunities = this.identifyOpportunities(
        mrrMetrics,
        growthMetrics,
        profitabilityMetrics,
        segmentMetrics
      );

      return {
        period,
        mrrMetrics,
        churnMetrics,
        cacMetrics,
        ltvMetrics,
        growthMetrics,
        profitabilityMetrics,
        segmentMetrics,
        healthScore,
        keyWarnings,
        keyOpportunities
      };
    } catch (error) {
      throw new Error(`Failed to calculate SaaS dashboard: ${error}`);
    }
  }

  // ===== MRR Calculation =====

  /**
   * Calculate Monthly Recurring Revenue metrics
   */
  private async calculateMRRMetrics(period: ReportingPeriod): Promise<MRRMetrics> {
    try {
      const currentMRR = await this.calculateMRR(period);
      const previousMRR = await this.calculateMRR(this.getPreviousPeriod(period));

      const mrrGrowth =
        previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;

      // Get MRR breakdown
      const breakdown = await this.getMRRBreakdown(period);

      return {
        mrr: currentMRR,
        arr: currentMRR * 12,
        mrrGrowth,
        mrrBreakdown: breakdown,
        currency: 'USD'
      };
    } catch (error) {
      throw new Error(`Failed to calculate MRR metrics: ${error}`);
    }
  }

  /**
   * Calculate MRR for a period
   */
  private async calculateMRR(period: ReportingPeriod): Promise<number> {
    try {
      const result = await query(
        `SELECT SUM(CAST(subscription_value AS FLOAT)) as mrr
         FROM subscriptions
         WHERE status = 'active'
         AND (billing_start_date <= $2 AND (billing_end_date IS NULL OR billing_end_date >= $1))
         AND billing_cycle = 'monthly'`,
        [period.startDate, period.endDate]
      );

      return parseFloat(result.rows[0]?.mrr || 0);
    } catch (error) {
      throw new Error(`Failed to calculate MRR: ${error}`);
    }
  }

  /**
   * Get MRR breakdown (new, expansion, contraction, churn)
   */
  private async getMRRBreakdown(period: ReportingPeriod): Promise<any> {
    try {
      const newResult = await query(
        `SELECT SUM(CAST(subscription_value AS FLOAT)) as total
         FROM subscriptions
         WHERE status = 'active' AND created_at >= $1 AND created_at <= $2`,
        [period.startDate, period.endDate]
      );

      const expansionResult = await query(
        `SELECT SUM(CAST(new_value AS FLOAT) - CAST(old_value AS FLOAT)) as total
         FROM subscription_changes
         WHERE change_type = 'upgrade' AND created_at >= $1 AND created_at <= $2`,
        [period.startDate, period.endDate]
      );

      const contractionResult = await query(
        `SELECT SUM(CAST(old_value AS FLOAT) - CAST(new_value AS FLOAT)) as total
         FROM subscription_changes
         WHERE change_type = 'downgrade' AND created_at >= $1 AND created_at <= $2`,
        [period.startDate, period.endDate]
      );

      const churnResult = await query(
        `SELECT SUM(CAST(subscription_value AS FLOAT)) as total
         FROM subscriptions
         WHERE status = 'cancelled' AND cancelled_at >= $1 AND cancelled_at <= $2`,
        [period.startDate, period.endDate]
      );

      return {
        newMRR: parseFloat(newResult.rows[0]?.total || 0),
        expansion: parseFloat(expansionResult.rows[0]?.total || 0),
        contraction: parseFloat(contractionResult.rows[0]?.total || 0),
        churn: parseFloat(churnResult.rows[0]?.total || 0)
      };
    } catch (error) {
      throw new Error(`Failed to get MRR breakdown: ${error}`);
    }
  }

  // ===== Churn Metrics =====

  /**
   * Calculate churn metrics
   */
  private async calculateChurnMetrics(period: ReportingPeriod): Promise<ChurnMetrics> {
    try {
      // Get customer counts
      const startOfPeriodResult = await query(
        `SELECT COUNT(*) as count FROM subscriptions
         WHERE status = 'active' AND created_at < $1`,
        [period.startDate]
      );

      const churnedResult = await query(
        `SELECT COUNT(*) as count FROM subscriptions
         WHERE status = 'cancelled' AND cancelled_at >= $1 AND cancelled_at <= $2`,
        [period.startDate, period.endDate]
      );

      const startCount = parseInt(startOfPeriodResult.rows[0]?.count || 0);
      const churnedCount = parseInt(churnedResult.rows[0]?.count || 0);

      const monthlyChurnRate = startCount > 0 ? (churnedCount / startCount) * 100 : 0;
      const annualChurnRate =
        Math.pow(1 - monthlyChurnRate / 100, 12) * 100;

      // Get revenue churn
      const revenueChurnResult = await query(
        `SELECT SUM(CAST(subscription_value AS FLOAT)) as revenue
         FROM subscriptions
         WHERE status = 'cancelled' AND cancelled_at >= $1 AND cancelled_at <= $2`,
        [period.startDate, period.endDate]
      );

      const currentRevenue = await this.calculateMRR(period);
      const lostRevenue = parseFloat(revenueChurnResult.rows[0]?.revenue || 0);
      const revenueChurnRate =
        currentRevenue > 0 ? (lostRevenue / currentRevenue) * 100 : 0;

      // Get churn reasons
      const reasonsResult = await query(
        `SELECT churn_reason, COUNT(*) as count
         FROM subscriptions
         WHERE status = 'cancelled' AND cancelled_at >= $1 AND cancelled_at <= $2
         GROUP BY churn_reason`,
        [period.startDate, period.endDate]
      );

      const reasons: Record<string, number> = {};
      for (const row of reasonsResult.rows) {
        reasons[row.churn_reason || 'unknown'] = parseInt(row.count);
      }

      // Calculate NDCE (Net Dollar Churn Exponent)
      const previousRevenue = await this.calculateMRR(this.getPreviousPeriod(period));
      const expansion = await this.getExpansionRevenue(period);
      const ndce =
        previousRevenue > 0
          ? ((expansion - lostRevenue) / previousRevenue) * 100
          : 0;

      return {
        monthlyChurnRate,
        annualChurnRate,
        customerChurn: {
          totalLost: churnedCount,
          rate: monthlyChurnRate
        },
        revenueChurn: {
          lostRevenue,
          rate: revenueChurnRate
        },
        reasons,
        ndce
      };
    } catch (error) {
      throw new Error(`Failed to calculate churn metrics: ${error}`);
    }
  }

  // ===== CAC Calculation =====

  /**
   * Calculate Customer Acquisition Cost
   */
  private async calculateCAC(period: ReportingPeriod): Promise<CAC> {
    try {
      // Get marketing spend
      const marketingSpendResult = await query(
        `SELECT SUM(CAST(amount AS FLOAT)) as total
         FROM marketing_spend
         WHERE date >= $1 AND date <= $2`,
        [period.startDate, period.endDate]
      );

      const marketingSpend = parseFloat(marketingSpendResult.rows[0]?.total || 0);

      // Get new customers
      const newCustomersResult = await query(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM subscriptions
         WHERE status = 'active' AND created_at >= $1 AND created_at <= $2`,
        [period.startDate, period.endDate]
      );

      const newCustomers = parseInt(newCustomersResult.rows[0]?.count || 0);

      const totalCAC =
        newCustomers > 0 ? marketingSpend / newCustomers : 0;

      // Get CAC by channel
      const channelResult = await query(
        `SELECT marketing_channel, SUM(CAST(amount AS FLOAT)) as spend,
                COUNT(DISTINCT s.user_id) as customers
         FROM marketing_spend ms
         LEFT JOIN subscriptions s ON s.created_at >= ms.date
         WHERE ms.date >= $1 AND ms.date <= $2
         GROUP BY marketing_channel`,
        [period.startDate, period.endDate]
      );

      const byChannel: Record<string, number> = {};
      for (const row of channelResult.rows) {
        const customers = parseInt(row.customers || 0);
        const spend = parseFloat(row.spend || 0);
        byChannel[row.marketing_channel] = customers > 0 ? spend / customers : 0;
      }

      // Calculate payback period
      const mrrPerCustomer = await this.calculateMRRPerCustomer();
      const cacPaybackPeriod =
        mrrPerCustomer > 0 ? totalCAC / mrrPerCustomer : 0;

      // Trend analysis
      const previousCAC = await this.calculateCAC(this.getPreviousPeriod(period));
      const trend =
        totalCAC < previousCAC
          ? 'improving'
          : totalCAC > previousCAC
            ? 'declining'
            : 'stable';

      return {
        totalCAC,
        byChannel,
        cacPaybackPeriod,
        cacRecoveryRate: (100 / Math.max(cacPaybackPeriod, 1)) * 10,
        trend
      };
    } catch (error) {
      throw new Error(`Failed to calculate CAC: ${error}`);
    }
  }

  // ===== LTV Calculation =====

  /**
   * Calculate Lifetime Value
   */
  private async calculateLTV(
    period: ReportingPeriod,
    cac: CAC
  ): Promise<LTV> {
    try {
      const mrrPerCustomer = await this.calculateMRRPerCustomer();
      const churnResult = await query(
        `SELECT COUNT(*) as count FROM subscriptions
         WHERE status = 'cancelled' AND cancelled_at >= $1 AND cancelled_at <= $2`,
        [period.startDate, period.endDate]
      );

      const totalCustomersResult = await query(
        `SELECT COUNT(DISTINCT user_id) as count FROM subscriptions
         WHERE created_at <= $1`,
        [period.endDate]
      );

      const monthlyChurnRate =
        parseInt(totalCustomersResult.rows[0]?.count || 0) > 0
          ? (parseInt(churnResult.rows[0]?.count || 0) /
              parseInt(totalCustomersResult.rows[0]?.count || 0)) *
            100
          : 0;

      const avgLifetimeMonths =
        monthlyChurnRate > 0 ? 1 / (monthlyChurnRate / 100) : 60; // Default 5 years

      const ltv = mrrPerCustomer * avgLifetimeMonths;

      // By segment
      const segmentResult = await query(
        `SELECT plan_type, COUNT(*) as customers,
                AVG(CAST(subscription_value AS FLOAT)) as avg_mrr
         FROM subscriptions
         WHERE status = 'active' AND created_at <= $1
         GROUP BY plan_type`,
        [period.endDate]
      );

      const bySegment: Record<string, number> = {};
      for (const row of segmentResult.rows) {
        const avgMrr = parseFloat(row.avg_mrr || 0);
        bySegment[row.plan_type] = avgMrr * avgLifetimeMonths;
      }

      return {
        ltv,
        bySegment,
        avgSubscriptionLifetime: avgLifetimeMonths,
        avgRevenuePerAccount: mrrPerCustomer,
        ltvToCACRatio: cac.totalCAC > 0 ? ltv / cac.totalCAC : 0
      };
    } catch (error) {
      throw new Error(`Failed to calculate LTV: ${error}`);
    }
  }

  // ===== Growth Metrics =====

  /**
   * Calculate growth metrics
   */
  private async calculateGrowthMetrics(period: ReportingPeriod): Promise<GrowthMetrics> {
    try {
      const currentMRR = await this.calculateMRR(period);
      const previousMonthMRR = await this.calculateMRR(
        this.getPreviousPeriod(period)
      );
      const previousQuarterMRR = await this.calculateMRR(
        this.getPreviousQuarter(period)
      );
      const previousYearMRR = await this.calculateMRR(
        this.getPreviousYear(period)
      );

      const momGrowth =
        previousMonthMRR > 0
          ? ((currentMRR - previousMonthMRR) / previousMonthMRR) * 100
          : 0;

      const qoqGrowth =
        previousQuarterMRR > 0
          ? ((currentMRR - previousQuarterMRR) / previousQuarterMRR) * 100
          : 0;

      const yoyGrowth =
        previousYearMRR > 0
          ? ((currentMRR - previousYearMRR) / previousYearMRR) * 100
          : 0;

      const growthRate = (momGrowth + qoqGrowth + yoyGrowth) / 3;

      // Calculate doubling time
      const monthsToDuble =
        growthRate > 0 ? Math.log(2) / Math.log(1 + growthRate / 100) : Infinity;

      // Trend analysis
      const trend =
        momGrowth > qoqGrowth
          ? 'accelerating'
          : momGrowth < qoqGrowth
            ? 'decelerating'
            : 'linear';

      return {
        periodMoMGrowth: momGrowth,
        quarterlyGrowth: qoqGrowth,
        annualGrowth: yoyGrowth,
        growthRate,
        projectedYearlyGrowth: momGrowth * 12,
        doubleDateMonths: monthsToDuble,
        trendAnalysis: trend
      };
    } catch (error) {
      throw new Error(`Failed to calculate growth metrics: ${error}`);
    }
  }

  // ===== Profitability Metrics =====

  /**
   * Calculate profitability metrics
   */
  private async calculateProfitabilityMetrics(
    period: ReportingPeriod
  ): Promise<ProfitabilityMetrics> {
    try {
      const mrr = await this.calculateMRR(period);

      // Get financial data
      const financialResult = await query(
        `SELECT
          SUM(CASE WHEN type = 'revenue' THEN CAST(amount AS FLOAT) ELSE 0 END) as revenue,
          SUM(CASE WHEN type = 'cogs' THEN CAST(amount AS FLOAT) ELSE 0 END) as cogs,
          SUM(CASE WHEN type = 'operating' THEN CAST(amount AS FLOAT) ELSE 0 END) as opex
         FROM financial_records
         WHERE date >= $1 AND date <= $2`,
        [period.startDate, period.endDate]
      );

      const revenue = parseFloat(financialResult.rows[0]?.revenue || mrr);
      const cogs = parseFloat(financialResult.rows[0]?.cogs || 0);
      const operatingExpenses = parseFloat(
        financialResult.rows[0]?.opex || 0
      );

      const grossProfit = revenue - cogs;
      const operatingProfit = grossProfit - operatingExpenses;
      const netProfit = operatingProfit;

      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const operatingMargin =
        revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      const customerCount = await this.getActiveCustomerCount(period);
      const revenuePerUser = customerCount > 0 ? revenue / customerCount : 0;
      const costPerUser = customerCount > 0 ? (cogs + operatingExpenses) / customerCount : 0;

      // Calculate runway
      const monthlyBurn = operatingExpenses;
      const cashReserves = await this.getCashReserves();
      const runway = monthlyBurn > 0 ? cashReserves / monthlyBurn : Infinity;

      // Break-even MRR
      const monthlyFixedCosts = await this.getFixedCosts();
      const contributionMargin = revenue > 0 ? (revenue - cogs) / revenue : 0;
      const breakEvenMRR =
        contributionMargin > 0 ? monthlyFixedCosts / contributionMargin : 0;

      return {
        grossMargin,
        operatingMargin,
        netMargin,
        unitEconomics: {
          revenuePerUser,
          costPerUser,
          profit: revenuePerUser - costPerUser
        },
        cogs,
        operatingExpenses,
        runway,
        breakEvenMRR
      };
    } catch (error) {
      throw new Error(`Failed to calculate profitability metrics: ${error}`);
    }
  }

  // ===== Cohort Analysis =====

  /**
   * Perform cohort analysis
   */
  async performCohortAnalysis(
    startYear: number,
    startMonth: number,
    months: number = 12
  ): Promise<CohortAnalysis[]> {
    try {
      const cohorts: CohortAnalysis[] = [];

      for (let i = 0; i < months; i++) {
        const cohortPeriod = this.getMonthOffset(startYear, startMonth, i);
        const cohortName = `${cohortPeriod.year}-${String(cohortPeriod.month).padStart(2, '0')}`;

        // Get initial size
        const initialResult = await query(
          `SELECT COUNT(*) as count FROM subscriptions
           WHERE created_at >= $1 AND created_at < $2`,
          [cohortPeriod.startDate, cohortPeriod.endDate]
        );

        const initialSize = parseInt(initialResult.rows[0]?.count || 0);

        if (initialSize === 0) continue;

        // Calculate retention by month
        const retentionByMonth: any[] = [];
        for (let month = 0; month < months - i; month++) {
          const monthPeriod = this.getMonthOffset(
            cohortPeriod.year,
            cohortPeriod.month,
            month
          );

          const retainedResult = await query(
            `SELECT COUNT(*) as count FROM subscriptions
             WHERE created_at >= $1 AND created_at < $2
             AND (cancelled_at IS NULL OR cancelled_at > $3)`,
            [cohortPeriod.startDate, cohortPeriod.endDate, monthPeriod.endDate]
          );

          const retained = parseInt(retainedResult.rows[0]?.count || 0);
          const rate = (retained / initialSize) * 100;

          retentionByMonth.push({
            month,
            users: retained,
            rate
          });
        }

        // Get revenue by month
        const revenueByMonth: any[] = [];
        let totalRevenue = 0;
        for (let month = 0; month < months - i; month++) {
          const monthPeriod = this.getMonthOffset(
            cohortPeriod.year,
            cohortPeriod.month,
            month
          );

          const revenueResult = await query(
            `SELECT SUM(CAST(subscription_value AS FLOAT)) as revenue
             FROM subscriptions
             WHERE created_at >= $1 AND created_at < $2
             AND (cancelled_at IS NULL OR cancelled_at > $3)`,
            [cohortPeriod.startDate, cohortPeriod.endDate, monthPeriod.endDate]
          );

          const revenue = parseFloat(revenueResult.rows[0]?.revenue || 0);
          revenueByMonth.push({
            month,
            revenue
          });
          totalRevenue += revenue;
        }

        const ltv =
          initialSize > 0 ? totalRevenue / initialSize : 0;
        const avgRevenuePerUser =
          initialSize > 0
            ? totalRevenue / initialSize / (months - i)
            : 0;

        cohorts.push({
          cohortName,
          cohortDate: cohortPeriod.startDate,
          initialSize,
          retentionByMonth,
          revenueByMonth,
          ltv,
          avgRevenuePerUser,
          totalRevenue
        });
      }

      return cohorts;
    } catch (error) {
      throw new Error(`Failed to perform cohort analysis: ${error}`);
    }
  }

  // ===== Growth Forecasting =====

  /**
   * Forecast revenue growth
   */
  async forecastRevenue(
    startYear: number,
    startMonth: number,
    forecastMonths: number = 12
  ): Promise<RevenueProjection[]> {
    try {
      const projections: RevenueProjection[] = [];

      // Get historical data for trend analysis
      const historicalMRR: number[] = [];
      for (let i = 12; i > 0; i--) {
        const period = this.getMonthOffset(startYear, startMonth, -i);
        const mrr = await this.calculateMRR(period);
        historicalMRR.push(mrr);
      }

      // Calculate trend
      const avgGrowth = this.calculateTrendGrowth(historicalMRR);

      // Generate projections
      let lastMRR = historicalMRR[historicalMRR.length - 1];

      for (let i = 1; i <= forecastMonths; i++) {
        const projectionPeriod = this.getMonthOffset(
          startYear,
          startMonth,
          i
        );

        // Conservative: 75% of trend
        const conservativeMRR = lastMRR * (1 + avgGrowth * 0.75);

        // Base: full trend
        const baseMRR = lastMRR * (1 + avgGrowth);

        // Optimistic: 125% of trend
        const optimisticMRR = lastMRR * (1 + avgGrowth * 1.25);

        const monthStr = `${projectionPeriod.year}-${String(projectionPeriod.month).padStart(2, '0')}`;

        projections.push({
          month: monthStr,
          projectedMRR: baseMRR,
          projectedARR: baseMRR * 12,
          confidence: i <= 3 ? 'high' : i <= 6 ? 'medium' : 'low',
          scenario: 'base',
          reasoning: `Based on historical trend of ${(avgGrowth * 100).toFixed(2)}% monthly growth`
        });

        lastMRR = baseMRR;
      }

      return projections;
    } catch (error) {
      throw new Error(`Failed to forecast revenue: ${error}`);
    }
  }

  // ===== Segment Metrics =====

  /**
   * Calculate metrics by segment
   */
  private async calculateSegmentMetrics(
    period: ReportingPeriod
  ): Promise<SegmentMetrics[]> {
    try {
      const result = await query(
        `SELECT
          plan_type as segment,
          COUNT(DISTINCT user_id) as customers,
          SUM(CAST(subscription_value AS FLOAT)) as mrr,
          SUM(CAST(subscription_value AS FLOAT)) * 12 as arr
         FROM subscriptions
         WHERE status = 'active' AND created_at <= $1
         GROUP BY plan_type`,
        [period.endDate]
      );

      const metrics: SegmentMetrics[] = [];

      for (const row of result.rows) {
        const segmentName = row.segment;
        const customers = parseInt(row.customers);
        const mrr = parseFloat(row.mrr);
        const arr = parseFloat(row.arr);

        // Calculate churn for segment
        const churnResult = await query(
          `SELECT COUNT(*) as count FROM subscriptions
           WHERE plan_type = $1 AND status = 'cancelled'
           AND cancelled_at >= $2 AND cancelled_at <= $3`,
          [segmentName, period.startDate, period.endDate]
        );

        const churnRate =
          customers > 0
            ? (parseInt(churnResult.rows[0]?.count || 0) / customers) * 100
            : 0;

        // Calculate LTV and CAC for segment
        const avgLifetimeMonths = churnRate > 0 ? 1 / (churnRate / 100) : 60;
        const ltv = (mrr / customers) * avgLifetimeMonths;

        const spendResult = await query(
          `SELECT SUM(CAST(amount AS FLOAT)) as spend
           FROM marketing_spend
           WHERE target_segment = $1 AND date >= $2 AND date <= $3`,
          [segmentName, period.startDate, period.endDate]
        );

        const spend = parseFloat(spendResult.rows[0]?.spend || 0);
        const cac = customers > 0 ? spend / customers : 0;

        // Calculate growth
        const previousPeriod = this.getPreviousPeriod(period);
        const previousResult = await query(
          `SELECT COUNT(DISTINCT user_id) as count,
                  SUM(CAST(subscription_value AS FLOAT)) as mrr
           FROM subscriptions
           WHERE plan_type = $1 AND status = 'active'
           AND created_at <= $2`,
          [segmentName, previousPeriod.endDate]
        );

        const previousMrr = parseFloat(previousResult.rows[0]?.mrr || 0);
        const growthRate = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0;

        metrics.push({
          segmentName,
          customers,
          mrr,
          arr,
          churnRate,
          ltv,
          cac,
          growthRate
        });
      }

      return metrics;
    } catch (error) {
      throw new Error(`Failed to calculate segment metrics: ${error}`);
    }
  }

  // ===== Helper Methods =====

  private getPeriodDates(year: number, month: number): ReportingPeriod {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return {
      year,
      month,
      startDate,
      endDate
    };
  }

  private getPreviousPeriod(period: ReportingPeriod): ReportingPeriod {
    let { year, month } = period;
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    return this.getPeriodDates(year, month);
  }

  private getPreviousQuarter(period: ReportingPeriod): ReportingPeriod {
    let { year, month } = period;
    month -= 3;
    if (month <= 0) {
      month += 12;
      year--;
    }
    return this.getPeriodDates(year, month);
  }

  private getPreviousYear(period: ReportingPeriod): ReportingPeriod {
    return this.getPeriodDates(period.year - 1, period.month);
  }

  private getMonthOffset(
    year: number,
    month: number,
    offset: number
  ): ReportingPeriod {
    let newMonth = month + offset;
    let newYear = year;

    while (newMonth > 12) {
      newMonth -= 12;
      newYear++;
    }
    while (newMonth <= 0) {
      newMonth += 12;
      newYear--;
    }

    return this.getPeriodDates(newYear, newMonth);
  }

  private async calculateMRRPerCustomer(): Promise<number> {
    const result = await query(
      `SELECT AVG(CAST(subscription_value AS FLOAT)) as avg_mrr
       FROM subscriptions WHERE status = 'active'`
    );

    return parseFloat(result.rows[0]?.avg_mrr || 0);
  }

  private async getActiveCustomerCount(period: ReportingPeriod): Promise<number> {
    const result = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM subscriptions
       WHERE status = 'active' AND created_at <= $1`,
      [period.endDate]
    );

    return parseInt(result.rows[0]?.count || 0);
  }

  private async getExpansionRevenue(period: ReportingPeriod): Promise<number> {
    const result = await query(
      `SELECT SUM(CAST(new_value AS FLOAT) - CAST(old_value AS FLOAT)) as total
       FROM subscription_changes
       WHERE change_type = 'upgrade' AND created_at >= $1 AND created_at <= $2`,
      [period.startDate, period.endDate]
    );

    return parseFloat(result.rows[0]?.total || 0);
  }

  private async getCashReserves(): Promise<number> {
    const result = await query(
      `SELECT SUM(CAST(amount AS FLOAT)) as total
       FROM financial_accounts WHERE type = 'cash'`
    );

    return parseFloat(result.rows[0]?.total || 0);
  }

  private async getFixedCosts(): Promise<number> {
    const result = await query(
      `SELECT SUM(CAST(amount AS FLOAT)) as total
       FROM financial_records WHERE type = 'fixed_cost' AND recurring = true`
    );

    return parseFloat(result.rows[0]?.total || 0);
  }

  private calculateTrendGrowth(historicalMRR: number[]): number {
    if (historicalMRR.length < 2) return 0;

    const growth: number[] = [];
    for (let i = 1; i < historicalMRR.length; i++) {
      const g =
        historicalMRR[i - 1] > 0
          ? (historicalMRR[i] - historicalMRR[i - 1]) / historicalMRR[i - 1]
          : 0;
      growth.push(g);
    }

    return growth.reduce((a, b) => a + b, 0) / growth.length;
  }

  private calculateHealthScore(
    mrr: MRRMetrics,
    churn: ChurnMetrics,
    growth: GrowthMetrics,
    profitability: ProfitabilityMetrics
  ): number {
    let score = 50; // Start at 50

    // Growth impact (0-20)
    if (growth.growthRate > 0.20) score += 20;
    else if (growth.growthRate > 0.10) score += 15;
    else if (growth.growthRate > 0) score += 10;

    // Churn impact (0-20)
    if (churn.monthlyChurnRate < 0.05) score += 20;
    else if (churn.monthlyChurnRate < 0.10) score += 15;
    else if (churn.monthlyChurnRate < 0.15) score += 10;

    // Profitability impact (0-20)
    if (profitability.netMargin > 0.20) score += 20;
    else if (profitability.netMargin > 0.10) score += 15;
    else if (profitability.netMargin > 0) score += 10;

    // MRR trend impact (0-20)
    if (mrr.mrrGrowth > 0.30) score += 20;
    else if (mrr.mrrGrowth > 0.10) score += 15;
    else if (mrr.mrrGrowth > 0) score += 10;

    return Math.min(100, score);
  }

  private identifyKeyWarnings(
    mrr: MRRMetrics,
    churn: ChurnMetrics,
    cac: CAC,
    ltv: LTV,
    profitability: ProfitabilityMetrics
  ): string[] {
    const warnings: string[] = [];

    if (churn.monthlyChurnRate > 0.15) {
      warnings.push('High customer churn rate detected');
    }

    if (profitability.runway < 12 && profitability.runway > 0) {
      warnings.push(`Limited runway: ${Math.floor(profitability.runway)} months`);
    }

    if (ltv.ltvToCACRatio < 3) {
      warnings.push('LTV to CAC ratio below healthy threshold (< 3)');
    }

    if (mrr.mrrGrowth < 0) {
      warnings.push('Negative MRR growth detected');
    }

    if (profitability.netMargin < 0) {
      warnings.push('Negative profitability');
    }

    return warnings;
  }

  private identifyOpportunities(
    mrr: MRRMetrics,
    growth: GrowthMetrics,
    profitability: ProfitabilityMetrics,
    segments: SegmentMetrics[]
  ): string[] {
    const opportunities: string[] = [];

    if (growth.growthRate > 0.20) {
      opportunities.push('Strong growth momentum - consider increasing investment');
    }

    if (profitability.netMargin > 0.30) {
      opportunities.push('High profitability - opportunity for expansion');
    }

    // Find best performing segment
    const bestSegment = segments.reduce((a, b) =>
      a.growthRate > b.growthRate ? a : b
    );

    if (bestSegment && bestSegment.growthRate > 0.25) {
      opportunities.push(`${bestSegment.segmentName} segment shows strong growth potential`);
    }

    if (mrr.mrrBreakdown.newMRR > mrr.mrr * 0.15) {
      opportunities.push('Strong new customer acquisition - consider sales team expansion');
    }

    return opportunities;
  }
}

export const advancedMetricsCalculator = new AdvancedMetricsCalculator();
