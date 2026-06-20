import { EventEmitter } from 'events';

export interface ScalingMetrics {
  cpu: number;
  memory: number;
  requestLatency: number;
  requestsPerSecond: number;
}

export interface ScalingAction {
  type: 'scale-up' | 'scale-down' | 'no-action';
  reason: string;
  targetCount?: number;
  timestamp: Date;
}

export interface ScalingPolicy {
  name: string;
  metric: string;
  threshold: number;
  comparison: '>' | '<' | '==' | '>=' | '<=';
  scalingAdjustment: number;
  cooldown: number;
}

export class AutoScaler extends EventEmitter {
  private scalingHistory: ScalingAction[] = [];
  private scalingPolicies: Map<string, ScalingPolicy> = new Map();
  private currentInstanceCount: number = 1;
  private minInstances: number = 1;
  private maxInstances: number = 10;
  private lastScalingAction: Date = new Date();
  private metricsHistory: ScalingMetrics[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor(minInstances: number = 1, maxInstances: number = 10) {
    super();
    this.minInstances = minInstances;
    this.maxInstances = maxInstances;
    this.currentInstanceCount = minInstances;
  }

  async evaluateMetrics(metrics: ScalingMetrics): Promise<ScalingAction> {
    try {
      // Store metrics history
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.MAX_HISTORY) {
        this.metricsHistory.shift();
      }

      // Check if we're still in cooldown period from last scaling action
      const timeSinceLastAction = Date.now() - this.lastScalingAction.getTime();
      const minCooldown = this.getMinimumCooldown();

      if (timeSinceLastAction < minCooldown * 1000) {
        return {
          type: 'no-action',
          reason: 'In cooldown period from previous scaling action',
          timestamp: new Date(),
        };
      }

      // Evaluate scaling policies
      for (const policy of this.scalingPolicies.values()) {
        const shouldScale = this.evaluatePolicy(policy, metrics);

        if (shouldScale) {
          const newCount = Math.max(
            this.minInstances,
            Math.min(this.maxInstances, this.currentInstanceCount + policy.scalingAdjustment)
          );

          const action: ScalingAction = {
            type: policy.scalingAdjustment > 0 ? 'scale-up' : 'scale-down',
            reason: `Policy '${policy.name}' triggered: ${policy.metric} ${policy.comparison} ${policy.threshold}`,
            targetCount: newCount,
            timestamp: new Date(),
          };

          this.scalingHistory.push(action);
          this.lastScalingAction = new Date();
          this.currentInstanceCount = newCount;

          this.emit('scaling-action', action);
          return action;
        }
      }

      // No scaling needed
      return {
        type: 'no-action',
        reason: 'All metrics within acceptable ranges',
        timestamp: new Date(),
      };
    } catch (error) {
      this.emit('error', { type: 'evaluation-failed', error });
      throw new Error(`Failed to evaluate metrics: ${error}`);
    }
  }

  private evaluatePolicy(policy: ScalingPolicy, metrics: ScalingMetrics): boolean {
    let metricValue: number;

    switch (policy.metric) {
      case 'cpu':
        metricValue = metrics.cpu;
        break;
      case 'memory':
        metricValue = metrics.memory;
        break;
      case 'latency':
        metricValue = metrics.requestLatency;
        break;
      case 'requests':
        metricValue = metrics.requestsPerSecond;
        break;
      default:
        return false;
    }

    switch (policy.comparison) {
      case '>':
        return metricValue > policy.threshold;
      case '<':
        return metricValue < policy.threshold;
      case '>=':
        return metricValue >= policy.threshold;
      case '<=':
        return metricValue <= policy.threshold;
      case '==':
        return metricValue === policy.threshold;
      default:
        return false;
    }
  }

  async scaleHorizontal(newInstanceCount: number): Promise<{ success: boolean; newCount: number }> {
    try {
      const validCount = Math.max(this.minInstances, Math.min(this.maxInstances, newInstanceCount));

      if (validCount === this.currentInstanceCount) {
        return { success: true, newCount: validCount };
      }

      const change = validCount > this.currentInstanceCount ? 'up' : 'down';
      const difference = Math.abs(validCount - this.currentInstanceCount);

      const action: ScalingAction = {
        type: change === 'up' ? 'scale-up' : 'scale-down',
        reason: `Horizontal scaling: ${difference} instance(s) ${change}`,
        targetCount: validCount,
        timestamp: new Date(),
      };

      this.scalingHistory.push(action);
      this.currentInstanceCount = validCount;
      this.lastScalingAction = new Date();

      this.emit('horizontal-scaling', { oldCount: this.currentInstanceCount, newCount: validCount });

      return { success: true, newCount: validCount };
    } catch (error) {
      this.emit('error', { type: 'horizontal-scaling-failed', error });
      throw error;
    }
  }

  async scaleVertical(newInstanceSize: string): Promise<{ success: boolean; newSize: string }> {
    try {
      const validSizes = ['small', 'medium', 'large', 'xlarge'];

      if (!validSizes.includes(newInstanceSize)) {
        throw new Error(`Invalid instance size: ${newInstanceSize}`);
      }

      const action: ScalingAction = {
        type: 'scale-up',
        reason: `Vertical scaling: upgraded to ${newInstanceSize}`,
        timestamp: new Date(),
      };

      this.scalingHistory.push(action);
      this.lastScalingAction = new Date();

      this.emit('vertical-scaling', { newSize: newInstanceSize });

      return { success: true, newSize: newInstanceSize };
    } catch (error) {
      this.emit('error', { type: 'vertical-scaling-failed', error });
      throw error;
    }
  }

  async getScalingHistory(): Promise<ScalingAction[]> {
    return [...this.scalingHistory];
  }

  async getScalingHistoryByRange(
    startDate: Date,
    endDate: Date
  ): Promise<ScalingAction[]> {
    return this.scalingHistory.filter(
      (action) => action.timestamp >= startDate && action.timestamp <= endDate
    );
  }

  async addScalingPolicy(policy: ScalingPolicy): Promise<void> {
    try {
      if (!policy.name || !policy.metric) {
        throw new Error('Policy must have name and metric');
      }

      this.scalingPolicies.set(policy.name, policy);
      this.emit('policy-added', { policyName: policy.name });
    } catch (error) {
      this.emit('error', { type: 'policy-add-failed', policy, error });
      throw error;
    }
  }

  async removeScalingPolicy(policyName: string): Promise<void> {
    try {
      const deleted = this.scalingPolicies.delete(policyName);
      if (deleted) {
        this.emit('policy-removed', { policyName });
      }
    } catch (error) {
      this.emit('error', { type: 'policy-remove-failed', policyName, error });
      throw error;
    }
  }

  async getScalingPolicies(): Promise<ScalingPolicy[]> {
    return Array.from(this.scalingPolicies.values());
  }

  async getMetricsHistory(minutes: number = 60): Promise<ScalingMetrics[]> {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    return this.metricsHistory.slice(-Math.ceil(minutes / 5)); // Assuming 5-minute intervals
  }

  getCurrentInstanceCount(): number {
    return this.currentInstanceCount;
  }

  getScalingCapability(): { min: number; max: number } {
    return {
      min: this.minInstances,
      max: this.maxInstances,
    };
  }

  setScalingCapability(min: number, max: number): void {
    this.minInstances = Math.max(1, min);
    this.maxInstances = Math.max(this.minInstances, max);
    this.currentInstanceCount = Math.max(
      this.minInstances,
      Math.min(this.maxInstances, this.currentInstanceCount)
    );
    this.emit('scaling-capability-updated', {
      min: this.minInstances,
      max: this.maxInstances,
    });
  }

  private getMinimumCooldown(): number {
    let minCooldown = Infinity;

    for (const policy of this.scalingPolicies.values()) {
      minCooldown = Math.min(minCooldown, policy.cooldown);
    }

    return minCooldown === Infinity ? 300 : minCooldown; // Default 5 minutes
  }

  getStatus(): {
    currentCount: number;
    minInstances: number;
    maxInstances: number;
    lastScalingAction: Date;
    activePolicies: number;
    recentActions: ScalingAction[];
  } {
    return {
      currentCount: this.currentInstanceCount,
      minInstances: this.minInstances,
      maxInstances: this.maxInstances,
      lastScalingAction: this.lastScalingAction,
      activePolicies: this.scalingPolicies.size,
      recentActions: this.scalingHistory.slice(-10),
    };
  }
}
