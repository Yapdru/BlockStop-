/**
 * BlockStop Phase 17 - Compliance Framework Type Definitions
 * Enterprise-grade compliance and auditing system types
 *
 * Supports: SOC2, ISO27001, HIPAA, PCI-DSS, GDPR, NIST
 */

// ============================================================================
// Core Compliance Types
// ============================================================================

export enum ComplianceFrameworkType {
  SOC2 = 'SOC2',
  ISO27001 = 'ISO27001',
  HIPAA = 'HIPAA',
  PCIДSS = 'PCIДSS',
  GDPR = 'GDPR',
  NIST = 'NIST',
}

export enum ControlStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  IMPLEMENTED = 'IMPLEMENTED',
  TESTED = 'TESTED',
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  EXCEPTION_GRANTED = 'EXCEPTION_GRANTED',
  REMEDIATION_PLANNED = 'REMEDIATION_PLANNED',
}

export enum SeverityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL',
}

export enum MaturityLevel {
  INITIAL = 0,
  REPEATABLE = 1,
  DEFINED = 2,
  MANAGED = 3,
  OPTIMIZED = 4,
}

export enum EvidenceType {
  POLICY = 'POLICY',
  PROCEDURE = 'PROCEDURE',
  AUDIT_LOG = 'AUDIT_LOG',
  TEST_REPORT = 'TEST_REPORT',
  ASSESSMENT = 'ASSESSMENT',
  SCREENSHOT = 'SCREENSHOT',
  CONFIG_EXPORT = 'CONFIG_EXPORT',
  ATTESTATION = 'ATTESTATION',
  THIRD_PARTY_CERT = 'THIRD_PARTY_CERT',
}

// ============================================================================
// Control and Framework Types
// ============================================================================

export interface ComplianceControl {
  id: string;
  controlNumber: string;
  title: string;
  description: string;
  objective: string;
  scope: string[];

  // Severity and requirements
  severity: SeverityLevel;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;

  // Maturity and implementation
  maturityLevel: MaturityLevel;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  estimatedHoursToImplement: number;

  // Requirements and dependencies
  requirements: string[];
  relatedControls: string[];
  dependencies: string[];

  // Evidence and testing
  evidenceExpectations: string[];
  requiredEvidenceTypes: EvidenceType[];
  testingApproach: string;
  testingFrequency: 'ANNUALLY' | 'SEMI_ANNUALLY' | 'QUARTERLY' | 'MONTHLY' | 'CONTINUOUS';
  acceptanceCriteria: string[];

  // Framework-specific
  frameworkReferences: FrameworkReference[];
  regulatoryReferences?: string[];

  // Implementation details
  implementationGuidance: string;
  commonMisconfigurations: string[];
  automationPossible: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface FrameworkReference {
  framework: ComplianceFrameworkType;
  referenceId: string;
  section?: string;
  weightage?: number;
}

export interface ComplianceFramework {
  id: string;
  type: ComplianceFrameworkType;
  name: string;
  version: string;
  description: string;

  // Framework metadata
  publishedBy: string;
  publishDate: Date;
  effectiveDate: Date;
  nextReviewDate?: Date;

  // Control information
  totalControls: number;
  controlCategories: string[];

  // Requirements
  scope: string;
  audienceLevel: 'ENTERPRISE' | 'ORGANIZATION' | 'DEPARTMENT' | 'INDIVIDUAL';

  // Controls registry
  controls: ComplianceControl[];
  controlMapping: Map<string, ComplianceControl>;

  // Framework-specific properties
  metadata: Record<string, unknown>;
}

// ============================================================================
// Status and Assessment Types
// ============================================================================

export interface ControlImplementationStatus {
  controlId: string;
  status: ControlStatus;
  maturityLevel: MaturityLevel;
  implementationDate?: Date;
  lastTestedDate?: Date;
  nextTestDate?: Date;
  owner: string;
  notes: string;
  percentageComplete: number;
}

export interface EvidenceItem {
  id: string;
  controlId: string;
  type: EvidenceType;
  title: string;
  description: string;
  location: string;
  storagePath?: string;

  // Metadata
  uploadedBy: string;
  uploadedAt: Date;
  expiryDate?: Date;

  // Verification
  verifiedBy?: string;
  verificationDate?: Date;
  isValid: boolean;
  validationNotes?: string;

  // Relationships
  linkedControls: string[];
  relatedEvidence: string[];
}

export interface ComplianceScore {
  frameworkId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;

  // Category breakdown
  categoryScores: Map<string, CategoryScore>;

  // Status breakdown
  controlStatusDistribution: Map<ControlStatus, number>;

  // Trending
  previousScore?: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';

  // Timestamp
  calculatedAt: Date;
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  controlCount: number;
  compliantCount: number;
  nonCompliantCount: number;
}

// ============================================================================
// Audit and Assessment Types
// ============================================================================

export interface AuditRecord {
  id: string;
  auditId: string;
  frameworkId: string;
  controlId: string;

  // Audit details
  auditType: 'INTERNAL' | 'EXTERNAL' | 'THIRD_PARTY' | 'SELF_ASSESSMENT';
  auditDate: Date;
  auditPeriod: {
    startDate: Date;
    endDate: Date;
  };

  // Evidence review
  evidenceReviewed: string[];
  evidenceGaps: string[];

  // Findings
  findings: AuditFinding[];
  overallResult: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'INCONCLUSIVE';

  // Auditor information
  auditedBy: string;
  auditorRole: string;
  auditorOrganization?: string;

  // Notes and references
  notes: string;
  references: string[];

  // Timestamp
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  auditRecordId: string;
  controlId: string;

  // Finding classification
  findingType: 'DEFICIENCY' | 'WEAKNESS' | 'NON_COMPLIANCE' | 'OBSERVATION';
  severity: SeverityLevel;

  // Description
  description: string;
  rootCause: string;
  businessImpact: string;

  // Evidence and supporting information
  evidence: string[];
  relevantPolicy?: string;
  controlExpectation: string;

  // Remediation
  remediationRequired: boolean;
  remediationActions?: RemediationAction[];
  targetRemediationDate?: Date;

  // Status
  status: 'OPEN' | 'REMEDIATION_IN_PROGRESS' | 'REMEDIATED' | 'ACCEPTED_RISK' | 'WAIVED';

  // Metadata
  reportedDate: Date;
  reportedBy: string;
  updatedAt: Date;
  resolution?: string;
}

export interface RemediationAction {
  id: string;
  findingId: string;

  // Action details
  description: string;
  action: string;
  expectedOutcome: string;

  // Responsibility and timeline
  assignedTo: string;
  assignedDate: Date;
  targetDate: Date;
  completionDate?: Date;

  // Status and evidence
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  completionEvidence?: string;

  // Metadata
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCost?: number;
  estimatedEffort?: string;
  notes?: string;
}

// ============================================================================
// Gap Analysis and Planning Types
// ============================================================================

export interface ComplianceGap {
  controlId: string;
  controlNumber: string;
  controlTitle: string;
  frameworkId: string;

  // Gap information
  gapDescription: string;
  currentState: string;
  desiredState: string;
  riskImplication: string;

  // Impact assessment
  businessImpact: SeverityLevel;
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

  // Remediation
  proposedSolution: string;
  estimatedCost: number;
  estimatedEffort: string;
  recommendedTimeline: string;

  // Prioritization
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;

  // Metadata
  identifiedDate: Date;
  targetClosureDate?: Date;
}

export interface ComplianceRoadmap {
  frameworkId: string;
  roadmapId: string;

  // Timeline
  startDate: Date;
  targetCompletionDate: Date;

  // Phases
  phases: RoadmapPhase[];

  // Priorities
  prioritizedGaps: ComplianceGap[];
  estimatedTotalCost: number;
  estimatedTotalEffort: string;

  // Metadata
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
  approvedBy?: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  phaseName: string;
  startDate: Date;
  endDate: Date;
  controlIds: string[];
  estimatedCost: number;
  estimatedEffort: string;
  objectives: string[];
  successCriteria: string[];
}

// ============================================================================
// Reporting and Dashboard Types
// ============================================================================

export interface ComplianceReport {
  reportId: string;
  frameworkId: string;
  reportType: 'EXECUTIVE_SUMMARY' | 'DETAILED_ASSESSMENT' | 'AUDIT_REPORT' | 'TREND_ANALYSIS' | 'REMEDIATION_STATUS';

  // Report details
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  generatedDate: Date;
  generatedBy: string;

  // Content
  executiveSummary: string;
  keyFindings: KeyFinding[];
  recommendations: Recommendation[];

  // Metrics
  overallScore: ComplianceScore;
  trendAnalysis: TrendAnalysis;
  riskAssessment: RiskAssessment;

  // Appendices
  detailedControlStatus: ControlImplementationStatus[];
  auditFindings: AuditFinding[];

  // Metadata
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL';
  recipients: string[];
  approvalSignatory?: string;
}

export interface KeyFinding {
  title: string;
  description: string;
  severity: SeverityLevel;
  affectedControls: number;
  businessImpact: string;
  recommendation: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  implementationOwner?: string;
  estimatedCost?: number;
  implementationTimeline: string;
  expectedBenefit: string;
}

export interface TrendAnalysis {
  period: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  dataPoints: TrendDataPoint[];
  direction: 'IMPROVING' | 'STABLE' | 'DECLINING';
  percentageChange: number;
  insights: string[];
}

export interface TrendDataPoint {
  date: Date;
  score: number;
  completionPercentage: number;
  nonCompliantControls: number;
}

export interface RiskAssessment {
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  overallRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  mitigationStatus: string;
}

// ============================================================================
// Framework Comparison Types
// ============================================================================

export interface FrameworkComparison {
  frameworks: ComplianceFrameworkType[];
  comparisonDate: Date;

  // Mapping information
  controlMappings: ControlMapping[];

  // Overlap analysis
  totalUniqueControls: number;
  overlapPercentage: number;
  frameworkSpecificControls: Map<ComplianceFrameworkType, string[]>;

  // Coverage analysis
  coverageMatrix: CoverageMatrix;

  // Recommendations
  recommendations: string[];
}

export interface ControlMapping {
  controlId1: string;
  frameworkId1: ComplianceFrameworkType;
  controlId2: string;
  frameworkId2: ComplianceFrameworkType;

  // Mapping details
  alignmentLevel: 'ALIGNED' | 'PARTIALLY_ALIGNED' | 'LOOSELY_RELATED' | 'NOT_ALIGNED';
  alignmentDescription: string;
  mappingStrength: number; // 0-100

  mappedBy: string;
  mappingDate: Date;
}

export interface CoverageMatrix {
  rows: string[]; // Framework 1 controls
  columns: string[]; // Framework 2 controls
  data: number[][]; // Alignment scores
}

// ============================================================================
// Configuration and Registry Types
// ============================================================================

export interface FrameworkRegistry {
  registryId: string;
  frameworks: Map<ComplianceFrameworkType, ComplianceFramework>;

  // Version management
  registryVersion: string;
  lastUpdated: Date;

  // Statistics
  totalFrameworks: number;
  totalControls: number;

  // Configuration
  enabledFrameworks: ComplianceFrameworkType[];
}

export interface ComplianceConfiguration {
  organizationId: string;
  configId: string;

  // Framework selection
  enabledFrameworks: ComplianceFrameworkType[];

  // Roles and responsibilities
  complianceOfficer: string;
  auditCommittee: string[];
  controlOwners: Map<string, string>;

  // Policies
  auditingPolicy: {
    internalAuditFrequency: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY';
    externalAuditRequired: boolean;
    externalAuditFrequency?: 'ANNUAL' | 'BIENNIAL' | 'TRIENNIAL';
  };

  // Notification and escalation
  escalationRules: EscalationRule[];
  notificationRules: NotificationRule[];

  // Standards and thresholds
  complianceThreshold: number; // Percentage
  criticalFindingResponseTime: number; // Hours

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationRule {
  condition: string;
  escalationPath: string[];
  timeLimit: number; // Minutes
}

export interface NotificationRule {
  triggerEvent: string;
  recipients: string[];
  channel: 'EMAIL' | 'SLACK' | 'TEAMS' | 'BOTH';
  template: string;
}

// ============================================================================
// Export and Import Types
// ============================================================================

export interface ComplianceSnapshot {
  snapshotId: string;
  frameworkId: string;
  snapshotDate: Date;

  // Full state capture
  controlStatuses: ControlImplementationStatus[];
  evidenceItems: EvidenceItem[];
  auditRecords: AuditRecord[];
  findings: AuditFinding[];

  // Score and metrics
  complianceScore: ComplianceScore;

  // Metadata
  createdBy: string;
  description?: string;
}

export interface ComplianceExportFormat {
  version: string;
  exportDate: Date;
  frameworks: ComplianceFramework[];
  snapshots: ComplianceSnapshot[];
  reports: ComplianceReport[];
}
