/**
 * BlockStop Service Worker
 * Manifest V3 background script
 * Handles threat detection, API communication, and message routing
 */

import type {
  Message,
  MessageResponse,
  EmailAnalysisRequest,
  ScanHistory,
} from '../shared/types';
import { BlockStopAPI } from '../shared/api-client';
import * as storage from '../shared/storage';
import * as authService from './auth-service';
import * as tierGating from './tier-gating';
import * as offlineDB from './offline-db';
import * as syncManager from './sync-manager';

// Initialize API client
const api = new BlockStopAPI();

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[Worker] Extension installed');

    // Initialize default settings
    const config = await storage.getExtensionConfig();
    await storage.updateExtensionConfig(config);

    // Open options page
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('[Worker] Extension updated');
  }
});

/**
 * Initialize sync manager on startup
 */
(() => {
  syncManager.initSyncManager();
  console.log('[Worker] Sync manager initialized');
})();

/**
 * Handle messages from content scripts and popups
 */
chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
  // Handle message asynchronously
  handleMessage(request, sender)
    .then((response) => {
      sendResponse({
        success: true,
        data: response,
        timestamp: Date.now(),
      } as MessageResponse);
    })
    .catch((error) => {
      console.error(`[Worker] Error handling ${request.type}:`, error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      } as MessageResponse);
    });

  // Return true to keep message channel open
  return true;
});

/**
 * Message handler dispatcher
 */
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<any> {
  const { type, payload } = message;

  console.log(`[Worker] Handling message: ${type}`);

  switch (type) {
    case 'SCAN_EMAIL':
      return handleScanEmail(payload);

    case 'SCAN_LINK':
      return handleScanLink(payload);

    case 'SCAN_FILE':
      return handleScanFile(payload);

    case 'AUTH_OAUTH':
      return handleOAuthFlow();

    case 'GET_AUTH_STATUS':
      return authService.getAuthStatus();

    case 'GET_SCAN_HISTORY':
      return handleGetScanHistory(payload);

    case 'CLEAR_HISTORY':
      return handleClearHistory();

    case 'GET_CONFIG':
      return handleGetConfig();

    case 'UPDATE_SETTINGS':
      return handleUpdateSettings(payload);

    case 'SYNC_OFFLINE_DB':
      return handleSyncOfflineDB();

    case 'REPORT_THREAT':
      return handleReportThreat(payload);

    case 'GET_TIER_INFO':
      return handleGetTierInfo();

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

/**
 * Scan email
 */
async function handleScanEmail(payload: EmailAnalysisRequest): Promise<any> {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check feature access
    if (!tierGating.checkFeatureAccess('emailScanning', user.tier)) {
      throw new Error(
        tierGating.getRestrictionMessage('emailScanning', user.tier) ||
          'Email scanning not available'
      );
    }

    // Determine if we should use offline mode
    const isOnline = navigator.onLine;
    const offlineMode =
      isOnline === false && tierGating.supportsOfflineMode(user.tier);

    // Scan email
    const result = await api.scanEmail(payload, offlineMode);

    // Save to history
    const historyEntry: ScanHistory = {
      id: crypto.randomUUID(),
      type: 'email',
      target: payload.emailFrom,
      result,
      timestamp: Date.now(),
    };
    await storage.addScanResult(historyEntry);

    // If offline, queue for sync
    if (offlineMode) {
      await syncManager.queueScanForSync('email', payload.emailFrom, payload);
    }

    return result;
  } catch (error) {
    console.error('Error scanning email:', error);
    throw error;
  }
}

/**
 * Check link
 */
async function handleScanLink(payload: { url: string }): Promise<any> {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check feature access
    if (!tierGating.checkFeatureAccess('linkChecking', user.tier)) {
      throw new Error(
        tierGating.getRestrictionMessage('linkChecking', user.tier) ||
          'Link checking not available'
      );
    }

    const isOnline = navigator.onLine;
    const offlineMode =
      isOnline === false && tierGating.supportsOfflineMode(user.tier);

    // Check link
    const result = await api.checkLink(payload.url, offlineMode);

    // Save to history
    const historyEntry: ScanHistory = {
      id: crypto.randomUUID(),
      type: 'link',
      target: payload.url,
      result,
      timestamp: Date.now(),
    };
    await storage.addScanResult(historyEntry);

    return result;
  } catch (error) {
    console.error('Error checking link:', error);
    throw error;
  }
}

/**
 * Scan file
 */
async function handleScanFile(payload: { file: File }): Promise<any> {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check feature access
    if (!tierGating.checkFeatureAccess('fileScanning', user.tier)) {
      throw new Error(
        tierGating.getRestrictionMessage('fileScanning', user.tier) ||
          'File scanning not available'
      );
    }

    // Scan file
    const result = await api.scanFile(payload.file);

    // Save to history
    const historyEntry: ScanHistory = {
      id: crypto.randomUUID(),
      type: 'file',
      target: payload.file.name,
      result,
      timestamp: Date.now(),
    };
    await storage.addScanResult(historyEntry);

    return result;
  } catch (error) {
    console.error('Error scanning file:', error);
    throw error;
  }
}

/**
 * Initiate OAuth flow
 */
async function handleOAuthFlow(): Promise<any> {
  try {
    console.log('[Worker] Starting OAuth flow');

    const authCode = await authService.initiateOAuth();
    const result = await authService.exchangeCodeForToken(authCode.code);

    // Initialize offline DB if tier supports it
    const user = result.user;
    if (offlineDB.canUseOfflineDB(user.tier)) {
      await offlineDB.initOfflineDB(user.tier);
      console.log('[Worker] Offline DB initialized for tier:', user.tier);

      // Trigger initial DB sync
      await syncManager.updateThreatDatabase();
    }

    return result.user;
  } catch (error) {
    console.error('[Worker] OAuth flow error:', error);
    throw error;
  }
}

/**
 * Get scan history
 */
async function handleGetScanHistory(payload: { limit?: number }): Promise<any> {
  const limit = payload.limit || 100;
  return storage.getScanHistory(limit);
}

/**
 * Clear scan history
 */
async function handleClearHistory(): Promise<void> {
  await storage.clearScanHistory();
}

/**
 * Get extension config
 */
async function handleGetConfig(): Promise<any> {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const config = await storage.getExtensionConfig();
  const tierInfo = tierGating.getTierFeatures(user.tier);

  return {
    config,
    tierInfo,
    isOnline: navigator.onLine,
  };
}

/**
 * Update settings
 */
async function handleUpdateSettings(payload: Record<string, any>): Promise<void> {
  const config = await storage.getExtensionConfig();
  const updated = { ...config, ...payload };
  await storage.updateExtensionConfig(updated);
}

/**
 * Sync offline database
 */
async function handleSyncOfflineDB(): Promise<any> {
  const status = await syncManager.getConnectivityStatus();

  if (!status.isOnline) {
    throw new Error('Cannot sync while offline');
  }

  await syncManager.forceSync();

  return status;
}

/**
 * Report threat
 */
async function handleReportThreat(payload: Record<string, any>): Promise<void> {
  try {
    const token = await authService.getValidAccessToken();

    await fetch('https://api.blockstop.io/api/extension/threat/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    console.error('Error reporting threat:', error);
    throw error;
  }
}

/**
 * Get tier information
 */
async function handleGetTierInfo(): Promise<any> {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  return {
    tier: user.tier,
    features: tierGating.getTierFeatures(user.tier),
    rateLimit: tierGating.getRateLimit(user.tier),
    offlineSupported: tierGating.supportsOfflineMode(user.tier),
    aiPowered: tierGating.hasAIPoweredScanning(user.tier),
  };
}

/**
 * Listen for download events and scan files
 */
chrome.downloads.onCreated.addListener(async (download) => {
  try {
    const config = await storage.getExtensionConfig();

    if (!config.enabledFeatures.fileScanning) {
      return;
    }

    // File download detected, can trigger scan when download completes
    chrome.downloads.onChanged.addListener(async (delta) => {
      if (
        delta.id === download.id &&
        delta.state?.current === 'complete'
      ) {
        // Notify popup that a file was downloaded
        chrome.runtime.sendMessage({
          type: 'FILE_DOWNLOADED',
          payload: {
            filename: download.filename,
            url: download.url,
          },
        }).catch(() => {
          // Ignore if no listener
        });
      }
    });
  } catch (error) {
    console.error('Error handling download:', error);
  }
});

// Log worker startup
console.log('[Worker] Service worker initialized');
