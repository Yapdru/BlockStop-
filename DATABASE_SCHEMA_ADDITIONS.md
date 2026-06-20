# BlockStop Database Schema Additions
## Phases 27.2 & 27.3 Implementation

---

## Phase 27.2: Analytics & Threat Intelligence Schema

### Table: `analytics_metrics`
Stores aggregated metrics for dashboards and historical tracking.

```sql
CREATE TABLE analytics_metrics (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  metric_type VARCHAR(50) NOT NULL,  -- 'threat_count', 'detection_rate', etc.
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR(20),
  dimension_threat_type VARCHAR(50),  -- optional breakdown
  dimension_severity VARCHAR(20),     -- optional breakdown
  time_bucket TIMESTAMP NOT NULL,     -- for efficient aggregation
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT valid_value CHECK (metric_value >= 0)
);

CREATE INDEX idx_analytics_metrics_org_time 
  ON analytics_metrics(organization_id, time_bucket DESC);
CREATE INDEX idx_analytics_metrics_type_time 
  ON analytics_metrics(metric_type, time_bucket DESC);
```

### Table: `threat_patterns`
Stores detected threat behavior patterns and signatures.

```sql
CREATE TABLE threat_patterns (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  external_id VARCHAR(100) UNIQUE,  -- unique identifier for pattern
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern_type VARCHAR(50),  -- 'behavioral', 'infrastructure', 'temporal'
  indicators JSONB NOT NULL,  -- array of {ioc, type, frequency, confidence}
  match_count INTEGER DEFAULT 0,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  severity VARCHAR(20),  -- 'critical', 'high', 'medium', 'low'
  linked_campaign_id VARCHAR(100),
  mitre_ttps TEXT[],  -- MITRE ATT&CK technique IDs
  first_seen TIMESTAMP,
  last_matched TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_threat_patterns_org_created 
  ON threat_patterns(organization_id, created_at DESC);
CREATE INDEX idx_threat_patterns_severity 
  ON threat_patterns(organization_id, severity);
CREATE INDEX idx_threat_patterns_campaign 
  ON threat_patterns(organization_id, linked_campaign_id);
```

### Table: `threat_correlations`
Stores computed correlations between threats.

```sql
CREATE TABLE threat_correlations (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  threat_id_1 INTEGER NOT NULL,
  threat_id_2 INTEGER NOT NULL,
  correlation_type VARCHAR(50),  -- 'temporal', 'behavioral', 'infrastructure'
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  relationship_score NUMERIC,
  common_attributes JSONB,  -- shared IOCs, infrastructure, TTPs
  correlation_group_id BIGINT,  -- reference to larger grouping
  computed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,  -- cache expiration
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (threat_id_1) REFERENCES threats(id) ON DELETE CASCADE,
  FOREIGN KEY (threat_id_2) REFERENCES threats(id) ON DELETE CASCADE,
  UNIQUE(threat_id_1, threat_id_2) -- prevent duplicates
);

CREATE INDEX idx_threat_correlations_org 
  ON threat_correlations(organization_id, computed_at DESC);
CREATE INDEX idx_threat_correlations_group 
  ON threat_correlations(organization_id, correlation_group_id);
```

### Table: `correlation_groups`
Stores threat clusters identified through correlation analysis.

```sql
CREATE TABLE correlation_groups (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  threat_ids INTEGER[] NOT NULL,  -- array of threat IDs
  correlation_score NUMERIC CHECK (correlation_score >= 0 AND correlation_score <= 100),
  common_pattern TEXT,
  estimated_campaign_id VARCHAR(100),
  severity VARCHAR(20),
  detected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_correlation_groups_org_date 
  ON correlation_groups(organization_id, detected_at DESC);
CREATE INDEX idx_correlation_groups_campaign 
  ON correlation_groups(organization_id, estimated_campaign_id);
```

### Table: `health_scores`
Stores organization security health scores and component breakdowns.

```sql
CREATE TABLE health_scores (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  detection_score NUMERIC,
  prevention_score NUMERIC,
  response_score NUMERIC,
  visibility_score NUMERIC,
  trend_direction VARCHAR(20),  -- 'improving', 'stable', 'declining'
  trend_percent_change NUMERIC,
  calculated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_health_scores_org_date 
  ON health_scores(organization_id, calculated_at DESC);
```

### Table: `threat_campaigns`
Advanced threat intelligence: tracks attack campaigns and threat actors.

```sql
CREATE TABLE threat_campaigns (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  aliases TEXT[],
  description TEXT,
  attacked_sectors TEXT[],
  attacked_countries TEXT[],
  threat_actor_ids VARCHAR(100)[],
  ttps TEXT[],  -- MITRE ATT&CK technique IDs
  indicator_ids INTEGER[],  -- IOC IDs
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  related_campaign_ids VARCHAR(100)[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threat_campaigns_active 
  ON threat_campaigns(active, start_date DESC);
CREATE INDEX idx_threat_campaigns_sectors 
  ON threat_campaigns USING GIN(attacked_sectors);
```

### Table: `threat_enrichments`
Stores enrichment data for IOCs (reputation, geoIP, malware analysis, etc.).

```sql
CREATE TABLE threat_enrichments (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  ioc_id INTEGER NOT NULL,
  enrichment_type VARCHAR(50),  -- 'reputation', 'geo', 'malware', 'vulnerability'
  enrichment_data JSONB NOT NULL,
  confidence_score NUMERIC,
  source VARCHAR(100),  -- 'virustotal', 'maxmind', 'shodan', etc.
  last_enriched TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,  -- cache expiration
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (ioc_id) REFERENCES indicators(id) ON DELETE CASCADE
);

CREATE INDEX idx_threat_enrichments_ioc 
  ON threat_enrichments(ioc_id, enrichment_type);
CREATE INDEX idx_threat_enrichments_org_type 
  ON threat_enrichments(organization_id, enrichment_type);
```

### Table: `export_jobs`
Tracks report generation and export status.

```sql
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  report_type VARCHAR(50),  -- 'threat-summary', 'incident-report', etc.
  format VARCHAR(20),  -- 'pdf', 'xlsx', 'csv', 'json'
  status VARCHAR(20),  -- 'queued', 'processing', 'completed', 'failed'
  progress_percent INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  request_payload JSONB,
  result_url TEXT,
  result_file_name VARCHAR(255),
  result_file_size BIGINT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_export_jobs_org_status 
  ON export_jobs(organization_id, status);
CREATE INDEX idx_export_jobs_user 
  ON export_jobs(user_id, created_at DESC);
CREATE INDEX idx_export_jobs_expires 
  ON export_jobs(expires_at) WHERE status = 'completed';
```

---

## Phase 27.3: Enterprise Features Schema

### Table: `organizations`
Extended organization management for multi-tenancy (new columns).

```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS (
  tier VARCHAR(20) DEFAULT 'PRO',  -- 'PRO', 'NEO', 'MAX'
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'suspended', 'archived'
  sso_enabled BOOLEAN DEFAULT false,
  saml_required BOOLEAN DEFAULT false,
  whitelabeling_enabled BOOLEAN DEFAULT false,
  api_management_enabled BOOLEAN DEFAULT false,
  audit_logging_retention_days INTEGER DEFAULT 90,
  ip_whitelist_enabled BOOLEAN DEFAULT false,
  ip_whitelist INET[],
  session_timeout_minutes INTEGER DEFAULT 60,
  settings JSONB
);

CREATE INDEX idx_organizations_tier_status 
  ON organizations(tier, status);
```

### Table: `roles`
Role-based access control with custom and built-in roles.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT true,
  is_built_in BOOLEAN DEFAULT false,
  permissions JSONB NOT NULL,  -- array of {resource, actions, conditions}
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_roles_org_builtin 
  ON roles(organization_id, is_built_in);
```

### Table: `user_roles`
Maps users to roles within organizations (many-to-many).

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_id UUID NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_org_user 
  ON user_roles(organization_id, user_id);
CREATE INDEX idx_user_roles_role 
  ON user_roles(role_id);
```

### Table: `sso_configurations`
Stores SSO/SAML provider configurations.

```sql
CREATE TABLE sso_configurations (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,  -- 'okta', 'azure-ad', 'google', 'custom'
  enabled BOOLEAN DEFAULT false,
  saml_required BOOLEAN DEFAULT false,
  config JSONB NOT NULL,  -- encrypted in application layer
    -- contains: entityId, ssoUrl, cert, clientId, clientSecret, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_validated_at TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sso_configurations_org_enabled 
  ON sso_configurations(organization_id, enabled);
```

### Table: `audit_logs`
Comprehensive audit trail for compliance and security reviews.

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,  -- create, update, delete, login, role_assignment
  resource VARCHAR(100) NOT NULL,  -- user, threat, role, integration, organization
  resource_id VARCHAR(255),
  status VARCHAR(20),  -- 'success', 'failure'
  ip_address INET,
  user_agent TEXT,
  before_state JSONB,  -- snapshot of previous state
  after_state JSONB,   -- snapshot of new state
  changes_summary TEXT,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Critical for audit log queries
CREATE INDEX idx_audit_logs_org_timestamp 
  ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_org_action 
  ON audit_logs(organization_id, action);
CREATE INDEX idx_audit_logs_org_resource 
  ON audit_logs(organization_id, resource);
CREATE INDEX idx_audit_logs_user 
  ON audit_logs(user_id, timestamp DESC);

-- Partitioning for performance (monthly)
CREATE TABLE audit_logs_2024_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
-- Create additional partitions as needed
```

### Table: `enterprise_api_keys`
Organization-level API keys with rate limiting and scopes.

```sql
CREATE TABLE enterprise_api_keys (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,  -- bcrypt hash
  secret_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  scopes TEXT[] NOT NULL,
  rate_limit_requests_per_minute INTEGER,
  rate_limit_requests_per_hour INTEGER,
  rate_limit_requests_per_day INTEGER,
  rate_limit_burst_allowance INTEGER,
  ip_whitelist INET[],
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_by INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_enterprise_api_keys_org 
  ON enterprise_api_keys(organization_id, is_active);
CREATE INDEX idx_enterprise_api_keys_hash 
  ON enterprise_api_keys(key_hash);
```

### Table: `webhooks`
Enterprise webhooks for event delivery and integration.

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,  -- for HMAC signing
  headers JSONB,  -- custom headers
  max_retries INTEGER DEFAULT 5,
  initial_delay_ms INTEGER DEFAULT 1000,
  max_delay_ms INTEGER DEFAULT 60000,
  backoff_multiplier NUMERIC DEFAULT 2.0,
  active BOOLEAN DEFAULT true,
  last_delivery_at TIMESTAMP,
  last_delivery_status VARCHAR(20),
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_webhooks_org_active 
  ON webhooks(organization_id, active);
```

### Table: `webhook_deliveries`
Tracks individual webhook delivery attempts for debugging.

```sql
CREATE TABLE webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_id UUID NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  status VARCHAR(20),  -- 'pending', 'delivered', 'failed', 'dlq'
  http_status_code INTEGER,
  response_body TEXT,
  attempt_number INTEGER,
  last_error TEXT,
  next_retry_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhook_deliveries_webhook_status 
  ON webhook_deliveries(webhook_id, status);
CREATE INDEX idx_webhook_deliveries_retry 
  ON webhook_deliveries(next_retry_at) WHERE status = 'pending';
```

### Table: `white_label_branding`
Stores white-labeling and customization settings.

```sql
CREATE TABLE white_label_branding (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL UNIQUE,
  company_name VARCHAR(255),
  company_logo_url TEXT,
  fav_icon_url TEXT,
  primary_color VARCHAR(7),  -- hex color
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  custom_domain VARCHAR(255),
  terms_url TEXT,
  privacy_url TEXT,
  support_email VARCHAR(255),
  email_template_id VARCHAR(100),
  dashboard_theme VARCHAR(20),  -- 'light', 'dark', 'custom'
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_white_label_branding_org 
  ON white_label_branding(organization_id);
```

### Table: `licenses`
License management and feature entitlements.

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL UNIQUE,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL,  -- 'PRO', 'NEO', 'MAX'
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  max_users INTEGER,
  max_scans INTEGER,
  max_storage_gb INTEGER,
  features JSONB,  -- array of {name, enabled, limit, usage, expiresAt}
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'expired', 'revoked', 'grace_period'
  auto_renewal BOOLEAN DEFAULT true,
  last_validation_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_licenses_org_status 
  ON licenses(organization_id, status);
CREATE INDEX idx_licenses_expires 
  ON licenses(expires_at);
```

### Table: `enterprise_integrations`
Enterprise-grade integrations with SIEM, SOAR, ticketing, etc.

```sql
CREATE TABLE enterprise_integrations (
  id UUID PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  integration_type VARCHAR(50),  -- 'siem', 'soar', 'ticketing', 'edr', 'cloud'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  config JSONB NOT NULL,  -- encrypted in app layer
  authentication_type VARCHAR(50),  -- 'api_key', 'oauth', 'basic', 'custom'
  enabled BOOLEAN DEFAULT true,
  health_status VARCHAR(20) DEFAULT 'unknown',  -- 'healthy', 'degraded', 'unhealthy'
  last_sync_at TIMESTAMP,
  last_error TEXT,
  mappings JSONB,  -- field mappings: source -> destination
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, integration_type, name)
);

CREATE INDEX idx_enterprise_integrations_org 
  ON enterprise_integrations(organization_id, enabled);
```

### Table: `integration_health_metrics`
Tracks health and performance of integrations.

```sql
CREATE TABLE integration_health_metrics (
  id BIGSERIAL PRIMARY KEY,
  integration_id UUID NOT NULL,
  status VARCHAR(20),  -- 'healthy', 'degraded', 'unhealthy'
  latency_ms NUMERIC,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  checked_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (integration_id) REFERENCES enterprise_integrations(id) ON DELETE CASCADE
);

CREATE INDEX idx_integration_health_metrics_integration 
  ON integration_health_metrics(integration_id, checked_at DESC);
```

---

## Data Migration Strategy

### Phase 1: Schema Preparation (pre-deployment)
1. Create all new tables in staging environment
2. Validate indices and constraints
3. Test data flow with sample data
4. Create rollback procedures

### Phase 2: Zero-Downtime Deployment
```sql
-- 1. Add new columns to existing tables (backwards compatible)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tier VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20);
-- These are non-blocking operations

-- 2. Create new tables with FK constraints
CREATE TABLE IF NOT EXISTS roles (...);
CREATE TABLE IF NOT EXISTS user_roles (...);
-- Other new tables...

-- 3. Backfill data from existing tables
INSERT INTO user_roles (organization_id, user_id, role_id)
SELECT org_id, id, (SELECT id FROM roles WHERE is_built_in = true AND name = 'admin' LIMIT 1)
FROM users;

-- 4. Validate data integrity
SELECT COUNT(*) FROM user_roles;  -- verify counts match

-- 5. Enable new FK constraints
ALTER TABLE user_roles ADD CONSTRAINT check_assignments
  CHECK (user_id IS NOT NULL AND role_id IS NOT NULL);
```

### Phase 3: Post-Deployment Cleanup
1. Remove unused columns (if any)
2. Archive old audit logs to cold storage
3. Reindex heavily-used tables
4. Update statistics for query planner

---

## Index Strategy

### Query Performance Optimization
```sql
-- For analytics aggregation queries (most common access pattern)
CREATE INDEX CONCURRENTLY idx_analytics_metrics_org_type_time 
  ON analytics_metrics(organization_id, metric_type, time_bucket DESC);

-- For audit log retrieval (large dataset expected)
CREATE INDEX CONCURRENTLY idx_audit_logs_org_user_time 
  ON audit_logs(organization_id, user_id, timestamp DESC);

-- For threat correlation lookups
CREATE INDEX CONCURRENTLY idx_correlations_group 
  ON threat_correlations(correlation_group_id);

-- For API key lookups (frequent auth checks)
CREATE INDEX CONCURRENTLY idx_api_keys_hash 
  ON enterprise_api_keys(key_hash);

-- JSONB queries for flexible config storage
CREATE INDEX CONCURRENTLY idx_sso_config_provider 
  ON sso_configurations USING GIN(config);
```

### Partition Strategy for Large Tables
```sql
-- Audit logs: monthly partitions
CREATE TABLE audit_logs_2024_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

-- Webhook deliveries: quarterly partitions
CREATE TABLE webhook_deliveries_2024_q2 PARTITION OF webhook_deliveries
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Analytics metrics: monthly time-based bucketing
-- Already uses time_bucket column, no need for partition
```

---

## Retention & Cleanup Policies

```sql
-- Cleanup expired exports daily
DELETE FROM export_jobs WHERE expires_at < NOW() AND status = 'completed';

-- Archive old audit logs (configurable per org, default 90 days)
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs 
WHERE organization_id = $1 
  AND timestamp < NOW() - INTERVAL '1 year';

DELETE FROM audit_logs 
WHERE organization_id = $1 
  AND timestamp < NOW() - INTERVAL '1 year';

-- Clean up failed webhook deliveries after 30 days
DELETE FROM webhook_deliveries 
WHERE status = 'failed' 
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## Migration Scripts

### Create All New Tables Script
```bash
#!/bin/bash
# migration_001_create_analytics_tables.sql
psql -U blockstop -d blockstop -f analytics_tables.sql
psql -U blockstop -d blockstop -f enterprise_tables.sql
psql -U blockstop -d blockstop -f create_indices.sql
```

### Rollback Script
```bash
#!/bin/bash
# rollback_001.sql
-- Drop new tables (in reverse order of creation)
DROP TABLE IF EXISTS integration_health_metrics;
DROP TABLE IF EXISTS enterprise_integrations;
DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS white_label_branding;
DROP TABLE IF EXISTS webhook_deliveries;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS enterprise_api_keys;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS sso_configurations;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
-- ... etc
```

