// Threat Detection API Routes
import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '../../middleware';
import { APIErrorHandler } from '../../error-handler';
import { RequestValidator, ValidationSchemas } from '../../request-validator';
import { ThreatController, CreateThreatRequest, UpdateThreatRequest } from '../controllers/threat-controller';
import { rateLimiter, quotaManager } from '../../rate-limiter';
import crypto from 'crypto';

export class ThreatRoutes {
  /**
   * GET /api/v1/threats - List all threats
   */
  static async listThreats(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      // Authentication
      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      // Rate limiting
      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      // Quota check
      const quota = quotaManager.checkQuota(auth.context.apiKeyId, 'pro');
      if (!quota.allowed) {
        const error = new Error('Quota exceeded');
        return APIErrorHandler.formatErrorResponse(
          {
            code: 'QUOTA_EXCEEDED',
            message: 'Daily quota exceeded',
            statusCode: 429,
            timestamp: new Date().toISOString(),
            requestId,
            details: quota.resetAt,
          },
          req
        );
      }

      // Parse query parameters
      const url = new URL(req.url);
      const params = {
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        type: url.searchParams.get('type') || undefined,
        severity: url.searchParams.get('severity') || undefined,
        active: url.searchParams.get('active') === 'true' ? true : undefined,
        search: url.searchParams.get('search') || undefined,
        sort: url.searchParams.get('sort') || 'createdAt',
        order: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc',
      };

      // Get threats
      const result = await ThreatController.listThreats(auth.context, params);

      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
          rateLimit: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset: rateLimit.reset,
          },
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * GET /api/v1/threats/:id - Get threat by ID
   */
  static async getThreat(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      const threat = await ThreatController.getThreatById(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: threat,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * POST /api/v1/threats - Create new threat
   */
  static async createThreat(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      // Check scope
      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['threats:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      // Validate request
      const validation = APIMiddleware.validateRequest(req, ValidationSchemas.threatCreate);
      if (!validation.valid) {
        return APIErrorHandler.formatErrorResponse(validation.error!, req);
      }

      const body = (await req.json()) as CreateThreatRequest;
      RequestValidator.validateBody(body, ValidationSchemas.threatCreate);

      const threat = await ThreatController.createThreat(body, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: threat,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 201,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * PUT /api/v1/threats/:id - Update threat
   */
  static async updateThreat(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['threats:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      const validation = APIMiddleware.validateRequest(req);
      if (!validation.valid) {
        return APIErrorHandler.formatErrorResponse(validation.error!, req);
      }

      const body = (await req.json()) as UpdateThreatRequest;
      const threat = await ThreatController.updateThreat(params.id, body, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: threat,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * DELETE /api/v1/threats/:id - Delete threat
   */
  static async deleteThreat(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['threats:delete']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      await ThreatController.deleteThreat(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: { message: 'Threat deleted successfully' },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * GET /api/v1/threats/:id/detections - Get threat detections
   */
  static async getThreatDetections(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const url = new URL(req.url);
      const paginationParams = {
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
      };

      const detections = await ThreatController.getThreatDetections(
        params.id,
        auth.context,
        paginationParams
      );

      const response = {
        success: true,
        data: detections,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * GET /api/v1/threats/:id/indicators - Get threat indicators
   */
  static async getIndicators(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const result = await ThreatController.getIndicators(params.id, auth.context);

      const response = {
        success: true,
        data: result,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * GET /api/v1/threats/stats - Get threat statistics
   */
  static async getStats(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const stats = await ThreatController.getStats(auth.context);

      const response = {
        success: true,
        data: stats,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      };

      return NextResponse.json(response, {
        status: 200,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }
}
