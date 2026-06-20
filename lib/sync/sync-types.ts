/**
 * Sync Types and Interfaces
 * Type definitions for offline sync management and conflict resolution
 */

export enum SyncMode {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CONFLICTED = 'conflicted',
  OFFLINE = 'offline',
}

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MANUAL = 'manual',
  VERSION_VECTOR = 'version_vector',
}

export interface QueuedChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  resourceId: string;
  data: any;
  timestamp: number;
  priority: number; // 0-10, higher = more important
  retries: number;
  lastAttempt?: number;
  error?: string;
}

export interface SyncConfig {
  userId: string;
  mode: SyncMode;
  scheduledIntervalMs?: number; // 5000, 15000, 30000, 60000
  maxQueueSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  batteryOptimized?: boolean;
  conflictStrategy?: ConflictResolutionStrategy;
}

export interface SyncState {
  mode: SyncMode;
  status: SyncStatus;
  lastSyncTime?: number;
  nextSyncTime?: number;
  queuedChanges: number;
  failedChanges: number;
  isOnline: boolean;
  batteryLevel?: number;
  isLowBattery?: boolean;
  syncProgress?: {
    current: number;
    total: number;
  };
}

export interface ConflictData {
  id: string;
  resource: string;
  resourceId: string;
  localVersion: any;
  remoteVersion: any;
  localTimestamp: number;
  remoteTimestamp: number;
  strategy: ConflictResolutionStrategy;
}

export interface VersionVector {
  nodeId: string;
  version: number;
  timestamp: number;
}

export interface VersionedResource {
  id: string;
  data: any;
  versions: VersionVector[];
  lastModified: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  duration: number;
  errors: Array<{
    change: QueuedChange;
    error: string;
  }>;
  conflicts?: ConflictData[];
}

export interface BatteryStatus {
  level: number; // 0-100
  isCharging: boolean;
  state: 'charging' | 'discharging' | 'unknown';
}

export interface NetworkState {
  isConnected: boolean;
  type?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  isMetered?: boolean;
}

export interface SyncEvent {
  type: 'start' | 'progress' | 'success' | 'error' | 'conflict' | 'offline' | 'online';
  timestamp: number;
  data?: any;
}
