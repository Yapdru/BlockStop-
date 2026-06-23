/**
 * MAX Tier Type Definitions
 * ₹499/month - Enterprise-grade security with unlimited team users
 */

export interface MaxTierFeatures {
  // Core features
  unlimitedTeamUsers: boolean;
  betterBotAIAdvanced: boolean;
  whiteLabel: boolean;
  customIntegrations: boolean;

  // ML & Detection
  advancedMLThreatDetection: boolean;
  lstmModelDetection: boolean;
  cnnModelDetection: boolean;
  behavioralAnalysis: boolean;
  uebaSystem: boolean;
  zeroDayDetection: boolean;
  predictiveThreatForecasting: boolean;
  modelFineTuning: boolean;

  // Response & Automation
  incidentAutoRemediation: boolean;
  automatedResponsePlaybooks: boolean;

  // Red Team & Security
  purpleTeamExercises: boolean;
  redTeamSimulations: boolean;
  advancedForensics: boolean;

  // Network & Traffic
  deepPacketInspection: boolean;
  networkTrafficAnalysis: boolean;

  // Threat Intelligence
  customThreatIntelFeeds: boolean;
  threatFeedIntegration: boolean;

  // Support & SLA
  dedicatedAccountManager: boolean;
  prioritySupport: boolean;
  premiumSupport24x7: boolean;
  slaGuarantee99_99: boolean;

  // Analytics & Health
  customHealthChecks: boolean;
  premiumAnalytics: boolean;
  anomalyDetection: boolean;

  // Advanced features
  customMLModelTraining: boolean;
  neuralNetworkThreats: boolean;
  behavioralPatternLearning: boolean;
  predictiveIncidentDetection: boolean;
  advancedForensicAnalysis: boolean;
  premiumIntegrations: boolean;
}

export interface MaxTierConfig {
  id: number;
  name: 'max';
  tier: 'MAX';
  priceMonthly: 499;
  priceCurrency: 'INR';
  maxTeamUsers: number; // unlimited
  maxApiCallsPerMonth: number;
  maxStorageGB: number;
  features: MaxTierFeatures;
  sla: SLAConfig;
  support: SupportConfig;
  integrations: IntegrationConfig;
  mlModels: MLModelConfig;
}

export interface SLAConfig {
  uptime: 0.9999; // 99.99%
  responseTime: {
    critical: number; // in minutes
    high: number;
    medium: number;
    low: number;
  };
  monthlyStatusPageReport: boolean;
  dedicatedEngineer: boolean;
  customSLA: boolean;
}

export interface SupportConfig {
  channels: SupportChannel[];
  availability: 'business_hours' | 'extended' | '24x7';
  responseTimeMinutes: {
    critical: number;
    high: number;
    medium: number;
  };
  dedicatedAccount: boolean;
  dedicatedSlack: boolean;
  quarterlyBusinessReviews: boolean;
  customTraining: boolean;
}

export type SupportChannel = 'email' | 'chat' | 'phone' | 'video' | 'slack' | 'dedicated_engineer';

export interface IntegrationConfig {
  zapier: boolean;
  make: boolean;
  customAPIs: boolean;
  webhooks: boolean;
  maxCustomIntegrations: number;
  oauth2: boolean;
  samlSSO: boolean;
  ldap: boolean;
  customProtocols: boolean;
}

export interface MLModelConfig {
  lstm: LSTMModelConfig;
  cnn: CNNModelConfig;
  customModels: boolean;
  modelFineTuning: boolean;
  maxModelsPerOrg: number;
  trainingDataRetention: number; // in days
}

export interface LSTMModelConfig {
  enabled: boolean;
  sequenceLength: number;
  hiddenUnits: number;
  layers: number;
  dropoutRate: number;
  trainingEpochs: number;
  batchSize: number;
}

export interface CNNModelConfig {
  enabled: boolean;
  filters: number[];
  kernelSize: number;
  poolSize: number;
  dropoutRate: number;
  trainingEpochs: number;
  batchSize: number;
}

export interface UEBAConfig {
  enabled: boolean;
  baseliningPeriodDays: number;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  entityTypes: string[];
  behaviorModels: BehaviorModel[];
  anomalyScoring: boolean;
  riskScoring: boolean;
}

export interface BehaviorModel {
  name: string;
  metrics: string[];
  threshold: number;
  windowSize: number;
  alertOnDeviation: boolean;
}

export interface ZeroDayConfig {
  enabled: boolean;
  signaturesPerDay: number;
  vulnerabilityDataFeeds: number;
  exploitPrediction: boolean;
  cvssScoring: boolean;
  patchRecommendations: boolean;
  exploitAvailabilityTracking: boolean;
}

export interface ThreatPredictorConfig {
  enabled: boolean;
  forecastingWindow: number; // in days
  confidenceThreshold: number;
  modelsEnabled: ThreatPredictorModel[];
  retrainingFrequency: number; // in days
  historicalDataRetention: number; // in days
}

export type ThreatPredictorModel =
  | 'arima'
  | 'prophet'
  | 'lstm_time_series'
  | 'ensemble'
  | 'gradient_boosting'
  | 'random_forest'
  | 'neural_network';

export interface IncidentAutomationConfig {
  enabled: boolean;
  autoPlaybookExecution: boolean;
  maxConcurrentRemediations: number;
  rollbackOnFailure: boolean;
  playbooks: PlaybookConfig[];
  ticketIntegration: boolean;
  slackNotifications: boolean;
  webhookNotifications: boolean;
}

export interface PlaybookConfig {
  id: string;
  name: string;
  trigger: string;
  actions: AutomationAction[];
  rollbackActions: AutomationAction[];
  requiredApprovals: number;
  estimatedExecutionTime: number; // in seconds
}

export interface AutomationAction {
  type: 'isolate_host' | 'block_ip' | 'revoke_token' | 'alert_team' | 'create_ticket' | 'run_scan' | 'snapshot' | 'custom';
  params: Record<string, any>;
  timeout: number; // in seconds
  retryAttempts: number;
}

export interface PurpleTeamConfig {
  enabled: boolean;
  scheduleExercises: boolean;
  exerciseFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  scenarios: SecurityScenario[];
  reportGeneration: boolean;
  metricTracking: boolean;
  detectionValidation: boolean;
}

export interface SecurityScenario {
  id: string;
  name: string;
  attackChain: AttackStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number; // in minutes
  prerequisites: string[];
  expectedDetections: string[];
}

export interface AttackStep {
  name: string;
  technique: string;
  mitreTactic: string;
  mitreId: string;
  duration: number;
  detection: DetectionMethod[];
}

export interface DetectionMethod {
  source: 'endpoint' | 'network' | 'cloud' | 'custom';
  rule: string;
  confidence: number;
}

export interface ForensicsConfig {
  enabled: boolean;
  deepAnalysis: boolean;
  memoryForensics: boolean;
  diskForensics: boolean;
  networkForensics: boolean;
  timelineAnalysis: boolean;
  artifactCollection: boolean;
  evidencePreservation: boolean;
  chainOfCustodyTracking: boolean;
  reportGeneration: boolean;
}

export interface NetworkAnalyticsConfig {
  enabled: boolean;
  deepPacketInspection: boolean;
  flowAnalysis: boolean;
  protocolAnalysis: boolean;
  trafficClassification: boolean;
  anomalyDetection: boolean;
  baselineCreation: boolean;
  retentionDays: number;
  samplingRate: number;
}

export interface WhiteLabelConfig {
  enabled: boolean;
  customDomain: string;
  customLogo: string;
  customColors: ColorScheme;
  customBranding: BrandingConfig;
  removeBlockStopBranding: boolean;
  customEmails: boolean;
  customDocumentation: boolean;
  whiteLabel dashboard: boolean;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  warning: string;
  success: string;
}

export interface BrandingConfig {
  companyName: string;
  companyLogo: string;
  faviconUrl: string;
  footerText: string;
  supportEmail: string;
  supportPhone: string;
  website: string;
  customCss: string;
}

export interface MaxUserMetrics {
  teamSize: number;
  apiCallsUsed: number;
  storageUsed: number;
  modelsTraining: number;
  activeIncidents: number;
  lastBillingCycle: Date;
  nextBillingDate: Date;
  usagePercentage: {
    apiCalls: number;
    storage: number;
    teamUsers: number;
  };
}

export interface MaxTierUser {
  id: string;
  email: string;
  name: string;
  organization: string;
  tier: 'max';
  role: 'owner' | 'admin' | 'manager' | 'analyst' | 'operator';
  config: Partial<MaxTierConfig>;
  metrics: MaxUserMetrics;
  features: MaxTierFeatures;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  dedicatedAccountManager?: string;
  customIntegrations: CustomIntegration[];
  mlModels: TrainedMLModel[];
}

export interface CustomIntegration {
  id: string;
  name: string;
  type: 'zapier' | 'make' | 'webhook' | 'custom_api' | 'oauth2';
  configuration: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  lastSync: Date;
  errorLog: string[];
}

export interface TrainedMLModel {
  id: string;
  name: string;
  type: 'lstm' | 'cnn' | 'custom';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingCompleted: Date;
  lastUsed: Date;
  status: 'training' | 'active' | 'archived';
  datasetSize: number;
  hyperparameters: Record<string, any>;
}

export interface MaxTierResponse {
  success: boolean;
  tier: 'max';
  config: MaxTierConfig;
  features: MaxTierFeatures;
  message?: string;
  timestamp: Date;
}
