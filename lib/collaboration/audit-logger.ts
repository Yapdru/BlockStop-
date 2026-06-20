import { EventEmitter } from 'events';
import { AuditLog } from './types';
import { COLLABORATION_CONFIG } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class AuditLogger extends EventEmitter {
  private logs: Map<string, AuditLog> = new Map();
  private userAuditLogs: Map<string, AuditLog[]> = new Map();
  private incidentAuditLogs: Map<string, AuditLog[]> = new Map();
  private wsManager: WebSocketManager;
  private maxLogsInMemory: number = 10000;

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
    } catch (error) {
      console.error('Failed to initialize audit logger:', error);
      throw error;
    }
  }

  logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const id = CollaborationUtils.generateAuditLogId();
    const fullLog: AuditLog = {
      ...log,
      id,
      timestamp: new Date(),
    };

    this.logs.set(id, fullLog);

    if (!this.userAuditLogs.has(log.userId)) {
      this.userAuditLogs.set(log.userId, []);
    }
    this.userAuditLogs.get(log.userId)!.push(fullLog);

    if (!this.incidentAuditLogs.has(log.incidentId)) {
      this.incidentAuditLogs.set(log.incidentId, []);
    }
    this.incidentAuditLogs.get(log.incidentId)!.push(fullLog);

    if (this.logs.size > this.maxLogsInMemory) {
      const firstKey = this.logs.keys().next().value;
      this.logs.delete(firstKey);
    }

    this.emit('audit:logged', fullLog);
    return fullLog;
  }

  logCreate(userId: string, username: string, incidentId: string, resourceType: string, resourceId: string, ipAddress: string, userAgent: string): AuditLog {
    return this.logAction({
      userId,
      username,
      incidentId,
      action: 'create',
      resourceType,
      resourceId,
      changes: { before: null, after: {} },
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  logUpdate(
    userId: string,
    username: string,
    incidentId: string,
    resourceType: string,
    resourceId: string,
    before: any,
    after: any,
    ipAddress: string,
    userAgent: string,
  ): AuditLog {
    return this.logAction({
      userId,
      username,
      incidentId,
      action: 'update',
      resourceType,
      resourceId,
      changes: { before, after },
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  logDelete(userId: string, username: string, incidentId: string, resourceType: string, resourceId: string, ipAddress: string, userAgent: string): AuditLog {
    return this.logAction({
      userId,
      username,
      incidentId,
      action: 'delete',
      resourceType,
      resourceId,
      changes: { before: {}, after: null },
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  logAccess(userId: string, username: string, incidentId: string, resourceType: string, resourceId: string, ipAddress: string, userAgent: string): AuditLog {
    return this.logAction({
      userId,
      username,
      incidentId,
      action: 'access',
      resourceType,
      resourceId,
      changes: { before: null, after: null },
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  logFailure(
    userId: string,
    username: string,
    incidentId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    errorMessage: string,
    ipAddress: string,
    userAgent: string,
  ): AuditLog {
    return this.logAction({
      userId,
      username,
      incidentId,
      action,
      resourceType,
      resourceId,
      changes: { before: null, after: null },
      ipAddress,
      userAgent,
      status: 'failure',
      errorMessage,
    });
  }

  getLog(logId: string): AuditLog | undefined {
    return this.logs.get(logId);
  }

  getUserAuditLogs(userId: string, limit: number = 100): AuditLog[] {
    return (this.userAuditLogs.get(userId) || []).slice(-limit);
  }

  getIncidentAuditLogs(incidentId: string, limit: number = 100): AuditLog[] {
    return (this.incidentAuditLogs.get(incidentId) || []).slice(-limit);
  }

  getAuditsByAction(action: string, limit: number = 50): AuditLog[] {
    return Array.from(this.logs.values())
      .filter((l) => l.action === action)
      .slice(-limit);
  }

  getAuditsByResourceType(resourceType: string, limit: number = 50): AuditLog[] {
    return Array.from(this.logs.values())
      .filter((l) => l.resourceType === resourceType)
      .slice(-limit);
  }

  getFailedAudits(limit: number = 50): AuditLog[] {
    return Array.from(this.logs.values())
      .filter((l) => l.status === 'failure')
      .slice(-limit);
  }

  getAuditsByTimeRange(incidentId: string, startDate: Date, endDate: Date): AuditLog[] {
    return (this.incidentAuditLogs.get(incidentId) || []).filter(
      (l) => l.timestamp >= startDate && l.timestamp <= endDate,
    );
  }

  getResourceAuditTrail(incidentId: string, resourceId: string): AuditLog[] {
    return (this.incidentAuditLogs.get(incidentId) || []).filter((l) => l.resourceId === resourceId);
  }

  getUserActivitySummary(userId: string): {
    totalActions: number;
    actionsByType: Record<string, number>;
    failureCount: number;
    lastActive: Date | null;
  } {
    const logs = this.getUserAuditLogs(userId);
    const byType: Record<string, number> = {};
    let failures = 0;
    let lastActive: Date | null = null;

    logs.forEach((l) => {
      byType[l.action] = (byType[l.action] || 0) + 1;
      if (l.status === 'failure') failures++;
      if (!lastActive || l.timestamp > lastActive) lastActive = l.timestamp;
    });

    return {
      totalActions: logs.length,
      actionsByType: byType,
      failureCount: failures,
      lastActive,
    };
  }

  getIncidentAuditSummary(incidentId: string): {
    totalAudits: number;
    byUser: Record<string, number>;
    byAction: Record<string, number>;
    failureCount: number;
  } {
    const logs = this.getIncidentAuditLogs(incidentId);
    const byUser: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    let failures = 0;

    logs.forEach((l) => {
      byUser[l.userId] = (byUser[l.userId] || 0) + 1;
      byAction[l.action] = (byAction[l.action] || 0) + 1;
      if (l.status === 'failure') failures++;
    });

    return {
      totalAudits: logs.length,
      byUser,
      byAction,
      failureCount: failures,
    };
  }

  detectAnomalies(userId: string): AuditLog[] {
    const logs = this.getUserAuditLogs(userId, 100);
    const recentFailures = logs.filter((l) => l.status === 'failure');
    const oneHourAgo = new Date(Date.now() - 3600000);

    return recentFailures.filter((l) => l.timestamp > oneHourAgo);
  }

  clearOldLogs(daysOld: number = COLLABORATION_CONFIG.AUDIT_LOG_RETENTION_DAYS): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const idsToDelete: string[] = [];
    this.logs.forEach((log, id) => {
      if (log.timestamp < cutoffDate) {
        idsToDelete.push(id);
      }
    });

    idsToDelete.forEach((id) => {
      this.logs.delete(id);
    });

    this.userAuditLogs.forEach((logs) => {
      const beforeLength = logs.length;
      const filtered = logs.filter((l) => l.timestamp >= cutoffDate);
      logs.length = 0;
      logs.push(...filtered);
    });

    this.incidentAuditLogs.forEach((logs) => {
      const filtered = logs.filter((l) => l.timestamp >= cutoffDate);
      logs.length = 0;
      logs.push(...filtered);
    });

    this.emit('audit:pruned', { removed: idsToDelete.length });
  }

  exportAuditLog(incidentId: string, format: 'json' | 'csv' = 'json'): string {
    const logs = this.getIncidentAuditLogs(incidentId);

    if (format === 'csv') {
      const headers = ['ID', 'User', 'Action', 'Resource Type', 'Status', 'Timestamp'];
      const rows = logs.map((l) => [l.id, l.userId, l.action, l.resourceType, l.status, l.timestamp.toISOString()]);
      return [headers, ...rows].map((r) => r.join(',')).join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
