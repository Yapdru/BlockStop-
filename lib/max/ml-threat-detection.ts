/**
 * ML Threat Detection - LSTM & CNN Models
 * Advanced machine learning for threat detection in MAX tier
 */

import * as tf from '@tensorflow/tfjs';

export interface LSTMThreatDetector {
  modelName: string;
  inputShape: number[];
  sequenceLength: number;
  predictionResult: LSTMPrediction;
}

export interface LSTMPrediction {
  threatScore: number;
  threatType: string;
  confidence: number;
  timestamp: Date;
  sequenceAnalysis: SequenceAnalysis;
  anomalies: AnomalyReport[];
}

export interface SequenceAnalysis {
  sequenceLength: number;
  patterns: PatternDetection[];
  entropy: number;
  anomalyIndices: number[];
  normalBehavior: boolean;
}

export interface PatternDetection {
  pattern: string;
  occurrences: number;
  confidence: number;
  locations: number[];
  severity: number;
}

export interface AnomalyReport {
  index: number;
  value: number;
  expected: number;
  deviation: number;
  zscore: number;
}

export interface CNNThreatDetector {
  modelName: string;
  inputShape: number[];
  filters: number[];
  predictionResult: CNNPrediction;
}

export interface CNNPrediction {
  threatLevel: string;
  featureMaps: FeatureMap[];
  confidenceScores: ConfidenceScore[];
  detectedPatterns: DetectedPattern[];
  spatialAnalysis: SpatialAnalysis;
  timestamp: Date;
}

export interface FeatureMap {
  layer: number;
  activations: number[][];
  topActivations: TopActivation[];
}

export interface TopActivation {
  position: [number, number];
  value: number;
  feature: string;
}

export interface ConfidenceScore {
  class: string;
  score: number;
  probability: number;
}

export interface DetectedPattern {
  name: string;
  confidence: number;
  location: number[];
  size: number[];
  characteristics: Record<string, number>;
}

export interface SpatialAnalysis {
  entropy: number;
  concentration: number;
  distribution: 'uniform' | 'clustered' | 'sparse';
  hotspots: number[][];
}

export interface HybridPrediction {
  lstm: LSTMPrediction;
  cnn: CNNPrediction;
  ensemble: EnsembleResult;
  finalDecision: ThreatDecision;
}

export interface EnsembleResult {
  combinedScore: number;
  modelAgreement: number;
  conflictingPredictions: string[];
  confidence: number;
  reasoning: string[];
}

export interface ThreatDecision {
  isThreaten: boolean;
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  confidence: number;
  requiredAction: string;
  automationPlaybook?: string;
}

export interface TrainingData {
  sequences: number[][][];
  labels: number[];
  weights?: number[];
  validationSplit: number;
  epochs: number;
  batchSize: number;
}

export interface ModelMetrics {
  loss: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAucScore: number;
  confusionMatrix: number[][];
  timestamp: Date;
}

/**
 * LSTM-based threat detector for sequential data
 */
export class LSTMThreatDetectionModel {
  private model: tf.LayersModel | null = null;
  private sequenceLength: number;
  private featureDim: number;
  private config: LSTMThreatDetector;

  constructor(sequenceLength: number = 256, featureDim: number = 64) {
    this.sequenceLength = sequenceLength;
    this.featureDim = featureDim;
    this.config = {
      modelName: 'LSTM-Threat-Detector-v1',
      inputShape: [sequenceLength, featureDim],
      sequenceLength,
      predictionResult: {
        threatScore: 0,
        threatType: 'unknown',
        confidence: 0,
        timestamp: new Date(),
        sequenceAnalysis: {
          sequenceLength,
          patterns: [],
          entropy: 0,
          anomalyIndices: [],
          normalBehavior: true,
        },
        anomalies: [],
      },
    };
  }

  /**
   * Build LSTM model architecture
   */
  buildModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 256,
          returnSequences: true,
          activation: 'relu',
          inputShape: [this.sequenceLength, this.featureDim],
          recurrentDropout: 0.2,
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          activation: 'relu',
          recurrentDropout: 0.2,
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
          activation: 'relu',
          recurrentDropout: 0.2,
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 5,
          activation: 'softmax',
        }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy', 'mae'],
    });

    this.model = model;
    return model;
  }

  /**
   * Predict threat from sequence
   */
  async predict(sequence: number[][]): Promise<LSTMPrediction> {
    if (!this.model) {
      this.buildModel();
    }

    // Pad or truncate sequence
    const paddedSequence = this.padSequence(sequence);
    const input = tf.tensor3d([paddedSequence]);

    const prediction = this.model!.predict(input) as tf.Tensor;
    const values = await prediction.data();
    const predictionArray = Array.from(values);

    // Analyze sequence for patterns
    const patterns = this.analyzeSequencePatterns(paddedSequence);
    const entropy = this.calculateEntropy(paddedSequence);
    const anomalies = this.detectSequenceAnomalies(paddedSequence);

    const threatLevel = this.getThreatLevel(predictionArray);

    input.dispose();
    prediction.dispose();

    return {
      threatScore: Math.max(...predictionArray),
      threatType: threatLevel,
      confidence: Math.max(...predictionArray),
      timestamp: new Date(),
      sequenceAnalysis: {
        sequenceLength: paddedSequence.length,
        patterns,
        entropy,
        anomalyIndices: anomalies.map((a) => a.index),
        normalBehavior: entropy < 5,
      },
      anomalies,
    };
  }

  /**
   * Pad sequence to required length
   */
  private padSequence(sequence: number[][]): number[][] {
    if (sequence.length > this.sequenceLength) {
      return sequence.slice(-this.sequenceLength);
    }

    while (sequence.length < this.sequenceLength) {
      sequence.unshift(Array(this.featureDim).fill(0));
    }

    return sequence;
  }

  /**
   * Analyze patterns in sequence
   */
  private analyzeSequencePatterns(sequence: number[][]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    const patternMap = new Map<string, number[]>();

    // Look for repeated sub-sequences
    for (let i = 0; i < sequence.length - 5; i++) {
      const subseq = JSON.stringify(sequence.slice(i, i + 5));
      if (!patternMap.has(subseq)) {
        patternMap.set(subseq, []);
      }
      patternMap.get(subseq)!.push(i);
    }

    // Convert to pattern objects
    patternMap.forEach((locations, pattern) => {
      if (locations.length > 1) {
        const severity = Math.min(1, locations.length / sequence.length);
        patterns.push({
          pattern: pattern.substring(0, 50),
          occurrences: locations.length,
          confidence: 0.7,
          locations,
          severity,
        });
      }
    });

    return patterns.sort((a, b) => b.occurrences - a.occurrences).slice(0, 5);
  }

  /**
   * Calculate entropy of sequence
   */
  private calculateEntropy(sequence: number[][]): number {
    const flattened = sequence.flat();
    const min = Math.min(...flattened);
    const max = Math.max(...flattened);
    const range = max - min || 1;

    // Bin the values
    const bins = 10;
    const binCounts = new Array(bins).fill(0);

    flattened.forEach((value) => {
      const binIndex = Math.floor(((value - min) / range) * (bins - 1));
      binCounts[binIndex]++;
    });

    // Calculate entropy
    const probabilities = binCounts.map((count) => count / flattened.length);
    const entropy = -probabilities.reduce((sum, p) => {
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);

    return entropy;
  }

  /**
   * Detect anomalies in sequence
   */
  private detectSequenceAnomalies(sequence: number[][]): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];

    // Calculate running mean and std dev
    const flattened = sequence.flat();
    const mean = flattened.reduce((a, b) => a + b, 0) / flattened.length;
    const variance = flattened.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flattened.length;
    const stdDev = Math.sqrt(variance);

    // Find outliers
    flattened.forEach((value, index) => {
      const zscore = (value - mean) / (stdDev || 1);
      if (Math.abs(zscore) > 2.5) {
        anomalies.push({
          index,
          value,
          expected: mean,
          deviation: value - mean,
          zscore,
        });
      }
    });

    return anomalies.sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore));
  }

  /**
   * Get threat level from prediction array
   */
  private getThreatLevel(predictions: number[]): string {
    const threatLevels = ['critical', 'high', 'medium', 'low', 'none'];
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    return threatLevels[maxIndex] || 'unknown';
  }

  /**
   * Train model
   */
  async train(trainingData: TrainingData): Promise<void> {
    if (!this.model) {
      this.buildModel();
    }

    const xs = tf.tensor3d(trainingData.sequences);
    const ys = tf.tensor2d(
      trainingData.labels.map((label) => {
        const onehot = [0, 0, 0, 0, 0];
        onehot[label] = 1;
        return onehot;
      })
    );

    await this.model!.fit(xs, ys, {
      epochs: trainingData.epochs,
      batchSize: trainingData.batchSize,
      validationSplit: trainingData.validationSplit,
      verbose: 0,
    });

    xs.dispose();
    ys.dispose();
  }

  /**
   * Dispose model
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

/**
 * CNN-based threat detector for spatial patterns
 */
export class CNNThreatDetectionModel {
  private model: tf.LayersModel | null = null;
  private config: CNNThreatDetector;

  constructor(filters: number[] = [32, 64, 128, 256]) {
    this.config = {
      modelName: 'CNN-Threat-Detector-v1',
      inputShape: [64, 64, 3],
      filters,
      predictionResult: {
        threatLevel: 'unknown',
        featureMaps: [],
        confidenceScores: [],
        detectedPatterns: [],
        spatialAnalysis: {
          entropy: 0,
          concentration: 0,
          distribution: 'uniform',
          hotspots: [],
        },
        timestamp: new Date(),
      },
    };
  }

  /**
   * Build CNN model architecture
   */
  buildModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // First convolutional block
        tf.layers.conv2d({
          filters: 32,
          kernelSize: 3,
          strides: 1,
          padding: 'same',
          activation: 'relu',
          inputShape: [64, 64, 3],
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.25 }),

        // Second convolutional block
        tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          strides: 1,
          padding: 'same',
          activation: 'relu',
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.25 }),

        // Third convolutional block
        tf.layers.conv2d({
          filters: 128,
          kernelSize: 3,
          strides: 1,
          padding: 'same',
          activation: 'relu',
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.3 }),

        // Fourth convolutional block
        tf.layers.conv2d({
          filters: 256,
          kernelSize: 3,
          strides: 1,
          padding: 'same',
          activation: 'relu',
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.3 }),

        // Flatten and dense layers
        tf.layers.flatten(),
        tf.layers.dense({ units: 512, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 5, activation: 'softmax' }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.0001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    this.model = model;
    return model;
  }

  /**
   * Predict threat from image data
   */
  async predict(imageData: number[][][]): Promise<CNNPrediction> {
    if (!this.model) {
      this.buildModel();
    }

    const input = tf.tensor4d([imageData]);
    const prediction = this.model!.predict(input) as tf.Tensor;
    const values = await prediction.data();
    const predictionArray = Array.from(values);

    // Analyze spatial patterns
    const spatialAnalysis = this.analyzeSpatialPatterns(imageData);
    const patterns = this.detectSpatialPatterns(imageData);

    input.dispose();
    prediction.dispose();

    const threatLevel = this.getThreatLevel(predictionArray);

    return {
      threatLevel,
      featureMaps: this.extractFeatureMaps(imageData),
      confidenceScores: predictionArray.map((score, idx) => ({
        class: this.getThreatClass(idx),
        score,
        probability: score,
      })),
      detectedPatterns: patterns,
      spatialAnalysis,
      timestamp: new Date(),
    };
  }

  /**
   * Analyze spatial patterns in image data
   */
  private analyzeSpatialPatterns(imageData: number[][][]): SpatialAnalysis {
    const flattened = imageData.flat().flat();
    const mean = flattened.reduce((a, b) => a + b, 0) / flattened.length;
    const variance = flattened.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flattened.length;

    // Calculate entropy
    const bins = 256;
    const binCounts = new Array(bins).fill(0);
    flattened.forEach((value) => {
      const binIndex = Math.floor(value % bins);
      binCounts[binIndex]++;
    });

    const probabilities = binCounts.map((count) => count / flattened.length);
    const entropy = -probabilities.reduce((sum, p) => {
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);

    // Find hotspots
    const hotspots: number[][] = [];
    for (let i = 0; i < imageData.length; i += 4) {
      for (let j = 0; j < imageData[i].length; j += 4) {
        const pixelSum = (imageData[i][j] || [0]).reduce((a, b) => a + b, 0);
        if (pixelSum > mean + variance) {
          hotspots.push([i, j]);
        }
      }
    }

    return {
      entropy: Math.min(entropy, 8),
      concentration: variance / (mean || 1),
      distribution: hotspots.length > imageData.length * imageData[0].length * 0.3
        ? 'uniform'
        : hotspots.length > 5 ? 'clustered' : 'sparse',
      hotspots: hotspots.slice(0, 10),
    };
  }

  /**
   * Detect spatial patterns
   */
  private detectSpatialPatterns(imageData: number[][][]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Simple edge detection
    for (let i = 1; i < imageData.length - 1; i++) {
      for (let j = 1; j < imageData[i].length - 1; j++) {
        const center = imageData[i][j][0] || 0;
        const neighbors = [
          imageData[i - 1][j][0],
          imageData[i + 1][j][0],
          imageData[i][j - 1][0],
          imageData[i][j + 1][0],
        ];

        const edgeMagnitude = Math.max(...neighbors.map((n) => Math.abs((n || 0) - center)));

        if (edgeMagnitude > 50) {
          patterns.push({
            name: 'Edge Pattern',
            confidence: Math.min(1, edgeMagnitude / 255),
            location: [i, j],
            size: [1, 1],
            characteristics: {
              magnitude: edgeMagnitude,
              orientation: Math.atan2(
                (imageData[i + 1][j][0] || 0) - center,
                (imageData[i][j + 1][0] || 0) - center
              ),
            },
          });
        }
      }
    }

    return patterns.slice(0, 10);
  }

  /**
   * Extract feature maps from data
   */
  private extractFeatureMaps(imageData: number[][][]): FeatureMap[] {
    return [
      {
        layer: 1,
        activations: this.subsampleImage(imageData, 2),
        topActivations: [],
      },
      {
        layer: 2,
        activations: this.subsampleImage(imageData, 4),
        topActivations: [],
      },
    ];
  }

  /**
   * Subsample image
   */
  private subsampleImage(imageData: number[][][], factor: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < imageData.length; i += factor) {
      const row: number[] = [];
      for (let j = 0; j < imageData[i].length; j += factor) {
        row.push(imageData[i][j][0] || 0);
      }
      result.push(row);
    }
    return result;
  }

  /**
   * Get threat level
   */
  private getThreatLevel(predictions: number[]): string {
    const threatLevels = ['critical', 'high', 'medium', 'low', 'none'];
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    return threatLevels[maxIndex] || 'unknown';
  }

  /**
   * Get threat class name
   */
  private getThreatClass(index: number): string {
    const classes = ['critical', 'high', 'medium', 'low', 'none'];
    return classes[index] || 'unknown';
  }

  /**
   * Train model
   */
  async train(trainingData: TrainingData): Promise<void> {
    if (!this.model) {
      this.buildModel();
    }

    const xs = tf.tensor4d(trainingData.sequences);
    const ys = tf.tensor2d(
      trainingData.labels.map((label) => {
        const onehot = [0, 0, 0, 0, 0];
        onehot[label] = 1;
        return onehot;
      })
    );

    await this.model!.fit(xs, ys, {
      epochs: trainingData.epochs,
      batchSize: trainingData.batchSize,
      validationSplit: trainingData.validationSplit,
      verbose: 0,
    });

    xs.dispose();
    ys.dispose();
  }

  /**
   * Dispose model
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

/**
 * Hybrid threat detector combining LSTM and CNN
 */
export class HybridThreatDetector {
  private lstmModel: LSTMThreatDetectionModel;
  private cnnModel: CNNThreatDetectionModel;

  constructor() {
    this.lstmModel = new LSTMThreatDetectionModel();
    this.cnnModel = new CNNThreatDetectionModel();
  }

  /**
   * Perform hybrid prediction
   */
  async predictHybrid(
    sequenceData: number[][],
    imageData: number[][][]
  ): Promise<HybridPrediction> {
    const [lstmResult, cnnResult] = await Promise.all([
      this.lstmModel.predict(sequenceData),
      this.cnnModel.predict(imageData),
    ]);

    const ensemble = this.combineEnsembleResults(lstmResult, cnnResult);
    const finalDecision = this.makeFinalDecision(ensemble);

    return {
      lstm: lstmResult,
      cnn: cnnResult,
      ensemble,
      finalDecision,
    };
  }

  /**
   * Combine ensemble results
   */
  private combineEnsembleResults(
    lstm: LSTMPrediction,
    cnn: CNNPrediction
  ): EnsembleResult {
    const threatScores = {
      critical: 0.8,
      high: 0.6,
      medium: 0.4,
      low: 0.2,
      none: 0,
    };

    const lstmScore = threatScores[lstm.threatType as keyof typeof threatScores] || 0;
    const cnnScore = threatScores[cnn.threatLevel as keyof typeof threatScores] || 0;

    const combinedScore = (lstmScore + cnnScore) / 2;
    const agreement = 1 - Math.abs(lstmScore - cnnScore);

    return {
      combinedScore,
      modelAgreement: agreement,
      conflictingPredictions:
        agreement < 0.5 ? [lstm.threatType, cnn.threatLevel] : [],
      confidence: Math.max(lstm.confidence, cnnResult.confidenceScores[0]?.score || 0),
      reasoning: [
        `LSTM detected ${lstm.threatType} with ${(lstm.confidence * 100).toFixed(1)}% confidence`,
        `CNN detected ${cnn.threatLevel} with ${(cnn.confidenceScores[0]?.score * 100 || 0).toFixed(1)}% confidence`,
        `Ensemble agreement score: ${(agreement * 100).toFixed(1)}%`,
      ],
    };
  }

  /**
   * Make final threat decision
   */
  private makeFinalDecision(ensemble: EnsembleResult): ThreatDecision {
    let threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';

    if (ensemble.combinedScore > 0.7) threatLevel = 'critical';
    else if (ensemble.combinedScore > 0.55) threatLevel = 'high';
    else if (ensemble.combinedScore > 0.4) threatLevel = 'medium';
    else if (ensemble.combinedScore > 0.25) threatLevel = 'low';

    return {
      isThreaten: threatLevel !== 'none',
      threatLevel,
      confidence: ensemble.confidence,
      requiredAction: this.getRequiredAction(threatLevel),
      automationPlaybook: threatLevel === 'critical' ? 'isolate_and_investigate' : undefined,
    };
  }

  /**
   * Get required action
   */
  private getRequiredAction(threatLevel: string): string {
    const actions: Record<string, string> = {
      critical: 'Immediately isolate asset and escalate',
      high: 'Investigate and restrict access',
      medium: 'Monitor and log activity',
      low: 'Add to watchlist',
      none: 'No action required',
    };
    return actions[threatLevel] || 'Review alert';
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.lstmModel.dispose();
    this.cnnModel.dispose();
  }
}

export const hybridThreatDetector = new HybridThreatDetector();
