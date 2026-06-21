/**
 * Shard Router
 * Routes database queries to the correct shard based on sharding key
 */

import { QueryResult } from 'pg';
import { shardManager, ShardKey } from './shard-manager';

export interface ShardRoute {
  shardId: number;
  keyValue: string | number;
  sql: string;
  params?: unknown[];
}

export interface ShardRouterConfig {
  defaultShardKey: ShardKey;
  enableShardingRebalance: boolean;
  maxRebalanceSize: number; // bytes
  rebalanceThreshold: number; // percentage
}

export class ShardRouter {
  private config: ShardRouterConfig;
  private queryCache: Map<string, QueryResult> = new Map();

  constructor(config?: Partial<ShardRouterConfig>) {
    this.config = {
      defaultShardKey: ShardKey.USER_ID,
      enableShardingRebalance: true,
      maxRebalanceSize: 1000000000, // 1GB
      rebalanceThreshold: 30, // 30% imbalance
      ...config,
    };
  }

  /**
   * Route a query based on a shard key
   */
  async route(
    shardKey: ShardKey,
    keyValue: string | number,
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult> {
    const cacheKey = this.generateCacheKey(shardKey, keyValue, sql);

    // Check cache
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    // Route to correct shard
    const result = await shardManager.queryByKey(shardKey, keyValue, sql, params);

    // Cache result
    this.queryCache.set(cacheKey, result);

    return result;
  }

  /**
   * Route a query to all shards and aggregate results
   */
  async routeToAllShards(
    sql: string,
    params?: unknown[],
    aggregator?: (results: QueryResult[]) => QueryResult,
  ): Promise<QueryResult> {
    const results = await shardManager.queryAllShards(sql, params);

    if (aggregator) {
      return aggregator(Array.from(results.values()));
    }

    // Default aggregation: combine all rows
    const combinedRows: any[] = [];
    results.forEach((result) => {
      combinedRows.push(...(result.rows || []));
    });

    return {
      command: 'SELECT',
      rowCount: combinedRows.length,
      oid: 0,
      rows: combinedRows,
      fields: results.values().next().value?.fields || [],
    };
  }

  /**
   * Route a query with fallback to other shards
   */
  async routeWithFallback(
    shardKey: ShardKey,
    keyValue: string | number,
    sql: string,
    params?: unknown[],
    maxRetries: number = 3,
  ): Promise<QueryResult> {
    let lastError: Error | undefined;
    const shardId = shardManager.getShardId(keyValue);

    // Try primary shard
    try {
      return await shardManager.queryShard(shardId, sql, params);
    } catch (error) {
      lastError = error as Error;
      console.error(`Primary shard ${shardId} failed, trying fallback`, error);
    }

    // Try other shards as fallback
    const allShardIds = Array.from(shardManager['shards'].keys()).filter(
      (id) => id !== shardId,
    );

    for (const fallbackShardId of allShardIds.slice(0, maxRetries - 1)) {
      try {
        return await shardManager.queryShard(fallbackShardId, sql, params);
      } catch (error) {
        console.error(`Fallback shard ${fallbackShardId} failed`, error);
        lastError = error as Error;
      }
    }

    throw lastError || new Error('All shards failed');
  }

  /**
   * Determine which shard a user should use
   */
  getShardForUser(userId: string | number): number {
    return shardManager.getShardId(userId);
  }

  /**
   * Determine which shard an organization should use
   */
  getShardForOrganization(organizationId: string | number): number {
    return shardManager.getShardId(organizationId);
  }

  /**
   * Get shard info for debugging
   */
  getShardInfo(shardId: number) {
    return shardManager.getShardConfig(shardId);
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    shardKey: ShardKey,
    keyValue: string | number,
    sql: string,
  ): string {
    return `${shardKey}:${keyValue}:${sql.substring(0, 50)}`;
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Clear cache for a specific shard key
   */
  clearCacheForKey(
    shardKey: ShardKey,
    keyValue: string | number,
  ): void {
    const keysToDelete: string[] = [];

    this.queryCache.forEach((_, cacheKey) => {
      if (cacheKey.startsWith(`${shardKey}:${keyValue}`)) {
        keysToDelete.push(cacheKey);
      }
    });

    keysToDelete.forEach((key) => this.queryCache.delete(key));
  }

  /**
   * Monitor shard balance and trigger rebalancing if needed
   */
  async monitorShardBalance(): Promise<void> {
    if (!this.config.enableShardingRebalance) {
      return;
    }

    try {
      const stats = await shardManager.getShardStats();

      // Check if any shard is significantly imbalanced
      const percentages = Array.from(stats.values()).map((s) => s.percentage);
      const avgPercentage = percentages.reduce((a, b) => a + b) / percentages.length;

      for (const [shardId, stat] of stats.entries()) {
        const deviation = Math.abs(stat.percentage - avgPercentage);
        if (deviation > this.config.rebalanceThreshold) {
          console.warn(
            `Shard ${shardId} is imbalanced: ${stat.percentage.toFixed(2)}% vs avg ${avgPercentage.toFixed(2)}%`,
          );
          // In production, trigger rebalancing workflow
        }
      }
    } catch (error) {
      console.error('Error monitoring shard balance:', error);
    }
  }

  /**
   * Get router configuration
   */
  getConfig(): ShardRouterConfig {
    return this.config;
  }

  /**
   * Update router configuration
   */
  updateConfig(config: Partial<ShardRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Perform health checks on all shards
   */
  async performHealthChecks(): Promise<boolean> {
    try {
      const results = await shardManager.healthCheckAllShards();
      const allHealthy = Array.from(results.values()).every((healthy) => healthy);

      if (!allHealthy) {
        console.warn('Some shards are unhealthy');
      }

      return allHealthy;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      cacheSize: this.queryCache.size,
      config: this.config,
      shardCount: shardManager['shards'].size,
    };
  }
}

// Export singleton
export const shardRouter = new ShardRouter({
  defaultShardKey: ShardKey.USER_ID,
  enableShardingRebalance: true,
});
