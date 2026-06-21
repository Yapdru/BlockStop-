/**
 * Progressive Web App - Service Worker
 * Enable offline support and push notifications
 */

export interface ServiceWorkerConfig {
  name: string;
  version: string;
  cacheStrategy: "cache-first" | "network-first" | "stale-while-revalidate";
  maxCacheAge: number; // hours
  offlinePageUrl?: string;
}

export interface CachedResource {
  url: string;
  timestamp: Date;
  size: number;
  type: string;
}

export class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private cachedResources: Map<string, CachedResource> = new Map();
  private pendingRequests: Map<string, any[]> = new Map();
  private lastSync: Date = new Date();

  constructor(config: ServiceWorkerConfig) {
    this.config = config;
  }

  /**
   * Generate service worker code
   */
  async generateServiceWorkerCode(): Promise<string> {
    return `
// BlockStop PWA Service Worker v${this.config.version}
const CACHE_NAME = '${this.config.name}-v${this.config.version}';
const OFFLINE_URL = '${this.config.offlinePageUrl || "/offline"}';

// Files to cache on install
const URLS_TO_CACHE = [
  '/',
  '/dashboard',
  '/analysis',
  '/settings',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/css/main.css',
  '/js/app.js',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - network first
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - cache first
  if (
    url.pathname.match(/\\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/i)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - stale-while-revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirstStrategy(request));
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'notification',
    data: data,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data.deepLink) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data.deepLink) {
            return client.focus();
          }
        }
        return clients.openWindow(event.notification.data.deepLink);
      })
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

// Cache-first strategy
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Sync pending data when online
async function syncPendingData() {
  console.log('[ServiceWorker] Syncing pending data');
  // Implementation for syncing offline actions
}
    `.trim();
  }

  /**
   * Cache a resource
   */
  async cacheResource(url: string, content: any, type: string): Promise<void> {
    const resource: CachedResource = {
      url,
      timestamp: new Date(),
      size: JSON.stringify(content).length,
      type,
    };

    this.cachedResources.set(url, resource);
  }

  /**
   * Get cached resource
   */
  async getCachedResource(url: string): Promise<CachedResource | null> {
    const resource = this.cachedResources.get(url);

    if (!resource) {
      return null;
    }

    // Check cache age
    const ageHours =
      (Date.now() - resource.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageHours > this.config.maxCacheAge) {
      this.cachedResources.delete(url);
      return null;
    }

    return resource;
  }

  /**
   * Queue request for offline processing
   */
  async queueRequest(method: string, endpoint: string, data: any): Promise<string> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const pending = this.pendingRequests.get(endpoint) || [];
    pending.push({
      id: requestId,
      method,
      endpoint,
      data,
      timestamp: new Date(),
    });

    this.pendingRequests.set(endpoint, pending);

    return requestId;
  }

  /**
   * Get pending requests
   */
  async getPendingRequests(): Promise<
    Array<{ id: string; method: string; endpoint: string; data: any }>
  > {
    const requests: any[] = [];

    for (const [, pending] of this.pendingRequests) {
      requests.push(...pending);
    }

    return requests;
  }

  /**
   * Process pending requests when online
   */
  async processPendingRequests(): Promise<{
    processed: number;
    failed: number;
  }> {
    let processed = 0;
    let failed = 0;

    for (const [endpoint, pending] of this.pendingRequests) {
      for (const request of pending) {
        try {
          // In production: send to server
          console.log(`[PWA] Processing pending request: ${request.id}`);
          processed++;
        } catch (error) {
          console.error(`[PWA] Failed to process request: ${request.id}`, error);
          failed++;
        }
      }

      this.pendingRequests.delete(endpoint);
    }

    this.lastSync = new Date();

    return { processed, failed };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalResources: number;
    totalSize: number;
    oldestResource: Date | null;
    newestResource: Date | null;
  }> {
    const resources = Array.from(this.cachedResources.values());

    if (resources.length === 0) {
      return {
        totalResources: 0,
        totalSize: 0,
        oldestResource: null,
        newestResource: null,
      };
    }

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const timestamps = resources.map((r) => r.timestamp.getTime());

    return {
      totalResources: resources.length,
      totalSize,
      oldestResource: new Date(Math.min(...timestamps)),
      newestResource: new Date(Math.max(...timestamps)),
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.cachedResources.clear();
  }

  /**
   * Get offline page
   */
  async getOfflinePage(): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlockStop - Offline</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        h1 { color: #333; margin: 0 0 10px 0; }
        p { color: #666; margin: 0; }
        .icon { font-size: 48px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>BlockStop requires an internet connection.</p>
        <p>Please check your connection and try again.</p>
    </div>
</body>
</html>
    `.trim();
  }
}

export default ServiceWorkerManager;
