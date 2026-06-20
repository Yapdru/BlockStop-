import { EventEmitter } from 'events';

export interface ScalingMetrics {
  cpu: number;
  memory: number;
  requestLatency: number;
  requestsPerSecond: number;
}

export class MetricsCollector extends EventEmitter {
  private metricsHistory: Array<{ timestamp: Date; metrics: ScalingMetrics }> = [];
  private isCollecting: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HISTORY = 2000;

  constructor() {
    super();
  }

  async collectMetrics(): Promise<ScalingMetrics> {
    try {
      const metrics = this.gatherSystemMetrics();

      this.metricsHistory.push({
        timestamp: new Date(),
        metrics,
      });

      // Keep history within limits
      if (this.metricsHistory.length > this.MAX_HISTORY) {
        this.metricsHistory.shift();
      }

      this.emit('metrics-collected', { timestamp: new Date(), metrics });

      return metrics;
    } catch (error) {
      this.emit('error', { type: 'collection-failed', error });
      throw new Error(`Failed to collect metrics: ${error}`);
    }
  }

  async startCollecting(interval: number = 60000): Promise<void> {
    try {
      if (this.isCollecting) {
        throw new Error('Metrics collection already running');
      }

      this.isCollecting = true;

      // Collect immediately
      await this.collectMetrics();

      // Schedule periodic collection
      this.collectionInterval = setInterval(async () => {
        try {
          await this.collectMetrics();
        } catch (error) {
          this.emit('error', { type: 'periodic-collection-failed', error });
        }
      }, interval);

      this.emit('collection-started', { interval });
    } catch (error) {
      this.emit('error', { type: 'start-collection-failed', error });
      throw error;
    }
  }

  async stopCollecting(): Promise<void> {
    try {
      if (this.collectionInterval) {
        clearInterval(this.collectionInterval);
        this.collectionInterval = null;
      }

      this.isCollecting = false;
      this.emit('collection-stopped');
    } catch (error) {
      this.emit('error', { type: 'stop-collection-failed', error });
      throw error;
    }
  }

  async getMetricsHistory(minutes: number): Promise<ScalingMetrics[]> {
    try {
      if (minutes < 1) {
        throw new Error('Minutes must be at least 1');
      }

      const cutoffTime = Date.now() - minutes * 60 * 1000;

      return this.metricsHistory
        .filter((entry) => entry.timestamp.getTime() >= cutoffTime)
        .map((entry) => entry.metrics);
    } catch (error) {
      this.emit('error', { type: 'history-retrieval-failed', error });
      throw error;
    }
  }

  async getAverageMetrics(minutes: number): Promise<ScalingMetrics> {
    try {
      const metrics = await this.getMetricsHistory(minutes);

      if (metrics.length === 0) {
        return {
          cpu: 0,
          memory: 0,
          requestLatency: 0,
          requestsPerSecond: 0,
        };
      }

      let totalCpu = 0;
      let totalMemory = 0;
      let totalLatency = 0;
      let totalRps = 0;

      for (const metric of metrics) {
        totalCpu += metric.cpu;
        totalMemory += metric.memory;
        totalLatency += metric.requestLatency;
        totalRps += metric.requestsPerSecond;
      }

      return {
        cpu: totalCpu / metrics.length,
        memory: totalMemory / metrics.length,
        requestLatency: totalLatency / metrics.length,
        requestsPerSecond: totalRps / metrics.length,
      };
    } catch (error) {
      this.emit('error', { type: 'average-calculation-failed', error });
      throw error;
    }
  }

  async getMaxMetrics(minutes: number): Promise<ScalingMetrics> {
    try {
      const metrics = await this.getMetricsHistory(minutes);

      if (metrics.length === 0) {
        return {
          cpu: 0,
          memory: 0,
          requestLatency: 0,
          requestsPerSecond: 0,
        };
      }

      return {
        cpu: Math.max(...metrics.map((m) => m.cpu)),
        memory: Math.max(...metrics.map((m) => m.memory)),
        requestLatency: Math.max(...metrics.map((m) => m.requestLatency)),
        requestsPerSecond: Math.max(...metrics.map((m) => m.requestsPerSecond)),
      };
    } catch (error) {
      this.emit('error', { type: 'max-calculation-failed', error });
      throw error;
    }
  }

  async getMinMetrics(minutes: number): Promise<ScalingMetrics> {
    try {
      const metrics = await this.getMetricsHistory(minutes);

      if (metrics.length === 0) {
        return {
          cpu: 0,
          memory: 0,
          requestLatency: 0,
          requestsPerSecond: 0,
        };
      }

      return {
        cpu: Math.min(...metrics.map((m) => m.cpu)),
        memory: Math.min(...metrics.map((m) => m.memory)),
        requestLatency: Math.min(...metrics.map((m) => m.requestLatency)),
        requestsPerSecond: Math.min(...metrics.map((m) => m.requestsPerSecond)),
      };
    } catch (error) {
      this.emit('error', { type: 'min-calculation-failed', error });
      throw error;
    }
  }

  isCollectionActive(): boolean {
    return this.isCollecting;
  }

  getHistorySize(): number {
    return this.metricsHistory.length;
  }

  clearHistory(): void {
    this.metricsHistory = [];
    this.emit('history-cleared');
  }

  private gatherSystemMetrics(): ScalingMetrics {
    // Simulated metrics gathering
    // In production, this would gather actual system metrics using os module or external tools

    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requestLatency: Math.floor(Math.random() * 500),
      requestsPerSecond: Math.floor(Math.random() * 10000),
    };
  }

  async getMetricsSnapshot(): Promise<ScalingMetrics> {
    if (this.metricsHistory.length === 0) {
      return {
        cpu: 0,
        memory: 0,
        requestLatency: 0,
        requestsPerSecond: 0,
      };
    }

    return this.metricsHistory[this.metricsHistory.length - 1].metrics;
  }

  getDetailedHistory(
    minutes: number
  ): Array<{ timestamp: Date; metrics: ScalingMetrics }> {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    return this.metricsHistory.filter((entry) => entry.timestamp.getTime() >= cutoffTime);
  }
}
