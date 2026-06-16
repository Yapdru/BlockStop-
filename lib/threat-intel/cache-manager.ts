// Cache Manager for Threat Intelligence Data

import { CacheEntry } from './types';

class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  set<T>(key: string, data: T, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = new Date().getTime();
    const entryTime = entry.timestamp.getTime();

    if (now - entryTime > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = new Date().getTime();
    const entryTime = entry.timestamp.getTime();

    if (now - entryTime > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  deletePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  private startCleanupInterval(): void {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = new Date().getTime();
      let deleted = 0;

      for (const [key, entry] of this.cache.entries()) {
        const entryTime = entry.timestamp.getTime();
        if (now - entryTime > entry.ttl) {
          this.cache.delete(key);
          deleted++;
        }
      }

      if (deleted > 0) {
        console.log(`[CacheManager] Cleaned up ${deleted} expired entries`);
      }
    }, 5 * 60 * 1000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
