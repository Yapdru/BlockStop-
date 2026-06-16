import React from 'react';
import { cn } from '../utils/cn';

/**
 * Checkbox component props interface
 */
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Checkbox label */
  label?: string;
  /** Indeterminate state (neither checked nor unchecked) */
  isIndeterminate?: boolean;
  /** Error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
}

/**
 * Checkbox Component
 *
 * An accessible checkbox component with support for standard and indeterminate states.
 * Includes optional label, error state, and helper text.
 *
 * @example
 * ```tsx
 * <Checkbox label="I agree to the terms" />
 * <Checkbox isIndeterminate label="Select all items" />
 * <Checkbox hasError errorMessage="Required field" />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      isIndeterminate = false,
      hasError = false,
      errorMessage,
      helperText,
      id,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'checkbox';
    const internalRef = React.useRef<HTMLInputElement>(null);

    // Set indeterminate state
    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = isIndeterminate;
      }
    }, [isIndeterminate]);

    const baseStyles = 'w-5 h-5 rounded-md transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

    const checkboxStyles = hasError
      ? 'border-2 border-red-500 bg-white'
      : 'border-2 border-neutral-300 bg-white checked:bg-blue-600 checked:border-blue-600 hover:border-neutral-400';

    return (
      <div>
        <div className="flex items-center gap-2">
          <input
            ref={ref || internalRef}
            id={checkboxId}
            type="checkbox"
            className={cn(baseStyles, checkboxStyles, className)}
            disabled={disabled}
            aria-disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              errorMessage || helperText ? `${checkboxId}-help` : undefined
            }
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium cursor-pointer select-none',
                disabled ? 'text-neutral-400' : 'text-neutral-700'
              )}
            >
              {label}
            </label>
          )}
        </div>

        {errorMessage && (
          <p
            id={`${checkboxId}-help`}
            className="text-sm text-red-600 mt-1 ml-7"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        {helperText && !errorMessage && (
          <p
            id={`${checkboxId}-help`}
            className="text-sm text-neutral-500 mt-1 ml-7"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
