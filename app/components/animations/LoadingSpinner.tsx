'use client';

import React from 'react';
import '@/app/styles/keyframes.css';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'default' | 'dots' | 'ring' | 'dual-ring' | 'pulse';

const sizeMap: Record<SpinnerSize, { container: string; border: string }> = {
  sm: { container: 'w-6 h-6', border: 'border-2' },
  md: { container: 'w-8 h-8', border: 'border-3' },
  lg: { container: 'w-12 h-12', border: 'border-4' },
  xl: { container: 'w-16 h-16', border: 'border-4' },
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  color?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

/**
 * LoadingSpinner Component
 * Animated loading spinner with multiple variants
 * Perfect for async operations, data fetching, and loading states
 *
 * @example
 * <LoadingSpinner size="md" variant="default" color="blue" />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'blue',
  className = '',
  label = 'Loading...',
  showLabel = false,
}) => {
  const { container, border } = sizeMap[size];
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500',
    red: 'border-red-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500',
  };

  const spinnerColor = colorMap[color] || 'border-blue-500';

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${spinnerColor} animate-pulse`}
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        {showLabel && <p className="text-sm text-gray-600">{label}</p>}
      </div>
    );
  }

  if (variant === 'ring') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div
          className={`${container} border-4 border-transparent rounded-full animate-spin`}
          style={{
            borderTopColor: color === 'blue' ? '#3b82f6' : `var(--color-${color})`,
            borderRightColor: color === 'blue' ? '#3b82f6' : `var(--color-${color})`,
          }}
        />
        {showLabel && <p className="text-sm text-gray-600">{label}</p>}
      </div>
    );
  }

  if (variant === 'dual-ring') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div
          className={`${container} rounded-full animate-spin`}
          style={{
            borderWidth: '4px',
            borderStyle: 'solid',
            borderColor: color === 'blue' ? '#e0e7ff #3b82f6 #e0e7ff #3b82f6' : `var(--light-${color}) var(--color-${color}) var(--light-${color}) var(--color-${color})`,
          }}
        />
        {showLabel && <p className="text-sm text-gray-600">{label}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div
          className={`${container} rounded-full animate-pulse`}
          style={{
            backgroundColor: color === 'blue' ? '#dbeafe' : `var(--light-${color})`,
          }}
        />
        {showLabel && <p className="text-sm text-gray-600">{label}</p>}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`${container} ${border} border-gray-200 rounded-full animate-spin`}
        style={{
          borderTopColor: color === 'blue' ? '#3b82f6' : `var(--color-${color})`,
          borderRightColor: color === 'blue' ? '#3b82f6' : `var(--color-${color})`,
          borderBottomColor: color === 'blue' ? '#3b82f6' : `var(--color-${color})`,
        }}
      />
      {showLabel && <p className="text-sm text-gray-600">{label}</p>}
    </div>
  );
};

/**
 * LoadingBar Component
 * Horizontal loading bar
 */
interface LoadingBarProps {
  progress?: number;
  className?: string;
  color?: string;
  height?: SpinnerSize;
  animated?: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress = 65,
  className = '',
  color = 'blue',
  height = 'md',
  animated = true,
}) => {
  const heightMap: Record<SpinnerSize, string> = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
  };

  const barColor = colorMap[color] || 'bg-blue-500';

  return (
    <div className={`w-full ${heightMap[height]} bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`${barColor} ${heightMap[height]} transition-all duration-300 ${animated ? 'animate-pulse' : ''}`}
        style={{
          width: `${Math.min(progress, 100)}%`,
        }}
      />
    </div>
  );
};

/**
 * LoadingOverlay Component
 * Full-screen or container overlay with spinner
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  fullScreen?: boolean;
  spinnerSize?: SpinnerSize;
  spinnerVariant?: SpinnerVariant;
  spinnerColor?: string;
  message?: string;
  className?: string;
  backdropClassName?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  fullScreen = false,
  spinnerSize = 'lg',
  spinnerVariant = 'default',
  spinnerColor = 'blue',
  message,
  className = '',
  backdropClassName = '',
}) => {
  if (!isLoading) return null;

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0';

  const backdropClasses = `${containerClasses} bg-black bg-opacity-50 flex items-center justify-center ${backdropClassName}`;

  return (
    <div className={backdropClasses}>
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <LoadingSpinner
          size={spinnerSize}
          variant={spinnerVariant}
          color={spinnerColor}
        />
        {message && <p className="text-white text-sm font-medium">{message}</p>}
      </div>
    </div>
  );
};

/**
 * SkeletonSpinner Component
 * Animated spinner with multiple pulsing elements
 */
interface SkeletonSpinnerProps {
  count?: number;
  size?: SpinnerSize;
  className?: string;
}

export const SkeletonSpinner: React.FC<SkeletonSpinnerProps> = ({
  count = 3,
  size = 'md',
  className = '',
}) => {
  const sizeValue = size === 'sm' ? 8 : size === 'md' ? 12 : size === 'lg' ? 16 : 20;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-full bg-blue-500 animate-pulse"
          style={{
            width: `${sizeValue}px`,
            height: `${sizeValue}px`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * DotsLoader Component
 * Bouncing dots animation
 */
interface DotsLoaderProps {
  className?: string;
  color?: string;
}

export const DotsLoader: React.FC<DotsLoaderProps> = ({
  className = '',
  color = 'blue',
}) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  const dotColor = colorMap[color] || 'bg-blue-500';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${dotColor} animate-bounce`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
