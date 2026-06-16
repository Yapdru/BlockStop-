/**
 * Service Worker Implementation
 * Handles caching, offline support, and performance optimizations
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `blockstop-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

const RUNTIME_CACHES = {
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  documents: `documents-${CACHE_VERSION}`,
};

/**
 * Install event - cache essential assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && !Object.values(RUNTIME_CACHES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstFetch(request, RUNTIME_CACHES.api));
    return;
  }

  // Image requests - cache first with network fallback
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstFetch(request, RUNTIME_CACHES.images));
    return;
  }

  // Document requests - stale while revalidate
  if (/\.(html|pdf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHES.documents));
    return;
  }

  // Default - network first
  event.respondWith(networkFirstFetch(request, CACHE_NAME));
});

/**
 * Network first strategy
 * Try network first, fallback to cache, then offline page
 */
async function networkFirstFetch(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network request failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page or error response
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' }),
    });
  }
}

/**
 * Cache first strategy
 * Try cache first, fallback to network
 */
async function cacheFirstFetch(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Stale while revalidate strategy
 * Serve from cache but revalidate in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName);
      break;

    case 'PREFETCH':
      prefetchResources(payload?.urls || []);
      break;

    case 'CACHE_STATS':
      event.ports[0].postMessage(getCacheStats());
      break;

    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Clear cache
 */
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  // Notify all clients
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'CACHE_CLEARED', cacheName });
    });
  });
}

/**
 * Prefetch resources
 */
async function prefetchResources(urls) {
  const cache = await caches.open(CACHE_NAME);
  try {
    await cache.addAll(urls);
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = {
      size: keys.length,
      requests: keys.map((r) => r.url),
    };
  }

  return stats;
}

/**
 * Periodic sync for background updates
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

/**
 * Update cache in background
 */
async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  for (const request of keys) {
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        cache.put(request, response);
      }
    } catch (error) {
      // Update failed, non-critical
    }
  }
}
