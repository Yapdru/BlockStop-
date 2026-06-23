/**
 * BlockStop MAX Tier - Complete Premium Security Platform
 * Export all MAX tier modules and engines
 */

// Configuration
export {
  MAX_TIER_CONFIG,
  UEBA_CONFIG,
  ZERO_DAY_CONFIG,
  THREAT_PREDICTOR_CONFIG,
  INCIDENT_AUTOMATION_CONFIG,
  PURPLE_TEAM_CONFIG,
  FORENSICS_CONFIG,
  NETWORK_ANALYTICS_CONFIG,
  hasMaxFeature,
  getMaxTierSection,
  isMaxTierEligible,
  getAllMaxFeatures,
  calculateMaxTierCost,
  getSLAResponseTime,
  getMaxSupportChannels,
  exportMaxTierConfig,
} from './max-tier.js';

// Types
export type {
  MaxTierFeatures,
  MaxTierConfig,
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
  MaxUserMetrics,
  MaxTierUser,
  MaxTierResponse,
} from '../max-tier.js';

// BetterBot Advanced AI
export {
  BetterBotAdvanced,
  betterBotAdvanced,
} from './betterbot-advanced.js';

export type {
  BetterBotAdvancedConfig,
  ThreatAnalysisResult,
  PatternAnalysis,
  NLPAnalysis,
  BotConversation,
  Recommendation,
} from './betterbot-advanced.js';

// ML Threat Detection
export {
  LSTMThreatDetectionModel,
  CNNThreatDetectionModel,
  HybridThreatDetector,
  hybridThreatDetector,
} from './ml-threat-detection.js';

export type {
  LSTMPrediction,
  CNNPrediction,
  HybridPrediction,
  ThreatDecision,
} from './ml-threat-detection.js';

// UEBA System
export {
  UEBAEngine,
  uebaEngine,
} from './ueba-system.js';

export type {
  EntityProfile,
  BehaviorRecord,
  AnomalyEvent,
  RiskScore,
  BehaviorInsight,
} from './ueba-system.js';

// Zero-Day Detection
export {
  ZeroDayDetectionEngine,
  zeroDayDetector,
} from './zero-day-detection.js';

export type {
  ZeroDayIndicator,
  ExploitSignature,
  VulnerabilityIntel,
  AnomalousActivity,
  MLBasedDetection,
} from './zero-day-detection.js';

// Threat Predictor
export {
  ThreatPredictor,
  threatPredictor,
} from './threat-predictor.js';

export type {
  ThreatForecast,
  ThreatPrediction,
  TimeSeriesData,
} from './threat-predictor.js';

// Incident Automation
export {
  IncidentAutomationEngine,
  incidentAutomationEngine,
} from './incident-automation.js';

export type {
  IncidentPlaybook,
  PlaybookExecution,
  ExecutionResult,
  ActionExecution,
} from './incident-automation.js';

// Purple Team
export {
  PurpleTeamEngine,
  purpleTeamEngine,
} from './purple-team.js';

export type {
  PurpleTeamExercise,
  AttackStep,
  ExerciseExecution,
  ExerciseReport,
} from './purple-team.js';

// White-Label System
export {
  WhiteLabelEngine,
  whiteLabelEngine,
} from './whitelabel-system.js';

export type {
  WhiteLabelOrganization,
  WhiteLabelConfig,
  BrandingAssets,
  CustomizationSettings,
  CustomDomainConfig,
} from './whitelabel-system.js';

// Advanced Forensics
export {
  AdvancedForensicsEngine,
  advancedForensicsEngine,
} from './forensics-advanced.js';

export type {
  ForensicInvestigation,
  ForensicEvidence,
  ForensicFinding,
  ForensicReport,
  MemoryDump,
} from './forensics-advanced.js';

// Network Analytics
export {
  NetworkAnalyticsEngine,
  networkAnalyticsEngine,
} from './network-analytics.js';

export type {
  NetworkFlow,
  TrafficClassification,
  FlowAnalysis,
  AnomalyDetectionResult,
  DPIResult,
} from './network-analytics.js';

/**
 * Initialize all MAX tier engines
 */
export async function initializeMaxTierEngines(): Promise<void> {
  try {
    // Initialize BetterBot
    await betterBotAdvanced.initialize();

    console.log('MAX tier engines initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MAX tier engines:', error);
    throw error;
  }
}

/**
 * Get all available MAX tier features
 */
export function getMaxTierFeatures() {
  return {
    ai: {
      betterbot: betterBotAdvanced,
    },
    detection: {
      ml: hybridThreatDetector,
      zeroday: zeroDayDetector,
    },
    analytics: {
      ueba: uebaEngine,
      threatPrediction: threatPredictor,
      network: networkAnalyticsEngine,
    },
    security: {
      automation: incidentAutomationEngine,
      purpleTeam: purpleTeamEngine,
      forensics: advancedForensicsEngine,
    },
    customization: {
      whitelabel: whiteLabelEngine,
    },
  };
}

/**
 * Cleanup and dispose resources
 */
export function disposeMaxTierResources(): void {
  betterBotAdvanced.dispose();
  hybridThreatDetector.dispose();
}
