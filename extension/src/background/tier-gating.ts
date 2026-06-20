/**
 * Tier-Based Feature Gating
 * Enforces feature access based on user subscription tier
 */

import type { TierLevel, TierFeatures } from '../shared/types';

/**
 * Rate limit configuration per tier
 */
const RATE_LIMITS: Record<TierLevel, { scansPerDay: number; scansPerHour: number }> = {
  free: { scansPerDay: 10, scansPerHour: 5 },
  neo: { scansPerDay: 50, scansPerHour: 20 },
  pro: { scansPerDay: 200, scansPerHour: 100 },
  office: { scansPerDay: 10000, scansPerHour: 5000 },
  max: { scansPerDay: 999999, scansPerHour: 999999 },
};

/**
 * Offline capability configuration per tier
 */
const TIER_FEATURES: Record<TierLevel, TierFeatures> = {
  free: {
    emailScanning: true,
    linkChecking: true,
    fileScanning: true,
    offlineMode: false,
    threatDatabase: 'none',
    maxScansPerDay: 10,
    aiPowered: false,
  },
  neo: {
    emailScanning: true,
    linkChecking: true,
    fileScanning: true,
    offlineMode: true,
    threatDatabase: 'limited',
    maxScansPerDay: 50,
    aiPowered: true,
  },
  pro: {
    emailScanning: true,
    linkChecking: true,
    fileScanning: true,
    offlineMode: true,
    threatDatabase: 'limited',
    maxScansPerDay: 200,
    aiPowered: true,
  },
  office: {
    emailScanning: true,
    linkChecking: true,
    fileScanning: true,
    offlineMode: false,
    threatDatabase: 'none',
    maxScansPerDay: 10000,
    aiPowered: true,
  },
  max: {
    emailScanning: true,
    linkChecking: true,
    fileScanning: true,
    offlineMode: true,
    threatDatabase: 'full',
    maxScansPerDay: 999999,
    aiPowered: true,
  },
};

/**
 * Check if feature is available for tier
 */
export function checkFeatureAccess(
  feature: 'emailScanning' | 'linkChecking' | 'fileScanning' | 'offlineMode' | 'aiPowered',
  tier: TierLevel
): boolean {
  const features = TIER_FEATURES[tier];
  return features[feature] as boolean;
}

/**
 * Get all features available for tier
 */
export function getTierFeatures(tier: TierLevel): TierFeatures {
  return { ...TIER_FEATURES[tier] };
}

/**
 * Get rate limit for tier
 */
export function getRateLimit(tier: TierLevel): { scansPerDay: number; scansPerHour: number } {
  return { ...RATE_LIMITS[tier] };
}

/**
 * Check if scan count is within rate limit
 */
export function canPerformScan(
  tier: TierLevel,
  scansInPeriod: number,
  period: 'day' | 'hour'
): boolean {
  const limits = RATE_LIMITS[tier];
  const limit = period === 'day' ? limits.scansPerDay : limits.scansPerHour;
  return scansInPeriod < limit;
}

/**
 * Get scans remaining before hitting limit
 */
export function getScansRemaining(
  tier: TierLevel,
  scansInPeriod: number,
  period: 'day' | 'hour'
): number {
  const limits = RATE_LIMITS[tier];
  const limit = period === 'day' ? limits.scansPerDay : limits.scansPerHour;
  return Math.max(0, limit - scansInPeriod);
}

/**
 * Get threat database capability level for tier
 */
export function getThreatDatabaseLevel(
  tier: TierLevel
): 'full' | 'limited' | 'none' {
  return TIER_FEATURES[tier].threatDatabase;
}

/**
 * Check if tier supports offline mode
 */
export function supportsOfflineMode(tier: TierLevel): boolean {
  return TIER_FEATURES[tier].offlineMode;
}

/**
 * Check if tier has AI-powered scanning
 */
export function hasAIPoweredScanning(tier: TierLevel): boolean {
  return TIER_FEATURES[tier].aiPowered;
}

/**
 * Get tier description
 */
export function getTierDescription(tier: TierLevel): string {
  const descriptions: Record<TierLevel, string> = {
    free: 'Free tier with basic scanning (10 scans/day, online only)',
    neo: 'Neo tier with offline support and 50 scans/day',
    pro: 'Pro tier with advanced AI and 200 scans/day',
    office: 'Office tier for teams with unlimited scans',
    max: 'Max tier with full offline database and unlimited features',
  };
  return descriptions[tier];
}

/**
 * Get upgrade suggestion for feature
 */
export function getSuggestedUpgrade(
  currentTier: TierLevel,
  requestedFeature: 'emailScanning' | 'linkChecking' | 'fileScanning' | 'offlineMode' | 'aiPowered'
): TierLevel | null {
  // If feature is already available, no upgrade needed
  if (checkFeatureAccess(requestedFeature, currentTier)) {
    return null;
  }

  // Suggest minimum tier that has the feature
  switch (requestedFeature) {
    case 'offlineMode':
      return currentTier === 'free' ? 'neo' : 'pro';
    case 'aiPowered':
      return currentTier === 'free' ? 'neo' : 'pro';
    default:
      return null;
  }
}

/**
 * Calculate effective feature set considering connectivity
 */
export function getEffectiveFeatures(
  tier: TierLevel,
  isOnline: boolean
): TierFeatures {
  const baseFeatures = getTierFeatures(tier);

  // If offline and tier doesn't support offline mode, disable dependent features
  if (!isOnline && !baseFeatures.offlineMode) {
    return {
      ...baseFeatures,
      emailScanning: false,
      linkChecking: false,
      fileScanning: false,
      threatDatabase: 'none',
    };
  }

  // For limited offline, reduce threat database capability
  if (!isOnline && baseFeatures.threatDatabase === 'limited') {
    return {
      ...baseFeatures,
      threatDatabase: 'limited',
    };
  }

  return baseFeatures;
}

/**
 * Check if tier upgrade is available from current tier
 */
export function canUpgradeFrom(tier: TierLevel): TierLevel[] {
  const upgradePath: Record<TierLevel, TierLevel[]> = {
    free: ['neo', 'pro', 'office', 'max'],
    neo: ['pro', 'office', 'max'],
    pro: ['office', 'max'],
    office: ['max'],
    max: [],
  };
  return upgradePath[tier];
}

/**
 * Get tier hierarchy level (for sorting/comparison)
 */
export function getTierLevel(tier: TierLevel): number {
  const hierarchy: Record<TierLevel, number> = {
    free: 0,
    neo: 1,
    pro: 2,
    office: 3,
    max: 4,
  };
  return hierarchy[tier];
}

/**
 * Check if tier A is greater than or equal to tier B
 */
export function isTierAtLeast(tier: TierLevel, minimum: TierLevel): boolean {
  return getTierLevel(tier) >= getTierLevel(minimum);
}

/**
 * Format scans remaining message for user
 */
export function formatScansRemaining(
  tier: TierLevel,
  scansUsed: number,
  period: 'day' | 'hour'
): string {
  const limit = getRateLimit(tier)[period === 'day' ? 'scansPerDay' : 'scansPerHour'];
  const remaining = getScansRemaining(tier, scansUsed, period);

  if (limit === 999999) {
    return 'Unlimited scans';
  }

  return `${remaining}/${limit} scans remaining today`;
}

/**
 * Get feature restrictions message for tier
 */
export function getRestrictionMessage(
  feature: 'emailScanning' | 'linkChecking' | 'fileScanning' | 'offlineMode' | 'aiPowered',
  tier: TierLevel
): string | null {
  if (checkFeatureAccess(feature, tier)) {
    return null;
  }

  const featureNames: Record<string, string> = {
    offlineMode: 'Offline scanning',
    aiPowered: 'AI-powered threat detection',
    fileScanning: 'File scanning',
    linkChecking: 'Link checking',
    emailScanning: 'Email scanning',
  };

  const suggestedTier = getSuggestedUpgrade(tier, feature);
  if (suggestedTier) {
    return `${featureNames[feature]} requires ${suggestedTier.toUpperCase()} tier or higher`;
  }

  return `${featureNames[feature]} is not available for your tier`;
}
