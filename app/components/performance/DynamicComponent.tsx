'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { dynamicImportWithRetry } from '@/app/utils/performance/code-splitting';

export interface DynamicComponentProps {
  componentPath: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  timeout?: number;
  maxRetries?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  [key: string]: any; // Props to pass to the dynamic component
}

/**
 * Loading fallback component
 */
const DefaultLoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      color: '#999',
      fontSize: '14px',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '10px' }}>Loading component...</div>
      <div
        style={{
          width: '30px',
          height: '30px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto',
        }}
      />
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  </div>
);

/**
 * Error fallback component
 */
interface ErrorFallbackProps {
  error: Error;
  retry?: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, retry }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      backgroundColor: '#fee',
      color: '#c00',
      padding: '20px',
      borderRadius: '4px',
      fontSize: '14px',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Failed to load component</div>
      <div style={{ marginBottom: '15px', fontSize: '12px', color: '#999' }}>
        {error?.message || 'Unknown error'}
      </div>
      {retry && (
        <button
          onClick={retry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#c00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

/**
 * Wrapper component that loads the component dynamically
 */
const DynamicComponentLoader: React.FC<DynamicComponentProps> = ({
  componentPath,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
  timeout = 10000,
  maxRetries = 3,
  onLoad,
  onError,
  ...props
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const module = await dynamicImportWithRetry(
          componentPath,
          maxRetries,
          timeout
        );

        // Get default export or named export
        const Component = module.default || Object.values(module)[0];

        if (!React.isValidElementType(Component)) {
          throw new Error(`Invalid component export from ${componentPath}`);
        }

        setComponent(() => Component);
        onLoad?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, [componentPath, timeout, maxRetries, onLoad, onError, retryCount]);

  // Render loading state
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Render error state
  if (error) {
    return (
      <>
        {errorFallback ? (
          errorFallback
        ) : (
          <DefaultErrorFallback
            error={error}
            retry={
              retryCount < maxRetries
                ? () => setRetryCount((c) => c + 1)
                : undefined
            }
          />
        )}
      </>
    );
  }

  // Render component
  if (Component) {
    return <Component {...props} />;
  }

  return null;
};

/**
 * DynamicComponent wrapper with Suspense
 */
export const DynamicComponent: React.FC<DynamicComponentProps> = (props) => {
  const { fallback = <DefaultLoadingFallback /> } = props;

  return (
    <Suspense fallback={fallback}>
      <DynamicComponentLoader {...props} />
    </Suspense>
  );
};

export default DynamicComponent;

/**
 * Hook for lazy loading components
 */
export const useDynamicComponent = <T extends React.ComponentType<any>>(
  path: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    onError?: (error: Error) => void;
  } = {}
) => {
  const [component, setComponent] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const module = await dynamicImportWithRetry(
          path,
          options.maxRetries,
          options.timeout
        );
        const Component = module.default || Object.values(module)[0];

        if (isMounted) {
          setComponent(() => Component);
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          options.onError?.(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [path, options]);

  return { component, error, isLoading };
};

/**
 * Hook for prefetching components
 */
export const usePrefetchComponent = (path: string) => {
  useEffect(() => {
    // Prefetch in background
    const timer = setTimeout(() => {
      dynamicImportWithRetry(path, 3, 10000).catch(() => {
        // Prefetch failures are non-critical
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [path]);
};
