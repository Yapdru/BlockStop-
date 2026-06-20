/**
 * Caching Layer - Multi-level caching for database queries
 * Provides in-memory and distributed cache support
 */

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
  hits: number;
  createdAt: Date;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  entries: number;
}

export class CachingLayer {
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private logger: any;
  private maxSize: number = 1000; // Maximum entries
  private defaultTTL: number = 3600000; // 1 hour

  constructor(logger?: any) {
    this.logger = logger || console;
    this.startCleanupInterval();
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<any | null> {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (entry.expiresAt < new Date()) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update hit count and stats
      entry.hits++;
      this.stats.hits++;

      return entry.value;
    } catch (error) {
      this.logger.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + (ttl || this.defaultTTL));

      const entry: CacheEntry = {
        key,
        value,
        expiresAt,
        hits: 0,
        createdAt: new Date(),
      };

      // Check cache size limits
      if (this.cache.size >= this.maxSize) {
        await this.evictLRU();
      }

      this.cache.set(key, entry);
    } catch (error) {
      this.logger.error('Error setting cache:', error);
    }
  }

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key);
    } catch (error) {
      this.logger.error('Error deleting from cache:', error);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const regex = new RegExp(pattern);
      let count = 0;

      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
          count++;
        }
      }

      return count;
    } catch (error) {
      this.logger.error('Error invalidating pattern:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate =
        totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      let size = 0;
      for (const entry of this.cache.values()) {
        size += JSON.stringify(entry.value).length;
      }

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        size,
        hitRate: Math.round(hitRate * 100) / 100,
        entries: this.cache.size,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0,
        entries: 0,
      };
    }
  }

  /**
   * Warm cache with query results
   */
  async warmCache(queries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      for (const query of queries) {
        await this.set(query.key, query.value, query.ttl);
      }

      this.logger.info(`Cache warmed with ${queries.length} entries`);
    } catch (error) {
      this.logger.error('Error warming cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    try {
      return Array.from(this.cache.keys());
    } catch (error) {
      this.logger.error('Error getting cache keys:', error);
      return [];
    }
  }

  /**
   * Get cache entry count
   */
  async size(): Promise<number> {
    return this.cache.size;
  }

  // Private helper methods

  private async evictLRU(): Promise<void> {
    try {
      // Find least recently used entry (lowest hit count or oldest)
      let lruEntry: CacheEntry | null = null;
      let lruKey: string | null = null;

      for (const [key, entry] of this.cache) {
        if (!lruEntry || entry.hits < lruEntry.hits) {
          lruEntry = entry;
          lruKey = key;
        }
      }

      if (lruKey) {
        this.cache.delete(lruKey);
        this.logger.debug(`Evicted cache entry: ${lruKey}`);
      }
    } catch (error) {
      this.logger.error('Error evicting LRU entry:', error);
    }
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        const now = new Date();
        let expiredCount = 0;

        for (const [key, entry] of this.cache) {
          if (entry.expiresAt < now) {
            this.cache.delete(key);
            expiredCount++;
          }
        }

        if (expiredCount > 0) {
          this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
        }
      } catch (error) {
        this.logger.error('Error during cache cleanup:', error);
      }
    }, 300000); // Run every 5 minutes
  }
}

export default CachingLayer;
