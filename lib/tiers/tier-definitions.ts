import { TierDefinition, TierType } from '@/types/auth';

export const TIER_DEFINITIONS: Record<TierType, TierDefinition> = {
  free: {
    id: 1,
    name: 'free',
    maxUsers: 1,
    priceMonthly: 0,
    features: {
      emailAnalysis: true,
      fileScanning: true,
      teamCollaboration: false,
      twoFactor: false,
      captchaRequired: false,
      vpnIntegration: false,
      wifiChecker: false,
      advancedAnalytics: false,
      customRules: false,
      webhookIntegrations: false,
      apiAccess: false,
      advancedIncidents: false,
      complianceReports: false,
      virusTotalScan: false,
      threatHunting: false,
      customDashboards: false,
      bulkOperations: false,
      multiFormatExport: false,
    },
  },
  pro: {
    id: 2,
    name: 'pro',
    maxUsers: 6,
    priceMonthly: 299,
    features: {
      emailAnalysis: true,
      fileScanning: true,
      teamCollaboration: true,
      twoFactor: true,
      captchaRequired: true,
      vpnIntegration: true,
      wifiChecker: true,
      advancedAnalytics: true,
      customRules: true,
      webhookIntegrations: true,
      apiAccess: true,
      advancedIncidents: true,
      complianceReports: true,
      virusTotalScan: true,
      threatHunting: true,
      customDashboards: true,
      bulkOperations: true,
      multiFormatExport: true,
    },
  },
  enterprise: {
    id: 3,
    name: 'enterprise',
    maxUsers: 100,
    priceMonthly: 9999,
    features: {
      emailAnalysis: true,
      fileScanning: true,
      teamCollaboration: true,
      twoFactor: true,
      captchaRequired: true,
      vpnIntegration: true,
      wifiChecker: true,
      advancedAnalytics: true,
      customRules: true,
      webhookIntegrations: true,
      apiAccess: true,
      advancedIncidents: true,
      complianceReports: true,
      virusTotalScan: true,
      threatHunting: true,
      customDashboards: true,
      bulkOperations: true,
      multiFormatExport: true,
    },
  },
};

export function getTierByName(name: string): TierDefinition | null {
  return TIER_DEFINITIONS[name as TierType] || null;
}

export function getTierById(id: number): TierDefinition | null {
  for (const tier of Object.values(TIER_DEFINITIONS)) {
    if (tier.id === id) {
      return tier;
    }
  }
  return null;
}

export function canUserAccessFeature(tierName: TierType, feature: string): boolean {
  const tier = TIER_DEFINITIONS[tierName];
  if (!tier) return false;
  return (tier.features as Record<string, boolean>)[feature] === true;
}

export function getTeamLimits(tierName: TierType): { maxUsers: number } {
  const tier = TIER_DEFINITIONS[tierName];
  return {
    maxUsers: tier ? tier.maxUsers : 1,
  };
}
