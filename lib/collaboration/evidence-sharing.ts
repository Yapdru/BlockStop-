import { EventEmitter } from 'events';
import { Evidence, EvidenceMetadata, ChainOfCustody } from './types';
import { COLLABORATION_CONFIG, WEBSOCKET_EVENTS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class EvidenceSharingEngine extends EventEmitter {
  private evidence: Map<string, Evidence> = new Map();
  private wsManager: WebSocketManager;
  private accessControl: Map<string, Set<string>> = new Map(); // evidenceId -> Set of userIds
  private shareHistory: Array<{ evidenceId: string; userId: string; sharedWith: string; timestamp: Date }> = [];

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize evidence sharing:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.EVIDENCE_ADDED, (payload) => this.handleEvidenceAdded(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.EVIDENCE_UPDATED, (payload) => this.handleEvidenceUpdated(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.EVIDENCE_DELETED, (payload) => this.handleEvidenceDeleted(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.EVIDENCE_SHARED, (payload) => this.handleEvidenceShared(payload));
  }

  uploadEvidence(evidence: Omit<Evidence, 'id' | 'uploadedAt' | 'annotations'>): Evidence {
    const id = CollaborationUtils.generateEvidenceId();
    const fullEvidence: Evidence = {
      ...evidence,
      id,
      uploadedAt: new Date(),
      annotations: [],
    };

    if (JSON.stringify(fullEvidence).length > COLLABORATION_CONFIG.MAX_FILE_SIZE) {
      throw new Error('Evidence exceeds maximum size limit');
    }

    this.evidence.set(id, fullEvidence);
    this.accessControl.set(id, new Set([evidence.uploadedBy]));

    this.recordChainOfCustody(id, evidence.uploadedBy, 'uploaded');
    this.wsManager.broadcast(WEBSOCKET_EVENTS.EVIDENCE_ADDED, fullEvidence);
    this.emit('evidence:uploaded', fullEvidence);

    return fullEvidence;
  }

  shareEvidence(evidenceId: string, userId: string, sharedWith: string): void {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) {
      throw new Error('Evidence not found');
    }

    const accessSet = this.accessControl.get(evidenceId) || new Set();
    accessSet.add(sharedWith);
    this.accessControl.set(evidenceId, accessSet);

    this.recordChainOfCustody(evidenceId, userId, 'shared', `Shared with ${sharedWith}`);
    this.shareHistory.push({
      evidenceId,
      userId,
      sharedWith,
      timestamp: new Date(),
    });

    this.wsManager.broadcast(WEBSOCKET_EVENTS.EVIDENCE_SHARED, {
      evidenceId,
      sharedBy: userId,
      sharedWith,
      timestamp: new Date(),
    });

    this.emit('evidence:shared', { evidenceId, sharedWith });
  }

  shareWithTeam(evidenceId: string, userId: string, teamUserIds: string[]): void {
    teamUserIds.forEach((uid) => {
      this.shareEvidence(evidenceId, userId, uid);
    });
  }

  getEvidence(evidenceId: string): Evidence | undefined {
    return this.evidence.get(evidenceId);
  }

  getAccessibleEvidence(userId: string): Evidence[] {
    return Array.from(this.evidence.values()).filter((e) => {
      const accessSet = this.accessControl.get(e.id);
      return accessSet && accessSet.has(userId);
    });
  }

  canAccessEvidence(evidenceId: string, userId: string): boolean {
    const accessSet = this.accessControl.get(evidenceId);
    return accessSet ? accessSet.has(userId) : false;
  }

  updateEvidence(evidenceId: string, updates: Partial<Evidence>, userId: string): void {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) {
      throw new Error('Evidence not found');
    }

    const updated = { ...evidence, ...updates, id: evidence.id };
    this.evidence.set(evidenceId, updated);

    this.recordChainOfCustody(evidenceId, userId, 'updated');
    this.wsManager.broadcast(WEBSOCKET_EVENTS.EVIDENCE_UPDATED, updated);
    this.emit('evidence:updated', updated);
  }

  deleteEvidence(evidenceId: string, userId: string): void {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) {
      throw new Error('Evidence not found');
    }

    this.recordChainOfCustody(evidenceId, userId, 'deleted');
    this.evidence.delete(evidenceId);
    this.accessControl.delete(evidenceId);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.EVIDENCE_DELETED, { evidenceId });
    this.emit('evidence:deleted', { evidenceId });
  }

  private recordChainOfCustody(evidenceId: string, userId: string, action: string, notes?: string): void {
    const evidence = this.evidence.get(evidenceId);
    if (evidence) {
      evidence.metadata.chain_of_custody.push({
        userId,
        username: userId,
        action,
        timestamp: new Date(),
        notes,
      });
    }
  }

  getChainOfCustody(evidenceId: string): ChainOfCustody[] {
    const evidence = this.evidence.get(evidenceId);
    return evidence ? evidence.metadata.chain_of_custody : [];
  }

  getShareHistory(evidenceId?: string): Array<any> {
    return evidenceId ? this.shareHistory.filter((h) => h.evidenceId === evidenceId) : this.shareHistory;
  }

  validateIntegrity(evidenceId: string, checksum: string): boolean {
    const evidence = this.evidence.get(evidenceId);
    if (!evidence) return false;
    const calculated = CollaborationUtils.calculateChecksum(evidence);
    return calculated === checksum;
  }

  private handleEvidenceAdded(payload: any): void {
    this.evidence.set(payload.id, payload);
    this.emit('evidence:added', payload);
  }

  private handleEvidenceUpdated(payload: any): void {
    this.evidence.set(payload.id, payload);
    this.emit('evidence:updated', payload);
  }

  private handleEvidenceDeleted(payload: any): void {
    this.evidence.delete(payload.evidenceId);
    this.emit('evidence:deleted', payload);
  }

  private handleEvidenceShared(payload: any): void {
    const accessSet = this.accessControl.get(payload.evidenceId) || new Set();
    accessSet.add(payload.sharedWith);
    this.accessControl.set(payload.evidenceId, accessSet);
    this.emit('evidence:shared', payload);
  }

  getAllEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }

  getEvidenceStats(): {
    totalCount: number;
    byType: Record<string, number>;
    totalSize: number;
  } {
    const evidence = Array.from(this.evidence.values());
    const byType: Record<string, number> = {};
    let totalSize = 0;

    evidence.forEach((e) => {
      byType[e.type] = (byType[e.type] || 0) + 1;
      totalSize += e.metadata.size || 0;
    });

    return {
      totalCount: evidence.length,
      byType,
      totalSize,
    };
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
