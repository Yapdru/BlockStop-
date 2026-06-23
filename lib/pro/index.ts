/**
 * BlockStop PRO Tier Module Index
 * Centralized exports for all PRO tier features and services
 */

// ============ TIER & FEATURE MANAGEMENT ============
export * from './advanced-analytics';
export * from './api-gateway';
export * from './bulk-operations';
export * from './compliance-pro';
export * from './custom-rules';
export * from './integrations-pro';
export * from './threat-hunting';

// ============ TYPE EXPORTS (from types) ============
export type {
  ProFeature,
  ProRole,
  ProTierQuotas,
  ProTierLimits,
  DashboardWidget,
  CustomDashboard,
  DashboardShare,
  YARARule,
  SigmaRule,
  RuleValidationResult,
  ValidationError,
  ValidationWarning,
  RuleTestResult,
  RuleDeployment,
  DeploymentStatus,
  DeploymentMetrics,
  ThreatHuntingWorkspace,
  WorkspaceMember,
  HuntQuery,
  QueryResult,
  ThreatFinding,
  WorkspaceEvent,
  ProIncidentManagement,
  IncidentLabel,
  IncidentAssignment,
  IncidentTimeline,
  TimelineEvent,
  IncidentEscalation,
  ComplianceFramework,
  ComplianceFinding,
  ComplianceReport,
  ExportJob,
  BulkScanJob,
  BulkScanResult,
  BulkOperation,
  BulkOperationResult,
  APIKey,
  APIPermission,
  WebhookTemplate,
  TransformationRule,
  RetryPolicy,
  VPNProvider,
  VPNHealthStatus,
  WiFiSecurityReport,
  WiFiVulnerability,
  ProTeam,
  TeamMember,
  TeamPermission,
  TeamInvitation,
  QuotaUsage,
  AuditLog,
  TrendAnalysis,
  DateRange,
  TrendDataPoint,
  ForecastData,
  AnomalyDetection,
  IntegrationHealth,
  IntegrationMetrics,
  VirusTotalScanResult,
  EngineDetection,
  VirusTotalDetectionHistory,
  ExportFormat,
  WebhookIntegration,
} from '@/types/pro-tier';

// ============ TIER CONFIGURATION ============
export {
  PRO_TIER_CONFIG,
  PRO_QUOTAS,
  PRO_LIMITS,
  PRO_FEATURES,
  isProFeatureEnabled,
  requireProFeature,
  getUserTierName,
  getUserQuotas,
  canUserAccessProFeature,
  getAvailableProFeatures,
  validateTeamSize,
  isQuotaExceeded,
  getRemainingQuota,
  getQuotaUsagePercentage,
  validateProUpgrade,
  getProFeatureComparison,
  getProTierMetadata,
} from '@/lib/tiers/pro-tier';

// ============ CLASS EXPORTS (for direct instantiation if needed) ============
export { AdvancedAnalyticsEngine } from './advanced-analytics';
export { CustomRulesManager } from './custom-rules';
export { ProAPIGateway } from './api-gateway';
export { BulkOperationsManager } from './bulk-operations';
export { ProComplianceReporter } from './compliance-pro';
export { ProIntegrationsManager } from './integrations-pro';
export { ThreatHuntingEngine } from './threat-hunting';

// ============ ANALYTICS FUNCTIONS ============
export {
  generateTrendAnalysis,
  analyzeThreatPatterns,
  calculateRiskScore,
  getComparativeAnalysis,
} from './advanced-analytics';

// ============ CUSTOM RULES FUNCTIONS ============
export {
  createYARARule,
  createSigmaRule,
  validateYARARule,
  validateSigmaRule,
  testRule,
  deployRule,
  generateRuleFromTemplate,
} from './custom-rules';

// ============ API GATEWAY FUNCTIONS ============
export {
  validateRequest,
  checkRateLimit,
  formatResponse,
  formatErrorResponse,
  generateAPIKey,
  rotateAPIKey,
} from './api-gateway';

// ============ BULK OPERATIONS FUNCTIONS ============
export {
  initiateBulkScan,
  monitorScanProgress,
  getBulkScanResults,
  estimateBulkScan,
} from './bulk-operations';

// ============ COMPLIANCE FUNCTIONS ============
export {
  generateGDPRReport,
  generateHIPAAReport,
  generateSOC2Report,
  generateISO27001Report,
  scheduleComplianceReport,
  exportComplianceReport,
} from './compliance-pro';

// ============ INTEGRATIONS FUNCTIONS ============
export {
  setupSlackIntegration,
  setupTeamsIntegration,
  setupJiraIntegration,
  setupServiceNowIntegration,
  testIntegration,
  getIntegrationStatus,
} from './integrations-pro';

// ============ THREAT HUNTING FUNCTIONS ============
export {
  createWorkspace,
  createHuntingQuery,
  executeQuery,
  createFinding,
  generateHuntReport,
} from './threat-hunting';

// ============ CONVENIENCE UTILITIES ============

/**
 * Get all PRO tier metadata for API responses
 */
export function getProTierInfo() {
  return {
    tier: 'pro',
    pricing: {
      monthly_inr: 299,
      monthly_usd: 3.60,
      currency: 'INR',
    },
    features: PRO_FEATURES,
    quotas: PRO_QUOTAS,
    limits: PRO_LIMITS,
    supportedRoles: [ProRole.ADMIN, ProRole.ANALYST, ProRole.VIEWER],
  };
}

// ============ MIDDLEWARE & GUARDS ============

/**
 * Middleware to check if user has PRO access
 */
export async function requireProAccess(userId: number) {
  const tierName = await getUserTierName(userId);
  if (tierName !== 'pro' && tierName !== 'enterprise') {
    throw new Error('This feature requires PRO tier. Please upgrade to continue.');
  }
}

/**
 * Middleware to check specific PRO feature access
 */
export async function requireProFeatureAccess(userId: number, feature: ProFeature) {
  const enabled = await isProFeatureEnabled(userId, feature);
  if (!enabled) {
    throw new Error(
      `Feature "${feature}" requires PRO tier. Please upgrade to continue.`
    );
  }
}

/**
 * Check quota before operation
 */
export function checkQuotaLimit(quotaKey: keyof ProTierQuotas, currentUsage: number): boolean {
  if (isQuotaExceeded(quotaKey, currentUsage)) {
    throw new Error(
      `Quota exceeded for "${quotaKey}". Current usage: ${currentUsage}/${PRO_QUOTAS[quotaKey]}`
    );
  }
  return true;
}

/**
 * Format quota usage for display
 */
export function formatQuotaUsage(
  quotaKey: keyof ProTierQuotas,
  currentUsage: number
): {
  limit: number;
  used: number;
  remaining: number;
  percentageUsed: number;
} {
  const limit = PRO_QUOTAS[quotaKey] as number;
  const used = currentUsage;
  const remaining = getRemainingQuota(quotaKey, currentUsage);
  const percentageUsed = getQuotaUsagePercentage(quotaKey, currentUsage);

  return {
    limit,
    used,
    remaining,
    percentageUsed,
  };
}

// Re-export enum types
export { ProFeature } from '@/types/pro-tier';
export { ProRole } from '@/types/pro-tier';
export { ExportFormat } from '@/types/pro-tier';
export { WebhookIntegration } from '@/types/pro-tier';

// ============ VERSION & METADATA ============
export const PRO_MODULE_VERSION = '1.0.0';
export const PRO_MODULE_FEATURES_COUNT = 15; // All PRO tier features
export const LAST_UPDATED = new Date('2026-06-23');
