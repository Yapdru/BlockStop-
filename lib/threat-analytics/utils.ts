import { ThreatPattern, AnomalyRecord, TrendIndicator } from './types';
import { SEVERITY_THRESHOLDS, CONFIDENCE_THRESHOLDS, ANOMALY_THRESHOLD_MULTIPLIER } from './constants';

export function calculatePatternScore(pattern: ThreatPattern): number {
  const severityWeight = 0.5;
  const confidenceWeight = 0.3;
  const occurrenceWeight = 0.2;
  const normalizedOccurrence = Math.min(pattern.occurrences / 100, 1);

  return (
    pattern.severity * severityWeight +
    pattern.confidence * 100 * confidenceWeight +
    normalizedOccurrence * 100 * occurrenceWeight
  );
}

export function detectAnomalies(
  values: number[],
  baseline: number,
  threshold: number = ANOMALY_THRESHOLD_MULTIPLIER
): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];
  const stdDev = calculateStdDev(values);
  const upperBound = baseline + stdDev * threshold;
  const lowerBound = Math.max(0, baseline - stdDev * threshold);

  values.forEach((value, idx) => {
    if (value > upperBound || value < lowerBound) {
      anomalies.push({
        id: `anomaly-${idx}-${Date.now()}`,
        type: value > upperBound ? 'spike' : 'drop',
        severity: Math.abs(value - baseline) / baseline * 100,
        confidence: Math.min((Math.abs(value - baseline) / (stdDev || 1)) * 0.1, 1),
        baseline,
        observed: value,
        timestamp: new Date(),
      });
    }
  });

  return anomalies;
}

export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateTrend(indicators: TrendIndicator[]): 'increasing' | 'decreasing' | 'stable' {
  if (indicators.length < 2) return 'stable';

  const recentIndicators = indicators.slice(-5);
  const avgChangeRate = recentIndicators.reduce((sum, ind) => sum + (ind.changeRate || 0), 0) / recentIndicators.length;

  if (avgChangeRate > 0.05) return 'increasing';
  if (avgChangeRate < -0.05) return 'decreasing';
  return 'stable';
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export function normalizeScore(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateConfidenceMultiplier(confidence: number): number {
  return confidence >= CONFIDENCE_THRESHOLDS.HIGH ? 1 :
         confidence >= CONFIDENCE_THRESHOLDS.MODERATE ? 0.7 :
         0.4;
}

export function aggregateScores(scores: number[], weights?: number[]): number {
  if (scores.length === 0) return 0;

  if (weights && weights.length === scores.length) {
    return scores.reduce((sum, score, idx) => sum + score * weights[idx], 0) / weights.reduce((a, b) => a + b, 0);
  }

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function calculateTimeDecay(daysAgo: number, halfLife: number = 30): number {
  return Math.pow(0.5, daysAgo / halfLife);
}
