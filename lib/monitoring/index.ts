/**
 * Monitoring System Initialization
 * Central hub for all monitoring and performance tracking
 */

import { performanceTracker } from './performance-tracker';
import { metricsCollector } from './metrics-collector';
import { alertsSystem } from './alerts';
import { queryOptimizer } from '../db/query-optimizer';
import { shardManager } from '../db/shard-manager';
import { loadBalancer } from '../lb/load-balancer';
import { regionConfigManager } from '../deployment/region-config';

/**
 * Initialize the monitoring system
 */
export function initializeMonitoring() {
  console.log('[Monitoring] Initializing monitoring system...');

  // Start automatic metrics collection (every 60 seconds)
  metricsCollector.startCollection(60000);

  // Start load balancer health checks
  loadBalancer.startHealthChecks();

  // Initialize performance optimization
  queryOptimizer.setSlowQueryThresholds({
    warning: 100,
    critical: 1000,
  });

  console.log('[Monitoring] Monitoring system initialized');
}

/**
 * Register a backend server with the load balancer
 */
export function registerBackendServer(
  id: string,
  host: string,
  port: number,
  weight: number = 1,
) {
  loadBalancer.addBackend(id, host, port, weight);
  console.log(`[Load Balancer] Registered backend: ${id} (${host}:${port})`);
}

/**
 * Start API performance tracking
 */
export function startAPITracker() {
  if (typeof window !== 'undefined') {
    // Client-side tracking
    const originalFetch = window.fetch;
    window.fetch = async function (...args: any[]) {
      const start = Date.now();
      try {
        const response = await originalFetch.apply(window, args);
        const duration = Date.now() - start;

        // Record metrics
        const url = args[0] as string;
        const method = (args[1]?.method || 'GET') as string;

        performanceTracker.recordAPILatency(
          url,
          method,
          duration,
          response.status,
          response.headers.get('content-length')
            ? parseInt(response.headers.get('content-length') || '0', 10)
            : 0,
        );

        // Check for alerts
        if (duration > 1000) {
          alertsSystem.checkMetric('api-latency', duration);
        }

        return response;
      } catch (error) {
        const duration = Date.now() - start;
        performanceTracker.recordAPILatency(
          args[0] as string,
          (args[1]?.method || 'GET') as string,
          duration,
          0,
          0,
        );
        throw error;
      }
    };
  }
}

/**
 * Record a custom metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: string = 'ms',
  metadata?: Record<string, any>,
) {
  performanceTracker.recordMetric({
    name,
    value,
    unit,
    timestamp: new Date(),
    metadata,
  });
}

/**
 * Report an error for tracking
 */
export function reportError(
  error: Error,
  context?: Record<string, any>,
) {
  console.error('[Error Report]', error, context);

  // Could integrate with error tracking service (Sentry, etc.)
  // sentryClient.captureException(error, { contexts: { additional: context } });
}

/**
 * Get current system status
 */
export function getSystemStatus() {
  return {
    health: metricsCollector.getOverallHealth(),
    uptime: metricsCollector.getUptime(),
    alerts: alertsSystem.getAlertStats(),
    services: metricsCollector.getAllServiceHealth(),
    performance: {
      pageLoadTime: performanceTracker.getAveragePageLoadTime(),
      apiLatency: performanceTracker.getAPILatencyStats(),
      coreWebVitals: performanceTracker.getCoreWebVitalsSummary(),
    },
    database: {
      slowQueries: queryOptimizer.getSlowQueries().length,
      queryMetrics: queryOptimizer.getMetricsSummary(),
    },
  };
}

/**
 * Export all monitoring utilities
 */
export {
  performanceTracker,
  metricsCollector,
  alertsSystem,
  queryOptimizer,
  shardManager,
  loadBalancer,
  regionConfigManager,
};
