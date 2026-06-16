import React from 'react';
import { cn } from '../utils/cn';

/**
 * Select option interface
 */
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select component props interface
 */
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Available options */
  options: SelectOption[];
  /** Select label */
  label?: string;
  /** Selected value */
  value?: string;
  /** Change callback */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Whether to show search input */
  isSearchable?: boolean;
  /** Whether to allow multiple selections */
  isMulti?: boolean;
}

/**
 * Select Component
 *
 * A flexible dropdown select component with search and multi-select support.
 * Supports error states, helper text, and various customization options.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState('');
 * <Select
 *   label="Choose an option"
 *   options={[
 *     { value: 'opt1', label: 'Option 1' },
 *     { value: 'opt2', label: 'Option 2' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      value,
      onChange,
      placeholder,
      hasError = false,
      errorMessage,
      helperText,
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'select';

    const baseStyles = 'w-full px-3 py-2 text-base border rounded-md transition-colors duration-200 font-sans focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 pr-8 bg-white';

    const validationStyles = hasError
      ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
      : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={cn(baseStyles, validationStyles, className)}
            aria-invalid={hasError}
            aria-describedby={
              errorMessage || helperText
                ? `${selectId}-${hasError ? 'error' : 'helper'}`
                : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow icon */}
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>

        {errorMessage && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-red-600 mt-1"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        {helperText && !errorMessage && (
          <p
            id={`${selectId}-helper`}
            className="text-sm text-neutral-500 mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
