/**
 * In-Memory Cache Implementation
 * Fast local cache for frequently accessed data
 */

export interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  size: number;
}

export class MemoryCache {
  private cache: Map<string, MemoryCacheEntry> = new Map();
  private maxMemory: number;
  private currentMemory: number = 0;

  constructor(maxMemory: number = 536870912) {
    // Default 512 MB
    this.maxMemory = maxMemory;
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      await this.delete(key);
      return null;
    }

    // Update access count
    entry.accessCount++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const size = this.estimateSize(value);

    // Delete old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentMemory -= oldEntry.size;
    }

    // Check if new entry exceeds memory limit
    if (this.currentMemory + size > this.maxMemory) {
      await this.evictLRU();
    }

    const expiresAt = ttl ? Date.now() + ttl * 1000 : Date.now() + 3600 * 1000; // Default 1 hour

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      accessCount: 0,
      size,
    });

    this.currentMemory += size;
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemory -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Delete entries matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        await this.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ entries: number; memory: number }> {
    return {
      entries: this.cache.size,
      memory: this.currentMemory,
    };
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.currentMemory = 0;
  }

  /**
   * Remove expired entries
   */
  async prune(): Promise<number> {
    let pruned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        await this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Estimate object size in bytes
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
   * Evict least recently used entry
   */
  private async evictLRU(): Promise<void> {
    let lruKey = null;
    let lruAccessTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt + entry.accessCount * 1000 < lruAccessTime) {
        lruAccessTime = entry.createdAt + entry.accessCount * 1000;
        lruKey = key;
      }
    }

    if (lruKey) {
      await this.delete(lruKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    setInterval(
      async () => {
        await this.prune();
      },
      60 * 1000,
    ); // Cleanup every minute
  }
}

export const memoryCache = new MemoryCache();
