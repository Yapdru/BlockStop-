/**
 * Shard Manager
 * Manages data sharding across multiple databases
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export enum ShardKey {
  USER_ID = 'user_id',
  ORGANIZATION_ID = 'organization_id',
  GEOGRAPHY = 'geography',
}

export interface ShardConfig {
  id: number;
  name: string;
  connectionString: string;
  minRange: number;
  maxRange: number;
  isActive: boolean;
  replicationEnabled: boolean;
  replicaUrls: string[];
}

export interface ShardMetrics {
  shardId: number;
  size: number; // bytes
  rowCount: number;
  lastHealthCheck: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  replicationLag?: number; // ms
}

export class ShardManager {
  private shards: Map<number, Pool> = new Map();
  private shardConfigs: Map<number, ShardConfig> = new Map();
  private metrics: Map<number, ShardMetrics> = new Map();
  private consistentHashRing: Map<number, number> = new Map(); // hash -> shard_id

  constructor() {
    this.initializeShards();
  }

  /**
   * Initialize shard connections from environment
   */
  private initializeShards(): void {
    const shardCount = parseInt(process.env.SHARD_COUNT || '5', 10);

    for (let i = 1; i <= shardCount; i++) {
      const connectionString = process.env[`SHARD_${i}_CONNECTION_STRING`] ||
        process.env[`DATABASE_URL_SHARD_${i}`] || (
          process.env.DATABASE_URL?.replace(
            /\/[^/]+$/,
            `/blockstop_shard_${i}`,
          ) ?? ''
        );

      if (!connectionString) {
        console.warn(`No connection string for shard ${i}`);
        continue;
      }

      const pool = new Pool({
        connectionString,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      });

      this.shards.set(i, pool);
      this.shardConfigs.set(i, {
        id: i,
        name: `shard_${i}`,
        connectionString,
        minRange: ((i - 1) * Math.floor(Number.MAX_SAFE_INTEGER / shardCount)),
        maxRange: (i * Math.floor(Number.MAX_SAFE_INTEGER / shardCount)) - 1,
        isActive: true,
        replicationEnabled: process.env[`SHARD_${i}_REPLICATION_ENABLED`] === 'true',
        replicaUrls: this.loadReplicaUrls(i),
      });

      this.metrics.set(i, {
        shardId: i,
        size: 0,
        rowCount: 0,
        lastHealthCheck: new Date(),
        status: 'healthy',
      });
    }
  }

  /**
   * Load replica URLs for a shard
   */
  private loadReplicaUrls(shardId: number): string[] {
    const replicaCount = parseInt(
      process.env[`SHARD_${shardId}_REPLICA_COUNT`] || '0',
      10,
    );
    const urls: string[] = [];

    for (let i = 1; i <= replicaCount; i++) {
      const url = process.env[`SHARD_${shardId}_REPLICA_${i}_URL`];
      if (url) {
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * Calculate hash for sharding key
   */
  private hashKey(key: string | number): number {
    let hash = 0;
    const str = String(key);

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  /**
   * Get shard ID for a key
   */
  private getShardIdForHash(hash: number): number {
    const shardCount = this.shards.size;
    return (hash % shardCount) + 1;
  }

  /**
   * Get shard ID for a value
   */
  getShardId(key: string | number): number {
    const hash = this.hashKey(key);
    return this.getShardIdForHash(hash);
  }

  /**
   * Get shard pool
   */
  private getShardPool(shardId: number): Pool {
    const pool = this.shards.get(shardId);
    if (!pool) {
      throw new Error(`Shard ${shardId} not found`);
    }
    return pool;
  }

  /**
   * Get shard config
   */
  getShardConfig(shardId: number): ShardConfig | undefined {
    return this.shardConfigs.get(shardId);
  }

  /**
   * Query a specific shard
   */
  async queryShard(
    shardId: number,
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult> {
    const pool = this.getShardPool(shardId);
    const start = Date.now();

    try {
      const result = await pool.query(sql, params);
      const duration = Date.now() - start;

      console.log(`Shard ${shardId} query executed`, {
        sql: sql.substring(0, 100),
        duration,
        rows: result.rowCount,
      });

      return result;
    } catch (error) {
      console.error(`Shard ${shardId} query error:`, error);
      throw error;
    }
  }

  /**
   * Query by sharding key
   */
  async queryByKey(
    shardKey: ShardKey,
    keyValue: string | number,
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult> {
    const shardId = this.getShardId(keyValue);
    return this.queryShard(shardId, sql, params);
  }

  /**
   * Execute query across all shards
   */
  async queryAllShards(
    sql: string,
    params?: unknown[],
  ): Promise<Map<number, QueryResult>> {
    const results = new Map<number, QueryResult>();

    const promises = Array.from(this.shards.keys()).map(async (shardId) => {
      try {
        const result = await this.queryShard(shardId, sql, params);
        results.set(shardId, result);
      } catch (error) {
        console.error(`Error querying shard ${shardId}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get shard connection for transactions
   */
  async getShardConnection(shardId: number): Promise<PoolClient> {
    const pool = this.getShardPool(shardId);
    return pool.connect();
  }

  /**
   * Rebalance data across shards
   */
  async rebalanceShards(
    sourceShardId: number,
    targetShardId: number,
    moveCondition: string,
  ): Promise<number> {
    const sourcePool = this.getShardPool(sourceShardId);
    const targetPool = this.getShardPool(targetShardId);

    const client = await sourcePool.connect();

    try {
      await client.query('BEGIN');

      // Get data to move
      const selectResult = await client.query(
        `SELECT * FROM data WHERE ${moveCondition}`,
      );
      const rowsToMove = selectResult.rowCount || 0;

      if (rowsToMove > 0) {
        // Insert into target shard
        await targetPool.query(
          `INSERT INTO data SELECT * FROM data WHERE ${moveCondition}`,
        );

        // Delete from source shard
        await client.query(
          `DELETE FROM data WHERE ${moveCondition}`,
        );
      }

      await client.query('COMMIT');
      return rowsToMove;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Shard rebalancing error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get shard metrics
   */
  getShardMetrics(shardId: number): ShardMetrics | undefined {
    return this.metrics.get(shardId);
  }

  /**
   * Get all shard metrics
   */
  getAllShardMetrics(): Map<number, ShardMetrics> {
    return this.metrics;
  }

  /**
   * Update shard metrics
   */
  updateShardMetrics(
    shardId: number,
    metrics: Partial<ShardMetrics>,
  ): void {
    const existing = this.metrics.get(shardId);
    if (existing) {
      this.metrics.set(shardId, { ...existing, ...metrics });
    }
  }

  /**
   * Health check all shards
   */
  async healthCheckAllShards(): Promise<Map<number, boolean>> {
    const results = new Map<number, boolean>();

    const promises = Array.from(this.shards.keys()).map(async (shardId) => {
      try {
        const result = await this.queryShard(shardId, 'SELECT 1');
        const isHealthy = !!result.rows;
        results.set(
          shardId,
          isHealthy,
        );

        this.updateShardMetrics(shardId, {
          lastHealthCheck: new Date(),
          status: isHealthy ? 'healthy' : 'unhealthy',
        });
      } catch (error) {
        console.error(`Health check failed for shard ${shardId}:`, error);
        results.set(shardId, false);
        this.updateShardMetrics(shardId, {
          lastHealthCheck: new Date(),
          status: 'unhealthy',
        });
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get shard distribution stats
   */
  async getShardStats(): Promise<Map<number, { percentage: number; rowCount: number }>> {
    const stats = new Map<number, { percentage: number; rowCount: number }>();
    let totalRows = 0;

    const results = await this.queryAllShards('SELECT COUNT(*) as count FROM data');

    results.forEach((result, shardId) => {
      const rowCount = parseInt(result.rows[0]?.count || '0', 10);
      totalRows += rowCount;
      stats.set(shardId, { percentage: 0, rowCount });
    });

    stats.forEach((stat, shardId) => {
      stat.percentage = totalRows > 0 ? (stat.rowCount / totalRows) * 100 : 0;
    });

    return stats;
  }

  /**
   * Close all shard connections
   */
  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.shards.values()).map((pool) =>
      pool.end().catch((err) => console.error('Pool close error:', err)),
    );

    await Promise.all(promises);
    this.shards.clear();
  }
}

export const shardManager = new ShardManager();
