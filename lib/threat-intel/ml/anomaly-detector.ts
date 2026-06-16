// Anomaly Detector - Isolation Forest-based anomaly detection

import { IOC, AnomalyDetectionResult } from '../types';
import { cacheManager } from '../cache-manager';

interface IsolationTree {
  feature: number;
  threshold: number;
  left?: IsolationTree;
  right?: IsolationTree;
  size: number;
}

export class AnomalyDetector {
  private trees: IsolationTree[] = [];
  private numTrees: number = 100;
  private maxDepth: number = 8;
  private featureStats: Map<string, { mean: number; stdDev: number }> = new Map();

  async initialize(): Promise<void> {
    // Pre-trained trees would be loaded here
    this.buildEnsemble();
    console.log('[AnomalyDetector] Initialized with', this.trees.length, 'isolation trees');
  }

  private buildEnsemble(): void {
    // Create isolation forest ensemble
    for (let i = 0; i < this.numTrees; i++) {
      const tree = this.createRandomTree(0);
      this.trees.push(tree);
    }
  }

  private createRandomTree(depth: number): IsolationTree {
    if (depth >= this.maxDepth) {
      return {
        feature: -1,
        threshold: 0,
        size: 1,
      };
    }

    const feature = Math.floor(Math.random() * 10);
    const threshold = Math.random();

    return {
      feature,
      threshold,
      left: Math.random() > 0.5 ? this.createRandomTree(depth + 1) : undefined,
      right: Math.random() > 0.5 ? this.createRandomTree(depth + 1) : undefined,
      size: Math.random() * 1000,
    };
  }

  async detectAnomalies(iocs: IOC[]): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = [];

    for (const ioc of iocs) {
      const result = await this.detectAnomaly(ioc);
      results.push(result);
    }

    return results;
  }

  async detectAnomaly(ioc: IOC): Promise<AnomalyDetectionResult> {
    const cacheKey = `anomaly:${ioc.id}`;
    const cached = cacheManager.get<AnomalyDetectionResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const features = this.extractFeatures(ioc);
    const pathLengths: number[] = [];

    // Calculate path length in each tree
    for (const tree of this.trees) {
      const pathLength = this.calculatePathLength(features, tree, 0);
      pathLengths.push(pathLength);
    }

    // Calculate anomaly score
    const avgPathLength = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;
    const expectedPathLength = this.calculateExpectedPathLength(features.length);
    const anomalyScore = Math.pow(2, -avgPathLength / expectedPathLength);

    const isAnomaly = anomalyScore > 0.6;
    const reason = this.generateAnomalyReason(ioc, anomalyScore);

    const result: AnomalyDetectionResult = {
      id: `anomaly:${ioc.id}:${Date.now()}`,
      ioc,
      isAnomaly,
      anomalyScore: Math.round(anomalyScore * 100),
      reason,
      detectedAt: new Date(),
    };

    cacheManager.set(cacheKey, result, 1800000); // 30 minutes cache

    return result;
  }

  private calculatePathLength(features: number[], tree: IsolationTree, depth: number): number {
    if (tree.feature === -1) {
      return depth;
    }

    if (features[tree.feature] < tree.threshold) {
      if (tree.left) {
        return this.calculatePathLength(features, tree.left, depth + 1);
      }
    } else {
      if (tree.right) {
        return this.calculatePathLength(features, tree.right, depth + 1);
      }
    }

    return depth + 1;
  }

  private calculateExpectedPathLength(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
  }

  private extractFeatures(ioc: IOC): number[] {
    const features: number[] = [];

    // Feature 1: Confidence
    features.push(ioc.confidence / 100);

    // Feature 2: Value length
    features.push(Math.min(ioc.value.length / 255, 1));

    // Feature 3: Number of tags
    features.push(Math.min(ioc.tags.length / 10, 1));

    // Feature 4: Source diversity
    features.push(ioc.source.length % 10 / 10);

    // Feature 5: Age (days since first seen)
    const days = (Date.now() - ioc.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    features.push(Math.min(days / 365, 1));

    // Feature 6: Recency (days since last seen)
    const daysRecent = (Date.now() - ioc.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
    features.push(Math.min(daysRecent / 30, 1));

    // Feature 7-10: Tag-based features
    features.push(ioc.tags.some((t) => t.includes('malware')) ? 1 : 0);
    features.push(ioc.tags.some((t) => t.includes('phishing')) ? 1 : 0);
    features.push(ioc.tags.some((t) => t.includes('c2')) ? 1 : 0);
    features.push(ioc.tags.some((t) => t.includes('verified')) ? 1 : 0);

    return features;
  }

  private generateAnomalyReason(ioc: IOC, score: number): string {
    const reasons: string[] = [];

    if (score > 0.8) {
      reasons.push('Very unusual pattern');
    } else if (score > 0.6) {
      reasons.push('Abnormal behavior detected');
    }

    if (ioc.confidence < 50) {
      reasons.push('Low confidence indicator');
    }

    if (ioc.tags.length === 0) {
      reasons.push('Untagged indicator');
    }

    if ((Date.now() - ioc.lastSeen.getTime()) / (1000 * 60 * 60 * 24) > 90) {
      reasons.push('Recently reappeared after dormancy');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Anomaly detected';
  }
}

export const anomalyDetector = new AnomalyDetector();
