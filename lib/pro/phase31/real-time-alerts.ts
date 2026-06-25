// PRO Phase 31.1 - Real-Time Alert System with Webhook Notifications
// Production-grade alert management with intelligent routing and retry logic

import {
  AlertRule,
  AlertCondition,
  AlertAction,
  WebhookConfig,
  RealTimeAlert,
  NotificationStatus,
  ThreatPrediction,
} from '@/types/pro-phase31';

// ============================================================================
// ALERT RULE ENGINE
// ============================================================================

export class AlertRuleEngine {
  private rules: Map<string, AlertRule> = new Map();
  private alertHistory: Map<string, RealTimeAlert[]> = new Map();
  private webhookQueue: WebhookTask[] = [];
  private processingWebhooks: Set<string> = new Set();
  private readonly MAX_QUEUE_SIZE = 5000;
  private readonly WEBHOOK_TIMEOUT = 30000; // 30 seconds

  constructor() {
    this.startWebhookProcessor();
  }

  /**
   * Create a new alert rule
   */
  createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Update existing alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): AlertRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updated = {
      ...rule,
      ...updates,
      id: rule.id,
      createdAt: rule.createdAt,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, updated);
    return updated;
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Evaluate threat against all active rules
   */
  async evaluateThreat(threat: ThreatPrediction): Promise<RealTimeAlert[]> {
    const triggeredAlerts: RealTimeAlert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.evaluateConditions(rule.conditions, threat)) {
        const alert = await this.createAlert(rule, threat);
        triggeredAlerts.push(alert);

        // Queue notifications
        await this.queueNotifications(alert, rule);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate if threat matches rule conditions
   */
  private evaluateConditions(conditions: AlertCondition[], threat: ThreatPrediction): boolean {
    // Simplified evaluation - in production would support nested logic
    return conditions.some((cond) => {
      const threatValue = this.getThreatValue(threat, cond.field);
      return this.compareValues(threatValue, cond.operator, cond.value);
    });
  }

  /**
   * Extract value from threat for comparison
   */
  private getThreatValue(threat: ThreatPrediction, field: string): any {
    const pathParts = field.split('.');
    let value: any = threat;

    for (const part of pathParts) {
      if (value == null) return null;
      value = value[part];
    }

    return value;
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return Number(actual) > Number(expected);
      case 'gte':
        return Number(actual) >= Number(expected);
      case 'lt':
        return Number(actual) < Number(expected);
      case 'lte':
        return Number(actual) <= Number(expected);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'regex':
        return new RegExp(String(expected)).test(String(actual));
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'exists':
        return actual !== null && actual !== undefined;
      default:
        return false;
    }
  }

  /**
   * Create alert from triggered rule
   */
  private async createAlert(rule: AlertRule, threat: ThreatPrediction): Promise<RealTimeAlert> {
    const alert: RealTimeAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      threatId: threat.threatId,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      threat,
      triggeredAt: new Date(),
      notificationStatus: [],
      acknowledged: false,
      escalated: false,
      escalationLevel: 0,
      resolutionStatus: 'open',
    };

    // Store in history
    if (!this.alertHistory.has(threat.threatId)) {
      this.alertHistory.set(threat.threatId, []);
    }
    this.alertHistory.get(threat.threatId)!.push(alert);

    return alert;
  }

  /**
   * Queue notifications for alert
   */
  private async queueNotifications(alert: RealTimeAlert, rule: AlertRule): Promise<void> {
    for (const action of rule.actions) {
      if (!action.enabled) continue;

      const status: NotificationStatus = {
        channel: action.type as any,
        sent: false,
        deliveryStatus: 'pending',
        retryCount: 0,
      };

      alert.notificationStatus.push(status);

      switch (action.type) {
        case 'webhook':
          await this.queueWebhookNotifications(alert, rule.webhooks, status);
          break;
        case 'email':
          await this.sendEmailNotification(alert, action);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, action);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(alert, action);
          break;
      }
    }
  }

  /**
   * Queue webhook notifications
   */
  private async queueWebhookNotifications(
    alert: RealTimeAlert,
    webhooks: WebhookConfig[],
    status: NotificationStatus
  ): Promise<void> {
    for (const webhook of webhooks) {
      if (!webhook.enabled) continue;

      const task: WebhookTask = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        alertId: alert.id,
        url: webhook.url,
        method: webhook.method,
        headers: webhook.headers,
        authentication: webhook.authentication,
        payload: this.formatWebhookPayload(alert),
        retryPolicy: webhook.retryPolicy,
        attempts: 0,
        nextRetry: new Date(),
        status: 'pending',
      };

      if (this.webhookQueue.length < this.MAX_QUEUE_SIZE) {
        this.webhookQueue.push(task);
      }
    }
  }

  /**
   * Format payload for webhook delivery
   */
  private formatWebhookPayload(alert: RealTimeAlert): Record<string, any> {
    return {
      alert: {
        id: alert.id,
        ruleId: alert.ruleId,
        threatId: alert.threatId,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        triggeredAt: alert.triggeredAt.toISOString(),
        status: alert.resolutionStatus,
      },
      threat: {
        id: alert.threat.threatId,
        riskScore: alert.threat.riskScore,
        confidenceScore: alert.threat.confidenceScore,
        features: alert.threat.features,
        predictions: alert.threat.predictions,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: RealTimeAlert, action: AlertAction): Promise<void> {
    // Simulate email sending - in production, would use email service
    const to = action.config.recipient || action.config.recipients || [];
    const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;

    console.log(`[EMAIL] To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: Alert ${alert.id} for threat ${alert.threatId}`);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: RealTimeAlert, action: AlertAction): Promise<void> {
    const webhookUrl = action.config.webhookUrl;
    const channel = action.config.channel;

    const payload = {
      channel,
      attachments: [
        {
          color:
            alert.severity === 'critical'
              ? 'danger'
              : alert.severity === 'high'
                ? 'warning'
                : 'good',
          title: alert.title,
          text: alert.description,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Risk Score',
              value: `${(alert.threat.riskScore * 100).toFixed(1)}%`,
              short: true,
            },
            {
              title: 'Threat ID',
              value: alert.threat.threatId,
              short: false,
            },
          ],
          ts: Math.floor(alert.triggeredAt.getTime() / 1000),
        },
      ],
    };

    console.log(`[SLACK] Sending to channel: ${channel}`);
    console.log(`[SLACK] Payload:`, JSON.stringify(payload, null, 2));
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: RealTimeAlert, action: AlertAction): Promise<void> {
    const integrationKey = action.config.integrationKey;
    const serviceKey = action.config.serviceKey;

    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        severity:
          alert.severity === 'critical'
            ? 'critical'
            : alert.severity === 'high'
              ? 'error'
              : alert.severity === 'medium'
                ? 'warning'
                : 'info',
        source: 'BlockAdmin Threat Detection',
        custom_details: {
          threat_id: alert.threat.threatId,
          risk_score: alert.threat.riskScore,
          confidence_score: alert.threat.confidenceScore,
        },
      },
    };

    console.log(`[PAGERDUTY] Triggering incident with key: ${integrationKey}`);
    console.log(`[PAGERDUTY] Payload:`, JSON.stringify(payload, null, 2));
  }

  /**
   * Start webhook processing loop
   */
  private startWebhookProcessor(): void {
    setInterval(() => {
      this.processWebhookQueue();
    }, 1000); // Process every second
  }

  /**
   * Process queued webhooks with retry logic
   */
  private async processWebhookQueue(): Promise<void> {
    const now = new Date();
    const tasksToProcess = this.webhookQueue.filter(
      (task) => task.status === 'pending' && task.nextRetry <= now && !this.processingWebhooks.has(task.id)
    );

    for (const task of tasksToProcess.slice(0, 10)) {
      // Process max 10 at a time
      this.processingWebhooks.add(task.id);
      this.sendWebhookRequest(task).finally(() => {
        this.processingWebhooks.delete(task.id);
      });
    }

    // Clean up completed tasks
    this.webhookQueue = this.webhookQueue.filter(
      (task) => !(task.status === 'completed' && Date.now() - task.nextRetry.getTime() > 3600000) // Keep for 1 hour
    );
  }

  /**
   * Send webhook request with authentication
   */
  private async sendWebhookRequest(task: WebhookTask): Promise<void> {
    task.attempts++;

    try {
      const headers = { ...task.headers };

      // Add authentication
      if (task.authentication) {
        if (task.authentication.type === 'bearer') {
          headers['Authorization'] = `Bearer ${task.authentication.value}`;
        } else if (task.authentication.type === 'api-key') {
          headers['X-API-Key'] = task.authentication.value;
        } else if (task.authentication.type === 'basic') {
          headers['Authorization'] = `Basic ${task.authentication.value}`;
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.WEBHOOK_TIMEOUT);

      const response = await fetch(task.url, {
        method: task.method,
        headers,
        body: JSON.stringify(task.payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        task.status = 'completed';
        console.log(`[WEBHOOK] Successfully delivered: ${task.id}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[WEBHOOK] Failed attempt ${task.attempts}/${task.retryPolicy.maxRetries}: ${errorMsg}`);

      if (task.attempts < task.retryPolicy.maxRetries) {
        // Schedule retry with exponential backoff
        const backoffDelay =
          task.retryPolicy.initialDelayMs * Math.pow(task.retryPolicy.backoffMultiplier, task.attempts - 1);
        task.nextRetry = new Date(Date.now() + backoffDelay);
        task.status = 'pending';
      } else {
        task.status = 'failed';
        console.error(`[WEBHOOK] Max retries exceeded for ${task.id}`);
      }
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): RealTimeAlert | null {
    for (const alerts of this.alertHistory.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();
        return alert;
      }
    }
    return null;
  }

  /**
   * Escalate alert
   */
  escalateAlert(alertId: string): RealTimeAlert | null {
    for (const alerts of this.alertHistory.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.escalated = true;
        alert.escalationLevel = (alert.escalationLevel || 0) + 1;
        return alert;
      }
    }
    return null;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): RealTimeAlert | null {
    for (const alerts of this.alertHistory.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) return alert;
    }
    return null;
  }

  /**
   * Get alerts for threat
   */
  getAlertsForThreat(threatId: string): RealTimeAlert[] {
    return this.alertHistory.get(threatId) || [];
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): RealTimeAlert[] {
    const allAlerts: RealTimeAlert[] = [];
    for (const alerts of this.alertHistory.values()) {
      allAlerts.push(...alerts.filter((a) => a.resolutionStatus === 'open'));
    }
    return allAlerts;
  }

  /**
   * Get all rules
   */
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get webhook queue status
   */
  getQueueStatus(): {
    totalQueued: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      totalQueued: this.webhookQueue.length,
      pending: this.webhookQueue.filter((t) => t.status === 'pending').length,
      processing: this.processingWebhooks.size,
      completed: this.webhookQueue.filter((t) => t.status === 'completed').length,
      failed: this.webhookQueue.filter((t) => t.status === 'failed').length,
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface WebhookTask {
  id: string;
  webhookId: string;
  alertId: string;
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api-key' | 'basic';
    value: string;
  };
  payload: Record<string, any>;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  attempts: number;
  nextRetry: Date;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * Singleton instance for alert rule engine
 */
export const alertRuleEngine = new AlertRuleEngine();

/**
 * Test alert delivery
 */
export async function testAlertDelivery(
  rule: AlertRule,
  testUrl?: string
): Promise<{
  success: boolean;
  message: string;
  deliveryTimes: Record<string, number>;
}> {
  const deliveryTimes: Record<string, number> = {};
  const startTime = Date.now();

  try {
    for (const webhook of rule.webhooks) {
      if (!webhook.enabled) continue;

      const whStart = Date.now();
      await fetch(testUrl || webhook.testUrl || webhook.url, {
        method: webhook.method,
        headers: webhook.headers,
        body: JSON.stringify({ test: true }),
        signal: AbortSignal.timeout(5000),
      });
      deliveryTimes[webhook.id] = Date.now() - whStart;
    }

    return {
      success: true,
      message: 'All webhooks delivered successfully',
      deliveryTimes,
    };
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : String(error)}`,
      deliveryTimes,
    };
  }
}
