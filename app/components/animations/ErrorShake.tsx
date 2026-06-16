'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { duration, springConfig } from '@/app/utils/motion';
import '@/app/styles/keyframes.css';
import { AlertCircle, XCircle } from 'lucide-react';

interface ErrorShakeProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDuration?: number;
  severity?: 'error' | 'warning' | 'info';
  className?: string;
}

/**
 * ErrorShake Component
 * Animated error state with shake effect
 * Perfect for form validation, error alerts, and failed operations
 *
 * @example
 * <ErrorShake
 *   isVisible={hasError}
 *   title="Error!"
 *   message="Failed to save your changes."
 * />
 */
export const ErrorShake: React.FC<ErrorShakeProps> = ({
  isVisible,
  title = 'Error!',
  message = 'Something went wrong.',
  onDismiss,
  autoDismiss = false,
  autoDismissDuration = 4000,
  severity = 'error',
  className = '',
}) => {
  const [shouldShow, setShouldShow] = useState(isVisible);

  useEffect(() => {
    setShouldShow(isVisible);

    if (isVisible && autoDismiss) {
      const timer = setTimeout(() => {
        setShouldShow(false);
        onDismiss?.();
      }, autoDismissDuration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismiss, autoDismissDuration, onDismiss]);

  if (!shouldShow) return null;

  const severityMap = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-500',
      iconBg: 'bg-red-100',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-500',
      iconBg: 'bg-yellow-100',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-500',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = severityMap[severity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: duration.fast, ...springConfig.default }}
      className={`animate-shake ${styles.bg} border ${styles.border} rounded-lg p-6 ${className}`}
    >
      <div className="flex gap-4">
        {/* Icon Container */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: duration.slow,
            ...springConfig.bouncy,
          }}
          className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg ${styles.iconBg}`}
        >
          {severity === 'error' ? (
            <XCircle className={`w-6 h-6 ${styles.icon}`} strokeWidth={1.5} />
          ) : (
            <AlertCircle className={`w-6 h-6 ${styles.icon}`} strokeWidth={1.5} />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1">
          <motion.h3
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: duration.normal, delay: 0.1 }}
            className={`font-semibold ${styles.text}`}
          >
            {title}
          </motion.h3>

          {message && (
            <motion.p
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: duration.normal, delay: 0.15 }}
              className={`text-sm ${styles.text} opacity-80 mt-1`}
            >
              {message}
            </motion.p>
          )}
        </div>

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.normal, delay: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShouldShow(false);
            onDismiss?.();
          }}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * ShakeInput Component
 * Input field with shake animation for validation errors
 */
interface ShakeInputProps {
  hasError?: boolean;
  errorMessage?: string;
  label?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export const ShakeInput: React.FC<ShakeInputProps> = ({
  hasError = false,
  errorMessage = '',
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <motion.div
        animate={hasError ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            hasError
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } ${className}`}
        />
      </motion.div>

      {hasError && errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-2"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
};

/**
 * ErrorPulse Component
 * Pulsing error indicator
 */
interface ErrorPulseProps {
  message: string;
  className?: string;
}

export const ErrorPulse: React.FC<ErrorPulseProps> = ({
  message,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.normal }}
      className={`flex items-center gap-2 text-red-600 ${className}`}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex-shrink-0"
      >
        <XCircle className="w-5 h-5" />
      </motion.div>
      <span className="text-sm">{message}</span>
    </motion.div>
  );
};

/**
 * ValidationError Component
 * Form field validation error with animation
 */
interface ValidationErrorProps {
  isVisible: boolean;
  message: string;
  className?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  isVisible,
  message,
  className = '',
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: duration.fast }}
      className={`overflow-hidden ${className}`}
    >
      <p className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded border border-red-200">
        {message}
      </p>
    </motion.div>
  );
};

/**
 * ErrorBoundary Component
 * Error display with retry functionality
 */
interface ErrorBoundaryProps {
  error: string | null;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  className = '',
}) => {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-700 mb-1">
            {title}
          </h3>

          <p className="text-red-600 text-sm mb-4">{error}</p>

          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorShake;
