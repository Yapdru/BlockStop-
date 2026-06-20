// Organization Management API Routes
import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '../../middleware';
import { APIErrorHandler } from '../../error-handler';
import { RequestValidator, ValidationSchemas } from '../../request-validator';
import { OrgController, CreateOrgRequest, UpdateOrgRequest } from '../controllers/org-controller';
import { rateLimiter, quotaManager } from '../../rate-limiter';

export class OrgRoutes {
  /**
   * GET /api/v1/organizations - List user's organizations
   */
  static async listOrgs(req: NextRequest): Promise<NextResponse> {
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
        tier: url.searchParams.get('tier') || undefined,
        status: url.searchParams.get('status') || undefined,
        search: url.searchParams.get('search') || undefined,
      };

      const result = await OrgController.listOrgs(auth.context, params);
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
   * GET /api/v1/organizations/:id - Get organization by ID
   */
  static async getOrg(
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

      const org = await OrgController.getOrgById(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: org,
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
   * POST /api/v1/organizations - Create new organization
   */
  static async createOrg(req: NextRequest): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      const validation = APIMiddleware.validateRequest(req, ValidationSchemas.orgCreate);
      if (!validation.valid) {
        return APIErrorHandler.formatErrorResponse(validation.error!, req);
      }

      const body = (await req.json()) as CreateOrgRequest;
      RequestValidator.validateBody(body, ValidationSchemas.orgCreate);

      const org = await OrgController.createOrg(body, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: org,
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
   * PUT /api/v1/organizations/:id - Update organization
   */
  static async updateOrg(
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

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:write']);
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

      const body = (await req.json()) as UpdateOrgRequest;
      const org = await OrgController.updateOrg(params.id, body, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: org,
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
   * DELETE /api/v1/organizations/:id - Delete organization
   */
  static async deleteOrg(
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

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:delete']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const rateLimit = auth.context.rateLimit;
      const rateLimitCheck = APIMiddleware.checkRateLimit(rateLimit);
      if (!rateLimitCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(rateLimitCheck.error!, req);
      }

      await OrgController.deleteOrg(params.id, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: { message: 'Organization deleted successfully' },
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
   * GET /api/v1/organizations/:id/members - Get organization members
   */
  static async getMembers(
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

      const members = await OrgController.getMembers(params.id, auth.context, paginationParams);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: members,
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
   * POST /api/v1/organizations/:id/members/invite - Invite member
   */
  static async inviteMember(
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

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const validation = APIMiddleware.validateRequest(req);
      if (!validation.valid) {
        return APIErrorHandler.formatErrorResponse(validation.error!, req);
      }

      const body = (await req.json()) as { email: string; role: string };
      const invite = await OrgController.inviteMember(params.id, body.email, body.role, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: invite,
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
   * DELETE /api/v1/organizations/:id/members/:memberId - Remove member
   */
  static async removeMember(
    req: NextRequest,
    { params }: { params: { id: string; memberId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      await OrgController.removeMember(params.id, params.memberId, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: { message: 'Member removed successfully' },
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
   * PUT /api/v1/organizations/:id/members/:memberId/role - Update member role
   */
  static async updateMemberRole(
    req: NextRequest,
    { params }: { params: { id: string; memberId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const body = (await req.json()) as { role: string };
      const member = await OrgController.updateMemberRole(
        params.id,
        params.memberId,
        body.role,
        auth.context
      );
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: member,
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
   * GET /api/v1/organizations/:id/settings - Get organization settings
   */
  static async getSettings(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const settings = await OrgController.getSettings(params.id, auth.context);

      const response = {
        success: true,
        data: settings,
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
   * PUT /api/v1/organizations/:id/settings - Update organization settings
   */
  static async updateSettings(
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

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['orgs:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const body = (await req.json()) as any;
      const settings = await OrgController.updateSettings(params.id, body, auth.context);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: settings,
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
   * GET /api/v1/organizations/:id/stats - Get organization statistics
   */
  static async getStats(
    req: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const stats = await OrgController.getStats(params.id, auth.context);

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
