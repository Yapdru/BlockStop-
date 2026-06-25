/**
 * BlockAdmin Phase 31.1 - Audit Logging
 * Comprehensive audit trail for all admin actions
 */

import {
  AuditLog,
  AdminAction,
  AdminActionType,
  AdminException,
  ComplianceReport,
} from '@/types/admin';
import { AdminRolesManager } from './admin-roles';

// In-memory stores
const auditLogsStore: Map<string, AuditLog> = new Map();
const adminActionsStore: Map<string, AdminAction> = new Map();

/**
 * AuditLogger - Logs all admin actions and system events
 */
export class AuditLogger {
  /**
   * Log an admin action
   */
  static async logAction(
    adminId: string,
    adminEmail: string,
    action: AdminActionType,
    targetUserId: string | null,
    targetUserEmail: string | null,
    details: Record<string, any>,
    status: 'success' | 'failed',
    errorMessage?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminAction> {
    // Verify admin has permission to log this action
    const hasPermission = await this.adminCanPerformAction(adminId, action);
    if (!hasPermission) {
      throw new AdminException(
        'PERMISSION_DENIED',
        403,
        { message: `Admin does not have permission to perform: ${action}` }
      );
    }

    const now = new Date().toISOString();
    const actionId = this.generateId();

    const adminAction: AdminAction = {
      id: actionId,
      adminId,
      adminEmail,
      action,
      targetUserId,
      targetUserEmail,
      details,
      status,
      errorMessage: errorMessage || null,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: now,
    };

    adminActionsStore.set(actionId, adminAction);

    return adminAction;
  }

  /**
   * Log a change/modification with before/after values
   */
  static async logChange(
    adminId: string,
    adminEmail: string,
    action: AdminActionType,
    targetUserId: string | null,
    targetUserEmail: string | null,
    changes: Array<{ field: string; oldValue: any; newValue: any }>,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    // Verify admin has permission
    const hasPermission = await this.adminCanPerformAction(adminId, action);
    if (!hasPermission) {
      throw new AdminException(
        'PERMISSION_DENIED',
        403,
        { message: `Admin does not have permission to perform: ${action}` }
      );
    }

    const now = new Date().toISOString();
    const logId = this.generateId();

    const auditLog: AuditLog = {
      id: logId,
      action,
      adminId,
      adminEmail,
      targetUserId,
      targetUserEmail,
      changes,
      metadata: metadata || {},
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: now,
      status: 'success',
    };

    auditLogsStore.set(logId, auditLog);

    return auditLog;
  }

  /**
   * Get audit logs with filters
   */
  static async getAuditLogs(filters?: {
    adminId?: string;
    targetUserId?: string;
    action?: AdminActionType;
    status?: 'success' | 'failed';
    dateRange?: { from: string; to: string };
    limit?: number;
  }): Promise<AuditLog[]> {
    let logs = Array.from(auditLogsStore.values());

    if (filters?.adminId) {
      logs = logs.filter((l) => l.adminId === filters.adminId);
    }

    if (filters?.targetUserId) {
      logs = logs.filter((l) => l.targetUserId === filters.targetUserId);
    }

    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }

    if (filters?.status) {
      logs = logs.filter((l) => l.status === filters.status);
    }

    if (filters?.dateRange) {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);

      logs = logs.filter(
        (l) =>
          new Date(l.timestamp) >= fromDate &&
          new Date(l.timestamp) <= toDate
      );
    }

    // Sort by timestamp descending
    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const limit = filters?.limit || 1000;
    return logs.slice(0, limit);
  }

  /**
   * Get admin actions
   */
  static async getAdminActions(filters?: {
    adminId?: string;
    action?: AdminActionType;
    status?: 'success' | 'failed';
    dateRange?: { from: string; to: string };
    limit?: number;
  }): Promise<AdminAction[]> {
    let actions = Array.from(adminActionsStore.values());

    if (filters?.adminId) {
      actions = actions.filter((a) => a.adminId === filters.adminId);
    }

    if (filters?.action) {
      actions = actions.filter((a) => a.action === filters.action);
    }

    if (filters?.status) {
      actions = actions.filter((a) => a.status === filters.status);
    }

    if (filters?.dateRange) {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);

      actions = actions.filter(
        (a) =>
          new Date(a.timestamp) >= fromDate &&
          new Date(a.timestamp) <= toDate
      );
    }

    // Sort by timestamp descending
    actions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const limit = filters?.limit || 1000;
    return actions.slice(0, limit);
  }

  /**
   * Get action history for specific target user
   */
  static async getUserActionHistory(
    userId: string,
    limit: number = 100
  ): Promise<AdminAction[]> {
    return Array.from(adminActionsStore.values())
      .filter((a) => a.targetUserId === userId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Get admin activity summary
   */
  static async getAdminActivitySummary(adminId: string): Promise<{
    adminId: string;
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionBreakdown: Record<AdminActionType, number>;
    lastAction: AdminAction | null;
  }> {
    const actions = Array.from(adminActionsStore.values()).filter(
      (a) => a.adminId === adminId
    );

    const actionBreakdown: Record<string, number> = {};
    let successful = 0;
    let failed = 0;

    actions.forEach((action) => {
      actionBreakdown[action.action] =
        (actionBreakdown[action.action] || 0) + 1;

      if (action.status === 'success') {
        successful++;
      } else {
        failed++;
      }
    });

    const lastAction = actions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0] || null;

    return {
      adminId,
      totalActions: actions.length,
      successfulActions: successful,
      failedActions: failed,
      actionBreakdown: actionBreakdown as Record<AdminActionType, number>,
      lastAction,
    };
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(dateRange: {
    from: string;
    to: string;
  }): Promise<ComplianceReport> {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    const logs = Array.from(auditLogsStore.values()).filter(
      (l) =>
        new Date(l.timestamp) >= fromDate &&
        new Date(l.timestamp) <= toDate
    );

    const actions = Array.from(adminActionsStore.values()).filter(
      (a) =>
        new Date(a.timestamp) >= fromDate &&
        new Date(a.timestamp) <= toDate
    );

    // Count verification and payment actions
    let verifiedUsersCount = 0;
    let paymentVerifiedCount = 0;

    actions.forEach((action) => {
      if (action.action === 'user_verified') {
        verifiedUsersCount++;
      } else if (action.action === 'payment_verified') {
        paymentVerifiedCount++;
      }
    });

    const report: ComplianceReport = {
      id: this.generateId(),
      reportDate: new Date().toISOString(),
      generatedBy: 'system',
      verifiedUsersCount,
      paymentVerifiedCount,
      flaggedUsersCount: actions.filter((a) => a.action === 'user_flagged')
        .length,
      adminActionsCount: actions.length,
      loginMethodsBreakdown: {},
      privacySettingsBreakdown: {},
    };

    return report;
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(
    dateRange?: { from: string; to: string }
  ): Promise<AuditLog[]> {
    let logs = Array.from(auditLogsStore.values());

    if (dateRange) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);

      logs = logs.filter(
        (l) =>
          new Date(l.timestamp) >= fromDate &&
          new Date(l.timestamp) <= toDate
      );
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get statistics about audit logs
   */
  static async getAuditStats(): Promise<{
    totalLogs: number;
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    commonActions: Array<{ action: AdminActionType; count: number }>;
    mostActiveAdmins: Array<{ adminId: string; actionCount: number }>;
  }> {
    const logs = Array.from(auditLogsStore.values());
    const actions = Array.from(adminActionsStore.values());

    const actionCounts: Record<AdminActionType, number> = {} as any;
    const adminActionCounts: Record<string, number> = {};

    let successful = 0;
    let failed = 0;

    actions.forEach((action) => {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
      adminActionCounts[action.adminId] =
        (adminActionCounts[action.adminId] || 0) + 1;

      if (action.status === 'success') {
        successful++;
      } else {
        failed++;
      }
    });

    const commonActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action: action as AdminActionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostActiveAdmins = Object.entries(adminActionCounts)
      .map(([adminId, actionCount]) => ({ adminId, actionCount }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10);

    return {
      totalLogs: logs.length,
      totalActions: actions.length,
      successfulActions: successful,
      failedActions: failed,
      commonActions,
      mostActiveAdmins,
    };
  }

  /**
   * Search audit logs
   */
  static async searchAuditLogs(
    query: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const queryLower = query.toLowerCase();

    return Array.from(auditLogsStore.values())
      .filter(
        (log) =>
          log.action.toLowerCase().includes(queryLower) ||
          log.adminEmail.toLowerCase().includes(queryLower) ||
          (log.targetUserEmail?.toLowerCase().includes(queryLower) || false) ||
          JSON.stringify(log.changes)
            .toLowerCase()
            .includes(queryLower)
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Archive old audit logs (cleanup)
   */
  static async archiveOldLogs(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let archived = 0;

    // In production, these would be moved to archive storage
    // For now, we'll just count them
    for (const [id, log] of auditLogsStore.entries()) {
      if (new Date(log.timestamp) < cutoffDate) {
        // Mark for archival
        archived++;
      }
    }

    return archived;
  }

  /**
   * Check if an admin can perform an action
   */
  private static async adminCanPerformAction(
    adminId: string,
    action: AdminActionType
  ): Promise<boolean> {
    const admin = await AdminRolesManager.getAdminUser(adminId);
    if (!admin) {
      return false;
    }

    // Map actions to permissions
    const actionPermissions: Record<AdminActionType, string> = {
      user_created: 'manage_users',
      user_updated: 'manage_users',
      user_deleted: 'manage_users',
      user_deactivated: 'manage_users',
      user_activated: 'manage_users',
      user_verified: 'verify_users',
      user_flagged: 'manage_users',
      user_unflagged: 'manage_users',
      admin_role_assigned: 'manage_admins',
      admin_role_removed: 'manage_admins',
      verification_email_sent: 'verify_users',
      verification_email_verified: 'verify_users',
      payment_verified: 'verify_payments',
      payment_failed: 'verify_payments',
      privacy_settings_updated: 'manage_privacy_settings',
      oauth_method_added: 'manage_oauth',
      oauth_method_removed: 'manage_oauth',
      admin_password_changed: 'manage_admins',
      login_method_tracked: 'manage_oauth',
      audit_log_accessed: 'view_audit_logs',
    };

    const requiredPermission = actionPermissions[action];
    if (!requiredPermission) {
      return true; // Unknown action, allow
    }

    return admin.permissions.includes(requiredPermission) ||
      admin.role === 'super_admin'
      ? true
      : false;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private static generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export stores for testing
export { auditLogsStore, adminActionsStore };
