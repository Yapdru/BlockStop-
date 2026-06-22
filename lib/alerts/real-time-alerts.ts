/**
 * BlockStop Real-Time Alerting Module
 * Instant threat notifications with WebSocket support, prioritization, deduplication, and analytics
 * Features: multi-priority alerts, escalation automation, alert history, WebSocket delivery
 *
 * Phase 30.6 - Performance & Offline
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export enum AlertPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum AlertCategory {
  MALWARE = 'malware',
  PHISHING = 'phishing',
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  POLICY_VIOLATION = 'policy_violation',
  ANOMALY = 'anomaly',
}

export interface ThreatSignature {
  id: string;
  name: string;
  category: AlertCategory;
  severity: number; // 0-100
  indicators: string[];
  enabled: boolean;
}

export interface AlertPayload {
  id?: string;
  title: string;
  description: string;
  category: AlertCategory;
  priority: AlertPriority;
  timestamp?: number;
  sourceSystem: string;
  affectedResources: string[];
  threatSignature?: ThreatSignature;
  metadata?: Record<string, any>;
  correlationId?: string;
}

export interface Alert extends AlertPayload {
  id: string;
  timestamp: number;
  status: AlertStatus;
  acknowledgmentTime?: number;
  acknowledgedBy?: string;
  resolutionTime?: number;
  escalationLevel?: number;
  escalationHistory?: EscalationEvent[];
  deduplicationHash?: string;
}

export interface EscalationEvent {
  timestamp: number;
  level: number;
  action: string;
  actor?: string;
}

export interface AlertDeduplicationConfig {
  enabled: boolean;
  timeWindowMs: number;
  matchingFields: (keyof AlertPayload)[];
}

export interface AlertAggregation {
  timestamp: number;
  totalAlerts: number;
  byPriority: Record<AlertPriority, number>;
  byCategory: Record<AlertCategory, number>;
  escalatedCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
}

export interface AlertHistoryEntry {
  timestamp: number;
  alertId: string;
  event: 'created' | 'acknowledged' | 'escalated' | 'resolved';
  actor?: string;
  details?: Record<string, any>;
}

export interface WebSocketAlert {
  type: 'alert' | 'acknowledgment' | 'escalation' | 'resolution';
  alert: Alert;
  timestamp: number;
  userId?: string;
  teamId?: string;
}

export interface AlertAnalytics {
  totalAlertsToday: number;
  criticalAlertsToday: number;
  averageResolutionTimeMs: number;
  escalationRate: number; // 0-1
  mostCommonCategory: AlertCategory;
  alertTrendHourly: Array<{ hour: number; count: number }>;
  responseTimePercentiles: Record<string, number>;
}

export interface RealTimeAlertsConfig {
  userId: string;
  teamId?: string;
  maxStoredAlerts?: number;
  deduplicationConfig?: AlertDeduplicationConfig;
  wsUrl?: string;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  escalationStrategies?: Map<AlertPriority, EscalationStrategy[]>;
}

export interface EscalationStrategy {
  triggerCondition: 'time' | 'ackedCount' | 'manualRequest';
  triggerValue: number;
  escalationAction: 'notify_supervisor' | 'page_oncall' | 'create_incident' | 'send_email';
  notificationChannels: string[];
}

/**
 * Real-Time Alerting System
 * Manages instant threat notifications with WebSocket support, alert prioritization,
 * deduplication, escalation automation, and comprehensive alert analytics
 */
export class RealTimeAlertsManager extends EventEmitter {
  private config: RealTimeAlertsConfig;
  private alerts: Map<string, Alert> = new Map();
  private alertHistory: AlertHistoryEntry[] = [];
  private deduplicationCache: Map<string, Alert> = new Map();
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private analyticsWindow: Alert[] = [];
  private isInitialized = false;

  private readonly MAX_STORED_ALERTS = 10000;
  private readonly DEDUP_DEFAULT_WINDOW = 60000; // 1 minute
  private readonly WS_RECONNECT_DELAY = 5000;
  private readonly ANALYTICS_WINDOW_SIZE = 100000; // Last 100k alerts

  constructor(config: RealTimeAlertsConfig) {
    super();
    this.config = {
      maxStoredAlerts: this.MAX_STORED_ALERTS,
      deduplicationConfig: {
        enabled: true,
        timeWindowMs: this.DEDUP_DEFAULT_WINDOW,
        matchingFields: ['category', 'title', 'sourceSystem'],
      },
      reconnectDelayMs: this.WS_RECONNECT_DELAY,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  /**
   * Initialize the real-time alerts manager
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Setup default escalation strategies
      if (!this.config.escalationStrategies) {
        this.setupDefaultEscalationStrategies();
      }

      // Connect to WebSocket if configured
      if (this.config.wsUrl) {
        await this.connectWebSocket();
      }

      this.isInitialized = true;
      this.emit('initialized', {
        userId: this.config.userId,
        wsConnected: this.ws !== null,
      });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Create and emit a new alert
   */
  async createAlert(payload: AlertPayload): Promise<Alert> {
    try {
      const alertId = payload.id || uuidv4();
      const timestamp = payload.timestamp || Date.now();

      // Check deduplication
      if (this.config.deduplicationConfig?.enabled) {
        const dedupResult = this.checkDuplication(payload);
        if (dedupResult) {
          this.emit('alert:deduped', { alert: dedupResult, newPayload: payload });
          return dedupResult;
        }
      }

      const alert: Alert = {
        ...payload,
        id: alertId,
        timestamp,
        status: AlertStatus.ACTIVE,
        escalationLevel: 0,
        escalationHistory: [],
        deduplicationHash: this.generateDeduplicationHash(payload),
      };

      // Store alert
      this.alerts.set(alertId, alert);
      this.deduplicationCache.set(alert.deduplicationHash || '', alert);
      this.analyticsWindow.push(alert);

      // Enforce max stored alerts
      if (this.alerts.size > (this.config.maxStoredAlerts || this.MAX_STORED_ALERTS)) {
        this.pruneOldestAlerts(
          this.alerts.size - (this.config.maxStoredAlerts || this.MAX_STORED_ALERTS)
        );
      }

      // Record history
      this.recordHistoryEntry({
        timestamp,
        alertId,
        event: 'created',
      });

      // Broadcast via WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.broadcastWebSocketAlert({
          type: 'alert',
          alert,
          timestamp,
          userId: this.config.userId,
          teamId: this.config.teamId,
        });
      }

      // Setup escalation timers based on priority
      this.setupEscalationTimers(alert);

      // Emit local event
      this.emit('alert:created', alert);

      return alert;
    } catch (error) {
      this.emit('error', { error, context: 'createAlert' });
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgmentTime = Date.now();

      // Record history
      this.recordHistoryEntry({
        timestamp: alert.acknowledgmentTime,
        alertId,
        event: 'acknowledged',
        actor: acknowledgedBy,
      });

      // Cancel escalation timers
      this.cancelEscalationTimers(alertId);

      // Broadcast acknowledgment
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.broadcastWebSocketAlert({
          type: 'acknowledgment',
          alert,
          timestamp: alert.acknowledgmentTime,
          userId: this.config.userId,
          teamId: this.config.teamId,
        });
      }

      this.emit('alert:acknowledged', alert);

      return alert;
    } catch (error) {
      this.emit('error', { error, context: 'acknowledgeAlert' });
      throw error;
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, details?: Record<string, any>): Promise<Alert> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.status = AlertStatus.RESOLVED;
      alert.resolutionTime = Date.now();

      // Record history
      this.recordHistoryEntry({
        timestamp: alert.resolutionTime,
        alertId,
        event: 'resolved',
        details,
      });

      // Cancel escalation timers
      this.cancelEscalationTimers(alertId);

      // Broadcast resolution
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.broadcastWebSocketAlert({
          type: 'resolution',
          alert,
          timestamp: alert.resolutionTime,
          userId: this.config.userId,
          teamId: this.config.teamId,
        });
      }

      this.emit('alert:resolved', alert);

      return alert;
    } catch (error) {
      this.emit('error', { error, context: 'resolveAlert' });
      throw error;
    }
  }

  /**
   * Manually escalate an alert
   */
  async escalateAlert(alertId: string, actor?: string): Promise<Alert> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.escalationLevel = (alert.escalationLevel || 0) + 1;
      alert.status = AlertStatus.ESCALATED;

      const escalationEvent: EscalationEvent = {
        timestamp: Date.now(),
        level: alert.escalationLevel,
        action: 'manual_escalation',
        actor,
      };

      alert.escalationHistory?.push(escalationEvent);

      // Record history
      this.recordHistoryEntry({
        timestamp: escalationEvent.timestamp,
        alertId,
        event: 'escalated',
        actor,
        details: { level: alert.escalationLevel },
      });

      // Trigger escalation actions
      await this.executeEscalationActions(alert, alert.escalationLevel);

      // Broadcast escalation
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.broadcastWebSocketAlert({
          type: 'escalation',
          alert,
          timestamp: escalationEvent.timestamp,
          userId: this.config.userId,
          teamId: this.config.teamId,
        });
      }

      this.emit('alert:escalated', alert);

      return alert;
    } catch (error) {
      this.emit('error', { error, context: 'escalateAlert' });
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all active alerts with optional filtering
   */
  getActiveAlerts(
    filter?: {
      priority?: AlertPriority;
      category?: AlertCategory;
      status?: AlertStatus;
      fromTimestamp?: number;
    }
  ): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.priority) {
        alerts = alerts.filter((a) => a.priority === filter.priority);
      }
      if (filter.category) {
        alerts = alerts.filter((a) => a.category === filter.category);
      }
      if (filter.status) {
        alerts = alerts.filter((a) => a.status === filter.status);
      }
      if (filter.fromTimestamp) {
        alerts = alerts.filter((a) => a.timestamp >= filter.fromTimestamp!);
      }
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get alert history with pagination
   */
  getAlertHistory(limit: number = 1000, offset: number = 0): AlertHistoryEntry[] {
    return this.alertHistory.slice(
      Math.max(0, this.alertHistory.length - offset - limit),
      Math.max(0, this.alertHistory.length - offset)
    );
  }

  /**
   * Get alert analytics
   */
  getAnalytics(): AlertAnalytics {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Get today's alerts
    const todayAlerts = this.analyticsWindow.filter((a) => a.timestamp >= dayAgo);

    const critical = todayAlerts.filter((a) => a.priority === AlertPriority.CRITICAL);
    const escalated = todayAlerts.filter((a) => a.status === AlertStatus.ESCALATED);
    const resolved = todayAlerts.filter((a) => a.status === AlertStatus.RESOLVED);

    // Calculate average resolution time
    const resolutionTimes = resolved
      .filter((a) => a.resolutionTime !== undefined)
      .map((a) => (a.resolutionTime || 0) - a.timestamp);
    const averageResolutionTimeMs =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Calculate escalation rate
    const escalationRate = todayAlerts.length > 0 ? escalated.length / todayAlerts.length : 0;

    // Get most common category
    const categoryMap: Record<AlertCategory, number> = {} as Record<AlertCategory, number>;
    todayAlerts.forEach((a) => {
      categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
    });
    const mostCommonCategory =
      (Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] as AlertCategory) ||
      AlertCategory.ANOMALY;

    // Hourly trends
    const hourlyMap: Record<number, number> = {};
    todayAlerts.forEach((a) => {
      const hour = Math.floor((a.timestamp - dayAgo) / (60 * 60 * 1000));
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    });
    const alertTrendHourly = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyMap[i] || 0,
    }));

    // Calculate response time percentiles
    const sortedResolutionTimes = resolutionTimes.sort((a, b) => a - b);
    const responseTimePercentiles = {
      p50:
        sortedResolutionTimes[Math.floor(sortedResolutionTimes.length * 0.5)] ||
        averageResolutionTimeMs,
      p95:
        sortedResolutionTimes[Math.floor(sortedResolutionTimes.length * 0.95)] ||
        averageResolutionTimeMs,
      p99:
        sortedResolutionTimes[Math.floor(sortedResolutionTimes.length * 0.99)] ||
        averageResolutionTimeMs,
    };

    return {
      totalAlertsToday: todayAlerts.length,
      criticalAlertsToday: critical.length,
      averageResolutionTimeMs,
      escalationRate,
      mostCommonCategory,
      alertTrendHourly,
      responseTimePercentiles,
    };
  }

  /**
   * Check for duplicate alerts
   */
  private checkDuplication(payload: AlertPayload): Alert | null {
    const hash = this.generateDeduplicationHash(payload);
    const dedupWindow = this.config.deduplicationConfig?.timeWindowMs || this.DEDUP_DEFAULT_WINDOW;
    const now = Date.now();

    const existingAlert = this.deduplicationCache.get(hash);
    if (
      existingAlert &&
      now - existingAlert.timestamp < dedupWindow &&
      existingAlert.status === AlertStatus.ACTIVE
    ) {
      return existingAlert;
    }

    return null;
  }

  /**
   * Generate deduplication hash
   */
  private generateDeduplicationHash(payload: AlertPayload): string {
    const fields = this.config.deduplicationConfig?.matchingFields || ['category', 'title'];
    const hashInput = fields.map((f) => String(payload[f] || '')).join('::');

    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash)}`;
  }

  /**
   * Setup escalation timers based on priority
   */
  private setupEscalationTimers(alert: Alert): void {
    const strategies = this.config.escalationStrategies?.get(alert.priority);
    if (!strategies) {
      return;
    }

    strategies.forEach((strategy) => {
      if (strategy.triggerCondition === 'time') {
        const timerId = `escalation_${alert.id}_${Date.now()}`;
        const timer = setTimeout(async () => {
          if (this.alerts.get(alert.id)?.status === AlertStatus.ACTIVE) {
            await this.escalateAlert(alert.id, 'auto_escalation');
          }
          this.escalationTimers.delete(timerId);
        }, strategy.triggerValue);

        this.escalationTimers.set(timerId, timer);
      }
    });
  }

  /**
   * Cancel escalation timers for an alert
   */
  private cancelEscalationTimers(alertId: string): void {
    const timersToDelete: string[] = [];
    this.escalationTimers.forEach((timer, key) => {
      if (key.includes(`escalation_${alertId}_`)) {
        clearTimeout(timer);
        timersToDelete.push(key);
      }
    });
    timersToDelete.forEach((key) => this.escalationTimers.delete(key));
  }

  /**
   * Execute escalation actions
   */
  private async executeEscalationActions(alert: Alert, level: number): Promise<void> {
    const strategies = this.config.escalationStrategies?.get(alert.priority);
    if (!strategies) {
      return;
    }

    for (const strategy of strategies) {
      if (strategy.triggerCondition === 'manualRequest') {
        this.emit('escalation:action', {
          alertId: alert.id,
          action: strategy.escalationAction,
          channels: strategy.notificationChannels,
          level,
        });
      }
    }
  }

  /**
   * Record alert history entry
   */
  private recordHistoryEntry(entry: AlertHistoryEntry): void {
    this.alertHistory.push(entry);

    // Keep only last 100k entries
    if (this.alertHistory.length > this.ANALYTICS_WINDOW_SIZE) {
      this.alertHistory = this.alertHistory.slice(-this.ANALYTICS_WINDOW_SIZE);
    }
  }

  /**
   * Prune oldest alerts
   */
  private pruneOldestAlerts(count: number): void {
    const sorted = Array.from(this.alerts.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);

    sorted.forEach(([id]) => {
      const alert = this.alerts.get(id);
      if (alert?.deduplicationHash) {
        this.deduplicationCache.delete(alert.deduplicationHash);
      }
      this.alerts.delete(id);
    });
  }

  /**
   * Setup default escalation strategies
   */
  private setupDefaultEscalationStrategies(): void {
    const strategies = new Map<AlertPriority, EscalationStrategy[]>();

    strategies.set(AlertPriority.CRITICAL, [
      {
        triggerCondition: 'time',
        triggerValue: 5 * 60 * 1000, // 5 minutes
        escalationAction: 'page_oncall',
        notificationChannels: ['sms', 'phone', 'email'],
      },
    ]);

    strategies.set(AlertPriority.HIGH, [
      {
        triggerCondition: 'time',
        triggerValue: 15 * 60 * 1000, // 15 minutes
        escalationAction: 'notify_supervisor',
        notificationChannels: ['email', 'push'],
      },
    ]);

    strategies.set(AlertPriority.MEDIUM, [
      {
        triggerCondition: 'time',
        triggerValue: 60 * 60 * 1000, // 1 hour
        escalationAction: 'create_incident',
        notificationChannels: ['email'],
      },
    ]);

    this.config.escalationStrategies = strategies;
  }

  /**
   * Connect to WebSocket for real-time alerts
   */
  private async connectWebSocket(): Promise<void> {
    if (!this.config.wsUrl) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl!);

        this.ws.onopen = () => {
          this.wsReconnectAttempts = 0;
          this.emit('ws:connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.emit('ws:error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.emit('ws:disconnected');
          this.attemptWebSocketReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt WebSocket reconnection
   */
  private attemptWebSocketReconnect(): void {
    if (
      this.wsReconnectAttempts >= (this.config.maxReconnectAttempts || 5) ||
      !this.config.wsUrl
    ) {
      this.emit('ws:reconnect_failed');
      return;
    }

    this.wsReconnectAttempts++;
    const delay =
      (this.config.reconnectDelayMs || this.WS_RECONNECT_DELAY) * Math.pow(2, this.wsReconnectAttempts - 1);

    setTimeout(() => {
      this.connectWebSocket().catch(() => {
        // Retry will be attempted in onclose
      });
    }, Math.min(delay, 60000)); // Max 1 minute
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: string): void {
    try {
      const message: WebSocketAlert = JSON.parse(data);
      this.emit('ws:message', message);
    } catch (error) {
      this.emit('error', { error, context: 'handleWebSocketMessage' });
    }
  }

  /**
   * Broadcast alert via WebSocket
   */
  private broadcastWebSocketAlert(alert: WebSocketAlert): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(alert));
      } catch (error) {
        this.emit('error', { error, context: 'broadcastWebSocketAlert' });
      }
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    // Clear all timers
    this.escalationTimers.forEach((timer) => clearTimeout(timer));
    this.escalationTimers.clear();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isInitialized = false;
    this.emit('shutdown');
  }
}

export default RealTimeAlertsManager;
