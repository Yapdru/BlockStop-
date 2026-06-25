/**
 * OFFICE Phase 31.1 - Professional Compliance & Healthcare Excellence
 * Comprehensive type definitions for healthcare compliance, incident management, and reporting
 */

// ============================================================================
// HIPAA Compliance Types
// ============================================================================

export interface HIPAACompliance {
  id: string;
  organizationId: string;
  baaStatus: BAAStatus;
  breachNotifications: BreachNotification[];
  auditTrail: AuditTrailEntry[];
  riskAssessments: RiskAssessment[];
  lastComplianceAudit: Date;
  nextAuditScheduled: Date;
  complianceScore: number; // 0-100
  criticalFindings: ComplianceFinding[];
}

export interface BAAStatus {
  id: string;
  vendor: string;
  executionDate: Date;
  expirationDate: Date;
  lastReviewDate: Date;
  dataProcessingTerms: DataProcessingTerms;
  subprocessorManagement: SubprocessorInfo[];
  status: 'active' | 'expiring' | 'expired' | 'under_review';
  automatedNotifications: boolean;
  reminderDaysBeforeExpiration: number;
}

export interface DataProcessingTerms {
  scope: string;
  dataTypes: string[];
  processingActivities: string[];
  securityMeasures: SecurityMeasure[];
  incidentReportingTimeframe: number; // hours
  auditRights: boolean;
  subprocessorApprovalRequired: boolean;
  dataRetentionPolicy: string;
  deletionMethod: string;
}

export interface SubprocessorInfo {
  id: string;
  name: string;
  description: string;
  country: string;
  dataTypes: string[];
  approvalDate: Date;
  status: 'approved' | 'pending' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  lastAuditDate?: Date;
  certifications: string[];
}

export interface SecurityMeasure {
  id: string;
  name: string;
  category: 'technical' | 'administrative' | 'physical';
  description: string;
  implemented: boolean;
  implementationDate?: Date;
  lastVerifiedDate: Date;
  evidence: string[];
  status: 'compliant' | 'non-compliant' | 'in_remediation';
}

export interface BreachNotification {
  id: string;
  incidentId: string;
  breachDate: Date;
  discoveryDate: Date;
  affectedRecords: number;
  affectedIndividuals: number;
  breachType: BreachType;
  rootCause: string;
  remediationSteps: string[];
  notificationsSent: NotificationRecord[];
  regulatoryReports: RegulatoryReport[];
  status: BreachStatus;
  costs: BreachCost;
}

export type BreachType = 'unauthorized_access' | 'ransomware' | 'phishing' | 'loss_of_device' | 'insider_threat' | 'third_party' | 'other';

export type BreachStatus = 'reported' | 'investigating' | 'notifications_sent' | 'remediated' | 'closed';

export interface NotificationRecord {
  id: string;
  recipientType: 'individual' | 'media' | 'agency' | 'credit_bureau';
  recipientCount: number;
  methodUsed: string[];
  dateSent: Date;
  deadline: Date;
  status: 'pending' | 'sent' | 'confirmed';
  templateUsed: string;
}

export interface RegulatoryReport {
  id: string;
  agency: string;
  reportType: string;
  submissionDate: Date;
  referenceNumber: string;
  requirementsMet: boolean;
  followUpRequired: boolean;
}

export interface BreachCost {
  investigationCost: number;
  notificationCost: number;
  creditMonitoringCost: number;
  legalFeesCost: number;
  regulatorySanctionsCost: number;
  reputationalCost: number;
  totalCost: number;
  currency: string;
}

export interface RiskAssessment {
  id: string;
  date: Date;
  assessmentType: 'initial' | 'periodic' | 'post_incident' | 'change_based';
  riskMatrix: RiskMatrix[];
  overallRiskLevel: RiskLevel;
  prioritizedThreats: Threat[];
  remediationPriorities: RemediationItem[];
  approvedBy: string;
  nextAssessmentDate: Date;
}

export interface RiskMatrix {
  threatId: string;
  threatName: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // calculated
  mitigationStatus: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Threat {
  id: string;
  name: string;
  category: string;
  probability: number;
  potentialImpact: string;
  affectedAssets: string[];
  existingControls: string[];
  gaps: string[];
  priority: number;
}

export interface RemediationItem {
  id: string;
  threatId: string;
  action: string;
  owner: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed' | 'deferred';
  evidence: string[];
  verifiedDate?: Date;
}

export interface ComplianceFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  foundDate: Date;
  remediationDeadline: Date;
  status: 'open' | 'in_remediation' | 'remediated';
  owner: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
}

// ============================================================================
// Professional Reporting Types
// ============================================================================

export interface ExecutiveReport {
  id: string;
  organizationId: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  reportType: ReportType;
  generatedDate: Date;
  generatedBy: string;
  executiveSummary: ExecutiveSummary;
  keyMetrics: KeyMetrics;
  sections: ReportSection[];
  recommendations: Recommendation[];
  appendices: Appendix[];
  distribution: ReportDistribution[];
  status: 'draft' | 'final' | 'distributed';
  boardApprovalDate?: Date;
}

export type ReportType = 'quarterly' | 'annual' | 'incident' | 'compliance' | 'board_meeting';

export interface ExecutiveSummary {
  overview: string;
  keyHighlights: string[];
  criticalIssues: CriticalIssue[];
  performanceAgainstObjectives: string;
  riskSummary: string;
  recommendedActions: string[];
}

export interface CriticalIssue {
  title: string;
  severity: 'critical' | 'high';
  businessImpact: string;
  recommendedAction: string;
}

export interface KeyMetrics {
  totalIncidents: number;
  criticalIncidents: number;
  incidentsWithinSLA: number;
  slaComplianceRate: number;
  meanTimeToDetect: number; // minutes
  meanTimeToResolve: number; // hours
  systemUptime: number; // percentage
  securityEventsProcessed: number;
  threatsBlocked: number;
  complianceScore: number;
  userTrainingCompletion: number; // percentage
  vulnerabilitiesFound: number;
  vulnerabilitiesRemediatedOnTime: number;
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: string;
  charts: Chart[];
  tables: Table[];
  recommendations: string[];
}

export interface Chart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'heatmap' | 'scatter';
  title: string;
  description: string;
  data: ChartData[];
  xAxis: AxisConfig;
  yAxis: AxisConfig;
}

export interface ChartData {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface AxisConfig {
  title: string;
  format: string;
  min?: number;
  max?: number;
}

export interface Table {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  summary: string;
}

export interface TableColumn {
  id: string;
  title: string;
  dataType: string;
  sortable: boolean;
}

export interface TableRow {
  id: string;
  cells: Record<string, any>;
}

export interface Recommendation {
  id: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  businessJustification: string;
  estimatedCost?: number;
  implementationTimeframe: string;
  expectedBenefit: string;
  owner: string;
  dueDate: Date;
  status: 'new' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
}

export interface Appendix {
  id: string;
  title: string;
  content: string;
  attachments: string[];
}

export interface ReportDistribution {
  id: string;
  recipientEmail: string;
  recipientRole: string;
  sentDate: Date;
  readDate?: Date;
  format: 'pdf' | 'email' | 'web';
  accessToken?: string;
}

// ============================================================================
// Healthcare Threat Intelligence Types
// ============================================================================

export interface HealthcareThreatIntel {
  id: string;
  threatId: string;
  threatName: string;
  threatType: HealthcareThreatType;
  severity: ThreatSeverity;
  targetedIndustries: string[];
  targetedOrganizations: string[];
  discoveryDate: Date;
  lastUpdated: Date;
  indicators: IOC[];
  mitigationStrategies: MitigationStrategy[];
  relatedThreats: string[];
  vulnerabilitiesExploited: string[];
  attackChain: AttackStep[];
  telemetry: TelemetryData[];
  intelligence: ThreatIntelligenceReport[];
}

export type HealthcareThreatType = 'ransomware' | 'phishing' | 'supply_chain' | 'insider_threat' | 'iot_vulnerability' | 'compliance_threat' | 'data_exfiltration' | 'denial_of_service';

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file_name';
  value: string;
  context: string;
  firstSeen: Date;
  lastSeen: Date;
  sources: string[];
  confidence: number; // 0-100
  status: 'active' | 'inactive' | 'retired';
}

export interface MitigationStrategy {
  id: string;
  threatId: string;
  strategyType: 'preventive' | 'detective' | 'responsive';
  title: string;
  description: string;
  implementation: string;
  effectiveness: number; // 0-100
  cost: string;
  complexity: 'low' | 'medium' | 'high';
  timeToImplement: string;
  owner: string;
  status: 'recommended' | 'implemented' | 'planned';
}

export interface AttackStep {
  order: number;
  technique: string;
  mitreTacticId: string;
  mitreTechnique: string;
  description: string;
  detectability: 'high' | 'medium' | 'low';
  preventionMethod: string;
}

export interface TelemetryData {
  timestamp: Date;
  source: string;
  eventType: string;
  sourceIP: string;
  targetIP: string;
  protocol: string;
  port: number;
  payload: string;
  confidence: number;
}

export interface ThreatIntelligenceReport {
  id: string;
  title: string;
  publishedDate: Date;
  source: string;
  url: string;
  summary: string;
  affectsOrganization: boolean;
  actionItems: string[];
}

// ============================================================================
// SLA Management Types
// ============================================================================

export interface SLAManagement {
  id: string;
  organizationId: string;
  slas: SLA[];
  incidentSLATracking: IncidentSLATrack[];
  slaMetrics: SLAMetrics;
  alerts: SLAAlert[];
  trends: SLATrend[];
}

export interface SLA {
  id: string;
  name: string;
  incidentSeverity: IncidentSeverity;
  responseTimeMinutes: number;
  resolutionTimeHours: number;
  escalationPolicy: EscalationPolicy[];
  businessHours: boolean;
  applicableTo: string[]; // office IDs or office types
  effectiveDate: Date;
  expirationDate?: Date;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface EscalationPolicy {
  order: number;
  time: number; // minutes
  escalateTo: string; // user email or team
  notificationMethod: 'email' | 'sms' | 'call' | 'slack';
  autoEscalate: boolean;
}

export interface IncidentSLATrack {
  id: string;
  incidentId: string;
  slaId: string;
  createdTime: Date;
  firstResponseTime?: Date;
  resolutionTime?: Date;
  responseTimeMET: boolean;
  resolutionTimeMET: boolean;
  responseTimeDelta: number; // minutes (negative = early, positive = late)
  resolutionTimeDelta: number; // minutes
  breachReason?: string;
  escalations: EscalationEvent[];
}

export interface EscalationEvent {
  escalationLevel: number;
  escalatedTime: Date;
  escalatedTo: string;
  reason: string;
  acknowledged: boolean;
  acknowledgedTime?: Date;
}

export interface SLAMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalIncidents: number;
  slaCompliantIncidents: number;
  slaBreachIncidents: number;
  slaComplianceRate: number; // percentage
  averageResponseTime: number; // minutes
  averageResolutionTime: number; // hours
  bySeverity: Record<IncidentSeverity, SLAMetricsSeverity>;
  byTeam: Record<string, SLAMetricsSeverity>;
}

export interface SLAMetricsSeverity {
  totalIncidents: number;
  compliant: number;
  breached: number;
  complianceRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

export interface SLAAlert {
  id: string;
  incidentId: string;
  alertType: 'response_sla_at_risk' | 'resolution_sla_at_risk' | 'sla_breached';
  severity: 'warning' | 'critical';
  timeUntilBreach: number; // minutes
  createdAt: Date;
  acknowledged: boolean;
  dismissedAt?: Date;
}

export interface SLATrend {
  date: Date;
  complianceRate: number;
  incidentsCompliant: number;
  incidentsBreached: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

// ============================================================================
// Multi-Office Coordination Types
// ============================================================================

export interface MultiOfficeCoordination {
  id: string;
  organizationId: string;
  offices: OfficeInfo[];
  coordinatedIncidents: CoordinatedIncident[];
  crossOfficeMetrics: CrossOfficeMetrics;
  communicationChannels: CommunicationChannel[];
  playbooks: CoordinationPlaybook[];
}

export interface OfficeInfo {
  id: string;
  name: string;
  location: string;
  country: string;
  timezone: string;
  securityTeadSize: number;
  incidentResponseCapabilities: string[];
  backupOffices: string[];
  contactPerson: ContactInfo;
  operatingHours: OperatingHours;
  dataResidencyRequirements: string[];
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  role: string;
  escalationLevel: number;
}

export interface OperatingHours {
  timezone: string;
  mondayFriday: TimeRange;
  weekend: TimeRange;
  holidays: Date[];
}

export interface TimeRange {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface CoordinatedIncident {
  id: string;
  primaryIncidentId: string;
  officesInvolved: string[];
  coordinationType: CoordinationType;
  startTime: Date;
  endTime?: Date;
  status: IncidentStatus;
  synchronizedIncidents: SyncIncident[];
  communicationLog: CommunicationEntry[];
  coordinationTimeline: TimelineEvent[];
  sharedEvidence: SharedEvidence[];
  decisions: CoordinationDecision[];
  owner: string;
}

export type CoordinationType = 'sequential' | 'parallel' | 'cascading' | 'fallback';

export type IncidentStatus = 'detected' | 'acknowledged' | 'investigating' | 'contained' | 'eradicated' | 'recovered' | 'closed';

export interface SyncIncident {
  officeId: string;
  incidentId: string;
  severity: IncidentSeverity;
  affectedSystems: string[];
  status: IncidentStatus;
  lastUpdated: Date;
}

export interface CommunicationEntry {
  id: string;
  timestamp: Date;
  from: string;
  officeId: string;
  channel: string;
  content: string;
  attachments: string[];
  readBy: string[];
  priority: 'urgent' | 'high' | 'normal';
}

export interface TimelineEvent {
  order: number;
  timestamp: Date;
  officeId: string;
  eventType: string;
  description: string;
  actor: string;
  impact: string;
}

export interface SharedEvidence {
  id: string;
  evidenceId: string;
  uploadedBy: string;
  uploadedDate: Date;
  fileType: string;
  fileSize: number;
  accessibleTo: string[]; // office IDs
  encryptionKey?: string;
}

export interface CoordinationDecision {
  id: string;
  timestamp: Date;
  decidedBy: string;
  decisionType: string;
  affectsOffices: string[];
  content: string;
  rationale: string;
  implementationDeadline: Date;
  status: 'pending' | 'approved' | 'implemented' | 'overridden';
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'slack' | 'email' | 'teams' | 'conference_bridge' | 'war_room';
  members: string[];
  encryptionRequired: boolean;
  accessLog: AccessLogEntry[];
}

export interface AccessLogEntry {
  userId: string;
  timestamp: Date;
  action: 'joined' | 'left' | 'posted' | 'accessed';
  details: string;
}

export interface CoordinationPlaybook {
  id: string;
  name: string;
  triggerConditions: string[];
  steps: PlaybookStep[];
  officesInvolved: string[];
  estimatedDuration: number; // minutes
  owner: string;
  lastTestedDate: Date;
  nextTestDate: Date;
}

export interface PlaybookStep {
  order: number;
  title: string;
  description: string;
  owner: string;
  expectedDuration: number; // minutes
  successCriteria: string[];
  alternativeActions: string[];
  dependsOn: number[]; // step numbers
}

export interface CrossOfficeMetrics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  coordinatedIncidents: number;
  averageResolutionTime: number;
  officeParticipation: Record<string, OfficeMetrics>;
  communicationVolume: number;
  escalationsRequired: number;
  playbookActivations: number;
}

export interface OfficeMetrics {
  officeId: string;
  incidentsInvolved: number;
  averageResponseTime: number;
  resourcesContributed: number;
  escalationsInitiated: number;
}

// ============================================================================
// Incident Templates v2 Types
// ============================================================================

export interface IncidentTemplateV2 {
  id: string;
  name: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  applicableRegions: string[];
  applicableIndustries: string[];
  description: string;
  riskProfile: RiskProfile;
  responsePlaybook: ResponsePlaybook;
  communicationPlan: CommunicationPlan;
  technicalResponses: TechnicalResponse[];
  legalCompliance: LegalComplianceSteps;
  healthcareSpecific: HealthcareIncidentSteps;
  postIncidentReview: PostIncidentReviewTemplate;
  estimatedResolutionTime: number;
  requiredSkills: string[];
  requiredTools: string[];
  successMetrics: string[];
  lessons: string[];
  relatedTemplates: string[];
}

export type IncidentType = 'ransomware' | 'data_breach' | 'phishing' | 'malware' | 'insider_threat' | 'ddos' | 'system_failure' | 'third_party_incident' | 'compliance_violation' | 'other';

export interface RiskProfile {
  dataExposureRisk: RiskLevel;
  systemAvailabilityRisk: RiskLevel;
  complianceRisk: RiskLevel;
  reputationalRisk: RiskLevel;
  financialRisk: RiskLevel;
  affectedPatientRecords: string; // e.g., "up to 50,000"
  estimatedDowntime: string; // e.g., "2-4 hours"
}

export interface ResponsePlaybook {
  id: string;
  phases: IncidentPhase[];
  decisionTrees: DecisionTree[];
  runbooks: Runbook[];
  escalationCriteria: string[];
  rollbackProcedures: RollbackProcedure[];
}

export interface IncidentPhase {
  order: number;
  name: string;
  duration: string;
  objectives: string[];
  actions: PhaseAction[];
  checkpoints: Checkpoint[];
  goNoGoDecision?: string;
}

export interface PhaseAction {
  id: string;
  title: string;
  owner: string;
  description: string;
  steps: string[];
  expectedOutcome: string;
  backoutStep?: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  successCriteria: string[];
  verification: string;
}

export interface DecisionTree {
  id: string;
  startNode: DecisionNode;
}

export interface DecisionNode {
  id: string;
  question: string;
  description: string;
  branches: DecisionBranch[];
}

export interface DecisionBranch {
  condition: string;
  nextNodeId?: string;
  action?: string;
}

export interface Runbook {
  id: string;
  title: string;
  purpose: string;
  prerequisites: string[];
  steps: RunbookStep[];
  expectedOutput: string;
  estimatedTime: number; // minutes
  owner: string;
}

export interface RunbookStep {
  order: number;
  action: string;
  expectedResult: string;
  troubleshootingTips: string[];
  revertAction?: string;
}

export interface RollbackProcedure {
  id: string;
  fromState: string;
  toState: string;
  steps: string[];
  estimatedTime: number;
  owner: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CommunicationPlan {
  id: string;
  internalCommunication: CommunicationStep[];
  externalCommunication: ExternalCommunicationPlan;
  mediaResponseStrategy: MediaResponseStrategy;
  stakeholderNotification: StakeholderNotification[];
}

export interface CommunicationStep {
  order: number;
  when: string;
  recipient: string;
  messageTemplate: string;
  method: string;
  frequency: string;
}

export interface ExternalCommunicationPlan {
  notificationRequirements: NotificationRequirement[];
  messageTemplates: MessageTemplate[];
  channelStrategy: ChannelStrategy[];
}

export interface NotificationRequirement {
  audience: string;
  timeframe: string;
  content: string[];
  approvalRequired: boolean;
}

export interface MessageTemplate {
  id: string;
  purpose: string;
  template: string;
  variables: string[];
  reviews: number;
}

export interface ChannelStrategy {
  channel: string;
  priority: number;
  frequency: string;
}

export interface MediaResponseStrategy {
  mediaMonitoring: boolean;
  responseApproach: string;
  keyMessages: string[];
  spokesPerson: string;
  approvalProcess: string;
}

export interface StakeholderNotification {
  stakeholderType: string;
  notificationTime: string;
  content: string[];
  owner: string;
}

export interface TechnicalResponse {
  id: string;
  systemType: string;
  detectionMethods: string[];
  containmentActions: ContainmentAction[];
  investigationTools: string[];
  preservationRequirements: string[];
  remediationSteps: RemediationStep[];
  validationChecks: string[];
}

export interface ContainmentAction {
  order: number;
  action: string;
  systemsAffected: string[];
  expectedResult: string;
  riskOfAction: string;
  alternativeAction?: string;
}

export interface RemediationStep {
  order: number;
  step: string;
  prerequisites: string[];
  validation: string;
  rollbackPlan?: string;
  estimatedTime: number;
}

export interface LegalComplianceSteps {
  notificationAuthority: string;
  regulatoriesInvolved: string[];
  documentationRequirements: string[];
  legalHold: boolean;
  externalCounselNeeded: boolean;
  complianceDeadlines: ComplianceDeadline[];
}

export interface ComplianceDeadline {
  regulation: string;
  deadline: string;
  requirement: string;
  owner: string;
}

export interface HealthcareIncidentSteps {
  baaNotificationRequired: boolean;
  businessAssociatesAffected: string[];
  patientNotificationRequirements: PatientNotification[];
  regulatoryReports: string[];
  hipaaBreachThreshold: number;
  breachReportingDeadline: string;
  mediaNotificationThreshold: number;
  mseCtContacts: string[];
}

export interface PatientNotification {
  method: string;
  timing: string;
  contentRequirements: string[];
}

export interface PostIncidentReviewTemplate {
  id: string;
  reviewSchedule: string;
  participants: string[];
  agenda: ReviewAgendaItem[];
  reportingRequirements: string[];
  actionItemTracking: boolean;
}

export interface ReviewAgendaItem {
  order: number;
  topic: string;
  owner: string;
  timebox: number; // minutes
  questions: string[];
}

// ============================================================================
// Office 365 Deep Integration Types
// ============================================================================

export interface Office365Integration {
  id: string;
  organizationId: string;
  tenantId: string;
  integrationStatus: IntegrationStatus;
  connectedServices: ConnectedService[];
  threatDetectionRules: ThreatDetectionRule[];
  autoScanConfig: AutoScanConfig;
  scanResults: ScanResult[];
  threats: DetectedThreat[];
  remediationActions: RemediationAction[];
}

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'rate_limited';

export interface ConnectedService {
  serviceType: Office365Service;
  connectionDate: Date;
  lastSyncDate: Date;
  permissionsGranted: string[];
  status: 'active' | 'inactive' | 'revoked';
  appRegistrationId: string;
}

export type Office365Service = 'exchange_online' | 'sharepoint_online' | 'teams' | 'onedrive' | 'defender' | 'purview' | 'audit_log';

export interface ThreatDetectionRule {
  id: string;
  name: string;
  enabled: boolean;
  targetService: Office365Service;
  ruleType: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  createdDate: Date;
  lastModifiedDate: Date;
}

export type RuleType = 'phishing' | 'malware' | 'data_exfiltration' | 'behavioral' | 'policy_violation' | 'anomaly';

export interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  regex: boolean;
}

export interface RuleAction {
  id: string;
  actionType: 'alert' | 'block' | 'quarantine' | 'remove' | 'tag' | 'notify';
  severity: ThreatSeverity;
  parameters: Record<string, any>;
  delaySeconds?: number;
}

export interface AutoScanConfig {
  enabled: boolean;
  scanSchedule: string; // cron format
  targetServices: Office365Service[];
  emailScanDepth: 'headers' | 'body' | 'attachments' | 'full';
  teamsScanEnabled: boolean;
  sharePointScanEnabled: boolean;
  oneDriveScanEnabled: boolean;
  scanTimeout: number; // seconds
  maxItemsPerScan: number;
  notificationTemplate: string;
}

export interface ScanResult {
  id: string;
  scanDate: Date;
  service: Office365Service;
  itemsScanned: number;
  threatsDetected: number;
  remediationAttempted: number;
  remediationSuccessful: number;
  status: 'completed' | 'in_progress' | 'failed';
  errorMessage?: string;
  duration: number; // seconds
}

export interface DetectedThreat {
  id: string;
  scanResultId: string;
  detectionTime: Date;
  threatType: string;
  severity: ThreatSeverity;
  itemId: string;
  itemType: string; // email, file, message, etc.
  itemPath: string;
  owner: string;
  sha256Hash: string;
  indicators: string[];
  matchedRules: string[];
  remediationStatus: RemediationStatus;
  remediationAction?: string;
  remediationTime?: Date;
}

export type RemediationStatus = 'detected' | 'flagged' | 'remediated' | 'quarantined' | 'failed' | 'pending';

export interface RemediationAction {
  id: string;
  threatId: string;
  action: string;
  parameters: Record<string, any>;
  initiatedTime: Date;
  completedTime?: Date;
  status: RemediationStatus;
  resultMessage: string;
  approvedBy?: string;
}

// ============================================================================
// Compliance Calendar Types
// ============================================================================

export interface ComplianceCalendar {
  id: string;
  organizationId: string;
  events: ComplianceEvent[];
  deadlines: ComplianceDeadlineEvent[];
  audits: AuditSchedule[];
  certifications: CertificationTrack[];
  trainingSchedule: TrainingEvent[];
  holidays: HolidayInfo[];
}

export interface ComplianceEvent {
  id: string;
  title: string;
  eventType: ComplianceEventType;
  startDate: Date;
  endDate: Date;
  description: string;
  location?: string;
  owner: string;
  participants: string[];
  documents: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  relatedRegulations: string[];
}

export type ComplianceEventType = 'audit' | 'assessment' | 'training' | 'review' | 'certification' | 'testing' | 'meeting' | 'deadline';

export interface ComplianceDeadlineEvent {
  id: string;
  title: string;
  regulation: string;
  dueDate: Date;
  requirement: string;
  owner: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  relatedIncidents: string[];
  status: 'on_track' | 'at_risk' | 'overdue';
  completionDate?: Date;
  evidence: string[];
  notes: string;
}

export interface AuditSchedule {
  id: string;
  auditType: AuditType;
  scope: string;
  startDate: Date;
  endDate: Date;
  auditor: string;
  auditNumber?: string;
  preliminaryFindings?: string;
  finalReport?: string;
  findingsSummary: AuditFinding[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'deferred';
}

export type AuditType = 'internal' | 'external' | 'hipaa' | 'soc2' | 'iso27001' | 'pci_dss' | 'gdpr' | 'ccpa';

export interface AuditFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  rootCause?: string;
  remediation?: string;
  owner: string;
  dueDate: Date;
  status: 'open' | 'in_remediation' | 'remediated' | 'deferred';
}

export interface CertificationTrack {
  id: string;
  certificationName: string;
  certificationBody: string;
  currentStatus: CertificationStatus;
  issueDate?: Date;
  expirationDate?: Date;
  scope: string;
  auditor: string;
  renewalDate?: Date;
  documents: string[];
  assessmentResults: AssessmentResult[];
}

export type CertificationStatus = 'obtained' | 'in_progress' | 'expired' | 'pending_renewal';

export interface AssessmentResult {
  date: Date;
  assessmentType: string;
  score?: number;
  passed: boolean;
  findings: string[];
  nextSteps: string[];
}

export interface TrainingEvent {
  id: string;
  title: string;
  subject: string;
  startDate: Date;
  endDate: Date;
  instructor: string;
  location: string;
  attendees: TrainingAttendee[];
  completionPercentage: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  certificationEarned?: string;
}

export interface TrainingAttendee {
  userId: string;
  name: string;
  email: string;
  attendanceStatus: 'registered' | 'attended' | 'absent' | 'excused';
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  certificateIssued: boolean;
}

export interface HolidayInfo {
  date: Date;
  name: string;
  country: string;
  affectsOffices: string[];
}

// ============================================================================
// Professional Audit Types
// ============================================================================

export interface ProfessionalAudit {
  id: string;
  organizationId: string;
  auditNumber: string;
  auditType: AuditType;
  scope: string;
  startDate: Date;
  endDate?: Date;
  auditor: ContactInfo;
  evidenceCollected: EvidenceItem[];
  auditTrail: AuditTrailEntry[];
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  status: 'planning' | 'executing' | 'reviewing' | 'reporting' | 'closed';
  reportGenerated: boolean;
  reportPath?: string;
  signOff?: SignOffRecord;
}

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  name: string;
  description: string;
  uploadedDate: Date;
  uploadedBy: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  hash: string;
  encryptionKey?: string;
  chainOfCustody: ChainOfCustodyEntry[];
  relevantFindings: string[];
  retentionExpires: Date;
}

export type EvidenceCategory = 'logs' | 'configuration' | 'documentation' | 'screenshot' | 'test_result' | 'policy' | 'contract' | 'communication' | 'other';

export interface ChainOfCustodyEntry {
  timestamp: Date;
  handler: string;
  action: string;
  location?: string;
  status: 'received' | 'transferred' | 'stored' | 'retrieved';
}

export interface AuditRecommendation {
  id: string;
  findingId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  businessJustification: string;
  implementationApproach: string;
  owner: string;
  dueDate: Date;
  estimatedCost?: number;
  status: 'new' | 'accepted' | 'rejected' | 'deferred' | 'in_progress' | 'completed';
}

export interface SignOffRecord {
  signedDate: Date;
  signedBy: string;
  signatureVerified: boolean;
  approvalChain: ApprovalStep[];
}

export interface ApprovalStep {
  order: number;
  approver: string;
  approvalDate: Date;
  status: 'approved' | 'rejected' | 'pending';
  comments: string;
}

// ============================================================================
// Data Residency Management Types
// ============================================================================

export interface DataResidencyManagement {
  id: string;
  organizationId: string;
  policies: DataResidencyPolicy[];
  dataInventory: DataLocation[];
  compliance: RegionComplianceStatus[];
  transfers: DataTransferRequest[];
  audits: DataResidencyAudit[];
}

export interface DataResidencyPolicy {
  id: string;
  region: string;
  regulation: 'GDPR' | 'HIPAA' | 'LGPD' | 'CCPA' | 'other';
  dataClassifications: string[];
  allowedProcessingCountries: string[];
  storageRequirements: string;
  processingRestrictions: string[];
  encryptionRequired: boolean;
  keyManagementLocation: string;
  owner: string;
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface DataLocation {
  id: string;
  dataType: string;
  dataClassification: DataClassification;
  currentLocation: string;
  allowedLocations: string[];
  storageService: string;
  encryptionStatus: EncryptionStatus;
  owner: string;
  lastAuditedDate: Date;
  complianceStatus: string;
}

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'pii' | 'phi' | 'pci';

export type EncryptionStatus = 'encrypted_at_rest' | 'encrypted_in_transit' | 'both' | 'unencrypted' | 'unknown';

export interface RegionComplianceStatus {
  region: string;
  regulations: RegulationStatus[];
  dataResidenceStatus: 'compliant' | 'non_compliant' | 'in_remediation' | 'unknown';
  lastAuditDate: Date;
  nextAuditDate: Date;
  findings: ComplianceFinding[];
  actionItems: string[];
}

export interface RegulationStatus {
  regulation: string;
  status: 'compliant' | 'non_compliant' | 'in_remediation';
  lastCheckedDate: Date;
  evidenceLocations: string[];
}

export interface DataTransferRequest {
  id: string;
  requestDate: Date;
  dataType: string;
  fromRegion: string;
  toRegion: string;
  justification: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: Date;
  transferDate?: Date;
  completionDate?: Date;
  encryptionUsed: boolean;
  auditLog: AccessLogEntry[];
}

export interface DataResidencyAudit {
  id: string;
  date: Date;
  scope: string;
  findings: DataResidencyFinding[];
  status: 'completed' | 'in_progress' | 'scheduled';
  auditor: string;
  reportPath?: string;
}

export interface DataResidencyFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedData: string[];
  affectedRegions: string[];
  remediationRequired: boolean;
  remediationDeadline?: Date;
  status: 'open' | 'in_remediation' | 'remediated';
}

// ============================================================================
// Professional Support Portal Types
// ============================================================================

export interface SupportPortal {
  id: string;
  organizationId: string;
  tickets: SupportTicket[];
  knowledgeBase: KnowledgeArticle[];
  faqItems: FAQItem[];
  videoLibrary: VideoResource[];
  contactChannels: SupportChannel[];
  statistics: SupportStatistics;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  createdDate: Date;
  createdBy: string;
  category: TicketCategory;
  subcategory: string;
  subject: string;
  description: string;
  attachments: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  severity: 'blocking' | 'major' | 'minor' | 'cosmetic';
  status: TicketStatus;
  assignedTo?: string;
  assignedDate?: Date;
  resolutionSummary?: string;
  closedDate?: Date;
  timeSpentHours: number;
  relatedTickets: string[];
  comments: TicketComment[];
  customFields: Record<string, any>;
  slaTracking: SLATrack;
}

export type TicketCategory = 'incident' | 'request' | 'problem' | 'change' | 'vulnerability' | 'compliance' | 'general';

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'waiting_customer' | 'resolved' | 'closed';

export interface TicketComment {
  id: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  content: string;
  attachments: string[];
  isInternal: boolean;
  status: 'published' | 'draft' | 'deleted';
}

export interface SLATrack {
  initialResponseTime: number; // hours
  resolutionTime: number; // hours
  initialResponseMET: boolean;
  resolutionMET: boolean;
  firstResponseTime?: Date;
  resolvedTime?: Date;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  content: string;
  createdDate: Date;
  updatedDate: Date;
  author: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpful: number;
  unhelpful: number;
  relatedArticles: string[];
  attachments: string[];
  videoLink?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  views: number;
  helpful: number;
  lastUpdatedDate: Date;
  updatedBy: string;
}

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // seconds
  videoUrl: string;
  transcriptUrl?: string;
  createdDate: Date;
  updatedDate: Date;
  views: number;
  tags: string[];
  relatedArticles: string[];
}

export interface SupportChannel {
  id: string;
  name: string;
  type: 'email' | 'phone' | 'chat' | 'slack' | 'teams' | 'web_form';
  status: 'active' | 'inactive';
  hoursOfOperation: OperatingHours;
  languages: string[];
  contactInfo: string;
  averageResponseTime: number; // minutes
  timezone: string;
}

export interface SupportStatistics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  averageResolutionTime: number; // hours
  firstResponseTime: number; // hours
  customerSatisfactionScore: number; // 1-10
  ticketsByCategory: Record<string, number>;
  ticketsBySeverity: Record<string, number>;
  slaMEtRate: number; // percentage
}

// ============================================================================
// Healthcare Threat Trending Types
// ============================================================================

export interface HealthcareThreatTrending {
  id: string;
  organizationId: string;
  threats: ThreatTrend[];
  ransomwareCampaigns: RansomwareCampaignTrend[];
  complianceThreats: ComplianceThreat[];
  regionalAnalysis: RegionalThreatAnalysis[];
  industryBenchmarks: IndustryBenchmark[];
  predictions: ThreatPrediction[];
}

export interface ThreatTrend {
  threatType: HealthcareThreatType;
  period: {
    startDate: Date;
    endDate: Date;
  };
  frequency: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  affectedOrganizations: number;
  sectorImpact: string;
  geographicDistribution: Record<string, number>;
  targetedSystems: string[];
  timeline: TrendPoint[];
}

export interface TrendPoint {
  date: Date;
  value: number;
  annotations: string[];
}

export interface RansomwareCampaignTrend {
  id: string;
  campaignName: string;
  operator: string;
  firstObservedDate: Date;
  lastObservedDate: Date;
  targetedIndustries: string[];
  targetedCountries: string[];
  victimCount: number;
  averageRansomDemand: number;
  currency: string;
  paymentMethods: string[];
  toolsUsed: string[];
  vulnerabilitiesExploited: string[];
  timelineData: TrendPoint[];
  status: 'active' | 'dormant' | 'ceased';
  intelligence: string[];
}

export interface ComplianceThreat {
  id: string;
  threatType: string;
  regulation: string;
  affectedSectors: string[];
  affectedRegions: string[];
  frequency: number;
  severity: ThreatSeverity;
  commonCauses: string[];
  remediation: string[];
  regulatoryActionsTaken: string[];
  recentIncidents: IncidentReference[];
}

export interface IncidentReference {
  organizationName: string;
  date: Date;
  penalty?: number;
  description: string;
}

export interface RegionalThreatAnalysis {
  region: string;
  threatProfile: ThreatType[];
  dominantThreats: string[];
  yearOverYearChange: number;
  prevalentMalware: string[];
  commonVulnerabilities: string[];
  regulatoryFocus: string[];
}

export type ThreatType = 'ransomware' | 'phishing' | 'malware' | 'ddos' | 'insider' | 'supply_chain';

export interface IndustryBenchmark {
  industry: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  averageIncidentsPerOrganization: number;
  averageTimeToDetect: number;
  averageTimeToResolve: number;
  percentageWithIncidents: number;
  commonThreats: string[];
  averageCost: number;
  topVulnerabilities: string[];
}

export interface ThreatPrediction {
  id: string;
  date: Date;
  predictedThreats: PredictedThreat[];
  confidence: number; // 0-100
  methodology: string;
  timePeriod: string;
}

export interface PredictedThreat {
  threatType: string;
  likelihood: 'high' | 'medium' | 'low';
  expectedImpact: string;
  targetedSectors: string[];
  targetedRegions: string[];
  suggestedPreparations: string[];
}
