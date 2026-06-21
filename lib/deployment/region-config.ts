/**
 * Region Configuration
 * Defines deployment regions and their configurations for multi-region deployment
 */

export enum Region {
  US_EAST = 'us-east',
  US_WEST = 'us-west',
  EUROPE = 'europe',
  ASIA = 'asia',
  INDIA = 'india',
}

export interface RegionConfig {
  name: Region;
  displayName: string;
  continent: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cdnProvider: 'cloudflare' | 'jsdelivr' | 'netlify' | 'vercel';
  databaseHost: string;
  cacheHost: string;
  apiEndpoint: string;
  isActive: boolean;
  priority: number; // Lower number = higher priority
  healthCheckInterval: number; // ms
  failoverEnabled: boolean;
  shard?: number;
}

export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  [Region.US_EAST]: {
    name: Region.US_EAST,
    displayName: 'US East',
    continent: 'North America',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    cdnProvider: 'cloudflare',
    databaseHost: process.env.DB_HOST_US_EAST || 'db-us-east.blockstop.local',
    cacheHost: process.env.CACHE_HOST_US_EAST || 'cache-us-east.blockstop.local:6379',
    apiEndpoint: process.env.API_ENDPOINT_US_EAST || 'https://api-us-east.blockstop.io',
    isActive: true,
    priority: 1,
    healthCheckInterval: 30000,
    failoverEnabled: true,
    shard: 1,
  },
  [Region.US_WEST]: {
    name: Region.US_WEST,
    displayName: 'US West',
    continent: 'North America',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    cdnProvider: 'cloudflare',
    databaseHost: process.env.DB_HOST_US_WEST || 'db-us-west.blockstop.local',
    cacheHost: process.env.CACHE_HOST_US_WEST || 'cache-us-west.blockstop.local:6379',
    apiEndpoint: process.env.API_ENDPOINT_US_WEST || 'https://api-us-west.blockstop.io',
    isActive: true,
    priority: 2,
    healthCheckInterval: 30000,
    failoverEnabled: true,
    shard: 2,
  },
  [Region.EUROPE]: {
    name: Region.EUROPE,
    displayName: 'Europe',
    continent: 'Europe',
    coordinates: {
      latitude: 48.8566,
      longitude: 2.3522,
    },
    cdnProvider: 'cloudflare',
    databaseHost: process.env.DB_HOST_EUROPE || 'db-europe.blockstop.local',
    cacheHost: process.env.CACHE_HOST_EUROPE || 'cache-europe.blockstop.local:6379',
    apiEndpoint: process.env.API_ENDPOINT_EUROPE || 'https://api-europe.blockstop.io',
    isActive: true,
    priority: 3,
    healthCheckInterval: 30000,
    failoverEnabled: true,
    shard: 3,
  },
  [Region.ASIA]: {
    name: Region.ASIA,
    displayName: 'Asia',
    continent: 'Asia',
    coordinates: {
      latitude: 35.6762,
      longitude: 139.6503,
    },
    cdnProvider: 'jsdelivr',
    databaseHost: process.env.DB_HOST_ASIA || 'db-asia.blockstop.local',
    cacheHost: process.env.CACHE_HOST_ASIA || 'cache-asia.blockstop.local:6379',
    apiEndpoint: process.env.API_ENDPOINT_ASIA || 'https://api-asia.blockstop.io',
    isActive: true,
    priority: 4,
    healthCheckInterval: 30000,
    failoverEnabled: true,
    shard: 4,
  },
  [Region.INDIA]: {
    name: Region.INDIA,
    displayName: 'India',
    continent: 'Asia',
    coordinates: {
      latitude: 28.6139,
      longitude: 77.209,
    },
    cdnProvider: 'jsdelivr',
    databaseHost: process.env.DB_HOST_INDIA || 'db-india.blockstop.local',
    cacheHost: process.env.CACHE_HOST_INDIA || 'cache-india.blockstop.local:6379',
    apiEndpoint: process.env.API_ENDPOINT_INDIA || 'https://api-india.blockstop.io',
    isActive: true,
    priority: 5,
    healthCheckInterval: 30000,
    failoverEnabled: true,
    shard: 5,
  },
};

export interface RegionMetrics {
  region: Region;
  latency: number;
  uptime: number;
  requestsPerSecond: number;
  errorRate: number;
  cacheHitRate: number;
  lastHealthCheck: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export class RegionConfigManager {
  private configs: Map<Region, RegionConfig> = new Map();
  private metrics: Map<Region, RegionMetrics> = new Map();

  constructor() {
    this.initializeRegions();
  }

  private initializeRegions(): void {
    Object.values(Region).forEach((region) => {
      this.configs.set(region, REGION_CONFIGS[region]);
      this.metrics.set(region, {
        region,
        latency: 0,
        uptime: 100,
        requestsPerSecond: 0,
        errorRate: 0,
        cacheHitRate: 0,
        lastHealthCheck: new Date(),
        status: 'healthy',
      });
    });
  }

  /**
   * Get configuration for a specific region
   */
  getRegionConfig(region: Region): RegionConfig | undefined {
    return this.configs.get(region);
  }

  /**
   * Get all active regions
   */
  getActiveRegions(): RegionConfig[] {
    return Array.from(this.configs.values()).filter((config) => config.isActive);
  }

  /**
   * Get region by priority order
   */
  getRegionsByPriority(): RegionConfig[] {
    return Array.from(this.configs.values())
      .filter((config) => config.isActive)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Update region configuration
   */
  updateRegionConfig(region: Region, config: Partial<RegionConfig>): void {
    const existing = this.configs.get(region);
    if (existing) {
      this.configs.set(region, { ...existing, ...config });
    }
  }

  /**
   * Update region metrics
   */
  updateRegionMetrics(region: Region, metrics: Partial<RegionMetrics>): void {
    const existing = this.metrics.get(region);
    if (existing) {
      this.metrics.set(region, { ...existing, ...metrics });
    }
  }

  /**
   * Get metrics for a region
   */
  getRegionMetrics(region: Region): RegionMetrics | undefined {
    return this.metrics.get(region);
  }

  /**
   * Get all region metrics
   */
  getAllMetrics(): Map<Region, RegionMetrics> {
    return this.metrics;
  }

  /**
   * Calculate haversine distance between two coordinates
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get CDN URLs for an asset
   */
  getCdnUrls(assetPath: string): Map<Region, string> {
    const urls = new Map<Region, string>();

    this.getActiveRegions().forEach((config) => {
      const baseUrl = this.getCdnBaseUrl(config.cdnProvider);
      urls.set(config.name, `${baseUrl}/${assetPath}`);
    });

    return urls;
  }

  /**
   * Get CDN base URL based on provider
   */
  private getCdnBaseUrl(provider: string): string {
    const baseUrls: Record<string, string> = {
      cloudflare: 'https://cdn.jsdelivr.net',
      jsdelivr: 'https://cdn.jsdelivr.net',
      netlify: 'https://blockstop.netlify.app',
      vercel: 'https://blockstop.vercel.app',
    };
    return baseUrls[provider] || 'https://cdn.jsdelivr.net';
  }
}

// Export singleton instance
export const regionConfigManager = new RegionConfigManager();
