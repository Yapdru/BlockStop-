/**
 * Advanced AI Types - Phase 30.4
 * Custom ML Models, Threat Simulation, Behavioral Prediction, Advanced NLP
 */

// ==================== CUSTOM ML MODELS ====================

export interface ModelTrainingConfig {
  modelId: string;
  name: string;
  type: 'threat_classification' | 'anomaly_detection' | 'pattern_recognition';
  trainingDataSize: number;
  validationSplit: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
  architecture: string;
  hyperparameters: Record<string, any>;
}

export interface ModelVersion {
  versionId: string;
  modelId: string;
  version: string;
  createdAt: Date;
  trainingTime: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  status: 'training' | 'validating' | 'deployed' | 'archived' | 'rolled_back';
  metadata: {
    trainingDataCount: number;
    validationDataCount: number;
    trainingLoss: number;
    validationLoss: number;
    threshold: number;
  };
}

export interface ModelDeployment {
  deploymentId: string;
  modelVersionId: string;
  modelId: string;
  deployedAt: Date;
  environment: 'staging' | 'production';
  canary: boolean;
  canaryPercentage?: number;
  status: 'active' | 'archived' | 'rolled_back';
  performanceMetrics: {
    avgLatency: number;
    throughput: number;
    accuracy: number;
    errorRate: number;
  };
}

export interface PredictionResult {
  modelId: string;
  modelVersion: string;
  input: Record<string, any>;
  prediction: {
    label: string;
    confidence: number;
    probabilities?: Record<string, number>;
    anomalyScore?: number;
  };
  processingTime: number;
  timestamp: Date;
}

export interface ABTestConfig {
  testId: string;
  modelAId: string;
  modelBId: string;
  splitPercentage: number; // 0-100
  metric: 'accuracy' | 'latency' | 'throughput' | 'costPerRequest';
  minSampleSize: number;
  confidenceLevel: number; // 0.95, 0.99, etc.
  duration: number; // minutes
  startTime: Date;
  endTime?: Date;
  winner?: string;
}

export interface ModelPerformanceMetric {
  timestamp: Date;
  modelId: string;
  metric: string; // 'accuracy', 'precision', 'recall', etc.
  value: number;
  threshold?: number;
  status: 'normal' | 'warning' | 'critical';
}

// ==================== THREAT SIMULATION ====================

export interface MITREATTACKTechnique {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  severity: number;
  detectability: number;
}

export interface AttackScenario {
  scenarioId: string;
  name: string;
  description: string;
  techniques: MITREATTACKTechnique[];
  kill_chain: {
    stage: string;
    techniques: string[];
    payloads: string[];
  }[];
  expectedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetEnvironment: 'windows' | 'linux' | 'macos' | 'multi';
  objectives: string[];
}

export interface SyntheticPayload {
  payloadId: string;
  name: string;
  type: 'executable' | 'script' | 'macro' | 'shellcode' | 'dll' | 'pdf' | 'docx';
  technique: string;
  signature: string;
  hashes: {
    md5: string;
    sha1: string;
    sha256: string;
  };
  detectionRate: number;
  evasionTechniques: string[];
  fileSize: number;
  createdAt: Date;
  lastUsed?: Date;
}

export interface PurpleTeamExercise {
  exerciseId: string;
  name: string;
  description: string;
  scenarioId: string;
  startTime: Date;
  endTime?: Date;
  status: 'planning' | 'running' | 'completed' | 'paused';
  targetSystems: string[];
  blueteamScore: number;
  redteamScore: number;
  events: {
    timestamp: Date;
    stage: string;
    technique: string;
    action: string;
    success: boolean;
    detected: boolean;
    responseTime?: number;
  }[];
  metrics: {
    totalAttacks: number;
    successfulAttacks: number;
    detectedAttacks: number;
    avgDetectionTime: number;
    avgResponseTime: number;
    defenseScore: number;
  };
}

export interface DefenseEffectivenessTest {
  testId: string;
  name: string;
  defense: string;
  payloads: SyntheticPayload[];
  results: {
    blocked: number;
    detected: number;
    prevented: number;
    evaded: number;
  };
  effectiveness: number;
  recommendations: string[];
  timestamp: Date;
}

export interface SimulationMetrics {
  metricsId: string;
  simulationId: string;
  timestamp: Date;
  metrics: {
    attacksGenerated: number;
    attacksSuccessful: number;
    successRate: number;
    avgTTK: number;
    avgTTD: number;
    avgTTR: number;
    detectionRate: number;
    responseRate: number;
    evasionRate: number;
  };
}

// ==================== BEHAVIORAL PREDICTION ====================

export interface UserBehaviorProfile {
  userId: string;
  username: string;
  department: string;
  role: string;
  baselineCreatedAt: Date;
  lastUpdated: Date;
  typicalLoginHours: Array<{
    hour: number;
    frequency: number;
  }>;
  typicalLoginLocations: Array<{
    location: string;
    latitude: number;
    longitude: number;
    frequency: number;
  }>;
  typicalDevices: string[];
  typicalIpAddresses: string[];
  typicalFileAccess: Array<{
    filePath: string;
    accessCount: number;
    lastAccessed: Date;
  }>;
  avgFilesAccessedPerDay: number;
  avgDataTransferPerDay: number;
  avgLoginDuration: number;
  typicalFailedLoginAttempts: number;
}

export interface EntityBehaviorProfile {
  entityId: string;
  entityType: 'system' | 'server' | 'application';
  name: string;
  typicalProcesses: string[];
  typicalNetworkConnections: Array<{
    protocol: string;
    destination: string;
    port: number;
    frequency: number;
  }>;
  typicalDiskAccess: Array<{
    path: string;
    accessType: 'read' | 'write';
    frequency: number;
  }>;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskIO: number;
  avgNetworkBandwidth: number;
}

export interface AnomalyScore {
  entityId: string;
  entityType: 'user' | 'system' | 'entity';
  timestamp: Date;
  overallAnomalyScore: number;
  behaviorAnomalyScore: number;
  densityAnomalyScore: number;
  statisticalAnomalyScore: number;
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
    timestamp: Date;
  }>;
  riskEscalation?: {
    previousScore: number;
    scoreChange: number;
    escalationReason: string;
  };
  recommendedActions: string[];
}

export interface InsiderThreatIndicator {
  indicatorId: string;
  userId: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  indicators: Array<{
    type: 'data_exfiltration' | 'privilege_escalation' | 'unauthorized_access' | 'policy_violation';
    severity: number;
    evidence: string;
    timestamp: Date;
  }>;
  behavioralChanges: Array<{
    metric: string;
    baselineValue: number;
    currentValue: number;
    changePercent: number;
    timeWindow: string;
  }>;
  investigationStatus: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'false_positive';
  investigatedBy?: string;
  findings?: string;
}

export interface MLModel {
  modelId: string;
  type: 'isolation_forest' | 'lof' | 'autoencoder' | 'statistical';
  version: string;
  trainedAt: Date;
  accuracy: number;
  parameters: Record<string, any>;
}

// ==================== ADVANCED NLP ====================

export interface TextAnalysisResult {
  textId: string;
  originalText: string;
  timestamp: Date;
  sentiment: {
    score: number;
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number;
    emotions: {
      anger: number;
      fear: number;
      joy: number;
      sadness: number;
      surprise: number;
      disgust: number;
      trust: number;
      anticipation: number;
    };
  };
  language: {
    detectedLanguage: string;
    confidence: number;
    isEnglish: boolean;
  };
  characteristics: {
    tokenCount: number;
    wordCount: number;
    sentenceCount: number;
    averageWordLength: number;
    readabilityScore: number;
    entropyScore: number;
  };
  threatAnalysis: {
    isSocialEngineering: boolean;
    socialEngineeringScore: number;
    isPhishing: boolean;
    phishingScore: number;
    isMalware: boolean;
    malwareScore: number;
    threatFlags: string[];
  };
  patterns: {
    urgencyLevel: number;
    authorityLevel: number;
    suspicionLevel: number;
    legitimacyScore: number;
  };
  entities: {
    organizations: string[];
    people: string[];
    domains: string[];
    urls: string[];
    emailAddresses: string[];
    phoneNumbers: string[];
  };
  anomalyScore: number;
  langaugeAnomalies: string[];
}

export interface SocialEngineeringIndicator {
  indicatorId: string;
  type:
    | 'urgency'
    | 'authority'
    | 'scarcity'
    | 'fear_appeal'
    | 'greed_appeal'
    | 'consensus'
    | 'liking'
    | 'reciprocity';
  description: string;
  score: number;
  examples: string[];
}

export interface SpearPhishingPattern {
  patternId: string;
  name: string;
  description: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionRegex: RegExp[];
  keywords: string[];
}

export interface EmailAnalysis extends TextAnalysisResult {
  emailId: string;
  sender: string;
  senderDomain: string;
  recipient: string;
  subject: string;
  body: string;
  headers: Record<string, string>;
  emailAnalysis: {
    isSPAMlike: boolean;
    spamScore: number;
    isPhishing: boolean;
    phishingScore: number;
    suspiciousLinks: string[];
    suspiciousAttachments: string[];
    spfPassed: boolean;
    dkimPassed: boolean;
    dmarcPassed: boolean;
  };
  personalization: {
    addressesRecipientByName: boolean;
    hasPersonalReferences: boolean;
    personalReferencesCount: number;
    personalReferencesScore: number;
  };
  senderReputation: {
    knownPhisher: boolean;
    domain Age: number;
    domainReputation: number;
    isFreeemail: boolean;
  };
}

// ==================== API REQUESTS/RESPONSES ====================

export interface AnalyzeTextRequest {
  text: string;
  analysisType?: 'full' | 'threat_only' | 'sentiment_only';
}

export interface AnalyzeEmailRequest {
  sender: string;
  subject: string;
  body: string;
  headers: Record<string, string>;
  attachments?: string[];
}

export interface TrainModelRequest {
  modelId: string;
  modelName: string;
  modelType: 'threat_classification' | 'anomaly_detection' | 'pattern_recognition';
  trainingDataSize: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
}

export interface LaunchSimulationRequest {
  scenarioName: 'ransomware_campaign' | 'apt_intrusion' | 'supply_chain' | 'insider_threat';
  targetSystems: string[];
  duration?: number; // minutes
}

export interface DetectAnomaliesRequest {
  userId?: string;
  entityId?: string;
  currentBehavior: Record<string, any>;
}

export interface AnalyzeTextResponse {
  success: boolean;
  data?: TextAnalysisResult;
  error?: string;
}

export interface AnalyzeEmailResponse {
  success: boolean;
  data?: EmailAnalysis;
  error?: string;
}

export interface TrainModelResponse {
  success: boolean;
  data?: ModelVersion;
  error?: string;
}

export interface LaunchSimulationResponse {
  success: boolean;
  data?: PurpleTeamExercise;
  error?: string;
}

export interface DetectAnomaliesResponse {
  success: boolean;
  data?: AnomalyScore;
  error?: string;
}

// ==================== DASHBOARD TYPES ====================

export interface AISystemStatus {
  systemHealth: number; // 0-100
  modelsTraining: number;
  modelsDeployed: number;
  lastUpdate: Date;
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

export interface AIMetricsSummary {
  modelAccuracy: number;
  detectionRate: number;
  responseTime: number;
  threatLevel: number;
  systemUptime: number;
}

export interface AIConfigOptions {
  enableCustomModels: boolean;
  enableThreatSimulation: boolean;
  enableBehavioralPrediction: boolean;
  enableAdvancedNLP: boolean;
  autoTrainModels: boolean;
  autoDeployModels: boolean;
  canaryDeploymentPercentage: number;
  alertThreshold: number;
  dataRetentionDays: number;
}
