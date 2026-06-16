# BlockStop Performance Optimization System

Comprehensive performance optimization system with 10+ files implementing best practices for Core Web Vitals, image optimization, code splitting, and caching strategies.

## 📊 Target Metrics

- **Largest Contentful Paint (LCP)**: < 2.5s (good), < 4s (acceptable)
- **First Contentful Paint (FCP)**: < 1.5s (good), < 3s (acceptable)
- **Cumulative Layout Shift (CLS)**: < 0.1 (good), < 0.25 (acceptable)
- **First Input Delay (FID)**: < 100ms (good), < 300ms (acceptable)
- **Time to First Byte (TTFB)**: < 600ms (good), < 1.8s (acceptable)

## 🗂️ Project Structure

### Performance Utilities (`app/utils/performance/`)

#### 1. **image-optimizer.ts**
Image optimization with multiple format support and responsive sizing.

**Key Functions:**
- `generateResponsiveImages()` - Generate AVIF, WebP, and JPG images
- `generatePictureMarkup()` - Create HTML5 picture elements
- `calculateResponsiveDimensions()` - Calculate optimal image sizes
- `getBrowserOptimalFormat()` - Detect browser's best format support
- `generateBlurPlaceholder()` - Create blur-up SVG placeholders
- `prefersReducedMotion()` - Check user motion preferences

**Usage Example:**
```typescript
import { generateResponsiveImages, LazyImage } from '@/app/utils/performance';

// In component
const optimized = generateResponsiveImages('/image.jpg', {
  formats: ['avif', 'webp', 'jpg'],
  widths: [320, 640, 960, 1280],
  quality: 75,
});

// Or use LazyImage component
<LazyImage
  src="/image.jpg"
  alt="Description"
  width={1200}
  height={600}
  priority={false}
  formats={['avif', 'webp']}
/>
```

#### 2. **lazy-loading.ts**
Lazy loading utilities for images, components, and resources using Intersection Observer.

**Key Functions:**
- `observeElement()` - Generic intersection observer
- `lazyLoadImage()` - Lazy load individual images
- `lazyLoadImages()` - Batch lazy load images
- `scheduleIdleCallback()` - Schedule work during idle time
- `lazyLoadScript()` - Dynamically load scripts
- `lazyLoadStylesheet()` - Dynamically load stylesheets
- `batchLazyLoad()` - Batch load with controlled concurrency

**Usage Example:**
```typescript
import { lazyLoadImages, observeElementVisibility } from '@/app/utils/performance';

// Lazy load all images with data-src attribute
lazyLoadImages('img[data-src]', {
  rootMargin: '50px',
  threshold: 0.01,
  onLoad: () => console.log('Image loaded'),
});

// Track element visibility
const observer = observeElementVisibility(
  element,
  (isVisible) => console.log('Visible:', isVisible),
  { rootMargin: '100px' }
);
```

#### 3. **code-splitting.ts**
Dynamic imports and route-based code splitting with metrics.

**Key Functions:**
- `dynamicImport()` - Import modules with timeout
- `dynamicImportWithRetry()` - Import with retry logic
- `getRouteChunks()` - Get chunks for specific routes
- `prefetchRoute()` - Prefetch route chunks
- `loadChunksConcurrently()` - Load multiple chunks in parallel
- `getChunkMetrics()` - Track chunk loading metrics
- `getSlowChunks()` - Identify slow-loading chunks

**Usage Example:**
```typescript
import { dynamicImport, prefetchRoute, DynamicComponent } from '@/app/utils/performance';

// Dynamic import with error handling
const module = await dynamicImport('components/admin', 10000);

// Prefetch routes on hover
const handleLinkHover = () => prefetchRoute('/dashboard');

// Use DynamicComponent for lazy-loaded components
<DynamicComponent
  componentPath="components/heavy-component"
  fallback={<LoadingSpinner />}
  errorFallback={<ErrorMessage />}
/>
```

#### 4. **cache-strategy.ts**
Multiple caching strategies for API calls and resources.

**Key Classes:**
- `TTLCache<T>` - In-memory cache with TTL support
- `LocalStorageCache<T>` - Browser storage cache

**Strategies:**
- `networkFirstFetch()` - Network with cache fallback
- `cacheFirstFetch()` - Cache with network fallback
- `staleWhileRevalidateFetch()` - Serve stale while refreshing

**Usage Example:**
```typescript
import { 
  TTLCache, 
  staleWhileRevalidateFetch, 
  createCachedFetch 
} from '@/app/utils/performance';

// Create a cache instance
const cache = new TTLCache({ maxAge: 5 * 60 * 1000 });

// Stale-while-revalidate fetch
const data = await staleWhileRevalidateFetch(
  '/api/data',
  cache,
  undefined,
  (newData) => console.log('Updated:', newData)
);

// Create preconfigured fetcher
const cachedFetch = createCachedFetch('stale-while-revalidate');
const result = await cachedFetch('/api/users');
```

#### 5. **bundle-analyzer.ts**
Analyze bundle sizes and identify optimization opportunities.

**Key Functions:**
- `analyzeBundleStats()` - Analyze bundle size
- `checkBundleBudget()` - Validate against performance budget
- `identifyCodeSplittingOpportunities()` - Find large modules
- `findDuplicateDependencies()` - Detect duplicate packages
- `estimateUnusedJS()` - Estimate unused code

**Usage Example:**
```typescript
import { analyzeBundleStats, checkBundleBudget, generateBundleReport } from '@/app/utils/performance';

const stats = analyzeBundleStats(webpackStats);
const budget = { total: 500 * 1024, js: 300 * 1024, css: 50 * 1024 };
const result = checkBundleBudget(stats, budget);

if (!result.passed) {
  console.warn(result.issues);
}

const report = generateBundleReport(stats, budget);
console.log(report);
```

#### 6. **web-vitals.ts**
Core Web Vitals tracking and performance monitoring.

**Key Functions:**
- `measureLCP()` - Measure Largest Contentful Paint
- `measureFCP()` - Measure First Contentful Paint
- `measureCLS()` - Measure Cumulative Layout Shift
- `measureFID()` - Measure First Input Delay
- `measureTTFB()` - Measure Time to First Byte
- `initWebVitals()` - Initialize all measurements
- `reportMetrics()` - Send metrics to analytics endpoint

**Usage Example:**
```typescript
import { 
  initWebVitals, 
  PerformanceMetricsCollector,
  checkVitalsHealth 
} from '@/app/utils/performance';

// Initialize in app layout
const { cleanup } = initWebVitals((metric) => {
  console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`);
  
  // Send to analytics
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
});

// Or use collector class
const collector = new PerformanceMetricsCollector();
collector.start();

// Later...
const health = collector.getHealth();
console.log(`Score: ${health.score}/100`);
if (!health.healthy) {
  console.warn('Issues:', health.issues);
}
```

### Performance Components (`app/components/performance/`)

#### **LazyImage.tsx**
Advanced lazy-loading image component with blur-up effect.

**Features:**
- Intersection Observer for lazy loading
- Multiple image format support (AVIF, WebP, JPG)
- Blur placeholder
- Error handling
- Responsive sizing
- Respects `prefers-reduced-motion`

**Props:**
```typescript
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean; // Load immediately
  quality?: number; // 1-100
  formats?: ('avif' | 'webp' | 'jpg')[];
  onLoad?: () => void;
  onError?: () => void;
}
```

**Usage:**
```tsx
<LazyImage
  src="/products/item.jpg"
  alt="Product"
  width={600}
  height={400}
  blurDataURL={blurredPlaceholder}
  formats={['avif', 'webp']}
  onLoad={() => console.log('Loaded')}
/>
```

#### **DynamicComponent.tsx**
Code-split wrapper component with loading and error states.

**Features:**
- Automatic code splitting
- Retry logic
- Custom loading/error fallbacks
- Suspense integration
- Prefetch hook

**Props:**
```typescript
interface DynamicComponentProps {
  componentPath: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  timeout?: number;
  maxRetries?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}
```

**Usage:**
```tsx
<DynamicComponent
  componentPath="components/analytics-dashboard"
  fallback={<Skeleton />}
  errorFallback={<ErrorBoundary />}
  timeout={10000}
  maxRetries={3}
/>

// With hook
const { component: Component, error, isLoading } = useDynamicComponent(
  'components/heavy-chart',
  { timeout: 10000 }
);
```

### Services (`app/services/`)

#### **service-worker.ts**
Service Worker registration and management for offline support.

**Key Functions:**
- `registerServiceWorker()` - Register SW with updates
- `unregisterServiceWorker()` - Cleanup
- `skipWaitingServiceWorker()` - Force update
- `cacheManager` - Cache operations
- `watchOnlineStatus()` - Monitor connectivity
- `prefetchForOffline()` - Prefetch resources

**Usage:**
```typescript
import { registerServiceWorker, watchOnlineStatus } from '@/app/services/service-worker';

// Register in useEffect
useEffect(() => {
  registerServiceWorker('/sw.js');
  
  // Watch online status
  const cleanup = watchOnlineStatus((isOnline) => {
    console.log('Online:', isOnline);
  });
  
  return cleanup;
}, []);
```

### Scripts (`app/scripts/`)

#### **performance-audit.js**
Automated performance analysis script.

**Features:**
- JavaScript bundle analysis
- CSS bundle analysis
- Image optimization review
- Code splitting analysis
- Next.js configuration check
- Performance recommendations

**Run:**
```bash
node app/scripts/performance-audit.js
```

**Output includes:**
- Bundle sizes and budgets
- Largest modules
- Image optimization recommendations
- Code splitting opportunities
- Configuration suggestions

### Configuration Files

#### **next-performance.config.js**
Ready-to-use Next.js performance configuration.

**Includes:**
- SWC minification
- Image optimization
- Font optimization
- Webpack splitting configuration
- Cache headers
- Experimental optimizations

**How to use:**
```javascript
// In next.config.js
const perfConfig = require('./next-performance.config.js');

module.exports = {
  ...otherConfig,
  ...perfConfig,
};
```

## 🚀 Implementation Guide

### 1. Initialize Web Vitals Tracking

In your root layout (`app/layout.tsx`):

```typescript
'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/app/utils/performance';

export default function RootLayout({ children }) {
  useEffect(() => {
    const { cleanup } = initWebVitals((metric) => {
      // Send to analytics service
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
        }),
        keepalive: true,
      }).catch(() => {});
    });

    return cleanup;
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Setup Service Worker

In your app initialization:

```typescript
import { registerServiceWorker } from '@/app/services/service-worker';

useEffect(() => {
  registerServiceWorker('/sw.js');
}, []);
```

### 3. Replace Image Components

Replace standard `<img>` tags with `LazyImage`:

```typescript
// Before
<img src="/image.jpg" alt="Description" />

// After
<LazyImage
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  formats={['avif', 'webp']}
/>
```

### 4. Implement Code Splitting

For heavy components:

```typescript
// Before
import HeavyChart from '@/components/heavy-chart';

// After
import DynamicComponent from '@/components/performance/DynamicComponent';

export default function Page() {
  return (
    <DynamicComponent
      componentPath="components/heavy-chart"
      fallback={<Skeleton />}
    />
  );
}
```

### 5. Setup Caching

For API calls:

```typescript
import { createCachedFetch } from '@/app/utils/performance';

const cachedFetch = createCachedFetch('stale-while-revalidate', {
  maxAge: 5 * 60 * 1000, // 5 minutes
});

const data = await cachedFetch('/api/data');
```

### 6. Monitor Bundle Size

Run the audit script:

```bash
npm run performance:audit
# or
node app/scripts/performance-audit.js
```

## 📈 Performance Checklist

- [ ] Web Vitals initialized and tracked
- [ ] Service Worker registered
- [ ] Images optimized with LazyImage
- [ ] Heavy components code-split
- [ ] API responses cached
- [ ] Bundle budget enforced
- [ ] Images in multiple formats (AVIF, WebP)
- [ ] Lazy loading for below-the-fold content
- [ ] Prefetch for critical routes
- [ ] Cache headers configured
- [ ] Audit script integrated in CI/CD

## 🔧 Customization

### Adjust Performance Budget

Edit `DEFAULT_BUDGET` in `app/utils/performance/bundle-analyzer.ts`:

```typescript
export const DEFAULT_BUDGET: BundleBudget = {
  total: 500 * 1024, // Adjust total size
  js: 300 * 1024,    // Adjust JS size
  css: 50 * 1024,    // Adjust CSS size
  warnAt: 80,        // Warn at 80% of budget
};
```

### Configure Cache TTL

In `cache-strategy.ts`:

```typescript
const cache = new TTLCache({
  maxAge: 10 * 60 * 1000, // 10 minutes
  staleWhileRevalidate: 2 * 60 * 1000, // 2 minutes
  maxSize: 100, // Max 100 entries
});
```

### Customize Service Worker

Edit `public/sw.js` to modify caching strategies and add offline handling.

## 📊 Monitoring

### Integration with Analytics

Send metrics to your analytics service:

```typescript
const collector = new PerformanceMetricsCollector();
collector.start();

// Periodically report
setInterval(() => {
  const health = collector.getHealth();
  // Send to analytics
  analytics.track('web_vitals', {
    score: health.score,
    healthy: health.healthy,
    issues: health.issues,
  });
}, 30000);
```

### GitHub Actions CI/CD Integration

Add to your GitHub Actions:

```yaml
- name: Performance Audit
  run: node app/scripts/performance-audit.js > audit-report.txt

- name: Upload Report
  uses: actions/upload-artifact@v2
  with:
    name: performance-audit
    path: audit-report.txt
```

## 📚 Resources

- [Web Vitals Guide](https://web.dev/vitals/)
- [Image Optimization](https://web.dev/performance-images/)
- [Code Splitting](https://web.dev/code-splitting-suspense-lazy-loading/)
- [Caching Strategies](https://web.dev/caching-strategies-workbox/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🎯 Next Steps

1. Integrate Web Vitals tracking in production
2. Setup analytics dashboard for monitoring
3. Implement A/B testing for performance improvements
4. Automate performance budgets in CI/CD
5. Regular audits and optimization cycles

---

**Last Updated:** 2024
**Status:** Production Ready
