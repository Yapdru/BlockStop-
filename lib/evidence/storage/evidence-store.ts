/**
 * Evidence Store - Manages storage and retrieval of compliance evidence
 * Provides versioning, change tracking, and search capabilities
 */

import { EvidenceItem, EvidenceType } from '../../compliance/types/compliance-types';

export interface EvidenceVersion {
  versionId: string;
  evidence: EvidenceItem;
  changedAt: Date;
  changedBy: string;
  changeReason?: string;
  previousVersionId?: string;
}

export class EvidenceStore {
  private evidence: Map<string, EvidenceItem> = new Map();
  private versions: Map<string, EvidenceVersion[]> = new Map();
  private controlIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<EvidenceType, Set<string>> = new Map();
  private organizationIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeTypeIndex();
  }

  /**
   * Initialize type index
   */
  private initializeTypeIndex(): void {
    Object.values(EvidenceType).forEach((type) => {
      this.typeIndex.set(type, new Set());
    });
  }

  /**
   * Store evidence item
   */
  storeEvidence(
    organizationId: string,
    evidence: EvidenceItem,
    storedBy: string
  ): void {
    this.evidence.set(evidence.id, evidence);

    // Index by control
    const controlSet = this.controlIndex.get(evidence.controlId) || new Set();
    controlSet.add(evidence.id);
    this.controlIndex.set(evidence.controlId, controlSet);

    // Index by type
    const typeSet = this.typeIndex.get(evidence.type) || new Set();
    typeSet.add(evidence.id);
    this.typeIndex.set(evidence.type, typeSet);

    // Index by organization
    const orgSet = this.organizationIndex.get(organizationId) || new Set();
    orgSet.add(evidence.id);
    this.organizationIndex.set(organizationId, orgSet);

    // Store initial version
    this.createVersion(evidence.id, evidence, storedBy, 'Initial upload');
  }

  /**
   * Get evidence by ID
   */
  getEvidence(evidenceId: string): EvidenceItem | null {
    return this.evidence.get(evidenceId) || null;
  }

  /**
   * Get all evidence for a control
   */
  getEvidenceForControl(controlId: string): EvidenceItem[] {
    const evidenceIds = this.controlIndex.get(controlId) || new Set();
    return Array.from(evidenceIds)
      .map((id) => this.evidence.get(id))
      .filter((e) => e !== undefined) as EvidenceItem[];
  }

  /**
   * Get evidence by type
   */
  getEvidenceByType(type: EvidenceType): EvidenceItem[] {
    const evidenceIds = this.typeIndex.get(type) || new Set();
    return Array.from(evidenceIds)
      .map((id) => this.evidence.get(id))
      .filter((e) => e !== undefined) as EvidenceItem[];
  }

  /**
   * Get organization evidence
   */
  getOrganizationEvidence(organizationId: string): EvidenceItem[] {
    const evidenceIds = this.organizationIndex.get(organizationId) || new Set();
    return Array.from(evidenceIds)
      .map((id) => this.evidence.get(id))
      .filter((e) => e !== undefined) as EvidenceItem[];
  }

  /**
   * Search evidence by keyword
   */
  searchEvidence(
    organizationId: string,
    keyword: string,
    filters?: {
      type?: EvidenceType;
      controlId?: string;
      onlyValid?: boolean;
    }
  ): EvidenceItem[] {
    let results = this.getOrganizationEvidence(organizationId);
    const lowerKeyword = keyword.toLowerCase();

    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(lowerKeyword) ||
        e.description.toLowerCase().includes(lowerKeyword)
    );

    if (filters?.type) {
      results = results.filter((e) => e.type === filters.type);
    }

    if (filters?.controlId) {
      results = results.filter((e) => e.controlId === filters.controlId);
    }

    if (filters?.onlyValid !== false) {
      results = results.filter((e) => e.isValid);
    }

    return results;
  }

  /**
   * Create evidence version
   */
  private createVersion(
    evidenceId: string,
    evidence: EvidenceItem,
    changedBy: string,
    changeReason?: string
  ): void {
    const versions = this.versions.get(evidenceId) || [];
    const previousVersion = versions[versions.length - 1];

    const version: EvidenceVersion = {
      versionId: `v-${evidenceId}-${versions.length + 1}`,
      evidence: { ...evidence },
      changedAt: new Date(),
      changedBy,
      changeReason,
      previousVersionId: previousVersion?.versionId,
    };

    versions.push(version);
    this.versions.set(evidenceId, versions);
  }

  /**
   * Update evidence
   */
  updateEvidence(
    evidenceId: string,
    updates: Partial<EvidenceItem>,
    updatedBy: string,
    reason?: string
  ): void {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    const updated = { ...evidence, ...updates, updatedAt: new Date() };
    this.evidence.set(evidenceId, updated);
    this.createVersion(evidenceId, updated, updatedBy, reason);
  }

  /**
   * Get evidence history
   */
  getEvidenceHistory(evidenceId: string): EvidenceVersion[] {
    return this.versions.get(evidenceId) || [];
  }

  /**
   * Get evidence version
   */
  getEvidenceVersion(evidenceId: string, versionId: string): EvidenceVersion | null {
    const versions = this.versions.get(evidenceId) || [];
    return versions.find((v) => v.versionId === versionId) || null;
  }

  /**
   * Verify evidence integrity
   */
  verifyEvidenceIntegrity(evidenceId: string): {
    isValid: boolean;
    lastModified: Date | null;
    versions: number;
  } {
    const evidence = this.evidence.get(evidenceId);
    const versions = this.versions.get(evidenceId) || [];

    return {
      isValid: evidence?.isValid ?? false,
      lastModified: versions.length > 0 ? versions[versions.length - 1].changedAt : null,
      versions: versions.length,
    };
  }

  /**
   * Check evidence expiration
   */
  getExpiringEvidence(
    organizationId: string,
    daysUntilExpiry: number = 30
  ): EvidenceItem[] {
    const evidence = this.getOrganizationEvidence(organizationId);
    const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);

    return evidence.filter(
      (e) => e.expiryDate && e.expiryDate <= expiryDate && e.expiryDate > new Date()
    );
  }

  /**
   * Get expired evidence
   */
  getExpiredEvidence(organizationId: string): EvidenceItem[] {
    const evidence = this.getOrganizationEvidence(organizationId);
    const now = new Date();

    return evidence.filter((e) => e.expiryDate && e.expiryDate <= now);
  }

  /**
   * Link related evidence
   */
  linkEvidence(evidenceId1: string, evidenceId2: string): void {
    const evidence1 = this.evidence.get(evidenceId1);
    const evidence2 = this.evidence.get(evidenceId2);

    if (!evidence1 || !evidence2) {
      throw new Error('One or both evidence items not found');
    }

    if (!evidence1.relatedEvidence.includes(evidenceId2)) {
      evidence1.relatedEvidence.push(evidenceId2);
    }

    if (!evidence2.relatedEvidence.includes(evidenceId1)) {
      evidence2.relatedEvidence.push(evidenceId1);
    }
  }

  /**
   * Get linked evidence
   */
  getLinkedEvidence(evidenceId: string): EvidenceItem[] {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) return [];

    return evidence.relatedEvidence
      .map((id) => this.evidence.get(id))
      .filter((e) => e !== undefined) as EvidenceItem[];
  }

  /**
   * Get evidence statistics
   */
  getStatistics(organizationId: string): {
    total: number;
    byType: Map<EvidenceType, number>;
    valid: number;
    expired: number;
    expiring: number;
  } {
    const evidence = this.getOrganizationEvidence(organizationId);
    const byType = new Map<EvidenceType, number>();

    const valid = evidence.filter((e) => e.isValid).length;
    const expired = this.getExpiredEvidence(organizationId).length;
    const expiring = this.getExpiringEvidence(organizationId).length;

    evidence.forEach((e) => {
      const count = byType.get(e.type) || 0;
      byType.set(e.type, count + 1);
    });

    return {
      total: evidence.length,
      byType,
      valid,
      expired,
      expiring,
    };
  }

  /**
   * Delete evidence
   */
  deleteEvidence(evidenceId: string): void {
    this.evidence.delete(evidenceId);
    this.versions.delete(evidenceId);

    // Remove from indexes
    this.controlIndex.forEach((set) => set.delete(evidenceId));
    this.typeIndex.forEach((set) => set.delete(evidenceId));
    this.organizationIndex.forEach((set) => set.delete(evidenceId));
  }

  /**
   * Export evidence
   */
  exportEvidence(
    organizationId: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): string {
    const evidence = this.getOrganizationEvidence(organizationId);

    if (format === 'JSON') {
      return JSON.stringify(evidence, null, 2);
    } else {
      // CSV format
      const headers = ['id', 'controlId', 'type', 'title', 'uploadedAt', 'isValid'];
      const rows = evidence.map((e) => [
        e.id,
        e.controlId,
        e.type,
        e.title,
        e.uploadedAt.toISOString(),
        e.isValid ? 'Yes' : 'No',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    }
  }
}

export default new EvidenceStore();
