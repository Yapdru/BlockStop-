/**
 * BlockStop Phase 28.2 - Enterprise Features Types
 * Advanced RBAC, Zero-Trust, GDPR/CCPA, and Professional Services
 */

// RBAC Types
export type PermissionScope = 'global' | 'organization' | 'team' | 'project' | 'resource';
export type PermissionAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'execute' | 'manage' | 'approve' | 'export'
  | 'audit' | 'configure' | 'share' | 'transfer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  scope: PermissionScope;
  action: PermissionAction;
  resourceType: string;
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  organizationId: string;
  teamId?: string;
  permissions: Permission[];
  permissionIds: string[];
  parentRoleId?: string;
  inheritsFrom?: Role[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  organizationId: string;
  teamId?: string;
  expiresAt?: Date;
  assignedAt: Date;
  assignedBy: string;
  conditions?: Record<string, any>;
}

export interface TeamHierarchy {
  teamId: string;
  parentTeamId?: string;
  childTeamIds: string[];
  level: number;
  path: string[];
}

// Zero-Trust Types
export type TrustLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
export type AccessDecision = 'allow' | 'deny' | 'challenge' | 'restrict';
export type AuthMethod = 'password' | 'mfa' | 'biometric' | 'certificate' | 'oauth' | 'oidc';

export interface DeviceProfile {
  deviceId: string;
  deviceName: string;
  osType: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
  osVersion: string;
  hardwareId: string;
  owner: string;
  registeredAt: Date;
  lastSeen: Date;
  isCompliant: boolean;
  hasEncryption: boolean;
  hasAntivirus: boolean;
  hasFirewall: boolean;
  metadata?: Record<string, any>;
}

export interface DeviceTrustScore {
  deviceId: string;
  score: number;
  trustLevel: TrustLevel;
  factors: {
    osSecurityPatches: number;
    encryptionStatus: number;
    malwareProtection: number;
    firewallStatus: number;
    updateStatus: number;
    behaviorAnalysis: number;
  };
  lastCalculated: Date;
  risks: string[];
}

export interface AccessContext {
  userId: string;
  deviceId: string;
  ipAddress: string;
  timestamp: Date;
  resourceId: string;
  action: string;
  location?: {
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  decision: AccessDecision;
  requiresMfa: boolean;
  minimumTrustLevel: TrustLevel;
  resourcePattern: string;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCondition {
  type: 'user_risk' | 'device_trust' | 'location' | 'time' | 'ip_reputation' | 'behavior';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'between' | 'match';
  value: any;
  description?: string;
}

export interface MicroSegment {
  id: string;
  name: string;
  description: string;
  resources: string[];
  allowedUserRoles: string[];
  allowedDeviceTrustLevels: TrustLevel[];
  requiredAuthMethods: AuthMethod[];
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  createdAt: Date;
}

// GDPR/CCPA Types
export type ConsentType = 'marketing' | 'analytics' | 'preferences' | 'essential' | 'processing';
export type DataCategory = 'personal' | 'behavioral' | 'technical' | 'financial' | 'health' | 'biometric';
export type RequestType = 'access' | 'deletion' | 'rectification' | 'restriction' | 'portability' | 'objection';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'denied' | 'expired';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  jurisdiction: 'GDPR' | 'CCPA' | 'BOTH';
  documentVersion: string;
  source: 'web' | 'mobile' | 'api' | 'email';
}

export interface DataSubject {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  organization?: string;
  country: string;
  dataCategories: DataCategory[];
  consents: ConsentRecord[];
  rightsExercised: PrivacyRight[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacyRight {
  id: string;
  type: RequestType;
  status: RequestStatus;
  dataSubjectId: string;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  description?: string;
  attachments?: string[];
  responseData?: any;
  denialReason?: string;
}

export interface DataProcessing {
  id: string;
  dataSubjectId: string;
  purposeId: string;
  purpose: string;
  category: DataCategory;
  processingMethod: 'automated' | 'manual' | 'mixed';
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interest';
  recipients?: string[];
  retentionPeriod: number;
  startDate: Date;
  endDate?: Date;
  securityMeasures: string[];
  thirdPartyProcessors?: string[];
}

export interface PrivacyPolicy {
  id: string;
  version: string;
  effectiveDate: Date;
  language: string;
  jurisdiction: 'GDPR' | 'CCPA' | 'BOTH';
  dataProcessingPurposes: string[];
  retentionPolicies: Record<DataCategory, number>;
  rights: string[];
  contentHash: string;
}

export interface DPA {
  id: string;
  processor: string;
  processorAddress: string;
  dataCategories: DataCategory[];
  processingActivities: string[];
  securityMeasures: string[];
  subProcessors: string[];
  signedDate: Date;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface BreachNotification {
  id: string;
  breachDate: Date;
  discoveryDate: Date;
  description: string;
  affectedDataSubjects: number;
  affectedCategories: DataCategory[];
  likelyRisks: string[];
  mitigationMeasures: string[];
  notificationSent: boolean;
  notificationDate?: Date;
  authorities: string[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  dataSubjectId?: string;
  action: string;
  category: 'data_access' | 'data_modification' | 'data_deletion' | 'consent_change' | 'export' | 'breach';
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  status: 'success' | 'failure';
}

// Professional Services Types
export type ServiceType = 'onboarding' | 'training' | 'consulting' | 'support';

export interface ProfessionalService {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  duration: string;
  price?: string;
  features: string[];
  targetAudience: string[];
  prerequisites?: string[];
  outcomes: string[];
  createdAt: Date;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  organizationId: string;
  serviceId: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  requestedAt: Date;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  assignedTo?: string;
  completionNotes?: string;
}

export interface ServiceDeliveryPlan {
  id: string;
  requestId: string;
  phases: ServicePhase[];
  timeline: Timeline;
  resources: ServiceResource[];
  successCriteria: string[];
  risks: string[];
}

export interface ServicePhase {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  activities: string[];
  deliverables: string[];
  startDate?: Date;
  endDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Timeline {
  projectStart: Date;
  projectEnd: Date;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed';
}

export interface ServiceResource {
  id: string;
  name: string;
  role: string;
  allocation: number; // percentage
  expertise: string[];
  availability: string;
}

export interface ServiceMetrics {
  requestId: string;
  completionPercentage: number;
  qualityScore: number;
  customerSatisfaction: number;
  onTimeDays: number;
  withoutIssues: boolean;
  deliverables: {
    completed: number;
    total: number;
  };
}

// API Response Types
export interface EnterpriseAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

export interface RBACResponse extends EnterpriseAPIResponse<{
  roles: Role[];
  permissions: Permission[];
  assignments: RoleAssignment[];
}> {}

export interface ZeroTrustResponse extends EnterpriseAPIResponse<{
  devices: DeviceProfile[];
  trustScores: DeviceTrustScore[];
  accessDecision: AccessDecision;
  riskFactors: string[];
}> {}

export interface ComplianceResponse extends EnterpriseAPIResponse<{
  dataSubjects: DataSubject[];
  consents: ConsentRecord[];
  privacyRights: PrivacyRight[];
  auditTrail: AuditTrailEntry[];
  score: number;
  status: 'compliant' | 'non_compliant' | 'in_progress';
}> {}

export interface ServicesResponse extends EnterpriseAPIResponse<{
  services: ProfessionalService[];
  requests: ServiceRequest[];
  deliveryPlans: ServiceDeliveryPlan[];
}> {}
