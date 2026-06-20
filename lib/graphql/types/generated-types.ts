/**
 * Generated TypeScript types from GraphQL schema
 * This file is auto-generated and should be regenerated when the schema changes
 */

export enum ThreatType {
  PHISHING = 'PHISHING',
  MALWARE = 'MALWARE',
  RANSOMWARE = 'RANSOMWARE',
  BEC = 'BEC',
  SPAM = 'SPAM',
  DLP_VIOLATION = 'DLP_VIOLATION',
  IMPERSONATION = 'IMPERSONATION',
  ATTACHMENT_THREAT = 'ATTACHMENT_THREAT',
  CREDENTIAL_THEFT = 'CREDENTIAL_THEFT',
  ZERO_DAY = 'ZERO_DAY',
  ADVANCED_THREAT = 'ADVANCED_THREAT',
  UNKNOWN = 'UNKNOWN',
}

export enum ThreatSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum ThreatStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  REMEDIATED = 'REMEDIATED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  ARCHIVED = 'ARCHIVED',
  QUARANTINED = 'QUARANTINED',
}

export enum ScanType {
  EMAIL = 'EMAIL',
  FILE = 'FILE',
  URL = 'URL',
  ENDPOINT = 'ENDPOINT',
  NETWORK = 'NETWORK',
}

export enum ScanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum IntegrationStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  TESTING = 'TESTING',
  PENDING_AUTH = 'PENDING_AUTH',
}

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
  DEVELOPER = 'DEVELOPER',
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED',
  SUSPENDED = 'SUSPENDED',
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Interface definitions
export interface ThreatAnalysis {
  spamScore?: number;
  phishingScore?: number;
  malwareScore?: number;
  urlScore?: number;
  attachmentScore?: number;
  dkimValid?: boolean;
  spfValid?: boolean;
  dmarcValid?: boolean;
  senderReputation?: number;
}

export interface Indicator {
  id: string;
  type: string;
  value: string;
  confidence: number;
  source?: string;
  lastSeen?: Date;
}

export interface ThreatAction {
  id: string;
  type: string;
  status: string;
  timestamp: Date;
  details?: Record<string, any>;
  performedBy?: string;
}

export interface Threat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  status: ThreatStatus;
  source: string;
  subject?: string;
  senderEmail?: string;
  recipientEmail?: string;
  indicators: Indicator[];
  timestamp: Date;
  detectedAt: Date;
  analysis: ThreatAnalysis;
  actions: ThreatAction[];
  metadata?: Record<string, any>;
  tags?: string[];
  organizationId: string;
  riskScore: number;
  mitigationStatus?: string;
}

export interface ScanResult {
  id: string;
  threatLevel: string;
  riskScore: number;
  threatsFound: number;
  details?: Record<string, any>;
}

export interface Scan {
  id: string;
  type: ScanType;
  target: string;
  status: ScanStatus;
  result?: ScanResult;
  threats: Threat[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  organizationId: string;
  initiatedBy: string;
  priority?: string;
  metadata?: Record<string, any>;
}

export interface Webhook {
  id: string;
  url: string;
  eventTypes: string[];
  status: WebhookStatus;
  lastTriggeredAt?: Date;
  lastError?: string;
  failureCount: number;
  successCount: number;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  status: string;
  deliveryAttempts: number;
  timestamp: Date;
  nextRetryAt?: Date;
  lastError?: string;
  payload?: Record<string, any>;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  category: string;
  status: IntegrationStatus;
  enabled: boolean;
  config: Record<string, any>;
  testable: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastHealthCheck?: Date;
  version?: string;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  category: string;
  requiredFields: TemplateField[];
  documentation?: string;
  authType: string;
  supportedEvents?: string[];
}

export interface TemplateField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  tier: string;
  seats: number;
  usedSeats: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
  status: string;
  apiKeysCount: number;
  webhooksCount: number;
}

export interface Team {
  id: string;
  name: string;
  orgId: string;
  members: TeamMember[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: Role;
  joinedAt: Date;
  lastActive?: Date;
}

export interface APIKey {
  id: string;
  name: string;
  scopes: string[];
  active: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  keyPrefix: string;
}

export interface UsageMetrics {
  period: string;
  apiKeyId: string;
  organizationId: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  byEndpoint: EndpointMetrics[];
}

export interface EndpointMetrics {
  path: string;
  method: string;
  count: number;
  avgLatencyMs: number;
  errorRate: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
}

export interface AlertMetrics {
  period: string;
  organizationId: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalCount: number;
  remediatedCount: number;
}

export interface Alert {
  id: string;
  organizationId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  threat?: Threat;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  metadata?: Record<string, any>;
}

export interface Settings {
  id: string;
  organizationId: string;
  autoRemediation: boolean;
  notificationThreshold: number;
  retentionDays: number;
  customRules?: Record<string, any>;
  updatedAt: Date;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface ThreatConnection {
  edges: ThreatEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface ThreatEdge {
  node: Threat;
  cursor: string;
}

export interface ScanConnection {
  edges: ScanEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface ScanEdge {
  node: Scan;
  cursor: string;
}

export interface WebhookConnection {
  edges: WebhookEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface WebhookEdge {
  node: Webhook;
  cursor: string;
}

export interface IntegrationConnection {
  edges: IntegrationEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface IntegrationEdge {
  node: Integration;
  cursor: string;
}

export interface TeamConnection {
  edges: TeamEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface TeamEdge {
  node: Team;
  cursor: string;
}

export interface APIKeyConnection {
  edges: APIKeyEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface APIKeyEdge {
  node: APIKey;
  cursor: string;
}

export interface AlertConnection {
  edges: AlertEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface AlertEdge {
  node: Alert;
  cursor: string;
}

// Input types
export interface PaginationInput {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface ThreatFilterInput {
  severity?: ThreatSeverity[];
  status?: ThreatStatus[];
  type?: ThreatType[];
  source?: string;
  dateRange?: DateRangeInput;
  searchTerm?: string;
}

export interface DateRangeInput {
  startDate: Date;
  endDate: Date;
}

export interface ScanFilterInput {
  status?: ScanStatus[];
  type?: ScanType[];
  dateRange?: DateRangeInput;
}

export interface CreateScanInput {
  type: ScanType;
  target: string;
  priority?: string;
  metadata?: Record<string, any>;
}

export interface UpdateThreatInput {
  id: string;
  status?: ThreatStatus;
  severity?: ThreatSeverity;
  notes?: string;
  tags?: string[];
}

export interface CreateWebhookInput {
  url: string;
  eventTypes: string[];
  active?: boolean;
  secret?: string;
}

export interface UpdateWebhookInput {
  id: string;
  url?: string;
  eventTypes?: string[];
  active?: boolean;
}

export interface IntegrationConfigInput {
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  customFields?: Record<string, any>;
}

export interface ConnectIntegrationInput {
  integrationId: string;
  config: IntegrationConfigInput;
}

export interface CreateOrganizationInput {
  name: string;
  email: string;
  tier: string;
}

export interface UpdateSettingsInput {
  autoRemediation?: boolean;
  notificationThreshold?: number;
  retentionDays?: number;
  customRules?: Record<string, any>;
}

// Result types
export interface OperationResult {
  success: boolean;
  message?: string;
  data?: Record<string, any>;
}

export interface ScanStartResult {
  scanId: string;
  status: ScanStatus;
  createdAt: Date;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  payload?: Record<string, any>;
  error?: string;
}

export interface BatchResult {
  requestId: string;
  status: number;
  body: Record<string, any>;
  error?: string;
}
