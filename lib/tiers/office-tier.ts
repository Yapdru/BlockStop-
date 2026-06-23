/**
 * BlockStop OFFICE Tier Configuration
 * Professional and enterprise features - ₹399/month
 * Team collaboration (up to 10 users) with enterprise focus
 */

import { TierType } from '@/types/auth';
import {
  OfficeTierRole,
  OfficeComplianceDashboard,
  ProfessionalReport,
  HealthcareComplianceConfig,
  Office365Integration,
  DLPPolicy,
  SLAConfiguration,
  IncidentTemplate,
  MultiLocationConfig,
  ProfessionalIntegration,
  OfficeTeam,
  ProfessionalSupportTicket,
  AuditLogEntry,
} from '@/types/office-tier';

export const OFFICE_TIER_DEFINITION = {
  id: 3,
  name: 'office' as TierType,
  displayName: 'OFFICE Professional',
  description: 'Professional features for mid-to-large organizations',
  priceMonthly: 399,
  priceCurrency: 'INR',
  maxUsers: 10,
  maxTeams: 5,
  maxLocations: 3,
  storageLimitGB: 1000,

  // Core Features
  features: {
    // Baseline (from PRO tier)
    emailAnalysis: true,
    fileScanning: true,
    teamCollaboration: true,
    twoFactor: true,
    vpnIntegration: true,
    wifiChecker: true,
    advancedAnalytics: true,

    // OFFICE-specific features
    complianceDashboard: true,
    professionalReporting: true,
    healthcareSpecific: true,
    advancedAuditLogging: true,
    office365Integration: true,
    slackIntegration: true,
    jiraIntegration: true,
    azureDevOpsIntegration: true,
    serviceNowIntegration: true,
    pagerdutyIntegration: true,
    dataLossPrevention: true,
    advancedSLATracking: true,
    professionalThreatIntelligence: true,
    incidentReviewTemplates: true,
    postIncidentReporting: true,
    multiLocationSupport: true,
    professionalSupport: true,
    professionalOnboarding: true,
  },

  // Compliance Frameworks
  supportedFrameworks: [
    'HIPAA',
    'SOC2',
    'ISO27001',
    'GDPR',
    'NIST',
    'HITRUST',
    'PCI-DSS',
    'CCPA',
  ],

  // Role-based Access Control
  roles: {
    director: {
      label: 'Director',
      permissions: [
        'view_all_data',
        'manage_policies',
        'manage_users',
        'view_reports',
        'export_data',
        'manage_integrations',
        'approve_incidents',
        'manage_compliance',
        'view_audit_logs',
      ],
    },
    manager: {
      label: 'Manager',
      permissions: [
        'view_team_data',
        'manage_team_users',
        'create_reports',
        'manage_team_policies',
        'escalate_incidents',
        'view_team_audit_logs',
      ],
    },
    analyst: {
      label: 'Analyst',
      permissions: [
        'view_data',
        'investigate_threats',
        'create_incidents',
        'respond_incidents',
        'generate_reports',
        'view_logs',
      ],
    },
    viewer: {
      label: 'Viewer',
      permissions: [
        'view_dashboards',
        'view_reports',
        'view_public_data',
      ],
    },
  },
};

/**
 * OFFICE Tier Professional Features Configuration
 */
export const OFFICE_PROFESSIONAL_FEATURES = {
  // Compliance & Audit
  compliance: {
    frameworks: ['HIPAA', 'SOC2', 'ISO27001', 'GDPR', 'NIST', 'HITRUST'],
    auditingRequired: true,
    auditLogRetention: 2555, // 7 years in days
    complianceReportFrequency: 'monthly',
    automatedAssessment: true,
  },

  // Healthcare Features
  healthcare: {
    hipaaEnabled: true,
    patientDataProtection: true,
    breachNotificationAutomation: true,
    businessAssociateAgreement: true,
    encryptionRequired: true,
    tokenizationSupported: true,
    deidSupported: true,
  },

  // Reporting
  reporting: {
    executiveSummaries: true,
    boardReports: true,
    complianceReports: true,
    incidentReports: true,
    slaReports: true,
    threatIntelligenceReports: true,
    customReports: true,
    scheduledReporting: true,
    distributionLists: true,
    exportFormats: ['pdf', 'html', 'excel', 'pptx'],
  },

  // Integrations
  integrations: {
    office365: {
      outlook: true,
      teams: true,
      sharepoint: true,
      onedrive: true,
      azureAD: true,
    },
    slack: true,
    jira: true,
    azureDevOps: true,
    serviceNow: true,
    pagerduty: true,
    splunk: true,
    datadog: true,
  },

  // Security & DLP
  security: {
    dlpPolicies: true,
    maxDLPPolicies: 50,
    encryptionAtRest: true,
    encryptionInTransit: true,
    keyManagement: true,
    advancedTLS: true,
  },

  // SLA Management
  sla: {
    configurable: true,
    tracking: true,
    reporting: true,
    alerting: true,
    escalation: true,
  },

  // Team Management
  team: {
    maxUsers: 10,
    maxTeams: 5,
    roleBasedAccess: true,
    departmentSupport: true,
    multiLocation: true,
  },

  // Support
  support: {
    email: true,
    chat: true,
    phone: true,
    video: true,
    responseSLA: '4 hours',
    dedicatedAccountManager: true,
    customTraining: true,
  },
};

/**
 * Check if user can access OFFICE tier feature
 */
export function canAccessOfficeTierFeature(feature: string): boolean {
  return (OFFICE_TIER_DEFINITION.features as Record<string, boolean>)[feature] === true;
}

/**
 * Get OFFICE tier role permissions
 */
export function getOfficeTierRolePermissions(role: OfficeTierRole): string[] {
  const roleConfig = OFFICE_TIER_DEFINITION.roles[role];
  return roleConfig ? roleConfig.permissions : [];
}

/**
 * Validate OFFICE tier requirements
 */
export function validateOfficeTierRequirements(
  userCount: number,
  requiredFeatures: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check user count
  if (userCount > OFFICE_TIER_DEFINITION.maxUsers) {
    errors.push(`Maximum users for OFFICE tier is ${OFFICE_TIER_DEFINITION.maxUsers}`);
  }

  // Check feature availability
  for (const feature of requiredFeatures) {
    if (!canAccessOfficeTierFeature(feature)) {
      errors.push(`Feature ${feature} is not available in OFFICE tier`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get OFFICE tier pricing details
 */
export interface PricingDetails {
  tierName: string;
  monthlyPrice: number;
  currency: string;
  annualPrice: number;
  setupFee: number;
  maxUsers: number;
  features: string[];
}

export function getOfficeTierPricingDetails(): PricingDetails {
  return {
    tierName: OFFICE_TIER_DEFINITION.displayName,
    monthlyPrice: OFFICE_TIER_DEFINITION.priceMonthly,
    currency: OFFICE_TIER_DEFINITION.priceCurrency,
    annualPrice: OFFICE_TIER_DEFINITION.priceMonthly * 12 * 0.9, // 10% annual discount
    setupFee: 5000,
    maxUsers: OFFICE_TIER_DEFINITION.maxUsers,
    features: Object.keys(OFFICE_TIER_DEFINITION.features).filter(
      (f) => (OFFICE_TIER_DEFINITION.features as Record<string, boolean>)[f]
    ),
  };
}

/**
 * OFFICE Tier Feature Matrix
 */
export const OFFICE_FEATURE_MATRIX = {
  complianceFrameworks: {
    HIPAA: { included: true, premium: false },
    SOC2: { included: true, premium: false },
    ISO27001: { included: true, premium: false },
    GDPR: { included: true, premium: false },
    NIST: { included: true, premium: false },
    HITRUST: { included: true, premium: false },
  },

  reporting: {
    executive_summary: { included: true, premium: false },
    board_reports: { included: true, premium: false },
    compliance_reports: { included: true, premium: false },
    incident_reports: { included: true, premium: false },
    sla_reports: { included: true, premium: false },
    threat_intelligence: { included: true, premium: false },
    custom_reports: { included: true, premium: false },
  },

  integrations: {
    office365: { included: true, premium: false },
    slack: { included: true, premium: false },
    jira: { included: true, premium: false },
    azure_devops: { included: true, premium: false },
    servicenow: { included: true, premium: false },
    pagerduty: { included: true, premium: false },
    splunk: { included: true, premium: false },
    datadog: { included: true, premium: false },
  },

  security: {
    dlp: { included: true, premium: false },
    encryption_rest: { included: true, premium: false },
    encryption_transit: { included: true, premium: false },
    key_management: { included: true, premium: false },
  },
};

/**
 * Default OFFICE Tier Configuration Templates
 */
export const OFFICE_CONFIG_TEMPLATES = {
  // Default compliance dashboard
  defaultComplianceDashboard: (): Omit<OfficeComplianceDashboard, 'id' | 'organizationId'> => ({
    frameworks: [],
    overallScore: 0,
    auditTrail: [],
    criticalAlerts: [],
    upcomingAudits: [],
    lastUpdated: new Date(),
  }),

  // Default SLA configuration
  defaultSLAConfig: (): Omit<SLAConfiguration, 'id' | 'organizationId'> => ({
    incidentResponseTime: 15, // minutes
    detectionTime: 30,
    containmentTime: 4, // hours
    remediationTime: 24,
    reportingDeadline: 72,
    monthlyAvailability: 99.9,
    targetCriticalUptime: 99.99,
  }),

  // Default healthcare compliance
  defaultHealthcareConfig: (): Omit<HealthcareComplianceConfig, 'organizationId'> => ({
    hipaaEnabled: true,
    hitrustEnabled: false,
    nistEnabled: false,
    breachNotificationEnabled: true,
    patientDataEncryption: {
      algorithm: 'AES-256-GCM',
      keyRotationInterval: 90,
      lastKeyRotation: new Date(),
      tokenization: true,
    },
    accessControls: [],
    auditFrequency: 'monthly',
  }),

  // Default team configuration
  defaultTeamConfig: (): Omit<OfficeTeam, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> => ({
    name: 'Default OFFICE Team',
    maxMembers: 10,
    members: [],
    roles: [],
  }),
};

/**
 * Upgrade path from other tiers
 */
export const OFFICE_TIER_UPGRADE_RULES = {
  from_free: {
    dataRetentionDays: 90,
    historyAvailable: false,
    description: 'Upgrade from Free tier - limited historical data available',
  },
  from_pro: {
    dataRetentionDays: 2555, // 7 years
    historyAvailable: true,
    description: 'Upgrade from PRO tier - full data migration',
  },
};

/**
 * OFFICE tier limits and quotas
 */
export const OFFICE_TIER_LIMITS = {
  maxUsers: 10,
  maxTeams: 5,
  maxLocations: 3,
  maxDLPPolicies: 50,
  maxIncidentTemplates: 100,
  maxReportsPerMonth: 1000,
  maxAuditLogRetentionDays: 2555, // 7 years
  maxConcurrentIntegrations: 8,
  storageGB: 1000,
  monthlyAPICallLimit: 10000000,
  dailyReportGenerationLimit: 100,
};
