import { ThreatCorrelation } from './types';
import { calculateSimilarity, aggregateScores } from './utils';
import { CORRELATION_WEIGHTS, MIN_CORRELATION_SCORE } from './constants';

export class ThreatCorrelationEngine {
  private correlations: Map<string, ThreatCorrelation> = new Map();
  private threatIndicators: Map<string, string[]> = new Map();
  private threatActors: Map<string, string[]> = new Map();
  private threatTargets: Map<string, string[]> = new Map();

  registerThreat(threatId: string, indicators: string[], actors: string[], targets: string[]): void {
    this.threatIndicators.set(threatId, indicators);
    this.threatActors.set(threatId, actors);
    this.threatTargets.set(threatId, targets);
  }

  correlateThreats(threatId1: string, threatId2: string): ThreatCorrelation | null {
    const correlationId = [threatId1, threatId2].sort().join(':');
    const cached = this.correlations.get(correlationId);

    if (cached) return cached;

    const indicators1 = this.threatIndicators.get(threatId1) || [];
    const indicators2 = this.threatIndicators.get(threatId2) || [];
    const actors1 = this.threatActors.get(threatId1) || [];
    const actors2 = this.threatActors.get(threatId2) || [];
    const targets1 = this.threatTargets.get(threatId1) || [];
    const targets2 = this.threatTargets.get(threatId2) || [];

    const indicatorScore = this.calculateIndicatorSimilarity(indicators1, indicators2);
    const actorScore = this.calculateActorSimilarity(actors1, actors2);
    const targetScore = this.calculateTargetSimilarity(targets1, targets2);
    const temporalScore = 0.7;

    const scores = [indicatorScore, actorScore, targetScore];
    const weights = [
      CORRELATION_WEIGHTS.INDICATOR_MATCH,
      CORRELATION_WEIGHTS.ACTOR_MATCH,
      CORRELATION_WEIGHTS.TARGET_MATCH,
    ];

    const correlationScore = aggregateScores(scores, weights);

    if (correlationScore < MIN_CORRELATION_SCORE) return null;

    const commonIndicators = this.findCommonElements(indicators1, indicators2);
    const commonActors = this.findCommonElements(actors1, actors2);
    const commonTargets = this.findCommonElements(targets1, targets2);

    const correlation: ThreatCorrelation = {
      threatId1,
      threatId2,
      correlationScore: Math.min(1, correlationScore),
      commonIndicators,
      commonActors,
      commonTargets,
      temporalRelationship: this.determineTemporalRelationship(threatId1, threatId2),
    };

    this.correlations.set(correlationId, correlation);
    return correlation;
  }

  private calculateIndicatorSimilarity(indicators1: string[], indicators2: string[]): number {
    if (indicators1.length === 0 || indicators2.length === 0) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    indicators1.forEach((ind1) => {
      indicators2.forEach((ind2) => {
        totalSimilarity += calculateSimilarity(ind1, ind2);
        comparisons++;
      });
    });

    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
    const jackardIndex = this.calculateJackardIndex(new Set(indicators1), new Set(indicators2));

    return (avgSimilarity * 0.6 + jackardIndex * 0.4);
  }

  private calculateActorSimilarity(actors1: string[], actors2: string[]): number {
    if (actors1.length === 0 || actors2.length === 0) return 0;

    const common = actors1.filter(a => actors2.includes(a)).length;
    const union = new Set([...actors1, ...actors2]).size;

    return union > 0 ? common / union : 0;
  }

  private calculateTargetSimilarity(targets1: string[], targets2: string[]): number {
    if (targets1.length === 0 || targets2.length === 0) return 0;

    let totalSimilarity = 0;
    targets1.forEach((t1) => {
      targets2.forEach((t2) => {
        totalSimilarity += calculateSimilarity(t1, t2);
      });
    });

    return Math.min(1, totalSimilarity / (targets1.length * targets2.length));
  }

  private calculateJackardIndex(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private findCommonElements(arr1: string[], arr2: string[], threshold: number = 0.8): string[] {
    const common: string[] = [];

    arr1.forEach((item1) => {
      arr2.forEach((item2) => {
        if (calculateSimilarity(item1, item2) >= threshold) {
          if (!common.includes(item1)) {
            common.push(item1);
          }
        }
      });
    });

    return common;
  }

  private determineTemporalRelationship(threatId1: string, threatId2: string): string {
    return 'concurrent';
  }

  findCorrelatedThreats(threatId: string, threshold: number = MIN_CORRELATION_SCORE): ThreatCorrelation[] {
    const correlated: ThreatCorrelation[] = [];

    this.correlations.forEach((correlation) => {
      if ((correlation.threatId1 === threatId || correlation.threatId2 === threatId) &&
          correlation.correlationScore >= threshold) {
        correlated.push(correlation);
      }
    });

    return correlated.sort((a, b) => b.correlationScore - a.correlationScore);
  }

  buildCorrelationNetwork(threatIds: string[]): object {
    const nodes = threatIds.map(id => ({ id, label: id }));
    const edges: object[] = [];

    for (let i = 0; i < threatIds.length; i++) {
      for (let j = i + 1; j < threatIds.length; j++) {
        const correlation = this.correlateThreats(threatIds[i], threatIds[j]);
        if (correlation && correlation.correlationScore >= 0.5) {
          edges.push({
            from: correlation.threatId1,
            to: correlation.threatId2,
            weight: correlation.correlationScore,
          });
        }
      }
    }

    return { nodes, edges };
  }

  detectCorrelationClusters(threatIds: string[], threshold: number = 0.6): string[][] {
    const clusters: string[][] = [];
    const visited = new Set<string>();

    threatIds.forEach((threatId) => {
      if (visited.has(threatId)) return;

      const cluster = [threatId];
      visited.add(threatId);

      const correlated = this.findCorrelatedThreats(threatId, threshold);
      correlated.forEach((corr) => {
        const otherId = corr.threatId1 === threatId ? corr.threatId2 : corr.threatId1;
        if (!visited.has(otherId)) {
          cluster.push(otherId);
          visited.add(otherId);
        }
      });

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  getCorrelationMetrics(threatId: string): object {
    const correlated = this.findCorrelatedThreats(threatId);
    const scores = correlated.map(c => c.correlationScore);

    return {
      correlatedThreatsCount: correlated.length,
      averageCorrelation: scores.length > 0 ? aggregateScores(scores) / 100 : 0,
      maxCorrelation: scores.length > 0 ? Math.max(...scores) : 0,
      minCorrelation: scores.length > 0 ? Math.min(...scores) : 0,
    };
  }
}
