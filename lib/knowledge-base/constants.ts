export const KB_CONFIG = {
  MAX_VERSIONS: 50,
  VERSION_CLEANUP_DAYS: 180,
  DEFAULT_SEARCH_LIMIT: 100,
  MAX_SEARCH_RESULTS: 1000,
  SEARCH_INDEX_REFRESH_MS: 300000,
  PLAYBOOK_EXECUTION_TIMEOUT: 3600000,
  MIN_CONFIDENCE_THRESHOLD: 0.7,
  MAX_SUGGESTIONS_PER_DOCUMENT: 5,
  EXPORT_MAX_DOCUMENTS: 10000,
  ANALYTICS_RETENTION_DAYS: 365,
  DEFAULT_ACCESS_LEVEL: 'internal',
  REQUIRE_REVIEW_ON_PUBLISH: true,
  AUTO_ARCHIVE_VERSIONS_DAYS: 90,
};

export const KB_CATEGORIES = {
  INCIDENT_RESPONSE: 'incident_response',
  DEPLOYMENT: 'deployment',
  MAINTENANCE: 'maintenance',
  TROUBLESHOOTING: 'troubleshooting',
  TRAINING: 'training',
  SECURITY: 'security',
  COMPLIANCE: 'compliance',
  RUNBOOKS: 'runbooks',
};

export const KB_DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

export const KB_RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const KB_AUTOMATION_LEVELS = {
  MANUAL: 'manual',
  SEMI_AUTOMATED: 'semi-automated',
  FULLY_AUTOMATED: 'fully-automated',
};

export const KB_DOCUMENT_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

export const KB_SUGGESTION_TYPES = {
  IMPROVEMENT: 'improvement',
  RELATED_CONTENT: 'related-content',
  AUTOMATION: 'automation',
  TRAINING: 'training',
};

export const KB_EXECUTION_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
};

export const KB_STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

export const KB_IMPACT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const SEARCH_WEIGHTS = {
  TITLE: 3,
  TAGS: 2.5,
  CONTENT: 1,
  CATEGORY: 1.5,
};

export const ERROR_MESSAGES = {
  DOCUMENT_NOT_FOUND: 'Document not found',
  INVALID_DOCUMENT_ID: 'Invalid document ID',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to document',
  INVALID_VERSION: 'Invalid version specified',
  PLAYBOOK_EXECUTION_FAILED: 'Playbook execution failed',
  SEARCH_INDEX_ERROR: 'Search index error',
  EXPORT_FAILED: 'Export operation failed',
};

export const COMMON_TAGS = [
  'critical',
  'urgent',
  'automated',
  'requires-approval',
  'high-risk',
  'frequently-used',
  'under-review',
  'deprecated',
  'needs-update',
  'testing-required',
];
