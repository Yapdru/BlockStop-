/**
 * Offline Threat Database Manager
 * Manages IndexedDB for local threat detection
 * Tier-aware feature gating for offline capabilities
 */

import type {
  ThreatSignature,
  SyncMetadata,
  TierLevel,
  TierFeatures,
} from '../shared/types';

const DB_NAME = 'blockstop-threats';
const DB_VERSION = 1;

// Object store names
const STORES = {
  THREAT_SIGNATURES: 'threat_signatures',
  PHISHING_PATTERNS: 'phishing_patterns',
  MALWARE_SIGNATURES: 'malware_signatures',
  SYNC_METADATA: 'sync_metadata',
  TIER_CONFIG: 'tier_config',
} as const;

/**
 * Get or create IndexedDB connection
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.THREAT_SIGNATURES)) {
        const store = db.createObjectStore(STORES.THREAT_SIGNATURES, {
          keyPath: 'id',
        });
        store.createIndex('hash', 'hash', { unique: true });
        store.createIndex('type', 'type', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PHISHING_PATTERNS)) {
        db.createObjectStore(STORES.PHISHING_PATTERNS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.MALWARE_SIGNATURES)) {
        db.createObjectStore(STORES.MALWARE_SIGNATURES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.TIER_CONFIG)) {
        db.createObjectStore(STORES.TIER_CONFIG, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Initialize offline database
 */
export async function initOfflineDB(tier: TierLevel): Promise<boolean> {
  try {
    if (!canUseOfflineDB(tier)) {
      console.warn(`Offline DB not available for tier: ${tier}`);
      return false;
    }

    const db = await getDB();
    const capabilities = getTierFeatures(tier);

    // Store tier configuration
    await setTierConfig(tier, capabilities);

    // Initialize empty stores if they don't have data
    const metadata = await getSyncMetadata();
    if (!metadata) {
      await setSyncMetadata({
        lastSyncTimestamp: Date.now(),
        version: '1.0.0',
        tierLevel: tier,
        signatureCount: 0,
        databaseSize: 0,
      });
    }

    return true;
  } catch (error) {
    console.error('Error initializing offline DB:', error);
    return false;
  }
}

/**
 * Check if tier supports offline mode
 */
export function canUseOfflineDB(tier: TierLevel): boolean {
  const supportedTiers: TierLevel[] = ['neo', 'pro', 'max'];
  return supportedTiers.includes(tier);
}

/**
 * Get feature set for tier
 */
export function getTierFeatures(tier: TierLevel): TierFeatures {
  const features: Record<TierLevel, TierFeatures> = {
    free: {
      emailScanning: true,
      linkChecking: true,
      fileScanning: true,
      offlineMode: false,
      threatDatabase: 'none',
      maxScansPerDay: 10,
      aiPowered: false,
    },
    neo: {
      emailScanning: true,
      linkChecking: true,
      fileScanning: true,
      offlineMode: true,
      threatDatabase: 'limited',
      maxScansPerDay: 50,
      aiPowered: true,
    },
    pro: {
      emailScanning: true,
      linkChecking: true,
      fileScanning: true,
      offlineMode: true,
      threatDatabase: 'limited',
      maxScansPerDay: 200,
      aiPowered: true,
    },
    office: {
      emailScanning: true,
      linkChecking: true,
      fileScanning: true,
      offlineMode: false,
      threatDatabase: 'none',
      maxScansPerDay: 10000,
      aiPowered: true,
    },
    max: {
      emailScanning: true,
      linkChecking: true,
      fileScanning: true,
      offlineMode: true,
      threatDatabase: 'full',
      maxScansPerDay: 999999,
      aiPowered: true,
    },
  };

  return features[tier];
}

/**
 * Get threat signatures from local database
 */
export async function getThreatSignatures(
  tier: TierLevel,
  type?: string
): Promise<ThreatSignature[]> {
  try {
    if (!canUseOfflineDB(tier)) {
      return [];
    }

    const db = await getDB();
    const transaction = db.transaction(STORES.THREAT_SIGNATURES, 'readonly');
    const store = transaction.objectStore(STORES.THREAT_SIGNATURES);

    return new Promise((resolve, reject) => {
      const request = type
        ? store.index('type').getAll(type)
        : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting threat signatures:', error);
    return [];
  }
}

/**
 * Search threat signature by hash
 */
export async function searchSignatureByHash(
  hash: string
): Promise<ThreatSignature | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.THREAT_SIGNATURES, 'readonly');
    const index = transaction
      .objectStore(STORES.THREAT_SIGNATURES)
      .index('hash');

    return new Promise((resolve, reject) => {
      const request = index.get(hash);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error searching signature:', error);
    return null;
  }
}

/**
 * Add threat signatures to database
 */
export async function addThreatSignatures(
  signatures: ThreatSignature[]
): Promise<number> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.THREAT_SIGNATURES, 'readwrite');
    const store = transaction.objectStore(STORES.THREAT_SIGNATURES);

    let added = 0;
    for (const signature of signatures) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(signature);
        request.onsuccess = () => {
          added++;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }

    return added;
  } catch (error) {
    console.error('Error adding threat signatures:', error);
    return 0;
  }
}

/**
 * Get phishing patterns
 */
export async function getPhishingPatterns(): Promise<string[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.PHISHING_PATTERNS, 'readonly');
    const store = transaction.objectStore(STORES.PHISHING_PATTERNS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const patterns = request.result.map((item: any) => item.pattern);
        resolve(patterns);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting phishing patterns:', error);
    return [];
  }
}

/**
 * Add phishing patterns to database
 */
export async function addPhishingPatterns(patterns: string[]): Promise<number> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.PHISHING_PATTERNS, 'readwrite');
    const store = transaction.objectStore(STORES.PHISHING_PATTERNS);

    let added = 0;
    for (const pattern of patterns) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: crypto.randomUUID(),
          pattern,
        });
        request.onsuccess = () => {
          added++;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }

    return added;
  } catch (error) {
    console.error('Error adding phishing patterns:', error);
    return 0;
  }
}

/**
 * Get malware signatures
 */
export async function getMalwareSignatures(): Promise<string[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.MALWARE_SIGNATURES, 'readonly');
    const store = transaction.objectStore(STORES.MALWARE_SIGNATURES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const signatures = request.result.map((item: any) => item.signature);
        resolve(signatures);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting malware signatures:', error);
    return [];
  }
}

/**
 * Add malware signatures to database
 */
export async function addMalwareSignatures(
  signatures: string[]
): Promise<number> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.MALWARE_SIGNATURES, 'readwrite');
    const store = transaction.objectStore(STORES.MALWARE_SIGNATURES);

    let added = 0;
    for (const signature of signatures) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: crypto.randomUUID(),
          signature,
        });
        request.onsuccess = () => {
          added++;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }

    return added;
  } catch (error) {
    console.error('Error adding malware signatures:', error);
    return 0;
  }
}

/**
 * Get sync metadata
 */
export async function getSyncMetadata(): Promise<SyncMetadata | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.SYNC_METADATA, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_METADATA);

    return new Promise((resolve, reject) => {
      const request = store.get('metadata');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting sync metadata:', error);
    return null;
  }
}

/**
 * Update sync metadata
 */
export async function setSyncMetadata(metadata: SyncMetadata): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.SYNC_METADATA, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_METADATA);

    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'metadata', ...metadata });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error setting sync metadata:', error);
    throw error;
  }
}

/**
 * Get tier configuration
 */
export async function getTierConfig(tier: TierLevel): Promise<TierFeatures> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.TIER_CONFIG, 'readonly');
    const store = transaction.objectStore(STORES.TIER_CONFIG);

    return new Promise((resolve, reject) => {
      const request = store.get(tier);
      request.onsuccess = () =>
        resolve(request.result?.features || getTierFeatures(tier));
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting tier config:', error);
    return getTierFeatures(tier);
  }
}

/**
 * Set tier configuration
 */
async function setTierConfig(
  tier: TierLevel,
  features: TierFeatures
): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.TIER_CONFIG, 'readwrite');
    const store = transaction.objectStore(STORES.TIER_CONFIG);

    return new Promise((resolve, reject) => {
      const request = store.put({ id: tier, features });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error setting tier config:', error);
    throw error;
  }
}

/**
 * Clear all offline database
 */
export async function clearOfflineDB(): Promise<void> {
  try {
    const db = await getDB();

    for (const storeName of Object.values(STORES)) {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    console.error('Error clearing offline DB:', error);
    throw error;
  }
}

/**
 * Get database size estimate
 */
export async function getOfflineDBSize(): Promise<number> {
  try {
    const metadata = await getSyncMetadata();
    return metadata?.databaseSize || 0;
  } catch (error) {
    console.error('Error getting DB size:', error);
    return 0;
  }
}
