/**
 * Web Vitals Tracking
 * Monitors Core Web Vitals and custom performance metrics
 */

export interface WebVital {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface VitalsThresholds {
  lcp: { good: number; poor: number };
  fcp: { good: number; poor: number };
  cls: { good: number; poor: number };
  fid: { good: number; poor: number };
  ttfb: { good: number; poor: number };
}

/**
 * Core Web Vitals thresholds (as per Google standards)
 */
export const VITALS_THRESHOLDS: VitalsThresholds = {
  lcp: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  fcp: { good: 1800, poor: 3000 }, // First Contentful Paint
  cls: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  fid: { good: 100, poor: 300 }, // First Input Delay
  ttfb: { good: 600, poor: 1800 }, // Time to First Byte
};

/**
 * Get rating for a metric value
 */
const getRating = (value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Measure Largest Contentful Paint (LCP)
 * Target: < 2.5s
 */
export const measureLCP = (callback: (metric: WebVital) => void): (() => void) => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      const metric: WebVital = {
        name: 'LCP',
        value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
        delta: 0,
        id: `lcp-${lastEntry.startTime}`,
        rating: getRating(lastEntry.renderTime || lastEntry.loadTime, VITALS_THRESHOLDS.lcp),
      };

      callback(metric);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => observer.disconnect();
  } catch (error) {
    console.warn('LCP measurement failed:', error);
    return () => {};
  }
};

/**
 * Measure First Contentful Paint (FCP)
 * Target: < 1.5s
 */
export const measureFCP = (callback: (metric: WebVital) => void): (() => void) => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries[0];

      const metric: WebVital = {
        name: 'FCP',
        value: Math.round(fcpEntry.startTime),
        delta: 0,
        id: `fcp-${fcpEntry.startTime}`,
        rating: getRating(fcpEntry.startTime, VITALS_THRESHOLDS.fcp),
      };

      callback(metric);
    });

    observer.observe({ entryTypes: ['paint'] });

    return () => observer.disconnect();
  } catch (error) {
    console.warn('FCP measurement failed:', error);
    return () => {};
  }
};

/**
 * Measure Cumulative Layout Shift (CLS)
 * Target: < 0.1
 */
export const measureCLS = (callback: (metric: WebVital) => void): (() => void) => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  try {
    let clsValue = 0;
    let observer: PerformanceObserver;

    observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;

          const metric: WebVital = {
            name: 'CLS',
            value: parseFloat(clsValue.toFixed(4)),
            delta: parseFloat(entry.value.toFixed(4)),
            id: `cls-${entry.startTime}`,
            rating: getRating(clsValue, VITALS_THRESHOLDS.cls),
          };

          callback(metric);
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    return () => observer.disconnect();
  } catch (error) {
    console.warn('CLS measurement failed:', error);
    return () => {};
  }
};

/**
 * Measure First Input Delay (FID)
 * Target: < 100ms
 */
export const measureFID = (callback: (metric: WebVital) => void): (() => void) => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];

      const metric: WebVital = {
        name: 'FID',
        value: Math.round(firstInput.processingDuration),
        delta: 0,
        id: `fid-${firstInput.startTime}`,
        rating: getRating(firstInput.processingDuration, VITALS_THRESHOLDS.fid),
      };

      callback(metric);
    });

    observer.observe({ entryTypes: ['first-input'] });

    return () => observer.disconnect();
  } catch (error) {
    console.warn('FID measurement failed:', error);
    return () => {};
  }
};

/**
 * Measure Time to First Byte (TTFB)
 * Target: < 600ms
 */
export const measureTTFB = (callback: (metric: WebVital) => void): (() => void) => {
  if (typeof window === 'undefined' || !performance.timing) {
    return () => {};
  }

  try {
    const timing = performance.timing;
    const ttfb = timing.responseStart - timing.navigationStart;

    const metric: WebVital = {
      name: 'TTFB',
      value: ttfb,
      delta: 0,
      id: `ttfb-${timing.navigationStart}`,
      rating: getRating(ttfb, VITALS_THRESHOLDS.ttfb),
    };

    callback(metric);
    return () => {};
  } catch (error) {
    console.warn('TTFB measurement failed:', error);
    return () => {};
  }
};

/**
 * Measure custom metric
 */
export const measureCustomMetric = (
  name: string,
  value: number,
  callback: (metric: WebVital) => void
): void => {
  const metric: WebVital = {
    name,
    value,
    delta: 0,
    id: `${name.toLowerCase()}-${Date.now()}`,
    rating: 'good',
  };

  callback(metric);
};

/**
 * Initialize all Web Vitals measurements
 */
export const initWebVitals = (
  callback: (metric: WebVital) => void
): { cleanup: () => void; unsubscribe: () => void } => {
  const cleanups: Array<() => void> = [];

  cleanups.push(measureFCP(callback));
  cleanups.push(measureLCP(callback));
  cleanups.push(measureCLS(callback));
  cleanups.push(measureFID(callback));
  measureTTFB(callback);

  return {
    cleanup: () => cleanups.forEach((cleanup) => cleanup()),
    unsubscribe: () => cleanups.forEach((cleanup) => cleanup()),
  };
};

/**
 * Report metrics to analytics endpoint
 */
export const reportMetrics = (
  metrics: WebVital[],
  endpoint: string
): Promise<Response> | null => {
  if (typeof navigator === 'undefined') {
    return null;
  }

  const data = {
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    metrics: metrics.map((m) => ({
      name: m.name,
      value: m.value,
      rating: m.rating,
    })),
  };

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(data));
    return null;
  }

  // Fallback to fetch
  return fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch((error) => {
    console.warn('Failed to report metrics:', error);
  });
};

/**
 * Check if all vitals are in good range
 */
export const checkVitalsHealth = (metrics: WebVital[]): {
  healthy: boolean;
  score: number;
  issues: string[];
} => {
  const issues: string[] = [];
  let score = 100;

  metrics.forEach((metric) => {
    if (metric.rating === 'poor') {
      issues.push(`${metric.name} is poor (${metric.value}ms)`);
      score -= 25;
    } else if (metric.rating === 'needs-improvement') {
      issues.push(`${metric.name} needs improvement (${metric.value}ms)`);
      score -= 10;
    }
  });

  return {
    healthy: issues.length === 0,
    score: Math.max(0, score),
    issues,
  };
};

/**
 * Performance metric collector class
 */
export class PerformanceMetricsCollector {
  private metrics: WebVital[] = [];
  private watchers: Array<() => void> = [];

  /**
   * Start collecting metrics
   */
  start(): void {
    const { cleanup } = initWebVitals((metric) => {
      this.metrics.push(metric);
    });

    this.watchers.push(cleanup);
  }

  /**
   * Stop collecting metrics
   */
  stop(): void {
    this.watchers.forEach((watcher) => watcher());
    this.watchers = [];
  }

  /**
   * Get collected metrics
   */
  getMetrics(): WebVital[] {
    return [...this.metrics];
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): WebVital | undefined {
    return this.metrics.find((m) => m.name === name);
  }

  /**
   * Get health status
   */
  getHealth(): { healthy: boolean; score: number; issues: string[] } {
    return checkVitalsHealth(this.metrics);
  }

  /**
   * Report metrics
   */
  report(endpoint: string): Promise<Response> | null {
    return reportMetrics(this.metrics, endpoint);
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}
