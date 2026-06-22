/**
 * BlockStop Phase 29.5 - Cost Monitor
 * Cloud resource cost tracking and optimization
 * Supports AWS, GCP, Azure
 * Production-ready implementation
 */

import { EventEmitter } from 'events';

export type CloudProvider = 'aws' | 'gcp' | 'azure';
export type ResourceType = 'compute' | 'storage' | 'database' | 'network' | 'cdn' | 'ml' | 'analytics' | 'monitoring';
export type PricingModel = 'on-demand' | 'reserved' | 'spot' | 'committed';
export type CostAnomaly = 'spike' | 'drop' | 'trend_change';

export interface CloudCost {
  costId: string;
  provider: CloudProvider;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  date: Date;
  cost: number; // USD
  currency: string;
  usageQuantity: number;
  usageUnit: string;
  pricingModel: PricingModel;
  region?: string;
  accountId?: string;
  tags?: Record<string, string>;
}

export interface CostBreakdown {
  provider: CloudProvider;
  totalCost: number; // USD
  byResourceType: Map<ResourceType, number>;
  byRegion: Map<string, number>;
  byPricingModel: Map<PricingModel, number>;
  periodStart: Date;
  periodEnd: Date;
}

export interface CostForecast {
  forecastId: string;
  provider: CloudProvider;
  forecastDate: Date;
  forecastPeriod: 'week' | 'month' | 'quarter' | 'year';
  projectedCost: number; // USD
  confidence: number; // 0-100%
  baselineAverage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercent: number; // % change
  assumptions: string[];
}

export interface BudgetAlert {
  alertId: string;
  provider: CloudProvider;
  name: string;
  budgetLimit: number; // USD
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  thresholdPercent: number; // Alert at 80% of budget
  currentSpend: number;
  enabled: boolean;
  notificationChannels: string[];
  lastTriggered?: Date;
}

export interface CostOptimization {
  optimizationId: string;
  provider: CloudProvider;
  type: 'right-size' | 'reserved-instance' | 'spot-instance' | 'cleanup' | 'consolidation';
  resourceId: string;
  currentCost: number;
  projectedSavings: number;
  savingsPercent: number;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementationEffort: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  status: 'identified' | 'recommended' | 'approved' | 'implemented';
}

export interface ResourceCost {
  resourceId: string;
  resourceName: string;
  provider: CloudProvider;
  type: ResourceType;
  costPerMonth: number;
  costPerDay: number;
  costTrend: number[]; // Last 30 days
  usageMetrics: Record<string, number>;
  lastUpdated: Date;
  owner?: string;
  department?: string;
  costCenter?: string;
}

export interface CostAnomalyDetection {
  anomalyId: string;
  provider: CloudProvider;
  detectedAt: Date;
  anomalyType: CostAnomaly;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  baselineAmount: number;
  anomalousAmount: number;
  percentChange: number;
  affectedResources: string[];
  rootCause?: string;
  recommendation?: string;
}

export interface ReservedInstanceRecommendation {
  recommendationId: string;
  provider: CloudProvider;
  instanceType: string;
  region: string;
  currentUsage: number; // units
  recommendedReservation: number;
  onDemandCost: number;
  reservedCostOneYear: number;
  reservedCostThreeYear: number;
  savingsOneYear: number;
  savingsThreeYear: number;
  paybackPeriodDays: number;
  confidence: number; // %
}

export class CostMonitor extends EventEmitter {
  private costs: Map<string, CloudCost> = new Map();
  private forecasts: Map<string, CostForecast> = new Map();
  private budgets: Map<string, BudgetAlert> = new Map();
  private optimizations: Map<string, CostOptimization> = new Map();
  private anomalies: Map<string, CostAnomalyDetection> = new Map();
  private riRecommendations: Map<string, ReservedInstanceRecommendation> = new Map();
  private dailyHistory: Map<string, number[]> = new Map(); // provider -> daily costs

  constructor() {
    super();
    this.startMonitoring();
  }

  // Cost Recording
  recordCost(cost: Omit<CloudCost, 'costId'>): CloudCost {
    const cloudCost: CloudCost = {
      costId: `cost-${Date.now()}-${Math.random()}`,
      ...cost
    };

    this.costs.set(cloudCost.costId, cloudCost);

    // Track daily history
    const key = `${cost.provider}-${cost.date.toISOString().split('T')[0]}`;
    if (!this.dailyHistory.has(key)) {
      this.dailyHistory.set(key, []);
    }
    this.dailyHistory.get(key)!.push(cost.cost);

    // Check for anomalies
    this.detectAnomalies(cloudCost);

    // Check budgets
    this.checkBudgets(cost.provider);

    this.emit('cost-recorded', cloudCost);

    return cloudCost;
  }

  getCost(costId: string): CloudCost | undefined {
    return this.costs.get(costId);
  }

  getCostsByProvider(provider: CloudProvider): CloudCost[] {
    return Array.from(this.costs.values()).filter(c => c.provider === provider);
  }

  getCostsByResourceType(resourceType: ResourceType): CloudCost[] {
    return Array.from(this.costs.values()).filter(c => c.resourceType === resourceType);
  }

  // Cost Analysis
  getBreakdown(provider: CloudProvider, startDate: Date, endDate: Date): CostBreakdown {
    const costs = Array.from(this.costs.values()).filter(
      c => c.provider === provider && c.date >= startDate && c.date <= endDate
    );

    const byResourceType = new Map<ResourceType, number>();
    const byRegion = new Map<string, number>();
    const byPricingModel = new Map<PricingModel, number>();
    let totalCost = 0;

    costs.forEach(cost => {
      totalCost += cost.cost;

      const rtCost = byResourceType.get(cost.resourceType) || 0;
      byResourceType.set(cost.resourceType, rtCost + cost.cost);

      if (cost.region) {
        const rCost = byRegion.get(cost.region) || 0;
        byRegion.set(cost.region, rCost + cost.cost);
      }

      const pmCost = byPricingModel.get(cost.pricingModel) || 0;
      byPricingModel.set(cost.pricingModel, pmCost + cost.cost);
    });

    return {
      provider,
      totalCost,
      byResourceType,
      byRegion,
      byPricingModel,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  getResourceCosts(provider: CloudProvider): ResourceCost[] {
    const resourceMap = new Map<string, ResourceCost>();

    Array.from(this.costs.values())
      .filter(c => c.provider === provider && c.date.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
      .forEach(cost => {
        const key = cost.resourceId;

        if (!resourceMap.has(key)) {
          resourceMap.set(key, {
            resourceId: cost.resourceId,
            resourceName: cost.resourceName,
            provider,
            type: cost.resourceType,
            costPerMonth: 0,
            costPerDay: 0,
            costTrend: [],
            usageMetrics: {},
            lastUpdated: new Date(),
            owner: cost.tags?.['owner'],
            department: cost.tags?.['department'],
            costCenter: cost.tags?.['cost-center']
          });
        }

        const resourceCost = resourceMap.get(key)!;
        resourceCost.costPerMonth += cost.cost;
        resourceCost.costPerDay = resourceCost.costPerMonth / 30;
        resourceCost.usageMetrics[cost.usageUnit] = cost.usageQuantity;
      });

    return Array.from(resourceMap.values())
      .sort((a, b) => b.costPerMonth - a.costPerMonth);
  }

  // Forecasting
  generateForecast(provider: CloudProvider, period: CostForecast['forecastPeriod'] = 'month'): CostForecast {
    const pastCosts = Array.from(this.costs.values())
      .filter(c => c.provider === provider && c.date.getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000)
      .map(c => c.cost);

    const baseline = pastCosts.length > 0
      ? pastCosts.reduce((a, b) => a + b, 0) / pastCosts.length
      : 0;

    // Simple linear regression for trend
    const trend = this.calculateTrend(pastCosts);
    const trendPercent = trend > 0 ? (trend / baseline) * 100 : 0;

    const periodMultiplier = period === 'week' ? 1 : period === 'month' ? 4 : period === 'quarter' ? 13 : 52;

    const forecast: CostForecast = {
      forecastId: `forecast-${Date.now()}`,
      provider,
      forecastDate: new Date(),
      forecastPeriod: period,
      projectedCost: baseline * periodMultiplier * (1 + trendPercent / 100),
      confidence: Math.min(100, 50 + pastCosts.length * 2),
      baselineAverage: baseline,
      trend: trendPercent > 5 ? 'increasing' : trendPercent < -5 ? 'decreasing' : 'stable',
      trendPercent,
      assumptions: [
        `Based on ${pastCosts.length} historical data points`,
        'Assumes current usage patterns continue',
        'Does not account for planned changes'
      ]
    };

    this.forecasts.set(forecast.forecastId, forecast);
    this.emit('forecast-generated', forecast);

    return forecast;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const indices = Array.from({ length: n }, (_, i) => i);

    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumXY += indices[i] * values[i];
      sumX2 += indices[i] * indices[i];
    }

    const slope = (sumXY - (n * mean * (n - 1) / 2)) / (sumX2 - (n * Math.pow(n - 1, 2) / 4));

    return slope;
  }

  // Anomaly Detection
  private detectAnomalies(cost: CloudCost): void {
    const key = `${cost.provider}-${cost.resourceType}`;
    const history = Array.from(this.costs.values())
      .filter(c => c.provider === cost.provider && c.resourceType === cost.resourceType)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(c => c.cost)
      .slice(-30); // Last 30 entries

    if (history.length < 5) return;

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const std = Math.sqrt(history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length);

    const zScore = Math.abs((cost.cost - mean) / std);

    if (zScore > 2.5) {
      const anomaly: CostAnomalyDetection = {
        anomalyId: `anomaly-${Date.now()}`,
        provider: cost.provider,
        detectedAt: new Date(),
        anomalyType: cost.cost > mean ? 'spike' : 'drop',
        severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
        description: `${cost.resourceType} cost ${cost.cost > mean ? 'increased' : 'decreased'} abnormally`,
        baselineAmount: mean,
        anomalousAmount: cost.cost,
        percentChange: ((cost.cost - mean) / mean) * 100,
        affectedResources: [cost.resourceId],
        recommendation: cost.cost > mean
          ? 'Review recent resource usage changes'
          : 'Verify resource is still needed'
      };

      this.anomalies.set(anomaly.anomalyId, anomaly);
      this.emit('cost-anomaly-detected', anomaly);
    }
  }

  getAnomalies(provider?: CloudProvider): CostAnomalyDetection[] {
    let anomalies = Array.from(this.anomalies.values());

    if (provider) {
      anomalies = anomalies.filter(a => a.provider === provider);
    }

    return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  // Budget Management
  createBudget(budget: Omit<BudgetAlert, 'alertId' | 'lastTriggered' | 'currentSpend'>): BudgetAlert {
    const budgetAlert: BudgetAlert = {
      alertId: `budget-${Date.now()}`,
      currentSpend: 0,
      ...budget
    };

    this.budgets.set(budgetAlert.alertId, budgetAlert);
    this.emit('budget-created', budgetAlert);

    return budgetAlert;
  }

  private checkBudgets(provider: CloudProvider): void {
    this.budgets.forEach(budget => {
      if (!budget.enabled || budget.provider !== provider) return;

      const periodCosts = this.getPeriodCosts(provider, budget.period);
      budget.currentSpend = periodCosts;

      const percentOfBudget = (periodCosts / budget.budgetLimit) * 100;

      if (percentOfBudget >= budget.thresholdPercent) {
        budget.lastTriggered = new Date();

        this.emit('budget-threshold-exceeded', {
          alertId: budget.alertId,
          budgetName: budget.name,
          currentSpend: periodCosts,
          budgetLimit: budget.budgetLimit,
          percentOfBudget,
          notificationChannels: budget.notificationChannels
        });
      }
    });
  }

  private getPeriodCosts(provider: CloudProvider, period: BudgetAlert['period']): number {
    const now = new Date();
    let startDate = new Date(now);

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return Array.from(this.costs.values())
      .filter(c => c.provider === provider && c.date >= startDate)
      .reduce((sum, c) => sum + c.cost, 0);
  }

  getBudgets(provider?: CloudProvider): BudgetAlert[] {
    let budgets = Array.from(this.budgets.values());

    if (provider) {
      budgets = budgets.filter(b => b.provider === provider);
    }

    return budgets;
  }

  // Optimization
  generateOptimizations(provider: CloudProvider): CostOptimization[] {
    const optimizations: CostOptimization[] = [];
    const costs = this.getResourceCosts(provider);

    // Right-sizing recommendations
    costs.slice(0, 10).forEach((resource, idx) => {
      optimizations.push({
        optimizationId: `opt-${Date.now()}-${idx}`,
        provider,
        type: 'right-size',
        resourceId: resource.resourceId,
        currentCost: resource.costPerMonth,
        projectedSavings: resource.costPerMonth * 0.3,
        savingsPercent: 30,
        recommendation: `Right-size ${resource.resourceName} to smaller instance type`,
        priority: idx < 3 ? 'high' : 'medium',
        implementationEffort: 'easy',
        createdAt: new Date(),
        status: 'identified'
      });
    });

    // Reserved instance recommendations
    costs.filter(c => c.type === 'compute').slice(0, 5).forEach((resource, idx) => {
      optimizations.push({
        optimizationId: `opt-${Date.now()}-ri-${idx}`,
        provider,
        type: 'reserved-instance',
        resourceId: resource.resourceId,
        currentCost: resource.costPerMonth * 12,
        projectedSavings: (resource.costPerMonth * 12) * 0.4,
        savingsPercent: 40,
        recommendation: `Purchase 1-year reserved instance for ${resource.resourceName}`,
        priority: 'high',
        implementationEffort: 'medium',
        createdAt: new Date(),
        status: 'identified'
      });
    });

    // Unused resource cleanup
    const unusedResources = costs.filter(c => c.usageMetrics['cpu'] < 5 || c.usageMetrics['memory'] < 10);
    unusedResources.slice(0, 5).forEach((resource, idx) => {
      optimizations.push({
        optimizationId: `opt-${Date.now()}-cleanup-${idx}`,
        provider,
        type: 'cleanup',
        resourceId: resource.resourceId,
        currentCost: resource.costPerMonth,
        projectedSavings: resource.costPerMonth * 0.95,
        savingsPercent: 95,
        recommendation: `Terminate unused resource: ${resource.resourceName}`,
        priority: 'critical',
        implementationEffort: 'easy',
        createdAt: new Date(),
        status: 'identified'
      });
    });

    this.optimizations.forEach(opt => optimizations.push(opt));

    return optimizations.sort((a, b) => b.priority === a.priority ? 0 : b.priority === 'critical' ? 1 : -1);
  }

  getOptimizations(provider?: CloudProvider, status?: CostOptimization['status']): CostOptimization[] {
    let opts = Array.from(this.optimizations.values());

    if (provider) {
      opts = opts.filter(o => o.provider === provider);
    }

    if (status) {
      opts = opts.filter(o => o.status === status);
    }

    return opts;
  }

  // Reserved Instance Recommendations
  getReservedInstanceRecommendations(provider: CloudProvider): ReservedInstanceRecommendation[] {
    return Array.from(this.riRecommendations.values()).filter(r => r.provider === provider);
  }

  // Monitoring
  private startMonitoring(): void {
    // Generate forecasts daily
    setInterval(() => {
      ['aws', 'gcp', 'azure'].forEach(provider => {
        this.generateForecast(provider as CloudProvider, 'month');
      });
    }, 24 * 60 * 60 * 1000);

    // Check budgets hourly
    setInterval(() => {
      this.budgets.forEach(budget => {
        this.checkBudgets(budget.provider);
      });
    }, 60 * 60 * 1000);
  }

  getStatistics(): Record<string, any> {
    return {
      totalCosts: this.costs.size,
      uniqueResources: new Set(Array.from(this.costs.values()).map(c => c.resourceId)).size,
      totalMonthlySpend: this.getCostsByProvider('aws').reduce((sum, c) => sum + c.cost, 0),
      anomaliesDetected: this.anomalies.size,
      activeBudgets: Array.from(this.budgets.values()).filter(b => b.enabled).length,
      optimizationOpportunities: this.optimizations.size,
      potentialSavings: Array.from(this.optimizations.values()).reduce((sum, o) => sum + o.projectedSavings, 0)
    };
  }
}

export default CostMonitor;
