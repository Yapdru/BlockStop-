/**
 * Certification Levels & Tiers
 * Defines the different certification levels for plugins in the marketplace
 */

export type CertificationLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'uncertified';

export interface CertificationTier {
  level: CertificationLevel;
  name: string;
  description: string;
  requirements: string[];
  minReputationScore: number;
  revenueShare: {
    developer: number;
    blockstop: number;
  };
  badges: string[];
  supportTier: 'standard' | 'priority' | 'dedicated' | 'custom';
  marketplaceFeatures: {
    priorityPlacement: boolean;
    featuredListings: number;
    dedicatedSupport: boolean;
    customIntegration: boolean;
  };
}

export const CERTIFICATION_TIERS: Record<CertificationLevel, CertificationTier> = {
  uncertified: {
    level: 'uncertified',
    name: 'Uncertified',
    description: 'Plugin not yet certified',
    requirements: [],
    minReputationScore: 0,
    revenueShare: {
      developer: 0,
      blockstop: 100,
    },
    badges: [],
    supportTier: 'standard',
    marketplaceFeatures: {
      priorityPlacement: false,
      featuredListings: 0,
      dedicatedSupport: false,
      customIntegration: false,
    },
  },
  bronze: {
    level: 'bronze',
    name: 'Bronze',
    description: 'Basic Certification - Code passes automated tests',
    requirements: [
      'Code passes automated tests',
      'Security scan passes',
      'Performance acceptable',
      'Documentation provided',
      'Basic support availability',
    ],
    minReputationScore: 2.0,
    revenueShare: {
      developer: 60,
      blockstop: 40,
    },
    badges: ['automated-tests', 'security-scan', 'performance-verified'],
    supportTier: 'standard',
    marketplaceFeatures: {
      priorityPlacement: false,
      featuredListings: 0,
      dedicatedSupport: false,
      customIntegration: false,
    },
  },
  silver: {
    level: 'silver',
    name: 'Silver',
    description: 'Advanced Certification - All Bronze requirements plus manual audit',
    requirements: [
      'All Bronze requirements',
      'Manual security audit passes',
      'Integration tested with core features',
      'Developer reputation > 4.0 stars',
      'Responsive support (24 hour SLA)',
      'Quarterly updates',
    ],
    minReputationScore: 4.0,
    revenueShare: {
      developer: 70,
      blockstop: 30,
    },
    badges: ['security-audited', 'integration-tested', 'trusted-partner'],
    supportTier: 'priority',
    marketplaceFeatures: {
      priorityPlacement: true,
      featuredListings: 1,
      dedicatedSupport: false,
      customIntegration: false,
    },
  },
  gold: {
    level: 'gold',
    name: 'Gold',
    description: 'Premium Certification - Advanced features and support',
    requirements: [
      'All Silver requirements',
      'Manual performance optimization',
      'Dedicated support & maintenance',
      'Integration tested with 10+ integrations',
      'Developer reputation > 4.5 stars',
      'Monthly updates minimum',
      'SLA: 4-hour response time',
    ],
    minReputationScore: 4.5,
    revenueShare: {
      developer: 80,
      blockstop: 20,
    },
    badges: ['gold-certified', 'premium-support', 'performance-optimized', 'widely-integrated'],
    supportTier: 'dedicated',
    marketplaceFeatures: {
      priorityPlacement: true,
      featuredListings: 2,
      dedicatedSupport: true,
      customIntegration: false,
    },
  },
  platinum: {
    level: 'platinum',
    name: 'Platinum',
    description: 'Enterprise Partners - Custom integration support',
    requirements: [
      'All Gold requirements',
      'Custom integration support',
      'Priority marketplace placement',
      'Technical partnership benefits',
      'Minimum 1+ year track record',
      'SLA: 1-hour response time',
      'Custom revenue negotiation',
    ],
    minReputationScore: 4.8,
    revenueShare: {
      developer: 85,
      blockstop: 15,
    },
    badges: ['platinum-partner', 'enterprise-ready', 'custom-integration', 'priority-support'],
    supportTier: 'custom',
    marketplaceFeatures: {
      priorityPlacement: true,
      featuredListings: 5,
      dedicatedSupport: true,
      customIntegration: true,
    },
  },
};

export function getCertificationTier(level: CertificationLevel): CertificationTier {
  return CERTIFICATION_TIERS[level];
}

export function getRevenueSplit(level: CertificationLevel): { developer: number; blockstop: number } {
  const tier = getCertificationTier(level);
  return tier.revenueShare;
}

export function isHigherThan(level1: CertificationLevel, level2: CertificationLevel): boolean {
  const levels: CertificationLevel[] = ['uncertified', 'bronze', 'silver', 'gold', 'platinum'];
  return levels.indexOf(level1) > levels.indexOf(level2);
}

export function canUpgradeToTier(currentLevel: CertificationLevel, targetLevel: CertificationLevel): boolean {
  const levels: CertificationLevel[] = ['uncertified', 'bronze', 'silver', 'gold', 'platinum'];
  return levels.indexOf(targetLevel) > levels.indexOf(currentLevel);
}
