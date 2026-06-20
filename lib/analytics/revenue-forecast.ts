/**
 * Revenue Forecast - Revenue Prediction and Forecasting Module
 * Predicts future revenue based on historical trends and business metrics
 */

export interface RevenueForecast {
  period: string;
  projectedRevenue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  assumptions: string[];
}

export interface RevenueTrend {
  month: string;
  revenue: number;
  growthRate: number;
  churnRate: number;
  newCustomerRevenue: number;
}

export interface ForecastAssumptions {
  monthlyGrowthRate: number;
  churnRate: number;
  arpu: number;
  newCustomerAcquisition: number;
}

/**
 * Revenue Forecast class for revenue prediction
 */
export class RevenueForecast {
  private historicalData: RevenueTrend[] = [];
  private assumptions: ForecastAssumptions = {
    monthlyGrowthRate: 0.05,
    churnRate: 0.02,
    arpu: 100,
    newCustomerAcquisition: 10,
  };
  private baseRevenue: number = 10000;

  /**
   * Forecast revenue for specified number of months
   */
  async forecastRevenue(months: number): Promise<RevenueForecast[]> {
    try {
      if (months <= 0 || months > 36) {
        throw new Error('Months must be between 1 and 36');
      }

      const forecasts: RevenueForecast[] = [];
      let currentRevenue = this.baseRevenue;
      const baselineRevenue = currentRevenue;

      for (let i = 1; i <= months; i++) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() + i);

        // Calculate growth from new customers
        const newCustomerRevenue =
          this.assumptions.newCustomerAcquisition *
          this.assumptions.arpu;

        // Calculate churn impact
        const churnImpact = currentRevenue * this.assumptions.churnRate;

        // Apply growth rate
        const growthRevenue =
          currentRevenue * this.assumptions.monthlyGrowthRate;

        // Calculate next month's revenue
        currentRevenue =
          currentRevenue - churnImpact + growthRevenue + newCustomerRevenue;

        // Calculate confidence interval (95%)
        const uncertainty = currentRevenue * 0.1; // 10% uncertainty
        const zScore = 1.96;

        const forecast: RevenueForecast = {
          period: this.formatMonth(monthDate),
          projectedRevenue: Math.round(currentRevenue),
          confidenceInterval: {
            lower: Math.round(currentRevenue - zScore * uncertainty),
            upper: Math.round(currentRevenue + zScore * uncertainty),
          },
          assumptions: this.getActiveAssumptions(i),
        };

        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Revenue forecast error:', error);
      throw error;
    }
  }

  /**
   * Get historical revenue trends
   */
  async getRevenueTrends(): Promise<RevenueTrend[]> {
    try {
      // In production, query from database
      const trends: RevenueTrend[] = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const revenue = this.baseRevenue + i * 1000;
        const growthRate = i === 0 ? 0.05 : (revenue - (revenue - 1000)) / (revenue - 1000);

        const trend: RevenueTrend = {
          month: this.formatMonth(date),
          revenue: revenue,
          growthRate: growthRate,
          churnRate: this.assumptions.churnRate,
          newCustomerRevenue: this.assumptions.newCustomerAcquisition * this.assumptions.arpu,
        };

        trends.push(trend);
      }

      return trends;
    } catch (error) {
      console.error('Revenue trends retrieval error:', error);
      throw error;
    }
  }

  /**
   * Update forecast assumptions
   */
  async updateForecastAssumptions(
    newAssumptions: Partial<ForecastAssumptions>
  ): Promise<void> {
    try {
      // Validate inputs
      if (newAssumptions.monthlyGrowthRate !== undefined) {
        if (newAssumptions.monthlyGrowthRate < -0.5 || newAssumptions.monthlyGrowthRate > 0.5) {
          throw new Error('Monthly growth rate must be between -50% and 50%');
        }
        this.assumptions.monthlyGrowthRate = newAssumptions.monthlyGrowthRate;
      }

      if (newAssumptions.churnRate !== undefined) {
        if (newAssumptions.churnRate < 0 || newAssumptions.churnRate > 1) {
          throw new Error('Churn rate must be between 0 and 1');
        }
        this.assumptions.churnRate = newAssumptions.churnRate;
      }

      if (newAssumptions.arpu !== undefined) {
        if (newAssumptions.arpu < 0) {
          throw new Error('ARPU must be positive');
        }
        this.assumptions.arpu = newAssumptions.arpu;
      }

      if (newAssumptions.newCustomerAcquisition !== undefined) {
        if (newAssumptions.newCustomerAcquisition < 0) {
          throw new Error('New customer acquisition must be non-negative');
        }
        this.assumptions.newCustomerAcquisition =
          newAssumptions.newCustomerAcquisition;
      }

      console.log('Forecast assumptions updated successfully');
    } catch (error) {
      console.error('Update assumptions error:', error);
      throw error;
    }
  }

  /**
   * Get current forecast assumptions
   */
  getAssumptions(): ForecastAssumptions {
    return { ...this.assumptions };
  }

  /**
   * Calculate annual revenue run rate (ARR)
   */
  async calculateARR(monthlyRevenue: number): Promise<number> {
    return monthlyRevenue * 12;
  }

  /**
   * Calculate customer lifetime value (CLV)
   */
  async calculateCLV(): Promise<number> {
    try {
      const churnRateMonthly = this.assumptions.churnRate;
      if (churnRateMonthly >= 1) {
        throw new Error('Churn rate must be less than 100%');
      }

      const monthlyChurnRate = 1 - Math.pow(1 - churnRateMonthly, 1 / 12);
      const customerLifetimeMonths = 1 / monthlyChurnRate;
      const clv = this.assumptions.arpu * customerLifetimeMonths;

      return clv;
    } catch (error) {
      console.error('CLV calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate payback period for customer acquisition
   */
  async calculatePaybackPeriod(
    customerAcquisitionCost: number
  ): Promise<number> {
    try {
      if (this.assumptions.arpu <= 0) {
        throw new Error('ARPU must be positive for payback calculation');
      }

      const monthsToPayback = customerAcquisitionCost / this.assumptions.arpu;
      return monthsToPayback;
    } catch (error) {
      console.error('Payback period calculation error:', error);
      throw error;
    }
  }

  /**
   * Project customer count
   */
  async projectCustomerCount(
    currentCustomers: number,
    months: number
  ): Promise<number[]> {
    try {
      if (currentCustomers <= 0) {
        throw new Error('Current customers must be positive');
      }

      const projections: number[] = [];
      let customers = currentCustomers;

      for (let i = 0; i < months; i++) {
        // Apply churn
        customers *= 1 - this.assumptions.churnRate;

        // Add new customers
        customers += this.assumptions.newCustomerAcquisition;

        projections.push(Math.round(customers));
      }

      return projections;
    } catch (error) {
      console.error('Customer projection error:', error);
      throw error;
    }
  }

  /**
   * Calculate MRR (Monthly Recurring Revenue)
   */
  async calculateMRR(customerCount: number): Promise<number> {
    return customerCount * this.assumptions.arpu;
  }

  /**
   * Estimate year-end revenue
   */
  async estimateYearEndRevenue(
    currentMonthRevenue: number
  ): Promise<number> {
    try {
      const forecastedMonths = await this.forecastRevenue(12);
      const yearEndForecast = forecastedMonths[forecastedMonths.length - 1];
      return yearEndForecast.projectedRevenue;
    } catch (error) {
      console.error('Year-end estimation error:', error);
      throw error;
    }
  }

  /**
   * Set base revenue for forecasting
   */
  setBaseRevenue(revenue: number): void {
    if (revenue <= 0) {
      throw new Error('Base revenue must be positive');
    }
    this.baseRevenue = revenue;
    console.log(`Base revenue set to ${revenue}`);
  }

  /**
   * Format date to month string
   */
  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get active assumptions description
   */
  private getActiveAssumptions(monthNumber: number): string[] {
    const assumptions: string[] = [
      `Growth rate: ${(this.assumptions.monthlyGrowthRate * 100).toFixed(1)}% MoM`,
      `Churn rate: ${(this.assumptions.churnRate * 100).toFixed(1)}% monthly`,
      `ARPU: $${this.assumptions.arpu.toFixed(2)}`,
      `New customers/month: ${this.assumptions.newCustomerAcquisition}`,
    ];

    if (monthNumber > 6) {
      assumptions.push('Includes seasonal adjustments for Q3/Q4');
    }

    return assumptions;
  }
}

export default RevenueForecast;
