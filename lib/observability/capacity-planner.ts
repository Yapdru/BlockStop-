/**
 * BlockStop Phase 29.5 - Capacity Planner
 * Resource usage trends, forecasting, and scaling recommendations
 * Production-ready implementation
 */

import { EventEmitter } from 'events';

export type ResourceType = 'cpu' | 'memory' | 'storage' | 'network' | 'database';
export type ForecastMethod = 'linear' | 'exponential' | 'seasonal' | 'ml-based';
export type ScalingStrategy = 'vertical' | 'horizontal' | 'auto-scaling';
export type Seasonality = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ResourceUtilization {
  utilizationId: string;
  resourceType: ResourceType;
  timestamp: Date;
  value: number; // percentage 0-100
  capacity: number; // total available
  used: number; // currently used
  threshold?: number; // warning threshold
  peak?: boolean;
}

export interface ResourceTrend {
  trendId: string;
  resourceType: ResourceType;
  measurements: number[]; // Last 30 days or 1 year
  timestamps: Date[];
  averageUtilization: number;
  peakUtilization: number;
  minUtilization: number;
  trend: 'increasing' | 'stable' | 'decreasing' | 'cyclical';
  trendStrength: number; // 0-1
  growthRate: number; // % per day
  seasonality?: Seasonality;
}

export interface CapacityForecast {
  forecastId: string;
  resourceType: ResourceType;
  forecastDate: Date;
  method: ForecastMethod;
  predictions: ForecastPoint[];
  confidenceInterval: {
    upper: number[];
    lower: number[];
  };
  accuracy?: number; // From previous forecasts
  assumptions: string[];
}

export interface ForecastPoint {
  date: Date;
  projectedUtilization: number;
  recommendedCapacity: number;
  confidence: number; // 0-100%
}

export interface ScalingRecommendation {
  recommendationId: string;
  resourceType: ResourceType;
  strategy: ScalingStrategy;
  reason: string;
  currentCapacity: number;
  recommendedCapacity: number;
  timeline: 'immediate' | 'week' | 'month' | 'quarter';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  implementationSteps: string[];
  expectedBenefit: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'implemented';
}

export interface CapacityAlert {
  alertId: string;
  resourceType: ResourceType;
  condition: 'threshold-exceeded' | 'rapid-growth' | 'imbalance' | 'inefficiency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  currentValue: number;
  threshold: number;
  detectedAt: Date;
  enabled: boolean;
  notificationChannels: string[];
}

export interface AutoScalingConfig {
  configId: string;
  resourceType: ResourceType;
  minCapacity: number;
  maxCapacity: number;
  targetUtilization: number; // e.g., 70%
  scaleUpThreshold: number; // e.g., 85%
  scaleDownThreshold: number; // e.g., 20%
  cooldownPeriod: number; // seconds
  metricsWindow: number; // seconds
  enabled: boolean;
  lastScaled?: Date;
}

export interface SpareCapacityWarning {
  warningId: string;
  resourceType: ResourceType;
  currentUtilization: number;
  spareCapeacity: number;
  projectedUtilizationMonth: number;
  daysUntilCapacityExceeded: number;
  recommendation: string;
  createdAt: Date;
}

export class CapacityPlanner extends EventEmitter {
  private utilizations: Map<string, ResourceUtilization[]> = new Map();
  private trends: Map<ResourceType, ResourceTrend> = new Map();
  private forecasts: Map<string, CapacityForecast> = new Map();
  private recommendations: Map<string, ScalingRecommendation> = new Map();
  private alerts: Map<string, CapacityAlert> = new Map();
  private autoScalingConfigs: Map<string, AutoScalingConfig> = new Map();
  private readonly MAX_HISTORY = 1440; // 24 hours at 1-minute intervals for daily, 720 for weekly

  constructor() {
    super();
    this.initializeResourceTracking();
  }

  private initializeResourceTracking(): void {
    const resourceTypes: ResourceType[] = ['cpu', 'memory', 'storage', 'network', 'database'];
    resourceTypes.forEach(type => {
      this.utilizations.set(type, []);
    });
  }

  // Resource Utilization Recording
  recordUtilization(
    resourceType: ResourceType,
    value: number,
    capacity: number,
    threshold?: number
  ): ResourceUtilization {
    const utilization: ResourceUtilization = {
      utilizationId: `util-${Date.now()}-${Math.random()}`,
      resourceType,
      timestamp: new Date(),
      value,
      capacity,
      used: (capacity * value) / 100,
      threshold,
      peak: value > 90
    };

    let history = this.utilizations.get(resourceType);
    if (!history) {
      history = [];
      this.utilizations.set(resourceType, history);
    }

    history.push(utilization);

    // Maintain history size
    if (history.length > this.MAX_HISTORY) {
      history.shift();
    }

    // Update trend
    this.updateTrend(resourceType);

    // Check for capacity alerts
    this.checkCapacityAlerts(utilization);

    // Check auto-scaling
    this.checkAutoScaling(resourceType);

    this.emit('utilization-recorded', utilization);

    return utilization;
  }

  getUtilization(resourceType: ResourceType): ResourceUtilization | undefined {
    const history = this.utilizations.get(resourceType);
    return history && history.length > 0 ? history[history.length - 1] : undefined;
  }

  getUtilizationHistory(resourceType: ResourceType): ResourceUtilization[] {
    return this.utilizations.get(resourceType) || [];
  }

  // Trend Analysis
  private updateTrend(resourceType: ResourceType): void {
    const history = this.utilizations.get(resourceType) || [];
    if (history.length < 2) return;

    const values = history.map(h => h.value);
    const timestamps = history.map(h => h.timestamp);

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const peak = Math.max(...values);
    const min = Math.min(...values);

    // Calculate trend
    const recentValues = values.slice(-10);
    const olderValues = values.slice(0, Math.max(1, values.length - 20));

    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;

    let trend: ResourceTrend['trend'] = 'stable';
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    }

    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Detect seasonality
    const seasonality = this.detectSeasonality(values);

    const trend_obj: ResourceTrend = {
      trendId: `trend-${resourceType}-${Date.now()}`,
      resourceType,
      measurements: values,
      timestamps,
      averageUtilization: avg,
      peakUtilization: peak,
      minUtilization: min,
      trend,
      trendStrength: Math.abs(growthRate) / 100,
      growthRate,
      seasonality
    };

    this.trends.set(resourceType, trend_obj);
    this.emit('trend-updated', trend_obj);
  }

  private detectSeasonality(values: number[]): Seasonality | undefined {
    if (values.length < 168) return undefined; // Need at least a week of hourly data

    // Simple detection: check for weekly pattern
    const weeklyDiffs = [];
    for (let i = 168; i < values.length; i++) {
      weeklyDiffs.push(Math.abs(values[i] - values[i - 168]));
    }

    const avgWeeklyDiff = weeklyDiffs.reduce((a, b) => a + b, 0) / weeklyDiffs.length;
    const overallStd = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - (values.reduce((a, b) => a + b, 0) / values.length), 2), 0) / values.length);

    if (avgWeeklyDiff < overallStd * 0.3) {
      return 'weekly';
    }

    return undefined;
  }

  getTrend(resourceType: ResourceType): ResourceTrend | undefined {
    return this.trends.get(resourceType);
  }

  // Forecasting
  generateForecast(resourceType: ResourceType, days: number = 30, method: ForecastMethod = 'linear'): CapacityForecast {
    const history = this.utilizations.get(resourceType) || [];
    if (history.length < 2) {
      throw new Error(`Insufficient data to forecast ${resourceType}`);
    }

    const values = history.map(h => h.value);
    const predictions = this.predictCapacity(values, days, method);

    const forecast: CapacityForecast = {
      forecastId: `forecast-${resourceType}-${Date.now()}`,
      resourceType,
      forecastDate: new Date(),
      method,
      predictions,
      confidenceInterval: {
        upper: predictions.map(p => Math.min(100, p.projectedUtilization + 5)),
        lower: predictions.map(p => Math.max(0, p.projectedUtilization - 5))
      },
      assumptions: [
        `Based on ${values.length} historical measurements`,
        'Assumes current usage patterns continue',
        'Does not account for scheduled deployments'
      ]
    };

    this.forecasts.set(forecast.forecastId, forecast);
    this.emit('forecast-generated', forecast);

    return forecast;
  }

  private predictCapacity(
    values: number[],
    days: number,
    method: ForecastMethod
  ): ForecastPoint[] {
    const predictions: ForecastPoint[] = [];
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;

    let slope = 0;
    if (method === 'linear' || method === 'exponential') {
      const indices = Array.from({ length: n }, (_, i) => i);
      let sumXY = 0;
      let sumX2 = 0;

      for (let i = 0; i < n; i++) {
        sumXY += indices[i] * values[i];
        sumX2 += indices[i] * indices[i];
      }

      slope = (sumXY - (n * mean * (n - 1) / 2)) / (sumX2 - (n * Math.pow(n - 1, 2) / 4));
    }

    for (let i = 1; i <= days; i++) {
      let projectedValue = mean + (slope * i);

      if (method === 'exponential') {
        const growthRate = slope / mean;
        projectedValue = mean * Math.pow(1 + growthRate, i);
      }

      projectedValue = Math.max(0, Math.min(100, projectedValue));

      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        projectedUtilization: projectedValue,
        recommendedCapacity: this.calculateRecommendedCapacity(projectedValue),
        confidence: 100 - (i * 2) // Decreases with time
      });
    }

    return predictions;
  }

  private calculateRecommendedCapacity(projectedUtilization: number): number {
    // Recommend 20% headroom
    return Math.ceil(projectedUtilization * 1.2);
  }

  // Recommendations
  generateScalingRecommendations(resourceType: ResourceType): ScalingRecommendation[] {
    const recommendations: ScalingRecommendation[] = [];
    const currentUtil = this.getUtilization(resourceType);
    const trend = this.getTrend(resourceType);
    const forecast = this.forecasts.get(`forecast-${resourceType}`);

    if (!currentUtil || !trend) return recommendations;

    // High utilization immediate scaling
    if (currentUtil.value > 85) {
      recommendations.push({
        recommendationId: `rec-${Date.now()}-1`,
        resourceType,
        strategy: 'horizontal',
        reason: `Current ${resourceType} utilization is ${currentUtil.value}%, exceeding 85% threshold`,
        currentCapacity: currentUtil.capacity,
        recommendedCapacity: currentUtil.capacity * 1.5,
        timeline: 'immediate',
        priority: 'critical',
        estimatedCost: currentUtil.capacity * 0.5 * 10, // Rough estimate
        implementationSteps: [
          `Add more ${resourceType} resources`,
          'Monitor for stabilization',
          'Adjust auto-scaling policies'
        ],
        expectedBenefit: 'Prevent service degradation',
        createdAt: new Date(),
        status: 'pending'
      });
    }

    // Trend-based recommendations
    if (trend.trend === 'increasing' && trend.growthRate > 5) {
      recommendations.push({
        recommendationId: `rec-${Date.now()}-2`,
        resourceType,
        strategy: 'auto-scaling',
        reason: `${resourceType} showing strong growth trend (${trend.growthRate.toFixed(1)}% per day)`,
        currentCapacity: currentUtil.capacity,
        recommendedCapacity: currentUtil.capacity * 1.3,
        timeline: 'week',
        priority: 'high',
        estimatedCost: currentUtil.capacity * 0.3 * 10,
        implementationSteps: [
          'Enable auto-scaling if not already enabled',
          'Set scale-up threshold to 70%',
          'Set scale-down threshold to 30%'
        ],
        expectedBenefit: 'Automatic capacity adjustment',
        createdAt: new Date(),
        status: 'pending'
      });
    }

    // Low utilization optimization
    if (currentUtil.value < 20 && currentUtil.capacity > 100) {
      recommendations.push({
        recommendationId: `rec-${Date.now()}-3`,
        resourceType,
        strategy: 'vertical',
        reason: `${resourceType} severely underutilized (${currentUtil.value}%)`,
        currentCapacity: currentUtil.capacity,
        recommendedCapacity: currentUtil.capacity * 0.5,
        timeline: 'month',
        priority: 'low',
        estimatedCost: -currentUtil.capacity * 0.5 * 10, // Negative = savings
        implementationSteps: [
          `Reduce ${resourceType} allocation`,
          'Monitor application performance',
          'Adjust if needed'
        ],
        expectedBenefit: `${(currentUtil.capacity * 0.5 * 10).toFixed(0)} monthly savings`,
        createdAt: new Date(),
        status: 'pending'
      });
    }

    this.recommendations.forEach(rec => {
      if (rec.resourceType === resourceType) {
        recommendations.push(rec);
      }
    });

    return recommendations;
  }

  getRecommendation(recommendationId: string): ScalingRecommendation | undefined {
    return this.recommendations.get(recommendationId);
  }

  approveRecommendation(recommendationId: string): void {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.status = 'approved';
      this.emit('recommendation-approved', rec);
    }
  }

  implementRecommendation(recommendationId: string): void {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.status = 'implemented';
      this.emit('recommendation-implemented', rec);
    }
  }

  // Auto-Scaling Configuration
  configureAutoScaling(config: Omit<AutoScalingConfig, 'configId'>): AutoScalingConfig {
    const autoScale: AutoScalingConfig = {
      configId: `as-${Date.now()}`,
      ...config
    };

    this.autoScalingConfigs.set(autoScale.configId, autoScale);
    this.emit('autoscaling-configured', autoScale);

    return autoScale;
  }

  private checkAutoScaling(resourceType: ResourceType): void {
    const util = this.getUtilization(resourceType);
    if (!util) return;

    this.autoScalingConfigs.forEach(config => {
      if (!config.enabled || config.resourceType !== resourceType) return;

      if (util.value > config.scaleUpThreshold) {
        this.emit('auto-scale-up-triggered', {
          configId: config.configId,
          resourceType,
          currentUtilization: util.value,
          recommendedCapacity: config.maxCapacity
        });

        config.lastScaled = new Date();
      } else if (util.value < config.scaleDownThreshold && Date.now() - (config.lastScaled?.getTime() || 0) > config.cooldownPeriod * 1000) {
        this.emit('auto-scale-down-triggered', {
          configId: config.configId,
          resourceType,
          currentUtilization: util.value,
          recommendedCapacity: config.minCapacity
        });

        config.lastScaled = new Date();
      }
    });
  }

  // Capacity Alerts
  private checkCapacityAlerts(utilization: ResourceUtilization): void {
    if (!utilization.threshold) return;

    const alerts = Array.from(this.alerts.values()).filter(
      a => a.resourceType === utilization.resourceType && a.enabled
    );

    alerts.forEach(alert => {
      const shouldTrigger = this.evaluateAlertCondition(utilization, alert);

      if (shouldTrigger) {
        this.emit('capacity-alert-triggered', {
          alertId: alert.alertId,
          resourceType: alert.resourceType,
          severity: alert.severity,
          currentUtilization: utilization.value,
          notificationChannels: alert.notificationChannels
        });
      }
    });
  }

  private evaluateAlertCondition(utilization: ResourceUtilization, alert: CapacityAlert): boolean {
    switch (alert.condition) {
      case 'threshold-exceeded':
        return utilization.value > alert.threshold;
      case 'rapid-growth':
        // Would need trend data
        return false;
      case 'imbalance':
        return Math.abs(utilization.value - 50) > 40;
      case 'inefficiency':
        return utilization.value < 20;
      default:
        return false;
    }
  }

  createAlert(alert: Omit<CapacityAlert, 'alertId' | 'detectedAt'>): CapacityAlert {
    const capacityAlert: CapacityAlert = {
      alertId: `alert-${Date.now()}`,
      detectedAt: new Date(),
      ...alert
    };

    this.alerts.set(capacityAlert.alertId, capacityAlert);
    return capacityAlert;
  }

  // What-If Analysis
  projectCapacityNeeds(resourceType: ResourceType, growthRate: number, months: number): Record<string, number> {
    const currentUtil = this.getUtilization(resourceType);
    if (!currentUtil) return {};

    const projections: Record<string, number> = {
      current: currentUtil.capacity,
      '1month': 0,
      '3months': 0,
      '6months': 0,
      '12months': 0
    };

    for (let m = 1; m <= months; m++) {
      projections[`${m}month`] = currentUtil.capacity * Math.pow(1 + growthRate / 100, m);
    }

    return projections;
  }

  // Utility
  getStatistics(): Record<string, any> {
    return {
      resourceTypesTracked: this.utilizations.size,
      trendsCalculated: this.trends.size,
      forecastsGenerated: this.forecasts.size,
      recommendations: this.recommendations.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.enabled).length,
      autoScalingConfigs: Array.from(this.autoScalingConfigs.values()).filter(a => a.enabled).length
    };
  }
}

export default CapacityPlanner;
