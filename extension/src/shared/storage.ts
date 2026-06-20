/**
 * Chrome Storage API Wrapper
 * Provides type-safe access to extension storage
 */

import type {
  User,
  ExtensionConfig,
  ScanHistory,
  OfflineScanRequest,
  TierLevel,
} from './types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  USER_INFO: 'user_info',
  EXTENSION_CONFIG: 'extension_config',
  SCAN_HISTORY: 'scan_history',
  OFFLINE_QUEUE: 'offline_queue',
  LAST_SYNC: 'last_sync',
} as const;

/**
 * Get stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH_TOKEN);
    return result[STORAGE_KEYS.AUTH_TOKEN] || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Set authentication token with expiration
 */
export async function setAuthToken(
  token: string,
  expiresAt: number
): Promise<void> {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.AUTH_TOKEN]: token,
      [STORAGE_KEYS.TOKEN_EXPIRES_AT]: expiresAt,
    });
  } catch (error) {
    console.error('Error setting auth token:', error);
    throw error;
  }
}

/**
 * Clear authentication token
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await chrome.storage.sync.remove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
    ]);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
}

/**
 * Check if token is expired
 */
export async function isTokenExpired(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get(
      STORAGE_KEYS.TOKEN_EXPIRES_AT
    );
    const expiresAt = result[STORAGE_KEYS.TOKEN_EXPIRES_AT];
    if (!expiresAt) return true;
    return Date.now() > expiresAt;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Get stored user info
 */
export async function getUserInfo(): Promise<User | null> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.USER_INFO);
    return result[STORAGE_KEYS.USER_INFO] || null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * Set user info
 */
export async function setUserInfo(user: User): Promise<void> {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.USER_INFO]: user,
    });
  } catch (error) {
    console.error('Error setting user info:', error);
    throw error;
  }
}

/**
 * Get extension configuration
 */
export async function getExtensionConfig(): Promise<ExtensionConfig> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.EXTENSION_CONFIG);
    return (
      result[STORAGE_KEYS.EXTENSION_CONFIG] || {
        apiUrl: 'https://api.blockstop.io',
        offlineMode: false,
        enabledFeatures: {
          emailScanning: true,
          linkChecking: true,
          fileScanning: true,
        },
        notificationSettings: {
          criticalAlerts: true,
          scanComplete: true,
          securityTips: false,
        },
      }
    );
  } catch (error) {
    console.error('Error getting extension config:', error);
    return {
      apiUrl: 'https://api.blockstop.io',
      offlineMode: false,
      enabledFeatures: {
        emailScanning: true,
        linkChecking: true,
        fileScanning: true,
      },
      notificationSettings: {
        criticalAlerts: true,
        scanComplete: true,
        securityTips: false,
      },
    };
  }
}

/**
 * Update extension configuration
 */
export async function updateExtensionConfig(
  config: Partial<ExtensionConfig>
): Promise<void> {
  try {
    const current = await getExtensionConfig();
    const updated = { ...current, ...config };
    await chrome.storage.sync.set({
      [STORAGE_KEYS.EXTENSION_CONFIG]: updated,
    });
  } catch (error) {
    console.error('Error updating extension config:', error);
    throw error;
  }
}

/**
 * Get scan history (limited to recent 1000 entries)
 */
export async function getScanHistory(limit: number = 100): Promise<ScanHistory[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SCAN_HISTORY);
    const history = result[STORAGE_KEYS.SCAN_HISTORY] || [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('Error getting scan history:', error);
    return [];
  }
}

/**
 * Add scan result to history
 */
export async function addScanResult(scan: ScanHistory): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SCAN_HISTORY);
    const history = result[STORAGE_KEYS.SCAN_HISTORY] || [];
    history.unshift(scan);

    // Keep only recent 1000 scans
    const trimmed = history.slice(0, 1000);
    await chrome.storage.local.set({
      [STORAGE_KEYS.SCAN_HISTORY]: trimmed,
    });
  } catch (error) {
    console.error('Error adding scan result:', error);
    throw error;
  }
}

/**
 * Clear all scan history
 */
export async function clearScanHistory(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.SCAN_HISTORY);
  } catch (error) {
    console.error('Error clearing scan history:', error);
    throw error;
  }
}

/**
 * Get offline sync queue
 */
export async function getOfflineSyncQueue(): Promise<OfflineScanRequest[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.OFFLINE_QUEUE);
    return result[STORAGE_KEYS.OFFLINE_QUEUE] || [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * Add scan to offline sync queue
 */
export async function enqueueScanForSync(
  scan: OfflineScanRequest
): Promise<void> {
  try {
    const queue = await getOfflineSyncQueue();
    queue.push(scan);
    await chrome.storage.local.set({
      [STORAGE_KEYS.OFFLINE_QUEUE]: queue,
    });
  } catch (error) {
    console.error('Error enqueueing scan:', error);
    throw error;
  }
}

/**
 * Remove scans from queue after successful sync
 */
export async function removeFromSyncQueue(scanIds: string[]): Promise<void> {
  try {
    const queue = await getOfflineSyncQueue();
    const filtered = queue.filter((scan) => !scanIds.includes(scan.id));
    await chrome.storage.local.set({
      [STORAGE_KEYS.OFFLINE_QUEUE]: filtered,
    });
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    throw error;
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC);
    return result[STORAGE_KEYS.LAST_SYNC] || 0;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return 0;
  }
}

/**
 * Update last sync timestamp
 */
export async function setLastSyncTime(timestamp: number): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.LAST_SYNC]: timestamp,
    });
  } catch (error) {
    console.error('Error setting last sync time:', error);
    throw error;
  }
}

/**
 * Clear all extension data
 */
export async function clearAllData(): Promise<void> {
  try {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

/**
 * Get approximate storage usage
 */
export async function getStorageUsage(): Promise<{
  used: number;
  quota: number;
}> {
  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 10485760, // 10MB default
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { used: 0, quota: 10485760 };
  }
}
