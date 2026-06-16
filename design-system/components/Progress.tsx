import React from 'react';
import { cn } from '../utils/cn';

/**
 * Progress bar variant types
 */
type ProgressVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * Linear progress component props interface
 */
interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value (0-100) */
  value: number;
  /** Progress variant */
  variant?: ProgressVariant;
  /** Show percentage label */
  showLabel?: boolean;
  /** Progress bar size */
  size?: 'sm' | 'md' | 'lg';
  /** Animated progress */
  isAnimated?: boolean;
}

/**
 * Circular progress component props interface
 */
interface CircularProgressProps extends React.HTMLAttributes<SVGElement> {
  /** Progress value (0-100) */
  value: number;
  /** Progress variant */
  variant?: ProgressVariant;
  /** Show percentage label */
  showLabel?: boolean;
  /** Progress circle size */
  size?: number;
  /** Circle stroke width */
  strokeWidth?: number;
}

/**
 * LinearProgress Component
 *
 * A linear progress bar component showing completion percentage.
 * Supports multiple variants, animated state, and optional label.
 *
 * @example
 * ```tsx
 * <LinearProgress value={65} />
 * <LinearProgress value={80} variant="success" showLabel isAnimated />
 * ```
 */
export const LinearProgress = React.forwardRef<HTMLDivElement, LinearProgressProps>(
  (
    {
      className,
      value,
      variant = 'primary',
      showLabel = false,
      size = 'md',
      isAnimated = false,
      ...props
    },
    ref
  ) => {
    const boundValue = Math.min(Math.max(value, 0), 100);

    const baseStyles = 'relative w-full bg-neutral-200 rounded-full overflow-hidden';

    const sizeStyles = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const variantStyles = {
      primary: 'bg-blue-600',
      secondary: 'bg-purple-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], className)}
        role="progressbar"
        aria-valuenow={boundValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress"
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            variantStyles[variant],
            isAnimated && 'animate-pulse'
          )}
          style={{ width: `${boundValue}%` }}
        />

        {showLabel && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-700">
            {boundValue}%
          </span>
        )}
      </div>
    );
  }
);

LinearProgress.displayName = 'LinearProgress';

/**
 * CircularProgress Component
 *
 * A circular progress indicator showing completion percentage.
 * Useful for showing progress in a more compact, visual way.
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} size={100} />
 * <CircularProgress value={90} variant="success" showLabel />
 * ```
 */
export const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      className,
      value,
      variant = 'primary',
      showLabel = false,
      size = 100,
      strokeWidth = 4,
      ...props
    },
    ref
  ) => {
    const boundValue = Math.min(Math.max(value, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (boundValue / 100) * circumference;

    const variantColors = {
      primary: '#3b82f6',
      secondary: '#a855f7',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    };

    return (
      <div className="inline-flex items-center justify-center">
        <svg
          ref={ref}
          width={size}
          height={size}
          className={cn('transform -rotate-90', className)}
          role="progressbar"
          aria-valuenow={boundValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress"
          {...props}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={variantColors[variant]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>

        {showLabel && (
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-neutral-900">
              {boundValue}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';
