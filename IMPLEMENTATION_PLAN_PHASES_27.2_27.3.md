# BlockStop Implementation Plan: Phases 27.2 & 27.3

## Phase 27.2: Analytics & Threat Intelligence (4 Pages)

### 1. Overview
Phase 27.2 delivers advanced analytics and threat intelligence capabilities with real-time threat correlation, predictive analysis, and enterprise-grade reporting. The phase extends existing threat intelligence infrastructure with deep analytics, machine learning models, and automated threat hunting capabilities.

**Tier Access:** PRO (analytics base), NEO (advanced), MAX (all features)

---

### 2. File Structure & Directory Organization

```
/app
  /(app)
    /analytics                              # New analytics feature area
      /dashboard/page.tsx                   # Main analytics dashboard
      /threat-patterns/page.tsx             # Threat behavior patterns
      /correlation/page.tsx                 # Threat correlation analysis
      /exports/page.tsx                     # Report generation & export
    /threat-intelligence                    # Reorganized TI feature area
      /indicators-advanced/page.tsx         # Enhanced indicator search
      /campaigns/page.tsx                   # Attack campaign tracking
      /enrichment/page.tsx                  # Threat enrichment analysis
  /api
    /analytics                              # Analytics API endpoints
      /dashboard-metrics/route.ts           # Analytics metrics endpoint
      /threat-patterns/route.ts             # Pattern analysis endpoint
      /correlation/route.ts                 # Threat correlation endpoint
      /exports/route.ts                     # Report export endpoint
      /health-score/route.ts                # Security health scoring
      /predictions/route.ts                 # ML-driven predictions
    /threat-intelligence                    # Enhanced TI API endpoints
      /campaigns/route.ts                   # Campaign management
      /enrichment/route.ts                  # Enrichment service
      /misp-sync/route.ts                   # MISP synchronization
      /stix-export/route.ts                 # STIX format export
  /components
    /analytics                              # Analytics UI components
      /ThreatPatternChart.tsx               # Pattern visualization
      /CorrelationGraph.tsx                 # Threat correlation graph
      /HealthScoreCard.tsx                  # Security health indicator
      /TimelineAnalysis.tsx                 # Temporal threat analysis
      /GeoThreatMap.tsx                     # Geographic threat display
      /ThreatTrendChart.tsx                 # Threat trend indicators
    /threat-intelligence-advanced           # Advanced TI components
      /CampaignTimeline.tsx                 # Attack campaign timeline
      /EnrichmentPanel.tsx                  # Threat enrichment display
      /IOCRelationshipGraph.tsx             # IOC relationships
      /ThreatActorProfile.tsx               # Threat actor information

/lib
  /analytics                                # New analytics service layer
    /dashboard-service.ts                   # Dashboard metric aggregation
    /threat-pattern-analyzer.ts             # Pattern detection & analysis
    /correlation-engine-enhanced.ts         # Enhanced correlation logic
    /health-scorer.ts                       # Security health calculation
    /export-service.ts                      # Report generation
    /forecast-engine.ts                     # Threat forecasting
  /threat-intelligence                      # Enhanced TI services
    /campaign-tracker.ts                    # Campaign management
    /enrichment-service.ts                  # Threat enrichment
    /misp-integration.ts                    # MISP connector
    /stix-formatter.ts                      # STIX export formatter
    /threat-actor-db.ts                     # Threat actor database

/types
  /analytics.ts                             # Analytics type definitions
  /threat-intelligence-advanced.ts          # Advanced TI types
```

---

### 3. TypeScript Interfaces & Types

#### `/types/analytics.ts`
```typescript
// Analytics Core Types
export interface AnalyticsDashboardMetrics {
  timeRange: TimeRange;
  threatCount: ThreatCountMetrics;
  detectionRate: DetectionRateMetric;
  incidentTrend: TrendData[];
  topThreats: TopThreatData[];
  topSources: TopSourceData[];
  riskScore: RiskScoreMetric;
  complianceScore: ComplianceMetric;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface ThreatCountMetrics {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface DetectionRateMetric {
  rate: number;  // percentage
  previousRate: number;
  comparison: 'improved' | 'degraded' | 'stable';
  evadedCount: number;
}

export interface TrendData {
  timestamp: Date;
  value: number;
  threatType?: string;
  confidence?: number;
}

export interface TopThreatData {
  threatId: number;
  name: string;
  type: string;
  frequency: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastDetected: Date;
  affectedCount: number;
}

export interface TopSourceData {
  source: string;
  country?: string;
  threatCount: number;
  blockCount: number;
  riskScore: number;
  asn?: string;
}

export interface RiskScoreMetric {
  overallScore: number;  // 0-100
  vulnerabilityScore: number;
  exposureScore: number;
  historicalScore: number;
  trend: number;  // percentage change
}

export interface ComplianceMetric {
  score: number;  // 0-100
  framework: string;
  lastAudit: Date;
  gaps: ComplianceGap[];
}

export interface ComplianceGap {
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'in-progress';
  remediation?: string;
}

// Threat Patterns
export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  indicators: PatternIndicator[];
  matchCount: number;
  confidence: number;
  lastMatched: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  linkedCampaigns: string[];
}

export interface PatternIndicator {
  type: 'ioc' | 'behavior' | 'characteristic';
  value: string;
  frequency: number;
  confidence: number;
}

// Threat Correlation
export interface ThreatCorrelation {
  threatIds: number[];
  correlationType: 'temporal' | 'behavioral' | 'infrastructure';
  confidence: number;
  commonAttributes: Record<string, unknown>;
  relationshipScore: number;
  linkedCampaignId?: string;
}

export interface CorrelationGroup {
  groupId: string;
  threats: number[];
  correlationScore: number;
  commonPattern: string;
  estimatedCampaign?: string;
  severity: string;
}

// Health Scoring
export interface HealthScore {
  organizationId: number;
  overallScore: number;  // 0-100
  timestamp: Date;
  components: {
    detection: HealthComponent;
    prevention: HealthComponent;
    response: HealthComponent;
    visibility: HealthComponent;
  };
  trends: HealthTrend[];
  recommendations: HealthRecommendation[];
}

export interface HealthComponent {
  score: number;
  trend: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdated: Date;
}

export interface HealthTrend {
  metric: string;
  score: number;
  timestamp: Date;
}

export interface HealthRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  estimatedImpact: number;  // score improvement points
}

// Export/Reporting
export interface ExportRequest {
  reportType: 'threat-summary' | 'incident-report' | 'compliance' | 'executive';
  format: 'pdf' | 'json' | 'csv' | 'xlsx';
  timeRange: TimeRange;
  includeCharts: boolean;
  includeRawData: boolean;
  recipients?: string[];
}

export interface ExportResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  format: string;
  url?: string;
  fileName: string;
  createdAt: Date;
  expiresAt: Date;
  error?: string;
}

// Predictions & Forecasting
export interface ThreatPrediction {
  threatType: string;
  predictionPeriod: 'next-week' | 'next-month' | 'next-quarter';
  likelihood: number;  // 0-100
  expectedCount: number;
  confidence: number;
  factors: PredictionFactor[];
  recommendedActions: string[];
}

export interface PredictionFactor {
  name: string;
  weight: number;
  contribution: number;
}
```

#### `/types/threat-intelligence-advanced.ts`
```typescript
// Advanced Threat Intelligence Types

export interface ThreatCampaign {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  attackedSectors: string[];
  attackedCountries: string[];
  threatActors: string[];
  ttps: string[];  // MITRE ATT&CK techniques
  indicators: number[];  // IOC IDs
  timeline: CampaignTimeline[];
  startDate: Date;
  endDate?: Date;
  active: boolean;
  confidence: number;
  relatedCampaigns: string[];
}

export interface CampaignTimeline {
  date: Date;
  action: string;
  description: string;
  indicatorsObserved?: number[];
}

export interface ThreatActorProfile {
  id: string;
  name: string;
  aliases: string[];
  type: 'individual' | 'group' | 'nation-state' | 'hacktivist';
  country?: string;
  firstSeen: Date;
  lastSeen: Date;
  description: string;
  capabilities: string[];
  motivation: string;
  targetedSectors: string[];
  knownCampaigns: string[];
  ttp: string[];
  tools: string[];
}

export interface ThreatEnrichment {
  iocId: number;
  ioc: string;
  type: string;
  enrichmentData: {
    threatIntel: ThreatIntelData;
    geoLocation?: GeoLocation;
    malwareAnalysis?: MalwareAnalysisData;
    vulnerabilities?: VulnerabilityData[];
    whois?: WhoisData;
    reputation?: ReputationData;
  };
  lastEnriched: Date;
  source: string;
  confidence: number;
}

export interface ThreatIntelData {
  knownMalware: string[];
  campaigns: string[];
  threatActors: string[];
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
}

export interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  latitude: number;
  longitude: number;
  asn: string;
  ispName: string;
}

export interface MalwareAnalysisData {
  familyName: string;
  signatures: string[];
  behaviors: string[];
  c2Servers: string[];
  droppedFiles: string[];
  exportedFunctions?: string[];
}

export interface VulnerabilityData {
  cveId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  exploitStatus: 'unproven' | 'proof-of-concept' | 'functional' | 'in-the-wild';
}

export interface WhoisData {
  registrar: string;
  registrationDate: Date;
  expirationDate: Date;
  registrant?: string;
}

export interface ReputationData {
  abuseScore: number;  // 0-100
  spamScore: number;
  malwareScore: number;
  phishingScore: number;
  sources: string[];
}

// MISP Integration
export interface MISPEvent {
  uuid: string;
  timestamp: Date;
  date: Date;
  threatLevel: number;
  published: boolean;
  attributes: MISPAttribute[];
  objects: MISPObject[];
}

export interface MISPAttribute {
  uuid: string;
  type: string;
  value: string;
  category: string;
  toIds: boolean;
}

export interface MISPObject {
  uuid: string;
  objectName: string;
  attributes: MISPAttribute[];
}

// STIX Export
export interface STIXBundle {
  type: 'bundle';
  id: string;
  objects: STIXObject[];
}

export interface STIXObject {
  type: string;
  id: string;
  created: Date;
  modified: Date;
  [key: string]: unknown;
}

export interface STIXIndicator extends STIXObject {
  type: 'indicator';
  pattern: string;
  validFrom: Date;
  validUntil?: Date;
  labels: string[];
}
```

---

### 4. Component Hierarchy

#### Analytics Dashboard Components
```
AnalyticsDashboard/
├── Dashboard Layout (responsive grid)
│   ├── MetricsSummary (top KPIs)
│   │   ├── ThreatCountCard
│   │   ├── DetectionRateCard
│   │   ├── HealthScoreCard
│   │   └── RiskScoreCard
│   ├── ThreatTrendSection
│   │   ├── LineChart (threat trends over time)
│   │   └── TimeGranularitySelector
│   ├── TopThreatsTable
│   │   ├── DataTable with sorting/filtering
│   │   └── DrillDownLinks
│   ├── GeoThreatMap
│   │   ├── InteractiveMap
│   │   └── SourceCountryFilter
│   ├── DetectionMetrics
│   │   ├── BarChart (detection rate)
│   │   └── AnomalyHighlight
│   └── ComplianceOverview
│       └── ProgressIndicators
```

#### Threat Pattern Components
```
ThreatPatternAnalysis/
├── PatternList
│   ├── PatternCard (each pattern)
│   │   ├── IndicatorDisplay
│   │   └── MatchStatistics
│   └── PatternSearch & Filter
├── PatternTimeline
│   ├── TimelineVisualization
│   └── MatchEventDetail
└── PatternRelationships
    └── RelationshipGraph
```

#### Threat Correlation Components
```
CorrelationAnalysis/
├── CorrelationMatrix
│   ├── HeatmapChart
│   └── InteractiveSelection
├── CorrelationGroups
│   ├── GroupCard
│   └── GroupDetails
└── RelationshipVisualization
    ├── NetworkGraph
    └── AttributeComparison
```

---

### 5. API Route Design (Phase 27.2)

#### Analytics API Routes

**1. GET `/api/analytics/dashboard-metrics`**
- **Purpose:** Fetch comprehensive dashboard metrics
- **Query Params:** `timeRange=week|month|quarter`, `format=summary|detailed`
- **Tier Access:** PRO (summary), NEO (detailed), MAX (all)
- **Response:** `AnalyticsDashboardMetrics`
- **Rate Limit:** 60 req/min (PRO), 300 req/min (NEO/MAX)

**2. POST `/api/analytics/threat-patterns`**
- **Purpose:** Analyze threat patterns from recent activity
- **Body:** `{ timeRange, minimumConfidence, includeRelated }`
- **Tier Access:** NEO, MAX
- **Response:** `{ patterns: ThreatPattern[], summary }`
- **Rate Limit:** 30 req/min

**3. POST `/api/analytics/correlation`**
- **Purpose:** Perform threat correlation analysis
- **Body:** `{ threatIds, correlationType, timeWindow }`
- **Tier Access:** NEO (limited), MAX (unlimited)
- **Response:** `{ correlations: CorrelationGroup[] }`
- **Rate Limit:** 20 req/min

**4. GET `/api/analytics/health-score`**
- **Purpose:** Get organization security health score
- **Query Params:** `detailed=true|false`, `trends=true|false`
- **Tier Access:** PRO+
- **Response:** `HealthScore`
- **Rate Limit:** 300 req/min

**5. POST `/api/analytics/exports`**
- **Purpose:** Generate and export analytical reports
- **Body:** `ExportRequest`
- **Tier Access:** PRO (basic), NEO (standard), MAX (all)
- **Response:** `{ exportId, status, url }`
- **Rate Limit:** 10 req/min
- **Async:** Returns `202 Accepted`, use polling/webhook

**6. GET `/api/analytics/predictions`**
- **Purpose:** Get threat predictions and forecasts
- **Query Params:** `threatType, period=week|month|quarter`
- **Tier Access:** MAX only
- **Response:** `{ predictions: ThreatPrediction[] }`
- **Rate Limit:** 60 req/min

---

## Phase 27.3: Enterprise Features (3 Pages)

### 1. Overview
Phase 27.3 delivers enterprise-grade capabilities including multi-tenancy support, advanced RBAC, SSO/SAML, audit logging, API management, and white-labeling options. Targets organizations with 100+ users requiring sophisticated security governance.

**Tier Access:** MAX only (enterprise-exclusive)

---

### 2. File Structure & Directory Organization

```
/app
  /(app)
    /enterprise                             # Enterprise feature area
      /organizations/page.tsx               # Organization management
      /rbac/page.tsx                        # Role-based access control
      /sso-setup/page.tsx                   # SSO/SAML configuration
      /audit-logs/page.tsx                  # Comprehensive audit trails
      /api-management/page.tsx              # API key & webhook management
      /branding/page.tsx                    # White-label customization
      /integrations-advanced/page.tsx       # Enterprise integrations
      /licensing/page.tsx                   # License management
  /api
    /enterprise                             # Enterprise API endpoints
      /organizations/route.ts               # Organization CRUD
      /rbac/route.ts                        # Role management
      /sso/route.ts                         # SSO configuration
      /audit-logs/route.ts                  # Audit log retrieval
      /api-management/route.ts              # API key management
      /webhooks/route.ts                    # Webhook management
      /branding/route.ts                    # Branding configuration
      /licensing/route.ts                   # License management
      /integrations/[type]/route.ts         # Enterprise integrations

/components
  /enterprise                               # Enterprise UI components
    /OrganizationManager.tsx                # Org management UI
    /RBACEditor.tsx                         # Role editor interface
    /SSOConfiguration.tsx                   # SSO setup wizard
    /AuditLogViewer.tsx                     # Audit trail viewer
    /APIKeyManager.tsx                      # API key management
    /WhiteLabelConfig.tsx                   # Branding customization
    /LicenseOverview.tsx                    # License status
    /IntegrationMarketplace.tsx             # Integration catalog

/lib
  /enterprise                               # Enterprise services
    /organization-service.ts                # Organization management
    /rbac-service.ts                        # Role-based access control
    /sso-service.ts                         # SSO/SAML handler
    /audit-logger.ts                        # Audit logging
    /api-key-service.ts                     # API key management
    /white-label-service.ts                 # Branding engine
    /license-validator.ts                   # License validation
    /integration-marketplace.ts             # Integration management

/types
  /enterprise.ts                            # Enterprise type definitions
```

---

### 3. TypeScript Interfaces & Types

#### `/types/enterprise.ts`
```typescript
// Organization & Multi-Tenancy
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
  tier: 'PRO' | 'NEO' | 'MAX';
  status: 'active' | 'suspended' | 'archived';
  settings: OrganizationSettings;
  metadata?: Record<string, unknown>;
}

export interface OrganizationSettings {
  ssoEnabled: boolean;
  samlRequired: boolean;
  whitelabelingEnabled: boolean;
  apiManagementEnabled: boolean;
  auditLoggingRetentionDays: number;
  ipWhitelistEnabled: boolean;
  ipWhitelist?: string[];
  sessionTimeoutMinutes: number;
}

// Role-Based Access Control
export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  isCustom: boolean;
  isBuiltIn: boolean;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin' | 'execute';
  fields?: string[];  // field-level access control
  conditions?: Record<string, unknown>;  // conditional access rules
}

export const BUILT_IN_ROLES = {
  ADMIN: 'admin',
  SECURITY_MANAGER: 'security_manager',
  ANALYST: 'analyst',
  AUDITOR: 'auditor',
  VIEWER: 'viewer',
} as const;

export interface UserRole {
  id: string;
  userId: string;
  organizationId: string;
  roleId: string;
  role: Role;
  assignedAt: Date;
  assignedBy: string;
}

// SSO / SAML
export interface SSOConfiguration {
  organizationId: string;
  enabled: boolean;
  samlRequired: boolean;
  provider: 'okta' | 'azure-ad' | 'google' | 'custom';
  config: SSOProviderConfig;
  createdAt: Date;
  updatedAt: Date;
  lastValidated?: Date;
}

export interface SSOProviderConfig {
  entityId: string;
  ssoUrl: string;
  certificateUrl?: string;
  publicCertificate?: string;
  clientId?: string;
  clientSecret?: string;  // encrypted
  discoveryUrl?: string;
  redirectUris: string[];
  signatureAlgorithm?: 'sha1' | 'sha256';
  encryptionEnabled: boolean;
}

export interface SAMLResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  groups?: string[];
  attributes?: Record<string, string>;
}

// Audit Logging
export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown>;  // Previous state
  after?: Record<string, unknown>;   // New state
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  changesSummary?: string;
}

export type AuditAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'failed_login'
  | 'role_assignment' | 'permission_grant'
  | 'sso_configured' | 'api_key_created'
  | 'export_generated' | 'system_config_changed';

export interface AuditQuery {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  status?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

// API Management
export interface EnterpriseAPIKey {
  id: string;
  organizationId: string;
  name: string;
  key: string;  // hashed
  secret: string;  // encrypted, only returned on creation
  scopes: EnterpriseScope[];
  rateLimit: RateLimitConfig;
  ipWhitelist?: string[];
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: string;
  isActive: boolean;
}

export type EnterpriseScope =
  | 'analytics:read'
  | 'threats:read' | 'threats:write' | 'threats:delete'
  | 'scans:read' | 'scans:write'
  | 'audit:read'
  | 'org:admin'
  | 'webhooks:manage'
  | 'integrations:manage';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstAllowance: number;
}

export interface WebhookConfig {
  id: string;
  organizationId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;  // for signing
  headers?: Record<string, string>;
  active: boolean;
  retryPolicy: RetryPolicy;
  createdAt: Date;
}

export type WebhookEvent =
  | 'threat.detected'
  | 'threat.updated'
  | 'threat.resolved'
  | 'scan.completed'
  | 'alert.triggered'
  | 'user.created'
  | 'role.changed';

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// White-Labeling
export interface WhiteLabelBranding {
  organizationId: string;
  companyName: string;
  companyLogo?: string;
  favIcon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain?: string;
  termsUrl?: string;
  privacyUrl?: string;
  supportEmail?: string;
  emailTemplate?: string;
  dashboardTheme: 'light' | 'dark' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

// Licensing
export interface License {
  id: string;
  organizationId: string;
  licenseKey: string;
  tier: 'PRO' | 'NEO' | 'MAX';
  issuedAt: Date;
  expiresAt: Date;
  maxUsers: number;
  maxScans: number;
  maxStorage: number;  // GB
  features: LicenseFeature[];
  status: 'active' | 'expired' | 'revoked' | 'grace_period';
  autoRenewal: boolean;
  lastValidationAt: Date;
}

export interface LicenseFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  usage?: number;
  expiresAt?: Date;
}

export interface LicenseValidation {
  valid: boolean;
  organization: Organization;
  license: License;
  features: LicenseFeature[];
  usagePercentage: Record<string, number>;
  warnings?: string[];
}

// Integration Management
export interface EnterpriseIntegration {
  id: string;
  organizationId: string;
  type: 'siem' | 'soar' | 'ticketing' | 'communication' | 'edr' | 'cloud';
  name: string;
  description: string;
  icon?: string;
  config: Record<string, unknown>;
  authentication: {
    type: 'api_key' | 'oauth' | 'basic' | 'custom';
    credentials: Record<string, unknown>;  // encrypted
  };
  enabled: boolean;
  lastSyncAt?: Date;
  health: 'healthy' | 'degraded' | 'unhealthy';
  mappings?: IntegrationMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationMapping {
  source: string;
  destination: string;
  transform?: string;  // JS expression
}

export interface IntegrationHealth {
  integrationId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  lastCheck: Date;
  errorCount: number;
  successCount: number;
}
```

---

### 4. Component Hierarchy

#### Organization Management
```
OrganizationDashboard/
├── OrganizationList
│   ├── OrgCard
│   │   ├── BasicInfo
│   │   ├── TierBadge
│   │   └── Actions (edit/archive)
│   └── OrgSearch & Filter
├── OrgDetailView
│   ├── SettingsPanel
│   ├── MembersList
│   ├── FeatureToggle
│   └── QuotaDisplay
```

#### RBAC Management
```
RBACDashboard/
├── RolesList
│   ├── RoleCard (built-in & custom)
│   │   ├── PermissionsSummary
│   │   └── MemberCount
│   └── CreateCustomRole
├── RoleEditor
│   ├── PermissionMatrix
│   │   ├── ResourceColumn
│   │   └── ActionCheckboxes
│   └── PreviewMembers
└── UserRoleAssignment
    ├── UserSelector
    └── RoleSelector
```

#### SSO Configuration
```
SSOConfiguration/
├── ProviderSelector
├── SSOSetupWizard
│   ├── ProviderConfig (Okta/Azure/Google)
│   ├── MetadataInput
│   ├── TestConnection
│   └── ConfirmEnable
└── ActiveSSOStatus
    ├── ProviderInfo
    └── DisableOption
```

---

### 5. API Route Design (Phase 27.3)

#### Enterprise API Routes

**1. GET `/api/enterprise/organizations`**
- **Purpose:** List all organizations (admin only)
- **Query Params:** `search, tier, status, limit, offset`
- **Tier Access:** MAX only
- **Response:** `{ organizations: Organization[], total }`
- **Rate Limit:** 300 req/min
- **Audit:** Logged

**2. POST `/api/enterprise/organizations`**
- **Purpose:** Create new organization
- **Body:** `{ name, slug, tier, settings }`
- **Tier Access:** MAX only
- **Response:** `Organization`
- **Rate Limit:** 10 req/min
- **Audit:** Logged with full details

**3. GET `/api/enterprise/rbac/roles`**
- **Purpose:** List organization roles
- **Query Params:** `includePermissions=true, builtInOnly=false`
- **Tier Access:** MAX + org admin
- **Response:** `{ roles: Role[] }`
- **Rate Limit:** 300 req/min

**4. POST `/api/enterprise/rbac/roles`**
- **Purpose:** Create custom role
- **Body:** `{ name, description, permissions }`
- **Tier Access:** MAX + org admin
- **Response:** `Role`
- **Rate Limit:** 50 req/min
- **Audit:** Logged

**5. POST `/api/enterprise/sso/configure`**
- **Purpose:** Configure SSO provider
- **Body:** `SSOConfiguration`
- **Tier Access:** MAX only
- **Response:** `{ configuration: SSOConfiguration, metadataUrl }`
- **Rate Limit:** 10 req/min
- **Audit:** Logged with before/after state

**6. GET `/api/enterprise/audit-logs`**
- **Purpose:** Retrieve audit logs with filtering
- **Query Params:** `action, resource, startDate, endDate, userId, limit, offset`
- **Tier Access:** MAX + auditor role
- **Response:** `{ logs: AuditLog[], total, hasMore }`
- **Rate Limit:** 300 req/min
- **Pagination:** Cursor-based

---

## Integration Points & Architecture

### 1. Tier-Based Access Control Pattern

```typescript
// Middleware tier enforcement
export async function enforceTierAccess(
  req: APIContext,
  requiredTier: 'PRO' | 'NEO' | 'MAX'
): Promise<boolean> {
  const tierHierarchy = { PRO: 1, NEO: 2, MAX: 3 };
  return tierHierarchy[req.userTier] >= tierHierarchy[requiredTier];
}

// Usage in routes
export async function GET(req: NextRequest) {
  const context = await getAPIContext(req);
  
  if (!await enforceTierAccess(context, 'NEO')) {
    return formatError({
      code: APIErrorCode.INSUFFICIENT_SCOPES,
      message: 'Feature requires NEO or MAX tier',
      statusCode: 403,
    }, req);
  }
  
  // Feature logic
}
```

### 2. Database Schema Additions

```sql
-- Analytics tables
CREATE TABLE analytics_metrics (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  metric_type VARCHAR(50),
  value NUMERIC,
  timestamp TIMESTAMP DEFAULT NOW(),
  time_bucket TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE threat_patterns (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  name VARCHAR(255),
  indicators JSONB,
  confidence NUMERIC,
  created_at TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

-- Enterprise tables
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  name VARCHAR(100),
  permissions JSONB,
  is_custom BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  user_id INTEGER,
  action VARCHAR(50),
  resource VARCHAR(100),
  before JSONB,
  after JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE sso_configs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL UNIQUE,
  provider VARCHAR(50),
  config JSONB,
  enabled BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);
```

### 3. Middleware Integration

- **Auth Middleware:** Extend to validate organization context
- **Audit Middleware:** Automatically log all enterprise endpoints
- **Rate Limiter:** Use org-level rate limits instead of key-level
- **RBAC Middleware:** Check permissions against organization roles

### 4. Existing System Integration Points

- **Threat Intelligence:** Analytics correlate with existing IOCs
- **Dashboard:** Embed new analytics cards into existing dashboard
- **API Middleware:** Reuse existing auth structure, extend for enterprise
- **Billing:** Link licenses to existing subscription system
- **Audit Logs:** Store in same database structure, add org context

---

## Implementation Sequence

### Phase 27.2 (Analytics) - 3 weeks
1. Create analytics types and database schema
2. Build dashboard service layer
3. Implement analytics UI components
4. Create API endpoints with tier gates
5. Add threat pattern detection
6. Build correlation engine
7. Add reporting/export features

### Phase 27.3 (Enterprise) - 4 weeks
1. Create organization management infrastructure
2. Implement RBAC with permission system
3. Build SSO/SAML integration layer
4. Create audit logging middleware
5. Build API key management system
6. Add white-labeling capabilities
7. Implement license validation

---

## Key Design Decisions

1. **Async Report Generation:** Uses 202 Accepted pattern with polling/webhooks
2. **Tier Gating:** Consistent enforcement via middleware + runtime checks
3. **Audit Immutability:** Logs stored separately, never modified
4. **SAML Lazy Evaluation:** SAML configs cached, validated on login
5. **Rate Limit Quotas:** Per-organization, not per-API-key
6. **Component Reuse:** Leverage existing chart/layout components

---

## Security Considerations

- All secrets encrypted at rest (SSO config, API secrets, SAML certs)
- Audit logs contain before/after snapshots for compliance
- IP whitelist enforcement at middleware level
- Session timeout configurable per organization
- SAML validation with signature verification
- API key rotation enforced via expiration dates
- Rate limiting prevents abuse of analytics/export endpoints

