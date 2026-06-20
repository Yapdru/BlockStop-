// Team Management API Routes
import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '../../middleware';
import { APIErrorHandler } from '../../error-handler';
import { RequestValidator, ValidationSchemas } from '../../request-validator';
import { rateLimiter, quotaManager } from '../../rate-limiter';

// Team Controller Types
export interface Team {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  ownerId: string;
  maxMembers: number;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

// In-memory team storage
const teamStore = new Map<string, Team>();
const teamMemberStore = new Map<string, TeamMember>();

export class TeamRoutes {
  /**
   * GET /api/v1/organizations/:orgId/teams - List teams in organization
   */
  static async listTeams(
    req: NextRequest,
    { params }: { params: { orgId: string } }
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

      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const search = url.searchParams.get('search') || '';

      let teams = Array.from(teamStore.values()).filter(t => t.orgId === params.orgId);

      if (search) {
        const searchLower = search.toLowerCase();
        teams = teams.filter(
          t =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower)
        );
      }

      teams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = teams.length;
      const items = teams.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: {
          items,
          hasMore,
          total,
          pageSize: items.length,
        },
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
   * GET /api/v1/organizations/:orgId/teams/:teamId - Get team by ID
   */
  static async getTeam(
    req: NextRequest,
    { params }: { params: { orgId: string; teamId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const team = teamStore.get(params.teamId);
      if (!team || team.orgId !== params.orgId) {
        throw new Error('Team not found');
      }

      const response = {
        success: true,
        data: team,
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
   * POST /api/v1/organizations/:orgId/teams - Create new team
   */
  static async createTeam(
    req: NextRequest,
    { params }: { params: { orgId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['teams:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const validation = APIMiddleware.validateRequest(req, ValidationSchemas.teamCreate);
      if (!validation.valid) {
        return APIErrorHandler.formatErrorResponse(validation.error!, req);
      }

      const body = (await req.json()) as any;
      RequestValidator.validateBody(body, ValidationSchemas.teamCreate);

      if (!body.name) {
        throw new Error('Team name is required');
      }

      const now = new Date();
      const team: Team = {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orgId: params.orgId,
        name: body.name,
        description: body.description,
        ownerId: auth.context.userId,
        maxMembers: body.maxMembers || 50,
        memberCount: 1,
        createdAt: now,
        updatedAt: now,
      };

      teamStore.set(team.id, team);

      // Add creator as owner
      const member: TeamMember = {
        id: `tmember_${Date.now()}`,
        teamId: team.id,
        userId: auth.context.userId,
        email: 'user@example.com',
        role: 'owner',
        joinedAt: now,
      };
      teamMemberStore.set(member.id, member);

      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: team,
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
   * PUT /api/v1/organizations/:orgId/teams/:teamId - Update team
   */
  static async updateTeam(
    req: NextRequest,
    { params }: { params: { orgId: string; teamId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['teams:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const team = teamStore.get(params.teamId);
      if (!team || team.orgId !== params.orgId) {
        throw new Error('Team not found');
      }

      const body = (await req.json()) as any;

      if (body.name) team.name = body.name;
      if (body.description !== undefined) team.description = body.description;
      if (body.maxMembers) team.maxMembers = body.maxMembers;
      team.updatedAt = new Date();

      teamStore.set(params.teamId, team);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: team,
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
   * DELETE /api/v1/organizations/:orgId/teams/:teamId - Delete team
   */
  static async deleteTeam(
    req: NextRequest,
    { params }: { params: { orgId: string; teamId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['teams:delete']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const team = teamStore.get(params.teamId);
      if (!team || team.orgId !== params.orgId) {
        throw new Error('Team not found');
      }

      // Delete team members
      for (const [key, member] of teamMemberStore.entries()) {
        if (member.teamId === params.teamId) {
          teamMemberStore.delete(key);
        }
      }

      teamStore.delete(params.teamId);
      quotaManager.incrementUsage(auth.context.apiKeyId, 1, 'daily');

      const response = {
        success: true,
        data: { message: 'Team deleted successfully' },
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
   * GET /api/v1/organizations/:orgId/teams/:teamId/members - Get team members
   */
  static async getMembers(
    req: NextRequest,
    { params }: { params: { orgId: string; teamId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const team = teamStore.get(params.teamId);
      if (!team || team.orgId !== params.orgId) {
        throw new Error('Team not found');
      }

      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let members = Array.from(teamMemberStore.values()).filter(
        m => m.teamId === params.teamId
      );

      members.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());

      const total = members.length;
      const items = members.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      const response = {
        success: true,
        data: {
          items,
          hasMore,
          total,
          pageSize: items.length,
        },
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
   * POST /api/v1/organizations/:orgId/teams/:teamId/members - Add team member
   */
  static async addMember(
    req: NextRequest,
    { params }: { params: { orgId: string; teamId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['teams:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const team = teamStore.get(params.teamId);
      if (!team || team.orgId !== params.orgId) {
        throw new Error('Team not found');
      }

      const body = (await req.json()) as { userId: string; email: string; role: string };

      const member: TeamMember = {
        id: `tmember_${Date.now()}`,
        teamId: params.teamId,
        userId: body.userId,
        email: body.email,
        role: body.role as any,
        joinedAt: new Date(),
      };

      teamMemberStore.set(member.id, member);
      team.memberCount++;
      teamStore.set(params.teamId, team);

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
        status: 201,
        headers: APIMiddleware.getSecurityHeaders(),
      });
    } catch (error) {
      const { error: apiError } = APIErrorHandler.handleError(error, req);
      return APIErrorHandler.formatErrorResponse(apiError, req);
    }
  }

  /**
   * DELETE /api/v1/organizations/:orgId/teams/:teamId/members/:memberId - Remove member
   */
  static async removeMember(
    req: NextRequest,
    { params }: { params: { orgId: string; teamId: string; memberId: string } }
  ): Promise<NextResponse> {
    try {
      const requestId = APIMiddleware.getRequestId(req);
      APIMiddleware.setLastRequest(req);

      const auth = APIMiddleware.authenticateRequest(req);
      if (!auth.valid || !auth.context) {
        return APIErrorHandler.formatErrorResponse(auth.error!, req);
      }

      const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, ['teams:write']);
      if (!scopeCheck.allowed) {
        return APIErrorHandler.formatErrorResponse(scopeCheck.error!, req);
      }

      const team = teamStore.get(params.teamId);
      if (!team || team.orgId !== params.orgId) {
        throw new Error('Team not found');
      }

      const member = teamMemberStore.get(params.memberId);
      if (!member || member.teamId !== params.teamId) {
        throw new Error('Member not found');
      }

      teamMemberStore.delete(params.memberId);
      team.memberCount--;
      teamStore.set(params.teamId, team);

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
}
