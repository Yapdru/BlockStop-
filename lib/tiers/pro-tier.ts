/**
 * BlockStop PRO Tier Configuration & Feature Gates
 * Production-ready PRO tier system (₹299/month)
 * Includes: Team collaboration, advanced analytics, custom rules, integrations, compliance reporting
 */

import { query } from '@/lib/db';
import { TierType } from '@/types/auth';
import { ProFeature, ProTierQuotas, ProTierLimits, ProRole } from '@/types/pro-tier';

// ============ PRO TIER CONFIGURATION ============

export const PRO_TIER_CONFIG = {
  TIER_NAME: 'pro',
  TIER_ID: 2,
  MONTHLY_PRICE_INR: 299,
  MONTHLY_PRICE_USD: 3.60,
  MAX_TEAM_MEMBERS: 6,
  CURRENCY: 'INR',
};

// ============ PRO TIER QUOTAS ============

export const PRO_QUOTAS: ProTierQuotas = {
  // API Quotas
  apiCallsPerMonth: 100000,
  concurrentAPIRequests: 100,
  apiRateLimit: 1000, // req/min
  apiKeyLimit: 10,

  // Dashboard Quotas
  maxCustomDashboards: 5,
  widgetsPerDashboard: 50,

  // Rule Quotas
  maxCustomRules: 100,
  maxConcurrentRules: 50,

  // Integration Quotas
  maxWebhooks: 10,
  webhookRetryAttempts: 5,

  // Bulk Operations
  maxFilesPerBulkScan: 1000,
  maxConcurrentBulkScans: 5,
  bulkScanTimeout: 3600000, // 1 hour in ms

  // Export Quotas
  maxExportsPerMonth: 100,
  maxExportSize: 1000, // MB

  // Threat Hunting
  maxThreatHuntingWorkspaces: 5,
  maxHuntingSessions: 10,

  // Storage
  storageLimitGB: 100,
};

// ============ PRO TIER LIMITS ============

export const PRO_LIMITS: ProTierLimits = {
  maxTeamMembers: 6,
  maxTeams: 1,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  webhookTimeout: 30 * 1000, // 30 seconds
  reportGenerationTimeout: 300 * 1000, // 5 minutes
};

// ============ PRO FEATURES ============

export const PRO_FEATURES = {
  [ProFeature.TEAM_COLLABORATION]: {
    enabled: true,
    maxMembers: 6,
    roles: [ProRole.ADMIN, ProRole.ANALYST, ProRole.VIEWER],
    description: 'Collaborate with up to 6 team members with role-based access control',
  },
  [ProFeature.ADVANCED_ANALYTICS]: {
    enabled: true,
    dashboards: 5,
    widgets: 50,
    description: 'Create custom dashboards with 50+ widget types and trend analysis',
  },
  [ProFeature.CUSTOM_RULES]: {
    enabled: true,
    maxRules: 100,
    ruleTypes: ['yara', 'sigma'],
    description: 'Write and deploy custom YARA and Sigma detection rules',
  },
  [ProFeature.WEBHOOK_INTEGRATIONS]: {
    enabled: true,
    maxWebhooks: 10,
    platforms: ['slack', 'teams', 'jira', 'servicenow'],
    description: 'Integrate with Slack, Teams, Jira, and ServiceNow with custom webhooks',
  },
  [ProFeature.API_ACCESS]: {
    enabled: true,
    rateLimit: 1000, // req/min
    maxKeys: 10,
    description: 'REST API access with 100k monthly API calls and rate limiting',
  },
  [ProFeature.PRIORITY_SUPPORT]: {
    enabled: true,
    supportChannel: 'email',
    responseTime: '2 hours',
    description: 'Priority email support with 2-hour response time',
  },
  [ProFeature.ADVANCED_INCIDENTS]: {
    enabled: true,
    features: ['labeling', 'assignment', 'timeline', 'escalation', 'automation'],
    description: 'Advanced incident management with assignments, labels, and escalation',
  },
  [ProFeature.COMPLIANCE_REPORTS]: {
    enabled: true,
    frameworks: ['gdpr', 'hipaa', 'soc2', 'iso27001', 'pci-dss', 'ccpa'],
    description: 'Generate custom compliance reports for GDPR, HIPAA, SOC2, ISO27001, PCI-DSS, CCPA',
  },
  [ProFeature.VPN_INTEGRATION]: {
    enabled: true,
    providers: 100,
    description: 'Integration with 100+ VPN providers and VPN health monitoring',
  },
  [ProFeature.WIFI_SECURITY]: {
    enabled: true,
    features: ['vulnerability-detection', 'encryption-analysis', 'threat-scoring'],
    description: 'Advanced WiFi security checker with vulnerability detection',
  },
  [ProFeature.VIRUSTOTAL_SCAN]: {
    enabled: true,
    maxScansPerMonth: 100000,
    description: 'File scanning with VirusTotal integration for advanced malware detection',
  },
  [ProFeature.THREAT_HUNTING]: {
    enabled: true,
    maxWorkspaces: 5,
    features: ['custom-queries', 'collaboration', 'findings-management', 'timeline'],
    description: 'Threat hunting workspace with custom queries and team collaboration',
  },
  [ProFeature.CUSTOM_DASHBOARDS]: {
    enabled: true,
    maxDashboards: 5,
    widgets: 50,
    description: 'Create up to 5 custom dashboards with advanced visualizations',
  },
  [ProFeature.BULK_OPERATIONS]: {
    enabled: true,
    maxFilesPerScan: 1000,
    maxConcurrentScans: 5,
    description: 'Bulk scan up to 1000 files with concurrent operation support',
  },
  [ProFeature.MULTI_FORMAT_EXPORT]: {
    enabled: true,
    formats: ['json', 'csv', 'pdf', 'html'],
    description: 'Export reports in JSON, CSV, PDF, and HTML formats',
  },
};

// ============ FEATURE GATE FUNCTIONS ============

/**
 * Check if a PRO feature is enabled for a user
 */
export async function isProFeatureEnabled(
  userId: number,
  feature: ProFeature
): Promise<boolean> {
  try {
    const result = await query(
      `SELECT p.name FROM users u
       JOIN plans p ON u.plan_id = p.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const tierName = result.rows[0].name as TierType;
    return tierName === 'pro' || tierName === 'enterprise';
  } catch (error) {
    console.error('Error checking PRO feature access:', error);
    return false;
  }
}

/**
 * Require PRO feature or throw error
 */
export async function requireProFeature(userId: number, feature: ProFeature): Promise<void> {
  const enabled = await isProFeatureEnabled(userId, feature);
  if (!enabled) {
    throw new Error(
      `Feature "${feature}" requires PRO tier. Current plan: ${await getUserTierName(userId)}`
    );
  }
}

/**
 * Get user's tier name
 */
export async function getUserTierName(userId: number): Promise<TierType> {
  try {
    const result = await query(
      `SELECT p.name FROM users u
       JOIN plans p ON u.plan_id = p.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0].name as TierType;
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Get user's quota limits
 */
export async function getUserQuotas(userId: number): Promise<ProTierQuotas | null> {
  const tierName = await getUserTierName(userId);

  if (tierName === 'pro' || tierName === 'enterprise') {
    return PRO_QUOTAS;
  }

  return null;
}

/**
 * Check if user can perform an action based on feature availability
 */
export async function canUserAccessProFeature(
  userId: number,
  feature: ProFeature
): Promise<{ allowed: boolean; reason?: string }> {
  const isEnabled = await isProFeatureEnabled(userId, feature);

  if (!isEnabled) {
    return {
      allowed: false,
      reason: `Feature "${feature}" is not available in your current plan. Upgrade to PRO for access.`,
    };
  }

  return { allowed: true };
}

/**
 * Get all available PRO features for a user
 */
export async function getAvailableProFeatures(userId: number): Promise<ProFeature[]> {
  const tierName = await getUserTierName(userId);

  if (tierName === 'pro' || tierName === 'enterprise') {
    return Object.values(ProFeature);
  }

  return [];
}

/**
 * Validate team size for PRO tier
 */
export async function validateTeamSize(teamId: string, memberCount: number): Promise<boolean> {
  return memberCount <= PRO_TIER_CONFIG.MAX_TEAM_MEMBERS;
}

/**
 * Check if quota is exceeded
 */
export function isQuotaExceeded(
  quotaKey: keyof ProTierQuotas,
  currentUsage: number
): boolean {
  const limit = PRO_QUOTAS[quotaKey];
  return typeof limit === 'number' && currentUsage >= limit;
}

/**
 * Calculate remaining quota
 */
export function getRemainingQuota(
  quotaKey: keyof ProTierQuotas,
  currentUsage: number
): number {
  const limit = PRO_QUOTAS[quotaKey];
  if (typeof limit !== 'number') {
    return 0;
  }
  return Math.max(0, limit - currentUsage);
}

/**
 * Get quota usage percentage
 */
export function getQuotaUsagePercentage(
  quotaKey: keyof ProTierQuotas,
  currentUsage: number
): number {
  const limit = PRO_QUOTAS[quotaKey];
  if (typeof limit !== 'number') {
    return 0;
  }
  return Math.round((currentUsage / limit) * 100);
}

// ============ PRO TIER VALIDATION ============

/**
 * Validate if an upgrade to PRO is appropriate
 */
export function validateProUpgrade(
  currentTier: TierType,
  targetTier: TierType
): { valid: boolean; reason?: string } {
  const validUpgradePaths: Record<TierType, TierType[]> = {
    free: ['pro', 'enterprise'],
    pro: ['enterprise'],
    enterprise: [],
  };

  if (!validUpgradePaths[currentTier]?.includes(targetTier)) {
    return {
      valid: false,
      reason: `Cannot upgrade from ${currentTier} to ${targetTier}`,
    };
  }

  return { valid: true };
}

/**
 * Get PRO tier feature comparison
 */
export function getProFeatureComparison(
  tier1: TierType,
  tier2: TierType
): Record<ProFeature, { tier1: boolean; tier2: boolean }> {
  const comparison: Record<ProFeature, { tier1: boolean; tier2: boolean }> = {} as any;

  for (const feature of Object.values(ProFeature)) {
    comparison[feature] = {
      tier1: tier1 === 'pro' || tier1 === 'enterprise',
      tier2: tier2 === 'pro' || tier2 === 'enterprise',
    };
  }

  return comparison;
}

/**
 * Export PRO tier metadata for API responses
 */
export function getProTierMetadata() {
  return {
    tierName: PRO_TIER_CONFIG.TIER_NAME,
    tierId: PRO_TIER_CONFIG.TIER_ID,
    pricing: {
      monthlyINR: PRO_TIER_CONFIG.MONTHLY_PRICE_INR,
      monthlyUSD: PRO_TIER_CONFIG.MONTHLY_PRICE_USD,
      currency: PRO_TIER_CONFIG.CURRENCY,
    },
    limits: PRO_LIMITS,
    quotas: PRO_QUOTAS,
    features: PRO_FEATURES,
    supportedRoles: [ProRole.ADMIN, ProRole.ANALYST, ProRole.VIEWER],
  };
}
