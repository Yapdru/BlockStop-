/**
 * Push Notifications Types
 * Comprehensive type definitions for BlockStop notifications system
 * Supports critical alerts, scan completions, tips, and team notifications
 */

export enum NotificationType {
  CRITICAL_THREAT = 'critical_threat',
  SCAN_COMPLETE = 'scan_complete',
  SECURITY_TIP = 'security_tip',
  TEAM_ALERT = 'team_alert',
}

export enum NotificationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export interface ThreatMetadata {
  threatId: string;
  threatType: 'phishing' | 'malware' | 'spam' | 'suspicious';
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  timestamp: number;
  description?: string;
}

export interface ScanMetadata {
  scanId: string;
  scanType: 'email' | 'file' | 'url';
  itemsScanned: number;
  threatsFound: number;
  safeItems: number;
  duration: number; // milliseconds
  timestamp: number;
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  createdAt: number;
  expiresAt?: number;
  sound?: boolean;
  vibrate?: boolean;
  badge?: number;
}

export interface NotificationAction {
  id: string;
  title: string;
  authenticationRequired?: boolean;
  destructive?: boolean;
}

export interface CriticalThreatNotification extends NotificationPayload {
  type: NotificationType.CRITICAL_THREAT;
  data: ThreatMetadata;
  priority: NotificationPriority.CRITICAL | NotificationPriority.HIGH;
}

export interface ScanCompleteNotification extends NotificationPayload {
  type: NotificationType.SCAN_COMPLETE;
  data: ScanMetadata;
  priority: NotificationPriority.NORMAL | NotificationPriority.HIGH;
}

export interface SecurityTipNotification extends NotificationPayload {
  type: NotificationType.SECURITY_TIP;
  data: {
    tipId: string;
    category: string;
    content: string;
    link?: string;
    personalized?: boolean;
  };
  priority: NotificationPriority.LOW | NotificationPriority.NORMAL;
}

export interface TeamAlertNotification extends NotificationPayload {
  type: NotificationType.TEAM_ALERT;
  data: {
    teamId: string;
    memberId: string;
    memberName: string;
    action: string;
    resource: string;
    timestamp: number;
  };
  priority: NotificationPriority.NORMAL | NotificationPriority.HIGH;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    in_app: boolean;
  };
  types: {
    critical_threat: boolean;
    scan_complete: boolean;
    security_tip: boolean;
    team_alert: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
  frequency: {
    security_tip: 'never' | 'daily' | 'weekly' | 'as_needed';
    team_alert: 'never' | 'immediate' | 'daily_digest' | 'weekly_digest';
  };
  teamNotificationsMuted?: string[]; // team IDs to mute
  updatedAt: number;
}

export interface StoredNotification {
  id: string;
  payload: NotificationPayload;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
  channels: {
    [key in NotificationChannel]: {
      sent: boolean;
      sentAt?: number;
      deliveredAt?: number;
      error?: string;
    };
  };
  attempts: number;
  lastAttempt?: number;
  expiresAt?: number;
  metadata: {
    userId: string;
    createdAt: number;
    updatedAt: number;
  };
}

export interface NotificationSchedule {
  id: string;
  type: NotificationType;
  enabled: boolean;
  frequency: 'once' | 'daily' | 'weekly' | 'custom';
  time?: string; // HH:mm format
  days?: number[]; // 0-6, where 0 is Sunday
  customSchedule?: string; // cron expression
  lastTriggeredAt?: number;
  nextTriggerAt?: number;
  metadata?: {
    tipCategory?: string;
    targetUserTier?: string[];
  };
}

export interface NotificationDeliveryLog {
  notificationId: string;
  userId: string;
  type: NotificationType;
  channels: {
    [key in NotificationChannel]: {
      sent: boolean;
      sentAt?: number;
      deliveredAt?: number;
      error?: string;
      retries?: number;
    };
  };
  timestamp: number;
  response?: any;
}

export type NotificationUnion =
  | CriticalThreatNotification
  | ScanCompleteNotification
  | SecurityTipNotification
  | TeamAlertNotification;
