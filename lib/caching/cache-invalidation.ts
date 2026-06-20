/**
 * Cache Invalidation Strategy
 * Manage cache invalidation policies and event-based invalidation
 */

export interface InvalidationPolicy {
  pattern: string;
  ttl: number;
  events: string[];
}

export interface InvalidationRecord {
  pattern: string;
  timestamp: Date;
  count: number;
  reason?: string;
}

export class CacheInvalidation {
  private policies: Map<string, InvalidationPolicy> = new Map();
  private invalidationHistory: InvalidationRecord[] = [];
  private maxHistorySize: number = 1000;
  private eventListeners: Map<string, Set<(pattern: string) => void>> = new Map();

  /**
   * Register an invalidation policy
   */
  async registerPolicy(policy: InvalidationPolicy): Promise<void> {
    if (!policy.pattern) {
      throw new Error('Pattern is required');
    }

    if (policy.ttl < 0) {
      throw new Error('TTL must be non-negative');
    }

    const policyKey = `policy_${policy.pattern}`;
    this.policies.set(policyKey, policy);

    // Register event listeners
    for (const event of policy.events) {
      this.registerEventListener(event, policy.pattern);
    }
  }

  /**
   * Invalidate entries matching pattern
   */
  async invalidate(pattern: string, reason?: string): Promise<number> {
    // This would typically call the cache manager to invalidate matching keys
    // For now, we track the invalidation event

    const record: InvalidationRecord = {
      pattern,
      timestamp: new Date(),
      count: 0, // This would be set by cache manager
      reason,
    };

    this.addToHistory(record);

    // Emit invalidation event
    await this.emitInvalidationEvent(pattern);

    return record.count;
  }

  /**
   * Invalidate based on event
   */
  async invalidateOnEvent(event: string, pattern: string): Promise<void> {
    // Find all policies that should respond to this event
    for (const policy of this.policies.values()) {
      if (policy.events.includes(event)) {
        // Match pattern against policy pattern
        if (this.patternMatches(pattern, policy.pattern)) {
          await this.invalidate(policy.pattern, `Triggered by event: ${event}`);
        }
      }
    }
  }

  /**
   * Bulk invalidate multiple patterns
   */
  async bulkInvalidate(patterns: string[]): Promise<number> {
    let totalInvalidated = 0;

    for (const pattern of patterns) {
      const count = await this.invalidate(pattern);
      totalInvalidated += count;
    }

    return totalInvalidated;
  }

  /**
   * Get invalidation history
   */
  async getInvalidationHistory(): Promise<
    Array<{
      pattern: string;
      timestamp: Date;
      count: number;
    }>
  > {
    return this.invalidationHistory.map((record) => ({
      pattern: record.pattern,
      timestamp: record.timestamp,
      count: record.count,
    }));
  }

  /**
   * Clear invalidation history
   */
  async clearInvalidationHistory(): Promise<void> {
    this.invalidationHistory = [];
  }

  /**
   * Get policy by pattern
   */
  async getPolicy(pattern: string): Promise<InvalidationPolicy | null> {
    const policyKey = `policy_${pattern}`;
    return this.policies.get(policyKey) || null;
  }

  /**
   * List all policies
   */
  async listPolicies(): Promise<InvalidationPolicy[]> {
    return Array.from(this.policies.values());
  }

  /**
   * Remove policy
   */
  async removePolicy(pattern: string): Promise<boolean> {
    const policyKey = `policy_${pattern}`;
    return this.policies.delete(policyKey);
  }

  /**
   * Register event listener for invalidation
   */
  private registerEventListener(event: string, pattern: string): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(async (invalidationPattern: string) => {
      if (this.patternMatches(invalidationPattern, pattern)) {
        await this.invalidate(pattern);
      }
    });
  }

  /**
   * Emit invalidation event
   */
  private async emitInvalidationEvent(pattern: string): Promise<void> {
    // In a real implementation, this would trigger actual invalidation
    // Notify all listeners for relevant events
    for (const listeners of this.eventListeners.values()) {
      for (const listener of listeners) {
        try {
          listener(pattern);
        } catch (error) {
          console.error('Error in invalidation listener:', error);
        }
      }
    }
  }

  /**
   * Check if pattern matches
   */
  private patternMatches(input: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(input);
    } catch {
      // If regex fails, do simple substring match
      return input.includes(pattern);
    }
  }

  /**
   * Add record to history with size management
   */
  private addToHistory(record: InvalidationRecord): void {
    this.invalidationHistory.push(record);

    // Keep history size manageable
    if (this.invalidationHistory.length > this.maxHistorySize) {
      this.invalidationHistory = this.invalidationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get statistics about invalidations
   */
  async getInvalidationStats(): Promise<{
    totalInvalidations: number;
    uniquePatterns: number;
    averageTimePerInvalidation: number;
  }> {
    const totalInvalidations = this.invalidationHistory.length;
    const uniquePatterns = new Set(this.invalidationHistory.map((r) => r.pattern)).size;

    let totalTime = 0;
    for (let i = 1; i < this.invalidationHistory.length; i++) {
      const diff = Math.abs(
        this.invalidationHistory[i].timestamp.getTime() -
          this.invalidationHistory[i - 1].timestamp.getTime(),
      );
      totalTime += diff;
    }

    const averageTimePerInvalidation =
      this.invalidationHistory.length > 1 ? totalTime / (this.invalidationHistory.length - 1) : 0;

    return {
      totalInvalidations,
      uniquePatterns,
      averageTimePerInvalidation,
    };
  }
}

export const cacheInvalidation = new CacheInvalidation();
