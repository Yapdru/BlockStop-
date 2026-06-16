import React from 'react';
import { cn } from '../utils/cn';

/**
 * Radio option interface
 */
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * RadioGroup component props interface
 */
interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** Group name */
  name: string;
  /** Available radio options */
  options: RadioOption[];
  /** Selected value */
  value?: string;
  /** Change callback */
  onChange?: (value: string) => void;
  /** Radio group label */
  label?: string;
  /** Direction of radio items */
  direction?: 'row' | 'column';
  /** Error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
}

/**
 * RadioGroup Component
 *
 * A group of radio buttons for single selection from multiple options.
 * Supports horizontal and vertical layouts with error states.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState('option1');
 * <RadioGroup
 *   name="options"
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * ```
 */
export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      className,
      name,
      options,
      value,
      onChange,
      label,
      direction = 'column',
      hasError = false,
      errorMessage,
      ...props
    },
    ref
  ) => {
    const groupId = name;

    return (
      <fieldset
        ref={ref}
        className={cn('space-y-2', className)}
        aria-invalid={hasError}
        {...props}
      >
        {label && (
          <legend className="text-sm font-medium text-neutral-700 mb-3">
            {label}
          </legend>
        )}

        <div
          className={cn(
            'space-y-2',
            direction === 'row' && 'flex gap-4'
          )}
          role="group"
          aria-labelledby={label ? `${groupId}-legend` : undefined}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center">
              <input
                type="radio"
                id={`${groupId}-${option.value}`}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={option.disabled}
                className={cn(
                  'w-5 h-5 rounded-full transition-colors duration-200 cursor-pointer',
                  'border-2 border-neutral-300 appearance-none relative',
                  'checked:border-blue-600 checked:bg-blue-600',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  'hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50',
                  hasError && 'border-red-500 checked:bg-red-600 checked:border-red-600'
                )}
                aria-describedby={errorMessage ? `${groupId}-error` : undefined}
              />
              <label
                htmlFor={`${groupId}-${option.value}`}
                className={cn(
                  'ml-3 text-sm font-medium cursor-pointer select-none',
                  option.disabled ? 'text-neutral-400' : 'text-neutral-700'
                )}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>

        {errorMessage && (
          <p
            id={`${groupId}-error`}
            className="text-sm text-red-600 mt-2"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
