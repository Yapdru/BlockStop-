import { EventEmitter } from 'events';
import { ConflictResolution, Conflict } from './types';
import { COLLABORATION_CONFIG, CONFLICT_RESOLUTION_STRATEGIES } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class ConflictResolver extends EventEmitter {
  private conflicts: Map<string, ConflictResolution> = new Map();
  private wsManager: WebSocketManager;
  private resolvedConflicts: ConflictResolution[] = [];
  private pendingResolutions: Map<string, Promise<ConflictResolution>> = new Map();

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize conflict resolver:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on('conflict:detected', (payload) => this.handleConflictDetected(payload));
    this.wsManager.on('conflict:resolved', (payload) => this.handleConflictResolved(payload));
  }

  detectConflict(resourceId: string, conflicts: Conflict[]): ConflictResolution {
    const id = CollaborationUtils.generateId('conflict');
    const conflict: ConflictResolution = {
      id,
      resourceId,
      conflicts,
      resolution: 'manual',
      resolvedAt: new Date(),
      resolvedBy: '',
    };

    this.conflicts.set(id, conflict);
    this.emit('conflict:detected', conflict);

    return conflict;
  }

  async resolveConflictAutoLatest(conflictId: string, userId: string): Promise<ConflictResolution | undefined> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return undefined;

    const latest = conflict.conflicts.reduce((prev, current) =>
      current.timestamp > prev.timestamp ? current : prev,
    );

    conflict.resolution = 'auto_latest';
    conflict.mergedValue = latest.value;
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = userId;

    this.resolvedConflicts.push(conflict);
    this.conflicts.delete(conflictId);

    this.wsManager.broadcast('conflict:resolved', conflict);
    this.emit('conflict:auto_resolved', conflict);

    return conflict;
  }

  async resolveConflictAutoMajority(conflictId: string, userId: string): Promise<ConflictResolution | undefined> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return undefined;

    const valueMap = new Map<string, number>();
    conflict.conflicts.forEach((c) => {
      const key = JSON.stringify(c.value);
      valueMap.set(key, (valueMap.get(key) || 0) + 1);
    });

    const majority = Array.from(valueMap.entries()).reduce((prev, current) =>
      current[1] > prev[1] ? current : prev,
    );

    conflict.resolution = 'auto_majority';
    conflict.mergedValue = JSON.parse(majority[0]);
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = userId;

    this.resolvedConflicts.push(conflict);
    this.conflicts.delete(conflictId);

    this.wsManager.broadcast('conflict:resolved', conflict);
    this.emit('conflict:auto_resolved', conflict);

    return conflict;
  }

  async resolveConflictManual(conflictId: string, mergedValue: any, userId: string): Promise<ConflictResolution | undefined> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return undefined;

    conflict.resolution = 'manual';
    conflict.mergedValue = mergedValue;
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = userId;

    this.resolvedConflicts.push(conflict);
    this.conflicts.delete(conflictId);

    this.wsManager.broadcast('conflict:resolved', conflict);
    this.emit('conflict:manually_resolved', conflict);

    return conflict;
  }

  async mergeConflicts(conflictId: string, mergeStrategy: (conflicts: Conflict[]) => any, userId: string): Promise<ConflictResolution | undefined> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return undefined;

    try {
      const mergedValue = mergeStrategy(conflict.conflicts);
      conflict.resolution = 'merge';
      conflict.mergedValue = mergedValue;
      conflict.resolvedAt = new Date();
      conflict.resolvedBy = userId;

      this.resolvedConflicts.push(conflict);
      this.conflicts.delete(conflictId);

      this.wsManager.broadcast('conflict:resolved', conflict);
      this.emit('conflict:merged', conflict);

      return conflict;
    } catch (error) {
      this.emit('conflict:merge_failed', { conflictId, error });
      return undefined;
    }
  }

  getConflict(conflictId: string): ConflictResolution | undefined {
    return this.conflicts.get(conflictId);
  }

  getPendingConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values());
  }

  getPendingConflictCount(): number {
    return this.conflicts.size;
  }

  getResolvedConflicts(limit: number = 50): ConflictResolution[] {
    return this.resolvedConflicts.slice(-limit);
  }

  getResourceConflicts(resourceId: string): ConflictResolution[] {
    return Array.from(this.conflicts.values()).filter((c) => c.resourceId === resourceId);
  }

  hasConflicts(resourceId: string): boolean {
    return this.getResourceConflicts(resourceId).length > 0;
  }

  getConflictSeverity(conflictId: string): 'low' | 'medium' | 'high' | 'critical' {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return 'low';
    return CollaborationUtils.getConflictSeverity(conflict.conflicts.length);
  }

  canAutoResolve(conflictId: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    if (conflict.conflicts.length === 1) return true;

    const valueStrings = conflict.conflicts.map((c) => JSON.stringify(c.value));
    const uniqueValues = new Set(valueStrings);

    return uniqueValues.size === 1;
  }

  getResolutionRecommendation(conflictId: string): 'auto_latest' | 'auto_majority' | 'manual' | 'merge' {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return 'manual';

    if (this.canAutoResolve(conflictId)) {
      return 'auto_latest';
    }

    const valueMap = new Map<string, number>();
    conflict.conflicts.forEach((c) => {
      const key = JSON.stringify(c.value);
      valueMap.set(key, (valueMap.get(key) || 0) + 1);
    });

    const maxCount = Math.max(...Array.from(valueMap.values()));
    if (maxCount > conflict.conflicts.length / 2) {
      return 'auto_majority';
    }

    return 'manual';
  }

  private handleConflictDetected(payload: any): void {
    const conflict = payload as ConflictResolution;
    this.conflicts.set(conflict.id, conflict);
    this.emit('remote:conflict_detected', conflict);
  }

  private handleConflictResolved(payload: any): void {
    const conflict = payload as ConflictResolution;
    this.conflicts.delete(conflict.id);
    this.resolvedConflicts.push(conflict);
    this.emit('remote:conflict_resolved', conflict);
  }

  getConflictStats(): {
    pending: number;
    resolved: number;
    auto_resolved_latest: number;
    auto_resolved_majority: number;
    manually_resolved: number;
  } {
    const auto_latest = this.resolvedConflicts.filter((c) => c.resolution === 'auto_latest').length;
    const auto_majority = this.resolvedConflicts.filter((c) => c.resolution === 'auto_majority').length;
    const manual = this.resolvedConflicts.filter((c) => c.resolution === 'manual').length;

    return {
      pending: this.conflicts.size,
      resolved: this.resolvedConflicts.length,
      auto_resolved_latest: auto_latest,
      auto_resolved_majority: auto_majority,
      manually_resolved: manual,
    };
  }

  clearResolvedConflicts(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const beforeLength = this.resolvedConflicts.length;
    this.resolvedConflicts = this.resolvedConflicts.filter((c) => c.resolvedAt >= cutoffDate);

    this.emit('conflicts:pruned', { removed: beforeLength - this.resolvedConflicts.length });
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
