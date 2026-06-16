'use client';

import React from 'react';
import '@/app/styles/keyframes.css';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  count?: number;
  circle?: boolean;
  style?: React.CSSProperties;
}

/**
 * SkeletonLoader Component
 * Shimmer loading skeleton for content placeholders
 * Displays a smooth wave animation to indicate loading state
 *
 * @example
 * <SkeletonLoader width="100%" height={40} borderRadius="8px" />
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = '4px',
  className = '',
  count = 1,
  circle = false,
  style = {},
}) => {
  const skeletonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    backgroundColor: '#f3f4f6',
    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmerWave 2s infinite',
    ...style,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-shimmer-wave ${className}`}
          style={{
            ...skeletonStyle,
            marginBottom: index < count - 1 ? '12px' : '0',
          }}
        />
      ))}
    </>
  );
};

/**
 * SkeletonBox Component
 * Rectangular skeleton with customizable dimensions
 */
interface SkeletonBoxProps extends SkeletonLoaderProps {
  children?: React.ReactNode;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 100,
  borderRadius = '8px',
  className = '',
  style = {},
  children,
}) => {
  if (children) {
    return <>{children}</>;
  }

  return (
    <div
      className={`animate-shimmer-wave ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        backgroundColor: '#f3f4f6',
        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
};

/**
 * SkeletonAvatar Component
 * Circular skeleton for avatars
 */
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
}) => {
  const dimension = sizeMap[size];

  return (
    <div
      className={`animate-shimmer-wave rounded-full ${className}`}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        backgroundColor: '#f3f4f6',
        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
};

/**
 * SkeletonText Component
 * Multiple line skeleton for text content
 */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  width?: string | number;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  width = '100%',
}) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-shimmer-wave"
          style={{
            width: index === lines - 1 ? '70%' : width,
            height: '16px',
            backgroundColor: '#f3f4f6',
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            marginBottom: index < lines - 1 ? '12px' : '0',
          }}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard Component
 * Complete card skeleton with avatar and text
 */
interface SkeletonCardProps {
  className?: string;
  hasImage?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  hasImage = true,
}) => {
  return (
    <div className={`space-y-4 p-6 rounded-lg border border-gray-100 ${className}`}>
      {hasImage && (
        <div
          className="animate-shimmer-wave w-full h-48 rounded-lg"
          style={{
            backgroundColor: '#f3f4f6',
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
      <div className="flex gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <div
            className="animate-shimmer-wave h-4 rounded"
            style={{
              backgroundColor: '#f3f4f6',
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          <div
            className="animate-shimmer-wave h-3 rounded w-3/4"
            style={{
              backgroundColor: '#f3f4f6',
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

/**
 * SkeletonTable Component
 * Table skeleton for data display
 */
interface SkeletonTableProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  columns = 4,
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="animate-shimmer-wave flex-1 h-10 rounded"
              style={{
                backgroundColor: '#f3f4f6',
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
