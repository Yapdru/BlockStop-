-- Phase 15a: Platform-Specific Pro Tiers Schema
-- Mobile Pro, Desktop Pro, Web Enterprise tables

-- Mobile Pro: Biometric Sessions Table
CREATE TABLE IF NOT EXISTS biometric_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  biometric_type VARCHAR(20) NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  next_verification_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT true,
  failure_count INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_biometric_user_id (user_id),
  INDEX idx_biometric_status (status),
  INDEX idx_biometric_next_verification (next_verification_at)
);

-- Mobile Pro: Custom Threat Rules Table
CREATE TABLE IF NOT EXISTS custom_threat_rules (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(20) NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  match_count INT DEFAULT 0,
  last_match TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_rules_user_id (user_id),
  INDEX idx_rules_enabled (enabled),
  INDEX idx_rules_created_at (created_at)
);

-- Mobile Pro: Offline Cache Table
CREATE TABLE IF NOT EXISTS offline_cache (
  id VARCHAR(255) PRIMARY KEY,
  data_type VARCHAR(50) NOT NULL,
  size INT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  compressed BOOLEAN DEFAULT true,
  encryption_key_hash VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_cache_expiry (expires_at),
  INDEX idx_cache_type (data_type),
  UNIQUE(data_type)
);

-- Desktop Pro: Kernel Monitor Events Table
CREATE TABLE IF NOT EXISTS kernel_monitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  process_id INT NOT NULL,
  process_name VARCHAR(512) NOT NULL,
  parent_process_id INT,
  command_line TEXT,
  kernel_event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20),
  blocked BOOLEAN DEFAULT false,
  event_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb,
  INDEX idx_kernel_user_id (user_id),
  INDEX idx_kernel_process_id (process_id),
  INDEX idx_kernel_timestamp (event_timestamp),
  INDEX idx_kernel_severity (severity)
);

-- Desktop Pro: Memory Forensics Table
CREATE TABLE IF NOT EXISTS memory_forensics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  scan_id VARCHAR(255) NOT NULL UNIQUE,
  process_id INT NOT NULL,
  process_name VARCHAR(512) NOT NULL,
  scan_type VARCHAR(50) NOT NULL,
  memory_regions INT,
  suspicious_patterns JSONB DEFAULT '[]'::jsonb,
  injected_code BOOLEAN DEFAULT false,
  hooks_detected INT DEFAULT 0,
  findings TEXT,
  scan_status VARCHAR(20) DEFAULT 'completed',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_memory_user_id (user_id),
  INDEX idx_memory_scan_id (scan_id),
  INDEX idx_memory_process_id (process_id)
);

-- Desktop Pro: Disk Forensics Table
CREATE TABLE IF NOT EXISTS disk_forensics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  scan_id VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(1024) NOT NULL,
  file_size BIGINT,
  file_hash VARCHAR(255),
  forensics_type VARCHAR(50) NOT NULL,
  deleted BOOLEAN DEFAULT false,
  recoverable BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  analysis_results JSONB DEFAULT '{}'::jsonb,
  scan_status VARCHAR(20) DEFAULT 'completed',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_disk_user_id (user_id),
  INDEX idx_disk_scan_id (scan_id),
  INDEX idx_disk_file_path (file_path),
  INDEX idx_disk_recoverable (recoverable)
);

-- Desktop Pro: Network Sniffer Events Table
CREATE TABLE IF NOT EXISTS network_sniffer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  source_ip INET,
  destination_ip INET,
  source_port INT,
  destination_port INT,
  protocol VARCHAR(20),
  process_id INT,
  process_name VARCHAR(512),
  packet_data BYTEA,
  flags JSONB DEFAULT '{}'::jsonb,
  suspicious BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_network_user_id (user_id),
  INDEX idx_network_src_ip (source_ip),
  INDEX idx_network_dst_ip (destination_ip),
  INDEX idx_network_timestamp (captured_at)
);

-- Desktop Pro: Registry Monitor Table
CREATE TABLE IF NOT EXISTS registry_monitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  registry_path VARCHAR(1024) NOT NULL,
  registry_key VARCHAR(512) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  modification_type VARCHAR(50) NOT NULL,
  suspicious BOOLEAN DEFAULT false,
  process_id INT,
  process_name VARCHAR(512),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_registry_user_id (user_id),
  INDEX idx_registry_path (registry_path),
  INDEX idx_registry_timestamp (modified_at),
  INDEX idx_registry_suspicious (suspicious)
);

-- Web Enterprise: Advanced RBAC Roles Table
CREATE TABLE IF NOT EXISTS enterprise_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  role_name VARCHAR(255) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_custom BOOLEAN DEFAULT true,
  role_level INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, role_name),
  INDEX idx_enterprise_roles_org_id (organization_id),
  INDEX idx_enterprise_roles_active (active)
);

-- Web Enterprise: Organization Hierarchies Table
CREATE TABLE IF NOT EXISTS organization_hierarchies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_organization_id UUID,
  child_organization_id UUID NOT NULL,
  hierarchy_level INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_org_hierarchy_parent (parent_organization_id),
  INDEX idx_org_hierarchy_child (child_organization_id),
  FOREIGN KEY (parent_organization_id) REFERENCES organizations(id),
  FOREIGN KEY (child_organization_id) REFERENCES organizations(id)
);

-- Web Enterprise: Delegated Admin Table
CREATE TABLE IF NOT EXISTS delegated_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  delegated_by_user_id UUID NOT NULL,
  delegated_to_user_id UUID NOT NULL,
  delegation_scope VARCHAR(255) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_delegated_org_id (organization_id),
  INDEX idx_delegated_user_id (delegated_to_user_id),
  INDEX idx_delegated_active (active)
);

-- Web Enterprise: Custom Workflows Table
CREATE TABLE IF NOT EXISTS enterprise_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(255) NOT NULL,
  workflow_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_workflows_org_id (organization_id),
  INDEX idx_workflows_enabled (enabled)
);

-- Web Enterprise: Advanced Reporting Table
CREATE TABLE IF NOT EXISTS enterprise_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  report_content JSONB NOT NULL,
  scheduled_reports JSONB DEFAULT '{}'::jsonb,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  format VARCHAR(50) DEFAULT 'pdf',
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_reports_org_id (organization_id),
  INDEX idx_reports_created_at (created_at)
);

-- Web Enterprise: API Tier Management Table
CREATE TABLE IF NOT EXISTS api_tier_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  tier_name VARCHAR(255) NOT NULL,
  monthly_quota INT NOT NULL,
  requests_used INT DEFAULT 0,
  reset_date TIMESTAMPTZ,
  rate_limit INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_api_tier_org_id (organization_id),
  INDEX idx_api_tier_reset_date (reset_date)
);

-- Web Enterprise: Audit Trail with Retention Table
CREATE TABLE IF NOT EXISTS enterprise_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  retention_days INT DEFAULT 365,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  INDEX idx_audit_org_id (organization_id),
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created_at (created_at),
  INDEX idx_audit_expires_at (expires_at)
);
