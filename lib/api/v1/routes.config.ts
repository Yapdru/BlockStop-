// API Routes Configuration - v1 Routing Definitions
// This file defines all available API v1 endpoints and their handlers

import { NextRequest, NextResponse } from 'next/server';
import { ThreatRoutes } from './routes/threats';
import { ScanRoutes } from './routes/scans';
import { OrgRoutes } from './routes/organizations';
import { TeamRoutes } from './routes/teams';

export interface RouteConfig {
  path: string;
  method: string;
  handler: (req: NextRequest, params?: any) => Promise<NextResponse>;
  scopes: string[];
  description: string;
}

// Map of all v1 API routes
export const v1Routes: RouteConfig[] = [
  // THREATS - Detection API
  {
    path: 'GET /api/v1/threats',
    method: 'GET',
    handler: ThreatRoutes.listThreats,
    scopes: ['threats:read'],
    description: 'List all threats with pagination and filtering',
  },
  {
    path: 'GET /api/v1/threats/:id',
    method: 'GET',
    handler: ThreatRoutes.getThreat,
    scopes: ['threats:read'],
    description: 'Get threat by ID',
  },
  {
    path: 'POST /api/v1/threats',
    method: 'POST',
    handler: ThreatRoutes.createThreat,
    scopes: ['threats:write'],
    description: 'Create new threat',
  },
  {
    path: 'PUT /api/v1/threats/:id',
    method: 'PUT',
    handler: ThreatRoutes.updateThreat,
    scopes: ['threats:write'],
    description: 'Update threat',
  },
  {
    path: 'DELETE /api/v1/threats/:id',
    method: 'DELETE',
    handler: ThreatRoutes.deleteThreat,
    scopes: ['threats:delete'],
    description: 'Delete threat',
  },
  {
    path: 'GET /api/v1/threats/:id/detections',
    method: 'GET',
    handler: ThreatRoutes.getThreatDetections,
    scopes: ['threats:read'],
    description: 'Get threat detections history',
  },
  {
    path: 'GET /api/v1/threats/:id/indicators',
    method: 'GET',
    handler: ThreatRoutes.getIndicators,
    scopes: ['threats:read'],
    description: 'Get threat indicators (IOCs)',
  },
  {
    path: 'GET /api/v1/threats/stats',
    method: 'GET',
    handler: ThreatRoutes.getStats,
    scopes: ['threats:read'],
    description: 'Get threat statistics',
  },

  // SCANS - Scan Management API
  {
    path: 'GET /api/v1/scans',
    method: 'GET',
    handler: ScanRoutes.listScans,
    scopes: ['scans:read'],
    description: 'List all scans with pagination',
  },
  {
    path: 'GET /api/v1/scans/:id',
    method: 'GET',
    handler: ScanRoutes.getScan,
    scopes: ['scans:read'],
    description: 'Get scan by ID',
  },
  {
    path: 'POST /api/v1/scans',
    method: 'POST',
    handler: ScanRoutes.createScan,
    scopes: ['scans:write'],
    description: 'Create new scan',
  },
  {
    path: 'POST /api/v1/scans/bulk',
    method: 'POST',
    handler: ScanRoutes.bulkCreateScans,
    scopes: ['scans:write'],
    description: 'Create multiple scans in bulk',
  },
  {
    path: 'GET /api/v1/scans/:id/results',
    method: 'GET',
    handler: ScanRoutes.getScanResults,
    scopes: ['scans:read'],
    description: 'Get scan results',
  },
  {
    path: 'DELETE /api/v1/scans/:id',
    method: 'DELETE',
    handler: ScanRoutes.deleteScan,
    scopes: ['scans:delete'],
    description: 'Delete scan',
  },
  {
    path: 'GET /api/v1/scans/:type/:target/history',
    method: 'GET',
    handler: ScanRoutes.getScanHistory,
    scopes: ['scans:read'],
    description: 'Get scan history for specific target',
  },
  {
    path: 'GET /api/v1/scans/stats',
    method: 'GET',
    handler: ScanRoutes.getStats,
    scopes: ['scans:read'],
    description: 'Get scan statistics',
  },
  {
    path: 'GET /api/v1/scans/templates',
    method: 'GET',
    handler: ScanRoutes.getTemplates,
    scopes: ['scans:read'],
    description: 'Get scan templates',
  },

  // ORGANIZATIONS - Organization Management API
  {
    path: 'GET /api/v1/organizations',
    method: 'GET',
    handler: OrgRoutes.listOrgs,
    scopes: ['orgs:read'],
    description: "List user's organizations",
  },
  {
    path: 'GET /api/v1/organizations/:id',
    method: 'GET',
    handler: OrgRoutes.getOrg,
    scopes: ['orgs:read'],
    description: 'Get organization by ID',
  },
  {
    path: 'POST /api/v1/organizations',
    method: 'POST',
    handler: OrgRoutes.createOrg,
    scopes: ['orgs:write'],
    description: 'Create new organization',
  },
  {
    path: 'PUT /api/v1/organizations/:id',
    method: 'PUT',
    handler: OrgRoutes.updateOrg,
    scopes: ['orgs:write'],
    description: 'Update organization',
  },
  {
    path: 'DELETE /api/v1/organizations/:id',
    method: 'DELETE',
    handler: OrgRoutes.deleteOrg,
    scopes: ['orgs:delete'],
    description: 'Delete organization',
  },
  {
    path: 'GET /api/v1/organizations/:id/members',
    method: 'GET',
    handler: OrgRoutes.getMembers,
    scopes: ['orgs:read'],
    description: 'Get organization members',
  },
  {
    path: 'POST /api/v1/organizations/:id/members/invite',
    method: 'POST',
    handler: OrgRoutes.inviteMember,
    scopes: ['orgs:write'],
    description: 'Invite member to organization',
  },
  {
    path: 'DELETE /api/v1/organizations/:id/members/:memberId',
    method: 'DELETE',
    handler: OrgRoutes.removeMember,
    scopes: ['orgs:write'],
    description: 'Remove member from organization',
  },
  {
    path: 'PUT /api/v1/organizations/:id/members/:memberId/role',
    method: 'PUT',
    handler: OrgRoutes.updateMemberRole,
    scopes: ['orgs:write'],
    description: 'Update member role',
  },
  {
    path: 'GET /api/v1/organizations/:id/settings',
    method: 'GET',
    handler: OrgRoutes.getSettings,
    scopes: ['orgs:read'],
    description: 'Get organization settings',
  },
  {
    path: 'PUT /api/v1/organizations/:id/settings',
    method: 'PUT',
    handler: OrgRoutes.updateSettings,
    scopes: ['orgs:write'],
    description: 'Update organization settings',
  },
  {
    path: 'GET /api/v1/organizations/:id/stats',
    method: 'GET',
    handler: OrgRoutes.getStats,
    scopes: ['orgs:read'],
    description: 'Get organization statistics',
  },

  // TEAMS - Team Management API
  {
    path: 'GET /api/v1/organizations/:orgId/teams',
    method: 'GET',
    handler: TeamRoutes.listTeams,
    scopes: ['teams:read'],
    description: 'List teams in organization',
  },
  {
    path: 'GET /api/v1/organizations/:orgId/teams/:teamId',
    method: 'GET',
    handler: TeamRoutes.getTeam,
    scopes: ['teams:read'],
    description: 'Get team by ID',
  },
  {
    path: 'POST /api/v1/organizations/:orgId/teams',
    method: 'POST',
    handler: TeamRoutes.createTeam,
    scopes: ['teams:write'],
    description: 'Create new team',
  },
  {
    path: 'PUT /api/v1/organizations/:orgId/teams/:teamId',
    method: 'PUT',
    handler: TeamRoutes.updateTeam,
    scopes: ['teams:write'],
    description: 'Update team',
  },
  {
    path: 'DELETE /api/v1/organizations/:orgId/teams/:teamId',
    method: 'DELETE',
    handler: TeamRoutes.deleteTeam,
    scopes: ['teams:delete'],
    description: 'Delete team',
  },
  {
    path: 'GET /api/v1/organizations/:orgId/teams/:teamId/members',
    method: 'GET',
    handler: TeamRoutes.getMembers,
    scopes: ['teams:read'],
    description: 'Get team members',
  },
  {
    path: 'POST /api/v1/organizations/:orgId/teams/:teamId/members',
    method: 'POST',
    handler: TeamRoutes.addMember,
    scopes: ['teams:write'],
    description: 'Add member to team',
  },
  {
    path: 'DELETE /api/v1/organizations/:orgId/teams/:teamId/members/:memberId',
    method: 'DELETE',
    handler: TeamRoutes.removeMember,
    scopes: ['teams:write'],
    description: 'Remove member from team',
  },
];

/**
 * Get routes grouped by resource
 */
export const routesByResource = {
  threats: v1Routes.filter(r => r.path.includes('/threats')),
  scans: v1Routes.filter(r => r.path.includes('/scans')),
  organizations: v1Routes.filter(r => r.path.includes('/organizations')),
  teams: v1Routes.filter(r => r.path.includes('/teams')),
};

/**
 * Get routes by HTTP method
 */
export const routesByMethod = {
  GET: v1Routes.filter(r => r.method === 'GET'),
  POST: v1Routes.filter(r => r.method === 'POST'),
  PUT: v1Routes.filter(r => r.method === 'PUT'),
  DELETE: v1Routes.filter(r => r.method === 'DELETE'),
};

/**
 * Get all required scopes
 */
export const allScopes = Array.from(
  new Set(v1Routes.flatMap(r => r.scopes))
).sort();

/**
 * Documentation for all endpoints
 */
export const apiDocumentation = {
  title: 'BlockStop REST API v1',
  version: '1.0.0',
  description: 'Enterprise-grade REST API for threat detection, scanning, and organization management',
  baseUrl: 'https://api.blockstop.dev/api/v1',
  authentication: 'Bearer token (API Key)',
  rateLimit: {
    free: '100 requests/minute',
    pro: '10,000 requests/minute',
    enterprise: '100,000 requests/minute',
  },
  resources: {
    threats: {
      description: 'Threat detection and intelligence endpoints',
      endpoints: routesByResource.threats.length,
    },
    scans: {
      description: 'Scan management and execution endpoints',
      endpoints: routesByResource.scans.length,
    },
    organizations: {
      description: 'Organization and team management endpoints',
      endpoints: routesByResource.organizations.length,
    },
    teams: {
      description: 'Team collaboration and member management endpoints',
      endpoints: routesByResource.teams.length,
    },
  },
  totalEndpoints: v1Routes.length,
};
