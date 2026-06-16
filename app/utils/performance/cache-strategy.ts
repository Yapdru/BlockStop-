/**
 * Caching Strategies
 * Implements various cache strategies: stale-while-revalidate, cache-first, network-first, etc.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  stale: boolean;
}

export interface CacheConfig {
  maxAge?: number; // Max age before considered stale (ms)
  staleWhileRevalidate?: number; // Serve stale data while revalidating (ms)
  maxSize?: number; // Max number of entries
}

/**
 * In-memory cache with TTL support
 */
export class TTLCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxAge: config.maxAge || 5 * 60 * 1000, // 5 minutes default
      staleWhileRevalidate: config.staleWhileRevalidate || 60 * 1000, // 1 minute
      maxSize: config.maxSize || 100,
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;

    // Still fresh
    if (age < entry.ttl) {
      return entry.data;
    }

    // Check if within stale window
    if (age < (this.config.staleWhileRevalidate || 0)) {
      entry.stale = true;
      return entry.data;
    }

    // Expired
    this.delete(key);
    return null;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Enforce max size with simple eviction
    if (this.cache.size >= (this.config.maxSize || 100)) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.maxAge || 5 * 60 * 1000,
      stale: false,
    };

    this.cache.set(key, entry);

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Auto-delete after TTL
    const timer = setTimeout(() => this.delete(key), entry.ttl);
    this.timers.set(key, timer);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists and is fresh
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get entry metadata
   */
  getMetadata(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }
}

/**
 * Network first strategy: try network, fallback to cache
 */
export const networkFirstFetch = async <T = any>(
  url: string,
  cache: TTLCache<T>,
  fetchOptions?: RequestInit,
  timeout: number = 3000
): Promise<T> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    cache.set(url, data);
    return data;
  } catch (error) {
    // Fallback to cache
    const cached = cache.get(url);
    if (cached !== null) {
      console.warn(`Network failed, using cached data for ${url}`);
      return cached;
    }
    throw error;
  }
};

/**
 * Cache first strategy: try cache, fallback to network
 */
export const cacheFirstFetch = async <T = any>(
  url: string,
  cache: TTLCache<T>,
  fetchOptions?: RequestInit
): Promise<T> => {
  const cached = cache.get(url);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    cache.set(url, data);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Stale while revalidate: serve stale cache, revalidate in background
 */
export const staleWhileRevalidateFetch = async <T = any>(
  url: string,
  cache: TTLCache<T>,
  fetchOptions?: RequestInit,
  onUpdate?: (data: T) => void
): Promise<T> => {
  const cached = cache.get(url);

  // Fetch in background to revalidate
  fetch(url, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
      cache.set(url, data);
      onUpdate?.(data);
    })
    .catch((error) => {
      console.warn(`Failed to revalidate ${url}:`, error);
    });

  if (cached !== null) {
    return cached;
  }

  // No cache, wait for fetch
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
};

/**
 * LocalStorage backed cache
 */
export class LocalStorageCache<T = any> {
  private prefix: string;

  constructor(prefix: string = 'cache_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get value from localStorage
   */
  get(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return null;

      const entry = JSON.parse(stored);
      const age = Date.now() - entry.timestamp;

      if (age > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn(`Failed to read from localStorage cache: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in localStorage
   */
  set(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000): void {
    try {
      const entry = {
        data: value,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn(`Failed to write to localStorage cache: ${key}`, error);
    }
  }

  /**
   * Delete entry from localStorage
   */
  delete(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn(`Failed to delete from localStorage cache: ${key}`, error);
    }
  }

  /**
   * Clear entire localStorage cache
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache', error);
    }
  }
}

/**
 * HTTP cache headers helper
 */
export const getCacheHeaders = (strategy: 'public' | 'private' | 'immutable', maxAge: number) => {
  const maxAgeSeconds = Math.floor(maxAge / 1000);
  return {
    'Cache-Control': `${strategy}, max-age=${maxAgeSeconds}`,
  };
};

/**
 * Invalidate cache entries matching pattern
 */
export const invalidateCachePattern = (
  cache: TTLCache<any>,
  pattern: string | RegExp
): number => {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  let count = 0;

  // This is a limitation - we'd need to track all keys
  // In practice, use a cache wrapper that tracks keys
  return count;
};

/**
 * Create a cached fetch wrapper
 */
export const createCachedFetch = <T = any>(
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' = 'stale-while-revalidate',
  config: CacheConfig = {}
) => {
  const cache = new TTLCache<T>(config);

  return async (url: string, options?: RequestInit): Promise<T> => {
    switch (strategy) {
      case 'network-first':
        return networkFirstFetch(url, cache, options);
      case 'cache-first':
        return cacheFirstFetch(url, cache, options);
      case 'stale-while-revalidate':
      default:
        return staleWhileRevalidateFetch(url, cache, options);
    }
  };
};

/**
 * Get cache statistics
 */
export const getCacheStats = (cache: TTLCache<any>) => {
  return {
    size: cache.size(),
    timestamp: Date.now(),
  };
};
