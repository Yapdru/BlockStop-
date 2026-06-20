import { ThreatLifecycle, TrendIndicator, EvolutionPrediction } from './types';
import { calculateTrend, calculateTimeDecay } from './utils';
import { LIFECYCLE_STAGES, DEFAULT_FORECAST_DAYS } from './constants';

export class ThreatLifecycleAnalyzer {
  private lifecycles: Map<string, ThreatLifecycle> = new Map();

  createLifecycle(threatId: string): ThreatLifecycle {
    const lifecycleId = `lifecycle-${threatId}-${Date.now()}`;

    const lifecycle: ThreatLifecycle = {
      id: lifecycleId,
      threatId,
      stage: LIFECYCLE_STAGES.EMERGING,
      trendIndicators: [],
      projectedEvolution: [],
      timeToMitigation: 0,
      confidenceScore: 0.5,
    };

    this.lifecycles.set(threatId, lifecycle);
    return lifecycle;
  }

  addTrendIndicator(threatId: string, metric: string, value: number): void {
    const lifecycle = this.lifecycles.get(threatId);
    if (!lifecycle) return;

    const previousValue = lifecycle.trendIndicators
      .filter(ind => ind.metric === metric)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const changeRate = previousValue ? ((value - previousValue.value) / previousValue.value) : 0;
    const trend = calculateTrend([{ metric, value, timestamp: new Date(), trend: 'stable', changeRate }] as TrendIndicator[]);

    lifecycle.trendIndicators.push({
      metric,
      value,
      timestamp: new Date(),
      trend: trend || 'stable',
      changeRate,
    });

    this.updateLifecycleStage(threatId);
  }

  private updateLifecycleStage(threatId: string): void {
    const lifecycle = this.lifecycles.get(threatId);
    if (!lifecycle || lifecycle.trendIndicators.length === 0) return;

    const recentIndicators = lifecycle.trendIndicators.slice(-10);
    const avgChangeRate = recentIndicators.reduce((sum, ind) => sum + ind.changeRate, 0) / recentIndicators.length;
    const avgValue = recentIndicators.reduce((sum, ind) => sum + ind.value, 0) / recentIndicators.length;

    if (avgValue < 5) {
      lifecycle.stage = LIFECYCLE_STAGES.DORMANT;
    } else if (avgChangeRate < -0.1) {
      lifecycle.stage = LIFECYCLE_STAGES.DECLINING;
    } else if (avgChangeRate > 0.2) {
      lifecycle.stage = LIFECYCLE_STAGES.GROWING;
    } else if (avgValue > 80) {
      lifecycle.stage = LIFECYCLE_STAGES.PEAK;
    } else if (lifecycle.stage === LIFECYCLE_STAGES.EMERGING && avgValue > 20) {
      lifecycle.stage = LIFECYCLE_STAGES.GROWING;
    }

    lifecycle.projectedEvolution = this.forecastEvolution(threatId);
    lifecycle.timeToMitigation = this.estimateTimeToMitigation(lifecycle);
    lifecycle.confidenceScore = this.calculateConfidenceScore(lifecycle);
  }

  private forecastEvolution(threatId: string): EvolutionPrediction[] {
    const lifecycle = this.lifecycles.get(threatId);
    if (!lifecycle || lifecycle.trendIndicators.length === 0) return [];

    const predictions: EvolutionPrediction[] = [];
    const currentStage = lifecycle.stage;
    const stageProgression: Record<string, string[]> = {
      [LIFECYCLE_STAGES.EMERGING]: [LIFECYCLE_STAGES.GROWING, LIFECYCLE_STAGES.PEAK],
      [LIFECYCLE_STAGES.GROWING]: [LIFECYCLE_STAGES.PEAK, LIFECYCLE_STAGES.DECLINING],
      [LIFECYCLE_STAGES.PEAK]: [LIFECYCLE_STAGES.DECLINING, LIFECYCLE_STAGES.DORMANT],
      [LIFECYCLE_STAGES.DECLINING]: [LIFECYCLE_STAGES.DORMANT],
      [LIFECYCLE_STAGES.DORMANT]: [],
    };

    const nextStages = stageProgression[currentStage] || [];
    nextStages.forEach((stage, idx) => {
      predictions.push({
        stage,
        probability: 1 / (idx + 2),
        estimatedTimeframe: (idx + 1) * 7 + Math.random() * 14,
        implications: this.getStageImplications(stage),
      });
    });

    return predictions;
  }

  private getStageImplications(stage: string): string[] {
    const implications: Record<string, string[]> = {
      [LIFECYCLE_STAGES.EMERGING]: ['Initial detection', 'Limited prevalence', 'Early response window'],
      [LIFECYCLE_STAGES.GROWING]: ['Increased detections', 'Expanding attack surface', 'Widespread exploitation'],
      [LIFECYCLE_STAGES.PEAK]: ['Maximum threat activity', 'High detection rates', 'Multiple campaigns active'],
      [LIFECYCLE_STAGES.DECLINING]: ['Reduced activity', 'Patch deployment widespread', 'Actor pivot expected'],
      [LIFECYCLE_STAGES.DORMANT]: ['Minimal threat', 'Historical reference only', 'Resurgence possible'],
    };

    return implications[stage] || [];
  }

  private estimateTimeToMitigation(lifecycle: ThreatLifecycle): number {
    const stage = lifecycle.stage;
    const timeEstimates: Record<string, number> = {
      [LIFECYCLE_STAGES.EMERGING]: 14,
      [LIFECYCLE_STAGES.GROWING]: 7,
      [LIFECYCLE_STAGES.PEAK]: 3,
      [LIFECYCLE_STAGES.DECLINING]: 1,
      [LIFECYCLE_STAGES.DORMANT]: 0,
    };

    const baseTime = timeEstimates[stage] || 14;
    const confidenceAdjustment = 1 - lifecycle.confidenceScore;

    return Math.ceil(baseTime * (1 + confidenceAdjustment));
  }

  private calculateConfidenceScore(lifecycle: ThreatLifecycle): number {
    if (lifecycle.trendIndicators.length === 0) return 0.5;

    const indicatorCount = lifecycle.trendIndicators.length;
    const consistencyScore = this.measureTrendConsistency(lifecycle.trendIndicators);
    const dataQuality = Math.min(1, indicatorCount / 20);

    return Math.min(1, (consistencyScore * 0.6 + dataQuality * 0.4));
  }

  private measureTrendConsistency(indicators: TrendIndicator[]): number {
    if (indicators.length < 2) return 0.5;

    const recentTrends = indicators.slice(-10);
    const trendCounts = { increasing: 0, decreasing: 0, stable: 0 };

    recentTrends.forEach((ind) => {
      trendCounts[ind.trend as keyof typeof trendCounts]++;
    });

    const maxCount = Math.max(...Object.values(trendCounts));
    return maxCount / recentTrends.length;
  }

  getLifecycleMetrics(threatId: string): object {
    const lifecycle = this.lifecycles.get(threatId);
    if (!lifecycle) return {};

    const recentIndicators = lifecycle.trendIndicators.slice(-5);
    const avgValue = recentIndicators.length > 0 ?
      recentIndicators.reduce((sum, ind) => sum + ind.value, 0) / recentIndicators.length : 0;

    return {
      stage: lifecycle.stage,
      currentValue: recentIndicators[recentIndicators.length - 1]?.value || 0,
      averageValue: avgValue,
      trend: recentIndicators[recentIndicators.length - 1]?.trend || 'stable',
      daysInStage: this.calculateDaysInStage(lifecycle),
      confidence: (lifecycle.confidenceScore * 100).toFixed(1),
    };
  }

  private calculateDaysInStage(lifecycle: ThreatLifecycle): number {
    if (lifecycle.trendIndicators.length === 0) return 0;

    const currentTime = new Date();
    const oldestIndicator = lifecycle.trendIndicators[0];
    return Math.floor((currentTime.getTime() - oldestIndicator.timestamp.getTime()) / (1000 * 60 * 60 * 24));
  }

  predictThreatPeak(threatId: string): Date | null {
    const lifecycle = this.lifecycles.get(threatId);
    if (!lifecycle || lifecycle.stage === LIFECYCLE_STAGES.PEAK || lifecycle.stage === LIFECYCLE_STAGES.DECLINING) {
      return null;
    }

    const recentIndicators = lifecycle.trendIndicators.slice(-7);
    if (recentIndicators.length < 2) return null;

    const avgChangeRate = recentIndicators.reduce((sum, ind) => sum + ind.changeRate, 0) / recentIndicators.length;
    const daysToReachPeak = Math.ceil(30 / Math.max(avgChangeRate, 0.05));

    return new Date(Date.now() + daysToReachPeak * 24 * 60 * 60 * 1000);
  }
}
