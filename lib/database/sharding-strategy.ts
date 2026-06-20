/**
 * Sharding Strategy - Manages database sharding for horizontal scaling
 * Handles shard selection, distribution, and rebalancing
 */

export interface ShardInfo {
  shardId: number;
  keyRange: { min: number; max: number };
  tableName: string;
  rowCount: number;
}

export interface ShardStats {
  rowCount: number;
  sizeBytes: number;
  utilizationPercent: number;
}

export class ShardingStrategy {
  private shards: Map<number, ShardInfo> = new Map();
  private db: any;
  private logger: any;
  private shardingKey: string = 'id'; // Default sharding key
  private hashFunction: (key: string | number) => number = this.defaultHashFunction;

  constructor(db: any, logger?: any, shardingKey: string = 'id') {
    this.db = db;
    this.logger = logger || console;
    this.shardingKey = shardingKey;
  }

  /**
   * Get shard ID for a given key
   */
  async getShardForKey(key: string | number): Promise<number> {
    try {
      const hash = this.hashFunction(key);

      for (const [shardId, shard] of this.shards) {
        if (hash >= shard.keyRange.min && hash < shard.keyRange.max) {
          return shardId;
        }
      }

      throw new Error(`No shard found for key: ${key}`);
    } catch (error) {
      this.logger.error('Error getting shard for key:', error);
      throw error;
    }
  }

  /**
   * List all configured shards
   */
  async listShards(): Promise<ShardInfo[]> {
    try {
      const shardInfos: ShardInfo[] = [];

      for (const [, shard] of this.shards) {
        shardInfos.push(shard);
      }

      return shardInfos;
    } catch (error) {
      this.logger.error('Error listing shards:', error);
      throw error;
    }
  }

  /**
   * Add a new shard
   */
  async addShard(
    shardId: number,
    keyRange: { min: number; max: number }
  ): Promise<ShardInfo> {
    try {
      // Validate key range
      if (keyRange.min >= keyRange.max) {
        throw new Error('Invalid key range: min must be less than max');
      }

      // Check for overlapping ranges
      for (const [, existing] of this.shards) {
        if (this.rangesOverlap(keyRange, existing.keyRange)) {
          throw new Error(
            `Key range overlaps with existing shard: ${existing.shardId}`
          );
        }
      }

      const shard: ShardInfo = {
        shardId,
        keyRange,
        tableName: '',
        rowCount: 0,
      };

      this.shards.set(shardId, shard);

      this.logger.info(
        `Added shard ${shardId}: range [${keyRange.min}, ${keyRange.max})`
      );

      return shard;
    } catch (error) {
      this.logger.error('Error adding shard:', error);
      throw error;
    }
  }

  /**
   * Rebalance shards to distribute load evenly
   */
  async rebalanceShards(): Promise<void> {
    try {
      const shardStats = new Map<number, ShardStats>();

      // Collect statistics for all shards
      for (const [shardId] of this.shards) {
        const stats = await this.getShardStats(shardId);
        shardStats.set(shardId, stats);
      }

      // Calculate average size
      let totalSize = 0;
      for (const stats of shardStats.values()) {
        totalSize += stats.sizeBytes;
      }
      const avgSize = totalSize / shardStats.size;

      // Identify imbalanced shards
      const overloaded: number[] = [];
      const underloaded: number[] = [];

      for (const [shardId, stats] of shardStats) {
        if (stats.sizeBytes > avgSize * 1.2) {
          overloaded.push(shardId);
        } else if (stats.sizeBytes < avgSize * 0.8) {
          underloaded.push(shardId);
        }
      }

      if (overloaded.length > 0 || underloaded.length > 0) {
        this.logger.info(
          `Rebalancing shards: overloaded=${overloaded}, underloaded=${underloaded}`
        );

        // Split overloaded shards and redistribute data
        for (const shardId of overloaded) {
          await this.splitShard(shardId);
        }
      }
    } catch (error) {
      this.logger.error('Error rebalancing shards:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a shard
   */
  async getShardStats(shardId: number): Promise<ShardStats> {
    try {
      const shard = this.shards.get(shardId);

      if (!shard) {
        throw new Error(`Shard not found: ${shardId}`);
      }

      const result = await this.db.query(
        `
        SELECT
          COUNT(*) as row_count,
          pg_total_relation_size($1::regclass) as size_bytes
        FROM ${shard.tableName}
        WHERE ${this.shardingKey} >= $2 AND ${this.shardingKey} < $3
      `,
        [shard.tableName, shard.keyRange.min, shard.keyRange.max]
      );

      if (result.rows.length === 0) {
        return {
          rowCount: 0,
          sizeBytes: 0,
          utilizationPercent: 0,
        };
      }

      const row = result.rows[0];
      const rowCount = parseInt(row.row_count) || 0;
      const sizeBytes = parseInt(row.size_bytes) || 0;

      // Update shard info
      shard.rowCount = rowCount;

      const totalSize = await this.getTotalShardSize();

      return {
        rowCount,
        sizeBytes,
        utilizationPercent:
          totalSize > 0 ? Math.round((sizeBytes / totalSize) * 100) : 0,
      };
    } catch (error) {
      this.logger.error('Error getting shard stats:', error);
      return {
        rowCount: 0,
        sizeBytes: 0,
        utilizationPercent: 0,
      };
    }
  }

  /**
   * Set custom hash function for sharding
   */
  setHashFunction(
    hashFunction: (key: string | number) => number
  ): void {
    this.hashFunction = hashFunction;
  }

  // Private helper methods

  private defaultHashFunction(key: string | number): number {
    if (typeof key === 'number') {
      return key;
    }

    // Simple hash function for string keys
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash);
  }

  private rangesOverlap(
    range1: { min: number; max: number },
    range2: { min: number; max: number }
  ): boolean {
    return !(range1.max <= range2.min || range2.max <= range1.min);
  }

  private async splitShard(shardId: number): Promise<void> {
    try {
      const shard = this.shards.get(shardId);

      if (!shard) {
        throw new Error(`Shard not found: ${shardId}`);
      }

      const midpoint = Math.floor(
        (shard.keyRange.min + shard.keyRange.max) / 2
      );

      // Create new shard
      const newShardId = Math.max(...this.shards.keys()) + 1;

      await this.addShard(newShardId, {
        min: midpoint,
        max: shard.keyRange.max,
      });

      // Update existing shard range
      shard.keyRange.max = midpoint;

      this.logger.info(
        `Split shard ${shardId} into ${shardId} and ${newShardId}`
      );
    } catch (error) {
      this.logger.error('Error splitting shard:', error);
      throw error;
    }
  }

  private async getTotalShardSize(): Promise<number> {
    try {
      let totalSize = 0;

      for (const [shardId] of this.shards) {
        const stats = await this.getShardStats(shardId);
        totalSize += stats.sizeBytes;
      }

      return totalSize;
    } catch (error) {
      this.logger.error('Error getting total shard size:', error);
      return 0;
    }
  }
}

export default ShardingStrategy;
