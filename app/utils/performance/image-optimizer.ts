/**
 * Image Optimization Utilities
 * Handles image format conversion, responsive images, and optimization strategies
 */

export interface OptimizationOptions {
  formats?: ('webp' | 'avif' | 'jpg' | 'png')[];
  widths?: number[];
  quality?: number;
  generateSrcSet?: boolean;
}

export interface OptimizedImageSet {
  src: string;
  srcSet: string;
  sizes?: string;
  formats: {
    avif?: string;
    webp?: string;
    fallback: string;
  };
}

/**
 * Generate responsive image URLs with multiple formats
 * Supports AVIF (best compression), WebP (good compression), and fallback formats
 */
export const generateResponsiveImages = (
  originalUrl: string,
  options: OptimizationOptions = {}
): OptimizedImageSet => {
  const {
    formats = ['avif', 'webp', 'jpg'],
    widths = [320, 640, 960, 1280, 1920],
    quality = 75,
    generateSrcSet = true,
  } = options;

  const baseUrl = new URL(originalUrl, typeof window !== 'undefined' ? window.location.origin : '');
  const basePath = baseUrl.pathname;
  const params = new URLSearchParams(baseUrl.search);

  // Generate srcset strings for each format
  const generateFormatSrcSet = (format: string) => {
    return widths
      .map((width) => {
        const formatPath = basePath.replace(/(\.[\w]+)$/, `-${width}w.${format}`);
        params.set('q', quality.toString());
        params.set('auto', 'format');
        return `${formatPath}?${params.toString()} ${width}w`;
      })
      .join(', ');
  };

  const formatUrls: Record<string, string> = {};
  formats.forEach((format) => {
    formatUrls[format] = generateFormatSrcSet(format);
  });

  return {
    src: originalUrl,
    srcSet: generateSrcSet ? formatUrls['jpg'] || formatUrls[formats[formats.length - 1]] : originalUrl,
    sizes: '(max-width: 640px) 100vw, (max-width: 1280px) 80vw, 1200px',
    formats: {
      avif: formats.includes('avif') ? formatUrls['avif'] : undefined,
      webp: formats.includes('webp') ? formatUrls['webp'] : undefined,
      fallback: originalUrl,
    },
  };
};

/**
 * Generate picture element markup for progressive image loading
 */
export const generatePictureMarkup = (
  imageSrc: string,
  alt: string,
  options: OptimizationOptions = {}
): string => {
  const optimized = generateResponsiveImages(imageSrc, options);

  return `
    <picture>
      ${optimized.formats.avif ? `<source srcset="${optimized.formats.avif}" type="image/avif">` : ''}
      ${optimized.formats.webp ? `<source srcset="${optimized.formats.webp}" type="image/webp">` : ''}
      <img
        src="${optimized.src}"
        srcset="${optimized.srcSet}"
        sizes="${optimized.sizes}"
        alt="${alt}"
        loading="lazy"
        decoding="async"
      />
    </picture>
  `.trim();
};

/**
 * Calculate optimal image dimensions for responsive design
 */
export const calculateResponsiveDimensions = (
  containerWidth: number,
  pixelRatio: number = 2
): { width: number; height: number; density: string } => {
  const width = Math.ceil(containerWidth * pixelRatio);
  const height = Math.ceil((width / 16) * 9); // 16:9 aspect ratio

  return {
    width,
    height,
    density: `${pixelRatio}x`,
  };
};

/**
 * Get optimal image format for the current browser
 */
export const getBrowserOptimalFormat = (): 'avif' | 'webp' | 'jpg' => {
  if (typeof window === 'undefined') return 'jpg';

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  // Check AVIF support
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 1, 1);
      if (canvas.toDataURL('image/avif').indexOf('avif') === 5) {
        return 'avif';
      }
    }
  } catch (e) {
    // AVIF not supported
  }

  // Check WebP support
  if (canvas.toDataURL('image/webp').indexOf('webp') === 5) {
    return 'webp';
  }

  return 'jpg';
};

/**
 * Cache busting helper for optimized images
 */
export const addCacheBuster = (url: string, version?: string): string => {
  const timestamp = version || new Date().getTime().toString();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
};

/**
 * Estimate image load time based on network conditions
 */
export const estimateImageLoadTime = (
  fileSizeKB: number,
  networkSpeedMBps: number = 5
): number => {
  // Convert KB to MB and calculate seconds
  const fileSizeMB = fileSizeKB / 1024;
  return (fileSizeMB / networkSpeedMBps) * 1000; // Return in milliseconds
};

/**
 * Generate blur-up placeholder data URL
 */
export const generateBlurPlaceholder = (
  color: string = '#e5e5e5',
  width: number = 20,
  height: number = 20
): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect fill="${color}" width="${width}" height="${height}"/>
      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      </filter>
      <rect fill="${color}" width="${width}" height="${height}" filter="url(#blur)" opacity="0.8"/>
    </svg>
  `.trim();

  const encoded = btoa(svg);
  return `data:image/svg+xml;base64,${encoded}`;
};

/**
 * Detect if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Detect high contrast mode preference
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(prefers-contrast: max)').matches
  );
};

/**
 * Image optimization config for Next.js Image component
 */
export const imageOptimizationConfig = {
  deviceSizes: [640, 750, 828, 1080, 1280, 1536],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  dangerouslyAllowSVG: false,
};
