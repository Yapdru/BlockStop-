/**
 * Cache Warming Strategy
 * Pre-load cache with frequently accessed data
 */

export interface WarmingStrategy {
  name: string;
  keys: string[];
  frequency: number; // in seconds
  priority: 'high' | 'medium' | 'low';
}

export interface WarmingTask {
  strategyName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: Date;
  nextRun?: Date;
  keysWarmed: number;
  keysFailed: number;
}

export class CacheWarming {
  private strategies: Map<string, WarmingStrategy> = new Map();
  private tasks: Map<string, WarmingTask> = new Map();
  private scheduledIntervals: Map<string, NodeJS.Timeout> = new Map();
  private dataLoader: ((keys: string[]) => Promise<Map<string, any>>) | null = null;

  /**
   * Set data loader function for warming
   */
  setDataLoader(loader: (keys: string[]) => Promise<Map<string, any>>): void {
    this.dataLoader = loader;
  }

  /**
   * Register warming strategy
   */
  async registerStrategy(strategy: WarmingStrategy): Promise<void> {
    if (!strategy.name) {
      throw new Error('Strategy name is required');
    }

    if (strategy.keys.length === 0) {
      throw new Error('Strategy must include at least one key');
    }

    if (strategy.frequency < 0) {
      throw new Error('Frequency must be non-negative');
    }

    this.strategies.set(strategy.name, strategy);

    // Create task entry
    this.tasks.set(strategy.name, {
      strategyName: strategy.name,
      status: 'idle',
      keysWarmed: 0,
      keysFailed: 0,
    });
  }

  /**
   * Warm cache with keys
   */
  async warmCache(keys: string[]): Promise<{ loaded: number; failed: number }> {
    if (!this.dataLoader) {
      console.warn('No data loader configured for cache warming');
      return { loaded: 0, failed: 0 };
    }

    let loaded = 0;
    let failed = 0;

    try {
      const data = await this.dataLoader(keys);

      for (const [key, value] of data) {
        try {
          // Would set in actual cache here
          // await cacheManager.set(key, value);
          loaded++;
        } catch (error) {
          console.error(`Error warming key ${key}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error('Error loading data for cache warming:', error);
      failed = keys.length - loaded;
    }

    return { loaded, failed };
  }

  /**
   * Schedule periodic cache warming
   */
  async scheduleWarming(strategy: WarmingStrategy): Promise<void> {
    // First register if not already registered
    if (!this.strategies.has(strategy.name)) {
      await this.registerStrategy(strategy);
    }

    // Clear existing interval if any
    if (this.scheduledIntervals.has(strategy.name)) {
      clearInterval(this.scheduledIntervals.get(strategy.name)!);
    }

    // Schedule new warming
    const interval = setInterval(async () => {
      await this.executeWarmingTask(strategy.name);
    }, strategy.frequency * 1000);

    this.scheduledIntervals.set(strategy.name, interval);

    // Run immediately
    await this.executeWarmingTask(strategy.name);
  }

  /**
   * Unschedule warming
   */
  async unscheduleWarming(strategyName: string): Promise<void> {
    const interval = this.scheduledIntervals.get(strategyName);
    if (interval) {
      clearInterval(interval);
      this.scheduledIntervals.delete(strategyName);
    }

    const task = this.tasks.get(strategyName);
    if (task) {
      task.status = 'idle';
    }
  }

  /**
   * Execute warming task
   */
  private async executeWarmingTask(strategyName: string): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    const task = this.tasks.get(strategyName);

    if (!strategy || !task) {
      return;
    }

    task.status = 'running';
    task.nextRun = new Date(Date.now() + strategy.frequency * 1000);

    try {
      const result = await this.warmCache(strategy.keys);
      task.keysWarmed = result.loaded;
      task.keysFailed = result.failed;
      task.status = 'completed';
      task.lastRun = new Date();
    } catch (error) {
      console.error(`Cache warming failed for strategy ${strategyName}:`, error);
      task.status = 'failed';
      task.keysFailed = strategy.keys.length;
    }
  }

  /**
   * Get warming statistics
   */
  async getWarmingStats(): Promise<{
    lastRun?: Date;
    keysWarmed: number;
    totalStrategies: number;
    activeStrategies: number;
  }> {
    let lastRun: Date | undefined;
    let totalKeysWarmed = 0;
    let activeCount = 0;

    for (const task of this.tasks.values()) {
      if (task.lastRun && (!lastRun || task.lastRun > lastRun)) {
        lastRun = task.lastRun;
      }
      totalKeysWarmed += task.keysWarmed;

      if (task.status === 'running') {
        activeCount++;
      }
    }

    return {
      lastRun,
      keysWarmed: totalKeysWarmed,
      totalStrategies: this.strategies.size,
      activeStrategies: activeCount,
    };
  }

  /**
   * Get task status
   */
  async getTaskStatus(strategyName: string): Promise<WarmingTask | null> {
    return this.tasks.get(strategyName) || null;
  }

  /**
   * List all strategies
   */
  async listStrategies(): Promise<WarmingStrategy[]> {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy by name
   */
  async getStrategy(strategyName: string): Promise<WarmingStrategy | null> {
    return this.strategies.get(strategyName) || null;
  }

  /**
   * Remove strategy
   */
  async removeStrategy(strategyName: string): Promise<boolean> {
    // Unschedule first
    await this.unscheduleWarming(strategyName);

    this.strategies.delete(strategyName);
    this.tasks.delete(strategyName);

    return true;
  }

  /**
   * Get all task statuses
   */
  async getAllTaskStatuses(): Promise<WarmingTask[]> {
    return Array.from(this.tasks.values());
  }

  /**
   * Stop all warming
   */
  async stopAllWarming(): Promise<void> {
    for (const strategyName of this.strategies.keys()) {
      await this.unscheduleWarming(strategyName);
    }
  }

  /**
   * Start all registered strategies
   */
  async startAllWarming(): Promise<void> {
    for (const strategy of this.strategies.values()) {
      await this.scheduleWarming(strategy);
    }
  }
}

export const cacheWarming = new CacheWarming();
