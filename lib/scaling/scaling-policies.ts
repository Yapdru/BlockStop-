import { EventEmitter } from 'events';

export interface ScalingMetrics {
  cpu: number;
  memory: number;
  requestLatency: number;
  requestsPerSecond: number;
}

export interface ScalingPolicy {
  name: string;
  metric: string;
  threshold: number;
  comparison: '>' | '<' | '==' | '>=' | '<=';
  scalingAdjustment: number;
  cooldown: number;
}

export interface ScalingAction {
  type: 'scale-up' | 'scale-down' | 'no-action';
  reason: string;
  targetCount?: number;
  timestamp: Date;
}

export class ScalingPolicies extends EventEmitter {
  private policies: Map<string, ScalingPolicy> = new Map();
  private policyHistory: Array<{
    timestamp: Date;
    policy: ScalingPolicy;
    action: 'created' | 'updated' | 'deleted' | 'evaluated';
  }> = [];
  private evaluationHistory: Array<{
    timestamp: Date;
    policyName: string;
    metrics: ScalingMetrics;
    triggered: boolean;
  }> = [];
  private readonly MAX_HISTORY = 1000;

  constructor() {
    super();
  }

  async createPolicy(policy: ScalingPolicy): Promise<void> {
    try {
      if (!policy.name || !policy.metric) {
        throw new Error('Policy must have name and metric');
      }

      if (policy.threshold < 0) {
        throw new Error('Threshold must be non-negative');
      }

      if (policy.cooldown < 0) {
        throw new Error('Cooldown must be non-negative');
      }

      this.policies.set(policy.name, policy);

      this.policyHistory.push({
        timestamp: new Date(),
        policy,
        action: 'created',
      });

      this.emit('policy-created', { policyName: policy.name, policy });
    } catch (error) {
      this.emit('error', { type: 'policy-creation-failed', policy, error });
      throw error;
    }
  }

  async updatePolicy(policyName: string, updates: Partial<ScalingPolicy>): Promise<void> {
    try {
      const existing = this.policies.get(policyName);

      if (!existing) {
        throw new Error(`Policy not found: ${policyName}`);
      }

      const updated = { ...existing, ...updates, name: policyName };

      this.policies.set(policyName, updated);

      this.policyHistory.push({
        timestamp: new Date(),
        policy: updated,
        action: 'updated',
      });

      this.emit('policy-updated', { policyName, policy: updated });
    } catch (error) {
      this.emit('error', { type: 'policy-update-failed', policyName, error });
      throw error;
    }
  }

  async deletePolicy(policyName: string): Promise<void> {
    try {
      const policy = this.policies.get(policyName);

      if (!policy) {
        throw new Error(`Policy not found: ${policyName}`);
      }

      this.policies.delete(policyName);

      this.policyHistory.push({
        timestamp: new Date(),
        policy,
        action: 'deleted',
      });

      this.emit('policy-deleted', { policyName });
    } catch (error) {
      this.emit('error', { type: 'policy-deletion-failed', policyName, error });
      throw error;
    }
  }

  async listPolicies(): Promise<ScalingPolicy[]> {
    return Array.from(this.policies.values());
  }

  async getPolicy(policyName: string): Promise<ScalingPolicy | null> {
    return this.policies.get(policyName) || null;
  }

  async evaluatePolicies(metrics: ScalingMetrics): Promise<ScalingAction[]> {
    try {
      const actions: ScalingAction[] = [];

      for (const [policyName, policy] of this.policies) {
        const triggered = this.evaluatePolicy(policy, metrics);

        this.evaluationHistory.push({
          timestamp: new Date(),
          policyName,
          metrics,
          triggered,
        });

        if (triggered) {
          const action: ScalingAction = {
            type: policy.scalingAdjustment > 0 ? 'scale-up' : 'scale-down',
            reason: `Policy '${policyName}' triggered: ${policy.metric} ${policy.comparison} ${policy.threshold}`,
            targetCount: policy.scalingAdjustment,
            timestamp: new Date(),
          };

          actions.push(action);
          this.emit('policy-triggered', { policyName, action });
        }
      }

      // Keep history within limits
      if (this.evaluationHistory.length > this.MAX_HISTORY) {
        this.evaluationHistory = this.evaluationHistory.slice(-this.MAX_HISTORY);
      }

      return actions;
    } catch (error) {
      this.emit('error', { type: 'evaluation-failed', metrics, error });
      throw error;
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
        return Math.abs(metricValue - policy.threshold) < 0.01;
      default:
        return false;
    }
  }

  async getPolicyHistory(limit: number = 100): Promise<typeof this.policyHistory> {
    return this.policyHistory.slice(-limit);
  }

  async getEvaluationHistory(
    policyName: string,
    limit: number = 100
  ): Promise<typeof this.evaluationHistory> {
    return this.evaluationHistory
      .filter((entry) => entry.policyName === policyName)
      .slice(-limit);
  }

  async getAllEvaluationHistory(limit: number = 100): Promise<typeof this.evaluationHistory> {
    return this.evaluationHistory.slice(-limit);
  }

  async validatePolicy(policy: ScalingPolicy): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!policy.name) {
      errors.push('Policy name is required');
    }

    if (!policy.metric) {
      errors.push('Metric is required');
    }

    if (!['cpu', 'memory', 'latency', 'requests'].includes(policy.metric)) {
      errors.push(`Invalid metric: ${policy.metric}`);
    }

    if (!['>', '<', '==', '>=', '<='].includes(policy.comparison)) {
      errors.push(`Invalid comparison: ${policy.comparison}`);
    }

    if (policy.threshold < 0) {
      errors.push('Threshold must be non-negative');
    }

    if (policy.cooldown < 0) {
      errors.push('Cooldown must be non-negative');
    }

    if (policy.scalingAdjustment === 0) {
      errors.push('Scaling adjustment must not be zero');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getPolicyCount(): number {
    return this.policies.size;
  }

  clearHistory(): void {
    this.policyHistory = [];
    this.evaluationHistory = [];
    this.emit('history-cleared');
  }

  getStatus(): {
    totalPolicies: number;
    activePolicies: string[];
    lastEvaluationTime: Date | null;
    totalEvaluations: number;
  } {
    return {
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.keys()),
      lastEvaluationTime:
        this.evaluationHistory.length > 0
          ? this.evaluationHistory[this.evaluationHistory.length - 1].timestamp
          : null,
      totalEvaluations: this.evaluationHistory.length,
    };
  }

  async exportPolicies(): Promise<ScalingPolicy[]> {
    return this.listPolicies();
  }

  async importPolicies(policies: ScalingPolicy[]): Promise<void> {
    this.policies.clear();

    for (const policy of policies) {
      await this.createPolicy(policy);
    }

    this.emit('policies-imported', { count: policies.length });
  }
}
