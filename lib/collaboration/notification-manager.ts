import { EventEmitter } from 'events';
import { NotificationPayload } from './types';
import { WEBSOCKET_EVENTS, NOTIFICATION_TYPES } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class NotificationManager extends EventEmitter {
  private notifications: Map<string, NotificationPayload> = new Map();
  private userNotifications: Map<string, NotificationPayload[]> = new Map();
  private wsManager: WebSocketManager;
  private notificationPreferences: Map<string, Set<string>> = new Map(); // userId -> notificationTypes

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize notification manager:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.NOTIFICATION_CREATED, (payload) => this.handleNotificationCreated(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.NOTIFICATION_READ, (payload) => this.handleNotificationRead(payload));
  }

  createNotification(notification: Omit<NotificationPayload, 'id' | 'createdAt' | 'read'>): NotificationPayload {
    const id = CollaborationUtils.generateId('notif');
    const fullNotification: NotificationPayload = {
      ...notification,
      id,
      createdAt: new Date(),
      read: false,
    };

    this.notifications.set(id, fullNotification);

    if (!this.userNotifications.has(notification.userId)) {
      this.userNotifications.set(notification.userId, []);
    }
    this.userNotifications.get(notification.userId)!.push(fullNotification);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.NOTIFICATION_CREATED, fullNotification);
    this.emit('notification:created', fullNotification);

    return fullNotification;
  }

  notifyMention(userId: string, mentionedBy: string, resourceId: string, resourceType: string): NotificationPayload {
    return this.createNotification({
      userId,
      type: NOTIFICATION_TYPES.MENTION,
      title: `You were mentioned by ${mentionedBy}`,
      description: `Check the new comment in the ${resourceType}`,
      resourceId,
      resourceType,
    });
  }

  notifyAssignment(userId: string, assignedBy: string, resourceId: string): NotificationPayload {
    return this.createNotification({
      userId,
      type: NOTIFICATION_TYPES.ASSIGNMENT,
      title: `New assignment from ${assignedBy}`,
      description: 'You have been assigned to an incident',
      resourceId,
      resourceType: 'assignment',
    });
  }

  notifyUpdate(userId: string, updatedResource: string, resourceId: string, resourceType: string): NotificationPayload {
    return this.createNotification({
      userId,
      type: NOTIFICATION_TYPES.UPDATE,
      title: `${updatedResource} was updated`,
      description: `An update occurred in the ${resourceType}`,
      resourceId,
      resourceType,
    });
  }

  notifyComment(userId: string, commentedBy: string, resourceId: string, resourceType: string): NotificationPayload {
    return this.createNotification({
      userId,
      type: NOTIFICATION_TYPES.COMMENT,
      title: `New comment from ${commentedBy}`,
      description: `A new comment was added to ${resourceType}`,
      resourceId,
      resourceType,
    });
  }

  notifyEvidenceShared(userId: string, sharedBy: string, evidenceTitle: string, evidenceId: string): NotificationPayload {
    return this.createNotification({
      userId,
      type: NOTIFICATION_TYPES.EVIDENCE_SHARED,
      title: `Evidence shared: ${evidenceTitle}`,
      description: `${sharedBy} shared evidence with you`,
      resourceId: evidenceId,
      resourceType: 'evidence',
    });
  }

  markAsRead(notificationId: string): NotificationPayload | undefined {
    const notification = this.notifications.get(notificationId);
    if (!notification) return undefined;

    notification.read = true;
    this.wsManager.broadcast(WEBSOCKET_EVENTS.NOTIFICATION_READ, { notificationId });
    this.emit('notification:read', { notificationId });

    return notification;
  }

  markAllAsRead(userId: string): void {
    const userNotifs = this.userNotifications.get(userId) || [];
    userNotifs.forEach((n) => {
      n.read = true;
    });
    this.emit('notifications:all_read', { userId });
  }

  getNotification(notificationId: string): NotificationPayload | undefined {
    return this.notifications.get(notificationId);
  }

  getUserNotifications(userId: string, limit: number = 50): NotificationPayload[] {
    return (this.userNotifications.get(userId) || []).slice(-limit);
  }

  getUserUnreadNotifications(userId: string): NotificationPayload[] {
    return (this.userNotifications.get(userId) || []).filter((n) => !n.read);
  }

  getUnreadCount(userId: string): number {
    return this.getUserUnreadNotifications(userId).length;
  }

  getNotificationsByType(userId: string, type: string): NotificationPayload[] {
    return (this.userNotifications.get(userId) || []).filter((n) => n.type === type);
  }

  deleteNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    this.notifications.delete(notificationId);

    const userNotifs = this.userNotifications.get(notification.userId);
    if (userNotifs) {
      const idx = userNotifs.findIndex((n) => n.id === notificationId);
      if (idx !== -1) {
        userNotifs.splice(idx, 1);
      }
    }

    this.emit('notification:deleted', { notificationId });
    return true;
  }

  setNotificationPreference(userId: string, notificationType: string, enabled: boolean): void {
    if (!this.notificationPreferences.has(userId)) {
      this.notificationPreferences.set(userId, new Set());
    }

    const prefs = this.notificationPreferences.get(userId)!;
    if (enabled) {
      prefs.add(notificationType);
    } else {
      prefs.delete(notificationType);
    }
  }

  isNotificationEnabled(userId: string, notificationType: string): boolean {
    const prefs = this.notificationPreferences.get(userId);
    return prefs ? prefs.has(notificationType) : true;
  }

  clearOldNotifications(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const idsToDelete: string[] = [];
    this.notifications.forEach((notif, id) => {
      if (notif.createdAt < cutoffDate && notif.read) {
        idsToDelete.push(id);
      }
    });

    idsToDelete.forEach((id) => {
      this.deleteNotification(id);
    });

    this.emit('notifications:pruned', { removed: idsToDelete.length });
  }

  private handleNotificationCreated(payload: any): void {
    const notification = payload as NotificationPayload;
    this.notifications.set(notification.id, notification);

    if (!this.userNotifications.has(notification.userId)) {
      this.userNotifications.set(notification.userId, []);
    }
    this.userNotifications.get(notification.userId)!.push(notification);
  }

  private handleNotificationRead(payload: any): void {
    const notification = this.notifications.get(payload.notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  getNotificationStats(userId: string): {
    total: number;
    unread: number;
    byType: Record<string, number>;
  } {
    const notifications = this.getUserNotifications(userId);
    const byType: Record<string, number> = {};

    notifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: this.getUnreadCount(userId),
      byType,
    };
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
