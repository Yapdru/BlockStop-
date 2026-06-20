import { EventEmitter } from 'events';

export interface EdgeCachePolicy {
  pattern: string;
  ttl: number;
  serveStale: boolean;
  compress: boolean;
}

export interface EdgeMetrics {
  hits: number;
  misses: number;
  originRequests: number;
  hitRate: number;
  bandwidth: number;
  lastUpdated: Date;
}

export class EdgeCaching extends EventEmitter {
  private policies: Map<string, EdgeCachePolicy> = new Map();
  private metrics: EdgeMetrics = {
    hits: 0,
    misses: 0,
    originRequests: 0,
    hitRate: 0,
    bandwidth: 0,
    lastUpdated: new Date(),
  };
  private policyHistory: Array<{ timestamp: Date; action: string; policy: EdgeCachePolicy }> = [];

  constructor() {
    super();
  }

  async setPolicy(policy: EdgeCachePolicy): Promise<void> {
    try {
      if (!policy.pattern || policy.ttl < 0) {
        throw new Error('Invalid policy configuration');
      }

      this.policies.set(policy.pattern, policy);
      this.policyHistory.push({
        timestamp: new Date(),
        action: 'set',
        policy,
      });

      this.emit('policy-updated', { pattern: policy.pattern, policy });
    } catch (error) {
      this.emit('error', { type: 'policy-set-failed', policy, error });
      throw error;
    }
  }

  async getPolicy(pattern: string): Promise<EdgeCachePolicy | null> {
    return this.policies.get(pattern) || null;
  }

  async listPolicies(): Promise<EdgeCachePolicy[]> {
    return Array.from(this.policies.values());
  }

  async deletePolicy(pattern: string): Promise<void> {
    try {
      const policy = this.policies.get(pattern);
      if (policy) {
        this.policies.delete(pattern);
        this.policyHistory.push({
          timestamp: new Date(),
          action: 'delete',
          policy,
        });

        this.emit('policy-deleted', { pattern });
      }
    } catch (error) {
      this.emit('error', { type: 'policy-delete-failed', pattern, error });
      throw error;
    }
  }

  async getEdgeMetrics(): Promise<EdgeMetrics> {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? this.metrics.hits / total : 0;

    return {
      ...this.metrics,
      hitRate,
      lastUpdated: new Date(),
    };
  }

  async recordHit(assetSize: number): Promise<void> {
    this.metrics.hits++;
    this.metrics.bandwidth += assetSize;
    this.updateHitRate();
    this.emit('cache-hit', { size: assetSize });
  }

  async recordMiss(): Promise<void> {
    this.metrics.misses++;
    this.metrics.originRequests++;
    this.updateHitRate();
    this.emit('cache-miss');
  }

  async recordOriginRequest(): Promise<void> {
    this.metrics.originRequests++;
    this.emit('origin-request');
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  async getPolicyHistory(limit: number = 100): Promise<typeof this.policyHistory> {
    return this.policyHistory.slice(-limit);
  }

  async resetMetrics(): Promise<void> {
    this.metrics = {
      hits: 0,
      misses: 0,
      originRequests: 0,
      hitRate: 0,
      bandwidth: 0,
      lastUpdated: new Date(),
    };
    this.emit('metrics-reset');
  }

  async getMatchingPolicy(assetPath: string): Promise<EdgeCachePolicy | null> {
    for (const [pattern, policy] of this.policies) {
      const regex = this.patternToRegex(pattern);
      if (regex.test(assetPath)) {
        return policy;
      }
    }
    return null;
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`);
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    let invalidatedCount = 0;

    // In a real implementation, this would invalidate edge caches
    // For now, we'll track it in metrics
    this.metrics.originRequests += invalidatedCount;

    this.emit('invalidation-triggered', { pattern, count: invalidatedCount });
    return invalidatedCount;
  }

  getMetricsSnapshot(): EdgeMetrics {
    return { ...this.metrics };
  }
}
