/**
 * BlockStop Phase 28.2 - GDPR/CCPA Compliance
 * Data export, right to be forgotten, consent management
 * Privacy controls and comprehensive audit trails
 */

import { v4 as uuidv4 } from 'uuid';

export type ConsentType = 'marketing' | 'analytics' | 'preferences' | 'essential' | 'processing';
export type DataCategory = 'personal' | 'behavioral' | 'technical' | 'financial' | 'health' | 'biometric';
export type RequestType = 'access' | 'deletion' | 'rectification' | 'restriction' | 'portability' | 'objection';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'denied' | 'expired';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  jurisdiction: 'GDPR' | 'CCPA' | 'BOTH';
  documentVersion: string;
  source: 'web' | 'mobile' | 'api' | 'email';
}

export interface DataSubject {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  organization?: string;
  country: string;
  dataCategories: DataCategory[];
  consents: ConsentRecord[];
  rightsExercised: PrivacyRight[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacyRight {
  id: string;
  type: RequestType;
  status: RequestStatus;
  dataSubjectId: string;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  description?: string;
  attachments?: string[];
  responseData?: any;
  denialReason?: string;
}

export interface DataProcessing {
  id: string;
  dataSubjectId: string;
  purposeId: string;
  purpose: string;
  category: DataCategory;
  processingMethod: 'automated' | 'manual' | 'mixed';
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interest';
  recipients?: string[];
  retentionPeriod: number; // days
  startDate: Date;
  endDate?: Date;
  securityMeasures: string[];
  thirdPartyProcessors?: string[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  dataSubjectId?: string;
  action: string;
  category: 'data_access' | 'data_modification' | 'data_deletion' | 'consent_change' | 'export' | 'breach';
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  status: 'success' | 'failure';
}

export interface DataExport {
  id: string;
  dataSubjectId: string;
  requestedAt: Date;
  completedAt?: Date;
  format: 'json' | 'csv' | 'xml' | 'pdf';
  includeCategories: DataCategory[];
  fileSize?: number;
  downloadUrl?: string;
  expiresAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'expired';
}

export interface PrivacyPolicy {
  id: string;
  version: string;
  effectiveDate: Date;
  language: string;
  jurisdiction: 'GDPR' | 'CCPA' | 'BOTH';
  dataProcessingPurposes: string[];
  retentionPolicies: Record<DataCategory, number>; // days
  rights: string[];
  contentHash: string; // for integrity verification
}

export interface DPA {
  id: string;
  processor: string;
  processorAddress: string;
  dataCategories: DataCategory[];
  processingActivities: string[];
  securityMeasures: string[];
  subProcessors: string[];
  signedDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface BreachNotification {
  id: string;
  breachDate: Date;
  discoveryDate: Date;
  description: string;
  affectedDataSubjects: number;
  affectedCategories: DataCategory[];
  likelyRisks: string[];
  mitigationMeasures: string[];
  notificationSent: boolean;
  notificationDate?: Date;
  authorities: string[];
}

export class GDPRCCPAEngine {
  private dataSubjects: Map<string, DataSubject> = new Map();
  private consents: Map<string, ConsentRecord[]> = new Map();
  private privacyRights: Map<string, PrivacyRight[]> = new Map();
  private dataProcessing: Map<string, DataProcessing[]> = new Map();
  private auditTrail: AuditTrailEntry[] = [];
  private dataExports: Map<string, DataExport[]> = new Map();
  private privacyPolicies: Map<string, PrivacyPolicy> = new Map();
  private dpas: Map<string, DPA> = new Map();
  private breachNotifications: BreachNotification[] = [];

  private readonly RETENTION_PERIODS = {
    personal: 365 * 3, // 3 years
    behavioral: 365 * 2, // 2 years
    technical: 365 * 1, // 1 year
    financial: 365 * 7, // 7 years
    health: 365 * 10, // 10 years
    biometric: 365 * 5, // 5 years
  };

  constructor() {
    this.initializeDefaultPolicy();
  }

  /**
   * Initialize default privacy policy
   */
  private initializeDefaultPolicy(): void {
    const policy: PrivacyPolicy = {
      id: 'policy-default',
      version: '1.0.0',
      effectiveDate: new Date(),
      language: 'en',
      jurisdiction: 'BOTH',
      dataProcessingPurposes: [
        'Service delivery',
        'User authentication',
        'Analytics',
        'Security',
        'Legal compliance',
      ],
      retentionPolicies: this.RETENTION_PERIODS,
      rights: [
        'Access',
        'Rectification',
        'Erasure',
        'Restrict processing',
        'Data portability',
        'Object to processing',
        'Withdraw consent',
        'Lodge a complaint',
      ],
      contentHash: this.generateHash('default-policy-v1.0.0'),
    };

    this.privacyPolicies.set(policy.id, policy);
  }

  /**
   * Register a data subject
   */
  public registerDataSubject(
    userId: string,
    email: string,
    country: string,
    firstName?: string,
    lastName?: string,
    organization?: string
  ): DataSubject {
    const id = `subject-${uuidv4()}`;
    const subject: DataSubject = {
      id,
      userId,
      firstName,
      lastName,
      email,
      organization,
      country,
      dataCategories: [],
      consents: [],
      rightsExercised: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dataSubjects.set(userId, subject);
    this.consents.set(userId, []);
    this.privacyRights.set(userId, []);
    this.dataProcessing.set(userId, []);
    this.dataExports.set(userId, []);

    this.addAuditTrailEntry(userId, 'data_access', 'Data subject registered', {
      email,
      country,
    }, 'success');

    return subject;
  }

  /**
   * Record consent
   */
  public recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    jurisdiction: 'GDPR' | 'CCPA' | 'BOTH',
    documentVersion: string,
    ipAddress?: string,
    userAgent?: string,
    source: 'web' | 'mobile' | 'api' | 'email' = 'web'
  ): ConsentRecord {
    const consent: ConsentRecord = {
      id: `consent-${uuidv4()}`,
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      ipAddress,
      userAgent,
      jurisdiction,
      documentVersion,
      source,
    };

    if (!this.consents.has(userId)) {
      this.consents.set(userId, []);
    }
    this.consents.get(userId)!.push(consent);

    const action = granted ? 'consent_granted' : 'consent_withdrawn';
    this.addAuditTrailEntry(
      userId,
      'consent_change',
      action,
      { consentType, jurisdiction },
      'success',
      ipAddress
    );

    return consent;
  }

  /**
   * Check if user has granted consent
   */
  public hasConsent(userId: string, consentType: ConsentType): boolean {
    const userConsents = this.consents.get(userId) || [];
    const now = new Date();

    const relevantConsent = userConsents.find(
      c =>
        c.consentType === consentType &&
        c.granted &&
        (!c.expiresAt || c.expiresAt > now)
    );

    return !!relevantConsent;
  }

  /**
   * Get all consents for user
   */
  public getUserConsents(userId: string): ConsentRecord[] {
    return this.consents.get(userId) || [];
  }

  /**
   * Request data subject right (GDPR/CCPA)
   */
  public requestRight(
    userId: string,
    type: RequestType,
    description?: string
  ): PrivacyRight {
    const right: PrivacyRight = {
      id: `right-${uuidv4()}`,
      type,
      status: 'pending',
      dataSubjectId: userId,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days to fulfill
      description,
    };

    if (!this.privacyRights.has(userId)) {
      this.privacyRights.set(userId, []);
    }
    this.privacyRights.get(userId)!.push(right);

    this.addAuditTrailEntry(
      userId,
      'data_access',
      `Privacy right requested: ${type}`,
      { type, description },
      'success'
    );

    return right;
  }

  /**
   * Process data access request (SAR - Subject Access Request)
   */
  public processAccessRequest(userId: string, rightId: string): DataExport | null {
    const rights = this.privacyRights.get(userId) || [];
    const right = rights.find(r => r.id === rightId);

    if (!right || right.type !== 'access') {
      return null;
    }

    const subject = this.dataSubjects.get(userId);
    if (!subject) {
      return null;
    }

    const dataExport: DataExport = {
      id: `export-${uuidv4()}`,
      dataSubjectId: userId,
      requestedAt: new Date(),
      format: 'json',
      includeCategories: subject.dataCategories,
      status: 'processing',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to download
    };

    if (!this.dataExports.has(userId)) {
      this.dataExports.set(userId, []);
    }
    this.dataExports.get(userId)!.push(dataExport);

    right.status = 'in_progress';

    this.addAuditTrailEntry(
      userId,
      'export',
      'Data export initiated',
      { format: 'json', categories: subject.dataCategories },
      'success'
    );

    return dataExport;
  }

  /**
   * Process deletion request (Right to be forgotten)
   */
  public processDeletionRequest(userId: string, rightId: string): boolean {
    const rights = this.privacyRights.get(userId) || [];
    const right = rights.find(r => r.id === rightId);

    if (!right || right.type !== 'deletion') {
      return false;
    }

    const subject = this.dataSubjects.get(userId);
    if (!subject) {
      return false;
    }

    // Archive and mark for deletion
    right.status = 'in_progress';
    right.completedAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days to complete

    // Schedule deletion of associated data
    const processing = this.dataProcessing.get(userId) || [];
    processing.forEach(p => {
      p.endDate = new Date(); // Mark as ended
    });

    this.addAuditTrailEntry(
      userId,
      'data_deletion',
      'Deletion request processed',
      { affectedCategories: subject.dataCategories },
      'success'
    );

    return true;
  }

  /**
   * Record data processing activity
   */
  public recordDataProcessing(
    userId: string,
    purpose: string,
    category: DataCategory,
    legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interest',
    processingMethod: 'automated' | 'manual' | 'mixed',
    retentionDays?: number,
    recipients?: string[],
    thirdPartyProcessors?: string[],
    securityMeasures?: string[]
  ): DataProcessing {
    const processing: DataProcessing = {
      id: `process-${uuidv4()}`,
      dataSubjectId: userId,
      purposeId: `purpose-${uuidv4()}`,
      purpose,
      category,
      processingMethod,
      legalBasis,
      recipients,
      retentionPeriod: retentionDays || this.RETENTION_PERIODS[category],
      startDate: new Date(),
      securityMeasures: securityMeasures || [
        'Encryption at rest',
        'Encryption in transit',
        'Access control',
        'Audit logging',
      ],
      thirdPartyProcessors,
    };

    if (!this.dataProcessing.has(userId)) {
      this.dataProcessing.set(userId, []);
    }
    this.dataProcessing.get(userId)!.push(processing);

    // Add to subject's data categories if not already included
    const subject = this.dataSubjects.get(userId);
    if (subject && !subject.dataCategories.includes(category)) {
      subject.dataCategories.push(category);
    }

    this.addAuditTrailEntry(
      userId,
      'data_access',
      'Data processing recorded',
      {
        purpose,
        category,
        legalBasis,
        retentionPeriod: processing.retentionPeriod,
      },
      'success'
    );

    return processing;
  }

  /**
   * Create Data Processing Agreement
   */
  public createDPA(
    processor: string,
    processorAddress: string,
    dataCategories: DataCategory[],
    processingActivities: string[],
    securityMeasures: string[],
    subProcessors?: string[]
  ): DPA {
    const dpa: DPA = {
      id: `dpa-${uuidv4()}`,
      processor,
      processorAddress,
      dataCategories,
      processingActivities,
      securityMeasures,
      subProcessors: subProcessors || [],
      signedDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    this.dpas.set(dpa.id, dpa);

    this.addAuditTrailEntry(
      undefined,
      'data_access',
      'DPA created',
      { processor, dataCategories: dataCategories.length },
      'success'
    );

    return dpa;
  }

  /**
   * Report a data breach
   */
  public reportBreach(
    breachDate: Date,
    description: string,
    affectedDataSubjects: number,
    affectedCategories: DataCategory[],
    likelyRisks: string[],
    mitigationMeasures: string[]
  ): BreachNotification {
    const notification: BreachNotification = {
      id: `breach-${uuidv4()}`,
      breachDate,
      discoveryDate: new Date(),
      description,
      affectedDataSubjects,
      affectedCategories,
      likelyRisks,
      mitigationMeasures,
      notificationSent: false,
      authorities: [],
    };

    this.breachNotifications.push(notification);

    this.addAuditTrailEntry(
      undefined,
      'breach',
      'Data breach reported',
      {
        affectedSubjects: affectedDataSubjects,
        categories: affectedCategories.length,
      },
      'success'
    );

    return notification;
  }

  /**
   * Add audit trail entry
   */
  private addAuditTrailEntry(
    dataSubjectId: string | undefined,
    category: 'data_access' | 'data_modification' | 'data_deletion' | 'consent_change' | 'export' | 'breach',
    action: string,
    details: Record<string, any>,
    status: 'success' | 'failure',
    ipAddress?: string,
    userId?: string
  ): void {
    const entry: AuditTrailEntry = {
      id: `audit-${uuidv4()}`,
      timestamp: new Date(),
      dataSubjectId,
      action,
      category,
      details,
      userId,
      ipAddress,
      status,
    };

    this.auditTrail.push(entry);

    // Keep only last 2 years of audit logs
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    const index = this.auditTrail.findIndex(e => e.timestamp < twoYearsAgo);
    if (index > 0) {
      this.auditTrail.splice(0, index);
    }
  }

  /**
   * Get audit trail
   */
  public getAuditTrail(
    dataSubjectId?: string,
    category?: string,
    startDate?: Date,
    endDate?: Date
  ): AuditTrailEntry[] {
    return this.auditTrail.filter(entry => {
      if (dataSubjectId && entry.dataSubjectId !== dataSubjectId) return false;
      if (category && entry.category !== category) return false;
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Get data subject profile
   */
  public getDataSubject(userId: string): DataSubject | undefined {
    return this.dataSubjects.get(userId);
  }

  /**
   * Get privacy rights for user
   */
  public getPrivacyRights(userId: string): PrivacyRight[] {
    return this.privacyRights.get(userId) || [];
  }

  /**
   * Get data processing records
   */
  public getDataProcessing(userId: string): DataProcessing[] {
    return this.dataProcessing.get(userId) || [];
  }

  /**
   * Export compliance report
   */
  public exportComplianceReport(jurisdiction: 'GDPR' | 'CCPA'): {
    timestamp: Date;
    jurisdiction: string;
    dataSubjectsCount: number;
    processingActivities: number;
    breaches: number;
    pendingRequests: number;
    auditEntries: number;
    policies: PrivacyPolicy[];
    dpaCount: number;
  } {
    const pendingRequests = Array.from(this.privacyRights.values())
      .flat()
      .filter(r => r.status === 'pending' || r.status === 'in_progress').length;

    const breachesInPeriod = this.breachNotifications.filter(
      b => b.discoveryDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      timestamp: new Date(),
      jurisdiction,
      dataSubjectsCount: this.dataSubjects.size,
      processingActivities: Array.from(this.dataProcessing.values()).flat().length,
      breaches: breachesInPeriod,
      pendingRequests,
      auditEntries: this.auditTrail.length,
      policies: Array.from(this.privacyPolicies.values()),
      dpaCount: this.dpas.size,
    };
  }

  /**
   * Generate hash for data integrity
   */
  private generateHash(data: string): string {
    // Simple hash implementation (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get privacy policy
   */
  public getPrivacyPolicy(version?: string): PrivacyPolicy | undefined {
    if (version) {
      return Array.from(this.privacyPolicies.values()).find(p => p.version === version);
    }
    // Return latest
    const policies = Array.from(this.privacyPolicies.values());
    return policies.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];
  }

  /**
   * Get DPA
   */
  public getDPA(dpaId: string): DPA | undefined {
    return this.dpas.get(dpaId);
  }

  /**
   * List all DPAs
   */
  public listDPAs(): DPA[] {
    return Array.from(this.dpas.values());
  }

  /**
   * Get breach notifications
   */
  public getBreachNotifications(resolved: boolean = false): BreachNotification[] {
    return this.breachNotifications.filter(b => b.notificationSent === resolved);
  }
}
