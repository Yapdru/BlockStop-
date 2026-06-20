# BlockStop Phases 27.2 & 27.3 - Quick Reference Card

**Print this page for quick access during development**

---

## Phase 27.2: Analytics & Threat Intelligence

### 6 API Endpoints
```
GET    /api/analytics/dashboard-metrics      → Dashboard KPIs
POST   /api/analytics/threat-patterns        → Pattern detection
POST   /api/analytics/correlation            → Threat relationships
GET    /api/analytics/health-score           → Security posture
POST   /api/analytics/exports                → Report generation
GET    /api/analytics/predictions            → ML forecasts
```

### Tier Access
| Endpoint | PRO | NEO | MAX |
|----------|-----|-----|-----|
| Dashboard metrics | ✓ | ✓ | ✓ |
| Threat patterns | ✗ | ✓ | ✓ |
| Correlation | ✗ | ◐ | ✓ |
| Health score | ✓ | ✓ | ✓ |
| Exports | ✓ | ✓ | ✓ |
| Predictions | ✗ | ✗ | ✓ |

### Database Tables
```
analytics_metrics          // Dashboard metrics (time-series)
threat_patterns            // Behavior signatures
threat_correlations        // Threat relationships
correlation_groups         // Threat clusters
health_scores             // Org security scores
threat_campaigns          // Attack campaigns
threat_enrichments        // IOC enrichment data
export_jobs               // Report generation tracking
```

### Key Interfaces
```typescript
AnalyticsDashboardMetrics
ThreatPattern
ThreatCorrelation
HealthScore
ExportRequest / ExportResult
ThreatPrediction
```

### Components (12 total)
```
/components/analytics/
  - ThreatPatternChart
  - CorrelationGraph
  - HealthScoreCard
  - TimelineAnalysis
  - GeoThreatMap
  - ThreatTrendChart

/components/threat-intelligence-advanced/
  - CampaignTimeline
  - EnrichmentPanel
  - IOCRelationshipGraph
  - ThreatActorProfile
```

### Service Layer (8 modules)
```
/lib/analytics/
  - dashboard-service.ts
  - threat-pattern-analyzer.ts
  - correlation-engine-enhanced.ts
  - health-scorer.ts
  - export-service.ts
  - forecast-engine.ts

/lib/threat-intelligence/
  - campaign-tracker.ts
  - enrichment-service.ts
```

---

## Phase 27.3: Enterprise Features

### 6 API Endpoints
```
GET    /api/enterprise/organizations         → List orgs
POST   /api/enterprise/rbac/roles            → Create roles
POST   /api/enterprise/sso/configure         → Setup SSO
GET    /api/enterprise/audit-logs            → Audit trail
POST   /api/enterprise/api-management/keys   → API keys
POST   /api/enterprise/webhooks              → Webhooks
```

### Tier Access
| Endpoint | MAX |
|----------|-----|
| Organizations | ✓ |
| RBAC Roles | ✓ |
| SSO Config | ✓ |
| Audit Logs | ✓ |
| API Keys | ✓ |
| Webhooks | ✓ |

### Database Tables
```
roles                          // Custom + built-in roles
user_roles                     // User-to-role mapping
sso_configurations            // SSO/SAML config
audit_logs                    // Immutable audit trail (partitioned)
enterprise_api_keys           // Org API keys
webhooks                      // Webhook endpoints
webhook_deliveries            // Webhook delivery attempts
white_label_branding          // Customization settings
licenses                      // License management
enterprise_integrations       // Integration catalog
integration_health_metrics    // Integration health
```

### Key Interfaces
```typescript
Organization
Role / Permission
UserRole
SSOConfiguration / SAMLResponse
AuditLog / AuditAction
EnterpriseAPIKey
WebhookConfig / WebhookEvent
WhiteLabelBranding
License / LicenseFeature
EnterpriseIntegration
```

### Components (8 total)
```
/components/enterprise/
  - OrganizationManager
  - RBACEditor
  - SSOConfiguration
  - AuditLogViewer
  - APIKeyManager
  - WhiteLabelConfig
  - LicenseOverview
  - IntegrationMarketplace
```

### Service Layer (6 modules)
```
/lib/enterprise/
  - organization-service.ts
  - rbac-service.ts
  - sso-service.ts
  - audit-logger.ts
  - api-key-service.ts
  - white-label-service.ts
```

---

## Rate Limiting Summary

### Phase 27.2 Endpoints
| Endpoint | PRO | NEO | MAX |
|----------|-----|-----|-----|
| Dashboard metrics | 60 | 300 | ∞ |
| Threat patterns | - | 30 | 30 |
| Correlation | - | 20 | 20 |
| Health score | 300 | 300 | ∞ |
| Exports | 10 | 10 | 10 |
| Predictions | - | - | 60 |

### Phase 27.3 Endpoints
All require MAX tier, rate limit: 10-300 req/min (see docs)

---

## Type File Locations

```
types/
  ├── analytics.ts                    // ~70 interfaces
  ├── threat-intelligence-advanced.ts // ~40 interfaces
  └── enterprise.ts                   // ~40 interfaces
```

---

## Tailwind Color Palette

```css
/* Primary: Blue */
primary-700: #0d47a1
primary-600: #1565dc
primary-500: #1e88ff

/* Accent: Yellow */
accent-500: #ffe500
accent-600: #f5d800

/* Semantic */
success: #4caf50
warning: #ff9800
danger: #f44336

/* Background */
bg-slate-950: Dark backgrounds
bg-slate-900: Card backgrounds
bg-slate-800: Subtle backgrounds
```

---

## Existing Components to Reuse

```typescript
// Charts
LineChart
BarChart
PieChart
AreaChart
Heatmap
GaugeChart
Timeline

// Layouts
DashboardLayout
SidebarNav
TopNav
ResponsiveGrid

// Forms
DataTable
FileUploadForm
DateRangePicker

// Animations
FadeIn
SlideIn
SkeletonLoader
LoadingSpinner
```

---

## API Scopes (Phase 27.2 & 27.3)

```
// Analytics
analytics:read

// Threats
threats:read
threats:write
threats:delete

// Scans
scans:read
scans:write

// Enterprise
audit:read
org:admin
webhooks:manage
integrations:manage
```

---

## Implementation Timeline

### Phase 27.2 (3 weeks)
```
Week 1: Foundations
  ✓ Types + middleware + auth
  ✓ Database schema
  ✓ Dashboard service

Week 2: Core Features
  ✓ Pattern detection
  ✓ Correlation analysis
  ✓ Components

Week 3: Export & Polish
  ✓ Report generation
  ✓ Predictions
  ✓ Testing & docs
```

### Phase 27.3 (4 weeks)
```
Week 1: Foundation
  ✓ Org management
  ✓ RBAC system
  ✓ Database

Week 2: Auth & Audit
  ✓ SSO/SAML
  ✓ Audit logging
  ✓ API routes

Week 3: API & Webhooks
  ✓ API key mgmt
  ✓ Webhook system
  ✓ Rate limiting

Week 4: Polish & Hardening
  ✓ Branding
  ✓ Licensing
  ✓ Security audit
```

---

## Database Indices (Most Important)

```sql
-- Analytics
analytics_metrics_org_time
analytics_metrics_type_time

-- Threats
threat_patterns_org_created
threat_patterns_severity

-- Correlations
threat_correlations_org
threat_correlations_group

-- Audit Logs
audit_logs_org_timestamp  (critical)
audit_logs_org_action
audit_logs_user

-- API Keys
enterprise_api_keys_hash

-- Webhooks
webhooks_org_active
webhook_deliveries_retry
```

---

## Common Response Structure

```typescript
// Success
{
  success: true,
  data: T,
  meta: {
    requestId: string,
    timestamp: Date,
    duration: number,  // ms
    version: 'v1'
  }
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    statusCode: number,
    requestId: string,
    details?: any
  }
}
```

---

## Common Status Values

```
// Threats
Critical, High, Medium, Low

// Audit Actions
create, read, update, delete
login, logout, failed_login
role_assignment, permission_grant
sso_configured, api_key_created

// Delivery Status
pending, delivered, failed, dlq

// Health Status
healthy, degraded, unhealthy

// Export Status
processing, completed, failed

// Organization Status
active, suspended, archived
```

---

## Environment Variables Needed

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_SSL=true

# API
API_RATE_LIMIT_ENABLED=true
CORS_ENABLED=true

# Analytics
ANALYTICS_CACHE_TTL=300
CORRELATION_CACHE_TTL=3600

# Enterprise
AUDIT_LOG_RETENTION_DAYS=90
SSO_ENABLED=true

# Webhooks
WEBHOOK_TIMEOUT_MS=30000
WEBHOOK_MAX_RETRIES=5

# Encryption
ENCRYPTION_KEY=...
WEBHOOK_SECRET_KEY=...
```

---

## Key Decisions Summary

1. **Async Reports:** Use 202 Accepted, client polls for completion
2. **Org Isolation:** All queries filter by `organization_id`
3. **Immutable Audits:** Stored separately, never modified
4. **Component Reuse:** Leverage existing Recharts + Tailwind
5. **Rate Limiting:** Per-organization, not per-API-key
6. **Caching:** 5min analytics, 1h health score, 24h predictions
7. **SAML:** Validate signatures, require HTTPS in production
8. **API Keys:** Format `pk_[org_id]_[random]`, secrets hashed

---

## Common Queries During Development

### Check tier access
```typescript
const canAccess = (userTier: 'PRO'|'NEO'|'MAX', feature: string) => {
  const tiers = { PRO: 1, NEO: 2, MAX: 3 };
  const required = { analytics: 1, patterns: 2, predictions: 3 };
  return tiers[userTier] >= required[feature];
};
```

### Format error response
```typescript
const error = {
  code: 'INSUFFICIENT_SCOPES',
  message: 'Feature requires NEO tier or higher',
  statusCode: 403,
  requestId: req.headers.get('x-request-id') || generateId(),
  timestamp: new Date().toISOString(),
};
```

### Get organization from context
```typescript
const org = await getOrganization(context.orgId);
if (org.tier !== 'MAX') {
  throw new Error('Enterprise features require MAX tier');
}
```

### Validate API key
```typescript
const validation = apiKeyManager.validateKey(token);
if (!validation.valid) {
  return error(401, 'INVALID_API_KEY');
}
const context = {
  userId: validation.apiKey.userId,
  orgId: validation.apiKey.orgId,
  scopes: validation.apiKey.scopes,
};
```

---

## File Checklist Before Starting

### Types
- [ ] /types/analytics.ts
- [ ] /types/threat-intelligence-advanced.ts
- [ ] /types/enterprise.ts

### API Routes
- [ ] /app/api/analytics/dashboard-metrics/route.ts
- [ ] /app/api/analytics/threat-patterns/route.ts
- [ ] /app/api/analytics/correlation/route.ts
- [ ] /app/api/analytics/health-score/route.ts
- [ ] /app/api/analytics/exports/route.ts
- [ ] /app/api/analytics/predictions/route.ts
- [ ] /app/api/enterprise/organizations/route.ts
- [ ] /app/api/enterprise/rbac/roles/route.ts
- [ ] /app/api/enterprise/sso/configure/route.ts
- [ ] /app/api/enterprise/audit-logs/route.ts
- [ ] /app/api/enterprise/api-management/keys/route.ts
- [ ] /app/api/enterprise/webhooks/route.ts

### Services
- [ ] /lib/analytics/* (6 modules)
- [ ] /lib/threat-intelligence/* (2 modules)
- [ ] /lib/enterprise/* (6 modules)

### Components
- [ ] /app/components/analytics/* (6 components)
- [ ] /app/components/threat-intelligence-advanced/* (4 components)
- [ ] /app/components/enterprise/* (8 components)

### Database
- [ ] Migration script: create Phase 27.2 tables
- [ ] Migration script: create Phase 27.3 tables
- [ ] Rollback scripts
- [ ] Index creation scripts

---

## Quick Links

- **Main Plan:** IMPLEMENTATION_PLAN_PHASES_27.2_27.3.md
- **API Details:** API_ENDPOINT_SPECIFICATIONS.md
- **Database:** DATABASE_SCHEMA_ADDITIONS.md
- **Roadmap:** IMPLEMENTATION_SUMMARY.md
- **Index:** PHASES_27.2_27.3_INDEX.md

---

**Print and keep this card at your desk during development!**

Last Updated: June 20, 2026

