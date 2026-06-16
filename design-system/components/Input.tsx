import React from 'react';
import { cn } from '../utils/cn';

/**
 * Input type variants
 */
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

/**
 * Input validation states
 */
type ValidationState = 'default' | 'success' | 'error' | 'warning';

/**
 * Input component props interface
 */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Input type */
  type?: InputType;
  /** Validation state */
  validationState?: ValidationState;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text to display */
  helperText?: string;
  /** Label for the input */
  label?: string;
  /** Whether input is required */
  isRequired?: boolean;
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Input Component
 *
 * A flexible input component with validation states and helper text.
 * Supports text, email, password, number, tel, and url types.
 *
 * @example
 * ```tsx
 * <Input type="email" label="Email" placeholder="you@example.com" />
 * <Input type="password" label="Password" validationState="error" errorMessage="Password too short" />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      validationState = 'default',
      errorMessage,
      helperText,
      label,
      isRequired = false,
      fullWidth = false,
      id,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'input';

    const baseStyles = 'w-full px-3 py-2 text-base border rounded-md transition-colors duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

    const validationStyles = {
      default: 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500',
      success: 'border-green-500 focus:border-green-600 focus:ring-green-500',
      error: 'border-red-500 focus:border-red-600 focus:ring-red-500',
      warning: 'border-yellow-500 focus:border-yellow-600 focus:ring-yellow-500',
    };

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {isRequired && <span className="text-red-600 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(baseStyles, validationStyles[validationState], className)}
          disabled={disabled}
          aria-disabled={disabled}
          aria-invalid={validationState === 'error'}
          aria-describedby={
            errorMessage || helperText
              ? `${inputId}-${validationState === 'error' ? 'error' : 'helper'}`
              : undefined
          }
          {...props}
        />
        {errorMessage && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 mt-1"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-neutral-500 mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
