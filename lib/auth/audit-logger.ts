import { query } from '@/lib/db';
import crypto from 'crypto';

export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.token_issued'
  | 'auth.token_revoked'
  | 'auth.token_refreshed'
  | 'auth.mfa_enabled'
  | 'auth.mfa_disabled'
  | 'auth.mfa_verified'
  | 'apikey.created'
  | 'apikey.revoked'
  | 'apikey.used'
  | 'apikey.rotated'
  | 'oauth.authorization_granted'
  | 'oauth.authorization_revoked'
  | 'oauth.client_authenticated'
  | 'scope.permission_checked'
  | 'scope.permission_denied'
  | 'session.created'
  | 'session.terminated'
  | 'ipwhitelist.added'
  | 'ipwhitelist.removed'
  | 'ratelimit.threshold_exceeded'
  | 'security.suspicious_activity'
  | 'admin.user_added'
  | 'admin.user_removed'
  | 'admin.role_changed';

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  userId?: number;
  clientId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  mfaRequired?: boolean;
}

export class AuditLogger {
  /**
   * Log an authentication event
   */
  async logAuthEvent(
    eventType: AuditEventType,
    userId: number | undefined,
    action: string,
    status: 'success' | 'failure',
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      eventType,
      userId,
      action,
      status,
      details,
      ipAddress,
      userAgent,
      severity: status === 'failure' ? 'high' : 'low',
    });
  }

  /**
   * Log an API key event
   */
  async logApiKeyEvent(
    eventType: AuditEventType,
    userId: number,
    keyId: string,
    action: string,
    status: 'success' | 'failure',
    details?: Record<string, unknown>,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType,
      userId,
      resourceType: 'api_key',
      resourceId: keyId,
      action,
      status,
      details,
      ipAddress,
      severity: status === 'failure' ? 'medium' : 'low',
    });
  }

  /**
   * Log an OAuth event
   */
  async logOAuthEvent(
    eventType: AuditEventType,
    userId: number,
    clientId: string,
    action: string,
    status: 'success' | 'failure',
    details?: Record<string, unknown>,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType,
      userId,
      clientId,
      action,
      status,
      details,
      ipAddress,
      severity: 'low',
    });
  }

  /**
   * Log a permission event
   */
  async logPermissionEvent(
    eventType: AuditEventType,
    userId: number,
    requiredScope: string,
    userScopes: string[],
    granted: boolean,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType,
      userId,
      action: granted ? 'permission_granted' : 'permission_denied',
      status: 'success',
      details: {
        requiredScope,
        userScopes,
      },
      ipAddress,
      severity: granted ? 'low' : 'medium',
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    action: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, unknown>,
    userId?: number,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType,
      userId,
      action,
      status: 'success',
      details,
      ipAddress,
      severity,
    });
  }

  /**
   * Core logging method
   */
  async logEvent(entry: Partial<AuditLogEntry>): Promise<string> {
    const id = crypto.randomBytes(16).toString('hex');

    try {
      await query(
        `INSERT INTO audit_logs (
          id, event_type, user_id, client_id, ip_address, user_agent,
          resource_type, resource_id, action, status, details, severity,
          mfa_required, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
        )`,
        [
          id,
          entry.eventType,
          entry.userId || null,
          entry.clientId || null,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.resourceType || null,
          entry.resourceId || null,
          entry.action,
          entry.status,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.severity || 'low',
          entry.mfaRequired || false,
        ]
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }

    return id;
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const result = await query(
        `SELECT
          id, event_type as "eventType", user_id as "userId",
          client_id as "clientId", ip_address as "ipAddress",
          user_agent as "userAgent", resource_type as "resourceType",
          resource_id as "resourceId", action, status, details,
          severity, mfa_required as "mfaRequired", created_at as "timestamp"
         FROM audit_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map((row) => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for organization
   */
  async getOrgAuditLogs(
    orgId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const result = await query(
        `SELECT
          al.id, al.event_type as "eventType", al.user_id as "userId",
          al.client_id as "clientId", al.ip_address as "ipAddress",
          al.user_agent as "userAgent", al.resource_type as "resourceType",
          al.resource_id as "resourceId", al.action, al.status, al.details,
          al.severity, al.mfa_required as "mfaRequired", al.created_at as "timestamp"
         FROM audit_logs al
         JOIN users u ON al.user_id = u.id
         WHERE u.org_id = $1
         ORDER BY al.created_at DESC
         LIMIT $2 OFFSET $3`,
        [orgId, limit, offset]
      );

      return result.rows.map((row) => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch org audit logs:', error);
      return [];
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(
    filters: {
      eventType?: AuditEventType;
      userId?: number;
      status?: 'success' | 'failure';
      severity?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    let query_text = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.eventType) {
      query_text += ` AND event_type = $${paramIdx}`;
      params.push(filters.eventType);
      paramIdx++;
    }

    if (filters.userId) {
      query_text += ` AND user_id = $${paramIdx}`;
      params.push(filters.userId);
      paramIdx++;
    }

    if (filters.status) {
      query_text += ` AND status = $${paramIdx}`;
      params.push(filters.status);
      paramIdx++;
    }

    if (filters.severity) {
      query_text += ` AND severity = $${paramIdx}`;
      params.push(filters.severity);
      paramIdx++;
    }

    if (filters.dateFrom) {
      query_text += ` AND created_at >= $${paramIdx}`;
      params.push(filters.dateFrom);
      paramIdx++;
    }

    if (filters.dateTo) {
      query_text += ` AND created_at <= $${paramIdx}`;
      params.push(filters.dateTo);
      paramIdx++;
    }

    query_text += ` ORDER BY created_at DESC LIMIT $${paramIdx}`;
    params.push(limit);

    try {
      const result = await query(query_text, params);
      return result.rows.map((row) => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : undefined,
      }));
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      return [];
    }
  }

  /**
   * Get high-severity events
   */
  async getHighSeverityEvents(
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const result = await query(
        `SELECT
          id, event_type as "eventType", user_id as "userId",
          client_id as "clientId", ip_address as "ipAddress",
          user_agent as "userAgent", resource_type as "resourceType",
          resource_id as "resourceId", action, status, details,
          severity, mfa_required as "mfaRequired", created_at as "timestamp"
         FROM audit_logs
         WHERE severity IN ('high', 'critical')
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map((row) => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch high severity events:', error);
      return [];
    }
  }
}

export const auditLogger = new AuditLogger();
