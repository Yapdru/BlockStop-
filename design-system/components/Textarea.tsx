import React from 'react';
import { cn } from '../utils/cn';

/**
 * Textarea component props interface
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea label */
  label?: string;
  /** Whether input is required */
  isRequired?: boolean;
  /** Error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Show character counter */
  showCounter?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Whether to allow resize */
  isResizable?: boolean;
}

/**
 * Textarea Component
 *
 * A flexible textarea component with optional character counter and resize control.
 * Includes validation states, helper text, and auto-grow functionality.
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Message"
 *   placeholder="Enter your message..."
 *   showCounter
 *   maxLength={500}
 * />
 * <Textarea
 *   hasError
 *   errorMessage="This field is required"
 * />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      isRequired = false,
      hasError = false,
      errorMessage,
      helperText,
      showCounter = false,
      maxLength,
      isResizable = true,
      id,
      disabled = false,
      value = '',
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'textarea';
    const [charCount, setCharCount] = React.useState(String(value).length);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    const baseStyles = 'w-full px-3 py-2 text-base border rounded-md transition-colors duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 font-sans';

    const validationStyles = hasError
      ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
      : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500';

    const resizeStyle = !isResizable ? 'resize-none' : 'resize-y';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {isRequired && <span className="text-red-600 ml-1" aria-label="required">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            baseStyles,
            validationStyles,
            resizeStyle,
            'min-h-24',
            className
          )}
          disabled={disabled}
          aria-disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            errorMessage || helperText || showCounter
              ? `${textareaId}-${errorMessage ? 'error' : helperText ? 'helper' : 'counter'}`
              : undefined
          }
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          {...props}
        />

        {/* Footer with counter and helper text */}
        <div className="mt-2 flex items-center justify-between">
          <div>
            {errorMessage && (
              <p
                id={`${textareaId}-error`}
                className="text-sm text-red-600"
                role="alert"
              >
                {errorMessage}
              </p>
            )}
            {helperText && !errorMessage && (
              <p
                id={`${textareaId}-helper`}
                className="text-sm text-neutral-500"
              >
                {helperText}
              </p>
            )}
          </div>

          {showCounter && maxLength && (
            <p
              id={`${textareaId}-counter`}
              className={cn(
                'text-sm font-medium',
                charCount > maxLength * 0.9
                  ? 'text-yellow-600'
                  : 'text-neutral-500'
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
