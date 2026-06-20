import { EventEmitter } from 'events';
import { SyncMessage, ConflictResolution, Conflict } from './types';
import { COLLABORATION_CONFIG, WEBSOCKET_EVENTS, SYNC_STATUS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class RealTimeSyncEngine extends EventEmitter {
  private wsManager: WebSocketManager;
  private syncQueue: SyncMessage[] = [];
  private pendingSyncs: Map<string, SyncMessage> = new Map();
  private versionMap: Map<string, number> = new Map();
  private lastSyncTime: number = 0;
  private syncInterval: NodeJS.Timer | null = null;
  private status: 'syncing' | 'synced' | 'conflict' | 'error' | 'offline' = 'offline';
  private latencyMs: number = 0;
  private conflicts: ConflictResolution[] = [];
  private debounceTimer: NodeJS.Timer | null = null;
  private debounceMs: number = COLLABORATION_CONFIG.SYNC_DEBOUNCE_MS;

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.status = 'synced';
      this.setupSyncHandlers();
      this.startPeriodicSync();
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  private setupSyncHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.SYNC_RESPONSE, (payload) => this.handleSyncResponse(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.CONFLICT_DETECTED, (payload) => this.handleConflict(payload));
  }

  queueSync(message: Omit<SyncMessage, 'id' | 'timestamp' | 'version'>): void {
    const syncMsg: SyncMessage = {
      ...message,
      id: CollaborationUtils.generateId('sync'),
      timestamp: CollaborationUtils.getTimestamp(),
      version: (this.versionMap.get(message.resourceId) || 0) + 1,
    };

    this.versionMap.set(message.resourceId, syncMsg.version);
    this.syncQueue.push(syncMsg);
    this.pendingSyncs.set(syncMsg.id, syncMsg);

    this.debouncedSync();
  }

  private debouncedSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.performSync();
    }, this.debounceMs);
  }

  private async performSync(): Promise<void> {
    if (!this.wsManager.isOnline()) {
      this.status = 'offline';
      return;
    }

    if (this.syncQueue.length === 0) {
      this.status = 'synced';
      return;
    }

    this.status = 'syncing';
    const startTime = CollaborationUtils.getTimestamp();

    try {
      const batch = this.syncQueue.splice(0, 10);
      this.wsManager.send(WEBSOCKET_EVENTS.SYNC_REQUEST, {
        messages: batch,
        batchId: CollaborationUtils.generateId('batch'),
      });

      const timeout = setTimeout(() => {
        this.status = 'error';
        this.emit('sync:timeout', batch);
      }, COLLABORATION_CONFIG.WEBSOCKET_TIMEOUT);

      const response = await this.waitForResponse();
      clearTimeout(timeout);
      this.latencyMs = CollaborationUtils.calculateLatency(startTime, CollaborationUtils.getTimestamp());

      if (CollaborationUtils.isWithinLatencyThreshold(this.latencyMs)) {
        this.status = 'synced';
        this.lastSyncTime = CollaborationUtils.getTimestamp();
        this.emit('sync:complete', { latency: this.latencyMs, messageCount: batch.length });
      } else {
        this.emit('sync:latency_warning', this.latencyMs);
      }

      if (this.syncQueue.length > 0) {
        this.performSync();
      }
    } catch (error) {
      this.status = 'error';
      this.emit('sync:error', error);
    }
  }

  private waitForResponse(): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Sync response timeout')), 5000);
      const unsubscribe = this.wsManager.subscribe(WEBSOCKET_EVENTS.SYNC_RESPONSE, (payload) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(payload);
      });
    });
  }

  private handleSyncResponse(payload: any): void {
    payload.messageIds.forEach((id: string) => {
      this.pendingSyncs.delete(id);
    });

    if (payload.conflicts && payload.conflicts.length > 0) {
      this.status = 'conflict';
      this.handleConflicts(payload.conflicts);
    } else {
      this.emit('sync:acknowledged', payload);
    }
  }

  private handleConflict(payload: any): void {
    this.status = 'conflict';
    const conflict: ConflictResolution = {
      id: CollaborationUtils.generateId('conflict'),
      resourceId: payload.resourceId,
      conflicts: payload.conflicts,
      resolution: 'manual',
      resolvedAt: new Date(),
      resolvedBy: '',
    };
    this.conflicts.push(conflict);
    this.emit('conflict:detected', conflict);
  }

  private handleConflicts(conflicts: any[]): void {
    conflicts.forEach((c) => this.handleConflict(c));
  }

  resolveConflict(conflictId: string, resolution: 'auto_latest' | 'auto_majority' | 'merge', mergedValue?: any): void {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (conflict) {
      conflict.resolution = resolution;
      conflict.mergedValue = mergedValue;
      conflict.resolvedAt = new Date();
      this.wsManager.send('conflict:resolve', { conflictId, resolution, mergedValue });
      this.emit('conflict:resolved', conflict);
      this.status = 'synced';
    }
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.wsManager.isOnline()) {
        this.performSync();
      }
    }, COLLABORATION_CONFIG.SYNC_DEBOUNCE_MS * 3);
  }

  getStatus(): typeof SYNC_STATUS[keyof typeof SYNC_STATUS] {
    return this.status as any;
  }

  getLatency(): number {
    return this.latencyMs;
  }

  getPendingSyncCount(): number {
    return this.syncQueue.length + this.pendingSyncs.size;
  }

  getConflicts(): ConflictResolution[] {
    return [...this.conflicts];
  }

  getVersionInfo(resourceId: string): number {
    return this.versionMap.get(resourceId) || 0;
  }

  getSyncStats(): {
    status: string;
    latency: number;
    pendingCount: number;
    conflictCount: number;
    lastSyncTime: number;
  } {
    return {
      status: this.status,
      latency: this.latencyMs,
      pendingCount: this.getPendingSyncCount(),
      conflictCount: this.conflicts.length,
      lastSyncTime: this.lastSyncTime,
    };
  }

  clearPendingSyncs(): void {
    this.syncQueue = [];
    this.pendingSyncs.clear();
  }

  disconnect(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.wsManager.disconnect();
  }
}
