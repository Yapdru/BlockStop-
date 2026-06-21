/**
 * Performance Tracker
 * Tracks page load times, API latency, and core web vitals
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  page?: string;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface PageLoadMetrics {
  url: string;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  dcl: number; // DOM Content Loaded
  load: number; // Full page load
  timestamp: Date;
}

export interface APILatencyMetrics {
  endpoint: string;
  method: string;
  latency: number; // ms
  statusCode: number;
  responseSize: number; // bytes
  timestamp: Date;
}

export interface PerformanceThresholds {
  fcp: { good: number; warning: number };
  lcp: { good: number; warning: number };
  cls: { good: number; warning: number };
  ttfb: { good: number; warning: number };
  apiLatency: { good: number; warning: number };
}

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private pageMetrics: PageLoadMetrics[] = [];
  private apiMetrics: APILatencyMetrics[] = [];
  private maxMetricsSize: number = 5000;
  private thresholds: PerformanceThresholds = {
    fcp: { good: 1800, warning: 3000 },
    lcp: { good: 2500, warning: 4000 },
    cls: { good: 0.1, warning: 0.25 },
    ttfb: { good: 600, warning: 1800 },
    apiLatency: { good: 200, warning: 500 },
  };

  constructor() {
    this.initializePerformanceObservers();
  }

  /**
   * Initialize performance observers for browser metrics
   */
  private initializePerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Observe paint timings (FCP, FP)
      if ('PerformanceObserver' in window) {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: entry.name,
              value: Math.round(entry.startTime),
              unit: 'ms',
              timestamp: new Date(),
              page: window.location.pathname,
            });
          });
        });

        try {
          paintObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
          // paint not supported
        }

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric({
            name: 'LCP',
            value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
            unit: 'ms',
            timestamp: new Date(),
            page: window.location.pathname,
          });
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }

        // Observe cumulative layout shift
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              this.recordMetric({
                name: 'CLS',
                value: entry.value,
                unit: 'score',
                timestamp: new Date(),
                page: window.location.pathname,
              });
            }
          });
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // Layout shift not supported
        }
      }

      // Record navigation timings
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

        this.recordPageLoadMetrics({
          url: window.location.href,
          fcp: perfData.domContentLoadedEventStart - perfData.navigationStart,
          lcp: pageLoadTime,
          cls: 0,
          ttfb: perfData.responseStart - perfData.navigationStart,
          dcl: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          load: pageLoadTime,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      console.error('Error initializing performance observers:', error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep metrics manageable
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }

    // Check thresholds
    this.checkMetricThresholds(metric);
  }

  /**
   * Record page load metrics
   */
  recordPageLoadMetrics(metrics: PageLoadMetrics): void {
    this.pageMetrics.push(metrics);

    if (this.pageMetrics.length > 1000) {
      this.pageMetrics.shift();
    }

    console.log('Page load metrics recorded', {
      url: metrics.url,
      fcp: metrics.fcp,
      lcp: metrics.lcp,
      load: metrics.load,
    });
  }

  /**
   * Record API latency
   */
  recordAPILatency(
    endpoint: string,
    method: string,
    latency: number,
    statusCode: number,
    responseSize: number = 0,
  ): void {
    const metric: APILatencyMetrics = {
      endpoint,
      method,
      latency,
      statusCode,
      responseSize,
      timestamp: new Date(),
    };

    this.apiMetrics.push(metric);

    if (this.apiMetrics.length > 1000) {
      this.apiMetrics.shift();
    }

    // Check threshold
    if (latency > this.thresholds.apiLatency.warning) {
      console.warn(`Slow API: ${method} ${endpoint} (${latency}ms)`);
    }
  }

  /**
   * Check metric against thresholds
   */
  private checkMetricThresholds(metric: PerformanceMetric): void {
    const thresholds = this.thresholds as any;
    const threshold = thresholds[metric.name.toLowerCase()];

    if (!threshold) return;

    if (metric.value > threshold.warning) {
      console.warn(
        `Performance threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`,
      );
    }
  }

  /**
   * Get page metrics for a URL
   */
  getPageMetrics(url: string): PageLoadMetrics[] {
    return this.pageMetrics.filter((m) => m.url === url);
  }

  /**
   * Get average page load time
   */
  getAveragePageLoadTime(minutes: number = 60): number {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const recentMetrics = this.pageMetrics.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    if (recentMetrics.length === 0) return 0;

    const totalTime = recentMetrics.reduce((sum, m) => sum + m.load, 0);
    return Math.round(totalTime / recentMetrics.length);
  }

  /**
   * Get API latency statistics
   */
  getAPILatencyStats(minutes: number = 60) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const recentMetrics = this.apiMetrics.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    if (recentMetrics.length === 0) {
      return {
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0,
        errorCount: 0,
      };
    }

    const latencies = recentMetrics.map((m) => m.latency).sort((a, b) => a - b);
    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length;

    return {
      avgLatency: Math.round(
        latencies.reduce((a, b) => a + b) / latencies.length,
      ),
      p50: latencies[Math.floor(latencies.length * 0.5)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)],
      count: recentMetrics.length,
      errorCount,
    };
  }

  /**
   * Get endpoint statistics
   */
  getEndpointStats(endpoint: string, minutes: number = 60) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const endpointMetrics = this.apiMetrics.filter(
      (m) => m.endpoint === endpoint && m.timestamp >= cutoffTime,
    );

    if (endpointMetrics.length === 0) {
      return null;
    }

    const latencies = endpointMetrics.map((m) => m.latency);
    const avgLatency = Math.round(
      latencies.reduce((a, b) => a + b) / latencies.length,
    );
    const maxLatency = Math.max(...latencies);
    const errorCount = endpointMetrics.filter((m) => m.statusCode >= 400)
      .length;
    const avgResponseSize = Math.round(
      endpointMetrics.reduce((sum, m) => sum + m.responseSize, 0) /
        endpointMetrics.length,
    );

    return {
      endpoint,
      requestCount: endpointMetrics.length,
      avgLatency,
      maxLatency,
      errorCount,
      avgResponseSize,
      errorRate: Math.round((errorCount / endpointMetrics.length) * 100),
    };
  }

  /**
   * Get core web vitals summary
   */
  getCoreWebVitalsSummary(minutes: number = 60): any {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const recentPageMetrics = this.pageMetrics.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    if (recentPageMetrics.length === 0) {
      return {
        fcp: 0,
        lcp: 0,
        cls: 0,
        ttfb: 0,
        pageLoadCount: 0,
      };
    }

    return {
      fcp: Math.round(
        recentPageMetrics.reduce((sum, m) => sum + m.fcp, 0) /
          recentPageMetrics.length,
      ),
      lcp: Math.round(
        recentPageMetrics.reduce((sum, m) => sum + m.lcp, 0) /
          recentPageMetrics.length,
      ),
      cls: Math.round(
        (recentPageMetrics.reduce((sum, m) => sum + m.cls, 0) /
          recentPageMetrics.length) *
          1000,
      ) / 1000,
      ttfb: Math.round(
        recentPageMetrics.reduce((sum, m) => sum + m.ttfb, 0) /
          recentPageMetrics.length,
      ),
      pageLoadCount: recentPageMetrics.length,
    };
  }

  /**
   * Export metrics
   */
  exportMetrics() {
    return {
      timestamp: new Date(),
      pageLoadMetrics: this.pageMetrics.slice(-100),
      apiMetrics: this.apiMetrics.slice(-100),
      summary: {
        avgPageLoadTime: this.getAveragePageLoadTime(),
        apiLatencyStats: this.getAPILatencyStats(),
        coreWebVitals: this.getCoreWebVitalsSummary(),
      },
    };
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.pageMetrics = [];
    this.apiMetrics = [];
  }
}

// Export singleton
export const performanceTracker = new PerformanceTracker();
