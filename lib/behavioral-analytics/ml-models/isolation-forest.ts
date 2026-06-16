/**
 * Isolation Forest - ML model for anomaly detection
 * Implements isolation forest algorithm for detecting anomalies in behavioral data
 */

export interface DataPoint {
  id: string;
  values: number[];
  label?: string;
}

export interface IsolationNode {
  splitDimension?: number;
  splitValue?: number;
  left?: IsolationNode;
  right?: IsolationNode;
  size: number; // Number of samples in this node
}

export interface AnomalyScore {
  id: string;
  score: number; // 0 to 1, higher = more anomalous
  isAnomaly: boolean;
  pathLength: number;
}

export class IsolationForest {
  private trees: IsolationNode[] = [];
  private numTrees: number;
  private sampleSize: number;
  private anomalyThreshold: number = 0.6;
  private maxDepth: number;

  constructor(
    numTrees: number = 100,
    sampleSize: number = 256,
    maxDepth: number = 20
  ) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
    this.maxDepth = maxDepth;
  }

  /**
   * Train the isolation forest
   */
  async train(data: DataPoint[]): Promise<void> {
    if (data.length === 0) {
      console.warn("[IsolationForest] No training data provided");
      return;
    }

    this.trees = [];

    for (let t = 0; t < this.numTrees; t++) {
      // Sample random subset
      const sample = this.randomSample(data, this.sampleSize);

      // Build isolation tree
      const tree = this.buildTree(sample, 0, this.maxDepth);
      this.trees.push(tree);
    }

    console.log(`[IsolationForest] Trained ${this.numTrees} trees`);
  }

  /**
   * Predict anomaly scores for data points
   */
  async predict(data: DataPoint[]): Promise<AnomalyScore[]> {
    const scores: AnomalyScore[] = [];

    for (const point of data) {
      const pathLengths: number[] = [];

      for (const tree of this.trees) {
        const depth = this.getPathLength(point.values, tree, 0);
        pathLengths.push(depth);
      }

      const avgPathLength = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;
      const c = this.calculateC(this.sampleSize);
      const anomalyScore = Math.pow(2, -avgPathLength / c);

      scores.push({
        id: point.id,
        score: Math.min(1, anomalyScore),
        isAnomaly: anomalyScore > this.anomalyThreshold,
        pathLength: avgPathLength,
      });
    }

    return scores;
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(data: DataPoint[]): Promise<AnomalyScore[]> {
    const scores = await this.predict(data);
    return scores.filter((s) => s.isAnomaly);
  }

  /**
   * Set anomaly threshold
   */
  setThreshold(threshold: number): void {
    this.anomalyThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Build isolation tree recursively
   */
  private buildTree(
    data: DataPoint[],
    depth: number,
    maxDepth: number
  ): IsolationNode {
    if (data.length <= 1 || depth >= maxDepth) {
      return {
        size: data.length,
      };
    }

    // Randomly select dimension
    const numDimensions = data[0].values.length;
    const splitDim = Math.floor(Math.random() * numDimensions);

    // Get min and max for this dimension
    let minVal = data[0].values[splitDim];
    let maxVal = data[0].values[splitDim];

    for (const point of data) {
      minVal = Math.min(minVal, point.values[splitDim]);
      maxVal = Math.max(maxVal, point.values[splitDim]);
    }

    // Randomly select split point
    const splitVal = minVal + Math.random() * (maxVal - minVal);

    // Partition data
    const left: DataPoint[] = [];
    const right: DataPoint[] = [];

    for (const point of data) {
      if (point.values[splitDim] < splitVal) {
        left.push(point);
      } else {
        right.push(point);
      }
    }

    // Handle edge cases
    const leftData = left.length === 0 ? data : left;
    const rightData = right.length === 0 ? data : right;

    return {
      splitDimension: splitDim,
      splitValue: splitVal,
      left: this.buildTree(leftData, depth + 1, maxDepth),
      right: this.buildTree(rightData, depth + 1, maxDepth),
      size: data.length,
    };
  }

  /**
   * Get path length to leaf node
   */
  private getPathLength(
    values: number[],
    node: IsolationNode | undefined,
    depth: number
  ): number {
    if (!node || !node.splitDimension || node.splitValue === undefined) {
      return depth + this.calculateC(node?.size || 1);
    }

    if (values[node.splitDimension] < node.splitValue) {
      return this.getPathLength(values, node.left, depth + 1);
    } else {
      return this.getPathLength(values, node.right, depth + 1);
    }
  }

  /**
   * Calculate normalization constant C
   * Used to normalize anomaly scores
   */
  private calculateC(n: number): number {
    if (n <= 1) return 0;

    // Harmonic number approximation
    const harmonic = Math.log(n - 1) + 0.5772156649;
    return 2 * harmonic - (2 * (n - 1)) / n;
  }

  /**
   * Random sample
   */
  private randomSample(data: DataPoint[], size: number): DataPoint[] {
    const sample: DataPoint[] = [];
    const indices = new Set<number>();

    while (indices.size < Math.min(size, data.length)) {
      indices.add(Math.floor(Math.random() * data.length));
    }

    for (const idx of indices) {
      sample.push(data[idx]);
    }

    return sample;
  }

  /**
   * Get feature importance
   */
  async getFeatureImportance(): Promise<number[]> {
    if (this.trees.length === 0) {
      return [];
    }

    // Get max depth from all trees
    const maxDepth = Math.max(
      ...this.trees.map((tree) => this.getTreeDepth(tree))
    );

    // Calculate feature importance based on split frequency
    const splitCounts = new Map<number, number>();

    for (const tree of this.trees) {
      this.countSplits(tree, splitCounts);
    }

    // Normalize to probabilities
    const totalSplits = Array.from(splitCounts.values()).reduce((a, b) => a + b, 0);
    const importance: number[] = [];

    for (let i = 0; i < this.numTrees; i++) {
      const count = splitCounts.get(i) || 0;
      importance.push(totalSplits > 0 ? count / totalSplits : 0);
    }

    return importance;
  }

  /**
   * Get tree depth
   */
  private getTreeDepth(node: IsolationNode | undefined): number {
    if (!node || !node.left || !node.right) {
      return 0;
    }

    return 1 + Math.max(this.getTreeDepth(node.left), this.getTreeDepth(node.right));
  }

  /**
   * Count splits by dimension
   */
  private countSplits(
    node: IsolationNode | undefined,
    counts: Map<number, number>
  ): void {
    if (!node || node.splitDimension === undefined) {
      return;
    }

    const dim = node.splitDimension;
    counts.set(dim, (counts.get(dim) || 0) + 1);

    this.countSplits(node.left, counts);
    this.countSplits(node.right, counts);
  }

  /**
   * Serialize model for storage
   */
  serialize(): string {
    // Simplified serialization - in production use proper serialization
    return JSON.stringify({
      numTrees: this.numTrees,
      sampleSize: this.sampleSize,
      maxDepth: this.maxDepth,
      anomalyThreshold: this.anomalyThreshold,
      treesCount: this.trees.length,
    });
  }

  /**
   * Load model from storage
   */
  deserialize(data: string): void {
    try {
      const config = JSON.parse(data);
      this.numTrees = config.numTrees || 100;
      this.sampleSize = config.sampleSize || 256;
      this.maxDepth = config.maxDepth || 20;
      this.anomalyThreshold = config.anomalyThreshold || 0.6;
    } catch (error) {
      console.error("[IsolationForest] Deserialization error:", error);
      throw error;
    }
  }
}

export default IsolationForest;
