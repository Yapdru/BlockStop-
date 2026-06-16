import React from 'react';
import { cn } from '../utils/cn';

/**
 * Alert severity types
 */
type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Alert component props interface
 */
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alert severity level */
  severity?: AlertSeverity;
  /** Alert title */
  title?: string;
  /** Whether to show close button */
  isCloseable?: boolean;
  /** Close button callback */
  onClose?: () => void;
}

/**
 * Alert Component
 *
 * A notification component for displaying messages with different severity levels.
 * Supports info, success, warning, and error states with optional close button.
 *
 * @example
 * ```tsx
 * <Alert severity="success" title="Success">
 *   Your changes have been saved.
 * </Alert>
 * <Alert severity="error" title="Error" isCloseable onClose={handleClose}>
 *   An error occurred. Please try again.
 * </Alert>
 * ```
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      severity = 'info',
      title,
      isCloseable = false,
      onClose,
      children,
      role = 'alert',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    const baseStyles = 'rounded-lg p-4 border text-sm transition-all duration-200';

    const severityStyles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };

    const iconColors = {
      info: 'text-blue-500',
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
    };

    const icons = {
      info: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(baseStyles, severityStyles[severity], className)}
        role={role}
        aria-live="polite"
        aria-atomic="true"
        {...props}
      >
        <div className="flex gap-3">
          <div className={cn('flex-shrink-0 mt-0.5', iconColors[severity])}>
            {icons[severity]}
          </div>
          <div className="flex-1">
            {title && <h3 className="font-semibold mb-1">{title}</h3>}
            <div>{children}</div>
          </div>
          {isCloseable && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 inline-flex text-current opacity-50 hover:opacity-75 transition-opacity"
              aria-label="Close alert"
              type="button"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
