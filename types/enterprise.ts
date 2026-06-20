// Enterprise Features Types
export type EnterpriseTier = 'NEO' | 'PRO' | 'MAX';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
  maxRetries: number;
}

export type WebhookEvent =
  | 'threat.detected'
  | 'threat.resolved'
  | 'scan.completed'
  | 'compliance.alert'
  | 'rule.created'
  | 'rule.updated';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'siem' | 'edr' | 'custom' | 'api';
  endpoint: string;
  credentials?: {
    apiKey?: string;
    secret?: string;
    username?: string;
    password?: string;
  };
  enabled: boolean;
  syncInterval?: number;
  lastSyncAt?: Date;
  createdAt: Date;
}

export interface SIEMIntegration extends IntegrationConfig {
  type: 'siem';
  siemType: 'splunk' | 'elastic' | 'azure_sentinel' | 'qradar';
  indexName?: string;
  sourceType?: string;
}

export interface BrandingConfig {
  tier: EnterpriseTier;
  logo?: {
    url: string;
    altText: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
    danger: string;
  };
  customDomain?: string;
  faviconUrl?: string;
  supportEmail?: string;
  websiteUrl?: string;
}

export interface WhiteLabelSettings {
  companyName: string;
  companyLogo?: string;
  branding: BrandingConfig;
  customizationLevel: 'basic' | 'advanced' | 'full';
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFramework {
  id: string;
  name: 'HIPAA' | 'SOC2' | 'GDPR' | 'ISO27001' | 'NIST';
  status: 'not_started' | 'in_progress' | 'compliant' | 'non_compliant';
  score: number;
  lastAuditDate: Date;
  nextAuditDate: Date;
}

export interface ComplianceControl {
  id: string;
  frameworkId: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  evidence: ComplianceEvidence[];
  remediation?: string;
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'log' | 'scan_result' | 'policy';
  url: string;
  timestamp: Date;
  description: string;
}

export interface ComplianceReport {
  id: string;
  framework: 'HIPAA' | 'SOC2' | 'GDPR' | 'ISO27001' | 'NIST';
  generatedAt: Date;
  score: number;
  status: 'compliant' | 'non_compliant' | 'in_progress';
  controls: ComplianceControl[];
  recommendations: string[];
  exportFormats: ('pdf' | 'html' | 'json')[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  userId: number;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  status: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
}

export interface ComplianceDashboard {
  frameworks: ComplianceFramework[];
  overallScore: number;
  controls: ComplianceControl[];
  recentChanges: AuditTrailEntry[];
  alerts: ComplianceAlert[];
}

export interface ComplianceAlert {
  id: string;
  level: 'warning' | 'critical';
  message: string;
  framework: string;
  control: string;
  timestamp: Date;
  resolved: boolean;
}

export interface MiddlewareConfig {
  id: string;
  name: string;
  type: 'authentication' | 'validation' | 'transformation' | 'logging';
  code: string;
  enabled: boolean;
  priority: number;
  createdAt: Date;
  deployment?: {
    status: 'pending' | 'deployed' | 'failed';
    deployedAt?: Date;
    error?: string;
  };
}

export interface APISDKDocumentation {
  version: string;
  endpoints: APIEndpoint[];
  authentication: AuthMethod[];
  rateLimits: RateLimitInfo;
  examples: CodeExample[];
}

export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Parameter[];
  responses: APIResponse[];
  requiresAuth: boolean;
  tierRequired: EnterpriseTier[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface APIResponse {
  status: number;
  contentType: string;
  schema: Record<string, any>;
  example: any;
}

export interface AuthMethod {
  type: 'api_key' | 'oauth2' | 'bearer_token';
  description: string;
  headerName?: string;
  scheme?: string;
}

export interface RateLimitInfo {
  requestsPerMinute: Record<EnterpriseTier, number>;
  burstLimit: Record<EnterpriseTier, number>;
}

export interface CodeExample {
  language: 'javascript' | 'python' | 'curl' | 'java';
  title: string;
  code: string;
}

export interface EnterpriseResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}
