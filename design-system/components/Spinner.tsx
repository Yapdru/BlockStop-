import React from 'react';
import { cn } from '../utils/cn';

/**
 * Spinner size types
 */
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner component props interface
 */
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: SpinnerSize;
  /** Spinner color */
  color?: 'primary' | 'secondary' | 'white';
  /** Loading label text */
  label?: string;
}

/**
 * Spinner Component
 *
 * An animated loading indicator component available in multiple sizes and colors.
 * Can include optional label text for accessibility and user feedback.
 *
 * @example
 * ```tsx
 * <Spinner size="md" />
 * <Spinner size="lg" color="primary" label="Loading data..." />
 * ```
 */
export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      className,
      size = 'md',
      color = 'primary',
      label,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    };

    const colorStyles = {
      primary: 'border-blue-200 border-t-blue-600',
      secondary: 'border-purple-200 border-t-purple-600',
      white: 'border-white border-opacity-30 border-t-white',
    };

    const labelSizeStyles = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center gap-3', className)}
        role="status"
        aria-label={label || 'Loading'}
        aria-live="polite"
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-4',
            sizeStyles[size],
            colorStyles[color]
          )}
          aria-hidden="true"
        />

        {label && (
          <p className={cn('font-medium', labelSizeStyles[size])}>
            {label}
          </p>
        )}
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
