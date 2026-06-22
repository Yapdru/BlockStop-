/**
 * BlockStop Sync Module
 * Comprehensive sync management including advanced sync functionality
 */

// Export existing sync functionality
export * from './sync-types';
export * from './sync-queue';
export { SyncManager } from './sync-manager';

// Export advanced sync functionality
export {
  AdvancedSyncManager,
  SyncPriority,
  ConflictResolutionStrategy,
  SyncDirection,
  type SyncData,
  type DeltaChange,
  type SyncConflict,
  type CompressedSyncPayload,
  type SyncSession,
  type SyncError,
  type VersionVector,
  type SyncMetadata,
  type EncryptionConfig,
  type AdvancedSyncConfig,
  type SyncMetrics,
} from './advanced-sync-manager';

export default AdvancedSyncManager;
