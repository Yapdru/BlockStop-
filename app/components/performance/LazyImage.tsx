'use client';

import React, { useState, useEffect, useRef } from 'react';
import { lazyLoadImage, observeElementVisibility } from '@/app/utils/performance/lazy-loading';
import { generateResponsiveImages, prefersReducedMotion } from '@/app/utils/performance/image-optimizer';

export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  formats?: ('avif' | 'webp' | 'jpg')[];
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

/**
 * LazyImage Component
 * Handles lazy loading with AVIF/WebP format support and fallback
 */
export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      className = '',
      placeholder,
      blurDataURL,
      priority = false,
      quality = 75,
      formats = ['avif', 'webp', 'jpg'],
      onLoad,
      onError,
      sizes,
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const [visibility, setVisibility] = useState(priority);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => imageRef.current as HTMLImageElement);

    useEffect(() => {
      const img = imageRef.current;
      if (!img || priority) return;

      // Track visibility
      const observer = observeElementVisibility(
        containerRef.current || img,
        (isVisible) => {
          setVisibility(isVisible);
        },
        { rootMargin: '50px' }
      );

      return () => observer?.disconnect();
    }, [priority]);

    useEffect(() => {
      const img = imageRef.current;
      if (!img) return;

      // Load image when visible or prioritized
      if (isLoaded || !visibility) return;

      lazyLoadImage(img, {
        rootMargin: '50px',
        onLoad: () => {
          setIsLoaded(true);
          onLoad?.();
        },
        onError: () => {
          setHasError(true);
          onError?.();
        },
      }).catch(() => {
        setHasError(true);
        onError?.();
      });
    }, [visibility, isLoaded, onLoad, onError]);

    const optimizedImages = generateResponsiveImages(src, { formats, quality });
    const shouldReduceMotion = prefersReducedMotion();

    const aspectRatio = width && height ? (width / height).toFixed(2) : undefined;

    return (
      <div
        ref={containerRef}
        className={`lazy-image-container ${className}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: width ? `${width}px` : '100%',
          aspectRatio: aspectRatio || 'auto',
        }}
      >
        {/* Picture element with multiple formats */}
        <picture>
          {optimizedImages.formats.avif && formats.includes('avif') && (
            <source
              srcSet={optimizedImages.formats.avif}
              type="image/avif"
              sizes={sizes || optimizedImages.sizes}
            />
          )}
          {optimizedImages.formats.webp && formats.includes('webp') && (
            <source
              srcSet={optimizedImages.formats.webp}
              type="image/webp"
              sizes={sizes || optimizedImages.sizes}
            />
          )}
          <img
            ref={imageRef}
            data-src={optimizedImages.src}
            data-srcset={optimizedImages.srcSet}
            alt={alt}
            width={width}
            height={height}
            className={`lazy-image ${isLoaded ? 'lazy-loaded' : ''} ${hasError ? 'lazy-error' : ''}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: shouldReduceMotion ? 'none' : 'opacity 0.3s ease-in-out',
              opacity: isLoaded ? 1 : 0.7,
            }}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes || optimizedImages.sizes}
          />
        </picture>

        {/* Placeholder/Skeleton */}
        {!isLoaded && !hasError && (
          <div
            className="lazy-placeholder"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: placeholder || '#f0f0f0',
              backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1,
              animation: shouldReduceMotion ? 'none' : 'pulse 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Error state */}
        {hasError && (
          <div
            className="lazy-error-state"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              color: '#999',
              fontSize: '14px',
              zIndex: 1,
            }}
          >
            Failed to load image
          </div>
        )}

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          :global(.lazy-image) {
            will-change: opacity;
          }

          :global(.lazy-loaded) {
            animation: fadeIn 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

export default LazyImage;
