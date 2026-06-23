/**
 * Advanced Analytics Engine for PRO Tier
 * Provides threat analytics, trend analysis, anomaly detection, and insights
 */

import { TrendAnalysis, TrendDataPoint, DateRange, AnomalyDetection, ForecastData } from '@/types/pro-tier';

export class AdvancedAnalyticsEngine {
  /**
   * Generate threat trend analysis
   */
  static async generateTrendAnalysis(
    metric: string,
    dateRange: DateRange,
    dataPoints: TrendDataPoint[]
  ): Promise<TrendAnalysis> {
    // Calculate trend direction and strength
    const trend = this.calculateTrend(dataPoints);
    const trendStrength = this.calculateTrendStrength(dataPoints);

    // Detect anomalies
    const anomalies = this.detectAnomalies(dataPoints);

    // Generate forecast
    const forecast = this.generateForecast(dataPoints, dateRange);

    return {
      metric,
      period: dateRange,
      dataPoints,
      trend,
      trendStrength,
      anomalies,
      forecast,
    };
  }

  /**
   * Calculate trend direction
   */
  private static calculateTrend(
    dataPoints: TrendDataPoint[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (dataPoints.length < 2) {
      return 'stable';
    }

    const values = dataPoints.map((p) => p.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

    const change = avgSecond - avgFirst;
    const changePercent = (change / avgFirst) * 100;

    if (changePercent > 5) {
      return 'increasing';
    } else if (changePercent < -5) {
      return 'decreasing';
    }
    return 'stable';
  }

  /**
   * Calculate trend strength (0-100)
   */
  private static calculateTrendStrength(dataPoints: TrendDataPoint[]): number {
    if (dataPoints.length < 2) {
      return 0;
    }

    const values = dataPoints.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate R-squared for trend line
    const xValues = Array.from({ length: values.length }, (_, i) => i);
    const xMean = xValues.reduce((a, b) => a + b) / xValues.length;
    const yMean = mean;

    const ssRes = values.reduce(
      (sum, y, i) => sum + Math.pow(y - (xMean + i * (yMean / xMean)), 2),
      0
    );
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);

    const rSquared = 1 - ssRes / ssTot;
    return Math.round(Math.max(0, Math.min(100, rSquared * 100)));
  }

  /**
   * Detect anomalies in data
   */
  private static detectAnomalies(dataPoints: TrendDataPoint[]): AnomalyDetection[] {
    if (dataPoints.length < 3) {
      return [];
    }

    const values = dataPoints.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: AnomalyDetection[] = [];
    const threshold = 2; // 2 standard deviations

    dataPoints.forEach((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);

      if (zScore > threshold) {
        const severity =
          zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : ('low' as const);

        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          baseline: mean,
          deviation: point.value - mean,
          severity,
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate forecast for future periods
   */
  private static generateForecast(
    dataPoints: TrendDataPoint[],
    dateRange: DateRange,
    periods: number = 5
  ): ForecastData[] {
    if (dataPoints.length < 2) {
      return [];
    }

    const values = dataPoints.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Simple exponential smoothing for forecast
    const alpha = 0.3;
    let forecast = values[values.length - 1];
    const forecasts: ForecastData[] = [];

    const intervalMs = dateRange.granularity === 'daily' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    let currentDate = new Date(dataPoints[dataPoints.length - 1].timestamp);

    for (let i = 0; i < periods; i++) {
      currentDate = new Date(currentDate.getTime() + intervalMs);
      forecast = alpha * values[values.length - 1] + (1 - alpha) * forecast;

      forecasts.push({
        timestamp: currentDate,
        predictedValue: Math.round(forecast),
        confidenceInterval: {
          lower: Math.round(forecast - 1.96 * stdDev),
          upper: Math.round(forecast + 1.96 * stdDev),
        },
      });
    }

    return forecasts;
  }

  /**
   * Analyze threat patterns and correlation
   */
  static async analyzeThreatPatterns(
    threats: Array<{ timestamp: Date; severity: string; type: string }>
  ): Promise<{
    patterns: Array<{ pattern: string; count: number; severity: string }>;
    correlations: Array<{ threat1: string; threat2: string; correlation: number }>;
    insights: string[];
  }> {
    // Group threats by type and count
    const threatMap = new Map<string, number>();
    const severityMap = new Map<string, string>();

    threats.forEach((threat) => {
      const key = threat.type;
      threatMap.set(key, (threatMap.get(key) || 0) + 1);
      severityMap.set(key, threat.severity);
    });

    const patterns = Array.from(threatMap.entries())
      .map(([pattern, count]) => ({
        pattern,
        count,
        severity: severityMap.get(pattern) || 'unknown',
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate threat correlations
    const correlations = this.calculateThreatCorrelations(threats);

    // Generate insights
    const insights = this.generateThreatInsights(patterns, correlations);

    return {
      patterns,
      correlations,
      insights,
    };
  }

  /**
   * Calculate correlations between different threats
   */
  private static calculateThreatCorrelations(
    threats: Array<{ timestamp: Date; severity: string; type: string }>
  ): Array<{ threat1: string; threat2: string; correlation: number }> {
    const threatTypes = Array.from(new Set(threats.map((t) => t.type)));
    const correlations: Array<{ threat1: string; threat2: string; correlation: number }> = [];

    for (let i = 0; i < threatTypes.length; i++) {
      for (let j = i + 1; j < threatTypes.length; j++) {
        const threat1Events = threats.filter((t) => t.type === threatTypes[i]);
        const threat2Events = threats.filter((t) => t.type === threatTypes[j]);

        const correlation = this.calculateEventCorrelation(threat1Events, threat2Events);

        if (correlation > 0.3) {
          correlations.push({
            threat1: threatTypes[i],
            threat2: threatTypes[j],
            correlation: Math.round(correlation * 100) / 100,
          });
        }
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation).slice(0, 10);
  }

  /**
   * Calculate correlation between two event sequences
   */
  private static calculateEventCorrelation(
    events1: Array<{ timestamp: Date }>,
    events2: Array<{ timestamp: Date }>
  ): number {
    if (events1.length === 0 || events2.length === 0) {
      return 0;
    }

    let matches = 0;
    const windowMs = 5 * 60 * 1000; // 5-minute window

    events1.forEach((e1) => {
      const found = events2.some(
        (e2) => Math.abs(e1.timestamp.getTime() - e2.timestamp.getTime()) < windowMs
      );
      if (found) {
        matches++;
      }
    });

    return matches / Math.max(events1.length, events2.length);
  }

  /**
   * Generate insights from threat patterns
   */
  private static generateThreatInsights(
    patterns: Array<{ pattern: string; count: number; severity: string }>,
    correlations: Array<{ threat1: string; threat2: string; correlation: number }>
  ): string[] {
    const insights: string[] = [];

    // Top threat insight
    if (patterns.length > 0) {
      const topThreat = patterns[0];
      insights.push(
        `${topThreat.pattern} is the most frequent threat with ${topThreat.count} occurrences`
      );
    }

    // Critical threats insight
    const criticalThreats = patterns.filter((p) => p.severity === 'critical');
    if (criticalThreats.length > 0) {
      insights.push(
        `${criticalThreats.length} critical threat(s) detected that require immediate action`
      );
    }

    // Correlation insights
    if (correlations.length > 0) {
      const topCorrelation = correlations[0];
      insights.push(
        `${topCorrelation.threat1} and ${topCorrelation.threat2} are strongly correlated (${Math.round(topCorrelation.correlation * 100)}%)`
      );
    }

    // Time-based insights
    const avgThreatsPerPattern = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.count, 0) / patterns.length
      : 0;
    if (avgThreatsPerPattern > 5) {
      insights.push('Threat activity is above normal baseline - escalation recommended');
    }

    return insights;
  }

  /**
   * Calculate risk score based on multiple factors
   */
  static calculateRiskScore(params: {
    threatCount: number;
    criticalCount: number;
    highCount: number;
    averageResponseTime: number;
    recentEscalations: number;
  }): number {
    const {
      threatCount,
      criticalCount,
      highCount,
      averageResponseTime,
      recentEscalations,
    } = params;

    let score = 0;

    // Critical threat factor (0-40 points)
    score += Math.min(40, criticalCount * 10);

    // High threat factor (0-25 points)
    score += Math.min(25, highCount * 2.5);

    // Response time factor (0-20 points)
    if (averageResponseTime > 3600000) {
      score += 20;
    } else if (averageResponseTime > 1800000) {
      score += 15;
    } else if (averageResponseTime > 600000) {
      score += 10;
    }

    // Escalation factor (0-15 points)
    score += Math.min(15, recentEscalations * 3);

    return Math.min(100, Math.round(score));
  }

  /**
   * Get comparative analysis between time periods
   */
  static async getComparativeAnalysis(
    currentPeriod: TrendDataPoint[],
    previousPeriod: TrendDataPoint[]
  ): Promise<{
    currentAverage: number;
    previousAverage: number;
    changePercent: number;
    improvementTrend: 'improving' | 'degrading' | 'stable';
  }> {
    const currentAvg = currentPeriod.reduce((sum, p) => sum + p.value, 0) / currentPeriod.length;
    const previousAvg = previousPeriod.reduce((sum, p) => sum + p.value, 0) / previousPeriod.length;

    const changePercent = ((currentAvg - previousAvg) / previousAvg) * 100;

    let improvementTrend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (changePercent < -5) {
      improvementTrend = 'improving';
    } else if (changePercent > 5) {
      improvementTrend = 'degrading';
    }

    return {
      currentAverage: Math.round(currentAvg),
      previousAverage: Math.round(previousAvg),
      changePercent: Math.round(changePercent * 10) / 10,
      improvementTrend,
    };
  }
}

/**
 * Export analytics functions for direct use
 */
export const generateTrendAnalysis = AdvancedAnalyticsEngine.generateTrendAnalysis.bind(
  AdvancedAnalyticsEngine
);
export const analyzeThreatPatterns = AdvancedAnalyticsEngine.analyzeThreatPatterns.bind(
  AdvancedAnalyticsEngine
);
export const calculateRiskScore = AdvancedAnalyticsEngine.calculateRiskScore.bind(
  AdvancedAnalyticsEngine
);
export const getComparativeAnalysis = AdvancedAnalyticsEngine.getComparativeAnalysis.bind(
  AdvancedAnalyticsEngine
);
