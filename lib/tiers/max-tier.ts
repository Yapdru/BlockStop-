/**
 * MAX Tier Configuration & Management
 * ₹499/month - Premium enterprise security tier
 */

import {
  MaxTierConfig,
  MaxTierFeatures,
  SLAConfig,
  SupportConfig,
  IntegrationConfig,
  MLModelConfig,
  UEBAConfig,
  ZeroDayConfig,
  ThreatPredictorConfig,
  IncidentAutomationConfig,
  PurpleTeamConfig,
  ForensicsConfig,
  NetworkAnalyticsConfig,
  WhiteLabelConfig,
} from '@/types/max-tier';

/**
 * Complete MAX Tier Feature Set Configuration
 */
export const MAX_TIER_CONFIG: MaxTierConfig = {
  id: 3,
  name: 'max',
  tier: 'MAX',
  priceMonthly: 499,
  priceCurrency: 'INR',
  maxTeamUsers: Number.MAX_SAFE_INTEGER, // Unlimited
  maxApiCallsPerMonth: 10000000, // 10 million
  maxStorageGB: 5000, // 5TB
  features: {
    // Core features
    unlimitedTeamUsers: true,
    betterBotAIAdvanced: true,
    whiteLabel: true,
    customIntegrations: true,

    // ML & Detection
    advancedMLThreatDetection: true,
    lstmModelDetection: true,
    cnnModelDetection: true,
    behavioralAnalysis: true,
    uebaSystem: true,
    zeroDayDetection: true,
    predictiveThreatForecasting: true,
    modelFineTuning: true,

    // Response & Automation
    incidentAutoRemediation: true,
    automatedResponsePlaybooks: true,

    // Red Team & Security
    purpleTeamExercises: true,
    redTeamSimulations: true,
    advancedForensics: true,

    // Network & Traffic
    deepPacketInspection: true,
    networkTrafficAnalysis: true,

    // Threat Intelligence
    customThreatIntelFeeds: true,
    threatFeedIntegration: true,

    // Support & SLA
    dedicatedAccountManager: true,
    prioritySupport: true,
    premiumSupport24x7: true,
    slaGuarantee99_99: true,

    // Analytics & Health
    customHealthChecks: true,
    premiumAnalytics: true,
    anomalyDetection: true,

    // Advanced features
    customMLModelTraining: true,
    neuralNetworkThreats: true,
    behavioralPatternLearning: true,
    predictiveIncidentDetection: true,
    advancedForensicAnalysis: true,
    premiumIntegrations: true,
  },
  sla: {
    uptime: 0.9999,
    responseTime: {
      critical: 15,
      high: 30,
      medium: 60,
      low: 120,
    },
    monthlyStatusPageReport: true,
    dedicatedEngineer: true,
    customSLA: true,
  },
  support: {
    channels: ['email', 'chat', 'phone', 'video', 'slack', 'dedicated_engineer'],
    availability: '24x7',
    responseTimeMinutes: {
      critical: 15,
      high: 30,
      medium: 60,
    },
    dedicatedAccount: true,
    dedicatedSlack: true,
    quarterlyBusinessReviews: true,
    customTraining: true,
  },
  integrations: {
    zapier: true,
    make: true,
    customAPIs: true,
    webhooks: true,
    maxCustomIntegrations: 100,
    oauth2: true,
    samlSSO: true,
    ldap: true,
    customProtocols: true,
  },
  mlModels: {
    lstm: {
      enabled: true,
      sequenceLength: 256,
      hiddenUnits: 256,
      layers: 3,
      dropoutRate: 0.3,
      trainingEpochs: 100,
      batchSize: 32,
    },
    cnn: {
      enabled: true,
      filters: [32, 64, 128, 256],
      kernelSize: 3,
      poolSize: 2,
      dropoutRate: 0.3,
      trainingEpochs: 100,
      batchSize: 32,
    },
    customModels: true,
    modelFineTuning: true,
    maxModelsPerOrg: 50,
    trainingDataRetention: 730, // 2 years
  },
};

/**
 * UEBA (User & Entity Behavior Analytics) Configuration
 */
export const UEBA_CONFIG: UEBAConfig = {
  enabled: true,
  baseliningPeriodDays: 30,
  sensitivityLevel: 'high',
  entityTypes: [
    'user',
    'host',
    'service_account',
    'app',
    'network_device',
    'cloud_account',
  ],
  behaviorModels: [
    {
      name: 'login_patterns',
      metrics: [
        'login_time',
        'login_location',
        'login_device',
        'failed_attempts',
      ],
      threshold: 0.7,
      windowSize: 24, // hours
      alertOnDeviation: true,
    },
    {
      name: 'data_access',
      metrics: [
        'files_accessed',
        'data_volume',
        'access_time',
        'file_sensitivity',
      ],
      threshold: 0.8,
      windowSize: 8, // hours
      alertOnDeviation: true,
    },
    {
      name: 'privilege_usage',
      metrics: [
        'sudo_commands',
        'privileged_access',
        'role_changes',
        'permission_grants',
      ],
      threshold: 0.6,
      windowSize: 1, // hours
      alertOnDeviation: true,
    },
    {
      name: 'network_behavior',
      metrics: [
        'data_exfiltration',
        'unusual_ports',
        'c2_communication',
        'lateral_movement',
      ],
      threshold: 0.5,
      windowSize: 1, // hours
      alertOnDeviation: true,
    },
  ],
  anomalyScoring: true,
  riskScoring: true,
};

/**
 * Zero-Day Detection Configuration
 */
export const ZERO_DAY_CONFIG: ZeroDayConfig = {
  enabled: true,
  signaturesPerDay: 1000,
  vulnerabilityDataFeeds: 15,
  exploitPrediction: true,
  cvssScoring: true,
  patchRecommendations: true,
  exploitAvailabilityTracking: true,
};

/**
 * Threat Predictor Configuration
 */
export const THREAT_PREDICTOR_CONFIG: ThreatPredictorConfig = {
  enabled: true,
  forecastingWindow: 30, // days
  confidenceThreshold: 0.75,
  modelsEnabled: [
    'arima',
    'prophet',
    'lstm_time_series',
    'ensemble',
    'gradient_boosting',
    'random_forest',
    'neural_network',
  ],
  retrainingFrequency: 7, // days
  historicalDataRetention: 365, // days (1 year)
};

/**
 * Incident Automation Configuration
 */
export const INCIDENT_AUTOMATION_CONFIG: IncidentAutomationConfig = {
  enabled: true,
  autoPlaybookExecution: true,
  maxConcurrentRemediations: 50,
  rollbackOnFailure: true,
  playbooks: [
    {
      id: 'isolate_compromised_host',
      name: 'Isolate Compromised Host',
      trigger: 'malware_detected OR privilege_escalation_detected',
      actions: [
        {
          type: 'isolate_host',
          params: { isolationType: 'network', logActivity: true },
          timeout: 60,
          retryAttempts: 3,
        },
        {
          type: 'snapshot',
          params: { includeMemory: true, includeDisks: true },
          timeout: 300,
          retryAttempts: 2,
        },
        {
          type: 'alert_team',
          params: { severity: 'critical', channels: ['slack', 'email'] },
          timeout: 30,
          retryAttempts: 1,
        },
        {
          type: 'create_ticket',
          params: {
            jira: true,
            servicenow: true,
            priority: 'highest',
          },
          timeout: 60,
          retryAttempts: 2,
        },
      ],
      rollbackActions: [
        {
          type: 'alert_team',
          params: {
            message: 'Rollback initiated - reviewing incident',
          },
          timeout: 30,
          retryAttempts: 1,
        },
      ],
      requiredApprovals: 0,
      estimatedExecutionTime: 450,
    },
    {
      id: 'block_malicious_ip',
      name: 'Block Malicious IP Address',
      trigger: 'malicious_ip_detected OR ddos_detected',
      actions: [
        {
          type: 'block_ip',
          params: {
            firewall: true,
            waf: true,
            duration: 3600,
            logReason: true,
          },
          timeout: 120,
          retryAttempts: 3,
        },
        {
          type: 'alert_team',
          params: {
            severity: 'high',
            channels: ['slack', 'email', 'sms'],
          },
          timeout: 30,
          retryAttempts: 1,
        },
      ],
      rollbackActions: [
        {
          type: 'unblock_ip',
          params: { duration: 3600 },
          timeout: 120,
          retryAttempts: 2,
        },
      ],
      requiredApprovals: 1,
      estimatedExecutionTime: 150,
    },
    {
      id: 'revoke_compromised_tokens',
      name: 'Revoke Compromised Tokens',
      trigger: 'credential_compromise OR token_theft',
      actions: [
        {
          type: 'revoke_token',
          params: {
            tokenTypes: ['api_keys', 'oauth', 'jwt', 'session'],
            notification: true,
          },
          timeout: 180,
          retryAttempts: 3,
        },
        {
          type: 'run_scan',
          params: {
            scanType: 'credential_exposure',
            scope: 'organization',
          },
          timeout: 600,
          retryAttempts: 2,
        },
      ],
      rollbackActions: [],
      requiredApprovals: 0,
      estimatedExecutionTime: 780,
    },
  ],
  ticketIntegration: true,
  slackNotifications: true,
  webhookNotifications: true,
};

/**
 * Purple Team Configuration
 */
export const PURPLE_TEAM_CONFIG: PurpleTeamConfig = {
  enabled: true,
  scheduleExercises: true,
  exerciseFrequency: 'monthly',
  scenarios: [
    {
      id: 'advanced_persistent_threat',
      name: 'Advanced Persistent Threat (APT) Simulation',
      attackChain: [
        {
          name: 'Initial Reconnaissance',
          technique: 'T1592 - Gather Victim Host Information',
          mitreTactic: 'reconnaissance',
          mitreId: 'TA0043',
          duration: 60,
          detection: [
            { source: 'network', rule: 'suspicious_dns_queries', confidence: 0.85 },
            { source: 'network', rule: 'port_scanning_detected', confidence: 0.9 },
          ],
        },
        {
          name: 'Initial Access',
          technique: 'T1566 - Phishing',
          mitreTactic: 'initial-access',
          mitreId: 'TA0001',
          duration: 30,
          detection: [
            { source: 'endpoint', rule: 'malicious_attachment', confidence: 0.95 },
            { source: 'network', rule: 'c2_callback', confidence: 0.9 },
          ],
        },
        {
          name: 'Execution',
          technique: 'T1203 - Exploitation for Client Execution',
          mitreTactic: 'execution',
          mitreId: 'TA0002',
          duration: 15,
          detection: [
            { source: 'endpoint', rule: 'process_injection', confidence: 0.92 },
            { source: 'endpoint', rule: 'malware_behavior', confidence: 0.88 },
          ],
        },
        {
          name: 'Persistence',
          technique: 'T1547 - Boot or Logon Autostart Execution',
          mitreTactic: 'persistence',
          mitreId: 'TA0003',
          duration: 20,
          detection: [
            { source: 'endpoint', rule: 'registry_modification', confidence: 0.85 },
            { source: 'endpoint', rule: 'scheduled_task_creation', confidence: 0.9 },
          ],
        },
        {
          name: 'Privilege Escalation',
          technique: 'T1068 - Exploitation for Privilege Escalation',
          mitreTactic: 'privilege-escalation',
          mitreId: 'TA0004',
          duration: 25,
          detection: [
            { source: 'endpoint', rule: 'privilege_escalation_attempt', confidence: 0.94 },
            { source: 'endpoint', rule: 'token_impersonation', confidence: 0.91 },
          ],
        },
        {
          name: 'Defense Evasion',
          technique: 'T1140 - Deobfuscate/Decode Files or Information',
          mitreTactic: 'defense-evasion',
          mitreId: 'TA0005',
          duration: 30,
          detection: [
            { source: 'endpoint', rule: 'suspicious_decoding', confidence: 0.82 },
          ],
        },
        {
          name: 'Lateral Movement',
          technique: 'T1570 - Lateral Tool Transfer',
          mitreTactic: 'lateral-movement',
          mitreId: 'TA0008',
          duration: 40,
          detection: [
            { source: 'network', rule: 'lateral_movement', confidence: 0.88 },
            { source: 'endpoint', rule: 'credential_dumping', confidence: 0.91 },
          ],
        },
        {
          name: 'Data Collection',
          technique: 'T1005 - Data from Local System',
          mitreTactic: 'collection',
          mitreId: 'TA0009',
          duration: 50,
          detection: [
            { source: 'endpoint', rule: 'large_data_transfer', confidence: 0.89 },
            { source: 'network', rule: 'unusual_egress_traffic', confidence: 0.85 },
          ],
        },
        {
          name: 'Exfiltration',
          technique: 'T1041 - Exfiltration Over C2 Channel',
          mitreTactic: 'exfiltration',
          mitreId: 'TA0010',
          duration: 60,
          detection: [
            { source: 'network', rule: 'data_exfiltration', confidence: 0.93 },
            { source: 'network', rule: 'c2_communication', confidence: 0.9 },
          ],
        },
      ],
      difficulty: 'expert',
      estimatedDuration: 330,
      prerequisites: ['network_access', 'test_environment'],
      expectedDetections: [
        'reconnaissance',
        'phishing',
        'malware_execution',
        'persistence',
        'privilege_escalation',
        'lateral_movement',
        'data_exfiltration',
      ],
    },
    {
      id: 'insider_threat',
      name: 'Insider Threat Scenario',
      attackChain: [
        {
          name: 'Reconnaissance',
          technique: 'T1592 - Gather Victim Host Information',
          mitreTactic: 'reconnaissance',
          mitreId: 'TA0043',
          duration: 15,
          detection: [
            { source: 'endpoint', rule: 'excessive_file_access', confidence: 0.8 },
          ],
        },
        {
          name: 'Collection',
          technique: 'T1005 - Data from Local System',
          mitreTactic: 'collection',
          mitreId: 'TA0009',
          duration: 30,
          detection: [
            { source: 'endpoint', rule: 'bulk_data_transfer', confidence: 0.92 },
            { source: 'endpoint', rule: 'file_copy_activity', confidence: 0.88 },
          ],
        },
        {
          name: 'Exfiltration',
          technique: 'T1567 - Exfiltration Over Web Service',
          mitreTactic: 'exfiltration',
          mitreId: 'TA0010',
          duration: 20,
          detection: [
            { source: 'network', rule: 'cloud_upload_unusual_data', confidence: 0.9 },
          ],
        },
      ],
      difficulty: 'advanced',
      estimatedDuration: 65,
      prerequisites: ['employee_account'],
      expectedDetections: ['data_collection', 'exfiltration', 'privilege_abuse'],
    },
  ],
  reportGeneration: true,
  metricTracking: true,
  detectionValidation: true,
};

/**
 * Forensics Configuration
 */
export const FORENSICS_CONFIG: ForensicsConfig = {
  enabled: true,
  deepAnalysis: true,
  memoryForensics: true,
  diskForensics: true,
  networkForensics: true,
  timelineAnalysis: true,
  artifactCollection: true,
  evidencePreservation: true,
  chainOfCustodyTracking: true,
  reportGeneration: true,
};

/**
 * Network Analytics Configuration
 */
export const NETWORK_ANALYTICS_CONFIG: NetworkAnalyticsConfig = {
  enabled: true,
  deepPacketInspection: true,
  flowAnalysis: true,
  protocolAnalysis: true,
  trafficClassification: true,
  anomalyDetection: true,
  baselineCreation: true,
  retentionDays: 365,
  samplingRate: 0.1, // 10% sampling for large networks
};

/**
 * Check if user has MAX tier feature access
 */
export function hasMaxFeature(feature: keyof MaxTierFeatures): boolean {
  return MAX_TIER_CONFIG.features[feature] === true;
}

/**
 * Get MAX tier configuration section
 */
export function getMaxTierSection(section: string): any {
  const sections: Record<string, any> = {
    sla: MAX_TIER_CONFIG.sla,
    support: MAX_TIER_CONFIG.support,
    integrations: MAX_TIER_CONFIG.integrations,
    mlModels: MAX_TIER_CONFIG.mlModels,
    ueba: UEBA_CONFIG,
    zeroDay: ZERO_DAY_CONFIG,
    threatPredictor: THREAT_PREDICTOR_CONFIG,
    incidentAutomation: INCIDENT_AUTOMATION_CONFIG,
    purpleTeam: PURPLE_TEAM_CONFIG,
    forensics: FORENSICS_CONFIG,
    networkAnalytics: NETWORK_ANALYTICS_CONFIG,
  };

  return sections[section] || null;
}

/**
 * Verify MAX tier requirements
 */
export function isMaxTierEligible(userTier: string): boolean {
  return userTier.toLowerCase() === 'max';
}

/**
 * Get MAX tier feature list
 */
export function getAllMaxFeatures(): Array<{
  key: keyof MaxTierFeatures;
  enabled: boolean;
}> {
  return Object.entries(MAX_TIER_CONFIG.features).map(([key, enabled]) => ({
    key: key as keyof MaxTierFeatures,
    enabled: enabled as boolean,
  }));
}

/**
 * Calculate MAX tier cost for team
 */
export function calculateMaxTierCost(teamSize: number): {
  baseCost: number;
  teamCost: number;
  totalCost: number;
  costPerUser: number;
} {
  const baseCost = MAX_TIER_CONFIG.priceMonthly;
  const teamCost = 0; // Unlimited users included
  const totalCost = baseCost;
  const costPerUser = teamSize > 0 ? totalCost / teamSize : 0;

  return {
    baseCost,
    teamCost,
    totalCost,
    costPerUser,
  };
}

/**
 * Get SLA response time for severity level
 */
export function getSLAResponseTime(
  severity: 'critical' | 'high' | 'medium' | 'low'
): number {
  return MAX_TIER_CONFIG.sla.responseTime[severity];
}

/**
 * Get support channels for MAX tier
 */
export function getMaxSupportChannels(): string[] {
  return MAX_TIER_CONFIG.support.channels;
}

/**
 * Export complete MAX tier configuration as JSON
 */
export function exportMaxTierConfig(): string {
  return JSON.stringify(
    {
      config: MAX_TIER_CONFIG,
      ueba: UEBA_CONFIG,
      zeroDay: ZERO_DAY_CONFIG,
      threatPredictor: THREAT_PREDICTOR_CONFIG,
      incidentAutomation: INCIDENT_AUTOMATION_CONFIG,
      purpleTeam: PURPLE_TEAM_CONFIG,
      forensics: FORENSICS_CONFIG,
      networkAnalytics: NETWORK_ANALYTICS_CONFIG,
    },
    null,
    2
  );
}
