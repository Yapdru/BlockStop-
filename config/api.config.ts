/**
 * BlockStop Phase 16: Enterprise API & Integrations
 * API Configuration
 */

import { APIConfig, RateLimitConfig } from '../types/api';

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  free: {
    tier: 'free',
    requests_per_minute: 100,
    requests_per_hour: 5000,
    burst_allowance: 150,
  },
  pro: {
    tier: 'pro',
    requests_per_minute: 10000,
    requests_per_hour: 500000,
    burst_allowance: 15000,
  },
  enterprise: {
    tier: 'enterprise',
    requests_per_minute: 100000,
    requests_per_hour: 5000000,
    burst_allowance: 150000,
  },
};

export const apiConfig: APIConfig = {
  enabled: process.env.API_ENABLED !== 'false',
  version: 'v1',
  base_url: process.env.API_BASE_URL || 'https://api.blockstop.io',
  rate_limits: {
    free: rateLimitConfigs.free,
    pro: rateLimitConfigs.pro,
    enterprise: rateLimitConfigs.enterprise,
  },
  auth: {
    jwt_secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    oauth2_enabled: process.env.OAUTH2_ENABLED !== 'false',
    api_key_enabled: process.env.API_KEY_ENABLED !== 'false',
  },
  webhooks: {
    enabled: process.env.WEBHOOKS_ENABLED !== 'false',
    max_retries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '7'),
    retry_delay_ms: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '5000'),
  },
  cors: {
    enabled: true,
    allowed_origins: (process.env.CORS_ALLOWED_ORIGINS || 'https://blockstop.io,http://localhost:3000').split(','),
  },
};

// ===== API Endpoint Configuration =====
export const apiEndpoints = {
  // Threat endpoints
  threats: {
    list: '/api/v1/threats',
    create: '/api/v1/threats',
    get: '/api/v1/threats/:id',
    update: '/api/v1/threats/:id',
    delete: '/api/v1/threats/:id',
    analyze: '/api/v1/threats/:id/analyze',
    search: '/api/v1/threats/search',
  },

  // Scan endpoints
  scans: {
    list: '/api/v1/scans',
    create: '/api/v1/scans',
    get: '/api/v1/scans/:id',
    delete: '/api/v1/scans/:id',
    results: '/api/v1/scans/:id/results',
    status: '/api/v1/scans/:id/status',
  },

  // Organization endpoints
  organizations: {
    list: '/api/v1/organizations',
    create: '/api/v1/organizations',
    get: '/api/v1/organizations/:id',
    update: '/api/v1/organizations/:id',
    delete: '/api/v1/organizations/:id',
    stats: '/api/v1/organizations/:id/stats',
  },

  // Team endpoints
  teams: {
    list: '/api/v1/teams',
    create: '/api/v1/teams',
    get: '/api/v1/teams/:id',
    update: '/api/v1/teams/:id',
    delete: '/api/v1/teams/:id',
    members: '/api/v1/teams/:id/members',
  },

  // Authentication endpoints
  auth: {
    oauth2_authorize: '/api/v1/auth/oauth2/authorize',
    oauth2_token: '/api/v1/auth/oauth2/token',
    oauth2_callback: '/api/v1/auth/oauth2/callback',
    token_refresh: '/api/v1/auth/token/refresh',
    token_revoke: '/api/v1/auth/token/revoke',
  },

  // API Key endpoints
  apiKeys: {
    list: '/api/v1/api-keys',
    create: '/api/v1/api-keys',
    get: '/api/v1/api-keys/:id',
    revoke: '/api/v1/api-keys/:id/revoke',
    rotate: '/api/v1/api-keys/:id/rotate',
  },

  // Webhook endpoints
  webhooks: {
    list: '/api/v1/webhooks',
    create: '/api/v1/webhooks',
    get: '/api/v1/webhooks/:id',
    update: '/api/v1/webhooks/:id',
    delete: '/api/v1/webhooks/:id',
    test: '/api/v1/webhooks/:id/test',
    events: '/api/v1/webhooks/:id/events',
  },

  // Integration endpoints
  integrations: {
    list: '/api/v1/integrations',
    get: '/api/v1/integrations/:id',
    connect: '/api/v1/integrations/:id/connect',
    disconnect: '/api/v1/integrations/:id/disconnect',
    status: '/api/v1/integrations/:id/status',
    health: '/api/v1/integrations/:id/health',
    config: '/api/v1/integrations/:id/config',
  },

  // GraphQL endpoint
  graphql: '/api/v1/graphql',

  // Health checks
  health: '/api/v1/health',
  readiness: '/api/v1/readiness',

  // Batch operations
  batch: '/api/v1/batch',
};

// ===== Webhook Event Configurations =====
export const webhookEvents = {
  'threat.detected': {
    description: 'Emitted when a new threat is detected',
    sample_payload: {
      id: 'evt_1234567890',
      type: 'threat.detected',
      timestamp: new Date().toISOString(),
      org_id: 123,
      data: {
        threat_id: 456,
        threat_type: 'phishing',
        risk_score: 0.95,
        source: 'email',
      },
    },
  },
  'scan.completed': {
    description: 'Emitted when a scan completes',
    sample_payload: {
      id: 'evt_1234567891',
      type: 'scan.completed',
      timestamp: new Date().toISOString(),
      org_id: 123,
      data: {
        scan_id: 789,
        status: 'completed',
        threats_detected: 5,
        results: {},
      },
    },
  },
  'alert.triggered': {
    description: 'Emitted when an alert condition is met',
    sample_payload: {
      id: 'evt_1234567892',
      type: 'alert.triggered',
      timestamp: new Date().toISOString(),
      org_id: 123,
      data: {
        alert_id: 101,
        severity: 'high',
        message: 'Multiple threats detected',
      },
    },
  },
  'organization.created': {
    description: 'Emitted when a new organization is created',
    sample_payload: {
      id: 'evt_1234567893',
      type: 'organization.created',
      timestamp: new Date().toISOString(),
      org_id: 999,
      data: {
        org_id: 999,
        name: 'New Organization',
      },
    },
  },
  'integration.connected': {
    description: 'Emitted when an integration is connected',
    sample_payload: {
      id: 'evt_1234567894',
      type: 'integration.connected',
      timestamp: new Date().toISOString(),
      org_id: 123,
      data: {
        integration_id: 202,
        integration_type: 'slack',
        status: 'connected',
      },
    },
  },
  'api.rate_limit_exceeded': {
    description: 'Emitted when an API rate limit is exceeded',
    sample_payload: {
      id: 'evt_1234567895',
      type: 'api.rate_limit_exceeded',
      timestamp: new Date().toISOString(),
      org_id: 123,
      data: {
        api_key_id: 303,
        limit: 100,
        exceeded_by: 15,
      },
    },
  },
  'security.breach_detected': {
    description: 'Emitted when a critical security breach is detected',
    sample_payload: {
      id: 'evt_1234567896',
      type: 'security.breach_detected',
      timestamp: new Date().toISOString(),
      org_id: 123,
      data: {
        breach_id: 404,
        severity: 'critical',
        affected_records: 1000,
      },
    },
  },
};

// ===== Error Response Templates =====
export const errorTemplates = {
  UNAUTHORIZED: {
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
  INVALID_API_KEY: {
    status: 401,
    code: 'INVALID_API_KEY',
    message: 'Invalid API key provided',
  },
  FORBIDDEN: {
    status: 403,
    code: 'FORBIDDEN',
    message: 'You do not have permission to access this resource',
  },
  BAD_REQUEST: {
    status: 400,
    code: 'BAD_REQUEST',
    message: 'Invalid request parameters',
  },
  NOT_FOUND: {
    status: 404,
    code: 'NOT_FOUND',
    message: 'Resource not found',
  },
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
  },
  INTERNAL_ERROR: {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An internal server error occurred',
  },
};

// ===== Integration Types Configuration =====
export const integrationType = {
  siem: {
    name: 'SIEM',
    integrations: ['splunk', 'elk', 'datadog', 'new-relic'],
  },
  edr: {
    name: 'EDR',
    integrations: ['crowdstrike', 'microsoft-defender', 'sentinel-one'],
  },
  soar: {
    name: 'SOAR',
    integrations: ['cortex-xsoar', 'splunk-soar'],
  },
  ticketing: {
    name: 'Ticketing',
    integrations: ['jira', 'servicenow', 'linear'],
  },
  communication: {
    name: 'Communication',
    integrations: ['slack', 'teams', 'pagerduty', 'discord'],
  },
  cloud: {
    name: 'Cloud',
    integrations: ['aws', 'azure', 'gcp'],
  },
  email_security: {
    name: 'Email Security',
    integrations: ['proofpoint', 'mimecast', 'mailguard'],
  },
  threat_intel: {
    name: 'Threat Intelligence',
    integrations: ['alienvault', 'virustotal', 'abuse-ipdb'],
  },
};

// ===== GraphQL Configuration =====
export const graphqlConfig = {
  playground: process.env.GRAPHQL_PLAYGROUND !== 'false',
  introspection: process.env.NODE_ENV !== 'production',
  debug: process.env.NODE_ENV !== 'production',
  maxQueryDepth: 10,
  maxQueryComplexity: 1000,
  tracing: process.env.NODE_ENV === 'development',
};

export default apiConfig;
