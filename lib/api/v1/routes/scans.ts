// Scan Management API Routes
import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '../../middleware';
import { APIErrorHandler } from '../../error-handler';
import { RequestValidator, ValidationSchemas } from '../../request-validator';
import { ScanController, CreateScanRequest } from '../controllers/scan-controller';
import { rateLimiter, quotaManager } from '../../rate-limiter';

export class ScanRoutes {
  /**
   * GET /api/v1/scans - List all scans
   */
  static async listScans(req: NextRequest): Promise<NextResponse> {
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

      const url = new URL(req.url);
      const params = {
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        type: url.searchParams.get('type') || undefined,
        status: url.searchParams.get('status') || undefined,
        priority: url.searchParams.get('priority') || undefined,
        threatLevel: url.searchParams.get('threatLevel') || undefined,
        sort: url.searchParams.get('sort') || 'createdAt',
        order: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc',
      };

      const result = await ScanController.listScans(auth.context, params);
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
   * GET /api/v1/scans/:id - Get scan by ID
   */
  static async getScan(
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

      const scan = await ScanController.getScanById(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: scan,
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
   * POST /api/v1/scans - Create new scan
   */
  static async createScan(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['scans:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      const validation = APIMiddleware.validateRequest(req, ValidationSchemas.scanCreate);
      if (!validation.valid) {
        return APIErrorHandler.formatErrorResponse(validation.error!, req);
      }

      const body = (await req.json()) as CreateScanRequest;
      RequestValidator.validateBody(body, ValidationSchemas.scanCreate);

      const scan = await ScanController.createScan(body, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: scan,
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
   * POST /api/v1/scans/bulk - Bulk create scans
   */
  static async bulkCreateScans(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['scans:write']);
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

      const body = (await req.json()) as { targets: any[] };
      const scans = await ScanController.bulkCreateScans(body.targets, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, scans.length, 'daily');

      const response = {
        success: true,
        data: {
          scans,
          created: scans.length,
        },
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
   * GET /api/v1/scans/:id/results - Get scan results
   */
  static async getScanResults(
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

      const result = await ScanController.getScanResult(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

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
   * DELETE /api/v1/scans/:id - Delete scan
   */
  static async deleteScan(
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

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['scans:delete']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      await ScanController.deleteScan(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: { message: 'Scan deleted successfully' },
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
   * GET /api/v1/scans/:type/:target/history - Get scan history
   */
  static async getScanHistory(
    req: NextRequest,
    { params }: { params: { type: string; target: string } }
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

      const history = await ScanController.getScanHistory(
        params.type,
        decodeURIComponent(params.target),
        auth.context,
        paginationParams
      );

      const response = {
        success: true,
        data: history,
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
   * GET /api/v1/scans/stats - Get scan statistics
   */
  static async getStats(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const stats = await ScanController.getStats(auth.context);

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

  /**
   * GET /api/v1/scans/templates - Get scan templates
   */
  static async getTemplates(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const templates = await ScanController.getTemplates();

      const response = {
        success: true,
        data: templates,
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
