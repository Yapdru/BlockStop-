/**
 * Cache Metrics Tracking
 * Monitor cache performance and hit/miss rates
 */

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  totalSize: number;
  entries: number;
  avgEntrySize: number;
}

export interface KeyMetrics {
  hits: number;
  misses: number;
  size: number;
  lastAccessed: Date;
  createdAt: Date;
}

export class CacheMetricsTracker {
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entries: 0,
  };

  private keyMetrics: Map<string, KeyMetrics> = new Map();

  /**
   * Record a cache hit
   */
  async recordHit(key: string): Promise<void> {
    this.metrics.hits++;

    let keyMetric = this.keyMetrics.get(key);
    if (!keyMetric) {
      keyMetric = {
        hits: 0,
        misses: 0,
        size: 0,
        lastAccessed: new Date(),
        createdAt: new Date(),
      };
      this.keyMetrics.set(key, keyMetric);
    }

    keyMetric.hits++;
    keyMetric.lastAccessed = new Date();
  }

  /**
   * Record a cache miss
   */
  async recordMiss(key: string): Promise<void> {
    this.metrics.misses++;

    let keyMetric = this.keyMetrics.get(key);
    if (!keyMetric) {
      keyMetric = {
        hits: 0,
        misses: 0,
        size: 0,
        lastAccessed: new Date(),
        createdAt: new Date(),
      };
      this.keyMetrics.set(key, keyMetric);
    }

    keyMetric.misses++;
  }

  /**
   * Record an eviction
   */
  async recordEviction(key: string): Promise<void> {
    this.metrics.evictions++;

    const keyMetric = this.keyMetrics.get(key);
    if (keyMetric) {
      this.metrics.totalSize -= keyMetric.size;
      this.metrics.entries--;
      this.keyMetrics.delete(key);
    }
  }

  /**
   * Record new cache entry
   */
  async recordEntry(key: string, size: number): Promise<void> {
    const keyMetric = this.keyMetrics.get(key);

    if (!keyMetric) {
      this.metrics.entries++;
      this.metrics.totalSize += size;

      this.keyMetrics.set(key, {
        hits: 0,
        misses: 0,
        size,
        lastAccessed: new Date(),
        createdAt: new Date(),
      });
    }
  }

  /**
   * Get overall cache metrics
   */
  async getMetrics(): Promise<CacheMetrics> {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    const avgEntrySize =
      this.metrics.entries > 0 ? this.metrics.totalSize / this.metrics.entries : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate,
      evictions: this.metrics.evictions,
      totalSize: this.metrics.totalSize,
      entries: this.metrics.entries,
      avgEntrySize,
    };
  }

  /**
   * Get metrics for specific key
   */
  async getMetricsForKey(key: string): Promise<{ hits: number; misses: number; size: number }> {
    const keyMetric = this.keyMetrics.get(key);

    if (!keyMetric) {
      return { hits: 0, misses: 0, size: 0 };
    }

    return {
      hits: keyMetric.hits,
      misses: keyMetric.misses,
      size: keyMetric.size,
    };
  }

  /**
   * Reset all metrics
   */
  async resetMetrics(): Promise<void> {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      entries: 0,
    };
    this.keyMetrics.clear();
  }

  /**
   * Get top N keys by hits
   */
  async getTopKeysByHits(limit: number = 10): Promise<
    Array<{
      key: string;
      hits: number;
      misses: number;
      size: number;
    }>
  > {
    const sorted = Array.from(this.keyMetrics.entries())
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, limit);

    return sorted.map(([key, metric]) => ({
      key,
      hits: metric.hits,
      misses: metric.misses,
      size: metric.size,
    }));
  }

  /**
   * Get metrics by time period
   */
  async getMetricsByPeriod(
    periodMs: number,
  ): Promise<
    Array<{
      timestamp: Date;
      hitRate: number;
      hits: number;
      misses: number;
    }>
  > {
    // This is a simplified version - in production, you'd want to store
    // metrics at regular intervals and aggregate them
    const metrics = await this.getMetrics();

    return [
      {
        timestamp: new Date(),
        hitRate: metrics.hitRate,
        hits: metrics.hits,
        misses: metrics.misses,
      },
    ];
  }

  /**
   * Export metrics as JSON
   */
  async exportMetrics(): Promise<{
    overall: CacheMetrics;
    keyMetrics: Array<{
      key: string;
      metrics: KeyMetrics;
    }>;
  }> {
    const overall = await this.getMetrics();

    const keyMetrics = Array.from(this.keyMetrics.entries()).map(([key, metrics]) => ({
      key,
      metrics,
    }));

    return {
      overall,
      keyMetrics,
    };
  }
}

export const cacheMetrics = new CacheMetricsTracker();
