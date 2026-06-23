/**
 * BlockStop OFFICE Tier Type Definitions
 * Professional and enterprise features for mid-to-large organizations
 */

// Core OFFICE tier types
export type OfficeTierRole = 'director' | 'manager' | 'analyst' | 'viewer';
export type OfficeLocation = 'primary' | 'secondary' | 'regional';
export type ComplianceFramework = 'HIPAA' | 'SOC2' | 'ISO27001' | 'GDPR';
export type ReportingLevel = 'executive' | 'operational' | 'tactical' | 'strategic';

// Compliance Dashboard
export interface OfficeComplianceDashboard {
  id: string;
  organizationId: string;
  frameworks: ComplianceFrameworkStatus[];
  overallScore: number;
  auditTrail: AuditLogEntry[];
  criticalAlerts: ComplianceAlert[];
  upcomingAudits: ScheduledAudit[];
  lastUpdated: Date;
}

export interface ComplianceFrameworkStatus {
  framework: ComplianceFramework;
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'remediation';
  score: number;
  controlsPassed: number;
  controlsFailed: number;
  controlsPending: number;
  lastAssessmentDate: Date;
  nextAssessmentDate: Date;
  evidence: ComplianceEvidence[];
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'log' | 'scan' | 'assessment' | 'policy';
  title: string;
  description: string;
  url?: string;
  uploadedAt: Date;
  expiresAt?: Date;
  verified: boolean;
  verifiedBy?: string;
}

export interface ComplianceAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  framework: ComplianceFramework;
  title: string;
  description: string;
  recommendedAction: string;
  dueDate?: Date;
  resolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ScheduledAudit {
  id: string;
  framework: ComplianceFramework;
  scheduledDate: Date;
  auditorName?: string;
  scope: string[];
  estimatedDuration: number; // hours
  status: 'scheduled' | 'in_progress' | 'completed';
}

// Professional Reporting
export interface ProfessionalReport {
  id: string;
  type: 'executive_summary' | 'board_report' | 'compliance_report' | 'incident_report' | 'sla_report' | 'threat_intelligence';
  title: string;
  organizationId: string;
  generatedBy: string;
  generatedAt: Date;
  period: DateRange;
  sections: ReportSection[];
  metadata: ReportMetadata;
  distribution: ReportDistribution[];
}

export interface ReportSection {
  id: string;
  title: string;
  level: ReportingLevel;
  content: string;
  charts?: ReportChart[];
  keyMetrics: ReportMetric[];
  recommendations: string[];
}

export interface ReportChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'heatmap';
  title: string;
  data: any;
  description?: string;
}

export interface ReportMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  benchmark?: string | number;
}

export interface ReportMetadata {
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  distribution: string[];
  version: string;
  reviewedBy?: string;
  approvedBy?: string;
}

export interface ReportDistribution {
  id: string;
  recipientEmail: string;
  sentAt: Date;
  openedAt?: Date;
  downloadedAt?: Date;
  status: 'pending' | 'sent' | 'opened' | 'downloaded';
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Healthcare-Specific Features
export interface HealthcareComplianceConfig {
  organizationId: string;
  hipaaEnabled: boolean;
  hitrustEnabled: boolean;
  nistEnabled: boolean;
  breachNotificationEnabled: boolean;
  patientDataEncryption: PatientDataEncryption;
  accessControls: PatientAccessControl[];
  auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface PatientDataEncryption {
  algorithm: string;
  keyRotationInterval: number; // days
  lastKeyRotation: Date;
  tokenization: boolean;
}

export interface PatientAccessControl {
  id: string;
  role: string;
  permissions: PatientPermission[];
  dataClassifications: DataClassification[];
}

export enum DataClassification {
  PII = 'PII', // Personally Identifiable Information
  PHI = 'PHI', // Protected Health Information
  PSI = 'PSI', // Payment System Information
  GENETIC = 'GENETIC',
  BIOMETRIC = 'BIOMETRIC',
}

export type PatientPermission = 'read' | 'write' | 'delete' | 'export' | 'share' | 'audit';

export interface HIPAABreachNotification {
  id: string;
  breachDate: Date;
  discoveredDate: Date;
  affectedIndividuals: number;
  affectedRecords: string[];
  breachType: string;
  notificationsSent: boolean;
  notificationDate?: Date;
  regulatoryNotified: boolean;
  mediaNotificationRequired: boolean;
  investigationStatus: 'pending' | 'in_progress' | 'completed';
  remedialActions: string[];
}

export interface BusinessAssociateAgreement {
  id: string;
  associateName: string;
  effectiveDate: Date;
  expiryDate?: Date;
  dataTypes: DataClassification[];
  securityRequirements: string[];
  breachResponsibilities: string[];
  auditRights: boolean;
  subProcessorsAllowed: boolean;
  signedDate: Date;
  status: 'draft' | 'signed' | 'active' | 'expired';
}

// Office 365 Integration
export interface Office365Integration {
  id: string;
  organizationId: string;
  enabled: boolean;
  tenantId: string;
  clientId: string;
  syncEnabled: boolean;
  lastSyncDate?: Date;
  services: Office365Service[];
  dataSyncConfig: Office365DataSync;
}

export interface Office365Service {
  name: 'outlook' | 'teams' | 'sharepoint' | 'onedrive' | 'azure_ad';
  enabled: boolean;
  syncInterval: number; // minutes
  threatsDetected: number;
  lastSync?: Date;
}

export interface Office365DataSync {
  emailScan: boolean;
  teamsMessageScan: boolean;
  filescan: boolean;
  userSync: boolean;
  groupSync: boolean;
  encryptionRequired: boolean;
}

// DLP (Data Loss Prevention)
export interface DLPPolicy {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: DLPCondition[];
  actions: DLPAction[];
  scope: DLPScope;
  createdAt: Date;
  lastModified: Date;
}

export interface DLPCondition {
  type: 'content' | 'metadata' | 'recipient' | 'application';
  operator: 'equals' | 'contains' | 'matches_pattern' | 'is_greater_than';
  value: string | string[];
}

export interface DLPAction {
  type: 'block' | 'audit' | 'alert' | 'encrypt' | 'quarantine' | 'notify';
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationRecipient?: string;
  blockMessage?: string;
}

export interface DLPScope {
  channels: ('email' | 'teams' | 'sharepoint' | 'onedrive' | 'cloud_storage')[];
  departments?: string[];
  users?: string[];
  dataClassifications: DataClassification[];
}

export interface DLPViolation {
  id: string;
  policyId: string;
  triggeredAt: Date;
  violationType: 'attempted' | 'detected' | 'prevented';
  actor: string;
  targetRecipient?: string;
  contentSummary: string;
  action: DLPAction;
  status: 'open' | 'resolved' | 'approved';
}

// SLA Tracking
export interface SLAConfiguration {
  id: string;
  organizationId: string;
  incidentResponseTime: number; // minutes
  detectionTime: number; // minutes
  containmentTime: number; // hours
  remediationTime: number; // hours
  reportingDeadline: number; // hours
  monthlyAvailability: number; // percentage
  targetCriticalUptime: number; // percentage
}

export interface SLAMetrics {
  id: string;
  organizationId: string;
  month: Date;
  incidentsDetected: number;
  averageDetectionTime: number;
  averageContainmentTime: number;
  averageRemediationTime: number;
  metricsExceeded: number;
  slaCompliance: number; // percentage
  availabilityPercentage: number;
  criticalUptime: number; // percentage
  reportingOnTime: number; // percentage
}

export interface SLAIncidentTrack {
  id: string;
  incidentId: string;
  slaConfigId: string;
  createdAt: Date;
  detectedAt: Date;
  containedAt?: Date;
  remediatedAt?: Date;
  reportedAt?: Date;
  detectionTimeMet: boolean;
  containmentTimeMet: boolean;
  remediationTimeMet: boolean;
  reportingTimeMet: boolean;
}

// Incident Templates
export interface IncidentTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: IncidentCategory;
  description: string;
  severity: IncidentSeverity;
  steps: IncidentStep[];
  roles: RoleAssignment[];
  communicationPlan: CommunicationPlan;
  documentation: IncidentDocumentation;
  post_incident: PostIncidentConfig;
}

export type IncidentCategory =
  | 'malware'
  | 'data_breach'
  | 'ransomware'
  | 'phishing'
  | 'unauthorized_access'
  | 'compliance_violation'
  | 'system_outage';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IncidentStep {
  order: number;
  action: string;
  responsibility: OfficeTierRole[];
  estimatedTime: number; // minutes
  checklist: string[];
  documentation: string;
  escalationPath?: string;
}

export interface RoleAssignment {
  role: OfficeTierRole;
  responsibilities: string[];
  authority: string;
  escalationRules: string[];
}

export interface CommunicationPlan {
  internalNotification: boolean;
  externalNotification: boolean;
  stakeholders: string[];
  notificationTemplate: string;
  escalationContacts: EscalationContact[];
}

export interface EscalationContact {
  name: string;
  title: string;
  email: string;
  phone?: string;
  triggers: string[];
}

export interface IncidentDocumentation {
  initialReport: DocumentTemplate;
  progressReports: DocumentTemplate[];
  closureReport: DocumentTemplate;
  postIncidentReview: DocumentTemplate;
}

export interface DocumentTemplate {
  name: string;
  sections: string[];
  requiredFields: string[];
}

export interface PostIncidentConfig {
  reviewDelay: number; // hours
  attendees: OfficeTierRole[];
  focusAreas: string[];
  documentationRequired: boolean;
  lessonsLearned: boolean;
  preventiveMeasures: boolean;
}

// Multi-Location Support
export interface MultiLocationConfig {
  id: string;
  organizationId: string;
  locations: OfficeLocation[];
  primaryLocation: string;
  dataResidencyRules: DataResidencyRule[];
  syncEnabled: boolean;
}

export interface OfficeLocationConfig {
  id: string;
  name: string;
  type: OfficeLocation;
  region: string;
  timezone: string;
  primaryContact: string;
  teams: string[];
  riskLevel: 'low' | 'medium' | 'high';
  complianceRequirements: ComplianceFramework[];
}

export interface DataResidencyRule {
  dataType: DataClassification;
  allowedRegions: string[];
  encryptionRequired: boolean;
  crossBorderTransferAllowed: boolean;
}

// Professional Integrations
export interface ProfessionalIntegration {
  id: string;
  organizationId: string;
  type: ProfessionalIntegrationType;
  enabled: boolean;
  credentials: IntegrationCredentials;
  syncConfig: SyncConfiguration;
  lastSync?: Date;
  healthStatus: IntegrationHealthStatus;
}

export type ProfessionalIntegrationType =
  | 'servicenow'
  | 'jira'
  | 'azure_devops'
  | 'pagerduty'
  | 'slack_workspace'
  | 'splunk'
  | 'datadog'
  | 'new_relic';

export interface IntegrationCredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
  customHeader?: Record<string, string>;
}

export interface SyncConfiguration {
  enabled: boolean;
  interval: number; // minutes
  direction: 'bidirectional' | 'inbound' | 'outbound';
  mappings: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

export interface IntegrationHealthStatus {
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  lastCheck: Date;
  errorMessage?: string;
  uptime: number; // percentage
}

// Team Collaboration (up to 10 users)
export interface OfficeTeam {
  id: string;
  organizationId: string;
  name: string;
  maxMembers: number; // up to 10
  members: TeamMember[];
  roles: TeamRoleAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: OfficeTierRole;
  joinedAt: Date;
  permissions: string[];
}

export interface TeamRoleAssignment {
  role: OfficeTierRole;
  basePermissions: string[];
  customPermissions?: string[];
}

// Professional Support
export interface ProfessionalSupportTicket {
  id: string;
  organizationId: string;
  submittedBy: string;
  subject: string;
  description: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  channel: 'email' | 'chat' | 'video' | 'phone';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  slaMetDate: boolean;
}

// Professional Onboarding
export interface ProfessionalOnboarding {
  id: string;
  organizationId: string;
  step: number;
  totalSteps: number;
  completedAt: number; // percentage
  status: 'not_started' | 'in_progress' | 'completed';
  sections: OnboardingSection[];
  estimatedCompletionTime: number; // hours
  nextRecommendedAction: string;
}

export interface OnboardingSection {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  tasks: OnboardingTask[];
  estimatedTime: number;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  resources: ResourceLink[];
  videoUrl?: string;
  documentUrl?: string;
}

export interface ResourceLink {
  title: string;
  url: string;
  type: 'document' | 'video' | 'guide' | 'external';
}

// Audit Logging
export interface AuditLogEntry {
  id: string;
  organizationId: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  changes?: AuditChange[];
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  details?: Record<string, any>;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'share'
  | 'access'
  | 'permission_change'
  | 'policy_update'
  | 'config_change';

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

// Threat Intelligence
export interface ProfessionalThreatIntelligence {
  id: string;
  organizationId: string;
  threatType: ThreatType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  indicators: IOC[];
  recommendations: string[];
  source: string;
  publishedDate: Date;
  updatedDate: Date;
  affectsHealthcare?: boolean;
  relatedCVEs?: string[];
}

export type ThreatType = 'malware' | 'ransomware' | 'phishing' | 'vulnerability' | 'zero_day' | 'compliance_threat';

export interface IOC {
  type: 'file_hash' | 'ip_address' | 'domain' | 'url' | 'email_pattern';
  value: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number; // 0-100
}

// Onboarding Workflow
export interface OnboardingWorkflow {
  id: string;
  organizationId: string;
  stage: OnboardingStage;
  progress: OnboardingProgress[];
  assignedCoach?: string;
  completionTarget?: Date;
}

export type OnboardingStage = 'discovery' | 'planning' | 'implementation' | 'testing' | 'go_live' | 'optimization';

export interface OnboardingProgress {
  stage: OnboardingStage;
  startDate?: Date;
  completionDate?: Date;
  percentage: number;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}
