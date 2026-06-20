import { TrendIndicator } from './types';
import { calculateStdDev, calculateTimeDecay } from './utils';

export class ThreatTrendingEngine {
  private trends: Map<string, TrendIndicator[]> = new Map();

  addTrendData(threatId: string, metric: string, value: number, timestamp: Date = new Date()): void {
    const key = `${threatId}:${metric}`;
    if (!this.trends.has(key)) {
      this.trends.set(key, []);
    }

    const indicators = this.trends.get(key)!;
    const changeRate = indicators.length > 0 ?
      ((value - indicators[indicators.length - 1].value) / indicators[indicators.length - 1].value) : 0;

    indicators.push({
      metric,
      value,
      timestamp,
      trend: changeRate > 0.05 ? 'increasing' : changeRate < -0.05 ? 'decreasing' : 'stable',
      changeRate,
    });
  }

  calculateTrendVelocity(threatId: string, metric: string, window: number = 7): number {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length < 2) return 0;

    const now = new Date();
    const windowStart = new Date(now.getTime() - window * 24 * 60 * 60 * 1000);
    const windowData = indicators.filter(ind => ind.timestamp >= windowStart);

    if (windowData.length < 2) return 0;

    const start = windowData[0].value;
    const end = windowData[windowData.length - 1].value;

    return (end - start) / window;
  }

  forecastTrend(threatId: string, metric: string, days: number = 7): number[] {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length < 3) return [];

    const recentData = indicators.slice(-14);
    const values = recentData.map(ind => ind.value);
    const slope = this.calculateLinearTrend(values);
    const intercept = values[values.length - 1] - slope * values.length;

    const forecast: number[] = [];
    for (let i = 1; i <= days; i++) {
      const predictedValue = Math.max(0, intercept + slope * (values.length + i));
      forecast.push(predictedValue);
    }

    return forecast;
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, val, idx) => sum + val * idx, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    return slope;
  }

  calculateSeasonality(threatId: string, metric: string): number {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length < 14) return 0;

    const values = indicators.map(ind => ind.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = calculateStdDev(values);

    if (variance === 0) return 0;

    const coefficientOfVariation = variance / mean;
    return Math.min(1, coefficientOfVariation);
  }

  detectAnomalies(threatId: string, metric: string, threshold: number = 2.5): number[] {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length < 2) return [];

    const values = indicators.map(ind => ind.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = calculateStdDev(values);

    if (stdDev === 0) return [];

    const anomalyIndices: number[] = [];
    values.forEach((value, idx) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalyIndices.push(idx);
      }
    });

    return anomalyIndices;
  }

  calculateVolatility(threatId: string, metric: string, window: number = 7): number {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length < window) return 0;

    const recentValues = indicators.slice(-window).map(ind => ind.value);
    const returns: number[] = [];

    for (let i = 1; i < recentValues.length; i++) {
      const dayReturn = (recentValues[i] - recentValues[i - 1]) / recentValues[i - 1];
      returns.push(dayReturn);
    }

    return calculateStdDev(returns);
  }

  getWeightedAverage(threatId: string, metric: string, lookback: number = 30): number {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length === 0) return 0;

    const now = new Date();
    const cutoff = new Date(now.getTime() - lookback * 24 * 60 * 60 * 1000);
    const relevantIndicators = indicators.filter(ind => ind.timestamp >= cutoff);

    if (relevantIndicators.length === 0) return 0;

    let weightedSum = 0;
    let weightSum = 0;

    relevantIndicators.forEach((ind) => {
      const daysAgo = (now.getTime() - ind.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const weight = calculateTimeDecay(daysAgo, 15);
      weightedSum += ind.value * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? weightedSum / weightSum : 0;
  }

  getTrendVisualizationData(threatId: string, metric: string, days: number = 30): object[] {
    const key = `${threatId}:${metric}`;
    const indicators = this.trends.get(key) || [];

    if (indicators.length === 0) return [];

    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const filteredIndicators = indicators.filter(ind => ind.timestamp >= cutoff);

    return filteredIndicators.map((ind) => ({
      timestamp: ind.timestamp.toISOString(),
      value: ind.value,
      trend: ind.trend,
      changeRate: (ind.changeRate * 100).toFixed(2),
    }));
  }

  compareTrends(threatId1: string, threatId2: string, metric: string): number {
    const velocity1 = this.calculateTrendVelocity(threatId1, metric);
    const velocity2 = this.calculateTrendVelocity(threatId2, metric);

    const similarity = 1 - Math.abs((velocity1 - velocity2) / Math.max(Math.abs(velocity1), Math.abs(velocity2), 0.01));
    return Math.max(0, Math.min(1, similarity));
  }

  clearTrendData(): void {
    this.trends.clear();
  }
}
