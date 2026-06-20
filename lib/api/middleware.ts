// API Middleware
import { NextRequest, NextResponse } from 'next/server';
import { APIContext, APIError, APIErrorCode, ResponseMeta } from './types';
import { apiKeyManager } from './api-key-manager';
import { rateLimiter, quotaManager } from './rate-limiter';
import crypto from 'crypto';

export class APIMiddleware {
  static authenticateRequest(req: NextRequest): {
    valid: boolean;
    context?: APIContext;
    error?: APIError;
  } {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return {
        valid: false,
        error: {
          code: APIErrorCode.UNAUTHORIZED,
          message: 'Missing authorization header',
          statusCode: 401,
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req),
        },
      };
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' && scheme !== 'Basic') {
      return {
        valid: false,
        error: {
          code: APIErrorCode.INVALID_REQUEST,
          message: 'Invalid authentication scheme',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(req),
        },
      };
    }

    if (scheme === 'Bearer') {
      const validation = apiKeyManager.validateKey(token);
      if (!validation.valid || !validation.apiKey) {
        return {
          valid: false,
          error: {
            code: APIErrorCode.INVALID_API_KEY,
            message: 'Invalid or expired API key',
            statusCode: 401,
            timestamp: new Date().toISOString(),
            requestId: this.getRequestId(req),
          },
        };
      }

      const apiKey = validation.apiKey;
      const context: APIContext = {
        userId: apiKey.userId,
        orgId: apiKey.orgId,
        apiKeyId: apiKey.id,
        scopes: apiKey.scopes,
        rateLimit: rateLimiter.checkLimit(apiKey.id, 'pro'),
      };

      return { valid: true, context };
    }

    return {
      valid: false,
      error: {
        code: APIErrorCode.UNAUTHORIZED,
        message: 'Authentication failed',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        requestId: this.getRequestId(req),
      },
    };
  }

  static validateRequest(
    req: NextRequest,
    schema?: Record<string, any>
  ): { valid: boolean; error?: APIError } {
    // Content-Type validation for POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return {
          valid: false,
          error: {
            code: APIErrorCode.INVALID_REQUEST,
            message: 'Content-Type must be application/json',
            statusCode: 400,
            timestamp: new Date().toISOString(),
            requestId: this.getRequestId(req),
          },
        };
      }
    }

    return { valid: true };
  }

  static checkScopeAccess(
    context: APIContext,
    requiredScopes: string[]
  ): { allowed: boolean; error?: APIError } {
    const hasAccess = requiredScopes.every(scope =>
      context.scopes.includes(scope) ||
      context.scopes.includes('*') ||
      context.scopes.some(
        s => s.endsWith('.*') && scope.startsWith(s.slice(0, -2))
      )
    );

    if (!hasAccess) {
      return {
        allowed: false,
        error: {
          code: APIErrorCode.INSUFFICIENT_SCOPES,
          message: `Insufficient scopes. Required: ${requiredScopes.join(', ')}`,
          statusCode: 403,
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(this.lastRequest!),
          details: { requiredScopes, grantedScopes: context.scopes },
        },
      };
    }

    return { allowed: true };
  }

  static checkRateLimit(rateLimit: import('./types').RateLimitInfo): {
    allowed: boolean;
    error?: APIError;
  } {
    if (rateLimit.remaining <= 0) {
      return {
        allowed: false,
        error: {
          code: APIErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          requestId: this.getRequestId(this.lastRequest!),
          details: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset: rateLimit.reset,
            retryAfter: rateLimit.retryAfter,
          },
        },
      };
    }

    return { allowed: true };
  }

  static formatResponse<T>(
    data: T,
    req: NextRequest,
    statusCode: number = 200
  ): NextResponse {
    const meta: ResponseMeta = {
      requestId: this.getRequestId(req),
      timestamp: new Date().toISOString(),
      duration: 0, // Would be calculated from request start time
      version: 'v1',
    };

    const response = {
      success: statusCode >= 200 && statusCode < 300,
      data,
      meta,
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: this.getSecurityHeaders(),
    });
  }

  static formatError(
    error: APIError,
    req: NextRequest
  ): NextResponse {
    const response = {
      success: false,
      error,
      meta: {
        requestId: this.getRequestId(req),
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    };

    return NextResponse.json(response, {
      status: error.statusCode,
      headers: this.getSecurityHeaders(),
    });
  }

  static getRequestId(req: NextRequest): string {
    const headerValue = req.headers.get('x-request-id');
    if (headerValue) return headerValue;
    return `req_${crypto.randomUUID()}`;
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'none'",
    };
  }

  private static lastRequest: NextRequest | null = null;

  static setLastRequest(req: NextRequest): void {
    this.lastRequest = req;
  }
}

// Webhook signature verification
export class WebhookSigner {
  static sign(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  static verify(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.sign(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
