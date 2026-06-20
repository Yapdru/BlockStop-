import { EventEmitter } from 'events';

export interface ScalingResult {
  success: boolean;
  newCount: number;
  previousCount: number;
  reason: string;
  timestamp: Date;
}

export class HorizontalScaler extends EventEmitter {
  private currentInstanceCount: number = 1;
  private minInstances: number = 1;
  private maxInstances: number = 10;
  private desiredInstanceCount: number = 1;
  private scalingHistory: ScalingResult[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor(minInstances: number = 1, maxInstances: number = 10, initialCount: number = 1) {
    super();
    this.minInstances = Math.max(1, minInstances);
    this.maxInstances = Math.max(this.minInstances, maxInstances);
    this.currentInstanceCount = Math.max(this.minInstances, Math.min(this.maxInstances, initialCount));
    this.desiredInstanceCount = this.currentInstanceCount;
  }

  async scaleOut(desiredCount: number): Promise<{ success: boolean; newCount: number }> {
    try {
      if (desiredCount <= this.currentInstanceCount) {
        return {
          success: true,
          newCount: this.currentInstanceCount,
        };
      }

      const validCount = Math.min(desiredCount, this.maxInstances);
      const previousCount = this.currentInstanceCount;

      if (validCount === previousCount) {
        return {
          success: true,
          newCount: validCount,
        };
      }

      // Simulate scaling out
      const scaledCount = await this.performScaleOut(validCount);

      this.currentInstanceCount = scaledCount;
      this.desiredInstanceCount = scaledCount;

      const result: ScalingResult = {
        success: true,
        newCount: scaledCount,
        previousCount,
        reason: `Scaled out from ${previousCount} to ${scaledCount} instances`,
        timestamp: new Date(),
      };

      this.scalingHistory.push(result);
      this.emit('scale-out', result);

      return { success: true, newCount: scaledCount };
    } catch (error) {
      this.emit('error', { type: 'scale-out-failed', desiredCount, error });
      throw error;
    }
  }

  async scaleIn(desiredCount: number): Promise<{ success: boolean; newCount: number }> {
    try {
      if (desiredCount >= this.currentInstanceCount) {
        return {
          success: true,
          newCount: this.currentInstanceCount,
        };
      }

      const validCount = Math.max(desiredCount, this.minInstances);
      const previousCount = this.currentInstanceCount;

      if (validCount === previousCount) {
        return {
          success: true,
          newCount: validCount,
        };
      }

      // Simulate scaling in
      const scaledCount = await this.performScaleIn(validCount);

      this.currentInstanceCount = scaledCount;
      this.desiredInstanceCount = scaledCount;

      const result: ScalingResult = {
        success: true,
        newCount: scaledCount,
        previousCount,
        reason: `Scaled in from ${previousCount} to ${scaledCount} instances`,
        timestamp: new Date(),
      };

      this.scalingHistory.push(result);
      this.emit('scale-in', result);

      return { success: true, newCount: scaledCount };
    } catch (error) {
      this.emit('error', { type: 'scale-in-failed', desiredCount, error });
      throw error;
    }
  }

  async getCurrentInstanceCount(): Promise<number> {
    return this.currentInstanceCount;
  }

  async getScalingCapability(): Promise<{ min: number; max: number }> {
    return {
      min: this.minInstances,
      max: this.maxInstances,
    };
  }

  async setScalingLimits(min: number, max: number): Promise<void> {
    try {
      if (min < 1) {
        throw new Error('Minimum instances must be at least 1');
      }

      if (max < min) {
        throw new Error('Maximum instances must be greater than or equal to minimum');
      }

      this.minInstances = min;
      this.maxInstances = max;

      // Adjust current count if needed
      if (this.currentInstanceCount < min) {
        this.currentInstanceCount = min;
      } else if (this.currentInstanceCount > max) {
        this.currentInstanceCount = max;
      }

      this.emit('scaling-limits-updated', { min, max });
    } catch (error) {
      this.emit('error', { type: 'limit-update-failed', min, max, error });
      throw error;
    }
  }

  async getScalingHistory(limit: number = 100): Promise<ScalingResult[]> {
    return this.scalingHistory.slice(-limit);
  }

  async getScalingHistoryByDate(
    startDate: Date,
    endDate: Date
  ): Promise<ScalingResult[]> {
    return this.scalingHistory.filter(
      (result) => result.timestamp >= startDate && result.timestamp <= endDate
    );
  }

  private async performScaleOut(targetCount: number): Promise<number> {
    // Simulate progressive scaling out
    const difference = targetCount - this.currentInstanceCount;
    const increment = Math.ceil(difference / 3); // Scale out in 3 steps

    let newCount = this.currentInstanceCount;

    for (let i = 0; i < 3 && newCount < targetCount; i++) {
      newCount = Math.min(newCount + increment, targetCount);
      this.emit('scaling-progress', {
        stage: i + 1,
        currentCount: newCount,
        targetCount,
      });

      // Simulate delay between scaling steps
      await this.delay(100);
    }

    return newCount;
  }

  private async performScaleIn(targetCount: number): Promise<number> {
    // Simulate progressive scaling in
    const difference = this.currentInstanceCount - targetCount;
    const decrement = Math.ceil(difference / 3); // Scale in in 3 steps

    let newCount = this.currentInstanceCount;

    for (let i = 0; i < 3 && newCount > targetCount; i++) {
      newCount = Math.max(newCount - decrement, targetCount);
      this.emit('scaling-progress', {
        stage: i + 1,
        currentCount: newCount,
        targetCount,
      });

      // Simulate delay between scaling steps
      await this.delay(100);
    }

    return newCount;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getStatus(): Promise<{
    currentCount: number;
    desiredCount: number;
    minInstances: number;
    maxInstances: number;
    scalingHistory: ScalingResult[];
  }> {
    return {
      currentCount: this.currentInstanceCount,
      desiredCount: this.desiredInstanceCount,
      minInstances: this.minInstances,
      maxInstances: this.maxInstances,
      scalingHistory: this.scalingHistory.slice(-10),
    };
  }

  async getMetrics(): Promise<{
    totalScalingEvents: number;
    averageScalingTime: number;
    successfulScalings: number;
    failedScalings: number;
  }> {
    const successful = this.scalingHistory.filter((r) => r.success).length;
    const failed = this.scalingHistory.length - successful;

    return {
      totalScalingEvents: this.scalingHistory.length,
      averageScalingTime: 500, // Simulated
      successfulScalings: successful,
      failedScalings: failed,
    };
  }

  clearHistory(): void {
    this.scalingHistory = [];
    this.emit('history-cleared');
  }

  async validateScaling(desiredCount: number): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (desiredCount < this.minInstances) {
      errors.push(`Desired count ${desiredCount} is below minimum ${this.minInstances}`);
    }

    if (desiredCount > this.maxInstances) {
      errors.push(`Desired count ${desiredCount} exceeds maximum ${this.maxInstances}`);
    }

    if (!Number.isInteger(desiredCount) || desiredCount < 1) {
      errors.push('Desired count must be a positive integer');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getDesiredInstanceCount(): number {
    return this.desiredInstanceCount;
  }

  setDesiredInstanceCount(count: number): void {
    const validCount = Math.max(this.minInstances, Math.min(this.maxInstances, count));
    this.desiredInstanceCount = validCount;
    this.emit('desired-count-updated', { desiredCount: validCount });
  }
}
