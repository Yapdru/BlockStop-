/**
 * Metrics Collector
 * Collects and aggregates performance metrics across the system
 */

export interface SystemMetrics {
  timestamp: Date;
  cpu: number; // percentage
  memory: number; // percentage
  diskUsage: number; // percentage
  networkLatency: number; // ms
  requestsPerSecond: number;
  errorRate: number; // percentage
  cacheHitRate: number; // percentage
  dbConnectionPoolUsage: number; // percentage
  uptime: number; // seconds
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number; // ms
  errorRate: number; // percentage
  lastCheck: Date;
  uptime: number; // percentage
}

export interface MetricsAggregation {
  period: string; // "1m", "5m", "1h"
  startTime: Date;
  endTime: Date;
  metrics: SystemMetrics[];
  averages: Partial<SystemMetrics>;
  peaks: Partial<SystemMetrics>;
}

export class MetricsCollector {
  private systemMetrics: SystemMetrics[] = [];
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private maxMetricsSize: number = 10000;
  private collectionInterval: NodeJS.Timeout | undefined;
  private startTime: Date = new Date();

  constructor() {
    this.initializeDefaultServices();
  }

  /**
   * Initialize default services
   */
  private initializeDefaultServices(): void {
    const defaultServices = [
      'api-server',
      'database',
      'cache-layer',
      'cdn',
      'authentication',
    ];

    defaultServices.forEach((service) => {
      this.serviceHealth.set(service, {
        serviceName: service,
        status: 'healthy',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date(),
        uptime: 100,
      });
    });
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics(): void {
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: this.getSystemCPUUsage(),
      memory: this.getSystemMemoryUsage(),
      diskUsage: this.getSystemDiskUsage(),
      networkLatency: this.getNetworkLatency(),
      requestsPerSecond: this.getRequestsPerSecond(),
      errorRate: this.getErrorRate(),
      cacheHitRate: this.getCacheHitRate(),
      dbConnectionPoolUsage: this.getDBConnectionPoolUsage(),
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
    };

    this.systemMetrics.push(metrics);

    // Keep metrics manageable
    if (this.systemMetrics.length > this.maxMetricsSize) {
      this.systemMetrics.shift();
    }

    // Check for alerts
    this.checkMetricAlerts(metrics);
  }

  /**
   * Get CPU usage (simulated)
   */
  private getSystemCPUUsage(): number {
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      const totalTime = usage.user + usage.system;
      return Math.min(100, (totalTime / 1000000000) * 100);
    }
    return Math.random() * 50; // Simulated 0-50%
  }

  /**
   * Get memory usage
   */
  private getSystemMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const totalMem = 1073741824; // 1GB default
      return (usage.heapUsed / totalMem) * 100;
    }
    return Math.random() * 50; // Simulated 0-50%
  }

  /**
   * Get disk usage (simulated)
   */
  private getSystemDiskUsage(): number {
    return Math.random() * 60; // Simulated 0-60%
  }

  /**
   * Get network latency (simulated)
   */
  private getNetworkLatency(): number {
    return Math.round(Math.random() * 100 + 20); // 20-120ms
  }

  /**
   * Get requests per second (simulated)
   */
  private getRequestsPerSecond(): number {
    return Math.round(Math.random() * 1000);
  }

  /**
   * Get error rate (simulated)
   */
  private getErrorRate(): number {
    return Math.round((Math.random() * 5 + Number.EPSILON) * 100) / 100; // 0-5%
  }

  /**
   * Get cache hit rate
   */
  private getCacheHitRate(): number {
    return Math.round((Math.random() * 30 + 70 + Number.EPSILON) * 100) / 100; // 70-100%
  }

  /**
   * Get database connection pool usage
   */
  private getDBConnectionPoolUsage(): number {
    return Math.round((Math.random() * 40 + 20 + Number.EPSILON) * 100) / 100; // 20-60%
  }

  /**
   * Check metric alerts
   */
  private checkMetricAlerts(metrics: SystemMetrics): void {
    const alerts: string[] = [];

    if (metrics.cpu > 80) {
      alerts.push(`High CPU usage: ${metrics.cpu.toFixed(2)}%`);
    }

    if (metrics.memory > 85) {
      alerts.push(`High memory usage: ${metrics.memory.toFixed(2)}%`);
    }

    if (metrics.diskUsage > 90) {
      alerts.push(`High disk usage: ${metrics.diskUsage.toFixed(2)}%`);
    }

    if (metrics.errorRate > 5) {
      alerts.push(`High error rate: ${metrics.errorRate.toFixed(2)}%`);
    }

    if (metrics.networkLatency > 200) {
      alerts.push(
        `High network latency: ${metrics.networkLatency.toFixed(2)}ms`,
      );
    }

    alerts.forEach((alert) => console.warn(`ALERT: ${alert}`));
  }

  /**
   * Start automatic metrics collection
   */
  startCollection(intervalMs: number = 60000): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);

    // Collect immediately
    this.collectSystemMetrics();
  }

  /**
   * Stop automatic metrics collection
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
  }

  /**
   * Update service health
   */
  updateServiceHealth(
    serviceName: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    latency: number = 0,
    errorRate: number = 0,
    uptime: number = 100,
  ): void {
    this.serviceHealth.set(serviceName, {
      serviceName,
      status,
      latency,
      errorRate,
      lastCheck: new Date(),
      uptime,
    });
  }

  /**
   * Get service health
   */
  getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.serviceHealth.get(serviceName);
  }

  /**
   * Get all service health
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get overall system health
   */
  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const services = this.getAllServiceHealth();

    const unhealthyCount = services.filter((s) => s.status === 'unhealthy')
      .length;
    const degradedCount = services.filter((s) => s.status === 'degraded').length;

    if (unhealthyCount > services.length / 2) {
      return 'unhealthy';
    }

    if (degradedCount > 0 || unhealthyCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get metrics for a time period
   */
  getMetricsForPeriod(
    minutes: number = 60,
  ): MetricsAggregation {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const periodMetrics = this.systemMetrics.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    if (periodMetrics.length === 0) {
      return {
        period: `${minutes}m`,
        startTime: cutoffTime,
        endTime: new Date(),
        metrics: [],
        averages: {},
        peaks: {},
      };
    }

    const averages: Partial<SystemMetrics> = {
      cpu: Math.round(
        periodMetrics.reduce((sum, m) => sum + m.cpu, 0) /
          periodMetrics.length,
      ),
      memory: Math.round(
        periodMetrics.reduce((sum, m) => sum + m.memory, 0) /
          periodMetrics.length,
      ),
      diskUsage: Math.round(
        periodMetrics.reduce((sum, m) => sum + m.diskUsage, 0) /
          periodMetrics.length,
      ),
      networkLatency: Math.round(
        periodMetrics.reduce((sum, m) => sum + m.networkLatency, 0) /
          periodMetrics.length,
      ),
      requestsPerSecond: Math.round(
        periodMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0) /
          periodMetrics.length,
      ),
      errorRate: Math.round(
        (periodMetrics.reduce((sum, m) => sum + m.errorRate, 0) /
          periodMetrics.length) *
          100,
      ) / 100,
      cacheHitRate: Math.round(
        (periodMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) /
          periodMetrics.length) *
          100,
      ) / 100,
      dbConnectionPoolUsage: Math.round(
        (periodMetrics.reduce((sum, m) => sum + m.dbConnectionPoolUsage, 0) /
          periodMetrics.length) *
          100,
      ) / 100,
    };

    const peaks: Partial<SystemMetrics> = {
      cpu: Math.max(...periodMetrics.map((m) => m.cpu)),
      memory: Math.max(...periodMetrics.map((m) => m.memory)),
      diskUsage: Math.max(...periodMetrics.map((m) => m.diskUsage)),
      networkLatency: Math.max(
        ...periodMetrics.map((m) => m.networkLatency),
      ),
      requestsPerSecond: Math.max(
        ...periodMetrics.map((m) => m.requestsPerSecond),
      ),
      errorRate: Math.max(...periodMetrics.map((m) => m.errorRate)),
      cacheHitRate: Math.max(...periodMetrics.map((m) => m.cacheHitRate)),
      dbConnectionPoolUsage: Math.max(
        ...periodMetrics.map((m) => m.dbConnectionPoolUsage),
      ),
    };

    return {
      period: `${minutes}m`,
      startTime: cutoffTime,
      endTime: new Date(),
      metrics: periodMetrics,
      averages,
      peaks,
    };
  }

  /**
   * Export metrics
   */
  exportMetrics() {
    return {
      timestamp: new Date(),
      systemMetrics: this.systemMetrics.slice(-100),
      serviceHealth: this.getAllServiceHealth(),
      overallHealth: this.getOverallHealth(),
      metrics1h: this.getMetricsForPeriod(60),
      metrics5m: this.getMetricsForPeriod(5),
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.systemMetrics = [];
  }

  /**
   * Get uptime
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
}

// Export singleton
export const metricsCollector = new MetricsCollector();
