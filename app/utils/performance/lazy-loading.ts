/**
 * Lazy Loading Utilities
 * Handles lazy loading strategies for images, components, and resources
 */

export interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number | number[];
  onLoad?: () => void;
  onError?: () => void;
}

export interface IntersectionConfig {
  root?: Element | null;
  rootMargin: string;
  threshold: number | number[];
}

/**
 * Observe element for lazy loading with Intersection Observer API
 */
export const observeElement = (
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options: LazyLoadingOptions = {}
): IntersectionObserver => {
  const {
    rootMargin = '50px',
    threshold = 0.01,
  } = options;

  const config: IntersectionConfig = {
    root: null,
    rootMargin,
    threshold,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
        observer.unobserve(entry.target);
      }
    });
  }, config);

  observer.observe(element);
  return observer;
};

/**
 * Lazy load an image with Intersection Observer
 */
export const lazyLoadImage = (
  imageElement: HTMLImageElement,
  options: LazyLoadingOptions = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const { onLoad, onError, ...observerOptions } = options;

    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      imageElement.src = imageElement.dataset.src || '';
      imageElement.onload = () => {
        onLoad?.();
        resolve();
      };
      imageElement.onerror = () => {
        onError?.();
        reject(new Error('Failed to load image'));
      };
      return;
    }

    const observer = observeElement(
      imageElement,
      () => {
        const src = imageElement.dataset.src;
        const srcSet = imageElement.dataset.srcset;

        if (src) {
          imageElement.src = src;
        }
        if (srcSet) {
          imageElement.srcset = srcSet;
        }

        imageElement.onload = () => {
          imageElement.classList.add('lazy-loaded');
          onLoad?.();
          resolve();
        };

        imageElement.onerror = () => {
          imageElement.classList.add('lazy-error');
          onError?.();
          reject(new Error('Failed to load image'));
        };
      },
      observerOptions
    );
  });
};

/**
 * Lazy load multiple images
 */
export const lazyLoadImages = (
  selector: string = 'img[data-src]',
  options: LazyLoadingOptions = {}
): Promise<void[]> => {
  if (typeof document === 'undefined') {
    return Promise.resolve([]);
  }

  const images = Array.from(document.querySelectorAll(selector)) as HTMLImageElement[];
  return Promise.allSettled(
    images.map((img) => lazyLoadImage(img, options))
  ) as any;
};

/**
 * Request idle callback shim with fallback
 */
export const scheduleIdleCallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  const startTime = performance.now();
  return window.setTimeout(() => {
    const deadline = {
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (performance.now() - startTime)),
    };
    callback(deadline as any);
  }, 1) as any;
};

/**
 * Cancel idle callback with fallback
 */
export const cancelIdleCallback = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
};

/**
 * Prefetch resource with link rel="prefetch"
 */
export const prefetchResource = (url: string, type: 'script' | 'style' | 'image' = 'script'): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
};

/**
 * Preload critical resources
 */
export const preloadResource = (url: string, type: string): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
};

/**
 * Lazy load script
 */
export const lazyLoadScript = (
  src: string,
  options: LazyLoadingOptions & { async?: boolean; defer?: boolean } = {}
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const { onLoad, onError, async: isAsync = true, defer = false, ...observerOptions } = options;

    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = isAsync;
    script.defer = defer;

    script.onload = () => {
      onLoad?.();
      resolve();
    };

    script.onerror = () => {
      onError?.();
      reject(new Error(`Failed to load script: ${src}`));
    };

    // Use Intersection Observer if root margin specified
    if (observerOptions.rootMargin) {
      const observer = observeElement(
        script,
        () => {
          document.body.appendChild(script);
        },
        observerOptions
      );
    } else {
      document.body.appendChild(script);
    }
  });
};

/**
 * Lazy load stylesheet
 */
export const lazyLoadStylesheet = (
  href: string,
  media: string = 'all'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';

    link.onload = () => {
      link.media = media;
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load stylesheet: ${href}`));
    };

    document.head.appendChild(link);
  });
};

/**
 * Generate intersection observer for element visibility tracking
 */
export const observeElementVisibility = (
  element: Element,
  callback: (isVisible: boolean) => void,
  options: LazyLoadingOptions = {}
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const { rootMargin = '0px', threshold = 0.5 } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry.isIntersecting);
      });
    },
    { rootMargin, threshold }
  );

  observer.observe(element);
  return observer;
};

/**
 * Batch lazy loading operations for performance
 */
export const batchLazyLoad = async (
  elements: Element[],
  callback: (element: Element) => Promise<void>,
  batchSize: number = 5
): Promise<void> => {
  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = elements.slice(i, i + batchSize);
    await Promise.all(batch.map(callback));
    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};
