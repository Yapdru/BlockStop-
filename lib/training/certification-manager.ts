/**
 * BlockStop Phase 29.5 - Certification Manager
 * Issue, track, and manage user certifications
 */

import { EventEmitter } from 'events';

export interface CertificateIssue {
  issueId: string;
  studentId: string;
  certificateType: string;
  issuedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
  signedBy: string;
  status: 'issued' | 'pending' | 'expired' | 'revoked';
}

export interface CertificationRecord {
  recordId: string;
  studentId: string;
  courseId?: string;
  certificationName: string;
  issuer: string;
  issuedDate: Date;
  expirationDate?: Date;
  verificationUrl: string;
  pdfUrl: string;
  publiclyVisible: boolean;
  skills: string[];
  status: 'active' | 'expired' | 'revoked' | 'suspended';
}

export interface VerificationResult {
  valid: boolean;
  certificateId: string;
  studentName: string;
  certificationType: string;
  issuedDate: Date;
  expirationDate?: Date;
  verificationDate: Date;
  issuer: string;
}

export interface BulkIssuanceRequest {
  requestId: string;
  courseId: string;
  studentIds: string[];
  certificationType: string;
  createdAt: Date;
  processedAt?: Date;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class CertificationManager extends EventEmitter {
  private certificates: Map<string, CertificateIssue> = new Map();
  private records: Map<string, CertificationRecord> = new Map();
  private verificationCodes: Map<string, CertificateIssue> = new Map();
  private bulkRequests: Map<string, BulkIssuanceRequest> = new Map();

  constructor() {
    super();
    this.startExpirationChecker();
  }

  issueCertificate(
    studentId: string,
    certificationType: string,
    expirationMonths?: number,
    courseId?: string
  ): CertificationRecord {
    const verificationCode = this.generateVerificationCode();

    const certificateIssue: CertificateIssue = {
      issueId: `issue-${Date.now()}`,
      studentId,
      certificateType: certificationType,
      issuedAt: new Date(),
      expiresAt: expirationMonths
        ? new Date(Date.now() + expirationMonths * 30 * 24 * 60 * 60 * 1000)
        : undefined,
      verificationCode,
      signedBy: 'BlockStop Academy',
      status: 'issued'
    };

    const record: CertificationRecord = {
      recordId: `cert-${Date.now()}-${Math.random()}`,
      studentId,
      courseId,
      certificationName: certificationType,
      issuer: 'BlockStop Academy',
      issuedDate: new Date(),
      expirationDate: certificateIssue.expiresAt,
      verificationUrl: `https://verify.blockstop.io/${verificationCode}`,
      pdfUrl: `https://certificates.blockstop.io/${verificationCode}.pdf`,
      publiclyVisible: false,
      skills: [],
      status: 'active'
    };

    this.certificates.set(certificateIssue.issueId, certificateIssue);
    this.records.set(record.recordId, record);
    this.verificationCodes.set(verificationCode, certificateIssue);

    this.emit('certificate-issued', record);

    return record;
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  verifyCertificate(verificationCode: string): VerificationResult | null {
    const issue = this.verificationCodes.get(verificationCode);
    if (!issue) return null;

    const record = Array.from(this.records.values()).find(r => r.studentId === issue.studentId);

    return {
      valid: issue.status === 'issued',
      certificateId: issue.issueId,
      studentName: `Student ${issue.studentId}`,
      certificationType: issue.certificateType,
      issuedDate: issue.issuedAt,
      expirationDate: issue.expiresAt,
      verificationDate: new Date(),
      issuer: issue.signedBy
    };
  }

  getCertificates(studentId: string): CertificationRecord[] {
    return Array.from(this.records.values()).filter(r => r.studentId === studentId);
  }

  revokeCertificate(recordId: string, reason: string): void {
    const record = this.records.get(recordId);
    if (record) {
      record.status = 'revoked';
      this.emit('certificate-revoked', { recordId, reason });
    }
  }

  renewCertification(recordId: string, months: number): CertificationRecord {
    const oldRecord = this.records.get(recordId);
    if (!oldRecord) throw new Error('Certificate not found');

    return this.issueCertificate(
      oldRecord.studentId,
      oldRecord.certificationName,
      months,
      oldRecord.courseId
    );
  }

  createBulkIssuance(courseId: string, studentIds: string[], certificationType: string): BulkIssuanceRequest {
    const request: BulkIssuanceRequest = {
      requestId: `bulk-${Date.now()}`,
      courseId,
      studentIds,
      certificationType,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0,
      status: 'pending'
    };

    this.bulkRequests.set(request.requestId, request);
    this.processBulkIssuance(request);

    return request;
  }

  private processBulkIssuance(request: BulkIssuanceRequest): void {
    request.status = 'processing';

    setTimeout(() => {
      request.studentIds.forEach(studentId => {
        try {
          this.issueCertificate(studentId, request.certificationType, 12, request.courseId);
          request.successCount++;
        } catch {
          request.failureCount++;
        }
      });

      request.status = 'completed';
      request.processedAt = new Date();

      this.emit('bulk-issuance-completed', request);
    }, 1000);
  }

  private startExpirationChecker(): void {
    setInterval(() => {
      Array.from(this.records.values()).forEach(record => {
        if (record.expirationDate && new Date() > record.expirationDate) {
          record.status = 'expired';
          this.emit('certificate-expired', record);
        } else if (record.expirationDate) {
          const daysLeft = Math.floor((record.expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
          if (daysLeft === 30 || daysLeft === 7 || daysLeft === 1) {
            this.emit('certificate-expiration-warning', { record, daysLeft });
          }
        }
      });
    }, 24 * 60 * 60 * 1000);
  }

  getStatistics(): Record<string, any> {
    return {
      totalCertificates: this.records.size,
      activeCertificates: Array.from(this.records.values()).filter(r => r.status === 'active').length,
      expiredCertificates: Array.from(this.records.values()).filter(r => r.status === 'expired').length,
      revokedCertificates: Array.from(this.records.values()).filter(r => r.status === 'revoked').length
    };
  }
}

export default CertificationManager;
