import React from 'react';
import { cn } from '../utils/cn';

/**
 * Button variant types
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button size types
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props interface
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether button is in loading state */
  isLoading?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading spinner text */
  loadingText?: string;
}

/**
 * Button Component
 *
 * A versatile button component with multiple variants and sizes.
 * Supports primary, secondary, ghost, and danger variants.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="danger" disabled>Delete</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      loadingText = 'Loading...',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary:
        'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 active:bg-purple-800',
      ghost:
        'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300 active:bg-neutral-200',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-6 py-3 text-lg h-12',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
