export type TierLevel = 'free' | 'pro' | 'enterprise';

export interface TierDefinition {
  id: string;
  name: TierLevel;
  level: number;
  maxUsers: number;
  maxScansPerMonth: number | null;
  priceMonthly: number;
  priceAnnual?: number;
  features: {
    emailAnalysis: boolean;
    fileScanning: boolean;
    teamCollaboration: boolean;
    twoFactor: boolean;
    captchaRequired: boolean;
    vpnIntegration: boolean;
    wifiChecker: boolean;
    advancedAnalytics: boolean;
    integrations: string[];
  };
}

export const TIERS: Record<TierLevel, TierDefinition> = {
  free: {
    id: 'tier_free',
    name: 'free',
    level: 1,
    maxUsers: 1,
    maxScansPerMonth: 50,
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
      integrations: []
    }
  },
  pro: {
    id: 'tier_pro',
    name: 'pro',
    level: 2,
    maxUsers: 6,
    maxScansPerMonth: null,
    priceMonthly: 9.99,
    priceAnnual: 99.99,
    features: {
      emailAnalysis: true,
      fileScanning: true,
      teamCollaboration: true,
      twoFactor: true,
      captchaRequired: true,
      vpnIntegration: true,
      wifiChecker: true,
      advancedAnalytics: true,
      integrations: ['slack', 'teams', 'discord', 'gmail', 'outlook', 'onedrive', 'dropbox']
    }
  },
  enterprise: {
    id: 'tier_enterprise',
    name: 'enterprise',
    level: 3,
    maxUsers: 500,
    maxScansPerMonth: null,
    priceMonthly: 0,
    features: {
      emailAnalysis: true,
      fileScanning: true,
      teamCollaboration: true,
      twoFactor: true,
      captchaRequired: true,
      vpnIntegration: true,
      wifiChecker: true,
      advancedAnalytics: true,
      integrations: [
        'slack', 'teams', 'discord', 'gmail', 'outlook', 'onedrive', 'dropbox',
        'protonmail', 'yahoo', 'google-drive', 'box', 'telegram',
        '1password', 'lastpass', 'bitwarden',
        'protonvpn', 'expressvpn', 'nordvpn'
      ]
    }
  }
};

export function getTierByLevel(level: TierLevel): TierDefinition {
  return TIERS[level];
}

export function canAccessFeature(tier: TierLevel, feature: keyof TierDefinition['features']): boolean {
  const tierDef = TIERS[tier];
  if (feature === 'integrations') return tierDef.features.integrations.length > 0;
  return tierDef.features[feature] === true;
}

export function canAddTeamMembers(tier: TierLevel, currentMembers: number): boolean {
  const tierDef = TIERS[tier];
  return currentMembers < tierDef.maxUsers;
}

export function canScan(tier: TierLevel, scansThisMonth: number): boolean {
  const tierDef = TIERS[tier];
  if (tierDef.maxScansPerMonth === null) return true;
  return scansThisMonth < tierDef.maxScansPerMonth;
}

export function getAvailableIntegrations(tier: TierLevel): string[] {
  const tierDef = TIERS[tier];
  return tierDef.features.integrations;
}
