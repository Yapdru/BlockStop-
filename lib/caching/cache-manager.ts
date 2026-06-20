/**
 * Cache Manager
 * Multi-layer cache orchestration with L1, L2, L3, and L4 support
 */

import { MemoryCache } from './memory-cache';
import { RedisCache } from './redis-cache';
import { CacheMetricsTracker } from './cache-metrics';
import { CacheConfig } from './cache-config';

export interface CacheConfig {
  l1Ttl: number; // Browser cache (seconds)
  l2Ttl: number; // CDN cache (seconds)
  l3Ttl: number; // Redis cache (seconds)
  l4Enabled: boolean; // Database cache
}

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
  createdAt: Date;
  hits: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  entries: number;
  layers: {
    l1: { size: number; entries: number };
    l2: { size: number; entries: number };
    l3: { size: number; entries: number };
  };
}

export class CacheManager {
  private l1Cache: MemoryCache;
  private l2Cache: MemoryCache;
  private l3Cache: RedisCache;
  private metrics: CacheMetricsTracker;
  private config: CacheConfig;
  private configManager: any;

  constructor() {
    this.l1Cache = new MemoryCache(268435456); // 256 MB for L1
    this.l2Cache = new MemoryCache(536870912); // 512 MB for L2
    this.l3Cache = new RedisCache();
    this.metrics = new CacheMetricsTracker();
    this.config = {
      l1Ttl: 3600,
      l2Ttl: 86400,
      l3Ttl: 604800,
      l4Enabled: false,
    };
  }

  /**
   * Initialize cache manager
   */
  async initialize(redisUrl?: string): Promise<void> {
    try {
      // Load configuration
      if (this.configManager) {
        const config = await this.configManager.loadConfig();
        this.config = {
          l1Ttl: config.l1Ttl,
          l2Ttl: config.l2Ttl,
          l3Ttl: config.l3Ttl,
          l4Enabled: false,
        };
      }

      // Connect to Redis if available
      if (redisUrl) {
        await this.l3Cache.connect(redisUrl);
      }
    } catch (error) {
      console.error('Error initializing cache manager:', error);
    }
  }

  /**
   * Get value from cache (checks L1 -> L2 -> L3)
   */
  async get(key: string): Promise<any | null> {
    try {
      // Try L1 cache first
      const l1Value = await this.l1Cache.get(key);
      if (l1Value !== null) {
        await this.metrics.recordHit(key);
        return l1Value;
      }

      // Try L2 cache
      const l2Value = await this.l2Cache.get(key);
      if (l2Value !== null) {
        // Populate L1 from L2
        await this.l1Cache.set(key, l2Value, this.config.l1Ttl);
        await this.metrics.recordHit(key);
        return l2Value;
      }

      // Try L3 cache (Redis)
      const l3Value = await this.l3Cache.get(key);
      if (l3Value !== null) {
        // Populate L1 and L2 from L3
        await this.l1Cache.set(key, l3Value, this.config.l1Ttl);
        await this.l2Cache.set(key, l3Value, this.config.l2Ttl);
        await this.metrics.recordHit(key);
        return l3Value;
      }

      // Not found in any cache
      await this.metrics.recordMiss(key);
      return null;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      await this.metrics.recordMiss(key);
      return null;
    }
  }

  /**
   * Set value in cache (all layers)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const actualTtl = ttl || this.config.l1Ttl;
      const size = this.estimateSize(value);

      // Set in all layers
      await this.l1Cache.set(key, value, actualTtl);
      await this.l2Cache.set(key, value, Math.min(ttl || this.config.l2Ttl, this.config.l2Ttl));
      await this.l3Cache.set(
        key,
        value,
        Math.min(ttl || this.config.l3Ttl, this.config.l3Ttl),
      );

      // Track metrics
      await this.metrics.recordEntry(key, size);
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache (all layers)
   */
  async delete(key: string): Promise<void> {
    try {
      await this.l1Cache.delete(key);
      await this.l2Cache.delete(key);
      await this.l3Cache.delete(key);

      await this.metrics.recordEviction(key);
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Invalidate pattern in all caches
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const l1Deleted = await this.l1Cache.deletePattern(pattern);
      const l2Deleted = await this.l2Cache.deletePattern(pattern);
      const l3Deleted = await this.l3Cache.deletePattern(pattern);

      return l1Deleted + l2Deleted + l3Deleted;
    } catch (error) {
      console.error(`Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const metrics = await this.metrics.getMetrics();
      const l1Stats = await this.l1Cache.getStats();
      const l2Stats = await this.l2Cache.getStats();
      const l3Stats = await this.l3Cache.getStats();

      return {
        hits: metrics.hits,
        misses: metrics.misses,
        hitRate: metrics.hitRate,
        size: metrics.totalSize,
        entries: metrics.entries,
        layers: {
          l1: { size: l1Stats.memory, entries: l1Stats.entries },
          l2: { size: l2Stats.memory, entries: l2Stats.entries },
          l3: { size: l3Stats.memory, entries: l3Stats.keyCount },
        },
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        entries: 0,
        layers: {
          l1: { size: 0, entries: 0 },
          l2: { size: 0, entries: 0 },
          l3: { size: 0, entries: 0 },
        },
      };
    }
  }

  /**
   * Warm cache with pre-loaded keys
   */
  async warmCache(keys: string[]): Promise<void> {
    // This would be called with actual data from a data loader
    // Placeholder implementation
    for (const key of keys) {
      const value = await this.getFromSource(key);
      if (value !== null) {
        await this.set(key, value);
      }
    }
  }

  /**
   * Get multiple values
   */
  async getMultiple(keys: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>();

    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  /**
   * Set multiple values
   */
  async setMultiple(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    try {
      await this.l1Cache.clear();
      await this.l2Cache.clear();
      await this.l3Cache.flushDb();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get top keys by hit count
   */
  async getTopKeys(limit: number = 10): Promise<
    Array<{
      key: string;
      hits: number;
      misses: number;
      size: number;
    }>
  > {
    return await this.metrics.getTopKeysByHits(limit);
  }

  /**
   * Estimate object size
   */
  private estimateSize(obj: any): number {
    const objectList: any[] = [];
    const stack: any[] = [obj];
    let bytes = 0;

    while (stack.length) {
      const value = stack.pop();

      if (typeof value === 'boolean') {
        bytes += 4;
      } else if (typeof value === 'string') {
        bytes += value.length * 2;
      } else if (typeof value === 'number') {
        bytes += 8;
      } else if (typeof value === 'object' && value !== null) {
        if (objectList.includes(value)) {
          continue;
        }

        objectList.push(value);

        if (Array.isArray(value)) {
          for (const item of value) {
            stack.push(item);
          }
        } else {
          for (const key in value) {
            stack.push(value[key]);
          }
        }
      }
    }

    return bytes;
  }

  /**
   * Get from source (placeholder for data loading)
   */
  private async getFromSource(key: string): Promise<any | null> {
    // In production, this would fetch from database or API
    return null;
  }

  /**
   * Prune expired entries
   */
  async pruneExpired(): Promise<number> {
    const l1Pruned = await this.l1Cache.prune();
    const l2Pruned = await this.l2Cache.prune();

    return l1Pruned + l2Pruned;
  }
}

export const cacheManager = new CacheManager();
