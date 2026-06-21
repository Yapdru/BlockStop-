/**
 * BlockStop Phase 28.5 - GDPR Data Deletion & Consent Handler
 * Manages GDPR data deletion requests, consent, and rights
 */

import { v4 as uuidv4 } from 'uuid';

export type GDPRRightType = 'access' | 'deletion' | 'rectification' | 'restriction' | 'portability' | 'objection';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'denied' | 'expired';

export interface GDPRRequest {
  id: string;
  userId: string;
  rightType: GDPRRightType;
  status: RequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  reason?: string;
  attachments?: string[];
  denialReason?: string;
  dataCategories?: string[];
}

export interface GDPRConsent {
  id: string;
  userId: string;
  consentType: 'processing' | 'marketing' | 'analytics' | 'profiling' | 'thirdParty';
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'web' | 'email' | 'mobile' | 'api';
}

export interface GDPRAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  category: 'consent' | 'request' | 'deletion' | 'export' | 'rectification';
  details: Record<string, any>;
  ipAddress?: string;
  status: 'success' | 'failure';
}

export class GDPRHandler {
  private requests: Map<string, GDPRRequest[]> = new Map();
  private consents: Map<string, GDPRConsent[]> = new Map();
  private auditLogs: GDPRAuditLog[] = [];
  private readonly RETENTION_DAYS = 1095; // 3 years
  private readonly REQUEST_TTL_DAYS = 30;

  /**
   * Submit GDPR request (SAR, deletion, etc)
   */
  public submitGDPRRequest(
    userId: string,
    rightType: GDPRRightType,
    reason?: string,
    dataCategories?: string[]
  ): GDPRRequest {
    const request: GDPRRequest = {
      id: `gdpr-req-${uuidv4()}`,
      userId,
      rightType,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + this.REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000),
      reason,
      dataCategories,
    };

    if (!this.requests.has(userId)) {
      this.requests.set(userId, []);
    }
    this.requests.get(userId)!.push(request);

    this.addAuditLog(userId, 'request', 'GDPR request submitted', {
      requestId: request.id,
      rightType,
    });

    return request;
  }

  /**
   * Get user's GDPR requests
   */
  public getUserRequests(userId: string): GDPRRequest[] {
    return this.requests.get(userId) || [];
  }

  /**
   * Get specific GDPR request
   */
  public getRequest(requestId: string): GDPRRequest | null {
    for (const requests of this.requests.values()) {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        return request;
      }
    }
    return null;
  }

  /**
   * Process deletion request
   */
  public processDeletionRequest(requestId: string): boolean {
    const request = this.getRequest(requestId);
    if (!request || request.rightType !== 'deletion') {
      return false;
    }

    request.status = 'in_progress';
    request.completedAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days to complete

    this.addAuditLog(request.userId, 'deletion', 'Deletion request processed', {
      requestId,
      completedAt: request.completedAt,
    });

    return true;
  }

  /**
   * Complete deletion request
   */
  public completeDeletion(requestId: string, deletedDataCategories: string[] = []): boolean {
    const request = this.getRequest(requestId);
    if (!request) {
      return false;
    }

    request.status = 'completed';
    request.completedAt = new Date();

    this.addAuditLog(request.userId, 'deletion', 'Deletion completed', {
      requestId,
      dataCategories: deletedDataCategories,
    });

    return true;
  }

  /**
   * Deny GDPR request
   */
  public denyRequest(requestId: string, reason: string): boolean {
    const request = this.getRequest(requestId);
    if (!request) {
      return false;
    }

    request.status = 'denied';
    request.denialReason = reason;

    this.addAuditLog(request.userId, 'request', 'GDPR request denied', {
      requestId,
      reason,
    });

    return true;
  }

  /**
   * Record user consent
   */
  public recordConsent(
    userId: string,
    consentType: GDPRConsent['consentType'],
    granted: boolean,
    version: string = '1.0',
    source: GDPRConsent['source'] = 'web',
    ipAddress?: string,
    userAgent?: string
  ): GDPRConsent {
    const consent: GDPRConsent = {
      id: `consent-${uuidv4()}`,
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      version,
      ipAddress,
      userAgent,
      source,
    };

    if (!this.consents.has(userId)) {
      this.consents.set(userId, []);
    }
    this.consents.get(userId)!.push(consent);

    this.addAuditLog(userId, 'consent', `Consent ${granted ? 'granted' : 'withdrawn'}`, {
      consentType,
      version,
    });

    return consent;
  }

  /**
   * Get user's consents
   */
  public getUserConsents(userId: string): GDPRConsent[] {
    return this.consents.get(userId) || [];
  }

  /**
   * Check if user has valid consent
   */
  public hasValidConsent(userId: string, consentType: GDPRConsent['consentType']): boolean {
    const userConsents = this.consents.get(userId) || [];
    const now = new Date();

    return userConsents.some(
      c =>
        c.consentType === consentType &&
        c.granted &&
        (!c.expiresAt || c.expiresAt > now)
    );
  }

  /**
   * Withdraw consent
   */
  public withdrawConsent(userId: string, consentType: GDPRConsent['consentType']): boolean {
    const userConsents = this.consents.get(userId);
    if (!userConsents) {
      return false;
    }

    const consent = userConsents.find(
      c => c.consentType === consentType && c.granted
    );

    if (!consent) {
      return false;
    }

    consent.granted = false;
    consent.expiresAt = new Date();

    this.addAuditLog(userId, 'consent', `Consent withdrawn: ${consentType}`, {
      consentType,
    });

    return true;
  }

  /**
   * Prepare data export for SAR (Subject Access Request)
   */
  public prepareDataExport(userId: string, requestId: string, dataCategories: string[] = []): {
    exportId: string;
    userId: string;
    dataCategories: string[];
    createdAt: Date;
    expiresAt: Date;
    status: 'ready' | 'pending';
  } {
    const request = this.getRequest(requestId);
    if (!request || request.rightType !== 'access') {
      throw new Error('Invalid request');
    }

    const exportId = `export-${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.addAuditLog(userId, 'export', 'Data export prepared', {
      exportId,
      requestId,
      dataCategories,
    });

    return {
      exportId,
      userId,
      dataCategories,
      createdAt: new Date(),
      expiresAt,
      status: 'ready',
    };
  }

  /**
   * Get audit logs for user
   */
  public getAuditLogs(
    userId?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date
  ): GDPRAuditLog[] {
    return this.auditLogs.filter(log => {
      if (userId && log.userId !== userId) return false;
      if (category && log.category !== category) return false;
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(userId?: string): {
    timestamp: Date;
    totalRequests: number;
    completedRequests: number;
    pendingRequests: number;
    totalConsents: number;
    activeConsents: number;
    auditLogEntries: number;
    dataRetentionDays: number;
  } {
    let totalRequests = 0;
    let completedRequests = 0;
    let pendingRequests = 0;

    let allRequests = Array.from(this.requests.values()).flat();
    if (userId) {
      allRequests = allRequests.filter(r => r.userId === userId);
    }

    totalRequests = allRequests.length;
    completedRequests = allRequests.filter(r => r.status === 'completed').length;
    pendingRequests = allRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

    let allConsents = Array.from(this.consents.values()).flat();
    if (userId) {
      allConsents = allConsents.filter(c => c.userId === userId);
    }

    const totalConsents = allConsents.length;
    const now = new Date();
    const activeConsents = allConsents.filter(
      c => c.granted && (!c.expiresAt || c.expiresAt > now)
    ).length;

    let auditLogEntries = this.auditLogs.length;
    if (userId) {
      auditLogEntries = this.auditLogs.filter(l => l.userId === userId).length;
    }

    return {
      timestamp: new Date(),
      totalRequests,
      completedRequests,
      pendingRequests,
      totalConsents,
      activeConsents,
      auditLogEntries,
      dataRetentionDays: this.RETENTION_DAYS,
    };
  }

  /**
   * Clean up expired records
   */
  public cleanupExpiredRecords(): {
    deletedRequests: number;
    deletedConsents: number;
    deletedAuditLogs: number;
  } {
    const now = new Date();
    let deletedRequests = 0;
    let deletedConsents = 0;
    let deletedAuditLogs = 0;

    // Clean up expired requests
    for (const [userId, requests] of this.requests) {
      const filtered = requests.filter(r => {
        if (r.expiresAt < now && r.status !== 'completed') {
          deletedRequests++;
          return false;
        }
        return true;
      });
      this.requests.set(userId, filtered);
    }

    // Clean up expired consents
    for (const [userId, consents] of this.consents) {
      const filtered = consents.filter(c => {
        if (c.expiresAt && c.expiresAt < now && !c.granted) {
          deletedConsents++;
          return false;
        }
        return true;
      });
      this.consents.set(userId, filtered);
    }

    // Clean up old audit logs (older than 3 years)
    const cutoff = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filtered = this.auditLogs.filter(log => {
      if (log.timestamp < cutoff) {
        deletedAuditLogs++;
        return false;
      }
      return true;
    });
    this.auditLogs = filtered;

    return { deletedRequests, deletedConsents, deletedAuditLogs };
  }

  /**
   * Add audit log entry
   */
  private addAuditLog(
    userId: string,
    category: GDPRAuditLog['category'],
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): void {
    const log: GDPRAuditLog = {
      id: `audit-${uuidv4()}`,
      timestamp: new Date(),
      userId,
      action,
      category,
      details,
      ipAddress,
      status: 'success',
    };

    this.auditLogs.push(log);
  }

  /**
   * Export audit trail for compliance
   */
  public exportAuditTrail(userId: string): string {
    const logs = this.getAuditLogs(userId);
    let csv = 'timestamp,action,category,details\n';

    for (const log of logs) {
      const timestamp = log.timestamp.toISOString();
      const details = JSON.stringify(log.details).replace(/"/g, '""');
      csv += `"${timestamp}","${log.action}","${log.category}","${details}"\n`;
    }

    return csv;
  }
}

export const gdprHandler = new GDPRHandler();
