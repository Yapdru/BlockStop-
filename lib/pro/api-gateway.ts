/**
 * PRO Tier API Gateway
 * REST API with rate limiting, request validation, and quota management
 */

import { APIKey, APIPermission } from '@/types/pro-tier';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  requestsPerMonth: number;
}

interface RateLimitStatus {
  remaining: number;
  reset: number;
  limit: number;
  retryAfter?: number;
}

interface APIRequest {
  method: string;
  endpoint: string;
  headers: Record<string, string>;
  body?: Record<string, any>;
  timestamp: Date;
}

interface APIResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  timestamp: Date;
}

export class ProAPIGateway {
  private rateLimitStore: Map<string, RateLimitData[]> = new Map();
  private requestCache: Map<string, any> = new Map();

  /**
   * Validate API request
   */
  async validateRequest(request: APIRequest, apiKey: string): Promise<{
    valid: boolean;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    // Validate API key format
    if (!this.isValidAPIKeyFormat(apiKey)) {
      return {
        valid: false,
        error: 'Invalid API key format',
      };
    }

    // Check required headers
    const requiredHeaders = ['content-type', 'authorization'];
    const missingHeaders = requiredHeaders.filter((h) => !request.headers[h]);

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        error: `Missing required headers: ${missingHeaders.join(', ')}`,
      };
    }

    // Validate request body if present
    if (request.body) {
      const bodyValidation = this.validateRequestBody(request.body);
      if (!bodyValidation.valid) {
        return {
          valid: false,
          error: bodyValidation.error,
        };
      }
    }

    return {
      valid: true,
      metadata: {
        apiKey,
        timestamp: request.timestamp,
        endpoint: request.endpoint,
      },
    };
  }

  /**
   * Check rate limits for API key
   */
  async checkRateLimit(apiKey: string, config: RateLimitConfig): Promise<RateLimitStatus> {
    const now = Date.now();
    const requests = this.rateLimitStore.get(apiKey) || [];

    // Clean old requests
    const cutoffTimes = {
      minute: now - 60 * 1000,
      hour: now - 60 * 60 * 1000,
      day: now - 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };

    const requestsLastMinute = requests.filter((r) => r.timestamp > cutoffTimes.minute).length;
    const requestsLastHour = requests.filter((r) => r.timestamp > cutoffTimes.hour).length;
    const requestsLastDay = requests.filter((r) => r.timestamp > cutoffTimes.day).length;
    const requestsLastMonth = requests.filter((r) => r.timestamp > cutoffTimes.month).length;

    // Check limits
    const isOverLimit =
      requestsLastMinute >= config.requestsPerMinute ||
      requestsLastHour >= config.requestsPerHour ||
      requestsLastDay >= config.requestsPerDay ||
      requestsLastMonth >= config.requestsPerMonth;

    if (isOverLimit) {
      // Find which limit was exceeded
      let restrictiveLimit = config.requestsPerMonth;
      let resetTime = new Date().setMonth(new Date().getMonth() + 1);

      if (requestsLastDay >= config.requestsPerDay) {
        restrictiveLimit = config.requestsPerDay;
        resetTime = now + 24 * 60 * 60 * 1000;
      } else if (requestsLastHour >= config.requestsPerHour) {
        restrictiveLimit = config.requestsPerHour;
        resetTime = now + 60 * 60 * 1000;
      } else if (requestsLastMinute >= config.requestsPerMinute) {
        restrictiveLimit = config.requestsPerMinute;
        resetTime = now + 60 * 1000;
      }

      return {
        remaining: 0,
        reset: Math.floor(resetTime / 1000),
        limit: restrictiveLimit,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    return {
      remaining: config.requestsPerMinute - requestsLastMinute,
      reset: Math.floor((now + 60 * 1000) / 1000),
      limit: config.requestsPerMinute,
    };
  }

  /**
   * Record API request for rate limiting
   */
  recordRequest(apiKey: string, timestamp: Date = new Date()): void {
    const requests = this.rateLimitStore.get(apiKey) || [];
    requests.push({
      timestamp: timestamp.getTime(),
      endpoint: '',
      method: '',
    });

    // Keep only last 30 days of requests
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = requests.filter((r) => r.timestamp > thirtyDaysAgo).slice(-100000);

    this.rateLimitStore.set(apiKey, filtered);
  }

  /**
   * Validate API permissions
   */
  async validatePermissions(
    apiKey: string,
    requiredPermissions: APIPermission[],
    keyPermissions: APIPermission[]
  ): Promise<{ allowed: boolean; deniedPermissions?: APIPermission[] }> {
    const deniedPermissions = requiredPermissions.filter((p) => !keyPermissions.includes(p));

    if (deniedPermissions.length > 0) {
      return {
        allowed: false,
        deniedPermissions,
      };
    }

    return { allowed: true };
  }

  /**
   * Format successful API response
   */
  formatResponse(data: any, statusCode: number = 200, metadata?: Record<string, any>): APIResponse {
    return {
      status: statusCode,
      data: {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      headers: {
        'content-type': 'application/json',
        'x-api-version': '1.0',
        'x-timestamp': new Date().toISOString(),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Format error response
   */
  formatErrorResponse(
    error: string,
    statusCode: number = 400,
    errorCode?: string
  ): APIResponse {
    return {
      status: statusCode,
      data: {
        success: false,
        error,
        errorCode: errorCode || this.getErrorCode(statusCode),
        timestamp: new Date().toISOString(),
      },
      headers: {
        'content-type': 'application/json',
        'x-api-version': '1.0',
      },
      timestamp: new Date(),
    };
  }

  /**
   * Format rate limit headers
   */
  formatRateLimitHeaders(status: RateLimitStatus): Record<string, string> {
    const headers: Record<string, string> = {
      'x-ratelimit-limit': String(status.limit),
      'x-ratelimit-remaining': String(status.remaining),
      'x-ratelimit-reset': String(status.reset),
    };

    if (status.retryAfter) {
      headers['retry-after'] = String(status.retryAfter);
    }

    return headers;
  }

  /**
   * Validate request body
   */
  private validateRequestBody(body: Record<string, any>): { valid: boolean; error?: string } {
    // Check for required fields
    const maxSize = 5 * 1024 * 1024; // 5MB
    const bodySize = JSON.stringify(body).length;

    if (bodySize > maxSize) {
      return {
        valid: false,
        error: `Request body exceeds maximum size of ${maxSize} bytes`,
      };
    }

    // Check for malicious patterns
    const bodyStr = JSON.stringify(body);
    if (this.hasMaliciousPatterns(bodyStr)) {
      return {
        valid: false,
        error: 'Request body contains suspicious patterns',
      };
    }

    return { valid: true };
  }

  /**
   * Check for malicious patterns in request
   */
  private hasMaliciousPatterns(content: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /DROP TABLE/i,
      /DELETE FROM/i,
      /INSERT INTO/i,
    ];

    return maliciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Validate API key format
   */
  private isValidAPIKeyFormat(apiKey: string): boolean {
    // Format: pro_USERID_RANDOMSTRING
    return /^(free|pro|enterprise)_[a-z0-9]+_[a-z0-9]{32}$/i.test(apiKey);
  }

  /**
   * Get error code from status code
   */
  private getErrorCode(statusCode: number): string {
    const errorCodeMap: Record<number, string> = {
      400: 'INVALID_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    return errorCodeMap[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Create API key
   */
  generateAPIKey(userId: string, tier: 'free' | 'pro' | 'enterprise'): APIKey {
    const randomSuffix = Array.from(
      { length: 32 },
      () => Math.random().toString(36).charAt(2)
    ).join('');

    return {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: 'API Key',
      key: `${tier}_${userId}_${randomSuffix}`,
      secret: this.generateSecret(),
      permissions: this.getDefaultPermissions(tier),
      rateLimit: tier === 'pro' ? 1000 : 100,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate secret for API key
   */
  private generateSecret(): string {
    return Array.from({ length: 64 }, () =>
      Math.random().toString(16).charAt(2)
    ).join('');
  }

  /**
   * Get default permissions for tier
   */
  private getDefaultPermissions(tier: 'free' | 'pro' | 'enterprise'): APIPermission[] {
    const basePermissions = [APIPermission.READ_SCANS, APIPermission.READ_INCIDENTS];

    if (tier === 'pro') {
      return [
        ...basePermissions,
        APIPermission.READ_THREATS,
        APIPermission.READ_ANALYTICS,
        APIPermission.WRITE_INCIDENTS,
        APIPermission.WRITE_RULES,
        APIPermission.MANAGE_WEBHOOKS,
      ];
    }

    if (tier === 'enterprise') {
      return [
        ...basePermissions,
        APIPermission.READ_THREATS,
        APIPermission.READ_ANALYTICS,
        APIPermission.WRITE_INCIDENTS,
        APIPermission.WRITE_RULES,
        APIPermission.MANAGE_WEBHOOKS,
        APIPermission.MANAGE_TEAM,
        APIPermission.ADMIN,
      ];
    }

    return basePermissions;
  }

  /**
   * Rotate API key
   */
  rotateAPIKey(apiKey: APIKey): APIKey {
    const randomSuffix = Array.from(
      { length: 32 },
      () => Math.random().toString(36).charAt(2)
    ).join('');

    return {
      ...apiKey,
      key: apiKey.key.split('_').slice(0, 2).join('_') + '_' + randomSuffix,
      secret: this.generateSecret(),
      rotationDate: new Date(),
      updatedAt: new Date(),
    };
  }
}

interface RateLimitData {
  timestamp: number;
  endpoint: string;
  method: string;
}

/**
 * Export API gateway instance and functions
 */
const gateway = new ProAPIGateway();

export const validateRequest = gateway.validateRequest.bind(gateway);
export const checkRateLimit = gateway.checkRateLimit.bind(gateway);
export const formatResponse = gateway.formatResponse.bind(gateway);
export const formatErrorResponse = gateway.formatErrorResponse.bind(gateway);
export const generateAPIKey = gateway.generateAPIKey.bind(gateway);
export const rotateAPIKey = gateway.rotateAPIKey.bind(gateway);

export default gateway;
