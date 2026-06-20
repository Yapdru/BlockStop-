/**
 * Notification Storage Manager
 * Handles persistent storage of notifications and preferences
 * Implements multi-layer storage with cleanup and expiration
 */

import { EventEmitter } from 'events';
import {
  StoredNotification,
  NotificationPreferences,
  NotificationPayload,
  NotificationDeliveryLog,
} from './notification-types';

export interface StorageBackend {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export class NotificationStorageManager extends EventEmitter {
  private backend: StorageBackend;
  private memoryCache: Map<string, StoredNotification> = new Map();
  private preferences: NotificationPreferences | null = null;
  private deliveryLogs: NotificationDeliveryLog[] = [];
  private maxStoredNotifications = 500;
  private maxDeliveryLogs = 1000;
  private readonly STORAGE_KEYS = {
    NOTIFICATIONS: 'blockstop:notifications',
    PREFERENCES: 'blockstop:notification:preferences',
    DELIVERY_LOGS: 'blockstop:notification:delivery_logs',
    SCHEDULES: 'blockstop:notification:schedules',
  };

  constructor(backend: StorageBackend) {
    super();
    this.backend = backend;
  }

  /**
   * Initialize storage and load existing data
   */
  async initialize(userId: string): Promise<void> {
    try {
      await this.loadPreferences(userId);
      await this.loadNotifications();
      await this.loadDeliveryLogs();
      await this.cleanupExpiredNotifications();
      this.emit('initialized', { userId });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Store a notification
   */
  async storeNotification(
    notification: StoredNotification
  ): Promise<void> {
    try {
      this.memoryCache.set(notification.id, notification);

      // Trim cache if exceeds max size
      if (this.memoryCache.size > this.maxStoredNotifications) {
        const sorted = Array.from(this.memoryCache.entries())
          .sort((a, b) => a[1].metadata.createdAt - b[1].metadata.createdAt)
          .slice(this.maxStoredNotifications - 100);

        this.memoryCache.clear();
        sorted.forEach(([id, notif]) => {
          this.memoryCache.set(id, notif);
        });
      }

      // Persist to backend
      await this.persisNotifications();
      this.emit('notification:stored', { id: notification.id });
    } catch (error) {
      this.emit('error', { error, context: 'storeNotification' });
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<StoredNotification | null> {
    // Check memory cache first
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id) || null;
    }

    // Load from backend
    try {
      const data = await this.backend.getItem(this.STORAGE_KEYS.NOTIFICATIONS);
      if (!data) return null;

      const notifications = JSON.parse(data) as StoredNotification[];
      const notification = notifications.find((n) => n.id === id);

      if (notification) {
        this.memoryCache.set(id, notification);
      }

      return notification || null;
    } catch (error) {
      this.emit('error', { error, context: 'getNotification' });
      return null;
    }
  }

  /**
   * Get all notifications with optional filtering
   */
  async getNotifications(options?: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredNotification[]> {
    try {
      let notifications = Array.from(this.memoryCache.values());

      // Apply filters
      if (options?.status) {
        notifications = notifications.filter((n) => n.status === options.status);
      }

      if (options?.userId) {
        notifications = notifications.filter(
          (n) => n.metadata.userId === options.userId
        );
      }

      // Sort by newest first
      notifications.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 50;

      return notifications.slice(offset, offset + limit);
    } catch (error) {
      this.emit('error', { error, context: 'getNotifications' });
      return [];
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    id: string,
    status: string,
    updates?: Partial<StoredNotification>
  ): Promise<void> {
    try {
      const notification = this.memoryCache.get(id);
      if (!notification) return;

      notification.status = status as any;
      notification.metadata.updatedAt = Date.now();

      if (updates) {
        Object.assign(notification, updates);
      }

      this.memoryCache.set(id, notification);
      await this.persisNotifications();
      this.emit('notification:updated', { id, status });
    } catch (error) {
      this.emit('error', { error, context: 'updateNotificationStatus' });
      throw error;
    }
  }

  /**
   * Save user notification preferences
   */
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      this.preferences = preferences;
      await this.backend.setItem(
        this.STORAGE_KEYS.PREFERENCES,
        JSON.stringify(preferences)
      );
      this.emit('preferences:saved', { userId: preferences.userId });
    } catch (error) {
      this.emit('error', { error, context: 'savePreferences' });
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      if (this.preferences && this.preferences.userId === userId) {
        return this.preferences;
      }

      const data = await this.backend.getItem(this.STORAGE_KEYS.PREFERENCES);
      if (!data) return null;

      const preferences = JSON.parse(data) as NotificationPreferences;
      if (preferences.userId === userId) {
        this.preferences = preferences;
        return preferences;
      }

      return null;
    } catch (error) {
      this.emit('error', { error, context: 'getPreferences' });
      return null;
    }
  }

  /**
   * Add delivery log entry
   */
  async addDeliveryLog(log: NotificationDeliveryLog): Promise<void> {
    try {
      this.deliveryLogs.push(log);

      // Trim old logs
      if (this.deliveryLogs.length > this.maxDeliveryLogs) {
        this.deliveryLogs = this.deliveryLogs.slice(-this.maxDeliveryLogs);
      }

      await this.persistDeliveryLogs();
      this.emit('delivery_log:added', { notificationId: log.notificationId });
    } catch (error) {
      this.emit('error', { error, context: 'addDeliveryLog' });
      throw error;
    }
  }

  /**
   * Get delivery logs for a notification
   */
  async getDeliveryLogs(
    notificationId: string
  ): Promise<NotificationDeliveryLog[]> {
    try {
      return this.deliveryLogs.filter((log) => log.notificationId === notificationId);
    } catch (error) {
      this.emit('error', { error, context: 'getDeliveryLogs' });
      return [];
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(
    timeRange?: { startTime: number; endTime: number }
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }> {
    try {
      let logs = this.deliveryLogs;

      if (timeRange) {
        logs = logs.filter(
          (log) =>
            log.timestamp >= timeRange.startTime &&
            log.timestamp <= timeRange.endTime
        );
      }

      const successful = logs.filter((log) => {
        const channels = Object.values(log.channels);
        return channels.some((ch) => ch.sent && !ch.error);
      }).length;

      return {
        total: logs.length,
        successful,
        failed: logs.length - successful,
        successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0,
      };
    } catch (error) {
      this.emit('error', { error, context: 'getDeliveryStats' });
      return { total: 0, successful: 0, failed: 0, successRate: 0 };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = Date.now();
      const expiredIds: string[] = [];

      for (const [id, notification] of this.memoryCache.entries()) {
        if (notification.expiresAt && notification.expiresAt < now) {
          expiredIds.push(id);
        }
      }

      expiredIds.forEach((id) => {
        this.memoryCache.delete(id);
      });

      if (expiredIds.length > 0) {
        await this.persisNotifications();
        this.emit('cleanup:completed', { removedCount: expiredIds.length });
      }
    } catch (error) {
      this.emit('error', { error, context: 'cleanupExpiredNotifications' });
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearNotifications(userId: string): Promise<void> {
    try {
      for (const [id, notification] of this.memoryCache.entries()) {
        if (notification.metadata.userId === userId) {
          this.memoryCache.delete(id);
        }
      }

      await this.persisNotifications();
      this.emit('notifications:cleared', { userId });
    } catch (error) {
      this.emit('error', { error, context: 'clearNotifications' });
      throw error;
    }
  }

  /**
   * Private: Load preferences from backend
   */
  private async loadPreferences(userId: string): Promise<void> {
    try {
      const data = await this.backend.getItem(this.STORAGE_KEYS.PREFERENCES);
      if (data) {
        this.preferences = JSON.parse(data);
      }
    } catch (error) {
      this.emit('warn', { message: 'Failed to load preferences', error });
    }
  }

  /**
   * Private: Load notifications from backend
   */
  private async loadNotifications(): Promise<void> {
    try {
      const data = await this.backend.getItem(this.STORAGE_KEYS.NOTIFICATIONS);
      if (data) {
        const notifications = JSON.parse(data) as StoredNotification[];
        notifications.forEach((n) => {
          this.memoryCache.set(n.id, n);
        });
      }
    } catch (error) {
      this.emit('warn', { message: 'Failed to load notifications', error });
    }
  }

  /**
   * Private: Load delivery logs from backend
   */
  private async loadDeliveryLogs(): Promise<void> {
    try {
      const data = await this.backend.getItem(this.STORAGE_KEYS.DELIVERY_LOGS);
      if (data) {
        this.deliveryLogs = JSON.parse(data);
      }
    } catch (error) {
      this.emit('warn', { message: 'Failed to load delivery logs', error });
    }
  }

  /**
   * Private: Persist notifications to backend
   */
  private async persisNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.memoryCache.values());
      await this.backend.setItem(
        this.STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch (error) {
      this.emit('error', { error, context: 'persistNotifications' });
    }
  }

  /**
   * Private: Persist delivery logs to backend
   */
  private async persistDeliveryLogs(): Promise<void> {
    try {
      await this.backend.setItem(
        this.STORAGE_KEYS.DELIVERY_LOGS,
        JSON.stringify(this.deliveryLogs)
      );
    } catch (error) {
      this.emit('error', { error, context: 'persistDeliveryLogs' });
    }
  }

  /**
   * Get stats about stored notifications
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  }> {
    try {
      const notifications = Array.from(this.memoryCache.values());
      return {
        total: notifications.length,
        pending: notifications.filter((n) => n.status === 'pending').length,
        sent: notifications.filter((n) => n.status === 'sent').length,
        delivered: notifications.filter((n) => n.status === 'delivered').length,
        failed: notifications.filter((n) => n.status === 'failed').length,
      };
    } catch (error) {
      this.emit('error', { error, context: 'getStats' });
      return { total: 0, pending: 0, sent: 0, delivered: 0, failed: 0 };
    }
  }
}
