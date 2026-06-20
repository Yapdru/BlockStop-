import { EventEmitter } from 'events';
import { ActivityEvent } from './types';
import { COLLABORATION_CONFIG, ACTIVITY_ACTIONS, WEBSOCKET_EVENTS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class ActivityTimeline extends EventEmitter {
  private activities: ActivityEvent[] = [];
  private wsManager: WebSocketManager;
  private activityIndex: Map<string, ActivityEvent[]> = new Map(); // resourceId -> activities
  private userActivityIndex: Map<string, ActivityEvent[]> = new Map(); // userId -> activities
  private maxActivitiesInMemory: number = 5000;

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize activity timeline:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.ACTIVITY_RECORDED, (payload) => this.handleActivityRecorded(payload));
  }

  recordActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    const fullActivity: ActivityEvent = {
      ...activity,
      id: CollaborationUtils.generateActivityId(),
      timestamp: new Date(),
    };

    this.activities.push(fullActivity);

    if (!this.activityIndex.has(activity.resourceId)) {
      this.activityIndex.set(activity.resourceId, []);
    }
    this.activityIndex.get(activity.resourceId)!.push(fullActivity);

    if (!this.userActivityIndex.has(activity.userId)) {
      this.userActivityIndex.set(activity.userId, []);
    }
    this.userActivityIndex.get(activity.userId)!.push(fullActivity);

    if (this.activities.length > this.maxActivitiesInMemory) {
      this.activities.shift();
    }

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ACTIVITY_RECORDED, fullActivity);
    this.emit('activity:recorded', fullActivity);

    return fullActivity;
  }

  getActivities(limit: number = 100): ActivityEvent[] {
    return this.activities.slice(-limit);
  }

  getActivitiesByResource(resourceId: string, limit: number = 50): ActivityEvent[] {
    const activities = this.activityIndex.get(resourceId) || [];
    return activities.slice(-limit);
  }

  getActivitiesByUser(userId: string, limit: number = 50): ActivityEvent[] {
    const activities = this.userActivityIndex.get(userId) || [];
    return activities.slice(-limit);
  }

  getActivitiesByResourceType(resourceType: string, limit: number = 50): ActivityEvent[] {
    return this.activities.filter((a) => a.resourceType === resourceType).slice(-limit);
  }

  getActivitiesByAction(action: string, limit: number = 50): ActivityEvent[] {
    return this.activities.filter((a) => a.action === action).slice(-limit);
  }

  getActivityTimerange(incidentId: string, startDate: Date, endDate: Date): ActivityEvent[] {
    return this.activities.filter(
      (a) => a.incidentId === incidentId && a.timestamp >= startDate && a.timestamp <= endDate,
    );
  }

  getResourceHistory(resourceId: string): ActivityEvent[] {
    return this.activityIndex.get(resourceId) || [];
  }

  getChangeLog(resourceId: string): Array<{ action: string; before: any; after: any; timestamp: Date; userId: string }> {
    const activities = this.getResourceHistory(resourceId);
    return activities
      .filter((a) => a.action === ACTIVITY_ACTIONS.UPDATE)
      .map((a) => ({
        action: a.action,
        before: a.oldValue,
        after: a.newValue,
        timestamp: a.timestamp,
        userId: a.userId,
      }));
  }

  getTimelineStats(incidentId: string): {
    totalActivities: number;
    activitiesByAction: Record<string, number>;
    activitiesByUser: Record<string, number>;
    activitiesByResourceType: Record<string, number>;
  } {
    const activities = this.activities.filter((a) => a.incidentId === incidentId);
    const byAction: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byResourceType: Record<string, number> = {};

    activities.forEach((a) => {
      byAction[a.action] = (byAction[a.action] || 0) + 1;
      byUser[a.userId] = (byUser[a.userId] || 0) + 1;
      byResourceType[a.resourceType] = (byResourceType[a.resourceType] || 0) + 1;
    });

    return {
      totalActivities: activities.length,
      activitiesByAction: byAction,
      activitiesByUser: byUser,
      activitiesByResourceType: byResourceType,
    };
  }

  getMostActiveUsers(incidentId: string, limit: number = 10): Array<{ userId: string; count: number }> {
    const stats = this.getTimelineStats(incidentId);
    return Object.entries(stats.activitiesByUser)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getMostModifiedResources(incidentId: string, limit: number = 10): Array<{ resourceId: string; count: number }> {
    const activities = this.activities.filter((a) => a.incidentId === incidentId);
    const resourceModifications: Record<string, number> = {};

    activities.forEach((a) => {
      resourceModifications[a.resourceId] = (resourceModifications[a.resourceId] || 0) + 1;
    });

    return Object.entries(resourceModifications)
      .map(([resourceId, count]) => ({ resourceId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getActivityTrend(incidentId: string, intervalMinutes: number = 60): Array<{ timestamp: Date; count: number }> {
    const activities = this.activities.filter((a) => a.incidentId === incidentId);
    const bins: Map<number, number> = new Map();

    activities.forEach((a) => {
      const binKey = Math.floor(a.timestamp.getTime() / (intervalMinutes * 60 * 1000));
      bins.set(binKey, (bins.get(binKey) || 0) + 1);
    });

    return Array.from(bins.entries())
      .map(([binKey, count]) => ({
        timestamp: new Date(binKey * intervalMinutes * 60 * 1000),
        count,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private handleActivityRecorded(payload: any): void {
    const activity = payload as ActivityEvent;
    if (!this.activities.find((a) => a.id === activity.id)) {
      this.activities.push(activity);

      if (!this.activityIndex.has(activity.resourceId)) {
        this.activityIndex.set(activity.resourceId, []);
      }
      this.activityIndex.get(activity.resourceId)!.push(activity);

      if (!this.userActivityIndex.has(activity.userId)) {
        this.userActivityIndex.set(activity.userId, []);
      }
      this.userActivityIndex.get(activity.userId)!.push(activity);
    }
  }

  clearOldActivities(daysOld: number = COLLABORATION_CONFIG.ACTIVITY_RETENTION_DAYS): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const beforeLength = this.activities.length;
    this.activities = this.activities.filter((a) => a.timestamp >= cutoffDate);

    this.activityIndex.forEach((activities, resourceId) => {
      this.activityIndex.set(
        resourceId,
        activities.filter((a) => a.timestamp >= cutoffDate),
      );
    });

    this.userActivityIndex.forEach((activities, userId) => {
      this.userActivityIndex.set(
        userId,
        activities.filter((a) => a.timestamp >= cutoffDate),
      );
    });

    this.emit('activities:pruned', { removed: beforeLength - this.activities.length });
  }

  exportActivities(incidentId: string): string {
    const activities = this.activities.filter((a) => a.incidentId === incidentId);
    return JSON.stringify(activities, null, 2);
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
