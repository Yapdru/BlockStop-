/**
 * Sync Manager
 * Orchestrates offline sync with three modes: instant, scheduled, manual
 * Handles conflict resolution, battery optimization, and network monitoring
 */

import { EventEmitter } from 'events';
import {
  SyncMode,
  SyncStatus,
  ConflictResolutionStrategy,
  SyncConfig,
  SyncState,
  ConflictData,
  QueuedChange,
  SyncResult,
  BatteryStatus,
  NetworkState,
} from './sync-types';
import { SyncQueue, QueuePersistence } from './sync-queue';

export interface SyncManagerConfig extends SyncConfig {
  onSync?: (changes: QueuedChange[]) => Promise<SyncResult>;
  batteryStatusFn?: () => Promise<BatteryStatus>;
  networkStatusFn?: () => Promise<NetworkState>;
  queuePersistence?: QueuePersistence;
}

export class SyncManager extends EventEmitter {
  private queue: SyncQueue;
  private config: SyncManagerConfig;
  private state: SyncState;
  private syncTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private pendingChanges: Map<string, QueuedChange> = new Map();
  private conflicts: ConflictData[] = [];
  private syncInProgress = false;
  private lastNetworkState: NetworkState = { isConnected: true };
  private lastBatteryStatus: BatteryStatus = {
    level: 100,
    isCharging: false,
    state: 'unknown',
  };

  constructor(config: SyncManagerConfig) {
    super();
    this.config = config;
    this.queue = new SyncQueue(config, config.queuePersistence);

    this.state = {
      mode: config.mode,
      status: SyncStatus.OFFLINE,
      queuedChanges: 0,
      failedChanges: 0,
      isOnline: true,
      batteryLevel: 100,
      isLowBattery: false,
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the sync manager
   */
  async initialize(): Promise<void> {
    try {
      // Initialize queue
      await this.queue.initialize();

      // Check initial network state
      if (this.config.networkStatusFn) {
        this.lastNetworkState = await this.config.networkStatusFn();
        this.state.isOnline = this.lastNetworkState.isConnected;
      }

      // Check initial battery state
      if (this.config.batteryStatusFn) {
        this.lastBatteryStatus = await this.config.batteryStatusFn();
        this.state.batteryLevel = this.lastBatteryStatus.level;
        this.state.isLowBattery = this.lastBatteryStatus.level < 20;
      }

      this.state.status = this.state.isOnline ? SyncStatus.IDLE : SyncStatus.OFFLINE;

      // Setup polling for network and battery status
      this.startStatusPolling();

      // Start sync based on mode
      if (this.config.mode === SyncMode.SCHEDULED && this.state.isOnline) {
        this.startScheduledSync();
      }

      this.isInitialized = true;
      this.emit('initialized', { state: this.state });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Queue a change for sync
   */
  async queueChange(change: Omit<QueuedChange, 'id' | 'retries' | 'timestamp'>): Promise<string> {
    try {
      const id = await this.queue.enqueue(change);
      this.state.queuedChanges++;
      this.pendingChanges.set(id, { ...change, id, retries: 0, timestamp: Date.now() } as QueuedChange);

      this.emit('change:queued', {
        id,
        total: this.state.queuedChanges,
      });

      // Trigger instant sync if enabled
      if (this.config.mode === SyncMode.INSTANT && this.state.isOnline && !this.syncInProgress) {
        this.sync();
      }

      return id;
    } catch (error) {
      this.emit('error', { error, context: 'queueChange' });
      throw error;
    }
  }

  /**
   * Trigger manual sync
   */
  async sync(): Promise<SyncResult | null> {
    try {
      if (this.syncInProgress) {
        this.emit('warn', { message: 'Sync already in progress' });
        return null;
      }

      if (!this.state.isOnline) {
        this.emit('warn', { message: 'Cannot sync while offline' });
        return null;
      }

      this.syncInProgress = true;
      this.state.status = SyncStatus.SYNCING;
      const startTime = Date.now();

      const changes = this.queue.peek(100); // Process in batches
      if (changes.length === 0) {
        this.state.status = SyncStatus.IDLE;
        this.syncInProgress = false;
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          conflictCount: 0,
          duration: 0,
          errors: [],
        };
      }

      this.emit('sync:start', { changeCount: changes.length });

      // Call sync callback
      let result: SyncResult | null = null;
      if (this.config.onSync) {
        result = await this.config.onSync(changes);
      } else {
        // Default empty result
        result = {
          success: true,
          syncedCount: changes.length,
          failedCount: 0,
          conflictCount: 0,
          duration: Date.now() - startTime,
          errors: [],
        };
      }

      // Process result
      for (const change of changes) {
        const error = result.errors?.find((e) => e.change.id === change.id);

        if (error) {
          const canRetry = await this.queue.markFailed(change.id, new Error(error.error));
          this.state.failedChanges++;
        } else {
          await this.queue.markSuccess(change.id);
          this.pendingChanges.delete(change.id);
          this.state.queuedChanges--;
        }
      }

      // Handle conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        this.conflicts.push(...result.conflicts);
        this.state.status = SyncStatus.CONFLICTED;
        this.emit('sync:conflict', { conflicts: result.conflicts });
      } else {
        this.state.status = this.queue.isEmpty() ? SyncStatus.SUCCESS : SyncStatus.IDLE;
      }

      this.state.lastSyncTime = Date.now();
      result.duration = Date.now() - startTime;

      this.emit('sync:complete', result);
      return result;
    } catch (error) {
      this.state.status = SyncStatus.FAILED;
      this.emit('sync:error', { error });
      return null;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote'
  ): Promise<void> {
    try {
      const conflict = this.conflicts.find((c) => c.id === conflictId);
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      if (resolution === 'local') {
        // Keep local version - re-sync it
        const change = this.pendingChanges.get(conflict.id);
        if (change) {
          await this.queueChange({
            type: change.type,
            resource: change.resource,
            resourceId: change.resourceId,
            data: change.data,
            priority: change.priority + 5, // Bump priority for retry
          });
        }
      } else {
        // Accept remote version - remove local change
        await this.queue.remove(conflict.id);
        this.pendingChanges.delete(conflict.id);
        this.state.queuedChanges--;
      }

      // Remove from conflicts list
      this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);

      this.emit('conflict:resolved', { conflictId, resolution });
    } catch (error) {
      this.emit('error', { error, context: 'resolveConflict' });
      throw error;
    }
  }

  /**
   * Change sync mode
   */
  async setMode(mode: SyncMode): Promise<void> {
    try {
      if (this.config.mode === mode) return;

      this.config.mode = mode;
      this.state.mode = mode;

      // Stop existing sync scheduling
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = undefined;
      }

      // Start new sync scheduling
      if (mode === SyncMode.SCHEDULED && this.state.isOnline) {
        this.startScheduledSync();
      }

      this.emit('mode:changed', { mode });
    } catch (error) {
      this.emit('error', { error, context: 'setMode' });
      throw error;
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue.getStats();
  }

  /**
   * Get pending changes
   */
  getPendingChanges(): QueuedChange[] {
    return Array.from(this.pendingChanges.values());
  }

  /**
   * Get conflicts
   */
  getConflicts(): ConflictData[] {
    return [...this.conflicts];
  }

  /**
   * Clear all queued changes
   */
  async clearQueue(): Promise<void> {
    try {
      await this.queue.clear();
      this.pendingChanges.clear();
      this.state.queuedChanges = 0;
      this.state.failedChanges = 0;
      this.emit('queue:cleared');
    } catch (error) {
      this.emit('error', { error, context: 'clearQueue' });
      throw error;
    }
  }

  /**
   * Private: Setup event handlers
   */
  private setupEventHandlers(): void {
    this.queue.on('change:queued', (event) => {
      this.emit('queue:change', event);
    });

    this.queue.on('change:success', (event) => {
      this.emit('queue:change', event);
    });

    this.queue.on('change:failed', (event) => {
      this.emit('queue:change', event);
    });

    this.queue.on('error', (event) => {
      this.emit('error', event);
    });
  }

  /**
   * Private: Start scheduled sync polling
   */
  private startScheduledSync(): void {
    const interval = this.config.scheduledIntervalMs || 30000;

    this.syncTimer = setInterval(() => {
      if (this.state.isOnline && !this.syncInProgress && !this.queue.isEmpty()) {
        // Check battery before syncing
        if (this.config.batteryOptimized && this.state.isLowBattery) {
          this.emit('sync:skipped', { reason: 'low_battery' });
          return;
        }

        this.sync();
      }
    }, interval);

    this.emit('scheduled_sync:started', { intervalMs: interval });
  }

  /**
   * Private: Start polling for network and battery status
   */
  private startStatusPolling(): void {
    // Poll every 5 seconds
    const pollInterval = 5000;

    const poll = async () => {
      try {
        // Check network status
        if (this.config.networkStatusFn) {
          const newState = await this.config.networkStatusFn();

          if (newState.isConnected !== this.lastNetworkState.isConnected) {
            this.lastNetworkState = newState;
            this.state.isOnline = newState.isConnected;

            if (newState.isConnected) {
              this.state.status = SyncStatus.IDLE;
              this.emit('network:online');

              // Trigger sync if needed
              if (!this.queue.isEmpty()) {
                if (this.config.mode === SyncMode.INSTANT) {
                  this.sync();
                } else if (this.config.mode === SyncMode.SCHEDULED && !this.syncTimer) {
                  this.startScheduledSync();
                }
              }
            } else {
              this.state.status = SyncStatus.OFFLINE;
              this.emit('network:offline');

              // Clear sync timer if offline
              if (this.syncTimer) {
                clearInterval(this.syncTimer);
                this.syncTimer = undefined;
              }
            }
          }
        }

        // Check battery status
        if (this.config.batteryStatusFn) {
          const newBattery = await this.config.batteryStatusFn();
          const wasLowBattery = this.state.isLowBattery;

          this.lastBatteryStatus = newBattery;
          this.state.batteryLevel = newBattery.level;
          this.state.isLowBattery = newBattery.level < 20;

          if (wasLowBattery !== this.state.isLowBattery) {
            if (this.state.isLowBattery) {
              this.emit('battery:low');
            } else {
              this.emit('battery:normal');
            }
          }
        }

        // Continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        this.emit('error', { error, context: 'status_polling' });
        // Retry polling after delay
        setTimeout(poll, pollInterval * 2);
      }
    };

    poll();
  }

  /**
   * Destroy manager and clean up resources
   */
  destroy(): void {
    try {
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }

      this.queue.removeAllListeners();
      this.removeAllListeners();

      this.emit('destroyed');
    } catch (error) {
      this.emit('error', { error, context: 'destroy' });
    }
  }
}
