/**
 * Performance Optimization Utilities - Main Export
 * Central hub for all performance utilities
 */

// Image optimization
export {
  generateResponsiveImages,
  generatePictureMarkup,
  calculateResponsiveDimensions,
  getBrowserOptimalFormat,
  addCacheBuster,
  estimateImageLoadTime,
  generateBlurPlaceholder,
  prefersReducedMotion,
  prefersHighContrast,
  imageOptimizationConfig,
  type OptimizationOptions,
  type OptimizedImageSet,
} from './image-optimizer';

// Lazy loading
export {
  observeElement,
  lazyLoadImage,
  lazyLoadImages,
  scheduleIdleCallback,
  cancelIdleCallback,
  prefetchResource,
  preloadResource,
  lazyLoadScript,
  lazyLoadStylesheet,
  observeElementVisibility,
  batchLazyLoad,
  type LazyLoadingOptions,
  type IntersectionConfig,
} from './lazy-loading';

// Code splitting
export {
  dynamicImport,
  getRouteChunks,
  prefetchRoute,
  getChunkMetrics,
  getTotalChunkSize,
  getSlowChunks,
  dynamicImportWithRetry,
  getDeviceSpecificChunks,
  loadChunkSuspense,
  loadChunksConcurrently,
  loadChunksSequentially,
  clearChunkCache,
  reportChunkMetrics,
  type CodeSplitConfig,
  type ChunkMetadata,
} from './code-splitting';

// Cache strategies
export {
  TTLCache,
  networkFirstFetch,
  cacheFirstFetch,
  staleWhileRevalidateFetch,
  LocalStorageCache,
  getCacheHeaders,
  invalidateCachePattern,
  createCachedFetch,
  getCacheStats,
  type CacheEntry,
  type CacheConfig,
} from './cache-strategy';

// Bundle analyzer
export {
  analyzeBundleStats,
  checkBundleBudget,
  identifyCodeSplittingOpportunities,
  findDuplicateDependencies,
  estimateUnusedJS,
  formatBytes,
  generateBundleReport,
  BundleMetricsTracker,
  estimateOptimizationImpact,
  DEFAULT_BUDGET,
  type BundleMetrics,
  type ModuleInfo,
  type BundleBudget,
} from './bundle-analyzer';

// Web vitals
export {
  measureLCP,
  measureFCP,
  measureCLS,
  measureFID,
  measureTTFB,
  measureCustomMetric,
  initWebVitals,
  reportMetrics,
  checkVitalsHealth,
  PerformanceMetricsCollector,
  VITALS_THRESHOLDS,
  type WebVital,
  type VitalsThresholds,
} from './web-vitals';
