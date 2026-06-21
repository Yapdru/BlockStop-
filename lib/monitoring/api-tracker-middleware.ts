/**
 * API Tracker Middleware
 * Automatically tracks API performance for Node.js/Express routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceTracker } from './performance-tracker';
import { alertsSystem } from './alerts';
import { AlertSeverity, AlertType } from './alerts';

export interface APITrackingOptions {
  enabled: boolean;
  trackPayloadSize: boolean;
  alertOnSlowRequests: boolean;
  slowRequestThreshold: number; // ms
  excludePaths?: string[];
}

const defaultOptions: APITrackingOptions = {
  enabled: true,
  trackPayloadSize: true,
  alertOnSlowRequests: true,
  slowRequestThreshold: 1000,
  excludePaths: ['/health', '/status', '/metrics'],
};

/**
 * Create API tracking middleware
 */
export function createAPITrackerMiddleware(
  options: Partial<APITrackingOptions> = {},
) {
  const config = { ...defaultOptions, ...options };

  return async (request: NextRequest, next: Function) => {
    if (!config.enabled || shouldExcludePath(request.pathname, config.excludePaths)) {
      return next();
    }

    const startTime = Date.now();
    const method = request.method;
    const pathname = request.pathname;

    try {
      const response = await next();
      const duration = Date.now() - startTime;
      const statusCode = response.status;
      const contentLength = response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length') || '0', 10)
        : 0;

      // Record performance metric
      performanceTracker.recordAPILatency(
        pathname,
        method,
        duration,
        statusCode,
        contentLength,
      );

      // Check for slow requests
      if (config.alertOnSlowRequests && duration > config.slowRequestThreshold) {
        alertsSystem.checkMetric('api-latency', duration);

        if (duration > config.slowRequestThreshold * 2) {
          alertsSystem.createAlert(
            AlertType.HIGH_LATENCY,
            AlertSeverity.WARNING,
            `Slow API Request: ${method} ${pathname}`,
            `Request took ${duration}ms (threshold: ${config.slowRequestThreshold}ms)`,
            'api-latency',
            duration,
            config.slowRequestThreshold,
          );
        }
      }

      // Track error status codes
      if (statusCode >= 400) {
        alertsSystem.checkMetric('error-rate', statusCode);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record as failed request
      performanceTracker.recordAPILatency(pathname, method, duration, 500, 0);

      alertsSystem.createAlert(
        AlertType.HIGH_ERROR_RATE,
        AlertSeverity.CRITICAL,
        `API Error: ${method} ${pathname}`,
        error instanceof Error ? error.message : 'Unknown error',
        'api-error',
        duration,
        0,
      );

      throw error;
    }
  };
}

/**
 * Check if path should be excluded from tracking
 */
function shouldExcludePath(pathname: string, excludePaths?: string[]): boolean {
  if (!excludePaths) return false;

  return excludePaths.some((excluded) => {
    if (excluded.endsWith('*')) {
      return pathname.startsWith(excluded.slice(0, -1));
    }
    return pathname === excluded;
  });
}

/**
 * Middleware for Express-style request/response tracking
 */
export function apiTrackerExpressMiddleware(
  options: Partial<APITrackingOptions> = {},
) {
  const config = { ...defaultOptions, ...options };

  return (req: any, res: any, next: Function) => {
    if (!config.enabled || shouldExcludePath(req.path, config.excludePaths)) {
      return next();
    }

    const startTime = Date.now();
    const method = req.method;
    const pathname = req.path || req.url;

    // Intercept response end
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode || 200;
      const contentLength = res.get('content-length')
        ? parseInt(res.get('content-length') || '0', 10)
        : 0;

      // Record metrics
      performanceTracker.recordAPILatency(
        pathname,
        method,
        duration,
        statusCode,
        contentLength,
      );

      // Check thresholds
      if (config.alertOnSlowRequests && duration > config.slowRequestThreshold) {
        alertsSystem.checkMetric('api-latency', duration);
      }

      // Restore original end
      return originalEnd.apply(res, args);
    };

    next();
  };
}

/**
 * Middleware for batch tracking of multiple endpoints
 */
export class APITrackerBatch {
  private endpoints: Map<string, any> = new Map();

  startTracking(method: string, path: string) {
    const key = `${method}:${path}`;
    this.endpoints.set(key, {
      startTime: Date.now(),
      method,
      path,
      calls: 0,
      totalDuration: 0,
      errors: 0,
    });
  }

  endTracking(method: string, path: string, statusCode: number = 200) {
    const key = `${method}:${path}`;
    const tracking = this.endpoints.get(key);

    if (tracking) {
      const duration = Date.now() - tracking.startTime;
      tracking.calls++;
      tracking.totalDuration += duration;

      if (statusCode >= 400) {
        tracking.errors++;
      }
    }
  }

  getStats(method: string, path: string) {
    const key = `${method}:${path}`;
    const tracking = this.endpoints.get(key);

    if (!tracking) return null;

    return {
      method: tracking.method,
      path: tracking.path,
      calls: tracking.calls,
      avgDuration: tracking.calls > 0 ? tracking.totalDuration / tracking.calls : 0,
      totalDuration: tracking.totalDuration,
      errorCount: tracking.errors,
      errorRate:
        tracking.calls > 0 ? (tracking.errors / tracking.calls) * 100 : 0,
    };
  }

  getAllStats() {
    const stats: any[] = [];
    this.endpoints.forEach((tracking, key) => {
      stats.push({
        endpoint: key,
        ...this.getStats(tracking.method, tracking.path),
      });
    });
    return stats;
  }

  reset() {
    this.endpoints.clear();
  }
}

// Export singleton instance
export const apiTrackerBatch = new APITrackerBatch();
