/**
 * Health Monitor
 * Monitors integration health and provides metrics
 */

import { IntegrationBase } from './integration-base';
import { HealthCheckResult, HealthStatus, HealthMetrics } from '../types';
import { integrationRegistry } from './integration-registry';

export interface HealthAlert {
  id: string;
  integrationId: string;
  integrationName: string;
  status: HealthStatus;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
  resolved?: Date;
  acknowledgedBy?: string;
}

export interface HealthReport {
  timestamp: Date;
  overallStatus: HealthStatus;
  integrations: Array<{
    id: string;
    name: string;
    status: HealthStatus;
    responseTime: number;
    errorCount: number;
  }>;
  alerts: HealthAlert[];
  metrics: {
    averageResponseTime: number;
    healthyIntegrations: number;
    degradedIntegrations: number;
    unhealthyIntegrations: number;
  };
}

class HealthMonitor {
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private alerts: Map<string, HealthAlert> = new Map();
  private metrics: Map<string, HealthMetrics> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private alertListeners: Array<(alert: HealthAlert) => void> = [];
  private readonly checkIntervalMs = 5 * 60 * 1000; // 5 minutes
  private readonly alertThreshold = {
    responseTime: 5000, // ms
    errorRate: 0.1, // 10%
    uptime: 0.99, // 99%
  };

  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      return; // Already running
    }

    this.checkInterval = setInterval(() => {
      this.performHealthChecks().catch((error) => {
        console.error('Health check error:', error);
      });
    }, this.checkIntervalMs);

    // Perform initial check
    this.performHealthChecks().catch((error) => {
      console.error('Initial health check error:', error);
    });
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Perform health checks on all integrations
   */
  async performHealthChecks(): Promise<HealthReport> {
    const integrations = integrationRegistry.listIntegrations();
    const results: HealthCheckResult[] = [];

    for (const integration of integrations) {
      try {
        const result = await integration.instance.healthCheck();
        this.healthChecks.set(integration.id, result);
        results.push(result);
        this.updateMetrics(integration.id, result);
        await this.checkAlerts(integration.id, result);
      } catch (error) {
        console.error(`Health check failed for ${integration.name}:`, error);
      }
    }

    return this.generateHealthReport();
  }

  /**
   * Get latest health check for integration
   */
  getHealthCheck(integrationId: string): HealthCheckResult | null {
    return this.healthChecks.get(integrationId) || null;
  }

  /**
   * Get all health checks
   */
  getAllHealthChecks(): Map<string, HealthCheckResult> {
    return new Map(this.healthChecks);
  }

  /**
   * Update metrics based on health check
   */
  private updateMetrics(integrationId: string, healthCheck: HealthCheckResult): void {
    const metrics = this.metrics.get(integrationId) || {
      requestsPerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 1.0,
      lastSuccessfulSync: new Date(),
    };

    // Update metrics
    metrics.averageResponseTime =
      (metrics.averageResponseTime * 0.8 + healthCheck.responseTime * 0.2);

    if (healthCheck.status === HealthStatus.HEALTHY) {
      metrics.lastSuccessfulSync = new Date();
      metrics.uptime = Math.min(1.0, metrics.uptime + 0.01);
    } else if (healthCheck.status === HealthStatus.UNHEALTHY) {
      metrics.uptime = Math.max(0, metrics.uptime - 0.05);
    }

    metrics.errorRate = healthCheck.details.errorCount / Math.max(1, healthCheck.details.errorCount + 100);

    this.metrics.set(integrationId, metrics);
  }

  /**
   * Check for alerts
   */
  private async checkAlerts(integrationId: string, healthCheck: HealthCheckResult): Promise<void> {
    const integration = integrationRegistry.getIntegration(integrationId);
    if (!integration) return;

    // Check response time
    if (healthCheck.responseTime > this.alertThreshold.responseTime) {
      await this.raiseAlert(
        integrationId,
        integration.name,
        HealthStatus.DEGRADED,
        this.alertThreshold.responseTime,
        healthCheck.responseTime,
        `High response time: ${healthCheck.responseTime}ms`
      );
    }

    // Check status
    if (healthCheck.status === HealthStatus.UNHEALTHY) {
      await this.raiseAlert(
        integrationId,
        integration.name,
        HealthStatus.UNHEALTHY,
        1,
        0,
        healthCheck.details.lastError || 'Integration is unhealthy'
      );
    }
  }

  /**
   * Raise health alert
   */
  private async raiseAlert(
    integrationId: string,
    integrationName: string,
    status: HealthStatus,
    threshold: number,
    currentValue: number,
    message: string
  ): Promise<void> {
    const alertKey = `${integrationId}:${status}`;
    const existingAlert = this.alerts.get(alertKey);

    if (existingAlert && !existingAlert.resolved) {
      return; // Alert already exists
    }

    const alert: HealthAlert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      integrationId,
      integrationName,
      status,
      threshold,
      currentValue,
      message,
      timestamp: new Date(),
    };

    this.alerts.set(alertKey, alert);

    // Notify listeners
    for (const listener of this.alertListeners) {
      listener(alert);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(integrationId: string, status: HealthStatus): void {
    const alertKey = `${integrationId}:${status}`;
    const alert = this.alerts.get(alertKey);

    if (alert) {
      alert.resolved = new Date();
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.resolved);
  }

  /**
   * Get metrics for integration
   */
  getMetrics(integrationId: string): HealthMetrics | null {
    return this.metrics.get(integrationId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, HealthMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Subscribe to alerts
   */
  onAlert(listener: (alert: HealthAlert) => void): void {
    this.alertListeners.push(listener);
  }

  /**
   * Unsubscribe from alerts
   */
  offAlert(listener: (alert: HealthAlert) => void): void {
    this.alertListeners = this.alertListeners.filter((l) => l !== listener);
  }

  /**
   * Generate health report
   */
  generateHealthReport(): HealthReport {
    const integrations = integrationRegistry.listIntegrations();
    const healthReport: HealthReport = {
      timestamp: new Date(),
      overallStatus: HealthStatus.HEALTHY,
      integrations: [],
      alerts: this.getActiveAlerts(),
      metrics: {
        averageResponseTime: 0,
        healthyIntegrations: 0,
        degradedIntegrations: 0,
        unhealthyIntegrations: 0,
      },
    };

    let totalResponseTime = 0;
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const integration of integrations) {
      const healthCheck = this.healthChecks.get(integration.id);

      if (healthCheck) {
        healthReport.integrations.push({
          id: integration.id,
          name: integration.name,
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
          errorCount: healthCheck.details.errorCount,
        });

        totalResponseTime += healthCheck.responseTime;

        if (healthCheck.status === HealthStatus.HEALTHY) {
          healthyCount++;
        } else if (healthCheck.status === HealthStatus.DEGRADED) {
          degradedCount++;
        } else if (healthCheck.status === HealthStatus.UNHEALTHY) {
          unhealthyCount++;
        }
      }
    }

    // Calculate overall status
    if (unhealthyCount > 0) {
      healthReport.overallStatus = HealthStatus.UNHEALTHY;
    } else if (degradedCount > 0) {
      healthReport.overallStatus = HealthStatus.DEGRADED;
    }

    healthReport.metrics = {
      averageResponseTime: integrations.length > 0 ? totalResponseTime / integrations.length : 0,
      healthyIntegrations: healthyCount,
      degradedIntegrations: degradedCount,
      unhealthyIntegrations: unhealthyCount,
    };

    return healthReport;
  }

  /**
   * Reset monitoring
   */
  reset(): void {
    this.stopMonitoring();
    this.healthChecks.clear();
    this.alerts.clear();
    this.metrics.clear();
    this.alertListeners = [];
  }
}

export const healthMonitor = new HealthMonitor();
