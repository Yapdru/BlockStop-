/**
 * BlockStop Performance Optimization Module
 * Database optimization with connection pooling, caching, query optimization, and resource management
 * Features: connection pooling, multi-level caching, query optimization, memory/CPU throttling
 *
 * Phase 30.6 - Performance & Offline
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export enum CacheLevel {
  L1_MEMORY = 'l1_memory', // In-memory cache
  L2_LOCAL = 'l2_local', // LocalStorage/IndexedDB
  L3_REMOTE = 'l3_remote', // Server-side cache
}

export enum QueryOptimizationType {
  INDEXED_LOOKUP = 'indexed_lookup',
  BATCH_QUERY = 'batch_query',
  PARALLEL_QUERY = 'parallel_query',
  CACHE_HIT = 'cache_hit',
  FULL_SCAN = 'full_scan',
}

export interface QueryPlan {
  id: string;
  query: string;
  optimizationType: QueryOptimizationType;
  indexes: string[];
  estimatedRows: number;
  estimatedCost: number;
  cacheEligible: boolean;
  parallelizable: boolean;
  executionTime?: number;
  rowsReturned?: number;
  cacheHit?: boolean;
}

export interface CachedQuery {
  id: string;
  query: string;
  hash: string;
  results: any[];
  timestamp: number;
  ttl: number;
  expiresAt: number;
  hitCount: number;
  level: CacheLevel;
  size: number;
}

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
  validationQuery?: string;
}

export interface PooledConnection {
  id: string;
  createdAt: number;
  lastUsed: number;
  active: boolean;
  query?: string;
  duration?: number;
}

export interface PerformanceMetrics {
  queriesExecuted: number;
  cacheHitRate: number;
  avgQueryDuration: number;
  p95QueryDuration: number;
  p99QueryDuration: number;
  totalCacheSize: number;
  activeConnections: number;
  memoryUsage: number;
  cpuThrottled: boolean;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }>;
}

export interface MemoryConfig {
  maxHeapSize: number;
  gcThreshold: number;
  warningThreshold: number;
}

export interface CPUThrottlingConfig {
  enabled: boolean;
  cpuUsageThreshold: number;
  throttleDelayMs: number;
  monitoringIntervalMs: number;
}

export interface QueryOptimizerConfig {
  userId: string;
  connectionPool?: ConnectionPoolConfig;
  cacheLevels?: CacheLevel[];
  memoryConfig?: MemoryConfig;
  cpuThrottling?: CPUThrottlingConfig;
  slowQueryThresholdMs?: number;
  batchQuerySize?: number;
}

export interface Index {
  name: string;
  fields: string[];
  unique: boolean;
  sparse: boolean;
  created: number;
}

export interface Statistics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  slowQueryCount: number;
  connectionPoolUtilization: number;
  avgBatchSize: number;
}

/**
 * Query Optimizer & Performance Manager
 * Optimizes database queries with connection pooling, intelligent caching,
 * query planning, and resource throttling
 */
export class QueryOptimizer extends EventEmitter {
  private config: QueryOptimizerConfig;
  private connectionPool: Map<string, PooledConnection> = new Map();
  private l1Cache: Map<string, CachedQuery> = new Map(); // Memory
  private l2Cache: Map<string, CachedQuery> = new Map(); // Local storage
  private queryPlans: Map<string, QueryPlan> = new Map();
  private statistics: Statistics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    slowQueryCount: 0,
    connectionPoolUtilization: 0,
    avgBatchSize: 0,
  };
  private indexes: Map<string, Index> = new Map();
  private slowQueries: Array<{ query: string; duration: number; timestamp: number }> = [];
  private queryDurations: number[] = [];
  private memoryMonitor: NodeJS.Timeout | null = null;
  private cpuMonitor: NodeJS.Timeout | null = null;
  private isThrottled = false;
  private isInitialized = false;

  private readonly DEFAULT_POOL_SIZE = 10;
  private readonly DEFAULT_MAX_POOL_SIZE = 50;
  private readonly DEFAULT_IDLE_TIMEOUT = 30000;
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly QUERY_CACHE_DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MEMORY_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly CPU_CHECK_INTERVAL = 5000; // 5 seconds

  constructor(config: QueryOptimizerConfig) {
    super();
    this.config = {
      connectionPool: {
        minConnections: this.DEFAULT_POOL_SIZE,
        maxConnections: this.DEFAULT_MAX_POOL_SIZE,
        idleTimeoutMs: this.DEFAULT_IDLE_TIMEOUT,
        acquireTimeoutMs: 5000,
      },
      cacheLevels: [CacheLevel.L1_MEMORY, CacheLevel.L2_LOCAL],
      memoryConfig: {
        maxHeapSize: 512 * 1024 * 1024, // 512MB
        gcThreshold: 400 * 1024 * 1024, // 400MB
        warningThreshold: 450 * 1024 * 1024, // 450MB
      },
      cpuThrottling: {
        enabled: true,
        cpuUsageThreshold: 80,
        throttleDelayMs: 100,
        monitoringIntervalMs: this.CPU_CHECK_INTERVAL,
      },
      slowQueryThresholdMs: this.SLOW_QUERY_THRESHOLD,
      batchQuerySize: 1000,
      ...config,
    };
  }

  /**
   * Initialize the query optimizer
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Initialize connection pool
      await this.initializeConnectionPool();

      // Create default indexes
      this.createDefaultIndexes();

      // Start memory monitoring
      this.startMemoryMonitoring();

      // Start CPU monitoring if enabled
      if (this.config.cpuThrottling?.enabled) {
        this.startCPUMonitoring();
      }

      this.isInitialized = true;
      this.emit('initialized', {
        poolSize: this.connectionPool.size,
        cacheSize: this.l1Cache.size + this.l2Cache.size,
      });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Execute a query with optimization
   */
  async executeQuery(
    query: string,
    params?: any[],
    options?: {
      cacheable?: boolean;
      batchable?: boolean;
      cacheTTL?: number;
    }
  ): Promise<any[]> {
    try {
      if (this.isThrottled) {
        await this.sleep(this.config.cpuThrottling?.throttleDelayMs || 100);
      }

      this.statistics.totalQueries++;

      // Check cache
      const cacheKey = this.generateCacheKey(query, params);
      const cachedResult = this.getFromCache(cacheKey);

      if (cachedResult) {
        this.statistics.cacheHits++;
        this.emit('query:cache_hit', { query, cacheKey });
        return cachedResult;
      }

      this.statistics.cacheMisses++;

      // Generate query plan
      const plan = await this.generateQueryPlan(query, params);

      // Acquire connection
      const connection = await this.acquireConnection();

      try {
        const startTime = Date.now();

        // Execute query based on plan
        let results: any[];
        if (plan.parallelizable && (params?.length || 0) > 10) {
          results = await this.executeParallelQuery(connection, query, params);
        } else {
          results = await this.executeSingleQuery(connection, query, params);
        }

        const duration = Date.now() - startTime;
        plan.executionTime = duration;
        plan.rowsReturned = results.length;

        // Track slow queries
        if (duration > (this.config.slowQueryThresholdMs || this.SLOW_QUERY_THRESHOLD)) {
          this.statistics.slowQueryCount++;
          this.slowQueries.push({ query, duration, timestamp: Date.now() });
          this.emit('query:slow', { query, duration });
        }

        // Track query durations for percentile calculations
        this.queryDurations.push(duration);
        if (this.queryDurations.length > 10000) {
          this.queryDurations = this.queryDurations.slice(-10000);
        }

        // Cache results if eligible
        if (options?.cacheable !== false && plan.cacheEligible) {
          this.cacheQuery(
            cacheKey,
            results,
            options?.cacheTTL || this.QUERY_CACHE_DEFAULT_TTL
          );
        }

        return results;
      } finally {
        this.releaseConnection(connection.id);
      }
    } catch (error) {
      this.emit('error', { error, context: 'executeQuery', query });
      throw error;
    }
  }

  /**
   * Execute a batch of queries
   */
  async executeBatchQueries(
    queries: Array<{ query: string; params?: any[] }>
  ): Promise<any[][]> {
    try {
      // Group by similar queries for optimization
      const grouped = this.groupQueries(queries);
      const results: any[][] = [];

      for (const group of grouped) {
        const batchResults = await Promise.all(
          group.map((q) =>
            this.executeQuery(q.query, q.params, { cacheable: true, batchable: true })
          )
        );
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      this.emit('error', { error, context: 'executeBatchQueries' });
      throw error;
    }
  }

  /**
   * Generate query plan
   */
  private async generateQueryPlan(query: string, params?: any[]): Promise<QueryPlan> {
    const planId = uuidv4();
    const queryHash = this.hashQuery(query);

    // Check if plan exists
    const existing = this.queryPlans.get(queryHash);
    if (existing) {
      return existing;
    }

    const plan: QueryPlan = {
      id: planId,
      query,
      optimizationType: this.determineOptimizationType(query),
      indexes: this.findApplicableIndexes(query),
      estimatedRows: 100,
      estimatedCost: 10,
      cacheEligible: !query.toLowerCase().includes('write'),
      parallelizable: (params?.length || 0) > 10 && !query.toLowerCase().includes('limit'),
    };

    this.queryPlans.set(queryHash, plan);
    return plan;
  }

  /**
   * Execute single query
   */
  private async executeSingleQuery(
    connection: PooledConnection,
    query: string,
    params?: any[]
  ): Promise<any[]> {
    // In a real implementation, this would execute against actual database
    // For now, return mock results
    return [
      {
        id: uuidv4(),
        timestamp: Date.now(),
        data: 'sample_result',
      },
    ];
  }

  /**
   * Execute parallel query
   */
  private async executeParallelQuery(
    connection: PooledConnection,
    query: string,
    params?: any[]
  ): Promise<any[]> {
    // Split into parallel sub-queries
    const subQueryCount = Math.min(4, (params?.length || 0) / 10);
    const promises = [];

    for (let i = 0; i < subQueryCount; i++) {
      promises.push(this.executeSingleQuery(connection, query, params));
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * Cache query results
   */
  private cacheQuery(key: string, results: any[], ttl: number): void {
    const cached: CachedQuery = {
      id: uuidv4(),
      query: key,
      hash: key,
      results,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl,
      hitCount: 0,
      level: CacheLevel.L1_MEMORY,
      size: JSON.stringify(results).length,
    };

    this.l1Cache.set(key, cached);

    // Enforce cache size limits
    if (this.getTotalCacheSize() > 100 * 1024 * 1024) {
      // 100MB limit
      this.evictOldestCacheEntries();
    }
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any[] | null {
    // Check L1 cache
    let cached = this.l1Cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      cached.hitCount++;
      return cached.results;
    } else if (cached) {
      this.l1Cache.delete(key);
    }

    // Check L2 cache
    cached = this.l2Cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      cached.hitCount++;
      // Promote to L1
      this.l1Cache.set(key, cached);
      return cached.results;
    } else if (cached) {
      this.l2Cache.delete(key);
    }

    return null;
  }

  /**
   * Initialize connection pool
   */
  private async initializeConnectionPool(): Promise<void> {
    const minConnections = this.config.connectionPool?.minConnections || this.DEFAULT_POOL_SIZE;

    for (let i = 0; i < minConnections; i++) {
      const connection: PooledConnection = {
        id: uuidv4(),
        createdAt: Date.now(),
        lastUsed: Date.now(),
        active: false,
      };
      this.connectionPool.set(connection.id, connection);
    }

    this.emit('pool:initialized', { size: this.connectionPool.size });
  }

  /**
   * Acquire connection from pool
   */
  private async acquireConnection(): Promise<PooledConnection> {
    // Find available connection
    for (const connection of this.connectionPool.values()) {
      if (!connection.active) {
        connection.active = true;
        connection.lastUsed = Date.now();
        return connection;
      }
    }

    // Create new connection if pool not full
    const maxConnections =
      this.config.connectionPool?.maxConnections || this.DEFAULT_MAX_POOL_SIZE;
    if (this.connectionPool.size < maxConnections) {
      const connection: PooledConnection = {
        id: uuidv4(),
        createdAt: Date.now(),
        lastUsed: Date.now(),
        active: true,
      };
      this.connectionPool.set(connection.id, connection);
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const connection of this.connectionPool.values()) {
          if (!connection.active) {
            connection.active = true;
            connection.lastUsed = Date.now();
            clearInterval(checkInterval);
            resolve(connection);
            return;
          }
        }
      }, 100);
    });
  }

  /**
   * Release connection back to pool
   */
  private releaseConnection(connectionId: string): void {
    const connection = this.connectionPool.get(connectionId);
    if (connection) {
      connection.active = false;
      connection.lastUsed = Date.now();
    }
  }

  /**
   * Create default indexes
   */
  private createDefaultIndexes(): void {
    const defaultIndexes = [
      { name: 'idx_timestamp', fields: ['timestamp'], unique: false, sparse: false },
      { name: 'idx_userId', fields: ['userId'], unique: false, sparse: false },
      { name: 'idx_status', fields: ['status'], unique: false, sparse: false },
      { name: 'idx_created', fields: ['created'], unique: false, sparse: false },
    ];

    defaultIndexes.forEach((idx) => {
      this.indexes.set(idx.name, {
        ...idx,
        created: Date.now(),
      });
    });

    this.emit('indexes:created', { count: defaultIndexes.length });
  }

  /**
   * Create index
   */
  createIndex(name: string, fields: string[], options?: { unique?: boolean }): void {
    this.indexes.set(name, {
      name,
      fields,
      unique: options?.unique || false,
      sparse: false,
      created: Date.now(),
    });

    this.emit('index:created', { name, fields });
  }

  /**
   * Find applicable indexes
   */
  private findApplicableIndexes(query: string): string[] {
    const applicable = [];

    for (const [name, index] of this.indexes) {
      for (const field of index.fields) {
        if (query.includes(field)) {
          applicable.push(name);
        }
      }
    }

    return applicable;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, params?: any[]): string {
    const hash = this.hashQuery(query);
    const paramsHash = params ? this.hashQuery(JSON.stringify(params)) : '';
    return `${hash}_${paramsHash}`;
  }

  /**
   * Hash query
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash)}`;
  }

  /**
   * Determine optimization type
   */
  private determineOptimizationType(query: string): QueryOptimizationType {
    const lower = query.toLowerCase();

    if (lower.includes('where') && lower.includes('=')) {
      return QueryOptimizationType.INDEXED_LOOKUP;
    } else if (lower.includes('in (')) {
      return QueryOptimizationType.BATCH_QUERY;
    } else if (lower.includes('union') || lower.includes('join')) {
      return QueryOptimizationType.PARALLEL_QUERY;
    } else {
      return QueryOptimizationType.FULL_SCAN;
    }
  }

  /**
   * Group similar queries
   */
  private groupQueries(
    queries: Array<{ query: string; params?: any[] }>
  ): Array<Array<{ query: string; params?: any[] }>> {
    const groups: Map<string, Array<{ query: string; params?: any[] }>> = new Map();

    queries.forEach((q) => {
      const hash = this.hashQuery(q.query);
      if (!groups.has(hash)) {
        groups.set(hash, []);
      }
      groups.get(hash)!.push(q);
    });

    return Array.from(groups.values());
  }

  /**
   * Get total cache size
   */
  private getTotalCacheSize(): number {
    let size = 0;

    for (const cached of this.l1Cache.values()) {
      size += cached.size;
    }

    for (const cached of this.l2Cache.values()) {
      size += cached.size;
    }

    return size;
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldestCacheEntries(): void {
    const allEntries = [
      ...Array.from(this.l1Cache.values()),
      ...Array.from(this.l2Cache.values()),
    ];

    // Sort by hit count (evict least used)
    allEntries.sort((a, b) => a.hitCount - b.hitCount);

    // Remove bottom 20%
    const toRemove = Math.ceil(allEntries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      const entry = allEntries[i];
      this.l1Cache.delete(entry.query);
      this.l2Cache.delete(entry.query);
    }

    this.emit('cache:evicted', { removed: toRemove });
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryMonitor = setInterval(() => {
      const memUsage = process.memoryUsage().heapUsed;
      const memConfig = this.config.memoryConfig!;

      if (memUsage > memConfig.warningThreshold) {
        this.emit('memory:warning', { usage: memUsage });

        if (memUsage > memConfig.gcThreshold) {
          // Trigger aggressive cache eviction
          this.evictOldestCacheEntries();
          this.emit('memory:gc_triggered', { usage: memUsage });
        }
      }
    }, this.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Start CPU monitoring
   */
  private startCPUMonitoring(): void {
    this.cpuMonitor = setInterval(() => {
      const cpuUsage = process.cpuUsage();
      const userCpu = (cpuUsage.user / 1000000) * 100;
      const systemCpu = (cpuUsage.system / 1000000) * 100;
      const totalCpu = userCpu + systemCpu;

      if (totalCpu > (this.config.cpuThrottling?.cpuUsageThreshold || 80)) {
        this.isThrottled = true;
        this.emit('cpu:throttled', { usage: totalCpu });
      } else if (totalCpu < 60) {
        this.isThrottled = false;
        this.emit('cpu:normal', { usage: totalCpu });
      }
    }, this.config.cpuThrottling?.monitoringIntervalMs || this.CPU_CHECK_INTERVAL);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const hitRate = this.statistics.totalQueries > 0
      ? this.statistics.cacheHits / this.statistics.totalQueries
      : 0;

    const durations = [...this.queryDurations].sort((a, b) => a - b);
    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const p95Duration = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99Duration = durations[Math.floor(durations.length * 0.99)] || 0;

    return {
      queriesExecuted: this.statistics.totalQueries,
      cacheHitRate: hitRate,
      avgQueryDuration: avgDuration,
      p95QueryDuration: p95Duration,
      p99QueryDuration: p99Duration,
      totalCacheSize: this.getTotalCacheSize(),
      activeConnections: Array.from(this.connectionPool.values()).filter((c) => c.active).length,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuThrottled: this.isThrottled,
      slowQueries: this.slowQueries.slice(-100),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    if (this.cpuMonitor) {
      clearInterval(this.cpuMonitor);
    }

    // Close connections
    for (const connection of this.connectionPool.values()) {
      if (connection.active) {
        this.releaseConnection(connection.id);
      }
    }

    this.isInitialized = false;
    this.emit('shutdown');
  }
}

export default QueryOptimizer;
