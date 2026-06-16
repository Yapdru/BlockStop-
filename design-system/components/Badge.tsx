import React from 'react';
import { cn } from '../utils/cn';

/**
 * Badge variant types
 */
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * Badge size types
 */
type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Badge component props interface
 */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Whether badge is removable */
  isRemovable?: boolean;
  /** Remove callback */
  onRemove?: () => void;
  /** Custom label for accessibility */
  label?: string;
}

/**
 * Badge Component
 *
 * A small label component for displaying status, categories, or tags.
 * Supports multiple variants and optional removal functionality.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" isRemovable onRemove={handleRemove}>
 *   Archived
 * </Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isRemovable = false,
      onRemove,
      label,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors duration-200';

    const variantStyles = {
      default: 'bg-neutral-200 text-neutral-800',
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-purple-100 text-purple-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        aria-label={label}
        role="status"
        {...props}
      >
        {children}
        {isRemovable && (
          <button
            onClick={onRemove}
            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors"
            aria-label={`Remove ${label || children}`}
            type="button"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
