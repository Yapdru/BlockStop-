/**
 * Access Log Collector - Collects authentication and access logs for compliance evidence
 */

import { EvidenceItem, EvidenceType } from '../../compliance/types/compliance-types';

export interface AccessLog {
  userId: string;
  action: 'LOGIN' | 'LOGOUT' | 'FILE_ACCESS' | 'PERMISSION_CHANGE' | 'ADMIN_ACTION';
  resource?: string;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  details?: Record<string, unknown>;
}

export class AccessLogCollector {
  private logs: Map<string, AccessLog[]> = new Map();

  /**
   * Collect access log entry
   */
  collectAccessLog(
    organizationId: string,
    log: AccessLog
  ): void {
    const orgLogs = this.logs.get(organizationId) || [];
    orgLogs.push(log);
    this.logs.set(organizationId, orgLogs);
  }

  /**
   * Get access logs for time period
   */
  getLogsForPeriod(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): AccessLog[] {
    const orgLogs = this.logs.get(organizationId) || [];
    return orgLogs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Get logs by action type
   */
  getLogsByAction(
    organizationId: string,
    action: AccessLog['action']
  ): AccessLog[] {
    const orgLogs = this.logs.get(organizationId) || [];
    return orgLogs.filter((log) => log.action === action);
  }

  /**
   * Get logs for specific user
   */
  getLogsForUser(organizationId: string, userId: string): AccessLog[] {
    const orgLogs = this.logs.get(organizationId) || [];
    return orgLogs.filter((log) => log.userId === userId);
  }

  /**
   * Analyze access patterns
   */
  analyzeAccessPatterns(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): {
    totalLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    loginByHour: Map<number, number>;
    topUsers: Array<{ userId: string; count: number }>;
  } {
    const logs = this.getLogsForPeriod(organizationId, startDate, endDate);
    const loginLogs = logs.filter((l) => l.action === 'LOGIN');

    const uniqueUsers = new Set(loginLogs.map((l) => l.userId));
    const loginByHour = new Map<number, number>();
    const userLoginCount = new Map<string, number>();

    loginLogs.forEach((log) => {
      const hour = log.timestamp.getHours();
      loginByHour.set(hour, (loginByHour.get(hour) || 0) + 1);

      const count = userLoginCount.get(log.userId) || 0;
      userLoginCount.set(log.userId, count + 1);
    });

    const topUsers = Array.from(userLoginCount.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const failedLogins = loginLogs.filter((l) => l.status === 'FAILURE').length;

    return {
      totalLogins: loginLogs.length,
      failedLogins,
      uniqueUsers: uniqueUsers.size,
      loginByHour,
      topUsers,
    };
  }

  /**
   * Generate evidence item from access logs
   */
  generateAccessLogsEvidence(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    controlIds: string[]
  ): EvidenceItem {
    const logs = this.getLogsForPeriod(organizationId, startDate, endDate);
    const analysis = this.analyzeAccessPatterns(organizationId, startDate, endDate);

    return {
      id: `evidence-access-${Date.now()}`,
      controlId: controlIds[0] || '',
      type: EvidenceType.AUDIT_LOG,
      title: 'Access Control Audit Logs',
      description: `Access logs for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
      location: 'Audit Log System',
      uploadedBy: 'system',
      uploadedAt: new Date(),
      isValid: true,
      linkedControls: controlIds,
      relatedEvidence: [],
    };
  }

  /**
   * Detect anomalies in access logs
   */
  detectAnomalies(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Array<{
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    evidence: AccessLog[];
  }> {
    const logs = this.getLogsForPeriod(organizationId, startDate, endDate);
    const anomalies: Array<{
      type: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
      evidence: AccessLog[];
    }> = [];

    // Detect failed login attempts
    const failedLogins = logs.filter(
      (l) => l.action === 'LOGIN' && l.status === 'FAILURE'
    );
    const failureByUser = new Map<string, AccessLog[]>();
    failedLogins.forEach((log) => {
      const userLogs = failureByUser.get(log.userId) || [];
      userLogs.push(log);
      failureByUser.set(log.userId, userLogs);
    });

    failureByUser.forEach((userLogs, userId) => {
      if (userLogs.length > 5) {
        anomalies.push({
          type: 'EXCESSIVE_FAILED_LOGINS',
          severity: 'HIGH',
          description: `User ${userId} has ${userLogs.length} failed login attempts`,
          evidence: userLogs,
        });
      }
    });

    // Detect unusual access times (outside business hours)
    const unusualAccess = logs.filter((l) => {
      const hour = l.timestamp.getHours();
      const day = l.timestamp.getDay();
      return (hour < 6 || hour > 22) && day !== 0 && day !== 6;
    });

    if (unusualAccess.length > logs.length * 0.1) {
      anomalies.push({
        type: 'UNUSUAL_ACCESS_TIMES',
        severity: 'MEDIUM',
        description: `${unusualAccess.length} accesses outside business hours`,
        evidence: unusualAccess.slice(0, 10),
      });
    }

    return anomalies;
  }

  /**
   * Export access logs
   */
  exportAccessLogs(
    organizationId: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): string {
    const orgLogs = this.logs.get(organizationId) || [];

    if (format === 'JSON') {
      return JSON.stringify(orgLogs, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'userId', 'action', 'resource', 'status', 'ipAddress'];
      const rows = orgLogs.map((log) => [
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resource || '',
        log.status,
        log.ipAddress,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    }
  }

  /**
   * Clear old logs (retention policy)
   */
  clearOldLogs(organizationId: string, retentionDays: number): number {
    const orgLogs = this.logs.get(organizationId) || [];
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const beforeCount = orgLogs.length;
    const filteredLogs = orgLogs.filter((log) => log.timestamp >= cutoffDate);
    this.logs.set(organizationId, filteredLogs);

    return beforeCount - filteredLogs.length;
  }

  /**
   * Get statistics
   */
  getStatistics(organizationId: string): {
    totalLogs: number;
    logTypes: Map<string, number>;
    dateRange: { start: Date; end: Date } | null;
  } {
    const orgLogs = this.logs.get(organizationId) || [];
    const logTypes = new Map<string, number>();

    orgLogs.forEach((log) => {
      const count = logTypes.get(log.action) || 0;
      logTypes.set(log.action, count + 1);
    });

    let dateRange: { start: Date; end: Date } | null = null;
    if (orgLogs.length > 0) {
      const sorted = [...orgLogs].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      dateRange = {
        start: sorted[0].timestamp,
        end: sorted[sorted.length - 1].timestamp,
      };
    }

    return {
      totalLogs: orgLogs.length,
      logTypes,
      dateRange,
    };
  }
}

export default new AccessLogCollector();
