/**
 * Code Splitting Configuration and Utilities
 * Handles dynamic imports and route-based code splitting
 */

export interface CodeSplitConfig {
  chunkName?: string;
  loading?: React.ComponentType;
  error?: React.ComponentType;
  timeout?: number;
}

export interface ChunkMetadata {
  name: string;
  size: number;
  loadTime: number;
  loaded: boolean;
  error?: Error;
}

// Track loaded chunks
const loadedChunks: Map<string, ChunkMetadata> = new Map();

/**
 * Dynamically import a module with error handling
 */
export const dynamicImport = async <T = any>(
  modulePath: string,
  timeout: number = 10000
): Promise<T> => {
  const startTime = performance.now();

  try {
    const module = await Promise.race([
      import(modulePath),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Module import timeout: ${modulePath}`)),
          timeout
        )
      ),
    ]);

    const loadTime = performance.now() - startTime;

    // Track chunk metrics
    loadedChunks.set(modulePath, {
      name: modulePath,
      size: 0, // Would be populated from actual bundle
      loadTime,
      loaded: true,
    });

    return module;
  } catch (error) {
    loadedChunks.set(modulePath, {
      name: modulePath,
      size: 0,
      loadTime: performance.now() - startTime,
      loaded: false,
      error: error as Error,
    });
    throw error;
  }
};

/**
 * Route-based code splitting with prefetch
 */
export const getRouteChunks = (route: string): string[] => {
  const chunks: Record<string, string[]> = {
    '/': ['components/home', 'utils/analytics'],
    '/admin': ['components/admin', 'layouts/admin-layout'],
    '/dashboard': ['components/dashboard', 'charts/dashboard-charts'],
    '/settings': ['components/settings', 'forms/settings-form'],
    '/profile': ['components/profile', 'forms/profile-form'],
  };

  return chunks[route] || [];
};

/**
 * Prefetch route chunks based on user behavior
 */
export const prefetchRoute = async (route: string): Promise<void> => {
  const chunks = getRouteChunks(route);

  for (const chunk of chunks) {
    try {
      // Trigger chunk load without blocking
      scheduleIdleCallback(() => {
        dynamicImport(chunk).catch(() => {
          // Prefetch failures are non-critical
          console.warn(`Failed to prefetch chunk: ${chunk}`);
        });
      });
    } catch (error) {
      console.warn(`Failed to prefetch route: ${route}`, error);
    }
  }
};

/**
 * Request idle callback shim
 */
const scheduleIdleCallback = (callback: IdleRequestCallback): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
};

/**
 * Get chunk metrics
 */
export const getChunkMetrics = (): Record<string, ChunkMetadata> => {
  const metrics: Record<string, ChunkMetadata> = {};
  loadedChunks.forEach((value, key) => {
    metrics[key] = value;
  });
  return metrics;
};

/**
 * Calculate total chunk size
 */
export const getTotalChunkSize = (): number => {
  let total = 0;
  loadedChunks.forEach((chunk) => {
    total += chunk.size;
  });
  return total;
};

/**
 * Get slow loading chunks (> 1 second)
 */
export const getSlowChunks = (threshold: number = 1000): ChunkMetadata[] => {
  const slowChunks: ChunkMetadata[] = [];
  loadedChunks.forEach((chunk) => {
    if (chunk.loadTime > threshold) {
      slowChunks.push(chunk);
    }
  });
  return slowChunks.sort((a, b) => b.loadTime - a.loadTime);
};

/**
 * Dynamic import with retry logic
 */
export const dynamicImportWithRetry = async <T = any>(
  modulePath: string,
  maxRetries: number = 3,
  timeout: number = 10000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await dynamicImport<T>(modulePath, timeout);
    } catch (error) {
      lastError = error as Error;
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError || new Error(`Failed to import ${modulePath} after ${maxRetries} retries`);
};

/**
 * Conditional code splitting based on user agent
 */
export const getDeviceSpecificChunks = (): string[] => {
  if (typeof navigator === 'undefined') {
    return [];
  }

  const isMobile = /Mobile|Android|iPhone/.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(navigator.userAgent);

  if (isMobile) {
    return ['chunks/mobile-optimized'];
  }
  if (isTablet) {
    return ['chunks/tablet-optimized'];
  }
  return ['chunks/desktop'];
};

/**
 * Memory-efficient chunk loading with garbage collection hints
 */
export const loadChunkSuspense = async <T = any>(
  modulePath: string
): Promise<T> => {
  const module = await dynamicImport<T>(modulePath);

  // Hint to garbage collection after loading
  if (typeof gc !== 'undefined') {
    gc();
  }

  return module;
};

/**
 * Parallel chunk loading for better performance
 */
export const loadChunksConcurrently = async <T = any>(
  modulePaths: string[]
): Promise<T[]> => {
  return Promise.all(modulePaths.map((path) => dynamicImport<T>(path)));
};

/**
 * Sequential chunk loading with dependencies
 */
export const loadChunksSequentially = async <T = any>(
  modulePaths: string[]
): Promise<T[]> => {
  const results: T[] = [];

  for (const path of modulePaths) {
    const module = await dynamicImport<T>(path);
    results.push(module);
  }

  return results;
};

/**
 * Clear chunk cache
 */
export const clearChunkCache = (): void => {
  loadedChunks.clear();
};

/**
 * Report chunk loading metrics
 */
export const reportChunkMetrics = (
  endpoint: string
): Promise<Response> | null => {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return null;
  }

  const metrics = getChunkMetrics();
  const slowChunks = getSlowChunks();

  const data = JSON.stringify({
    timestamp: Date.now(),
    chunks: metrics,
    slowChunks: slowChunks.map((chunk) => ({
      name: chunk.name,
      loadTime: chunk.loadTime,
    })),
    totalSize: getTotalChunkSize(),
  });

  navigator.sendBeacon(endpoint, data);
  return null;
};
