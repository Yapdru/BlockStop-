/**
 * MSP Dashboard Analytics
 * Analytics and insights for MSP partners
 */

export interface MSPMetrics {
  period: "today" | "week" | "month" | "year";
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  totalUsers: number;
  totalScans: number;
  totalApiCalls: number;
  averageCustomerHealth: number; // 0-100
}

export interface RevenueMetrics {
  period: "today" | "week" | "month" | "year";
  totalRevenue: number;
  mspRevenue: number; // After revenue share
  estimatedMonthlyRecurring: number;
  topCustomersByRevenue: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
  }>;
}

export interface CustomerMetrics {
  customerId: string;
  customerName: string;
  health: number; // 0-100
  activeUsers: number;
  monthlyScans: number;
  apiUsage: number;
  lastActivity: Date;
  riskScore: number; // 0-100, higher = more risky
  recommendations: string[];
}

export interface GrowthMetrics {
  newCustomersThisMonth: number;
  churnedCustomersThisMonth: number;
  netGrowthRate: number; // percentage
  projectedMonthlyGrowth: number; // based on trend
  retention: number; // percentage
}

export class MSPDashboard {
  private metricsCache: Map<string, MSPMetrics> = new Map();
  private revenueCache: Map<string, RevenueMetrics> = new Map();

  /**
   * Get MSP dashboard metrics
   */
  async getMetrics(
    mspId: string,
    period: "today" | "week" | "month" | "year" = "month"
  ): Promise<MSPMetrics> {
    const cacheKey = `${mspId}-${period}`;
    const cached = this.metricsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // In production: query from database
    const metrics: MSPMetrics = {
      period,
      totalCustomers: 25,
      activeCustomers: 23,
      newCustomers: this.getNewCustomersForPeriod(period),
      churnedCustomers: 0,
      totalUsers: 156,
      totalScans: 4250,
      totalApiCalls: 18500,
      averageCustomerHealth: 82,
    };

    this.metricsCache.set(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(
    mspId: string,
    period: "today" | "week" | "month" | "year" = "month"
  ): Promise<RevenueMetrics> {
    const cacheKey = `${mspId}-${period}`;
    const cached = this.revenueCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // In production: calculate from subscription data
    const totalRevenue = this.calculateRevenue(period);
    const mspRevenue = totalRevenue * 0.35; // 35% revenue share

    const metrics: RevenueMetrics = {
      period,
      totalRevenue,
      mspRevenue,
      estimatedMonthlyRecurring: 4500,
      topCustomersByRevenue: [
        {
          customerId: "cust-001",
          customerName: "Acme Corp",
          revenue: 500,
        },
        {
          customerId: "cust-002",
          customerName: "TechStart Inc",
          revenue: 350,
        },
        {
          customerId: "cust-003",
          customerName: "Enterprise Solutions",
          revenue: 300,
        },
      ],
    };

    this.revenueCache.set(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get individual customer metrics
   */
  async getCustomerMetrics(customerId: string): Promise<CustomerMetrics> {
    // In production: query from database
    const metrics: CustomerMetrics = {
      customerId,
      customerName: "Demo Customer",
      health: 85,
      activeUsers: 15,
      monthlyScans: 450,
      apiUsage: 2500,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      riskScore: 25,
      recommendations: [
        "Consider upgrading to Pro tier for advanced features",
        "Enable two-factor authentication for all users",
        "Review and update email forwarding rules",
      ],
    };

    return metrics;
  }

  /**
   * Get growth metrics
   */
  async getGrowthMetrics(mspId: string): Promise<GrowthMetrics> {
    // In production: calculate from historical data
    return {
      newCustomersThisMonth: 3,
      churnedCustomersThisMonth: 0,
      netGrowthRate: 12,
      projectedMonthlyGrowth: 2.5,
      retention: 98.5,
    };
  }

  /**
   * Get customer health report
   */
  async getCustomerHealthReport(
    mspId: string
  ): Promise<Array<{
    customerId: string;
    name: string;
    health: number;
    status: "healthy" | "warning" | "critical";
    issues: string[];
  }>> {
    return [
      {
        customerId: "cust-001",
        name: "Acme Corp",
        health: 95,
        status: "healthy",
        issues: [],
      },
      {
        customerId: "cust-002",
        name: "TechStart Inc",
        health: 72,
        status: "warning",
        issues: [
          "High number of false positives",
          "Low API usage rate",
        ],
      },
      {
        customerId: "cust-003",
        name: "Enterprise Solutions",
        health: 40,
        status: "critical",
        issues: [
          "License expiring in 5 days",
          "Multiple failed login attempts",
          "Quota exceeded",
        ],
      },
    ];
  }

  /**
   * Get actions needed
   */
  async getActionsNeeded(mspId: string): Promise<Array<{
    priority: "high" | "medium" | "low";
    type: string;
    description: string;
    customerId?: string;
    dueDate: Date;
  }>> {
    return [
      {
        priority: "high",
        type: "license_renewal",
        description: "Enterprise Solutions license expires in 5 days",
        customerId: "cust-003",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        priority: "medium",
        type: "upgrade_recommendation",
        description: "Acme Corp should upgrade to Enterprise tier",
        customerId: "cust-001",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        priority: "low",
        type: "training",
        description: "TechStart Inc needs API training",
        customerId: "cust-002",
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  /**
   * Get customer comparison
   */
  async getCustomerComparison(
    mspId: string,
    customerIds: string[]
  ): Promise<Array<{
    customerId: string;
    name: string;
    health: number;
    users: number;
    scans: number;
    apiCalls: number;
    revenue: number;
  }>> {
    return customerIds.map((customerId, index) => ({
      customerId,
      name: `Customer ${index + 1}`,
      health: Math.floor(Math.random() * 100),
      users: Math.floor(Math.random() * 50),
      scans: Math.floor(Math.random() * 5000),
      apiCalls: Math.floor(Math.random() * 50000),
      revenue: Math.floor(Math.random() * 1000),
    }));
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(
    mspId: string,
    metricType: "customers" | "revenue" | "users" | "scans"
  ): Promise<Array<{
    date: Date;
    value: number;
    trend: "up" | "down" | "stable";
  }>> {
    // In production: get from time-series database
    const trends = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      let baseValue = 0;
      switch (metricType) {
        case "customers":
          baseValue = 20;
          break;
        case "revenue":
          baseValue = 3000;
          break;
        case "users":
          baseValue = 100;
          break;
        case "scans":
          baseValue = 3000;
          break;
      }

      const value = baseValue + Math.floor(Math.random() * 50) - 25;
      trends.push({
        date,
        value: Math.max(0, value),
        trend: Math.random() > 0.5 ? "up" : "stable",
      });
    }

    return trends;
  }

  /**
   * Get forecasting data
   */
  async getForecast(
    mspId: string,
    metric: "revenue" | "customers",
    months: number = 3
  ): Promise<Array<{
    month: Date;
    forecast: number;
    confidence: number;
  }>> {
    const forecasts = [];
    const today = new Date();

    for (let i = 1; i <= months; i++) {
      const month = new Date(today);
      month.setMonth(month.getMonth() + i);

      let baseValue = 0;
      switch (metric) {
        case "revenue":
          baseValue = 4500;
          break;
        case "customers":
          baseValue = 25;
          break;
      }

      forecasts.push({
        month,
        forecast: baseValue + Math.floor(Math.random() * 500),
        confidence: 85 - i * 5, // Decreases with time
      });
    }

    return forecasts;
  }

  /**
   * Helper: Calculate new customers for period
   */
  private getNewCustomersForPeriod(period: string): number {
    switch (period) {
      case "today":
        return 0;
      case "week":
        return 2;
      case "month":
        return 3;
      case "year":
        return 15;
      default:
        return 0;
    }
  }

  /**
   * Helper: Calculate revenue for period
   */
  private calculateRevenue(period: string): number {
    switch (period) {
      case "today":
        return 150;
      case "week":
        return 1050;
      case "month":
        return 4500;
      case "year":
        return 54000;
      default:
        return 0;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.metricsCache.clear();
    this.revenueCache.clear();
  }
}

export default MSPDashboard;
