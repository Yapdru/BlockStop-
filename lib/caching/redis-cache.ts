/**
 * Redis Cache Implementation
 * Distributed caching layer for multi-instance deployments
 */

export class RedisCache {
  private client: any = null;
  private connected: boolean = false;
  private url: string = '';

  /**
   * Connect to Redis
   */
  async connect(url: string): Promise<void> {
    try {
      this.url = url;

      // Dynamically import redis client only when needed
      let redis: any;
      try {
        redis = await import('redis');
      } catch {
        console.warn('redis package not installed, Redis cache disabled');
        return;
      }

      this.client = redis.createClient({ url });

      this.client.on('error', (err: Error) => {
        console.error('Redis error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.connected = true;
      });

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.connected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<any | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in Redis
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
    }
  }

  /**
   * Set value with expiration (in seconds)
   */
  async setex(key: string, seconds: number, value: any): Promise<void> {
    await this.set(key, value, seconds);
  }

  /**
   * Delete entry from Redis
   */
  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
    }
  }

  /**
   * Delete entries matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client || !this.connected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Get Redis statistics
   */
  async getStats(): Promise<{ keyCount: number; memory: number }> {
    if (!this.client || !this.connected) {
      return { keyCount: 0, memory: 0 };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbSize();

      // Parse memory from info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memory = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;

      return {
        keyCount: keys,
        memory,
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error);
      return { keyCount: 0, memory: 0 };
    }
  }

  /**
   * Flush database
   */
  async flushDb(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Error flushing database:', error);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

export const redisCache = new RedisCache();
