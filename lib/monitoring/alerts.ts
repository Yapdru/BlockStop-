/**
 * Alerts System
 * Monitors performance metrics and triggers alerts on degradation
 */

import { EventEmitter } from 'events';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertType {
  HIGH_LATENCY = 'high-latency',
  HIGH_ERROR_RATE = 'high-error-rate',
  HIGH_CPU = 'high-cpu',
  HIGH_MEMORY = 'high-memory',
  DATABASE_SLOW = 'database-slow',
  CACHE_MISS_RATE = 'cache-miss-rate',
  SERVICE_UNAVAILABLE = 'service-unavailable',
  DISK_FULL = 'disk-full',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  metric?: string;
  value?: number;
  threshold?: number;
  resolved?: boolean;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: number; // seconds
  severity: AlertSeverity;
  enabled: boolean;
  notification?: {
    email?: string[];
    slack?: string;
    webhook?: string;
  };
}

export class AlertsSystem extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertHistory: Alert[] = [];
  private activeAlerts: Set<string> = new Set();
  private metricHistory: Map<string, number[]> = new Map();
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-latency',
        type: AlertType.HIGH_LATENCY,
        metric: 'api-latency',
        condition: 'greater_than',
        threshold: 1000,
        duration: 60,
        severity: AlertSeverity.WARNING,
        enabled: true,
      },
      {
        id: 'high-error-rate',
        type: AlertType.HIGH_ERROR_RATE,
        metric: 'error-rate',
        condition: 'greater_than',
        threshold: 5,
        duration: 60,
        severity: AlertSeverity.CRITICAL,
        enabled: true,
      },
      {
        id: 'high-cpu',
        type: AlertType.HIGH_CPU,
        metric: 'cpu-usage',
        condition: 'greater_than',
        threshold: 80,
        duration: 300,
        severity: AlertSeverity.WARNING,
        enabled: true,
      },
      {
        id: 'high-memory',
        type: AlertType.HIGH_MEMORY,
        metric: 'memory-usage',
        condition: 'greater_than',
        threshold: 85,
        duration: 300,
        severity: AlertSeverity.WARNING,
        enabled: true,
      },
      {
        id: 'database-slow',
        type: AlertType.DATABASE_SLOW,
        metric: 'db-query-time',
        condition: 'greater_than',
        threshold: 500,
        duration: 120,
        severity: AlertSeverity.WARNING,
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Create a new alert
   */
  createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metric?: string,
    value?: number,
    threshold?: number,
  ): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      metric,
      value,
      threshold,
    };

    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    this.activeAlerts.add(alert.id);

    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    // Emit alert event
    this.emit('alert', alert);

    // Log based on severity
    if (severity === AlertSeverity.CRITICAL) {
      console.error(`[CRITICAL] ${title}: ${message}`);
    } else if (severity === AlertSeverity.WARNING) {
      console.warn(`[WARNING] ${title}: ${message}`);
    } else {
      console.info(`[INFO] ${title}: ${message}`);
    }

    return alert;
  }

  /**
   * Check metric against alert rules
   */
  checkMetric(metric: string, value: number): void {
    this.recordMetricHistory(metric, value);

    // Check all rules for this metric
    this.alertRules.forEach((rule) => {
      if (!rule.enabled || rule.metric !== metric) {
        return;
      }

      if (this.evaluateRule(rule, value)) {
        const existingAlert = this.findActiveAlertByType(rule.type);

        if (!existingAlert) {
          this.createAlert(
            rule.type,
            rule.severity,
            `Alert: ${rule.type}`,
            `Metric ${metric} is ${value}, threshold is ${rule.threshold}`,
            metric,
            value,
            rule.threshold,
          );

          // Send notifications
          if (rule.notification) {
            this.sendNotifications(rule.notification, {
              metric,
              value,
              threshold: rule.threshold,
            });
          }
        }
      }
    });
  }

  /**
   * Evaluate if a rule is triggered
   */
  private evaluateRule(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'greater_than':
        return value > rule.threshold;
      case 'less_than':
        return value < rule.threshold;
      case 'equals':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Record metric history
   */
  private recordMetricHistory(metric: string, value: number): void {
    if (!this.metricHistory.has(metric)) {
      this.metricHistory.set(metric, []);
    }

    const history = this.metricHistory.get(metric)!;
    history.push(value);

    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Find active alert by type
   */
  private findActiveAlertByType(type: AlertType): Alert | undefined {
    for (const alert of this.alerts.values()) {
      if (
        alert.type === type &&
        !alert.resolved &&
        this.activeAlerts.has(alert.id)
      ) {
        return alert;
      }
    }
    return undefined;
  }

  /**
   * Send notifications
   */
  private sendNotifications(
    notification: { email?: string[]; slack?: string; webhook?: string },
    data: any,
  ): void {
    // In production, this would send actual notifications
    console.log('Sending notifications:', notification, data);

    if (notification.email) {
      // Send email
      console.log(`Sending email to: ${notification.email.join(', ')}`);
    }

    if (notification.slack) {
      // Send Slack message
      console.log(`Sending Slack message to: ${notification.slack}`);
    }

    if (notification.webhook) {
      // Send webhook
      console.log(`Sending webhook to: ${notification.webhook}`);
      // fetch(notification.webhook, { method: 'POST', body: JSON.stringify(data) });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, acknowledgedBy?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      this.activeAlerts.delete(alertId);

      this.emit('alert-resolved', alert);
      console.log(`Alert ${alertId} resolved`);
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();

      this.emit('alert-acknowledged', alert);
      console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    const active: Alert[] = [];

    this.activeAlerts.forEach((id) => {
      const alert = this.alerts.get(id);
      if (alert && !alert.resolved) {
        active.push(alert);
      }
    });

    return active.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alert by ID
   */
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Add or update alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  /**
   * Get alert rule
   */
  getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  /**
   * Get all alert rules
   */
  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const total = this.alerts.size;
    const active = this.activeAlerts.size;
    const critical = Array.from(this.alerts.values()).filter(
      (a) => a.severity === AlertSeverity.CRITICAL && !a.resolved,
    ).length;
    const warning = Array.from(this.alerts.values()).filter(
      (a) => a.severity === AlertSeverity.WARNING && !a.resolved,
    ).length;

    return {
      total,
      active,
      critical,
      warning,
      resolved: total - active,
    };
  }

  /**
   * Get metric statistics
   */
  getMetricStats(metric: string) {
    const history = this.metricHistory.get(metric) || [];

    if (history.length === 0) {
      return null;
    }

    const min = Math.min(...history);
    const max = Math.max(...history);
    const avg = Math.round(history.reduce((a, b) => a + b) / history.length);

    return {
      metric,
      min,
      max,
      avg,
      current: history[history.length - 1],
      samples: history.length,
    };
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    const idsToDelete: string[] = [];

    this.alerts.forEach((alert, id) => {
      if (alert.resolved) {
        idsToDelete.push(id);
      }
    });

    idsToDelete.forEach((id) => {
      this.alerts.delete(id);
      this.activeAlerts.delete(id);
    });
  }

  /**
   * Export alerts
   */
  exportAlerts() {
    return {
      timestamp: new Date(),
      activeAlerts: this.getActiveAlerts(),
      alertHistory: this.getAlertHistory(50),
      stats: this.getAlertStats(),
      rules: this.getAllAlertRules(),
    };
  }
}

// Export singleton
export const alertsSystem = new AlertsSystem();
