// PRO Phase 31.1 - Enhanced Threat Detection & Team Collaboration
// Production-grade types for advanced ML threat detection, real-time alerts, and team collaboration

// ============================================================================
// THREAT DETECTION & ML MODELS
// ============================================================================

export interface MLModelConfig {
  id: string;
  name: string;
  version: string;
  type: 'random-forest' | 'gradient-boosting' | 'neural-network' | 'ensemble';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  lastUpdated: Date;
  enabled: boolean;
}

export interface ThreatFeatures {
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  payloadSize: number;
  packetCount: number;
  duration: number;
  anomalousPatterns: string[];
  geoLocation: GeoLocation;
  asn: string;
  threatIntel: ThreatIntelligence;
  httpHeaders?: Record<string, string>;
  domainReputation?: number;
  ipReputation?: number;
}

export interface ThreatPrediction {
  threatId: string;
  features: ThreatFeatures;
  riskScore: number;
  confidenceScore: number;
  modelId: string;
  modelName: string;
  predictions: {
    malware: number;
    botnet: number;
    ddos: number;
    exploitation: number;
    reconnaissance: number;
    exfiltration: number;
  };
  featureImportance: Record<string, number>;
  explanation: RiskExplanation;
  timestamp: Date;
  correlatedThreats: string[];
}

export interface RiskExplanation {
  riskFactors: RiskFactor[];
  summary: string;
  recommendedActions: string[];
  mitigationStrategies: string[];
}

export interface RiskFactor {
  name: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: string[];
  contributionPercentage: number;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ispName: string;
}

export interface ThreatIntelligence {
  isKnownMalicious: boolean;
  knownAssets: string[];
  previousIncidents: number;
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  sources: string[];
  lastSeen: Date;
}

// ============================================================================
// REAL-TIME ALERTS & WEBHOOKS
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  conditions: AlertCondition[];
  actions: AlertAction[];
  webhooks: WebhookConfig[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  testResults?: AlertTestResult;
}

export interface AlertCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'regex' | 'in' | 'exists';
  value: string | number | boolean | string[];
  logic?: 'AND' | 'OR';
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'pagerduty' | 'teams' | 'opsgenie';
  config: Record<string, any>;
  enabled: boolean;
}

export interface WebhookConfig {
  id: string;
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api-key' | 'basic';
    value: string;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  enabled: boolean;
  testUrl?: string;
}

export interface AlertTestResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  lastTestDate: Date;
  errors: string[];
}

export interface RealTimeAlert {
  id: string;
  ruleId: string;
  threatId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  threat: ThreatPrediction;
  triggeredAt: Date;
  notificationStatus: NotificationStatus[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  escalated: boolean;
  escalationLevel: number;
  resolutionStatus: 'open' | 'investigating' | 'mitigating' | 'resolved' | 'false-positive';
}

export interface NotificationStatus {
  channel: 'webhook' | 'email' | 'slack' | 'pagerduty' | 'teams' | 'opsgenie';
  sent: boolean;
  sentAt?: Date;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'retrying';
  error?: string;
  retryCount: number;
}

// ============================================================================
// TEAM COLLABORATION
// ============================================================================

export interface TeamIncident {
  id: string;
  threatId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'mitigating' | 'resolved' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: string[];
  tags: string[];
  comments: IncidentComment[];
  attachments: IncidentAttachment[];
  relatedIncidents: string[];
  shareWith: TeamMember[];
  activityTimeline: ActivityTimelineEntry[];
}

export interface IncidentComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[];
  createdAt: Date;
  updatedAt?: Date;
  edited: boolean;
  pinned: boolean;
  reactions: Record<string, string[]>;
  replies?: IncidentComment[];
}

export interface IncidentAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'incident-manager' | 'analyst' | 'viewer';
  avatar?: string;
  notificationPreferences: NotificationPreference;
  lastActive: Date;
}

export interface NotificationPreference {
  channels: ('email' | 'slack' | 'teams' | 'in-app')[];
  frequency: 'realtime' | 'daily' | 'weekly';
  severityFilter: ('critical' | 'high' | 'medium' | 'low')[];
}

export interface ActivityTimelineEntry {
  id: string;
  type: 'comment' | 'status-change' | 'assignment' | 'escalation' | 'attachment' | 'tag-added' | 'mention';
  actorId: string;
  actorName: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// THREAT CORRELATION
// ============================================================================

export interface ThreatCorrelation {
  primaryThreatId: string;
  correlatedThreats: CorrelatedThreat[];
  correlationScore: number;
  correlationType: 'same-source' | 'same-target' | 'same-pattern' | 'same-campaign' | 'timeframe';
  lastUpdated: Date;
}

export interface CorrelatedThreat {
  threatId: string;
  correlationScore: number;
  commonFactors: string[];
  timeline: {
    first: Date;
    last: Date;
    occurrences: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  sharedAttributes: Record<string, any>;
}

export interface CorrelationAnalysis {
  totalThreats: number;
  correlationClusters: ThreatCluster[];
  threatNetwork: ThreatNetworkNode[];
  temporalPatterns: TemporalPattern[];
}

export interface ThreatCluster {
  clusterId: string;
  threatIds: string[];
  clusterSize: number;
  confidence: number;
  commonCharacteristics: string[];
  likelyAttackName?: string;
  estimatedOrigin?: string;
}

export interface ThreatNetworkNode {
  threatId: string;
  severity: string;
  connections: string[];
  connectionWeights: number[];
  centralityScore: number;
}

export interface TemporalPattern {
  pattern: string;
  frequency: string;
  occurrences: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  likelihood: number;
}

// ============================================================================
// DASHBOARD & INSIGHTS
// ============================================================================

export interface DashboardMetrics {
  totalThreats: number;
  criticalThreats: number;
  highSeverityThreats: number;
  threatsTrendingUp: boolean;
  threatsChangePercent: number;
  averageResponseTime: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  mlModelAccuracy: number;
  topThreatTypes: ThreatTypeMetric[];
  topAttackVectors: AttackVectorMetric[];
  geographicDistribution: GeographicMetric[];
  timeSeriesData: TimeSeriesPoint[];
}

export interface ThreatTypeMetric {
  type: string;
  count: number;
  percentage: number;
  trend: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AttackVectorMetric {
  vector: string;
  count: number;
  percentage: number;
  affectedSystems: string[];
  successRate: number;
}

export interface GeographicMetric {
  country: string;
  threatCount: number;
  percentage: number;
  trend: number;
  coordinates: [number, number];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  threatCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  predictionValue?: number;
}

export interface TrendPrediction {
  nextDay: number;
  nextWeek: number;
  nextMonth: number;
  confidence: number;
  predictionModel: string;
  modelAccuracy: number;
}

// ============================================================================
// ALERT RULE BUILDER
// ============================================================================

export interface RuleBuilderConfig {
  id: string;
  name: string;
  description: string;
  ruleType: 'threat-detection' | 'anomaly' | 'threshold' | 'correlation' | 'custom';
  conditions: ConditionGroup;
  actions: AlertAction[];
  webhooks: WebhookConfig[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  preview?: PreviewResult;
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (AlertCondition | ConditionGroup)[];
}

export interface PreviewResult {
  matchingThreats: number;
  sampleMatches: {
    threatId: string;
    severity: string;
    matchScore: number;
  }[];
  estimatedNotifications: number;
  estimatedFalsePositives: number;
}

// ============================================================================
// INTEGRATION HEALTH & MONITORING
// ============================================================================

export interface IntegrationHealth {
  integrationId: string;
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  type: 'webhook' | 'api' | 'siem' | 'threat-intel' | 'cloud' | 'custom';
  lastHealthCheck: Date;
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastError?: HealthError;
  metrics: IntegrationMetrics;
  configuration: Record<string, any>;
}

export interface HealthError {
  code: string;
  message: string;
  timestamp: Date;
  retryable: boolean;
  nextRetry?: Date;
}

export interface IntegrationMetrics {
  requestsPerMinute: number;
  averageLatency: number;
  errorCount24h: number;
  successRate: number;
  dataPoints24h: number;
  throughput: number;
}

export interface HealthCheckResult {
  integrationId: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  checks: {
    connectivity: HealthCheckItem;
    authentication: HealthCheckItem;
    dataFlow: HealthCheckItem;
    errorRate: HealthCheckItem;
    performance: HealthCheckItem;
  };
  overallScore: number;
}

export interface HealthCheckItem {
  status: 'pass' | 'warn' | 'fail';
  score: number;
  message: string;
  recommendation?: string;
}

// ============================================================================
// API USAGE & QUOTA MANAGEMENT
// ============================================================================

export interface APIQuota {
  accountId: string;
  tierLevel: 'pro' | 'enterprise';
  quotaLimits: {
    requestsPerDay: number;
    requestsPerMinute: number;
    threatsAnalyzedPerDay: number;
    webhooksPerHour: number;
    apiKeysAllowed: number;
  };
  usage: {
    requestsUsedToday: number;
    requestsUsedThisMinute: number;
    threatsAnalyzedToday: number;
    webhooksSentThisHour: number;
    activeApiKeys: number;
  };
  resetTime: Date;
  warningThresholds: {
    requests: number;
    threats: number;
    webhooks: number;
  };
}

export interface APIUsageAnalytics {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  requestsByMethod: Record<string, number>;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  topErrors: APIError[];
  usageByHour: UsagePoint[];
  peakHours: string[];
  quotaUtilization: number;
}

export interface APIError {
  code: string;
  message: string;
  count: number;
  percentage: number;
  lastOccurrence: Date;
}

export interface UsagePoint {
  timestamp: Date;
  requests: number;
  threatsAnalyzed: number;
  averageLatency: number;
  errorCount: number;
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface PerformanceMetrics {
  timeRange: {
    start: Date;
    end: Date;
  };
  threatDetection: {
    averageDetectionTime: number;
    p95DetectionTime: number;
    p99DetectionTime: number;
    throughput: number;
  };
  mlModel: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    truePositiveRate: number;
    inferenceTiming: {
      min: number;
      max: number;
      average: number;
    };
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkBandwidth: number;
  };
  alerting: {
    averageAlertDeliveryTime: number;
    webhookSuccessRate: number;
    emailSuccessRate: number;
    failureRate: number;
  };
  correlationEngine: {
    averageCorrelationTime: number;
    correlationsIdentified: number;
    clusteringAccuracy: number;
  };
}

export interface PerformanceTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  percentChange: number;
  trend: 'improving' | 'degrading' | 'stable';
  timeRange: string;
}

// ============================================================================
// TEAM ACTIVITY
// ============================================================================

export interface TeamActivityTimeline {
  entries: TeamActivity[];
  totalCount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  filters: ActivityFilter;
}

export interface TeamActivity {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'acknowledged' | 'escalated' | 'resolved' | 'viewed';
  resourceType: 'incident' | 'alert-rule' | 'threat' | 'integration' | 'team-member';
  resourceId: string;
  resourceName: string;
  changes?: Record<string, { before: any; after: any }>;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityFilter {
  actors?: string[];
  actions?: string[];
  resourceTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// ============================================================================
// ESCALATION WORKFLOW
// ============================================================================

export interface EscalationPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: EscalationTrigger[];
  levels: EscalationLevel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationTrigger {
  condition: 'severity' | 'response-time' | 'manual' | 'unresolved-duration';
  value: string | number;
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
}

export interface EscalationLevel {
  level: number;
  name: string;
  notifyGroups: string[];
  notifyChannels: ('email' | 'slack' | 'pagerduty' | 'teams' | 'sms')[];
  timeoutMinutes: number;
  nextLevel?: number;
}

export interface IncidentEscalation {
  incidentId: string;
  escalationPolicyId: string;
  currentLevel: number;
  escalatedAt: Date;
  escalatedBy: string;
  escalationReason: string;
  notificationsSent: NotificationRecord[];
  previousLevels: EscalationHistory[];
}

export interface NotificationRecord {
  recipient: string;
  channel: string;
  sentAt: Date;
  deliveryStatus: 'delivered' | 'failed' | 'bounced';
  readAt?: Date;
}

export interface EscalationHistory {
  level: number;
  escalatedAt: Date;
  resolvedAt?: Date;
  escalatedBy: string;
  resolutionNote?: string;
}

// ============================================================================
// EXPORT TEMPLATES
// ============================================================================

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'pdf' | 'json' | 'csv' | 'excel' | 'markdown';
  sections: ReportSection[];
  styling: StyleConfig;
  includeCharts: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export interface ReportSection {
  sectionId: string;
  title: string;
  type: 'summary' | 'threat-details' | 'timeline' | 'correlation' | 'metrics' | 'recommendations' | 'compliance';
  content: SectionContent;
  includeCharts: boolean;
  includeTables: boolean;
  pageBreak: boolean;
}

export interface SectionContent {
  templateType: string;
  variables: Record<string, any>;
  customHtml?: string;
}

export interface StyleConfig {
  theme: 'light' | 'dark' | 'corporate' | 'minimalist';
  companyLogo?: string;
  headerContent?: string;
  footerContent?: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fontFamily: string;
  fontSize: number;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: Date;
  generatedBy: string;
  incidentIds: string[];
  threatIds: string[];
  fileUrl: string;
  fileFormat: string;
  fileSize: number;
  includedSections: string[];
  expiresAt: Date;
}
