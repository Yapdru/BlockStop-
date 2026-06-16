import React from 'react';
import { cn } from '../utils/cn';

/**
 * Skeleton variant types
 */
type SkeletonVariant = 'text' | 'circle' | 'rectangle';

/**
 * Skeleton component props interface
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Number of text lines to show */
  lines?: number;
  /** Gap between lines */
  lineGap?: string;
}

/**
 * Skeleton Component
 *
 * A loading placeholder component that mimics the shape of content being loaded.
 * Useful for skeleton loading screens to improve perceived performance.
 *
 * @example
 * ```tsx
 * <Skeleton variant="circle" width={40} height={40} />
 * <Skeleton variant="text" lines={3} />
 * <Skeleton variant="rectangle" width="100%" height={200} />
 * ```
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'text',
      width,
      height,
      lines = 1,
      lineGap = '8px',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-neutral-200 animate-pulse';

    const variantStyles = {
      text: 'rounded-md h-4 w-full',
      circle: 'rounded-full',
      rectangle: 'rounded-lg',
    };

    const getStyles = () => {
      if (variant === 'text' && lines > 1) {
        return null; // Will render multiple lines
      }

      return cn(
        baseStyles,
        variantStyles[variant],
        className
      );
    };

    const getWidthHeight = () => {
      const style: React.CSSProperties = {};

      if (width) {
        style.width = typeof width === 'number' ? `${width}px` : width;
      }

      if (height) {
        style.height = typeof height === 'number' ? `${height}px` : height;
      }

      return style;
    };

    // For multi-line text skeletons
    if (variant === 'text' && lines > 1) {
      return (
        <div
          ref={ref}
          className="space-y-2"
          style={{ gap: lineGap }}
          aria-hidden="true"
          {...props}
        >
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseStyles,
                variantStyles.text,
                i === lines - 1 && 'w-4/5', // Last line is shorter
                className
              )}
            />
          ))}
        </div>
      );
    }

    // For single variant skeletons
    return (
      <div
        ref={ref}
        className={getStyles()}
        style={getWidthHeight()}
        aria-hidden="true"
        role="presentation"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
