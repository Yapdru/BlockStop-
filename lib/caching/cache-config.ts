/**
 * Cache Configuration Management
 * Handles loading, validating, and managing cache settings
 */

export interface CacheConfiguration {
  enableL1: boolean;
  enableL2: boolean;
  enableL3: boolean;
  l1Ttl: number;
  l2Ttl: number;
  l3Ttl: number;
  maxMemory: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

export class CacheConfig {
  private static readonly DEFAULT_CONFIG: CacheConfiguration = {
    enableL1: true,
    enableL2: true,
    enableL3: true,
    l1Ttl: 3600, // 1 hour
    l2Ttl: 86400, // 24 hours
    l3Ttl: 604800, // 7 days
    maxMemory: 536870912, // 512 MB
    evictionPolicy: 'lru',
  };

  private config: CacheConfiguration;

  constructor() {
    this.config = { ...CacheConfig.DEFAULT_CONFIG };
  }

  /**
   * Load cache configuration from environment or file
   */
  async loadConfig(): Promise<CacheConfiguration> {
    try {
      // Try to load from environment variables
      const envConfig = this.loadFromEnv();
      this.config = { ...this.config, ...envConfig };
      return this.config;
    } catch (error) {
      console.error('Error loading cache config:', error);
      return this.config;
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config: CacheConfiguration): Promise<void> {
    const validation = await this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    this.config = config;
  }

  /**
   * Get default configuration
   */
  async getDefaults(): Promise<CacheConfiguration> {
    return { ...CacheConfig.DEFAULT_CONFIG };
  }

  /**
   * Validate configuration
   */
  async validateConfig(config: CacheConfiguration): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (config.l1Ttl < 0) errors.push('l1Ttl must be non-negative');
    if (config.l2Ttl < 0) errors.push('l2Ttl must be non-negative');
    if (config.l3Ttl < 0) errors.push('l3Ttl must be non-negative');

    if (config.l1Ttl > config.l2Ttl) errors.push('l1Ttl should not exceed l2Ttl');
    if (config.l2Ttl > config.l3Ttl) errors.push('l2Ttl should not exceed l3Ttl');

    if (config.maxMemory < 1024) errors.push('maxMemory must be at least 1KB');

    if (!['lru', 'lfu', 'fifo'].includes(config.evictionPolicy)) {
      errors.push('Invalid evictionPolicy');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): Partial<CacheConfiguration> {
    const config: Partial<CacheConfiguration> = {};

    if (process.env.CACHE_ENABLE_L1) {
      config.enableL1 = process.env.CACHE_ENABLE_L1 === 'true';
    }
    if (process.env.CACHE_ENABLE_L2) {
      config.enableL2 = process.env.CACHE_ENABLE_L2 === 'true';
    }
    if (process.env.CACHE_ENABLE_L3) {
      config.enableL3 = process.env.CACHE_ENABLE_L3 === 'true';
    }

    if (process.env.CACHE_L1_TTL) {
      config.l1Ttl = parseInt(process.env.CACHE_L1_TTL, 10);
    }
    if (process.env.CACHE_L2_TTL) {
      config.l2Ttl = parseInt(process.env.CACHE_L2_TTL, 10);
    }
    if (process.env.CACHE_L3_TTL) {
      config.l3Ttl = parseInt(process.env.CACHE_L3_TTL, 10);
    }

    if (process.env.CACHE_MAX_MEMORY) {
      config.maxMemory = parseInt(process.env.CACHE_MAX_MEMORY, 10);
    }

    if (process.env.CACHE_EVICTION_POLICY) {
      const policy = process.env.CACHE_EVICTION_POLICY as 'lru' | 'lfu' | 'fifo';
      if (['lru', 'lfu', 'fifo'].includes(policy)) {
        config.evictionPolicy = policy;
      }
    }

    return config;
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfiguration {
    return this.config;
  }
}

export const cacheConfig = new CacheConfig();
