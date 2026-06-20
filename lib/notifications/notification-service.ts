/**
 * BlockStop Notification Service
 * Unified notification management for push, email, SMS, and in-app alerts
 * Features: multi-channel delivery, persistence, scheduling, and preferences
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  NotificationPayload,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationPreferences,
  CriticalThreatNotification,
  ScanCompleteNotification,
  SecurityTipNotification,
  TeamAlertNotification,
  StoredNotification,
  NotificationDeliveryLog,
  ThreatMetadata,
  ScanMetadata,
  NotificationSchedule,
} from './notification-types';
import { NotificationStorageManager, StorageBackend } from './notification-storage';
import { NotificationScheduler } from './notification-scheduler';

export interface NotificationServiceConfig {
  userId: string;
  storageBackend: StorageBackend;
  maxRetries?: number;
  retryDelayMs?: number;
  deliveryCallbacks?: {
    onPush?: (notification: StoredNotification) => Promise<void>;
    onEmail?: (notification: StoredNotification) => Promise<void>;
    onSms?: (notification: StoredNotification) => Promise<void>;
    onInApp?: (notification: StoredNotification) => Promise<void>;
  };
}

export class NotificationService extends EventEmitter {
  private userId: string;
  private storage: NotificationStorageManager;
  private scheduler: NotificationScheduler;
  private preferences: NotificationPreferences | null = null;
  private maxRetries: number;
  private retryDelayMs: number;
  private deliveryCallbacks: {
    [key in NotificationChannel]?: (notification: StoredNotification) => Promise<void>;
  } = {};
  private retryQueue: Map<string, number> = new Map(); // notification ID -> retry count

  constructor(config: NotificationServiceConfig) {
    super();
    this.userId = config.userId;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 5000;

    // Initialize storage
    this.storage = new NotificationStorageManager(config.storageBackend);

    // Initialize scheduler
    this.scheduler = new NotificationScheduler(async (schedules) => {
      // Persist schedules through API call
      this.emit('schedules:persist', { schedules });
    });

    // Set up delivery callbacks
    if (config.deliveryCallbacks) {
      this.deliveryCallbacks = config.deliveryCallbacks;
    }

    // Wire up event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the notification service
   */
  async initialize(
    preferences?: NotificationPreferences,
    schedules?: NotificationSchedule[]
  ): Promise<void> {
    try {
      // Initialize storage
      await this.storage.initialize(this.userId);

      // Load or create preferences
      if (preferences) {
        await this.storage.savePreferences(preferences);
        this.preferences = preferences;
      } else {
        this.preferences =
          (await this.storage.getPreferences(this.userId)) ||
          this.createDefaultPreferences();
        await this.storage.savePreferences(this.preferences);
      }

      // Initialize scheduler
      if (schedules) {
        await this.scheduler.initialize(schedules);
      }

      this.emit('initialized', { userId: this.userId });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Send a critical threat alert notification
   */
  async sendCriticalThreatAlert(threat: ThreatMetadata): Promise<string> {
    try {
      const notification: CriticalThreatNotification = {
        id: uuidv4(),
        type: NotificationType.CRITICAL_THREAT,
        priority: NotificationPriority.CRITICAL,
        channels: [NotificationChannel.PUSH],
        title: `Critical ${threat.threatType.toUpperCase()} Detected`,
        body: `${threat.description || threat.threatType} threat detected from ${threat.source}`,
        data: threat,
        actions: [
          {
            id: 'review',
            title: 'Review Threat',
          },
          {
            id: 'dismiss',
            title: 'Dismiss',
          },
        ],
        sound: true,
        vibrate: true,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      return await this.sendNotification(notification);
    } catch (error) {
      this.emit('error', { error, context: 'sendCriticalThreatAlert' });
      throw error;
    }
  }

  /**
   * Send a scan complete summary notification
   */
  async sendScanComplete(scan: ScanMetadata): Promise<string> {
    try {
      const hasThreats = scan.threatsFound > 0;
      const notification: ScanCompleteNotification = {
        id: uuidv4(),
        type: NotificationType.SCAN_COMPLETE,
        priority: hasThreats ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        title: `${scan.scanType.toUpperCase()} Scan Complete`,
        body: `${scan.itemsScanned} items scanned, ${scan.threatsFound} threats found, ${scan.safeItems} safe items`,
        data: scan,
        actions: [
          {
            id: 'view',
            title: 'View Results',
          },
        ],
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000, // 24 hours
      };

      return await this.sendNotification(notification);
    } catch (error) {
      this.emit('error', { error, context: 'sendScanComplete' });
      throw error;
    }
  }

  /**
   * Send a daily security tip
   */
  async sendSecurityTip(tip: {
    id: string;
    category: string;
    content: string;
    link?: string;
  }): Promise<string> {
    try {
      const notification: SecurityTipNotification = {
        id: uuidv4(),
        type: NotificationType.SECURITY_TIP,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        title: `Security Tip: ${tip.category}`,
        body: tip.content,
        data: {
          tipId: tip.id,
          category: tip.category,
          content: tip.content,
          link: tip.link,
          personalized: true,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 172800000, // 48 hours
      };

      return await this.sendNotification(notification);
    } catch (error) {
      this.emit('error', { error, context: 'sendSecurityTip' });
      throw error;
    }
  }

  /**
   * Send a team alert notification
   */
  async sendTeamAlert(alert: {
    teamId: string;
    memberId: string;
    memberName: string;
    action: string;
    resource: string;
  }): Promise<string> {
    try {
      // Check if team alerts are enabled and not muted
      if (!this.preferences?.types.team_alert) {
        this.emit('notification:skipped', { reason: 'team_alerts_disabled' });
        return '';
      }

      if (this.preferences?.teamNotificationsMuted?.includes(alert.teamId)) {
        this.emit('notification:skipped', { reason: 'team_muted', teamId: alert.teamId });
        return '';
      }

      const notification: TeamAlertNotification = {
        id: uuidv4(),
        type: NotificationType.TEAM_ALERT,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP],
        title: `Team Alert: ${alert.resource}`,
        body: `${alert.memberName} ${alert.action} on ${alert.resource}`,
        data: {
          teamId: alert.teamId,
          memberId: alert.memberId,
          memberName: alert.memberName,
          action: alert.action,
          resource: alert.resource,
          timestamp: Date.now(),
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 604800000, // 7 days
      };

      return await this.sendNotification(notification);
    } catch (error) {
      this.emit('error', { error, context: 'sendTeamAlert' });
      throw error;
    }
  }

  /**
   * Send a generic notification
   */
  async sendNotification(notification: NotificationPayload): Promise<string> {
    try {
      // Check user preferences
      if (!this.isNotificationAllowed(notification)) {
        this.emit('notification:blocked', {
          id: notification.id,
          type: notification.type,
          reason: 'user_preferences',
        });
        return '';
      }

      // Create stored notification
      const stored: StoredNotification = {
        id: notification.id,
        payload: notification,
        status: 'pending',
        channels: {
          [NotificationChannel.PUSH]: { sent: false },
          [NotificationChannel.EMAIL]: { sent: false },
          [NotificationChannel.SMS]: { sent: false },
          [NotificationChannel.IN_APP]: { sent: false },
        },
        attempts: 0,
        metadata: {
          userId: this.userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      // Store notification
      await this.storage.storeNotification(stored);

      // Deliver through configured channels
      await this.deliverNotification(stored);

      this.emit('notification:sent', { id: notification.id, type: notification.type });
      return notification.id;
    } catch (error) {
      this.emit('error', { error, context: 'sendNotification' });
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    try {
      if (!this.preferences) {
        this.preferences = this.createDefaultPreferences();
      }

      Object.assign(this.preferences, updates);
      this.preferences.updatedAt = Date.now();

      await this.storage.savePreferences(this.preferences);
      this.emit('preferences:updated');
    } catch (error) {
      this.emit('error', { error, context: 'updatePreferences' });
      throw error;
    }
  }

  /**
   * Create a notification schedule
   */
  async createSchedule(schedule: NotificationSchedule): Promise<void> {
    try {
      await this.scheduler.createSchedule(schedule);
      this.emit('schedule:created', { id: schedule.id });
    } catch (error) {
      this.emit('error', { error, context: 'createSchedule' });
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getHistory(options?: {
    limit?: number;
    offset?: number;
  }): Promise<StoredNotification[]> {
    return this.storage.getNotifications({
      userId: this.userId,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    });
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(timeRange?: {
    startTime: number;
    endTime: number;
  }): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }> {
    return this.storage.getDeliveryStats(timeRange);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.preferences !== null,
      userId: this.userId,
      preferences: this.preferences,
      schedulerStatus: this.scheduler.getStatus(),
    };
  }

  /**
   * Private: Check if notification is allowed based on preferences
   */
  private isNotificationAllowed(notification: NotificationPayload): boolean {
    if (!this.preferences) return false;

    // Check type enabled
    const typeKey = `${notification.type}` as keyof NotificationPreferences['types'];
    if (!this.preferences.types[typeKey]) {
      return false;
    }

    // Check quiet hours
    if (this.preferences.quietHours?.enabled) {
      const now = new Date();
      const startTime = this.parseTime(this.preferences.quietHours.start);
      const endTime = this.parseTime(this.preferences.quietHours.end);
      const currentTime = now.getHours() * 60 + now.getMinutes();

      if (
        startTime < endTime
          ? currentTime >= startTime && currentTime < endTime
          : currentTime >= startTime || currentTime < endTime
      ) {
        // In quiet hours - only allow critical notifications
        return notification.priority >= NotificationPriority.CRITICAL;
      }
    }

    return true;
  }

  /**
   * Private: Deliver notification through all enabled channels
   */
  private async deliverNotification(notification: StoredNotification): Promise<void> {
    try {
      const deliveryChannels = notification.payload.channels;

      for (const channel of deliveryChannels) {
        if (!this.preferences?.channels[channel]) {
          continue; // Channel disabled in preferences
        }

        try {
          const callback = this.deliveryCallbacks[channel];
          if (callback) {
            await callback(notification);
            notification.channels[channel].sent = true;
            notification.channels[channel].sentAt = Date.now();
          }
        } catch (error) {
          // Log delivery error but continue with other channels
          notification.channels[channel].error = (error as Error).message;

          // Increment attempt counter
          notification.attempts++;

          // Retry if under limit
          if (notification.attempts < this.maxRetries) {
            const backoffDelay = this.retryDelayMs * Math.pow(2, notification.attempts - 1);
            setTimeout(() => {
              this.retryDelivery(notification, channel);
            }, backoffDelay);
          } else {
            notification.channels[channel].sent = false;
          }
        }
      }

      // Update storage
      const anySuccessful = Object.values(notification.channels).some((ch) => ch.sent);
      notification.status = anySuccessful ? 'sent' : 'failed';
      notification.lastAttempt = Date.now();

      await this.storage.updateNotificationStatus(notification.id, notification.status, {
        channels: notification.channels,
        attempts: notification.attempts,
      });

      // Log delivery
      const deliveryLog: NotificationDeliveryLog = {
        notificationId: notification.id,
        userId: this.userId,
        type: notification.payload.type,
        channels: notification.channels,
        timestamp: Date.now(),
      };

      await this.storage.addDeliveryLog(deliveryLog);
    } catch (error) {
      this.emit('error', { error, context: 'deliverNotification' });
    }
  }

  /**
   * Private: Retry delivery for a specific channel
   */
  private async retryDelivery(
    notification: StoredNotification,
    channel: NotificationChannel
  ): Promise<void> {
    try {
      const callback = this.deliveryCallbacks[channel];
      if (callback) {
        await callback(notification);
        notification.channels[channel].sent = true;
        notification.channels[channel].deliveredAt = Date.now();
      }
    } catch (error) {
      notification.channels[channel].error = (error as Error).message;
    } finally {
      await this.storage.updateNotificationStatus(notification.id, notification.status, {
        channels: notification.channels,
        lastAttempt: Date.now(),
      });
    }
  }

  /**
   * Private: Set up event handlers for scheduler
   */
  private setupEventHandlers(): void {
    this.scheduler.on('schedule:triggered', async (event) => {
      try {
        // Emit event for external handlers to create and send notifications
        this.emit('scheduled:trigger', event);
      } catch (error) {
        this.emit('error', { error, context: 'schedule:triggered' });
      }
    });

    this.scheduler.on('error', (event) => {
      this.emit('error', { error: event.error, context: event.context });
    });
  }

  /**
   * Private: Parse time string (HH:mm) to minutes
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Private: Create default preferences
   */
  private createDefaultPreferences(): NotificationPreferences {
    return {
      userId: this.userId,
      channels: {
        push: true,
        email: false,
        sms: false,
        in_app: true,
      },
      types: {
        critical_threat: true,
        scan_complete: true,
        security_tip: true,
        team_alert: true,
      },
      frequency: {
        security_tip: 'daily',
        team_alert: 'immediate',
      },
      updatedAt: Date.now(),
    };
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    try {
      this.scheduler.destroy();
      this.removeAllListeners();
      this.emit('destroyed');
    } catch (error) {
      this.emit('error', { error, context: 'destroy' });
    }
  }
}
