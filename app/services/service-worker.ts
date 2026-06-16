/**
 * Service Worker Registration and Management
 * Handles caching strategies and offline support
 */

export interface CacheConfig {
  name: string;
  version: string;
  maxAge?: number;
  maxSize?: number;
}

/**
 * Register service worker
 */
export const registerServiceWorker = async (swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update().catch(() => {
        // Update failed, non-critical
      });
    }, 60 * 60 * 1000); // Check hourly

    // Listen for new service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, notify user
            console.log('New service worker available');
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { registration },
              })
            );
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service Worker unregistered');
  } catch (error) {
    console.error('Failed to unregister Service Worker:', error);
  }
};

/**
 * Skip waiting for new service worker
 */
export const skipWaitingServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  registrations.forEach((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
};

/**
 * Cache management utilities
 */
export const cacheManager = {
  /**
   * Open cache
   */
  async open(cacheName: string): Promise<Cache> {
    return caches.open(cacheName);
  },

  /**
   * Delete cache
   */
  async delete(cacheName: string): Promise<boolean> {
    return caches.delete(cacheName);
  },

  /**
   * Get all cache names
   */
  async getCacheNames(): Promise<string[]> {
    return caches.keys();
  },

  /**
   * Clear old caches
   */
  async clearOldCaches(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (typeof caches === 'undefined') return;

    const cacheNames = await caches.keys();
    const cutoffTime = Date.now() - maxAge;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const responseTime = new Date(dateHeader).getTime();
            if (responseTime < cutoffTime) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  },

  /**
   * Get cache size
   */
  async getCacheSize(cacheName?: string): Promise<number> {
    if (typeof caches === 'undefined') return 0;

    let totalSize = 0;
    const names = cacheName ? [cacheName] : await caches.keys();

    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response && response.blob) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  },
};

/**
 * Service Worker message handler
 */
export const setupServiceWorkerMessageListener = (
  callback: (message: any) => void
): (() => void) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    callback(event.data);
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
};

/**
 * Send message to service worker
 */
export const sendMessageToServiceWorker = (message: any): void => {
  if (typeof window === 'undefined' || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
};

/**
 * Check online status with fallback
 */
export const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine ?? true;
};

/**
 * Watch online status changes
 */
export const watchOnlineStatus = (
  callback: (isOnline: boolean) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Periodic background sync (if supported)
 */
export const registerBackgroundSync = async (
  tag: string,
  minInterval?: number
): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      await (registration as any).periodicSync.register(tag, {
        minInterval: minInterval || 24 * 60 * 60 * 1000, // 24 hours
      });
      return true;
    }
  } catch (error) {
    console.warn('Background sync registration failed:', error);
  }

  return false;
};

/**
 * Prefetch resources for offline use
 */
export const prefetchForOffline = async (
  urls: string[],
  cacheName: string = 'offline-cache'
): Promise<void> => {
  if (typeof caches === 'undefined') return;

  const cache = await caches.open(cacheName);
  const requests = urls.map((url) => new Request(url));

  try {
    await cache.addAll(requests);
    console.log(`Prefetched ${urls.length} resources for offline use`);
  } catch (error) {
    console.warn('Failed to prefetch resources:', error);
  }
};

/**
 * Get service worker info
 */
export const getServiceWorkerInfo = async (): Promise<{
  registered: boolean;
  active: boolean;
  waiting: boolean;
} | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      return { registered: false, active: false, waiting: false };
    }

    const registration = registrations[0];
    return {
      registered: true,
      active: !!registration.active,
      waiting: !!registration.waiting,
    };
  } catch (error) {
    console.error('Failed to get service worker info:', error);
    return null;
  }
};

/**
 * Service Worker lifecycle hook
 */
export const useServiceWorkerLifecycle = () => {
  return {
    register: registerServiceWorker,
    unregister: unregisterServiceWorker,
    skipWaiting: skipWaitingServiceWorker,
    getInfo: getServiceWorkerInfo,
    cache: cacheManager,
    isOnline,
    watchOnlineStatus,
  };
};
