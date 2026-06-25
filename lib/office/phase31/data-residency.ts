/**
 * Data Residency Management - GDPR, HIPAA, LGPD data location enforcement
 * Manages data location policies and compliance
 */

import {
  DataResidencyManagement,
  DataResidencyPolicy,
  DataLocation,
  DataClassification,
  EncryptionStatus,
  RegionComplianceStatus,
  RegulationStatus,
  DataTransferRequest,
  DataResidencyAudit,
  DataResidencyFinding,
} from '@/types/office-phase31';

/**
 * Data Residency Manager
 * Manages data location policies and compliance
 */
export class DataResidencyManager {
  private management: DataResidencyManagement;

  constructor(organizationId: string) {
    this.management = {
      id: `data-residency-${organizationId}`,
      organizationId,
      policies: [],
      dataInventory: [],
      compliance: [],
      transfers: [],
      audits: [],
    };

    this.initializePolicies();
  }

  /**
   * Create data residency policy
   */
  public createPolicy(
    region: string,
    regulation: 'GDPR' | 'HIPAA' | 'LGPD' | 'CCPA' | 'other',
    dataClassifications: string[],
    allowedProcessingCountries: string[],
    storageRequirements: string,
    owner: string
  ): DataResidencyPolicy {
    const policy: DataResidencyPolicy = {
      id: `policy-${region}-${Date.now()}`,
      region,
      regulation,
      dataClassifications,
      allowedProcessingCountries,
      storageRequirements,
      processingRestrictions: this.getProcessingRestrictions(regulation),
      encryptionRequired: true,
      keyManagementLocation: this.getKeyManagementLocation(region),
      owner,
      effectiveDate: new Date(),
    };

    this.management.policies.push(policy);
    return policy;
  }

  /**
   * Register data location
   */
  public registerDataLocation(
    dataType: string,
    dataClassification: DataClassification,
    currentLocation: string,
    allowedLocations: string[],
    storageService: string,
    owner: string
  ): DataLocation {
    const location: DataLocation = {
      id: `loc-${Date.now()}`,
      dataType,
      dataClassification,
      currentLocation,
      allowedLocations,
      storageService,
      encryptionStatus: 'both',
      owner,
      lastAuditedDate: new Date(),
      complianceStatus: this.checkLocationCompliance(currentLocation, allowedLocations),
    };

    this.management.dataInventory.push(location);
    return location;
  }

  /**
   * Request data transfer
   */
  public requestDataTransfer(
    dataType: string,
    fromRegion: string,
    toRegion: string,
    justification: string,
    requestedBy: string
  ): DataTransferRequest {
    const transfer: DataTransferRequest = {
      id: `transfer-${Date.now()}`,
      requestDate: new Date(),
      dataType,
      fromRegion,
      toRegion,
      justification,
      approvalStatus: 'pending',
      encryptionUsed: true,
      auditLog: [
        {
          userId: requestedBy,
          timestamp: new Date(),
          action: 'requested',
          details: `Transfer request created from ${fromRegion} to ${toRegion}`,
        },
      ],
    };

    // Check policy compliance for transfer
    const applicable Policy = this.management.policies.find(
      (p) => p.allowedProcessingCountries.includes(toRegion)
    );

    if (!applicablePolicy) {
      transfer.approvalStatus = 'rejected';
    }

    this.management.transfers.push(transfer);
    return transfer;
  }

  /**
   * Approve data transfer
   */
  public approveTransfer(
    transferId: string,
    approvedBy: string
  ): DataTransferRequest | null {
    const transfer = this.management.transfers.find((t) => t.id === transferId);
    if (!transfer) return null;

    transfer.approvalStatus = 'approved';
    transfer.approvedBy = approvedBy;
    transfer.approvalDate = new Date();

    transfer.auditLog.push({
      userId: approvedBy,
      timestamp: new Date(),
      action: 'approved',
      details: 'Transfer approved and scheduled',
    });

    // Schedule transfer execution
    setTimeout(() => this.executeTransfer(transfer), 1000);

    return transfer;
  }

  /**
   * Execute data transfer
   */
  private executeTransfer(transfer: DataTransferRequest): void {
    transfer.transferDate = new Date();

    transfer.auditLog.push({
      userId: 'system',
      timestamp: new Date(),
      action: 'transferred',
      details: `Data transferred from ${transfer.fromRegion} to ${transfer.toRegion}`,
    });

    // Mark as completed
    setTimeout(() => {
      transfer.completionDate = new Date();

      transfer.auditLog.push({
        userId: 'system',
        timestamp: new Date(),
        action: 'completed',
        details: 'Transfer completed successfully',
      });
    }, 2000);
  }

  /**
   * Conduct data residency audit
   */
  public conductAudit(scope: string, auditor: string): DataResidencyAudit {
    const audit: DataResidencyAudit = {
      id: `audit-${Date.now()}`,
      date: new Date(),
      scope,
      findings: [],
      status: 'in_progress',
      auditor,
    };

    // Audit data locations
    this.management.dataInventory.forEach((location) => {
      const isCompliant = this.checkLocationCompliance(
        location.currentLocation,
        location.allowedLocations
      );

      if (isCompliant !== 'Compliant') {
        audit.findings.push({
          id: `finding-${audit.id}-${Date.now()}`,
          severity: 'high',
          description: `Data type "${location.dataType}" stored in non-compliant location`,
          affectedData: [location.dataType],
          affectedRegions: [location.currentLocation],
          remediationRequired: true,
          remediationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'open',
        });
      }
    });

    // Check policy compliance
    this.management.policies.forEach((policy) => {
      const applicableData = this.management.dataInventory.filter(
        (l) =>
          l.allowedLocations.includes(policy.region) &&
          policy.dataClassifications.includes(l.dataClassification)
      );

      if (applicableData.length === 0) {
        audit.findings.push({
          id: `finding-${audit.id}-${Date.now()}`,
          severity: 'medium',
          description: `No data found for policy: ${policy.regulation} - ${policy.region}`,
          affectedData: policy.dataClassifications,
          affectedRegions: [policy.region],
          remediationRequired: false,
          status: 'open',
        });
      }
    });

    audit.status = 'completed';
    this.management.audits.push(audit);

    // Update compliance status
    this.updateComplianceStatus();

    return audit;
  }

  /**
   * Get data residency report
   */
  public getResidencyReport(): {
    totalDataTypes: number;
    compliantLocations: number;
    nonCompliantLocations: number;
    byRegion: Record<string, { compliant: number; nonCompliant: number }>;
    regulatoryStatus: Record<string, string>;
    findings: number;
    recommendations: string[];
  } {
    const regionStatus: Record<string, { compliant: number; nonCompliant: number }> = {};
    const regulatoryStatus: Record<string, string> = {};

    this.management.dataInventory.forEach((location) => {
      const compliance = this.checkLocationCompliance(
        location.currentLocation,
        location.allowedLocations
      );

      if (!regionStatus[location.currentLocation]) {
        regionStatus[location.currentLocation] = { compliant: 0, nonCompliant: 0 };
      }

      if (compliance === 'Compliant') {
        regionStatus[location.currentLocation].compliant++;
      } else {
        regionStatus[location.currentLocation].nonCompliant++;
      }
    });

    this.management.policies.forEach((policy) => {
      regulatoryStatus[policy.regulation] = policy.encryptionRequired
        ? 'Encryption Required'
        : 'Standard Protection';
    });

    const compliantLocations = this.management.dataInventory.filter(
      (l) => this.checkLocationCompliance(l.currentLocation, l.allowedLocations) === 'Compliant'
    ).length;

    const nonCompliantLocations = this.management.dataInventory.length - compliantLocations;

    const allFindings = this.management.audits.flatMap((a) => a.findings);

    return {
      totalDataTypes: this.management.dataInventory.length,
      compliantLocations,
      nonCompliantLocations,
      byRegion: regionStatus,
      regulatoryStatus,
      findings: allFindings.length,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Get encryption status report
   */
  public getEncryptionStatusReport(): {
    totalDataTypes: number;
    encryptedAtRest: number;
    encryptedInTransit: number;
    bothEncrypted: number;
    unencrypted: number;
    encryptionByClassification: Record<DataClassification, Record<EncryptionStatus, number>>;
  } {
    const report = {
      totalDataTypes: this.management.dataInventory.length,
      encryptedAtRest: 0,
      encryptedInTransit: 0,
      bothEncrypted: 0,
      unencrypted: 0,
      encryptionByClassification: {
        public: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
        internal: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
        confidential: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
        restricted: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
        pii: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
        phi: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
        pci: { encrypted_at_rest: 0, encrypted_in_transit: 0, both: 0, unencrypted: 0, unknown: 0 },
      } as Record<DataClassification, Record<EncryptionStatus, number>>,
    };

    this.management.dataInventory.forEach((location) => {
      switch (location.encryptionStatus) {
        case 'encrypted_at_rest':
          report.encryptedAtRest++;
          break;
        case 'encrypted_in_transit':
          report.encryptedInTransit++;
          break;
        case 'both':
          report.bothEncrypted++;
          break;
        case 'unencrypted':
          report.unencrypted++;
          break;
      }

      report.encryptionByClassification[location.dataClassification][location.encryptionStatus]++;
    });

    return report;
  }

  /**
   * Get compliance status by region
   */
  public getRegionalCompliance(region: string): RegionComplianceStatus | null {
    const existing = this.management.compliance.find((c) => c.region === region);
    if (existing) return existing;

    const status: RegionComplianceStatus = {
      region,
      regulations: [],
      dataResidenceStatus: 'compliant',
      lastAuditDate: new Date(),
      nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      findings: [],
      actionItems: [],
    };

    // Get applicable policies for region
    this.management.policies
      .filter((p) => p.allowedProcessingCountries.includes(region))
      .forEach((policy) => {
        status.regulations.push({
          regulation: policy.regulation,
          status: 'compliant',
          lastCheckedDate: new Date(),
          evidenceLocations: [],
        });
      });

    this.management.compliance.push(status);
    return status;
  }

  // ========== Private helper methods ==========

  private initializePolicies(): void {
    // Initialize with standard policies

    // HIPAA for US
    this.createPolicy(
      'USA',
      'HIPAA',
      ['phi', 'pii'],
      ['USA'],
      'Data must remain within USA jurisdiction',
      'Compliance Officer'
    );

    // GDPR for Europe
    this.createPolicy(
      'EU',
      'GDPR',
      ['pii', 'personal_data'],
      ['DE', 'FR', 'UK', 'NL', 'BE', 'AT', 'SE'],
      'Data must remain within EU with adequate safeguards',
      'Data Protection Officer'
    );

    // LGPD for Brazil
    this.createPolicy(
      'BR',
      'LGPD',
      ['pii', 'personal_data'],
      ['BR'],
      'Data must remain within Brazil',
      'Compliance Officer'
    );

    // CCPA for California
    this.createPolicy(
      'US-CA',
      'CCPA',
      ['pii', 'consumer_data'],
      ['USA'],
      'California consumer data protection',
      'Privacy Officer'
    );
  }

  private getProcessingRestrictions(regulation: string): string[] {
    const restrictions: Record<string, string[]> = {
      HIPAA: [
        'No processing without BAA',
        'Limited data set only',
        'Minimum necessary principle applies',
      ],
      GDPR: [
        'Lawful basis required',
        'Data subject rights must be honored',
        'DPA required for certain processing',
      ],
      LGPD: [
        'Specific consent required',
        'Data subject rights must be honored',
        'Limited retention periods',
      ],
      CCPA: [
        'Disclosure required',
        'Opt-out rights must be provided',
        'Service provider restrictions apply',
      ],
    };

    return restrictions[regulation] || [];
  }

  private getKeyManagementLocation(region: string): string {
    const keyManagement: Record<string, string> = {
      USA: 'AWS KMS (US regions only)',
      EU: 'Azure Key Vault (EU regions)',
      BR: 'AWS KMS (South America)',
      'US-CA': 'AWS KMS (US West region)',
    };

    return keyManagement[region] || 'Default Key Management Service';
  }

  private checkLocationCompliance(
    currentLocation: string,
    allowedLocations: string[]
  ): string {
    return allowedLocations.includes(currentLocation) ? 'Compliant' : 'Non-Compliant';
  }

  private updateComplianceStatus(): void {
    this.management.compliance.forEach((status) => {
      const nonCompliantData = this.management.dataInventory.filter(
        (l) =>
          !l.allowedLocations.includes(status.region) &&
          l.currentLocation === status.region
      );

      status.dataResidenceStatus = nonCompliantData.length === 0 ? 'compliant' : 'non_compliant';
    });
  }

  private generateRecommendations(): string[] {
    const nonCompliant = this.management.dataInventory.filter(
      (l) => this.checkLocationCompliance(l.currentLocation, l.allowedLocations) !== 'Compliant'
    );

    const recommendations: string[] = [];

    if (nonCompliant.length > 0) {
      recommendations.push(`Immediately remediate ${nonCompliant.length} non-compliant data locations`);
    }

    const unencrypted = this.management.dataInventory.filter(
      (l) => l.encryptionStatus === 'unencrypted'
    );

    if (unencrypted.length > 0) {
      recommendations.push(`Enable encryption for ${unencrypted.length} unencrypted data stores`);
    }

    recommendations.push('Conduct quarterly data residency audits');
    recommendations.push('Establish automated monitoring for data location compliance');

    return recommendations;
  }

  public getManagementData(): DataResidencyManagement {
    return this.management;
  }
}

export default DataResidencyManager;
