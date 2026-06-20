import { RISK_THRESHOLDS, RISK_LEVELS } from './constants';

export function calculateRiskLevel(score: number): string {
  if (score >= RISK_THRESHOLDS.CRITICAL) return RISK_LEVELS.CRITICAL;
  if (score >= RISK_THRESHOLDS.HIGH) return RISK_LEVELS.HIGH;
  if (score >= RISK_THRESHOLDS.MEDIUM) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

export function normalizeScore(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateWeightedScore(scores: Record<string, number>, weights: Record<string, number>): number {
  let totalScore = 0;
  let totalWeight = 0;

  Object.keys(scores).forEach((key) => {
    const weight = weights[key] || 0;
    totalScore += scores[key] * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function detectOutliers(values: number[], threshold: number = 2): number[] {
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);

  if (stdDev === 0) return [];

  return values
    .map((val, idx) => ({
      value: val,
      index: idx,
      zScore: Math.abs((val - mean) / stdDev),
    }))
    .filter((item) => item.zScore > threshold)
    .map((item) => item.index);
}

export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

export function calculateTrendDirection(values: number[]): number {
  if (values.length < 2) return 0;

  let direction = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) direction++;
    else if (values[i] < values[i - 1]) direction--;
  }

  return direction / (values.length - 1);
}

export function aggregateRiskFactors(factors: Record<string, number>): number {
  const values = Object.values(factors);
  if (values.length === 0) return 0;

  const mean = calculateMean(values);
  const max = Math.max(...values);

  return (mean * 0.4 + max * 0.6);
}

export function calculateCompliance(compliantControls: number, totalControls: number): number {
  if (totalControls === 0) return 0;
  return (compliantControls / totalControls) * 100;
}

export function groupByTimeWindow(items: any[], timeWindowMs: number): Map<number, any[]> {
  const groups = new Map<number, any[]>();

  items.forEach((item) => {
    const timestamp = item.timestamp instanceof Date ? item.timestamp.getTime() : item.timestamp;
    const windowKey = Math.floor(timestamp / timeWindowMs);

    if (!groups.has(windowKey)) {
      groups.set(windowKey, []);
    }
    groups.get(windowKey)!.push(item);
  });

  return groups;
}

export function interpolateScore(baseScore: number, factors: Record<string, number>): number {
  const adjustments = Object.values(factors).reduce((sum, val) => sum + val, 0);
  const adjustedScore = baseScore + adjustments;

  return normalizeScore(adjustedScore, 0, 100);
}

export function calculateSimilarityScore(items1: string[], items2: string[]): number {
  const set1 = new Set(items1);
  const set2 = new Set(items2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

export function formatRiskReport(score: number, level: string): object {
  return {
    score: score.toFixed(2),
    level,
    percentile: Math.round(score),
    riskAssessment: score >= 80 ? 'Immediate action required' : 'Monitor closely',
  };
}
