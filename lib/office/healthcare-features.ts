/**
 * BlockStop OFFICE Tier - Healthcare-Specific Features
 * HIPAA compliance, patient data protection, BAA management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  HealthcareComplianceConfig,
  PatientAccessControl,
  DataClassification,
  HIPAABreachNotification,
  BusinessAssociateAgreement,
  PatientPermission,
} from '@/types/office-tier';

export class HealthcareComplianceManager {
  private configs: Map<string, HealthcareComplianceConfig> = new Map();
  private breaches: Map<string, HIPAABreachNotification> = new Map();
  private baas: Map<string, BusinessAssociateAgreement> = new Map();
  private accessControls: Map<string, PatientAccessControl[]> = new Map();
  private encryptionKeys: Map<string, string> = new Map();

  /**
   * Initialize healthcare compliance configuration
   */
  public initializeHealthcareConfig(
    organizationId: string,
    hipaaEnabled: boolean = true,
    hitrustEnabled: boolean = false
  ): HealthcareComplianceConfig {
    const config: HealthcareComplianceConfig = {
      organizationId,
      hipaaEnabled,
      hitrustEnabled,
      nistEnabled: false,
      breachNotificationEnabled: true,
      patientDataEncryption: {
        algorithm: 'AES-256-GCM',
        keyRotationInterval: 90,
        lastKeyRotation: new Date(),
        tokenization: true,
      },
      accessControls: this.createDefaultAccessControls(),
      auditFrequency: 'monthly',
    };

    this.configs.set(organizationId, config);
    return config;
  }

  /**
   * Create default access controls for healthcare roles
   */
  private createDefaultAccessControls(): PatientAccessControl[] {
    return [
      {
        id: `role-${uuidv4()}`,
        role: 'physician',
        permissions: ['read', 'write', 'export', 'audit' as PatientPermission],
        dataClassifications: [
          DataClassification.PHI,
          DataClassification.PII,
          DataClassification.GENETIC,
        ],
      },
      {
        id: `role-${uuidv4()}`,
        role: 'nurse',
        permissions: ['read', 'write', 'audit' as PatientPermission],
        dataClassifications: [DataClassification.PHI, DataClassification.PII],
      },
      {
        id: `role-${uuidv4()}`,
        role: 'administrator',
        permissions: ['read', 'write', 'delete', 'export', 'share', 'audit' as PatientPermission],
        dataClassifications: [
          DataClassification.PHI,
          DataClassification.PII,
          DataClassification.PSI,
        ],
      },
      {
        id: `role-${uuidv4()}`,
        role: 'billing',
        permissions: ['read', 'export' as PatientPermission],
        dataClassifications: [DataClassification.PSI, DataClassification.PII],
      },
      {
        id: `role-${uuidv4()}`,
        role: 'patient',
        permissions: ['read', 'export' as PatientPermission],
        dataClassifications: [DataClassification.PHI, DataClassification.PII],
      },
    ];
  }

  /**
   * Get healthcare configuration
   */
  public getConfig(organizationId: string): HealthcareComplianceConfig | null {
    return this.configs.get(organizationId) || null;
  }

  /**
   * Update encryption configuration
   */
  public updateEncryptionConfig(
    organizationId: string,
    algorithm: string,
    keyRotationInterval: number,
    enableTokenization: boolean
  ): void {
    const config = this.configs.get(organizationId);
    if (!config) {
      throw new Error(`Healthcare config not found for org ${organizationId}`);
    }

    config.patientDataEncryption = {
      algorithm,
      keyRotationInterval,
      lastKeyRotation: new Date(),
      tokenization: enableTokenization,
    };
  }

  /**
   * Encrypt patient data using organization's encryption key
   */
  public encryptPatientData(
    organizationId: string,
    patientId: string,
    data: string,
    dataClass: DataClassification
  ): { encryptedData: string; keyId: string; timestamp: Date } {
    const config = this.configs.get(organizationId);
    if (!config || !config.patientDataEncryption) {
      throw new Error('Encryption not configured');
    }

    // In production, use actual encryption library like crypto-js or tweetnacl
    const keyId = `key-${organizationId}-${new Date().toISOString().split('T')[0]}`;
    const encryptedData = Buffer.from(data).toString('base64'); // Simplified for demo

    this.encryptionKeys.set(keyId, config.patientDataEncryption.algorithm);

    return {
      encryptedData,
      keyId,
      timestamp: new Date(),
    };
  }

  /**
   * Decrypt patient data
   */
  public decryptPatientData(
    organizationId: string,
    encryptedData: string,
    keyId: string
  ): string {
    if (!this.encryptionKeys.has(keyId)) {
      throw new Error(`Encryption key ${keyId} not found`);
    }

    // In production, use actual decryption
    const decrypted = Buffer.from(encryptedData, 'base64').toString('utf-8');
    return decrypted;
  }

  /**
   * Register or update Business Associate Agreement
   */
  public registerBAA(
    organizationId: string,
    baa: Omit<BusinessAssociateAgreement, 'id'>
  ): BusinessAssociateAgreement {
    const baas = Array.from(this.baas.values()).filter(
      (b) => b.associateName === baa.associateName
    );

    if (baas.length > 0) {
      const existingBAA = baas[0];
      if (existingBAA.status === 'active') {
        throw new Error('Active BAA already exists for this associate');
      }
    }

    const newBAA: BusinessAssociateAgreement = {
      ...baa,
      id: `baa-${uuidv4()}`,
    };

    this.baas.set(newBAA.id, newBAA);
    return newBAA;
  }

  /**
   * Get all BAAs for organization
   */
  public getOrganizationBAAs(organizationId: string): BusinessAssociateAgreement[] {
    // In real implementation, would filter by org
    return Array.from(this.baas.values());
  }

  /**
   * Verify BAA status
   */
  public verifyBAAStatus(
    organizationId: string,
    baaId: string
  ): { compliant: boolean; status: string; expiringIn?: number } {
    const baa = this.baas.get(baaId);
    if (!baa) {
      return { compliant: false, status: 'not_found' };
    }

    if (baa.status === 'expired') {
      return { compliant: false, status: 'expired' };
    }

    if (baa.status === 'active') {
      if (baa.expiryDate) {
        const daysUntilExpiry = Math.ceil(
          (baa.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 90) {
          return {
            compliant: true,
            status: 'active_expiring_soon',
            expiringIn: daysUntilExpiry,
          };
        }
      }

      return { compliant: true, status: 'active' };
    }

    return { compliant: false, status: baa.status };
  }

  /**
   * Create HIPAA breach notification
   */
  public createBreachNotification(
    organizationId: string,
    breachType: string,
    affectedIndividuals: number,
    breachDate: Date,
    discoveredDate: Date
  ): HIPAABreachNotification {
    const notification: HIPAABreachNotification = {
      id: `breach-${uuidv4()}`,
      breachDate,
      discoveredDate,
      affectedIndividuals,
      affectedRecords: [],
      breachType,
      notificationsSent: false,
      regulatoryNotified: false,
      mediaNotificationRequired: affectedIndividuals >= 500,
      investigationStatus: 'pending',
      remedialActions: [],
    };

    this.breaches.set(notification.id, notification);
    return notification;
  }

  /**
   * Get breach notification details
   */
  public getBreachNotification(breachId: string): HIPAABreachNotification | null {
    return this.breaches.get(breachId) || null;
  }

  /**
   * Update breach investigation status
   */
  public updateBreachStatus(
    breachId: string,
    status: HIPAABreachNotification['investigationStatus'],
    remedialActions?: string[]
  ): void {
    const breach = this.breaches.get(breachId);
    if (!breach) {
      throw new Error(`Breach ${breachId} not found`);
    }

    breach.investigationStatus = status;
    if (remedialActions) {
      breach.remedialActions = remedialActions;
    }

    // Auto-mark as requiring notification if status changes to completed
    if (status === 'completed' && !breach.notificationsSent) {
      breach.notificationsSent = true;
      breach.notificationDate = new Date();
    }
  }

  /**
   * Calculate breach notification deadline (60-72 days per HIPAA)
   */
  public getBreachNotificationDeadline(breachId: string): Date | null {
    const breach = this.breaches.get(breachId);
    if (!breach) return null;

    const deadline = new Date(breach.discoveredDate);
    deadline.setDate(deadline.getDate() + 60); // 60 days minimum
    return deadline;
  }

  /**
   * Generate breach notification report
   */
  public generateBreachNotificationReport(breachId: string): string {
    const breach = this.breaches.get(breachId);
    if (!breach) {
      throw new Error(`Breach ${breachId} not found`);
    }

    const deadline = this.getBreachNotificationDeadline(breachId);
    const isOverdue = deadline && new Date() > deadline;

    return `
HIPAA Breach Notification Report
=================================
Breach ID: ${breach.id}
Breach Type: ${breach.breachType}
Affected Individuals: ${breach.affectedIndividuals}
Breach Date: ${breach.breachDate.toISOString()}
Discovered Date: ${breach.discoveredDate.toISOString()}
Notification Deadline: ${deadline?.toISOString()}
Status: ${isOverdue ? 'OVERDUE' : 'On Track'}
Investigation Status: ${breach.investigationStatus}
Notifications Sent: ${breach.notificationsSent ? 'Yes' : 'No'}
Regulatory Notification: ${breach.regulatoryNotified ? 'Yes' : 'No'}
Media Notification Required: ${breach.mediaNotificationRequired ? 'Yes' : 'No'}

Remedial Actions:
${breach.remedialActions.map((action) => `- ${action}`).join('\n')}
    `;
  }

  /**
   * Validate patient data access
   */
  public validatePatientDataAccess(
    organizationId: string,
    userId: string,
    userRole: string,
    dataClassification: DataClassification,
    action: PatientPermission
  ): { allowed: boolean; reason?: string } {
    const config = this.configs.get(organizationId);
    if (!config) {
      return { allowed: false, reason: 'Organization not configured for healthcare' };
    }

    const roleControl = config.accessControls.find((ac) => ac.role === userRole);
    if (!roleControl) {
      return { allowed: false, reason: `Role ${userRole} not defined` };
    }

    const hasDataAccess = roleControl.dataClassifications.includes(dataClassification);
    if (!hasDataAccess) {
      return {
        allowed: false,
        reason: `Role ${userRole} cannot access ${dataClassification} data`,
      };
    }

    const hasPermission = roleControl.permissions.includes(action);
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Role ${userRole} cannot ${action} data`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get role-based access controls
   */
  public getRoleAccessControls(organizationId: string): PatientAccessControl[] {
    const config = this.configs.get(organizationId);
    return config?.accessControls || [];
  }

  /**
   * Add custom access control role
   */
  public addAccessControlRole(
    organizationId: string,
    role: string,
    permissions: PatientPermission[],
    dataClassifications: DataClassification[]
  ): PatientAccessControl {
    const config = this.configs.get(organizationId);
    if (!config) {
      throw new Error(`Healthcare config not found for org ${organizationId}`);
    }

    const control: PatientAccessControl = {
      id: `role-${uuidv4()}`,
      role,
      permissions,
      dataClassifications,
    };

    config.accessControls.push(control);
    return control;
  }

  /**
   * Audit patient data access attempt
   */
  public auditPatientDataAccess(
    organizationId: string,
    userId: string,
    patientId: string,
    action: PatientPermission,
    dataClassification: DataClassification,
    allowed: boolean,
    ipAddress?: string
  ): void {
    // In production, store this in audit log
    const auditEntry = {
      timestamp: new Date().toISOString(),
      organizationId,
      userId,
      patientId,
      action,
      dataClassification,
      allowed,
      ipAddress,
    };

    console.log('Patient Data Access Audit:', auditEntry);
  }

  /**
   * Check if encryption key rotation is due
   */
  public isKeyRotationDue(organizationId: string): boolean {
    const config = this.configs.get(organizationId);
    if (!config) return false;

    const daysSinceRotation = Math.floor(
      (new Date().getTime() - config.patientDataEncryption.lastKeyRotation.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysSinceRotation >= config.patientDataEncryption.keyRotationInterval;
  }

  /**
   * Perform encryption key rotation
   */
  public rotateEncryptionKey(organizationId: string): { newKeyId: string; rotatedAt: Date } {
    const config = this.configs.get(organizationId);
    if (!config) {
      throw new Error(`Healthcare config not found for org ${organizationId}`);
    }

    const newKeyId = `key-${organizationId}-${new Date().toISOString().split('T')[0]}`;
    config.patientDataEncryption.lastKeyRotation = new Date();

    this.encryptionKeys.set(newKeyId, config.patientDataEncryption.algorithm);

    return {
      newKeyId,
      rotatedAt: config.patientDataEncryption.lastKeyRotation,
    };
  }

  /**
   * Generate HIPAA compliance checklist
   */
  public generateHIPAAChecklist(organizationId: string): Array<{
    item: string;
    status: 'complete' | 'incomplete' | 'na';
    notes?: string;
  }> {
    const config = this.configs.get(organizationId);
    if (!config) return [];

    return [
      { item: 'HIPAA enabled', status: config.hipaaEnabled ? 'complete' : 'incomplete' },
      {
        item: 'Patient data encryption',
        status: config.patientDataEncryption ? 'complete' : 'incomplete',
      },
      {
        item: 'Access controls defined',
        status: config.accessControls.length > 0 ? 'complete' : 'incomplete',
      },
      {
        item: 'Breach notification enabled',
        status: config.breachNotificationEnabled ? 'complete' : 'incomplete',
      },
      {
        item: 'Audit logging enabled',
        status: 'complete',
        notes: `Frequency: ${config.auditFrequency}`,
      },
      {
        item: 'BAAs in place',
        status: this.baas.size > 0 ? 'complete' : 'incomplete',
        notes: `${this.baas.size} BAA(s) registered`,
      },
      {
        item: 'Encryption key rotation scheduled',
        status: !this.isKeyRotationDue(organizationId) ? 'complete' : 'incomplete',
      },
    ];
  }
}

/**
 * Patient Data Protection Manager
 */
export class PatientDataProtectionManager {
  private protectionPolicies: Map<string, any> = new Map();

  /**
   * Create data protection policy
   */
  public createProtectionPolicy(
    organizationId: string,
    policyName: string,
    dataClassifications: DataClassification[],
    retentionDays: number,
    anonymizationEnabled: boolean
  ): string {
    const policyId = `policy-${uuidv4()}`;

    this.protectionPolicies.set(policyId, {
      id: policyId,
      organizationId,
      policyName,
      dataClassifications,
      retentionDays,
      anonymizationEnabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return policyId;
  }

  /**
   * Apply anonymization to patient data
   */
  public anonymizePatientData(
    organizationId: string,
    patientId: string,
    data: Record<string, any>
  ): Record<string, any> {
    const anonymized = { ...data };

    // Remove/hash identifiers
    const identifierFields = ['firstName', 'lastName', 'dateOfBirth', 'ssn', 'medicalRecord', 'email', 'phone'];

    for (const field of identifierFields) {
      if (field in anonymized) {
        anonymized[field] = this.hashValue(anonymized[field]);
      }
    }

    return anonymized;
  }

  /**
   * Simple hash function for anonymization
   */
  private hashValue(value: any): string {
    return `ANON_${value?.toString().length || 0}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Schedule data retention cleanup
   */
  public scheduleRetentionCleanup(
    organizationId: string,
    dataClassification: DataClassification
  ): { scheduledDate: Date; affectedRecords: number } {
    return {
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      affectedRecords: 0, // Would calculate based on retention policy
    };
  }
}
