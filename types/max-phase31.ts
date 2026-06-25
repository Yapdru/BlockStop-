/**
 * MAX Tier Phase 31.1 - Advanced AI & Predictive Security
 * Type definitions for threat prediction, behavioral anomaly, and ML model monitoring
 */

// ============================================================================
// THREAT PREDICTION TYPES
// ============================================================================

export interface ThreatPrediction {
  id: string;
  timestamp: Date;
  threatType: ThreatType;
  severity: SeverityLevel;
  confidence: number; // 0-100
  probability: number; // 0-100
  forecastHorizon: ForecastHorizon;
  predictedDate: Date;
  affectedAssets: string[];
  indicators: ThreatIndicator[];
  mitigationSteps: string[];
  metadata: Record<string, unknown>;
}

export enum ThreatType {
  MALWARE = 'malware',
  RANSOMWARE = 'ransomware',
  DATA_EXFILTRATION = 'data_exfiltration',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  LATERAL_MOVEMENT = 'lateral_movement',
  PERSISTENCE = 'persistence',
  EXPLOITATION = 'exploitation',
  SOCIAL_ENGINEERING = 'social_engineering',
  DDoS = 'ddos',
  INSIDER_THREAT = 'insider_threat',
  SUPPLY_CHAIN = 'supply_chain',
  ZERO_DAY = 'zero_day',
}

export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum ForecastHorizon {
  SEVEN_DAY = '7day',
  THIRTY_DAY = '30day',
  NINETY_DAY = '90day',
}

export interface ThreatIndicator {
  type: IndicatorType;
  value: string;
  source: string;
  confidence: number;
  timestamp: Date;
}

export enum IndicatorType {
  IP_ADDRESS = 'ip_address',
  DOMAIN = 'domain',
  FILE_HASH = 'file_hash',
  EMAIL = 'email',
  REGISTRY_KEY = 'registry_key',
  PROCESS_NAME = 'process_name',
  BEHAVIOR_PATTERN = 'behavior_pattern',
  VULNERABILITY_ID = 'vulnerability_id',
}

export interface PredictionModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataPoints: number;
  lastRetrained: Date;
  threatType: ThreatType;
  modelDrift: number; // 0-100, higher = more drift
}

export interface PredictionMetrics {
  totalPredictions: number;
  correctPredictions: number;
  falsePredictions: number;
  missedIncidents: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
}

// ============================================================================
// BEHAVIORAL ANOMALY TYPES
// ============================================================================

export interface BehavioralBaseline {
  id: string;
  entityId: string;
  entityType: EntityType;
  createdAt: Date;
  updatedAt: Date;
  metrics: BaselineMetrics;
  anomalyScores: AnomalyScore[];
  historicalData: HistoricalActivityData[];
}

export enum EntityType {
  USER = 'user',
  SERVICE_ACCOUNT = 'service_account',
  HOST = 'host',
  APPLICATION = 'application',
  API_KEY = 'api_key',
}

export interface BaselineMetrics {
  avgLoginTime: number; // ms
  avgLoginCountDaily: number;
  avgDataAccessPerDay: number; // GB
  avgAPICallsPerHour: number;
  normalWorkHours: { start: number; end: number }; // 24hr format
  frequentLocations: string[];
  frequentDevices: string[];
  frequentApplications: string[];
  typicalDataTypes: string[];
  normalBandwidth: number; // Mbps
  normalProcessCount: number;
  standardDeviation: Record<string, number>;
}

export interface AnomalyScore {
  timestamp: Date;
  entityId: string;
  score: number; // 0-100
  severity: SeverityLevel;
  anomalyType: AnomalyType;
  indicators: string[];
  deviationPercentage: number;
  confidence: number;
}

export enum AnomalyType {
  TIME_BASED = 'time_based',
  LOCATION_BASED = 'location_based',
  ACTIVITY_VOLUME = 'activity_volume',
  ACCESS_PATTERN = 'access_pattern',
  PRIVILEGE_CHANGE = 'privilege_change',
  DATA_EXFIL_PATTERN = 'data_exfil_pattern',
  PROCESS_ANOMALY = 'process_anomaly',
  NETWORK_ANOMALY = 'network_anomaly',
  CREDENTIAL_USAGE = 'credential_usage',
  RESOURCE_CONSUMPTION = 'resource_consumption',
}

export interface HistoricalActivityData {
  timestamp: Date;
  loginCount: number;
  dataAccessed: number; // GB
  apiCalls: number;
  location: string;
  device: string;
  applications: string[];
  bandwidth: number; // Mbps
  processCount: number;
  failedLogins: number;
  privilegeEscalations: number;
}

// ============================================================================
// THREAT INTELLIGENCE ENRICHMENT TYPES
// ============================================================================

export interface ThreatIntelligenceFeed {
  id: string;
  name: string;
  source: ThreatIntelSource;
  feedType: FeedType;
  url?: string;
  apiKey?: string;
  lastUpdated: Date;
  updateFrequency: UpdateFrequency;
  isActive: boolean;
  indicators: ThreatIndicator[];
}

export enum ThreatIntelSource {
  MISP = 'misp',
  ABUSE_CH = 'abuse_ch',
  OTXAPI = 'otxapi',
  VIRUSTOTAL = 'virustotal',
  SHODAN = 'shodan',
  CENSYS = 'censys',
  DARK_WEB_MONITOR = 'dark_web_monitor',
  INTERNAL_THREAT_DB = 'internal_threat_db',
  YARA_RULES = 'yara_rules',
  CISA_ALERTS = 'cisa_alerts',
}

export enum FeedType {
  IOCs = 'iocs',
  MALWARE_SAMPLES = 'malware_samples',
  EXPLOITS = 'exploits',
  VULNERABILITIES = 'vulnerabilities',
  THREAT_ACTORS = 'threat_actors',
  CAMPAIGNS = 'campaigns',
  LEAKED_DATA = 'leaked_data',
  DARK_WEB_MENTIONS = 'dark_web_mentions',
}

export enum UpdateFrequency {
  REALTIME = 'realtime',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface EnrichedIOC {
  indicator: string;
  type: IndicatorType;
  confidence: number;
  sources: ThreatIntelSource[];
  firstSeen: Date;
  lastSeen: Date;
  relatedIndicators: string[];
  threatActors: string[];
  campaigns: string[];
  malwareSamples: string[];
  vulnerabilities: string[];
  severity: SeverityLevel;
  tlp: TLPLevel;
  additionalData: Record<string, unknown>;
}

export enum TLPLevel {
  WHITE = 'white',
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

export interface DarkWebMentionAlert {
  id: string;
  timestamp: Date;
  source: string;
  content: string;
  mentions: string[];
  severity: SeverityLevel;
  confidence: number;
  context: string;
  relatedIndicators: string[];
}

// ============================================================================
// INCIDENT AUTOMATION V2 TYPES
// ============================================================================

export interface IncidentPlaybook {
  id: string;
  name: string;
  description: string;
  threatType: ThreatType;
  severity: SeverityLevel;
  steps: PlaybookStep[];
  triggers: PlaybookTrigger[];
  enabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  successRate: number;
}

export interface PlaybookStep {
  id: string;
  order: number;
  name: string;
  description: string;
  actionType: ActionType;
  actionConfig: Record<string, unknown>;
  requiresApproval: boolean;
  rollbackConfig?: Record<string, unknown>;
  timeout: number; // ms
  retryAttempts: number;
  conditions: StepCondition[];
}

export enum ActionType {
  ISOLATE_HOST = 'isolate_host',
  DISABLE_ACCOUNT = 'disable_account',
  KILL_PROCESS = 'kill_process',
  BLOCK_IP = 'block_ip',
  BLOCK_DOMAIN = 'block_domain',
  REVOKE_TOKEN = 'revoke_token',
  RESET_CREDENTIALS = 'reset_credentials',
  NOTIFY_TEAM = 'notify_team',
  CREATE_TICKET = 'create_ticket',
  COLLECT_FORENSICS = 'collect_forensics',
  SNAPSHOT_VM = 'snapshot_vm',
  ENABLE_MONITORING = 'enable_monitoring',
  TRIGGER_RESPONSE = 'trigger_response',
  QUARANTINE_EMAIL = 'quarantine_email',
  BLOCK_EXTERNAL_COMMS = 'block_external_comms',
}

export interface PlaybookTrigger {
  id: string;
  triggerType: TriggerType;
  condition: Record<string, unknown>;
  automationLevel: AutomationLevel;
}

export enum TriggerType {
  ALERT_DETECTED = 'alert_detected',
  THREAT_PREDICTION = 'threat_prediction',
  ANOMALY_SCORE_THRESHOLD = 'anomaly_score_threshold',
  IOC_MATCH = 'ioc_match',
  MANUAL_TRIGGER = 'manual_trigger',
  SCHEDULED = 'scheduled',
}

export enum AutomationLevel {
  FULLY_AUTOMATED = 'fully_automated',
  SEMI_AUTOMATED = 'semi_automated',
  MANUAL_APPROVAL = 'manual_approval',
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  incidentId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  steps: StepExecution[];
  actionsTaken: ActionRecord[];
  errors: ExecutionError[];
  metadata: Record<string, unknown>;
}

export interface StepExecution {
  stepId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  output: Record<string, unknown>;
  error?: string;
  approvalStatus?: ApprovalStatus;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  PAUSED = 'paused',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface ActionRecord {
  id: string;
  actionType: ActionType;
  timestamp: Date;
  status: ExecutionStatus;
  affectedResources: string[];
  result: Record<string, unknown>;
  approvedBy?: string;
  reason?: string;
}

export interface ExecutionError {
  step: string;
  error: string;
  timestamp: Date;
  recoveryAttempts: number;
}

export interface StepCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}

// ============================================================================
// BETTERBOT V2 TYPES
// ============================================================================

export interface BetterBotV2Config {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  contextWindow: number;
  temperatureRange: [number, number];
  maxTokens: number;
  tools: BotTool[];
  enabled: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  category: ToolCategory;
  enabled: boolean;
}

export enum ToolCategory {
  THREAT_INTEL = 'threat_intel',
  INCIDENT_RESPONSE = 'incident_response',
  FORENSICS = 'forensics',
  MONITORING = 'monitoring',
  REPORTING = 'reporting',
  AUTOMATION = 'automation',
  ANALYSIS = 'analysis',
}

export interface ConversationContext {
  id: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  messages: ConversationMessage[];
  entities: ContextEntity[];
  incidents: string[];
  alerts: string[];
  metadata: Record<string, unknown>;
}

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  sentiment?: SentimentScore;
  intent?: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
}

export interface ToolResult {
  toolCallId: string;
  result: Record<string, unknown>;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface ContextEntity {
  type: EntityContextType;
  value: string;
  confidence: number;
  firstMentioned: Date;
  lastMentioned: Date;
  references: number;
}

export enum EntityContextType {
  HOSTNAME = 'hostname',
  IP_ADDRESS = 'ip_address',
  USERNAME = 'username',
  DOMAIN = 'domain',
  EMAIL = 'email',
  INCIDENT_ID = 'incident_id',
  ALERT_ID = 'alert_id',
  THREAT_ACTOR = 'threat_actor',
  MALWARE_FAMILY = 'malware_family',
}

export interface SentimentScore {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}

export interface BotResponse {
  id: string;
  conversationId: string;
  timestamp: Date;
  content: string;
  confidence: number;
  sources: string[];
  suggestedActions: string[];
  followUpQuestions: string[];
  citations: Citation[];
}

export interface Citation {
  text: string;
  source: string;
  timestamp: Date;
  confidence: number;
}

// ============================================================================
// FORENSICS DASHBOARD TYPES
// ============================================================================

export interface ForensicsAnalysis {
  id: string;
  incidentId: string;
  timestamp: Date;
  status: ForensicsStatus;
  memoryAnalysis: MemoryAnalysis;
  diskAnalysis: DiskAnalysis;
  networkAnalysis: NetworkAnalysis;
  timelineEvents: TimelineEvent[];
  artifacts: Artifact[];
  summary: string;
}

export enum ForensicsStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface MemoryAnalysis {
  timestamp: Date;
  processCount: number;
  suspiciousProcesses: Process[];
  injectedDLLs: string[];
  rootkitIndicators: string[];
  pageFileSize: number;
  commitCharge: number;
  nonPagedPool: number;
  pagedPool: number;
  systemCache: number;
  anomalies: string[];
}

export interface Process {
  pid: number;
  name: string;
  parentPid: number;
  commandLine: string;
  memoryUsage: number;
  handles: number;
  isSuspicious: boolean;
  reason?: string;
  signature?: ProcessSignature;
}

export interface ProcessSignature {
  signer: string;
  isVerified: boolean;
  timestamp: Date;
  issuer: string;
}

export interface DiskAnalysis {
  timestamp: Date;
  filesAccessed: number;
  filesModified: number;
  filesDeleted: number;
  recoverableFiles: RecoverableFile[];
  unallocatedClusterAnalysis: string[];
  mbrAnalysis: MBRAnalysis;
  partitionAnalysis: PartitionAnalysis[];
  slackSpace: SlackSpaceData[];
  suspiciousFiles: SuspiciousFile[];
}

export interface RecoverableFile {
  path: string;
  size: number;
  createdTime: Date;
  modifiedTime: Date;
  accessedTime: Date;
  hashMD5: string;
  hashSHA256: string;
  recoveryProbability: number;
}

export interface MBRAnalysis {
  signature: string;
  isValid: boolean;
  bootcode: string;
  partitionTable: PartitionEntry[];
  anomalies: string[];
}

export interface PartitionEntry {
  bootIndicator: boolean;
  partitionType: string;
  startSector: number;
  endSector: number;
  sectorCount: number;
}

export interface PartitionAnalysis {
  name: string;
  fileSystem: string;
  totalSize: number;
  usedSpace: number;
  freeSpace: number;
  badSectors: number;
  fileSystemErrors: string[];
}

export interface SlackSpaceData {
  location: string;
  size: number;
  data: string;
  isRecoverable: boolean;
}

export interface SuspiciousFile {
  path: string;
  size: number;
  modifiedTime: Date;
  hashMD5: string;
  hashSHA256: string;
  reason: string;
  confidence: number;
}

export interface NetworkAnalysis {
  timestamp: Date;
  packetsAnalyzed: number;
  packetsAnomalous: number;
  connections: NetworkConnection[];
  dnsRequests: DNSRequest[];
  httpTraffic: HTTPTraffic[];
  suspiciousPayloads: Payload[];
  geoIPData: GeoIPData[];
}

export interface NetworkConnection {
  protocol: string;
  sourceIP: string;
  sourcePort: number;
  destIP: string;
  destPort: number;
  state: string;
  bytes: number;
  packets: number;
  isSuspicious: boolean;
  reason?: string;
}

export interface DNSRequest {
  timestamp: Date;
  domain: string;
  queryType: string;
  sourceIP: string;
  resolvedIP?: string;
  isMalicious: boolean;
  confidence: number;
}

export interface HTTPTraffic {
  timestamp: Date;
  method: string;
  url: string;
  statusCode: number;
  userAgent: string;
  referer?: string;
  dataTransferred: number;
  isSuspicious: boolean;
}

export interface Payload {
  timestamp: Date;
  protocol: string;
  size: number;
  hash: string;
  signature: string;
  detected: boolean;
  malwareName?: string;
}

export interface GeoIPData {
  ip: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  threatLevel: SeverityLevel;
}

export interface TimelineEvent {
  timestamp: Date;
  eventType: EventType;
  description: string;
  source: string;
  relatedAssets: string[];
  severity: SeverityLevel;
}

export enum EventType {
  FILE_CREATED = 'file_created',
  FILE_MODIFIED = 'file_modified',
  FILE_DELETED = 'file_deleted',
  PROCESS_CREATED = 'process_created',
  PROCESS_TERMINATED = 'process_terminated',
  NETWORK_CONNECTION = 'network_connection',
  DNS_QUERY = 'dns_query',
  REGISTRY_MODIFIED = 'registry_modified',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  SERVICE_STARTED = 'service_started',
  SERVICE_STOPPED = 'service_stopped',
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  data: Record<string, unknown>;
  hash: string;
  timestamp: Date;
  source: string;
}

export enum ArtifactType {
  MEMORY_DUMP = 'memory_dump',
  DISK_IMAGE = 'disk_image',
  LOG_FILE = 'log_file',
  REGISTRY_HIVE = 'registry_hive',
  NETWORK_PCAP = 'network_pcap',
  BROWSER_HISTORY = 'browser_history',
  TEMP_FILES = 'temp_files',
}

// ============================================================================
// NETWORK BEHAVIOR ANALYTICS TYPES
// ============================================================================

export interface NetworkBehaviorBaseline {
  id: string;
  assetId: string;
  assetType: AssetType;
  createdAt: Date;
  updatedAt: Date;
  metrics: NetworkMetrics;
  anomalies: NetworkAnomaly[];
  trafficPatterns: TrafficPattern[];
}

export enum AssetType {
  HOST = 'host',
  SERVER = 'server',
  NETWORK_SEGMENT = 'network_segment',
  APPLICATION = 'application',
  IOT_DEVICE = 'iot_device',
}

export interface NetworkMetrics {
  avgBandwidth: number;
  peakBandwidth: number;
  avgPacketCount: number;
  avgConnectionCount: number;
  avgProtocols: string[];
  normalPorts: number[];
  normalDestinations: string[];
  dataInOut: { in: number; out: number };
  packetLoss: number;
  latency: number;
  jitter: number;
}

export interface NetworkAnomaly {
  id: string;
  timestamp: Date;
  assetId: string;
  anomalyType: NetworkAnomalyType;
  severity: SeverityLevel;
  anomalyScore: number;
  details: Record<string, unknown>;
  confidence: number;
}

export enum NetworkAnomalyType {
  UNUSUAL_BANDWIDTH = 'unusual_bandwidth',
  UNUSUAL_PORT = 'unusual_port',
  UNUSUAL_DESTINATION = 'unusual_destination',
  PROTOCOL_ANOMALY = 'protocol_anomaly',
  UNUSUAL_TIMING = 'unusual_timing',
  DATA_EXFIL_PATTERN = 'data_exfil_pattern',
  SCANNING_ACTIVITY = 'scanning_activity',
  BOTNET_COMMUNICATION = 'botnet_communication',
  DNS_TUNNELING = 'dns_tunneling',
  SLOW_EXFIL = 'slow_exfil',
}

export interface TrafficPattern {
  id: string;
  assetId: string;
  patternType: PatternType;
  startTime: Date;
  endTime: Date;
  sourceIP: string;
  destIP: string;
  protocol: string;
  port: number;
  bandwidth: number;
  packetCount: number;
  isMalicious: boolean;
  confidence: number;
}

export enum PatternType {
  CONTINUOUS = 'continuous',
  PERIODIC = 'periodic',
  BURST = 'burst',
  RANDOM = 'random',
  SCHEDULED = 'scheduled',
}

// ============================================================================
// MODEL MONITORING TYPES
// ============================================================================

export interface MLModelMonitor {
  id: string;
  modelId: string;
  modelName: string;
  modelType: ModelType;
  version: string;
  metrics: ModelMetrics;
  driftMetrics: DriftMetrics;
  performanceHistory: PerformanceData[];
  lastUpdated: Date;
}

export enum ModelType {
  THREAT_PREDICTION = 'threat_prediction',
  ANOMALY_DETECTION = 'anomaly_detection',
  BEHAVIOR_BASELINE = 'behavior_baseline',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  ATTACK_CLASSIFICATION = 'attack_classification',
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: ConfusionMatrix;
  featureImportance: Record<string, number>;
  inferenceTime: number; // ms
  throughput: number; // predictions/sec
}

export interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export interface DriftMetrics {
  isDetected: boolean;
  driftScore: number; // 0-100
  driftType: DriftType;
  affectedFeatures: string[];
  severity: SeverityLevel;
  trend: TrendDirection;
  changePercentage: number;
  recommendation: string;
}

export enum DriftType {
  COVARIATE_SHIFT = 'covariate_shift',
  LABEL_SHIFT = 'label_shift',
  CONCEPT_DRIFT = 'concept_drift',
  GRADUAL_DRIFT = 'gradual_drift',
  SUDDEN_DRIFT = 'sudden_drift',
}

export enum TrendDirection {
  IMPROVING = 'improving',
  DEGRADING = 'degrading',
  STABLE = 'stable',
  VOLATILE = 'volatile',
}

export interface PerformanceData {
  timestamp: Date;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  sampleCount: number;
  inferenceTime: number;
}

export interface ModelRetrainEvent {
  id: string;
  modelId: string;
  reason: RetrainReason;
  timestamp: Date;
  trainingDataSize: number;
  newMetrics: ModelMetrics;
  improvementPercentage: number;
  status: RetrainStatus;
}

export enum RetrainReason {
  SCHEDULED = 'scheduled',
  DRIFT_DETECTED = 'drift_detected',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  NEW_THREAT_PATTERN = 'new_threat_pattern',
  MANUAL_TRIGGER = 'manual_trigger',
}

export enum RetrainStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ============================================================================
// THREAT ACTOR PROFILING TYPES
// ============================================================================

export interface ThreatActorProfile {
  id: string;
  actorId: string;
  name: string;
  aliases: string[];
  description: string;
  firstSeen: Date;
  lastSeen: Date;
  originCountry: string;
  motivations: Motivation[];
  sophistication: SophisticationLevel;
  knownTargets: TargetProfile[];
  tactics: TacticReference[];
  techniques: TechniqueReference[];
  malwareFamilies: MalwareFamily[];
  campaigns: Campaign[];
  relatedActors: RelatedActor[];
  threatLevel: SeverityLevel;
  confidence: number;
}

export enum Motivation {
  FINANCIAL = 'financial',
  POLITICAL = 'political',
  ESPIONAGE = 'espionage',
  HACKTIVISM = 'hacktivism',
  TERRORISM = 'terrorism',
  UNKNOWN = 'unknown',
}

export enum SophisticationLevel {
  NOVICE = 'novice',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  VERY_ADVANCED = 'very_advanced',
}

export interface TargetProfile {
  industry: string;
  region: string;
  organizationType: string;
  estimatedVictims: number;
}

export interface TacticReference {
  tacticId: string;
  tacticName: string;
  frequency: number;
  lastUsed: Date;
}

export interface TechniqueReference {
  techniqueId: string;
  techniqueName: string;
  subTechniques: string[];
  frequency: number;
  lastUsed: Date;
  associatedTools: string[];
}

export interface MalwareFamily {
  id: string;
  name: string;
  aliases: string[];
  malwareType: string;
  firstSeen: Date;
  lastSeen: Date;
  samples: number;
  capabilities: string[];
}

export interface Campaign {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  targetedIndustries: string[];
  targetedRegions: string[];
  malwareFamilies: string[];
  techniques: string[];
  knownVictims: number;
}

export interface RelatedActor {
  actorId: string;
  relationshipType: RelationshipType;
  confidence: number;
}

export enum RelationshipType {
  SAME_GROUP = 'same_group',
  SHARES_TECHNIQUES = 'shares_techniques',
  SHARES_INFRASTRUCTURE = 'shares_infrastructure',
  POTENTIAL_SPLINTER = 'potential_splinter',
  POTENTIAL_PREDECESSOR = 'potential_predecessor',
}
