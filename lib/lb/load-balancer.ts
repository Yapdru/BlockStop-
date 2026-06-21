/**
 * Load Balancer
 * Distributes traffic across multiple backend servers
 * Algorithms: Round-robin, Least-connection, IP-hash
 */

export enum LoadBalancingAlgorithm {
  ROUND_ROBIN = 'round-robin',
  LEAST_CONNECTION = 'least-connection',
  IP_HASH = 'ip-hash',
  RANDOM = 'random',
  WEIGHTED_ROUND_ROBIN = 'weighted-round-robin',
}

export interface BackendServer {
  id: string;
  host: string;
  port: number;
  weight?: number;
  healthy: boolean;
  connections: number;
  requestsServed: number;
  bytesServed: number;
  lastHealthCheck: Date;
  responseTime: number;
  errorCount: number;
}

export interface LoadBalancerConfig {
  algorithm: LoadBalancingAlgorithm;
  healthCheckInterval: number; // ms
  healthCheckTimeout: number; // ms
  healthCheckPath?: string;
  maxFailures: number;
  failureResetInterval: number; // ms
  enableStickySessions?: boolean;
  stickyCookieName?: string;
}

export interface LoadBalancerStats {
  totalRequests: number;
  totalConnections: number;
  totalErrors: number;
  avgResponseTime: number;
  successRate: number;
  backends: Map<string, BackendServer>;
}

export class LoadBalancer {
  private backends: Map<string, BackendServer> = new Map();
  private config: LoadBalancerConfig;
  private currentIndex: number = 0;
  private sessionMap: Map<string, string> = new Map(); // session -> backend_id
  private healthCheckIntervalId?: NodeJS.Timeout;
  private failureCounters: Map<string, number> = new Map();

  constructor(config?: Partial<LoadBalancerConfig>) {
    this.config = {
      algorithm: LoadBalancingAlgorithm.ROUND_ROBIN,
      healthCheckInterval: 30000,
      healthCheckTimeout: 5000,
      healthCheckPath: '/health',
      maxFailures: 5,
      failureResetInterval: 300000,
      enableStickySessions: true,
      stickyCookieName: 'lb-session-id',
      ...config,
    };
  }

  /**
   * Add a backend server
   */
  addBackend(
    id: string,
    host: string,
    port: number,
    weight: number = 1,
  ): void {
    this.backends.set(id, {
      id,
      host,
      port,
      weight,
      healthy: true,
      connections: 0,
      requestsServed: 0,
      bytesServed: 0,
      lastHealthCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
    });

    this.failureCounters.set(id, 0);
  }

  /**
   * Remove a backend server
   */
  removeBackend(id: string): void {
    this.backends.delete(id);
    this.failureCounters.delete(id);
  }

  /**
   * Get next backend based on algorithm
   */
  selectBackend(clientIp?: string, sessionId?: string): BackendServer | null {
    const healthyBackends = Array.from(this.backends.values()).filter(
      (b) => b.healthy,
    );

    if (healthyBackends.length === 0) {
      console.error('No healthy backends available');
      return null;
    }

    // Check sticky sessions
    if (
      this.config.enableStickySessions &&
      sessionId &&
      this.sessionMap.has(sessionId)
    ) {
      const backendId = this.sessionMap.get(sessionId);
      const backend = this.backends.get(backendId!);
      if (backend && backend.healthy) {
        return backend;
      }
    }

    let selected: BackendServer | null = null;

    switch (this.config.algorithm) {
      case LoadBalancingAlgorithm.ROUND_ROBIN:
        selected = this.selectRoundRobin(healthyBackends);
        break;

      case LoadBalancingAlgorithm.LEAST_CONNECTION:
        selected = this.selectLeastConnection(healthyBackends);
        break;

      case LoadBalancingAlgorithm.IP_HASH:
        if (clientIp) {
          selected = this.selectIpHash(clientIp, healthyBackends);
        } else {
          selected = this.selectRoundRobin(healthyBackends);
        }
        break;

      case LoadBalancingAlgorithm.RANDOM:
        selected = this.selectRandom(healthyBackends);
        break;

      case LoadBalancingAlgorithm.WEIGHTED_ROUND_ROBIN:
        selected = this.selectWeightedRoundRobin(healthyBackends);
        break;

      default:
        selected = this.selectRoundRobin(healthyBackends);
    }

    // Store session mapping
    if (selected && this.config.enableStickySessions && sessionId) {
      this.sessionMap.set(sessionId, selected.id);
    }

    return selected;
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(backends: BackendServer[]): BackendServer {
    const backend = backends[this.currentIndex % backends.length];
    this.currentIndex++;
    return backend;
  }

  /**
   * Least-connection selection
   */
  private selectLeastConnection(backends: BackendServer[]): BackendServer {
    return backends.reduce((min, current) =>
      current.connections < min.connections ? current : min,
    );
  }

  /**
   * IP-hash selection
   */
  private selectIpHash(ip: string, backends: BackendServer[]): BackendServer {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = (hash << 5) - hash + ip.charCodeAt(i);
      hash = hash & hash;
    }
    return backends[Math.abs(hash) % backends.length];
  }

  /**
   * Random selection
   */
  private selectRandom(backends: BackendServer[]): BackendServer {
    return backends[Math.floor(Math.random() * backends.length)];
  }

  /**
   * Weighted round-robin selection
   */
  private selectWeightedRoundRobin(backends: BackendServer[]): BackendServer {
    let totalWeight = backends.reduce((sum, b) => sum + (b.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const backend of backends) {
      random -= backend.weight || 1;
      if (random <= 0) {
        return backend;
      }
    }

    return backends[0];
  }

  /**
   * Record request to backend
   */
  recordRequest(
    backendId: string,
    responseTime: number,
    bytesSent: number,
    success: boolean,
  ): void {
    const backend = this.backends.get(backendId);
    if (!backend) return;

    backend.requestsServed++;
    backend.bytesServed += bytesSent;
    backend.responseTime = Math.round(
      (backend.responseTime + responseTime) / 2,
    ); // Rolling average

    if (!success) {
      backend.errorCount++;
      this.recordFailure(backendId);
    } else {
      // Reset failure counter on success
      this.failureCounters.set(backendId, 0);
    }
  }

  /**
   * Record a connection
   */
  recordConnection(backendId: string): void {
    const backend = this.backends.get(backendId);
    if (backend) {
      backend.connections++;
    }
  }

  /**
   * Release a connection
   */
  releaseConnection(backendId: string): void {
    const backend = this.backends.get(backendId);
    if (backend && backend.connections > 0) {
      backend.connections--;
    }
  }

  /**
   * Record a failure
   */
  private recordFailure(backendId: string): void {
    const count = (this.failureCounters.get(backendId) || 0) + 1;
    this.failureCounters.set(backendId, count);

    if (count >= this.config.maxFailures) {
      const backend = this.backends.get(backendId);
      if (backend) {
        backend.healthy = false;
        console.error(`Backend ${backendId} marked as unhealthy`);
      }
    }
  }

  /**
   * Perform health checks on all backends
   */
  async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.backends.values()).map((backend) =>
      this.healthCheckBackend(backend),
    );

    await Promise.all(promises);
  }

  /**
   * Health check a single backend
   */
  private async healthCheckBackend(backend: BackendServer): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.healthCheckTimeout,
      );

      const url = `http://${backend.host}:${backend.port}${this.config.healthCheckPath}`;
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      const isHealthy = response.status === 200;

      if (isHealthy) {
        backend.healthy = true;
        this.failureCounters.set(backend.id, 0);
      } else {
        this.recordFailure(backend.id);
      }

      backend.lastHealthCheck = new Date();
    } catch (error) {
      console.error(`Health check failed for ${backend.id}:`, error);
      this.recordFailure(backend.id);
      backend.lastHealthCheck = new Date();
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }

    this.healthCheckIntervalId = setInterval(() => {
      this.performHealthChecks().catch((err) =>
        console.error('Health check error:', err),
      );
    }, this.config.healthCheckInterval);

    // Perform initial health check
    this.performHealthChecks().catch((err) =>
      console.error('Initial health check error:', err),
    );
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = undefined;
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    let totalRequests = 0;
    let totalConnections = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let backendCount = 0;

    this.backends.forEach((backend) => {
      totalRequests += backend.requestsServed;
      totalConnections += backend.connections;
      totalErrors += backend.errorCount;
      totalResponseTime += backend.responseTime;
      backendCount++;
    });

    const successRate =
      totalRequests > 0
        ? ((totalRequests - totalErrors) / totalRequests) * 100
        : 0;
    const avgResponseTime =
      backendCount > 0 ? totalResponseTime / backendCount : 0;

    return {
      totalRequests,
      totalConnections,
      totalErrors,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      backends: this.backends,
    };
  }

  /**
   * Get backend information
   */
  getBackend(id: string): BackendServer | undefined {
    return this.backends.get(id);
  }

  /**
   * Get all backends
   */
  getAllBackends(): BackendServer[] {
    return Array.from(this.backends.values());
  }

  /**
   * Get configuration
   */
  getConfig(): LoadBalancerConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton
export const loadBalancer = new LoadBalancer();
