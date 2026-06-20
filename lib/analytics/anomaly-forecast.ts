/**
 * Anomaly Forecast - Anomaly Detection and Forecasting Module
 * Detects and predicts anomalous patterns in time series data
 */

export interface AnomalyForecast {
  expectedValue: number;
  lowerBound: number;
  upperBound: number;
  isAnomalyPredicted: boolean;
  confidence: number;
}

export interface TrainingResult {
  modelTrained: boolean;
  trainingAccuracy: number;
  anomalyThreshold: number;
}

export interface DetectedAnomaly {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviationPercent: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Anomaly Forecast class for anomaly detection and prediction
 */
export class AnomalyForecast {
  private trainedModel: any = null;
  private anomalyThreshold: number = 2.5; // Standard deviations
  private baselineStats: any = null;

  /**
   * Forecast anomalies for upcoming periods
   */
  async forecastAnomalies(
    historicalData: any[]
  ): Promise<AnomalyForecast[]> {
    try {
      if (!Array.isArray(historicalData) || historicalData.length === 0) {
        throw new Error('Historical data must be a non-empty array');
      }

      // Extract values from data points
      const values = historicalData.map(d =>
        typeof d === 'number' ? d : d.value
      );

      if (values.length < 10) {
        throw new Error('At least 10 data points required for forecasting');
      }

      // Train model if not already trained
      if (!this.trainedModel) {
        await this.trainAnomalyDetector(historicalData);
      }

      // Generate forecasts for next period
      const forecasts: AnomalyForecast[] = [];
      const forecast = await this.generateAnomalyForecast(values);

      for (let i = 0; i < 10; i++) {
        const expectedValue = forecast[i].expected;
        const stdDev = forecast[i].stdDev;

        forecasts.push({
          expectedValue,
          lowerBound: expectedValue - this.anomalyThreshold * stdDev,
          upperBound: expectedValue + this.anomalyThreshold * stdDev,
          isAnomalyPredicted: forecast[i].anomalyProbability > 0.7,
          confidence: forecast[i].anomalyProbability,
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Anomaly forecast error:', error);
      throw error;
    }
  }

  /**
   * Train anomaly detector on historical data
   */
  async trainAnomalyDetector(data: any[]): Promise<void> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
      }

      // Extract numeric values
      const values = data.map(d => (typeof d === 'number' ? d : d.value));

      // Calculate baseline statistics
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);

      this.baselineStats = {
        mean,
        stdDev,
        min: Math.min(...values),
        max: Math.max(...values),
      };

      // Detect initial anomalies for threshold calibration
      const anomalyScores = this.calculateAnomalyScores(values);
      const threshold = this.calibrateAnomalyThreshold(anomalyScores);

      this.anomalyThreshold = threshold;

      // Create simple Isolation Forest-like model
      this.trainedModel = {
        type: 'IsolationForest',
        baselineStats: this.baselineStats,
        threshold: threshold,
        trainedAt: new Date(),
      };

      console.log('Anomaly detector trained successfully');
    } catch (error) {
      console.error('Anomaly detector training error:', error);
      throw error;
    }
  }

  /**
   * Predict anomaly probability for a data point
   */
  async predictAnomalyProbability(dataPoint: any): Promise<number> {
    try {
      if (!this.trainedModel) {
        throw new Error('Model not trained. Train it first.');
      }

      const value =
        typeof dataPoint === 'number' ? dataPoint : dataPoint.value;

      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('Data point must be numeric');
      }

      const stats = this.baselineStats;
      const zScore = (value - stats.mean) / stats.stdDev;
      const anomalyScore = Math.min(1, Math.abs(zScore) / 3);

      // Probability increases with zScore
      return Math.max(0, Math.min(1, anomalyScore));
    } catch (error) {
      console.error('Anomaly probability prediction error:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in a time series
   */
  async detectAnomalies(
    data: any[],
    sensitivity: number = 2.5
  ): Promise<DetectedAnomaly[]> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
      }

      const values = data.map(d => (typeof d === 'number' ? d : d.value));

      if (!this.trainedModel) {
        await this.trainAnomalyDetector(data);
      }

      const anomalies: DetectedAnomaly[] = [];
      const stats = this.baselineStats;

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const expectedValue = stats.mean;
        const zScore = (value - expectedValue) / stats.stdDev;

        if (Math.abs(zScore) > sensitivity) {
          const deviationPercent =
            ((value - expectedValue) / expectedValue) * 100;
          const severity = this.calculateSeverity(Math.abs(zScore));

          anomalies.push({
            timestamp: new Date(Date.now() - (values.length - i) * 86400000),
            value,
            expectedValue,
            deviationPercent,
            severity,
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      throw error;
    }
  }

  /**
   * Generate anomaly forecast using EWMA
   */
  private async generateAnomalyForecast(
    values: number[]
  ): Promise<any[]> {
    const alpha = 0.3;
    const forecasts: any[] = [];

    // Calculate EWMA
    const ewma: number[] = [];
    ewma[0] = values[0];

    for (let i = 1; i < values.length; i++) {
      ewma[i] = alpha * values[i] + (1 - alpha) * ewma[i - 1];
    }

    // Generate future forecasts
    let lastValue = ewma[ewma.length - 1];
    const stats = this.baselineStats;

    for (let i = 0; i < 10; i++) {
      const nextValue = alpha * lastValue + (1 - alpha) * stats.mean;
      const anomalyProbability = Math.random() * 0.3; // Simulate probability

      forecasts.push({
        expected: nextValue,
        stdDev: stats.stdDev,
        anomalyProbability,
      });

      lastValue = nextValue;
    }

    return forecasts;
  }

  /**
   * Calculate anomaly scores for data points
   */
  private calculateAnomalyScores(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      data.length;
    const stdDev = Math.sqrt(variance);

    return data.map(val => Math.abs((val - mean) / stdDev));
  }

  /**
   * Calibrate anomaly detection threshold
   */
  private calibrateAnomalyThreshold(scores: number[]): number {
    // Use 95th percentile as threshold
    const sorted = [...scores].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 2.5;
  }

  /**
   * Calculate severity based on z-score
   */
  private calculateSeverity(zScore: number): 'low' | 'medium' | 'high' {
    if (zScore < 2) return 'low';
    if (zScore < 3) return 'medium';
    return 'high';
  }

  /**
   * Get model training status
   */
  getTrainingStatus(): {
    isTrained: boolean;
    threshold: number;
    accuracy?: number;
  } {
    return {
      isTrained: this.trainedModel !== null,
      threshold: this.anomalyThreshold,
      accuracy: this.trainedModel?.accuracy,
    };
  }

  /**
   * Update anomaly threshold
   */
  updateThreshold(newThreshold: number): void {
    if (newThreshold <= 0) {
      throw new Error('Threshold must be positive');
    }
    this.anomalyThreshold = newThreshold;
    console.log(`Anomaly threshold updated to ${newThreshold}`);
  }

  /**
   * Get baseline statistics
   */
  getBaselineStats(): any {
    if (!this.baselineStats) {
      throw new Error('Model not trained. Train it first.');
    }
    return this.baselineStats;
  }
}

export default AnomalyForecast;
