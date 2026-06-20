/**
 * Offline/Online Sync Manager
 * Manages syncing offline scans when connection is restored
 */

import type {
  OfflineScanRequest,
  User,
  ScanHistory,
} from '../shared/types';
import * as storage from '../shared/storage';
import * as offlineDB from './offline-db';
import { getValidAccessToken, getCurrentUser } from './auth-service';

interface SyncProgress {
  total: number;
  processed: number;
  failed: number;
  isProcessing: boolean;
}

// Track sync progress
let syncProgress: SyncProgress = {
  total: 0,
  processed: 0,
  failed: 0,
  isProcessing: false,
};

/**
 * Initialize sync manager
 * Starts monitoring online/offline changes
 */
export function initSyncManager(): void {
  // Check initial online status
  const isOnline = navigator.onLine;
  console.log(`[SyncManager] Initial connectivity: ${isOnline ? 'online' : 'offline'}`);

  // Listen for online event
  window.addEventListener('online', () => {
    console.log('[SyncManager] Connection restored');
    processSyncQueue();
    updateThreatDatabase();
  });

  // Listen for offline event
  window.addEventListener('offline', () => {
    console.log('[SyncManager] Connection lost, switching to offline mode');
  });

  // Periodically check for items needing sync
  setInterval(() => {
    if (navigator.onLine && !syncProgress.isProcessing) {
      processSyncQueue().catch(console.error);
    }
  }, 30000); // Every 30 seconds
}

/**
 * Process offline scan queue
 */
export async function processSyncQueue(): Promise<void> {
  if (syncProgress.isProcessing) {
    console.log('[SyncManager] Sync already in progress');
    return;
  }

  try {
    syncProgress.isProcessing = true;

    const user = await getCurrentUser();
    if (!user) {
      console.warn('[SyncManager] Not authenticated, skipping sync');
      return;
    }

    const queue = await storage.getOfflineSyncQueue();
    if (queue.length === 0) {
      console.log('[SyncManager] Sync queue is empty');
      return;
    }

    syncProgress.total = queue.length;
    syncProgress.processed = 0;
    syncProgress.failed = 0;

    console.log(`[SyncManager] Starting sync of ${queue.length} items`);

    const token = await getValidAccessToken();
    const successfulIds: string[] = [];

    // Process each scan in batches
    const batchSize = 10;
    for (let i = 0; i < queue.length; i += batchSize) {
      const batch = queue.slice(i, i + batchSize);

      for (const scan of batch) {
        try {
          await syncScan(scan, token, user);
          successfulIds.push(scan.id);
          syncProgress.processed++;

          // Notify popup of progress
          broadcastSyncProgress();
        } catch (error) {
          console.error(`[SyncManager] Failed to sync scan ${scan.id}:`, error);
          syncProgress.failed++;
        }
      }
    }

    // Remove successfully synced items
    if (successfulIds.length > 0) {
      await storage.removeFromSyncQueue(successfulIds);
      console.log(
        `[SyncManager] Successfully synced ${successfulIds.length} items`
      );
    }

    // Update last sync timestamp
    await storage.setLastSyncTime(Date.now());

    console.log('[SyncManager] Sync completed');
  } catch (error) {
    console.error('[SyncManager] Sync process error:', error);
  } finally {
    syncProgress.isProcessing = false;
  }
}

/**
 * Sync individual scan to server
 */
async function syncScan(
  scan: OfflineScanRequest,
  token: string,
  user: User
): Promise<void> {
  const endpoint = getSyncEndpoint(scan.type);

  const response = await fetch(
    `https://api.blockstop.io/api/extension/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(scan.payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }

  // Parse response and update local history
  const result = await response.json();

  // Convert sync request to history entry
  const history: ScanHistory = {
    id: scan.id,
    type: scan.type,
    target: scan.target,
    result: result,
    timestamp: scan.timestamp,
  };

  await storage.addScanResult(history);
}

/**
 * Get API endpoint for scan type
 */
function getSyncEndpoint(scanType: 'email' | 'link' | 'file'): string {
  switch (scanType) {
    case 'email':
      return 'scan/email';
    case 'link':
      return 'scan/link';
    case 'file':
      return 'scan/file';
    default:
      throw new Error(`Unknown scan type: ${scanType}`);
  }
}

/**
 * Update threat database from server
 */
export async function updateThreatDatabase(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn('[SyncManager] Not authenticated, skipping DB update');
      return;
    }

    if (!offlineDB.canUseOfflineDB(user.tier)) {
      console.log(`[SyncManager] Offline DB not available for tier ${user.tier}`);
      return;
    }

    const lastSync = await storage.getLastSyncTime();
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Only update once per day
    if (lastSync && now - lastSync < dayInMs) {
      console.log('[SyncManager] Database recently synced, skipping update');
      return;
    }

    console.log('[SyncManager] Updating threat database');

    const token = await getValidAccessToken();

    // Fetch updated threat database
    const response = await fetch(`https://api.blockstop.io/api/extension/threat-db`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Database update failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Add signatures based on tier
    if (data.threatSignatures && data.threatSignatures.length > 0) {
      const added = await offlineDB.addThreatSignatures(
        data.threatSignatures
      );
      console.log(`[SyncManager] Added ${added} threat signatures`);
    }

    if (data.phishingPatterns && data.phishingPatterns.length > 0) {
      const added = await offlineDB.addPhishingPatterns(
        data.phishingPatterns
      );
      console.log(`[SyncManager] Added ${added} phishing patterns`);
    }

    if (data.malwareSignatures && data.malwareSignatures.length > 0) {
      const added = await offlineDB.addMalwareSignatures(
        data.malwareSignatures
      );
      console.log(`[SyncManager] Added ${added} malware signatures`);
    }

    // Update sync metadata
    await offlineDB.setSyncMetadata({
      lastSyncTimestamp: now,
      version: data.version || '1.0.0',
      tierLevel: user.tier,
      signatureCount: data.threatSignatures?.length || 0,
      databaseSize: data.databaseSize || 0,
    });

    await storage.setLastSyncTime(now);
    console.log('[SyncManager] Database update completed');
  } catch (error) {
    console.error('[SyncManager] Database update error:', error);
  }
}

/**
 * Queue scan for offline sync
 */
export async function queueScanForSync(
  type: 'email' | 'link' | 'file',
  target: string,
  payload: any
): Promise<void> {
  const scan: OfflineScanRequest = {
    id: crypto.randomUUID(),
    type,
    target,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };

  await storage.enqueueScanForSync(scan);
  console.log(`[SyncManager] Queued ${type} scan for sync`);

  // If online, try to sync immediately
  if (navigator.onLine) {
    processSyncQueue().catch(console.error);
  }
}

/**
 * Get current sync progress
 */
export function getSyncProgress(): SyncProgress {
  return { ...syncProgress };
}

/**
 * Broadcast sync progress to UI
 */
function broadcastSyncProgress(): void {
  chrome.runtime.sendMessage({
    type: 'SYNC_PROGRESS',
    payload: syncProgress,
  }).catch(() => {
    // Ignore errors if no listener
  });
}

/**
 * Get connectivity status with details
 */
export async function getConnectivityStatus(): Promise<{
  isOnline: boolean;
  lastSyncTime: number;
  queueLength: number;
  syncInProgress: boolean;
}> {
  const queue = await storage.getOfflineSyncQueue();
  const lastSync = await storage.getLastSyncTime();

  return {
    isOnline: navigator.onLine,
    lastSyncTime: lastSync,
    queueLength: queue.length,
    syncInProgress: syncProgress.isProcessing,
  };
}

/**
 * Force sync
 */
export async function forceSync(): Promise<void> {
  console.log('[SyncManager] Force sync triggered');
  if (!navigator.onLine) {
    console.warn('[SyncManager] Cannot sync while offline');
    return;
  }

  await processSyncQueue();
  await updateThreatDatabase();
}

/**
 * Clear sync queue (for testing/debugging)
 */
export async function clearSyncQueue(): Promise<void> {
  await storage.removeFromSyncQueue([]);
  console.log('[SyncManager] Sync queue cleared');
}
