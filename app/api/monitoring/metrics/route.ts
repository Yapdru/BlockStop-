/**
 * Monitoring Metrics API
 * Provides performance and system metrics for the dashboard
 */

import { performanceTracker } from '@/lib/monitoring/performance-tracker';
import { metricsCollector } from '@/lib/monitoring/metrics-collector';
import { alertsSystem } from '@/lib/monitoring/alerts';
import { queryOptimizer } from '@/lib/db/query-optimizer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Collect system metrics
    metricsCollector.collectSystemMetrics();

    // Get page load metrics
    const pageLoadStats = {
      avgTime: performanceTracker.getAveragePageLoadTime(60),
      slowQueryCount: queryOptimizer.getSlowQueries(60).length,
      avgQueryTime: queryOptimizer.getMetricsSummary().avgExecutionTime,
      poolUsage: queryOptimizer.getPoolStats(),
      queryCount: queryOptimizer.getMetricsSummary().totalQueries,
    };

    // Get API latency metrics
    const apiLatencyStats = performanceTracker.getAPILatencyStats(60);

    // Get core web vitals
    const coreWebVitals = performanceTracker.getCoreWebVitalsSummary(60);

    // Get system metrics
    const systemMetrics = metricsCollector.getMetricsForPeriod(60);
    const overallHealth = metricsCollector.getOverallHealth();

    // Get alerts
    const alertStats = alertsSystem.getAlertStats();
    const activeAlerts = alertsSystem.getActiveAlerts();

    // Get slow queries
    const slowQueries = queryOptimizer.getTopSlowQueries(10);
    const queryOptimizationRecommendations = queryOptimizer.getIndexRecommendations();

    return Response.json({
      timestamp: new Date().toISOString(),
      pageLoad: pageLoadStats,
      apiLatency: apiLatencyStats,
      coreWebVitals,
      systemMetrics: {
        cpu: systemMetrics.averages.cpu || 0,
        memory: systemMetrics.averages.memory || 0,
        diskUsage: systemMetrics.averages.diskUsage || 0,
        networkLatency: systemMetrics.averages.networkLatency || 0,
        requestsPerSecond: systemMetrics.averages.requestsPerSecond || 0,
        errorRate: systemMetrics.averages.errorRate || 0,
        cacheHitRate: systemMetrics.averages.cacheHitRate || 0,
        dbConnectionPoolUsage: systemMetrics.averages.dbConnectionPoolUsage || 0,
        uptime: metricsCollector.getUptime(),
        overallHealth,
      },
      alerts: {
        activeAlerts: activeAlerts.map((a) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          message: a.message,
          timestamp: a.timestamp.toISOString(),
          metric: a.metric,
          value: a.value,
          threshold: a.threshold,
        })),
        stats: alertStats,
      },
      slowQueries: slowQueries.map((q) => ({
        query: q.query,
        executionTime: q.executionTime,
        timestamp: q.timestamp?.toISOString(),
      })),
      recommendations: queryOptimizationRecommendations,
      services: metricsCollector
        .getAllServiceHealth()
        .map((s) => ({
          name: s.serviceName,
          status: s.status,
          latency: s.latency,
          errorRate: s.errorRate,
          uptime: s.uptime,
          lastCheck: s.lastCheck.toISOString(),
        })),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return Response.json(
      {
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle different metric types
    if (body.type === 'api-latency') {
      performanceTracker.recordAPILatency(
        body.endpoint,
        body.method,
        body.latency,
        body.statusCode,
        body.responseSize,
      );
    } else if (body.type === 'page-load') {
      performanceTracker.recordPageLoadMetrics({
        url: body.url,
        fcp: body.fcp,
        lcp: body.lcp,
        cls: body.cls,
        ttfb: body.ttfb,
        dcl: body.dcl,
        load: body.load,
        timestamp: new Date(),
      });
    } else if (body.type === 'custom-metric') {
      performanceTracker.recordMetric({
        name: body.name,
        value: body.value,
        unit: body.unit,
        timestamp: new Date(),
        page: body.page,
        userId: body.userId,
        sessionId: body.sessionId,
        metadata: body.metadata,
      });
    } else if (body.type === 'service-health') {
      metricsCollector.updateServiceHealth(
        body.serviceName,
        body.status,
        body.latency,
        body.errorRate,
        body.uptime,
      );
    } else if (body.type === 'check-metric') {
      alertsSystem.checkMetric(body.metric, body.value);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error recording metrics:', error);
    return Response.json(
      {
        error: 'Failed to record metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 },
    );
  }
}
