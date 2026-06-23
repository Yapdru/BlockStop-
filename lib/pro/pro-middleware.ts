/**
 * PRO Tier Middleware & Guards
 * Request validation, authentication, and authorization for PRO features
 */

import { isProFeatureEnabled, getUserTierName } from '@/lib/tiers/pro-tier';
import { ProFeature } from '@/types/pro-tier';

interface MiddlewareContext {
  userId: number;
  apiKey?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface MiddlewareResponse {
  allowed: boolean;
  error?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

/**
 * Middleware to verify PRO tier access
 */
export async function requireProTierMiddleware(
  context: MiddlewareContext
): Promise<MiddlewareResponse> {
  try {
    const tierName = await getUserTierName(context.userId);

    if (tierName !== 'pro' && tierName !== 'enterprise') {
      return {
        allowed: false,
        error: 'This feature requires PRO tier',
        statusCode: 403,
        metadata: {
          currentTier: tierName,
          upgradeRequired: true,
        },
      };
    }

    return {
      allowed: true,
      metadata: {
        tier: tierName,
        userId: context.userId,
      },
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Failed to verify tier access',
      statusCode: 500,
    };
  }
}

/**
 * Middleware to verify specific feature access
 */
export async function requireProFeatureMiddleware(
  context: MiddlewareContext,
  feature: ProFeature
): Promise<MiddlewareResponse> {
  try {
    const enabled = await isProFeatureEnabled(context.userId, feature);

    if (!enabled) {
      return {
        allowed: false,
        error: `Feature "${feature}" is not available in your plan`,
        statusCode: 403,
        metadata: {
          feature,
          upgradeRequired: true,
        },
      };
    }

    return {
      allowed: true,
      metadata: {
        feature,
        userId: context.userId,
      },
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Failed to verify feature access',
      statusCode: 500,
    };
  }
}

/**
 * Middleware for rate limiting
 */
export function rateLimitMiddleware(
  context: MiddlewareContext,
  rateLimit: number,
  window: number = 60000 // 1 minute default
): MiddlewareResponse {
  // In production, would use Redis or similar for distributed rate limiting
  const key = `ratelimit:${context.userId}`;
  const now = Date.now();

  // Simulate rate limiting check
  const requestCount = Math.floor(Math.random() * 100);

  if (requestCount > rateLimit) {
    return {
      allowed: false,
      error: 'Rate limit exceeded',
      statusCode: 429,
      metadata: {
        retryAfter: window,
        limit: rateLimit,
      },
    };
  }

  return {
    allowed: true,
    metadata: {
      remaining: rateLimit - requestCount,
    },
  };
}

/**
 * Middleware for quota enforcement
 */
export function quotaMiddleware(
  currentUsage: number,
  quotaLimit: number,
  quotaName: string
): MiddlewareResponse {
  if (currentUsage >= quotaLimit) {
    return {
      allowed: false,
      error: `Quota exceeded for ${quotaName}`,
      statusCode: 429,
      metadata: {
        quotaName,
        used: currentUsage,
        limit: quotaLimit,
      },
    };
  }

  return {
    allowed: true,
    metadata: {
      remaining: quotaLimit - currentUsage,
      usagePercentage: Math.round((currentUsage / quotaLimit) * 100),
    },
  };
}

/**
 * Middleware for API key validation
 */
export async function validateAPIKeyMiddleware(apiKey: string): Promise<MiddlewareResponse> {
  // Validate API key format
  if (!isValidAPIKeyFormat(apiKey)) {
    return {
      allowed: false,
      error: 'Invalid API key format',
      statusCode: 401,
    };
  }

  // In production, would validate against database
  try {
    // Simulate API key lookup
    const keyValid = apiKey.length > 32;

    if (!keyValid) {
      return {
        allowed: false,
        error: 'API key not found or expired',
        statusCode: 401,
      };
    }

    return {
      allowed: true,
      metadata: {
        keyId: extractKeyId(apiKey),
        validated: true,
      },
    };
  } catch (error) {
    return {
      allowed: false,
      error: 'Failed to validate API key',
      statusCode: 500,
    };
  }
}

/**
 * Middleware for security headers
 */
export function securityHeadersMiddleware(): Record<string, string> {
  return {
    'content-security-policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Middleware for CORS validation
 */
export function corsMiddleware(origin: string | undefined): MiddlewareResponse {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://blockstop.io',
    'https://app.blockstop.io',
  ];

  if (!origin || !allowedOrigins.includes(origin)) {
    return {
      allowed: false,
      error: 'CORS policy violation',
      statusCode: 403,
    };
  }

  return {
    allowed: true,
    metadata: {
      origin,
      credentials: true,
    },
  };
}

/**
 * Middleware for request logging
 */
export function auditLoggingMiddleware(
  context: MiddlewareContext,
  action: string,
  resource: string,
  result: 'success' | 'failure'
): void {
  const auditEntry = {
    userId: context.userId,
    action,
    resource,
    result,
    timestamp: new Date(),
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  };

  // In production, would log to database or audit service
  console.log('[AUDIT]', JSON.stringify(auditEntry));
}

/**
 * Comprehensive middleware chain
 */
export async function executeProMiddlewareChain(
  context: MiddlewareContext,
  options: {
    requirePro?: boolean;
    requiredFeature?: ProFeature;
    rateLimit?: number;
    quotaCheck?: { current: number; limit: number; name: string };
    validateAPI?: boolean;
    auditLog?: { action: string; resource: string };
  }
): Promise<MiddlewareResponse> {
  // 1. Verify PRO tier if required
  if (options.requirePro) {
    const tierResponse = await requireProTierMiddleware(context);
    if (!tierResponse.allowed) {
      return tierResponse;
    }
  }

  // 2. Check specific feature access if required
  if (options.requiredFeature) {
    const featureResponse = await requireProFeatureMiddleware(context, options.requiredFeature);
    if (!featureResponse.allowed) {
      return featureResponse;
    }
  }

  // 3. Rate limiting check
  if (options.rateLimit) {
    const rateLimitResponse = rateLimitMiddleware(context, options.rateLimit);
    if (!rateLimitResponse.allowed) {
      if (options.auditLog) {
        auditLoggingMiddleware(context, options.auditLog.action, options.auditLog.resource, 'failure');
      }
      return rateLimitResponse;
    }
  }

  // 4. Quota check
  if (options.quotaCheck) {
    const quotaResponse = quotaMiddleware(
      options.quotaCheck.current,
      options.quotaCheck.limit,
      options.quotaCheck.name
    );
    if (!quotaResponse.allowed) {
      if (options.auditLog) {
        auditLoggingMiddleware(context, options.auditLog.action, options.auditLog.resource, 'failure');
      }
      return quotaResponse;
    }
  }

  // 5. Audit logging
  if (options.auditLog) {
    auditLoggingMiddleware(context, options.auditLog.action, options.auditLog.resource, 'success');
  }

  return {
    allowed: true,
    metadata: {
      checksPerformed: [
        options.requirePro && 'tier',
        options.requiredFeature && 'feature',
        options.rateLimit && 'rateLimit',
        options.quotaCheck && 'quota',
        options.auditLog && 'audit',
      ].filter(Boolean),
    },
  };
}

// ============ HELPER FUNCTIONS ============

function isValidAPIKeyFormat(apiKey: string): boolean {
  return /^(free|pro|enterprise)_[a-z0-9]+_[a-z0-9]{32,}$/i.test(apiKey);
}

function extractKeyId(apiKey: string): string {
  const parts = apiKey.split('_');
  return parts[1] || 'unknown';
}

/**
 * Create error response for middleware failures
 */
export function createErrorResponse(
  statusCode: number,
  error: string,
  metadata?: Record<string, any>
) {
  return {
    success: false,
    error,
    statusCode,
    timestamp: new Date().toISOString(),
    ...metadata,
  };
}

/**
 * Create success response for allowed requests
 */
export function createSuccessResponse(data?: any, metadata?: Record<string, any>) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...metadata,
  };
}
