// BlockStop Phase 16 - REST API v1 Index
// Unified export point for all v1 API routes and controllers

export { ThreatRoutes } from './routes/threats';
export { ScanRoutes } from './routes/scans';
export { OrgRoutes } from './routes/organizations';
export { TeamRoutes } from './routes/teams';

// Controllers
export {
  ThreatController,
  type Threat,
  type ThreatDetection,
  type CreateThreatRequest,
  type UpdateThreatRequest,
} from './controllers/threat-controller';

export {
  ScanController,
  type Scan,
  type ScanResult,
  type DetectedThreat,
  type CreateScanRequest,
  type UpdateScanRequest,
} from './controllers/scan-controller';

export {
  OrgController,
  type Organization,
  type OrgSettings,
  type OrgMember,
  type OrgInvite,
  type CreateOrgRequest,
  type UpdateOrgRequest,
} from './controllers/org-controller';

// Types and utilities for v1 API
export type { APIContext, APIResponse, APIError, PaginationParams, PaginatedResponse } from '../types';
export { APIMiddleware } from '../middleware';
export { APIErrorHandler } from '../error-handler';
export { RequestValidator, ValidationSchemas, type ValidationSchema } from '../request-validator';
export { rateLimiter, quotaManager } from '../rate-limiter';
