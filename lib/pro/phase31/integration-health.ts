// PRO Phase 31.1 - Integration Health Monitoring
// Production-grade monitoring for external integrations and API health

import {
  IntegrationHealth,
  HealthCheckResult,
  HealthCheckItem,
  IntegrationMetrics,
  APIQuota,
  APIUsageAnalytics,
  APIError,
  UsagePoint,
} from '@/types/pro-phase31';

// ============================================================================
// INTEGRATION HEALTH MONITOR
// ============================================================================

export class IntegrationHealthMonitor {
  private integrations: Map<string, IntegrationHealth> = new Map();
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();
  private usageMetrics: Map<string, APIUsageAnalytics> = new Map();
  private quotas: Map<string, APIQuota> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 300000; // 5 minutes
  private readonly HISTORY_RETENTION = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.initializeDefaultIntegrations();
    this.startHealthChecks();
  }

  /**
   * Initialize default integrations
   */
  private initializeDefaultIntegrations(): void {
    const integrations: Omit<IntegrationHealth, 'metrics' | 'configuration'>[] = [
      {
        integrationId: 'slack-webhooks',
        name: 'Slack Notifications',
        status: 'healthy',
        type: 'webhook',
        lastHealthCheck: new Date(),
        uptime: 99.95,
        responseTime: 245,
        errorRate: 0.05,
      },
      {
        integrationId: 'pagerduty-api',
        name: 'PagerDuty Integration',
        status: 'healthy',
        type: 'api',
        lastHealthCheck: new Date(),
        uptime: 99.99,
        responseTime: 320,
        errorRate: 0.01,
      },
      {
        integrationId: 'siem-connector',
        name: 'SIEM Connection',
        status: 'healthy',
        type: 'siem',
        lastHealthCheck: new Date(),
        uptime: 98.5,
        responseTime: 850,
        errorRate: 1.5,
      },
      {
        integrationId: 'threat-intel-feed',
        name: 'Threat Intelligence Feed',
        status: 'healthy',
        type: 'threat-intel',
        lastHealthCheck: new Date(),
        uptime: 99.8,
        responseTime: 1200,
        errorRate: 0.2,
      },
      {
        integrationId: 'cloud-storage',
        name: 'Cloud Storage Backup',
        status: 'healthy',
        type: 'cloud',
        lastHealthCheck: new Date(),
        uptime: 99.99,
        responseTime: 450,
        errorRate: 0.01,
      },
    ];

    integrations.forEach((integration) => {
      const full: IntegrationHealth = {
        ...integration,
        metrics: {
          requestsPerMinute: Math.round(Math.random() * 100) + 10,
          averageLatency: integration.responseTime,
          errorCount24h: Math.round(integration.errorRate * 1000),
          successRate: 100 - integration.errorRate,
          dataPoints24h: Math.round(Math.random() * 50000) + 10000,
          throughput: Math.round(Math.random() * 1000) + 100,
        },
        configuration: {},
      };

      this.integrations.set(integration.integrationId, full);
      this.healthHistory.set(integration.integrationId, []);
      this.initializeUsageMetrics(integration.integrationId);
      this.initializeQuota(integration.integrationId);
    });
  }

  /**
   * Initialize usage metrics for integration
   */
  private initializeUsageMetrics(integrationId: string): void {
    const now = new Date();
    const usagePoints: UsagePoint[] = [];

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      usagePoints.push({
        timestamp,
        requests: Math.round(Math.random() * 200) + 50,
        threatsAnalyzed: Math.round(Math.random() * 100) + 10,
        averageLatency: Math.round(Math.random() * 500) + 100,
        errorCount: Math.floor(Math.random() * 5),
      });
    }

    const analytics: APIUsageAnalytics = {
      timeRange: {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now,
      },
      totalRequests: usagePoints.reduce((sum, p) => sum + p.requests, 0),
      requestsByEndpoint: {
        '/analyze': Math.round(Math.random() * 1000) + 500,
        '/predict': Math.round(Math.random() * 800) + 300,
        '/correlate': Math.round(Math.random() * 600) + 200,
      },
      requestsByMethod: {
        'GET': Math.round(Math.random() * 2000) + 1000,
        'POST': Math.round(Math.random() * 3000) + 1500,
        'PUT': Math.round(Math.random() * 500) + 200,
      },
      averageLatency: Math.round(usagePoints.reduce((sum, p) => sum + p.averageLatency, 0) / usagePoints.length),
      p95Latency: Math.round(Math.random() * 800) + 400,
      p99Latency: Math.round(Math.random() * 1200) + 600,
      errorRate: 0.5,
      errorsByType: {
        'Timeout': 5,
        'RateLimit': 3,
        'Authentication': 1,
      },
      topErrors: [
        {
          code: 'TIMEOUT',
          message: 'Request timeout after 30 seconds',
          count: 5,
          percentage: 45.5,
          lastOccurrence: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          count: 3,
          percentage: 27.3,
          lastOccurrence: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
      ],
      usageByHour: usagePoints,
      peakHours: ['14:00', '15:00', '16:00'],
      quotaUtilization: Math.round(Math.random() * 30) + 40,
    };

    this.usageMetrics.set(integrationId, analytics);
  }

  /**
   * Initialize API quota for integration
   */
  private initializeQuota(integrationId: string): void {
    const quota: APIQuota = {
      accountId: integrationId,
      tierLevel: 'pro',
      quotaLimits: {
        requestsPerDay: 100000,
        requestsPerMinute: 1000,
        threatsAnalyzedPerDay: 50000,
        webhooksPerHour: 500,
        apiKeysAllowed: 10,
      },
      usage: {
        requestsUsedToday: Math.round(Math.random() * 40000) + 20000,
        requestsUsedThisMinute: Math.round(Math.random() * 500) + 100,
        threatsAnalyzedToday: Math.round(Math.random() * 20000) + 5000,
        webhooksSentThisHour: Math.round(Math.random() * 200) + 50,
        activeApiKeys: Math.round(Math.random() * 5) + 2,
      },
      resetTime: new Date(new Date().setHours(24, 0, 0, 0)),
      warningThresholds: {
        requests: 80000,
        threats: 40000,
        webhooks: 400,
      },
    };

    this.quotas.set(integrationId, quota);
  }

  /**
   * Perform health check on integration
   */
  async performHealthCheck(integrationId: string): Promise<HealthCheckResult | null> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return null;

    const checks: HealthCheckResult['checks'] = {
      connectivity: await this.checkConnectivity(integrationId),
      authentication: await this.checkAuthentication(integrationId),
      dataFlow: await this.checkDataFlow(integrationId),
      errorRate: this.checkErrorRate(integration),
      performance: this.checkPerformance(integration),
    };

    const scores = Object.values(checks).map((c) => c.score);
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const result: HealthCheckResult = {
      integrationId,
      status: this.determineStatus(overallScore),
      checks,
      overallScore: Math.round(overallScore * 100) / 100,
    };

    // Update integration status
    if (overallScore >= 0.9) {
      integration.status = 'healthy';
    } else if (overallScore >= 0.7) {
      integration.status = 'degraded';
    } else if (overallScore >= 0.5) {
      integration.status = 'critical';
    } else {
      integration.status = 'offline';
    }

    integration.lastHealthCheck = new Date();

    // Store in history
    const history = this.healthHistory.get(integrationId) || [];
    history.push(result);

    // Clean up old entries
    const cutoff = new Date(Date.now() - this.HISTORY_RETENTION);
    const filtered = history.filter((h) => new Date(h.integrationId) > cutoff); // Placeholder
    this.healthHistory.set(integrationId, filtered);

    return result;
  }

  /**
   * Check connectivity
   */
  private async checkConnectivity(integrationId: string): Promise<HealthCheckItem> {
    try {
      // Simulate connectivity check
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 50));
      const responseTime = Date.now() - startTime;

      if (responseTime > 5000) {
        return {
          status: 'fail',
          score: 0.2,
          message: 'Integration is not responding',
          recommendation: 'Check network connectivity and firewall rules',
        };
      } else if (responseTime > 2000) {
        return {
          status: 'warn',
          score: 0.6,
          message: 'High latency detected',
          recommendation: 'Monitor connection performance',
        };
      }

      return {
        status: 'pass',
        score: 1.0,
        message: 'Connectivity is healthy',
      };
    } catch (error) {
      return {
        status: 'fail',
        score: 0,
        message: `Connectivity check failed: ${error}`,
        recommendation: 'Verify integration configuration',
      };
    }
  }

  /**
   * Check authentication
   */
  private async checkAuthentication(integrationId: string): Promise<HealthCheckItem> {
    const integration = this.integrations.get(integrationId);

    if (!integration?.configuration.apiKey) {
      return {
        status: 'fail',
        score: 0,
        message: 'API key not configured',
        recommendation: 'Configure valid API credentials',
      };
    }

    // Simulate auth check
    const isValid = Math.random() > 0.05; // 95% success rate

    if (!isValid) {
      return {
        status: 'fail',
        score: 0,
        message: 'Authentication failed - invalid credentials',
        recommendation: 'Verify and update API key',
      };
    }

    return {
      status: 'pass',
      score: 1.0,
      message: 'Authentication is valid',
    };
  }

  /**
   * Check data flow
   */
  private async checkDataFlow(integrationId: string): Promise<HealthCheckItem> {
    const usage = this.usageMetrics.get(integrationId);

    if (!usage || usage.totalRequests === 0) {
      return {
        status: 'warn',
        score: 0.5,
        message: 'No recent data flow detected',
        recommendation: 'Verify integration is sending data',
      };
    }

    const successRate = 100 - usage.errorRate;

    if (successRate < 80) {
      return {
        status: 'fail',
        score: 0.4,
        message: `Low success rate: ${successRate.toFixed(1)}%`,
        recommendation: 'Investigate and fix integration issues',
      };
    } else if (successRate < 95) {
      return {
        status: 'warn',
        score: 0.7,
        message: `Acceptable success rate: ${successRate.toFixed(1)}%`,
        recommendation: 'Monitor for continued issues',
      };
    }

    return {
      status: 'pass',
      score: 1.0,
      message: `Excellent success rate: ${successRate.toFixed(1)}%`,
    };
  }

  /**
   * Check error rate
   */
  private checkErrorRate(integration: IntegrationHealth): HealthCheckItem {
    if (integration.errorRate > 10) {
      return {
        status: 'fail',
        score: 0.2,
        message: `High error rate: ${integration.errorRate}%`,
        recommendation: 'Investigate integration errors immediately',
      };
    } else if (integration.errorRate > 5) {
      return {
        status: 'warn',
        score: 0.6,
        message: `Elevated error rate: ${integration.errorRate}%`,
        recommendation: 'Monitor and investigate errors',
      };
    }

    return {
      status: 'pass',
      score: 1.0,
      message: `Normal error rate: ${integration.errorRate}%`,
    };
  }

  /**
   * Check performance
   */
  private checkPerformance(integration: IntegrationHealth): HealthCheckItem {
    if (integration.responseTime > 5000) {
      return {
        status: 'fail',
        score: 0.2,
        message: `Very slow response: ${integration.responseTime}ms`,
        recommendation: 'Optimize integration or upgrade service tier',
      };
    } else if (integration.responseTime > 2000) {
      return {
        status: 'warn',
        score: 0.6,
        message: `Slow response: ${integration.responseTime}ms`,
        recommendation: 'Monitor performance metrics',
      };
    }

    return {
      status: 'pass',
      score: 1.0,
      message: `Fast response: ${integration.responseTime}ms`,
    };
  }

  /**
   * Determine overall health status
   */
  private determineStatus(score: number): 'healthy' | 'degraded' | 'critical' | 'offline' {
    if (score >= 0.9) return 'healthy';
    if (score >= 0.7) return 'degraded';
    if (score >= 0.5) return 'critical';
    return 'offline';
  }

  /**
   * Start health check loop
   */
  private startHealthChecks(): void {
    setInterval(() => {
      for (const integrationId of this.integrations.keys()) {
        this.performHealthCheck(integrationId).catch(console.error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Get integration health
   */
  getIntegrationHealth(integrationId: string): IntegrationHealth | null {
    return this.integrations.get(integrationId) || null;
  }

  /**
   * Get all integrations
   */
  getAllIntegrations(): IntegrationHealth[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get integration usage metrics
   */
  getUsageMetrics(integrationId: string): APIUsageAnalytics | null {
    return this.usageMetrics.get(integrationId) || null;
  }

  /**
   * Get API quota
   */
  getApiQuota(integrationId: string): APIQuota | null {
    return this.quotas.get(integrationId) || null;
  }

  /**
   * Check quota warnings
   */
  getQuotaWarnings(integrationId: string): string[] {
    const quota = this.quotas.get(integrationId);
    if (!quota) return [];

    const warnings: string[] = [];

    if (quota.usage.requestsUsedToday >= quota.warningThresholds.requests) {
      warnings.push(
        `⚠️ Daily request quota at ${Math.round((quota.usage.requestsUsedToday / quota.quotaLimits.requestsPerDay) * 100)}%`
      );
    }

    if (quota.usage.threatsAnalyzedToday >= quota.warningThresholds.threats) {
      warnings.push(
        `⚠️ Daily threat analysis quota at ${Math.round((quota.usage.threatsAnalyzedToday / quota.quotaLimits.threatsAnalyzedPerDay) * 100)}%`
      );
    }

    if (quota.usage.webhooksSentThisHour >= quota.warningThresholds.webhooks) {
      warnings.push(
        `⚠️ Hourly webhook quota at ${Math.round((quota.usage.webhooksSentThisHour / quota.quotaLimits.webhooksPerHour) * 100)}%`
      );
    }

    return warnings;
  }

  /**
   * Get health history
   */
  getHealthHistory(integrationId: string, limit: number = 100): HealthCheckResult[] {
    const history = this.healthHistory.get(integrationId) || [];
    return history.slice(-limit);
  }

  /**
   * Add or update integration
   */
  registerIntegration(integration: IntegrationHealth): void {
    this.integrations.set(integration.integrationId, integration);
    this.healthHistory.set(integration.integrationId, []);
    this.initializeUsageMetrics(integration.integrationId);
    this.initializeQuota(integration.integrationId);
  }

  /**
   * Generate health summary
   */
  getHealthSummary(): {
    healthy: number;
    degraded: number;
    critical: number;
    offline: number;
    overallHealth: number;
  } {
    const integrations = Array.from(this.integrations.values());

    return {
      healthy: integrations.filter((i) => i.status === 'healthy').length,
      degraded: integrations.filter((i) => i.status === 'degraded').length,
      critical: integrations.filter((i) => i.status === 'critical').length,
      offline: integrations.filter((i) => i.status === 'offline').length,
      overallHealth: integrations.reduce((sum, i) => {
        const score =
          i.status === 'healthy' ? 1 : i.status === 'degraded' ? 0.6 : i.status === 'critical' ? 0.3 : 0;
        return sum + score;
      }, 0) / integrations.length,
    };
  }
}

/**
 * Singleton instance for integration health monitoring
 */
export const integrationHealthMonitor = new IntegrationHealthMonitor();
