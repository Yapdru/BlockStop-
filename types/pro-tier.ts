/**
 * PRO Tier Type Definitions
 * Complete type system for BlockStop PRO tier (₹299/month)
 */

// ============ FEATURE ENUMS & CONSTANTS ============

export enum ProFeature {
  TEAM_COLLABORATION = 'teamCollaboration',
  ADVANCED_ANALYTICS = 'advancedAnalytics',
  CUSTOM_RULES = 'customRules',
  WEBHOOK_INTEGRATIONS = 'webhookIntegrations',
  API_ACCESS = 'apiAccess',
  PRIORITY_SUPPORT = 'prioritySupport',
  ADVANCED_INCIDENTS = 'advancedIncidentManagement',
  COMPLIANCE_REPORTS = 'complianceReports',
  VPN_INTEGRATION = 'vpnIntegration',
  WIFI_SECURITY = 'wifiSecurityChecker',
  VIRUSTOTAL_SCAN = 'virusTotalScan',
  THREAT_HUNTING = 'threatHunting',
  CUSTOM_DASHBOARDS = 'customDashboards',
  BULK_OPERATIONS = 'bulkOperations',
  MULTI_FORMAT_EXPORT = 'multiFormatExport',
}

export enum ProRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  HTML = 'html',
}

export enum WebhookIntegration {
  SLACK = 'slack',
  TEAMS = 'teams',
  JIRA = 'jira',
  SERVICENOW = 'servicenow',
}

// ============ QUOTAS & LIMITS ============

export interface ProTierQuotas {
  // API quotas
  apiCallsPerMonth: number; // 100,000
  concurrentAPIRequests: number; // 100
  apiRateLimit: number; // 1000 req/min
  apiKeyLimit: number; // 10

  // Dashboard quotas
  maxCustomDashboards: number; // 5
  widgetsPerDashboard: number; // 50

  // Rule quotas
  maxCustomRules: number; // 100
  maxConcurrentRules: number; // 50

  // Integration quotas
  maxWebhooks: number; // 10
  webhookRetryAttempts: number; // 5

  // Bulk operation quotas
  maxFilesPerBulkScan: number; // 1000
  maxConcurrentBulkScans: number; // 5
  bulkScanTimeout: number; // 3600000 (ms)

  // Export quotas
  maxExportsPerMonth: number; // 100
  maxExportSize: number; // 1000 (MB)

  // Threat hunting quotas
  maxThreatHuntingWorkspaces: number; // 5
  maxHuntingSessions: number; // 10

  // Storage
  storageLimitGB: number; // 100
}

export interface ProTierLimits {
  maxTeamMembers: number; // 6
  maxTeams: number; // 1 per subscription
  sessionTimeout: number; // 24 hours
  webhookTimeout: number; // 30 seconds
  reportGenerationTimeout: number; // 300 seconds
}

// ============ DASHBOARD & VISUALIZATION ============

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'timeline' | 'map' | 'custom';
  title: string;
  description?: string;
  config: {
    query?: string;
    filters?: Record<string, any>;
    refreshInterval?: number; // seconds
    visualization?: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomDashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'free' | 'auto';
  theme?: 'light' | 'dark' | 'custom';
  isPublic: boolean;
  shares?: DashboardShare[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardShare {
  userId: string;
  accessLevel: 'view' | 'edit' | 'admin';
  sharedAt: Date;
}

// ============ CUSTOM RULES ============

export interface YARARule {
  id: string;
  name: string;
  author: string;
  description: string;
  source: string;
  tags: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  validFrom: Date;
  validUntil?: Date;
  deploymentStatus: DeploymentStatus;
  testResults?: RuleTestResult[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SigmaRule {
  id: string;
  title: string;
  description: string;
  logsource: {
    product?: string;
    service?: string;
    category?: string;
  };
  detection: Record<string, any>;
  falsepositives?: string[];
  level: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  enabled: boolean;
  tags: string[];
  references?: string[];
  author: string;
  deploymentStatus: DeploymentStatus;
  testResults?: RuleTestResult[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performanceScore?: number;
  estimatedImpact?: 'minimal' | 'low' | 'medium' | 'high';
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ValidationWarning {
  line: number;
  message: string;
  severity: 'minor' | 'moderate';
}

export interface RuleTestResult {
  testName: string;
  passed: boolean;
  timestamp: Date;
  executionTime: number;
  matchCount?: number;
  falsePositiveRate?: number;
}

export interface RuleDeployment {
  id: string;
  ruleId: string;
  ruleType: 'yara' | 'sigma';
  deploymentDate: Date;
  targetSystems: string[];
  status: DeploymentStatus;
  deployedBy: string;
  rollbackAvailable: boolean;
  metrics?: DeploymentMetrics;
}

export enum DeploymentStatus {
  DRAFT = 'draft',
  VALIDATION = 'validation',
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled',
  DEPRECATED = 'deprecated',
}

export interface DeploymentMetrics {
  matchCount: number;
  falsePositiveCount: number;
  averageExecutionTime: number;
  systemsDeployed: number;
  lastUpdate: Date;
}

// ============ THREAT HUNTING ============

export interface ThreatHuntingWorkspace {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'closed';
  owner: string;
  members: WorkspaceMember[];
  queries: HuntQuery[];
  findings: ThreatFinding[];
  timeline: WorkspaceEvent[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: ProRole;
  joinedAt: Date;
  lastActive?: Date;
}

export interface HuntQuery {
  id: string;
  name: string;
  description?: string;
  queryType: 'kql' | 'sql' | 'eql' | 'yara' | 'sigma';
  query: string;
  targets: string[];
  isTemplate: boolean;
  status: 'draft' | 'saved' | 'executing' | 'completed' | 'failed';
  results?: QueryResult[];
  executedAt?: Date;
  executionTime?: number;
}

export interface QueryResult {
  id: string;
  eventId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  data: Record<string, any>;
  timestamp: Date;
}

export interface ThreatFinding {
  id: string;
  huntQueryId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
  affectedSystems: string[];
  evidence: string[];
  recommendations: string[];
  relatedIncidents?: string[];
  discoveredAt: Date;
  resolvedAt?: Date;
}

export interface WorkspaceEvent {
  id: string;
  type: 'query_created' | 'finding_added' | 'member_joined' | 'status_changed' | 'comment_added';
  actor: string;
  description: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ============ INCIDENT MANAGEMENT (PRO) ============

export interface ProIncidentManagement {
  labelsEnabled: boolean;
  maxLabels: number;
  assignmentEnabled: boolean;
  timelineEnabled: boolean;
  escalationRulesEnabled: boolean;
  automationEnabled: boolean;
}

export interface IncidentLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
}

export interface IncidentAssignment {
  incidentId: string;
  assignedTo: string;
  assignedBy: string;
  role: ProRole;
  assignedAt: Date;
}

export interface IncidentTimeline {
  incidentId: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: string;
  actor: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IncidentEscalation {
  id: string;
  incidentId: string;
  fromLevel: 'low' | 'medium' | 'high' | 'critical';
  toLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  escalatedBy: string;
  escalatedAt: Date;
  notifiedUsers: string[];
}

// ============ COMPLIANCE & REPORTING ============

export interface ComplianceFramework {
  framework: 'gdpr' | 'hipaa' | 'soc2' | 'iso27001' | 'pci-dss' | 'ccpa';
  status: 'compliant' | 'partial' | 'non_compliant' | 'unknown';
  score: number;
  lastAssessed: Date;
  nextAssessment: Date;
  findings: ComplianceFinding[];
}

export interface ComplianceFinding {
  id: string;
  control: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  description: string;
  remediation?: string;
  evidence?: string[];
  dueDate?: Date;
}

export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework['framework'];
  generatedAt: Date;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    overallScore: number;
    compliantControls: number;
    nonCompliantControls: number;
    partialControls: number;
  };
  frameworks: ComplianceFramework[];
  recommendations: string[];
  exportFormat?: ExportFormat;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

// ============ EXPORTS & BULK OPERATIONS ============

export interface ExportJob {
  id: string;
  userId: string;
  type: 'scan_results' | 'incidents' | 'threats' | 'compliance' | 'analytics' | 'custom';
  format: ExportFormat;
  filters?: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  error?: string;
  metadata: {
    rowCount?: number;
    fileSize?: number;
    compressionRatio?: number;
  };
}

export interface BulkScanJob {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'queued' | 'scanning' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalFiles: number;
  filesProcessed: number;
  filesFailed: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  results?: BulkScanResult[];
  errorSummary?: string;
}

export interface BulkScanResult {
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  scanStatus: 'clean' | 'infected' | 'quarantined' | 'error';
  threats: {
    count: number;
    criticalCount: number;
    highCount: number;
  };
  scanTime: number;
  scanEngine: string;
  hash: string;
  metadata?: Record<string, any>;
}

export interface BulkOperation {
  id: string;
  userId: string;
  operationType: 'scan' | 'rule_deploy' | 'export' | 'remediate' | 'custom';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  results?: BulkOperationResult[];
}

export interface BulkOperationResult {
  itemId: string;
  itemName: string;
  status: 'success' | 'failed' | 'partial';
  error?: string;
  metadata?: Record<string, any>;
}

// ============ API & WEBHOOKS (PRO) ============

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  description?: string;
  key: string;
  secret: string;
  permissions: APIPermission[];
  rateLimit: number; // per minute
  rotationDate?: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum APIPermission {
  READ_SCANS = 'read:scans',
  READ_INCIDENTS = 'read:incidents',
  READ_THREATS = 'read:threats',
  READ_ANALYTICS = 'read:analytics',
  WRITE_INCIDENTS = 'write:incidents',
  WRITE_RULES = 'write:rules',
  MANAGE_WEBHOOKS = 'manage:webhooks',
  MANAGE_TEAM = 'manage:team',
  ADMIN = 'admin',
}

export interface WebhookTemplate {
  id: string;
  platform: WebhookIntegration;
  name: string;
  description?: string;
  payloadTemplate: Record<string, any>;
  eventFilters: Record<string, any>;
  transformationRules?: TransformationRule[];
  retryPolicy?: RetryPolicy;
  customHeaders?: Record<string, string>;
}

export interface TransformationRule {
  id: string;
  sourceField: string;
  targetField: string;
  transformer: string; // e.g., "uppercase", "extract_domain", "calculate_risk_score"
  condition?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

// ============ VPN & NETWORK SECURITY ============

export interface VPNProvider {
  id: string;
  name: string;
  country: string;
  protocol: string[];
  encryptionLevel: 'standard' | 'strong' | 'military-grade';
  loggingPolicy: 'no-logs' | 'minimal' | 'full';
  jurisdiction: string;
  serverCount: number;
  speed: 'slow' | 'medium' | 'fast' | 'very-fast';
  reliabilityScore: number;
  privacyScore: number;
  costPerMonth?: number;
  freeOption: boolean;
  features: string[];
  rating: number;
  reviewCount: number;
}

export interface VPNHealthStatus {
  providerId: string;
  uptime: number;
  averageLatency: number;
  connectionSuccessRate: number;
  lastHealthCheck: Date;
  status: 'operational' | 'degraded' | 'down';
  incidents?: string[];
}

export interface WiFiSecurityReport {
  id: string;
  networkName: string;
  bssid: string;
  securityStatus: 'secure' | 'warning' | 'critical';
  vulnerabilities: WiFiVulnerability[];
  recommendations: string[];
  encryptionType: string;
  encryptionStrength: number;
  scanTime: Date;
}

export interface WiFiVulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
}

// ============ TEAM MANAGEMENT (PRO) ============

export interface ProTeam {
  id: string;
  name: string;
  description?: string;
  owner: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  quotaUsage: QuotaUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  email: string;
  role: ProRole;
  joinedAt: Date;
  permissions: TeamPermission[];
  lastActive?: Date;
}

export interface TeamPermission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  granted: boolean;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: ProRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  acceptedAt?: Date;
}

export interface QuotaUsage {
  dashboardsUsed: number;
  rulesUsed: number;
  webhooksUsed: number;
  storageUsedGB: number;
  apiCallsThisMonth: number;
  exportsThisMonth: number;
}

// ============ AUDIT & COMPLIANCE LOGGING ============

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Record<string, { old: any; new: any }>;
  status: 'success' | 'failure';
  error?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// ============ ANALYTICS (PRO) ============

export interface TrendAnalysis {
  metric: string;
  period: DateRange;
  dataPoints: TrendDataPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number;
  forecast?: ForecastData[];
  anomalies: AnomalyDetection[];
}

export interface DateRange {
  start: Date;
  end: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface ForecastData {
  timestamp: Date;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface AnomalyDetection {
  timestamp: Date;
  value: number;
  baseline: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

// ============ INTEGRATION STATUS & HEALTH ============

export interface IntegrationHealth {
  integrationId: string;
  platform: WebhookIntegration;
  status: 'healthy' | 'degraded' | 'error' | 'offline';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  metrics: IntegrationMetrics;
}

export interface IntegrationMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorCount24h: number;
  uptime: number;
  dataTransferred: number;
}

// ============ VirusTotal Integration ============

export interface VirusTotalScanResult {
  fileId: string;
  fileName: string;
  hash: string;
  scanDate: Date;
  lastAnalysisStats: {
    malicious: number;
    suspicious: number;
    undetected: number;
    harmless: number;
  };
  engines: EngineDetection[];
  reputationScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  detectionHistory?: VirusTotalDetectionHistory[];
}

export interface EngineDetection {
  engine: string;
  category: string;
  detected: boolean;
  result?: string;
}

export interface VirusTotalDetectionHistory {
  date: Date;
  positives: number;
  total: number;
}
