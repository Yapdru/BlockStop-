/**
 * Trend Analyzer - Time Series Trend Analysis Module
 * Analyzes trends, seasonality, moving averages, and trend breaks
 */

export interface Trend {
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  slope: number;
  seasonality: boolean;
  periods: number;
}

export interface DataPoint {
  timestamp: Date;
  value: number;
}

export interface TrendBreak {
  timestamp: Date;
  direction: string;
  magnitude: number;
  confidence: number;
}

export interface SeasonalityResult {
  seasonal: boolean;
  period: number;
  strength: number;
}

/**
 * Trend Analyzer class for time series trend analysis
 */
export class TrendAnalyzer {
  /**
   * Analyze trend in time series data
   */
  async analyzeTrend(data: DataPoint[]): Promise<Trend> {
    try {
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error('At least 2 data points required');
      }

      // Extract values for analysis
      const values = data.map(d => d.value);

      // Calculate trend metrics
      const { slope } = this.calculateLinearRegression(values);
      const percentageChange = this.calculatePercentageChange(
        values[0],
        values[values.length - 1]
      );

      // Determine direction
      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(slope) > 0.001) {
        direction = slope > 0 ? 'up' : 'down';
      }

      // Detect seasonality
      const seasonality = await this.detectSeasonality(values);

      return {
        direction,
        percentageChange,
        slope,
        seasonality: seasonality.seasonal,
        periods: data.length,
      };
    } catch (error) {
      console.error('Trend analysis error:', error);
      throw error;
    }
  }

  /**
   * Detect seasonality in time series data
   */
  async detectSeasonality(data: number[]): Promise<SeasonalityResult> {
    try {
      if (!Array.isArray(data) || data.length < 12) {
        return { seasonal: false, period: 0, strength: 0 };
      }

      // Test common seasonal periods
      const periods = [7, 12, 24, 52, 365]; // daily, monthly, quarterly, yearly
      let bestPeriod = 0;
      let bestStrength = 0;

      for (const period of periods) {
        if (period > data.length / 2) continue;

        const strength = this.calculateSeasonalityStrength(data, period);
        if (strength > bestStrength) {
          bestStrength = strength;
          bestPeriod = period;
        }
      }

      // Seasonality is significant if strength > 0.3
      const seasonal = bestStrength > 0.3;

      return {
        seasonal,
        period: bestPeriod,
        strength: bestStrength,
      };
    } catch (error) {
      console.error('Seasonality detection error:', error);
      throw error;
    }
  }

  /**
   * Calculate moving average
   */
  async calculateMovingAverage(
    data: number[],
    windowSize: number
  ): Promise<number[]> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
      }

      if (windowSize <= 0 || windowSize > data.length) {
        throw new Error(
          `Window size must be between 1 and ${data.length}`
        );
      }

      const movingAverages: number[] = [];

      // Pad with NaN for first windowSize-1 points
      for (let i = 0; i < windowSize - 1; i++) {
        movingAverages.push(NaN);
      }

      // Calculate moving average
      for (let i = windowSize - 1; i < data.length; i++) {
        const window = data.slice(i - windowSize + 1, i + 1);
        const avg = window.reduce((a, b) => a + b) / windowSize;
        movingAverages.push(avg);
      }

      return movingAverages;
    } catch (error) {
      console.error('Moving average calculation error:', error);
      throw error;
    }
  }

  /**
   * Detect trend breaks in time series
   */
  async detectTrendBreaks(data: number[]): Promise<TrendBreak[]> {
    try {
      if (!Array.isArray(data) || data.length < 10) {
        return [];
      }

      const trendBreaks: TrendBreak[] = [];
      const windowSize = Math.floor(data.length / 4);

      // Analyze trend in multiple windows
      for (let i = windowSize; i < data.length - windowSize; i++) {
        const prevWindow = data.slice(i - windowSize, i);
        const nextWindow = data.slice(i, i + windowSize);

        const prevSlope = this.calculateLinearRegression(prevWindow).slope;
        const nextSlope = this.calculateLinearRegression(nextWindow).slope;

        // Significant slope change indicates trend break
        const slopeChange = Math.abs(nextSlope - prevSlope);
        if (slopeChange > 0.01) {
          const magnitude = Math.abs(data[i] - data[i - 1]);
          const confidence = Math.min(1, slopeChange * 10);

          trendBreaks.push({
            timestamp: new Date(Date.now() - (data.length - i) * 86400000), // Estimate based on position
            direction: nextSlope > prevSlope ? 'accelerating' : 'decelerating',
            magnitude,
            confidence,
          });
        }
      }

      return trendBreaks;
    } catch (error) {
      console.error('Trend break detection error:', error);
      throw error;
    }
  }

  /**
   * Calculate exponential weighted moving average
   */
  async calculateEWMA(
    data: number[],
    alpha: number
  ): Promise<number[]> {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
      }

      if (alpha <= 0 || alpha > 1) {
        throw new Error('Alpha must be between 0 and 1');
      }

      const ewma: number[] = [];
      ewma[0] = data[0];

      for (let i = 1; i < data.length; i++) {
        ewma[i] = alpha * data[i] + (1 - alpha) * ewma[i - 1];
      }

      return ewma;
    } catch (error) {
      console.error('EWMA calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate volatility (standard deviation)
   */
  async calculateVolatility(data: number[]): Promise<number> {
    try {
      if (!Array.isArray(data) || data.length < 2) {
        throw new Error('At least 2 data points required');
      }

      const mean = data.reduce((a, b) => a + b) / data.length;
      const variance =
        data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        data.length;
      const volatility = Math.sqrt(variance);

      return volatility;
    } catch (error) {
      console.error('Volatility calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate correlation between two time series
   */
  async calculateCorrelation(
    series1: number[],
    series2: number[]
  ): Promise<number> {
    try {
      if (series1.length !== series2.length) {
        throw new Error('Series must have equal length');
      }

      if (series1.length < 2) {
        throw new Error('At least 2 data points required');
      }

      const mean1 = series1.reduce((a, b) => a + b) / series1.length;
      const mean2 = series2.reduce((a, b) => a + b) / series2.length;

      const numerator = series1.reduce(
        (sum, val, i) => sum + (val - mean1) * (series2[i] - mean2),
        0
      );

      const variance1 = series1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0);
      const variance2 = series2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0);

      const denominator = Math.sqrt(variance1 * variance2);

      if (denominator === 0) return 0;

      return numerator / denominator;
    } catch (error) {
      console.error('Correlation calculation error:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies using IQR method
   */
  async detectAnomalies(data: number[]): Promise<number[]> {
    try {
      if (!Array.isArray(data) || data.length < 4) {
        return [];
      }

      const sorted = [...data].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length / 4);
      const q3Index = Math.floor((3 * sorted.length) / 4);

      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;

      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const anomalyIndices = data
        .map((val, idx) => (val < lowerBound || val > upperBound ? idx : -1))
        .filter(idx => idx !== -1);

      return anomalyIndices;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      throw error;
    }
  }

  /**
   * Calculate seasonality strength using autocorrelation
   */
  private calculateSeasonalityStrength(
    data: number[],
    period: number
  ): number {
    const seasonal: number[] = [];

    for (let i = 0; i < period; i++) {
      let sum = 0;
      let count = 0;

      for (let j = i; j < data.length; j += period) {
        sum += data[j];
        count++;
      }

      seasonal.push(sum / count);
    }

    const mean = data.reduce((a, b) => a + b) / data.length;
    const totalVariance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;

    const seasonalVariance =
      seasonal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;

    if (totalVariance === 0) return 0;

    return seasonalVariance / totalVariance;
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(start: number, end: number): number {
    if (start === 0) return end === 0 ? 0 : 100;
    return ((end - start) / Math.abs(start)) * 100;
  }

  /**
   * Calculate linear regression slope and intercept
   */
  private calculateLinearRegression(
    data: number[]
  ): { slope: number; intercept: number } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    const numerator = x.reduce(
      (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
      0
    );
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
  }
}

export default TrendAnalyzer;
