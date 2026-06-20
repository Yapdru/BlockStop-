import { EventEmitter } from 'events';

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudfront' | 'custom';
  zones: Array<{ name: string; id: string }>;
  cacheTtl: number;
  minifyEnabled: boolean;
}

export interface CacheInvalidationResult {
  invalidatedCount: number;
  failedCount: number;
  processedAt: Date;
}

export interface CDNStats {
  requests: number;
  cachedRequests: number;
  bandwidth: number;
  hitRate: number;
  missRate: number;
}

export interface AssetPushResult {
  url: string;
  cached: boolean;
  size: number;
  contentType: string;
}

export interface AssetMetrics {
  hits: number;
  misses: number;
  bandwidthSaved: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

export class CDNManager extends EventEmitter {
  private config: CDNConfig;
  private apiKey: string;
  private pushedAssets: Map<string, { url: string; timestamp: Date }> = new Map();
  private cacheStats: Map<string, { hits: number; misses: number; bandwidth: number }> = new Map();
  private cachingRules: Map<string, number> = new Map();

  constructor(config: CDNConfig, apiKey: string = '') {
    super();
    this.config = config;
    this.apiKey = apiKey;
  }

  async pushAsset(
    path: string,
    content: Buffer,
    contentType: string
  ): Promise<AssetPushResult> {
    try {
      const assetKey = `${this.config.zones[0]?.id || 'default'}/${path}`;
      const size = content.length;
      const url = `https://${this.config.zones[0]?.name || 'cdn.example.com'}/${path}`;

      this.pushedAssets.set(assetKey, {
        url,
        timestamp: new Date(),
      });

      this.emit('asset-pushed', { path, size, contentType, url });

      return {
        url,
        cached: true,
        size,
        contentType,
      };
    } catch (error) {
      this.emit('error', { type: 'push-failed', path, error });
      throw new Error(`Failed to push asset: ${path}`);
    }
  }

  async invalidateCache(pattern: string): Promise<number> {
    try {
      let invalidatedCount = 0;

      if (pattern === '*') {
        invalidatedCount = this.pushedAssets.size;
        this.pushedAssets.clear();
      } else {
        const regex = new RegExp(pattern);
        for (const [key] of this.pushedAssets) {
          if (regex.test(key)) {
            this.pushedAssets.delete(key);
            invalidatedCount++;
          }
        }
      }

      this.emit('cache-invalidated', { pattern, count: invalidatedCount });
      return invalidatedCount;
    } catch (error) {
      this.emit('error', { type: 'invalidation-failed', pattern, error });
      throw new Error(`Failed to invalidate cache for pattern: ${pattern}`);
    }
  }

  async getStats(): Promise<CDNStats> {
    let totalRequests = 0;
    let totalCachedRequests = 0;
    let totalBandwidth = 0;

    for (const stats of this.cacheStats.values()) {
      totalRequests += stats.hits + stats.misses;
      totalCachedRequests += stats.hits;
      totalBandwidth += stats.bandwidth;
    }

    const hitRate = totalRequests > 0 ? totalCachedRequests / totalRequests : 0;

    return {
      requests: totalRequests,
      cachedRequests: totalCachedRequests,
      bandwidth: totalBandwidth,
      hitRate,
      missRate: 1 - hitRate,
    };
  }

  async configureCaching(pattern: string, ttl: number): Promise<void> {
    try {
      if (ttl < 0) {
        throw new Error('TTL must be non-negative');
      }

      this.cachingRules.set(pattern, ttl);
      this.emit('caching-configured', { pattern, ttl });
    } catch (error) {
      this.emit('error', { type: 'config-failed', pattern, ttl, error });
      throw error;
    }
  }

  async getAssetMetrics(assetPath: string): Promise<AssetMetrics> {
    const key = `${this.config.zones[0]?.id || 'default'}/${assetPath}`;
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, bandwidth: 0 };

    return {
      hits: stats.hits,
      misses: stats.misses,
      bandwidthSaved: stats.bandwidth,
      averageResponseTime: stats.hits > 0 ? Math.random() * 50 : 0, // Simulated
      lastUpdated: new Date(),
    };
  }

  async recordCacheHit(assetPath: string, bandwidth: number): Promise<void> {
    const key = `${this.config.zones[0]?.id || 'default'}/${assetPath}`;
    const current = this.cacheStats.get(key) || { hits: 0, misses: 0, bandwidth: 0 };
    current.hits++;
    current.bandwidth += bandwidth;
    this.cacheStats.set(key, current);
  }

  async recordCacheMiss(assetPath: string): Promise<void> {
    const key = `${this.config.zones[0]?.id || 'default'}/${assetPath}`;
    const current = this.cacheStats.get(key) || { hits: 0, misses: 0, bandwidth: 0 };
    current.misses++;
    this.cacheStats.set(key, current);
  }

  getConfig(): CDNConfig {
    return this.config;
  }

  updateConfig(config: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config-updated', this.config);
  }
}
