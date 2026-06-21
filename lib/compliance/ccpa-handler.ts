/**
 * BlockStop Phase 28.5 - CCPA Compliance Handler
 * California Consumer Privacy Act implementation
 */

import { v4 as uuidv4 } from 'uuid';

export type CCPARightType = 'access' | 'deletion' | 'opt_out' | 'correction';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'denied' | 'expired';

export interface CCPARequest {
  id: string;
  consumerId: string;
  rightType: CCPARightType;
  status: RequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  expiresAt: Date;
  reason?: string;
  denialReason?: string;
  categories?: string[];
}

export interface CCPAOptOut {
  id: string;
  consumerId: string;
  optOutType: 'sale' | 'sharing' | 'profiling';
  status: 'active' | 'revoked';
  effectiveDate: Date;
  revokedDate?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CCPAAuditLog {
  id: string;
  timestamp: Date;
  consumerId: string;
  action: string;
  category: 'request' | 'opt_out' | 'verification' | 'denial' | 'deletion';
  details: Record<string, any>;
  ipAddress?: string;
  status: 'success' | 'failure';
}

export class CCPAHandler {
  private requests: Map<string, CCPARequest[]> = new Map();
  private optOuts: Map<string, CCPAOptOut[]> = new Map();
  private auditLogs: CCPAAuditLog[] = [];
  private readonly REQUEST_TTL_DAYS = 45;
  private readonly RETENTION_DAYS = 365; // 1 year

  /**
   * Submit CCPA consumer request
   */
  public submitConsumerRequest(
    consumerId: string,
    rightType: CCPARightType,
    reason?: string,
    categories?: string[]
  ): CCPARequest {
    const request: CCPARequest = {
      id: `ccpa-req-${uuidv4()}`,
      consumerId,
      rightType,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + this.REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000),
      reason,
      categories,
    };

    if (!this.requests.has(consumerId)) {
      this.requests.set(consumerId, []);
    }
    this.requests.get(consumerId)!.push(request);

    this.addAuditLog(consumerId, 'request', 'CCPA request submitted', {
      requestId: request.id,
      rightType,
    });

    return request;
  }

  /**
   * Verify consumer identity
   */
  public verifyConsumerIdentity(requestId: string, verificationMethod: string = 'email'): boolean {
    const request = this.getRequest(requestId);
    if (!request) {
      return false;
    }

    request.verifiedAt = new Date();
    request.status = 'in_progress';

    this.addAuditLog(request.consumerId, 'verification', 'Consumer identity verified', {
      requestId,
      method: verificationMethod,
    });

    return true;
  }

  /**
   * Get consumer requests
   */
  public getConsumerRequests(consumerId: string): CCPARequest[] {
    return this.requests.get(consumerId) || [];
  }

  /**
   * Get specific request
   */
  public getRequest(requestId: string): CCPARequest | null {
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

    this.addAuditLog(request.consumerId, 'deletion', 'Deletion request processed', {
      requestId,
    });

    return true;
  }

  /**
   * Complete deletion request
   */
  public completeDeletion(requestId: string, deletedCategories: string[] = []): boolean {
    const request = this.getRequest(requestId);
    if (!request) {
      return false;
    }

    request.status = 'completed';
    request.completedAt = new Date();

    this.addAuditLog(request.consumerId, 'deletion', 'Deletion completed', {
      requestId,
      categories: deletedCategories,
    });

    return true;
  }

  /**
   * Deny CCPA request
   */
  public denyRequest(requestId: string, reason: string): boolean {
    const request = this.getRequest(requestId);
    if (!request) {
      return false;
    }

    request.status = 'denied';
    request.denialReason = reason;

    this.addAuditLog(request.consumerId, 'denial', 'CCPA request denied', {
      requestId,
      reason,
    });

    return true;
  }

  /**
   * Record opt-out request
   */
  public recordOptOut(
    consumerId: string,
    optOutType: CCPAOptOut['optOutType'],
    ipAddress?: string,
    userAgent?: string
  ): CCPAOptOut {
    const optOut: CCPAOptOut = {
      id: `optout-${uuidv4()}`,
      consumerId,
      optOutType,
      status: 'active',
      effectiveDate: new Date(),
      ipAddress,
      userAgent,
    };

    if (!this.optOuts.has(consumerId)) {
      this.optOuts.set(consumerId, []);
    }
    this.optOuts.get(consumerId)!.push(optOut);

    this.addAuditLog(consumerId, 'opt_out', `Opted out of ${optOutType}`, {
      optOutType,
    });

    return optOut;
  }

  /**
   * Check if consumer opted out
   */
  public hasOptedOut(consumerId: string, optOutType: CCPAOptOut['optOutType']): boolean {
    const optOuts = this.optOuts.get(consumerId) || [];
    return optOuts.some(o => o.optOutType === optOutType && o.status === 'active');
  }

  /**
   * Get consumer opt-outs
   */
  public getConsumerOptOuts(consumerId: string): CCPAOptOut[] {
    return this.optOuts.get(consumerId) || [];
  }

  /**
   * Revoke opt-out
   */
  public revokeOptOut(consumerId: string, optOutType: CCPAOptOut['optOutType']): boolean {
    const optOuts = this.optOuts.get(consumerId) || [];
    const optOut = optOuts.find(o => o.optOutType === optOutType && o.status === 'active');

    if (!optOut) {
      return false;
    }

    optOut.status = 'revoked';
    optOut.revokedDate = new Date();

    this.addAuditLog(consumerId, 'opt_out', `Opt-out revoked: ${optOutType}`, {
      optOutType,
    });

    return true;
  }

  /**
   * Prepare data access response
   */
  public prepareAccessResponse(
    consumerId: string,
    requestId: string,
    categories: string[] = []
  ): {
    responseId: string;
    consumerId: string;
    categories: string[];
    createdAt: Date;
    expiresAt: Date;
  } {
    const request = this.getRequest(requestId);
    if (!request || request.rightType !== 'access') {
      throw new Error('Invalid request');
    }

    const responseId = `response-${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // 45 days

    this.addAuditLog(consumerId, 'request', 'Data access response prepared', {
      responseId,
      requestId,
      categories,
    });

    return {
      responseId,
      consumerId,
      categories,
      createdAt: new Date(),
      expiresAt,
    };
  }

  /**
   * Get audit logs
   */
  public getAuditLogs(
    consumerId?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date
  ): CCPAAuditLog[] {
    return this.auditLogs.filter(log => {
      if (consumerId && log.consumerId !== consumerId) return false;
      if (category && log.category !== category) return false;
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Generate compliance metrics
   */
  public getComplianceMetrics(consumerId?: string): {
    timestamp: Date;
    totalRequests: number;
    completedRequests: number;
    pendingRequests: number;
    deniedRequests: number;
    avgResponseTime: number; // days
    optOuts: {
      sale: number;
      sharing: number;
      profiling: number;
    };
  } {
    let allRequests = Array.from(this.requests.values()).flat();
    if (consumerId) {
      allRequests = allRequests.filter(r => r.consumerId === consumerId);
    }

    const totalRequests = allRequests.length;
    const completedRequests = allRequests.filter(r => r.status === 'completed').length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
    const deniedRequests = allRequests.filter(r => r.status === 'denied').length;

    const completedWithTime = allRequests
      .filter(r => r.completedAt && r.requestedAt)
      .map(r => (r.completedAt!.getTime() - r.requestedAt.getTime()) / (1000 * 60 * 60 * 24));

    const avgResponseTime = completedWithTime.length > 0
      ? completedWithTime.reduce((a, b) => a + b, 0) / completedWithTime.length
      : 0;

    let allOptOuts = Array.from(this.optOuts.values()).flat();
    if (consumerId) {
      allOptOuts = allOptOuts.filter(o => o.consumerId === consumerId);
    }

    const optOuts = {
      sale: allOptOuts.filter(o => o.optOutType === 'sale' && o.status === 'active').length,
      sharing: allOptOuts.filter(o => o.optOutType === 'sharing' && o.status === 'active').length,
      profiling: allOptOuts.filter(o => o.optOutType === 'profiling' && o.status === 'active').length,
    };

    return {
      timestamp: new Date(),
      totalRequests,
      completedRequests,
      pendingRequests,
      deniedRequests,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      optOuts,
    };
  }

  /**
   * Generate CCPA notice
   */
  public generateCCPANotice(): string {
    return `
CALIFORNIA CONSUMER PRIVACY NOTICE

Your Privacy Rights:
- Right to Know: You have the right to request what personal information we collect
- Right to Delete: You can request deletion of your personal information
- Right to Opt-Out: You can opt-out of the sale or sharing of your personal information
- Right to Correct: You can request correction of inaccurate information
- Right to Non-Discrimination: We will not discriminate against you for exercising your rights

How to Exercise Your Rights:
1. Visit our privacy settings page
2. Submit a formal request through our portal
3. Call our privacy hotline
4. Email privacy@blockstop.io

We will respond to your request within 45 days.

For more information, see our full Privacy Policy.
`;
  }

  /**
   * Clean up expired records
   */
  public cleanupExpiredRecords(): {
    deletedRequests: number;
    deletedOptOuts: number;
    deletedAuditLogs: number;
  } {
    const now = new Date();
    let deletedRequests = 0;
    let deletedOptOuts = 0;
    let deletedAuditLogs = 0;

    // Clean up expired requests
    for (const [consumerId, requests] of this.requests) {
      const filtered = requests.filter(r => {
        if (r.expiresAt < now && r.status !== 'completed') {
          deletedRequests++;
          return false;
        }
        return true;
      });
      this.requests.set(consumerId, filtered);
    }

    // Clean up revoked opt-outs older than retention period
    const cutoff = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    for (const [consumerId, optOuts] of this.optOuts) {
      const filtered = optOuts.filter(o => {
        if (o.status === 'revoked' && o.revokedDate && o.revokedDate < cutoff) {
          deletedOptOuts++;
          return false;
        }
        return true;
      });
      this.optOuts.set(consumerId, filtered);
    }

    // Clean up old audit logs
    const auditCutoff = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filtered = this.auditLogs.filter(log => {
      if (log.timestamp < auditCutoff) {
        deletedAuditLogs++;
        return false;
      }
      return true;
    });
    this.auditLogs = filtered;

    return { deletedRequests, deletedOptOuts, deletedAuditLogs };
  }

  /**
   * Add audit log
   */
  private addAuditLog(
    consumerId: string,
    category: CCPAAuditLog['category'],
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): void {
    const log: CCPAAuditLog = {
      id: `audit-${uuidv4()}`,
      timestamp: new Date(),
      consumerId,
      action,
      category,
      details,
      ipAddress,
      status: 'success',
    };

    this.auditLogs.push(log);
  }
}

export const ccpaHandler = new CCPAHandler();
