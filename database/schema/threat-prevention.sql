-- Threat Prevention Schema
-- Tables for blocks, whitelisting, quarantine, and policies

-- Threat blocks table
CREATE TABLE IF NOT EXISTS threat_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id VARCHAR(255) NOT NULL UNIQUE,
  threat_type VARCHAR(50) NOT NULL,
  threat_severity VARCHAR(20) NOT NULL,
  source_ip INET,
  source_process VARCHAR(512),
  block_action VARCHAR(50) NOT NULL,
  block_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_threat_blocks_timestamp (block_timestamp DESC),
  INDEX idx_threat_blocks_user_id (user_id),
  INDEX idx_threat_blocks_severity (threat_severity)
);

-- Whitelist entries table
CREATE TABLE IF NOT EXISTS whitelist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_type VARCHAR(20) NOT NULL,
  entry_value VARCHAR(512) NOT NULL,
  reason TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_whitelist_user_id (user_id),
  INDEX idx_whitelist_enabled (enabled),
  UNIQUE(user_id, entry_type, entry_value)
);

-- Prevention policies table
CREATE TABLE IF NOT EXISTS prevention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(255) NOT NULL,
  threat_types TEXT[] NOT NULL,
  min_severity VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  conditions JSONB DEFAULT '{}'::jsonb,
  exceptions TEXT[] DEFAULT ARRAY[]::text[],
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_policies_user_id (user_id),
  INDEX idx_policies_enabled (enabled)
);

-- Quarantine items table
CREATE TABLE IF NOT EXISTS quarantine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_path VARCHAR(1024) NOT NULL,
  quarantine_path VARCHAR(1024) NOT NULL,
  threat_id VARCHAR(255) NOT NULL,
  threat_type VARCHAR(50) NOT NULL,
  quarantine_reason TEXT,
  quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released BOOLEAN NOT NULL DEFAULT FALSE,
  released_at TIMESTAMPTZ,
  released_by VARCHAR(255),
  file_hash VARCHAR(256),
  file_size BIGINT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_quarantine_user_id (user_id),
  INDEX idx_quarantine_released (released),
  INDEX idx_quarantine_timestamp (quarantined_at DESC)
);

-- Prevention metrics table
CREATE TABLE IF NOT EXISTS prevention_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  threats_detected INTEGER DEFAULT 0,
  threats_blocked INTEGER DEFAULT 0,
  threats_quarantined INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  average_detection_time_ms INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_metrics_user_id (user_id),
  INDEX idx_metrics_period (period_start, period_end)
);

-- Block actions log table
CREATE TABLE IF NOT EXISTS block_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_status BOOLEAN NOT NULL,
  error_message TEXT,
  action_details JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_actions_threat_id (threat_id),
  INDEX idx_actions_timestamp (executed_at DESC)
);

-- Threat pattern rules table
CREATE TABLE IF NOT EXISTS threat_pattern_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  threat_type VARCHAR(50) NOT NULL,
  indicators TEXT[] NOT NULL,
  severity_score NUMERIC(5,2),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_pattern_rules_threat_type (threat_type),
  INDEX idx_pattern_rules_enabled (enabled)
);
