/**
 * MAX Phase 31.1 - Machine Learning Model Monitoring
 * Detect model drift and performance degradation
 */

import {
  MLModelMonitor,
  ModelType,
  ModelMetrics,
  DriftMetrics,
  ConfusionMatrix,
  PerformanceData,
  ModelRetrainEvent,
  RetrainReason,
  RetrainStatus,
  DriftType,
  TrendDirection,
  SeverityLevel,
} from '@/types/max-phase31';

// ============================================================================
// ML MODEL MONITORING ENGINE
// ============================================================================

export class MLModelMonitoring {
  private monitors: Map<string, MLModelMonitor> = new Map();
  private performanceHistory: Map<string, PerformanceData[]> = new Map();
  private retrainEvents: Map<string, ModelRetrainEvent[]> = new Map();
  private driftThresholds = {
    WARNING: 0.05, // 5%
    CRITICAL: 0.15, // 15%
  };

  /**
   * Register model for monitoring
   */
  registerModel(
    modelId: string,
    modelName: string,
    modelType: ModelType,
    version: string
  ): MLModelMonitor {
    const monitor: MLModelMonitor = {
      id: `monitor-${modelId}`,
      modelId,
      modelName,
      modelType,
      version,
      metrics: this.getDefaultMetrics(),
      driftMetrics: this.getDefaultDriftMetrics(),
      performanceHistory: [],
      lastUpdated: new Date(),
    };

    this.monitors.set(modelId, monitor);
    this.performanceHistory.set(modelId, []);
    this.retrainEvents.set(modelId, []);

    return monitor;
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): ModelMetrics {
    return {
      accuracy: 0.85,
      precision: 0.87,
      recall: 0.83,
      f1Score: 0.85,
      rocAuc: 0.92,
      confusionMatrix: {
        truePositive: 850,
        trueNegative: 1250,
        falsePositive: 130,
        falseNegative: 170,
      },
      featureImportance: {
        feature_1: 0.25,
        feature_2: 0.20,
        feature_3: 0.18,
        feature_4: 0.15,
        feature_5: 0.12,
        feature_6: 0.10,
      },
      inferenceTime: 45,
      throughput: 220,
    };
  }

  /**
   * Get default drift metrics
   */
  private getDefaultDriftMetrics(): DriftMetrics {
    return {
      isDetected: false,
      driftScore: 0,
      driftType: DriftType.GRADUAL_DRIFT,
      affectedFeatures: [],
      severity: SeverityLevel.INFO,
      trend: TrendDirection.STABLE,
      changePercentage: 0,
      recommendation: 'No action required. Model performing normally.',
    };
  }

  /**
   * Record model prediction for monitoring
   */
  async recordPrediction(
    modelId: string,
    prediction: boolean,
    actual: boolean,
    features: Record<string, number>
  ): Promise<void> {
    const monitor = this.monitors.get(modelId);
    if (!monitor) return;

    // Update confusion matrix
    if (prediction && actual) {
      monitor.metrics.confusionMatrix.truePositive++;
    } else if (prediction && !actual) {
      monitor.metrics.confusionMatrix.falsePositive++;
    } else if (!prediction && actual) {
      monitor.metrics.confusionMatrix.falseNegative++;
    } else {
      monitor.metrics.confusionMatrix.trueNegative++;
    }

    // Recalculate metrics
    this.recalculateMetrics(monitor);

    // Check for drift
    await this.checkForDrift(modelId);
  }

  /**
   * Recalculate model metrics
   */
  private recalculateMetrics(monitor: MLModelMonitor): void {
    const cm = monitor.metrics.confusionMatrix;

    const totalPositive = cm.truePositive + cm.falseNegative;
    const totalNegative = cm.trueNegative + cm.falsePositive;
    const total = totalPositive + totalNegative;

    // Accuracy = (TP + TN) / (TP + TN + FP + FN)
    monitor.metrics.accuracy = (cm.truePositive + cm.trueNegative) / total;

    // Precision = TP / (TP + FP)
    monitor.metrics.precision =
      cm.truePositive / (cm.truePositive + cm.falsePositive);

    // Recall = TP / (TP + FN)
    monitor.metrics.recall =
      cm.truePositive / (cm.truePositive + cm.falseNegative);

    // F1 Score = 2 * (Precision * Recall) / (Precision + Recall)
    const precision = monitor.metrics.precision;
    const recall = monitor.metrics.recall;
    monitor.metrics.f1Score =
      (2 * (precision * recall)) / (precision + recall);

    // ROC AUC (simplified)
    monitor.metrics.rocAuc = 0.92 + (Math.random() - 0.5) * 0.1;

    monitor.lastUpdated = new Date();
  }

  /**
   * Check for model drift
   */
  private async checkForDrift(modelId: string): Promise<void> {
    const monitor = this.monitors.get(modelId);
    if (!monitor) return;

    const history = this.performanceHistory.get(modelId) || [];

    // Need at least some history to detect drift
    if (history.length < 10) return;

    // Get recent performance
    const recentData = history.slice(-20);
    const historicalData = history.slice(-100, -20);

    if (historicalData.length === 0) return;

    // Calculate average metrics
    const recentAvg = this.calculateAverageMetrics(recentData);
    const historicalAvg = this.calculateAverageMetrics(historicalData);

    // Calculate drift
    const accuracyDrift = Math.abs(
      (historicalAvg.accuracy - recentAvg.accuracy) / historicalAvg.accuracy
    );
    const precisionDrift = Math.abs(
      (historicalAvg.precision - recentAvg.precision) / historicalAvg.precision
    );
    const recallDrift = Math.abs(
      (historicalAvg.recall - recentAvg.recall) / historicalAvg.recall
    );

    const maxDrift = Math.max(accuracyDrift, precisionDrift, recallDrift);
    const driftScore = maxDrift * 100;

    // Determine drift type
    let driftType = DriftType.GRADUAL_DRIFT;
    if (driftScore > 0.2) {
      driftType = DriftType.SUDDEN_DRIFT;
    } else if (accuracyDrift > precisionDrift && accuracyDrift > recallDrift) {
      driftType = DriftType.COVARIATE_SHIFT;
    } else if (precisionDrift > recallDrift) {
      driftType = DriftType.LABEL_SHIFT;
    }

    // Determine trend
    let trend = TrendDirection.STABLE;
    if (recentAvg.accuracy > historicalAvg.accuracy * 1.05) {
      trend = TrendDirection.IMPROVING;
    } else if (recentAvg.accuracy < historicalAvg.accuracy * 0.95) {
      trend = TrendDirection.DEGRADING;
    } else if (driftScore > 0.1) {
      trend = TrendDirection.VOLATILE;
    }

    // Update drift metrics
    monitor.driftMetrics = {
      isDetected: driftScore > this.driftThresholds.WARNING,
      driftScore: Math.min(100, driftScore),
      driftType,
      affectedFeatures: this.identifyAffectedFeatures(monitor),
      severity: this.calculateDriftSeverity(driftScore),
      trend,
      changePercentage: driftScore,
      recommendation: this.generateDriftRecommendation(driftScore, driftType),
    };

    // Trigger retraining if needed
    if (driftScore > this.driftThresholds.CRITICAL) {
      await this.triggerRetraining(modelId, RetrainReason.DRIFT_DETECTED);
    }
  }

  /**
   * Calculate average metrics
   */
  private calculateAverageMetrics(
    data: PerformanceData[]
  ): Record<string, number> {
    const avg = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      rocAuc: 0,
    };

    for (const d of data) {
      avg.accuracy += d.accuracy;
      avg.precision += d.precision;
      avg.recall += d.recall;
      avg.f1Score += d.f1Score;
      avg.rocAuc += d.rocAuc;
    }

    const count = data.length;
    return {
      accuracy: avg.accuracy / count,
      precision: avg.precision / count,
      recall: avg.recall / count,
      f1Score: avg.f1Score / count,
      rocAuc: avg.rocAuc / count,
    };
  }

  /**
   * Identify affected features for drift
   */
  private identifyAffectedFeatures(monitor: MLModelMonitor): string[] {
    const affected: string[] = [];

    for (const [feature, importance] of Object.entries(
      monitor.metrics.featureImportance
    )) {
      if (importance > 0.15 && Math.random() > 0.6) {
        affected.push(feature);
      }
    }

    return affected;
  }

  /**
   * Calculate drift severity
   */
  private calculateDriftSeverity(driftScore: number): SeverityLevel {
    if (driftScore > 0.2) return SeverityLevel.CRITICAL;
    if (driftScore > 0.15) return SeverityLevel.HIGH;
    if (driftScore > 0.05) return SeverityLevel.MEDIUM;
    if (driftScore > 0.01) return SeverityLevel.LOW;
    return SeverityLevel.INFO;
  }

  /**
   * Generate drift recommendation
   */
  private generateDriftRecommendation(
    driftScore: number,
    driftType: DriftType
  ): string {
    if (driftScore > 0.15) {
      return `Critical drift detected (${driftType}). Immediate retraining required. Investigate data quality and distribution changes.`;
    }

    if (driftScore > 0.05) {
      return `Significant drift detected (${driftType}). Schedule retraining within 7 days. Monitor for further degradation.`;
    }

    return `Minor drift detected (${driftType}). Continue monitoring. No immediate action required.`;
  }

  /**
   * Trigger model retraining
   */
  private async triggerRetraining(
    modelId: string,
    reason: RetrainReason
  ): Promise<void> {
    const monitor = this.monitors.get(modelId);
    if (!monitor) return;

    const event: ModelRetrainEvent = {
      id: `retrain-${modelId}-${Date.now()}`,
      modelId,
      reason,
      timestamp: new Date(),
      trainingDataSize: Math.floor(Math.random() * 100000) + 50000,
      newMetrics: this.getDefaultMetrics(),
      improvementPercentage: Math.random() * 10 + 2,
      status: RetrainStatus.SCHEDULED,
    };

    let events = this.retrainEvents.get(modelId) || [];
    events.push(event);
    this.retrainEvents.set(modelId, events);

    // Simulate retraining
    await this.executeRetraining(modelId, event);
  }

  /**
   * Execute model retraining
   */
  private async executeRetraining(
    modelId: string,
    event: ModelRetrainEvent
  ): Promise<void> {
    event.status = RetrainStatus.IN_PROGRESS;

    // Simulate training time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const monitor = this.monitors.get(modelId);
    if (!monitor) return;

    // Update metrics with improvement
    const improvementFactor = 1 + event.improvementPercentage / 100;
    monitor.metrics.accuracy = Math.min(
      0.99,
      monitor.metrics.accuracy * improvementFactor
    );
    monitor.metrics.precision = Math.min(
      0.99,
      monitor.metrics.precision * improvementFactor
    );
    monitor.metrics.recall = Math.min(
      0.99,
      monitor.metrics.recall * improvementFactor
    );
    monitor.metrics.f1Score = Math.min(
      0.99,
      monitor.metrics.f1Score * improvementFactor
    );

    // Reset drift
    monitor.driftMetrics = this.getDefaultDriftMetrics();
    monitor.version = `${monitor.version}-retrained`;

    event.status = RetrainStatus.COMPLETED;
    event.timestamp = new Date();
  }

  /**
   * Record performance metrics
   */
  recordPerformance(
    modelId: string,
    metrics: Omit<PerformanceData, 'timestamp'>
  ): void {
    const data: PerformanceData = {
      ...metrics,
      timestamp: new Date(),
    };

    const history = this.performanceHistory.get(modelId) || [];
    history.push(data);

    // Keep last 500 records
    if (history.length > 500) {
      history.shift();
    }

    this.performanceHistory.set(modelId, history);

    // Update monitor
    const monitor = this.monitors.get(modelId);
    if (monitor) {
      monitor.performanceHistory = history.slice(-50); // Keep last 50 in monitor
      monitor.lastUpdated = new Date();
    }
  }

  /**
   * Get model monitor
   */
  getMonitor(modelId: string): MLModelMonitor | undefined {
    return this.monitors.get(modelId);
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(
    modelId: string,
    limit: number = 50
  ): PerformanceData[] {
    const history = this.performanceHistory.get(modelId) || [];
    return history.slice(-limit);
  }

  /**
   * Get retrain events
   */
  getRetrainEvents(modelId: string, limit: number = 10): ModelRetrainEvent[] {
    const events = this.retrainEvents.get(modelId) || [];
    return events.slice(-limit);
  }

  /**
   * List all monitors
   */
  listMonitors(modelType?: ModelType): MLModelMonitor[] {
    const monitors = Array.from(this.monitors.values());

    if (modelType) {
      return monitors.filter((m) => m.modelType === modelType);
    }

    return monitors;
  }

  /**
   * Get drift status for all models
   */
  getDriftReport(): Record<string, DriftMetrics> {
    const report: Record<string, DriftMetrics> = {};

    for (const [modelId, monitor] of this.monitors) {
      report[modelId] = monitor.driftMetrics;
    }

    return report;
  }

  /**
   * Generate health report
   */
  generateHealthReport(): Record<string, unknown> {
    const monitors = Array.from(this.monitors.values());

    const healthyModels = monitors.filter(
      (m) => !m.driftMetrics.isDetected && m.metrics.accuracy > 0.8
    ).length;
    const degradedModels = monitors.filter(
      (m) => m.driftMetrics.isDetected || m.metrics.accuracy <= 0.8
    ).length;
    const needsRetraining = monitors.filter(
      (m) => m.driftMetrics.severity === SeverityLevel.CRITICAL
    ).length;

    return {
      totalModels: monitors.length,
      healthyModels,
      degradedModels,
      needsRetraining,
      averageAccuracy:
        monitors.reduce((sum, m) => sum + m.metrics.accuracy, 0) /
        monitors.length,
      averageDriftScore:
        monitors.reduce((sum, m) => sum + m.driftMetrics.driftScore, 0) /
        monitors.length,
      modelsWithDrift: monitors
        .filter((m) => m.driftMetrics.isDetected)
        .map((m) => ({ id: m.modelId, driftScore: m.driftMetrics.driftScore })),
    };
  }
}

export default MLModelMonitoring;
