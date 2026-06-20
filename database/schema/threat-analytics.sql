-- Threat Analytics Schema
-- Tables for threat data, patterns, actors, and kill chains

-- Threats table
CREATE TABLE IF NOT EXISTS threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id VARCHAR(255) NOT NULL UNIQUE,
  threat_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  source_ip INET,
  destination_ip INET,
  source_port INTEGER,
  destination_port INTEGER,
  protocol VARCHAR(20),
  process_id INTEGER,
  file_path VARCHAR(1024),
  registry_path VARCHAR(1024),
  description TEXT,
  detection_timestamp TIMESTAMPTZ NOT NULL,
  analyzed_at TIMESTAMPTZ,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  INDEX idx_threats_user_id (user_id),
  INDEX idx_threats_timestamp (detection_timestamp DESC),
  INDEX idx_threats_severity (severity),
  INDEX idx_threats_type (threat_type)
);

-- Threat patterns table
CREATE TABLE IF NOT EXISTS threat_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  threat_type VARCHAR(50) NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  indicators TEXT[] NOT NULL,
  behavior_description TEXT,
  detection_count INTEGER DEFAULT 1,
  first_detected TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_detected TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_patterns_threat_type (threat_type),
  INDEX idx_patterns_confidence (confidence DESC),
  INDEX idx_patterns_active (active)
);

-- Threat actors table
CREATE TABLE IF NOT EXISTS threat_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name VARCHAR(255) NOT NULL,
  actor_type VARCHAR(50) NOT NULL,
  threat_level VARCHAR(20) NOT NULL,
  description TEXT,
  known_techniques TEXT[],
  known_ips INET[],
  known_domains VARCHAR(512)[],
  tactics TEXT[] DEFAULT ARRAY[]::text[],
  total_incidents INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_actors_threat_level (threat_level),
  INDEX idx_actors_last_activity (last_activity DESC)
);

-- Kill chains table (attack chains)
CREATE TABLE IF NOT EXISTS attack_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_name VARCHAR(255) NOT NULL,
  description TEXT,
  phase_sequence TEXT[] NOT NULL,
  threat_actor_id UUID,
  first_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_attacks INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (threat_actor_id) REFERENCES threat_actors(id),
  INDEX idx_chains_actor_id (threat_actor_id),
  INDEX idx_chains_last_observed (last_observed DESC)
);

-- Attack chain phases table
CREATE TABLE IF NOT EXISTS chain_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL,
  phase_number INTEGER NOT NULL,
  phase_name VARCHAR(255) NOT NULL,
  description TEXT,
  techniques TEXT[],
  indicators TEXT[],
  duration_minutes INTEGER,
  is_critical BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (chain_id) REFERENCES attack_chains(id) ON DELETE CASCADE,
  INDEX idx_phases_chain_id (chain_id)
);

-- Indicator of compromise table
CREATE TABLE IF NOT EXISTS indicators_of_compromise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ioc_type VARCHAR(50) NOT NULL,
  ioc_value VARCHAR(512) NOT NULL,
  threat_type VARCHAR(50),
  confidence NUMERIC(5,2),
  source VARCHAR(255),
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_ioc_type (ioc_type),
  INDEX idx_ioc_value (ioc_value),
  INDEX idx_ioc_active (active),
  UNIQUE(ioc_type, ioc_value)
);

-- Threat correlations table
CREATE TABLE IF NOT EXISTS threat_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id_1 VARCHAR(255) NOT NULL,
  threat_id_2 VARCHAR(255) NOT NULL,
  correlation_score NUMERIC(5,2) NOT NULL,
  correlation_type VARCHAR(50),
  shared_indicators TEXT[],
  correlation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_correlations_threats (threat_id_1, threat_id_2),
  INDEX idx_correlations_score (correlation_score DESC)
);

-- Threat intelligence feed table
CREATE TABLE IF NOT EXISTS threat_intel_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_name VARCHAR(255) NOT NULL,
  feed_type VARCHAR(50) NOT NULL,
  source_url VARCHAR(512),
  last_updated TIMESTAMPTZ,
  update_frequency VARCHAR(50),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  entries_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_feeds_active (active)
);

-- Behavioral analysis table
CREATE TABLE IF NOT EXISTS behavioral_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id VARCHAR(255) NOT NULL,
  behavior_category VARCHAR(50) NOT NULL,
  behavior_score NUMERIC(5,2),
  suspicious_indicators TEXT[],
  process_tree JSONB,
  file_operations JSONB,
  network_operations JSONB,
  registry_operations JSONB,
  analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_behavior_threat_id (threat_id),
  INDEX idx_behavior_category (behavior_category)
);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  risk_score NUMERIC(5,2) NOT NULL,
  threat_factors JSONB DEFAULT '{}'::jsonb,
  exposure_level VARCHAR(20),
  assessment_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_risk_user_id (user_id),
  INDEX idx_risk_score (risk_score DESC)
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  framework VARCHAR(100) NOT NULL,
  compliance_score NUMERIC(5,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  findings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_compliance_user_id (user_id),
  INDEX idx_compliance_framework (framework),
  INDEX idx_compliance_status (status)
);

-- Security posture table
CREATE TABLE IF NOT EXISTS security_posture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  posture_score NUMERIC(5,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  assessment TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,
  assessment_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_posture_user_id (user_id),
  INDEX idx_posture_category (category),
  INDEX idx_posture_score (posture_score DESC)
);

-- Playbooks table
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(512) NOT NULL,
  content TEXT,
  category VARCHAR(100) NOT NULL,
  steps JSONB NOT NULL,
  estimated_time INTEGER,
  difficulty VARCHAR(50),
  prerequisites TEXT[] DEFAULT ARRAY[]::text[],
  success_criteria JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  created_by VARCHAR(255),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_playbooks_category (category),
  INDEX idx_playbooks_published (is_published),
  INDEX idx_playbooks_created_at (created_at DESC)
);

-- Runbooks table
CREATE TABLE IF NOT EXISTS runbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(512) NOT NULL,
  content TEXT,
  category VARCHAR(100) NOT NULL,
  automation_level VARCHAR(50) NOT NULL,
  scripts JSONB DEFAULT '[]'::jsonb,
  triggers JSONB DEFAULT '[]'::jsonb,
  on_success TEXT,
  on_failure TEXT,
  max_retries INTEGER DEFAULT 3,
  timeout INTEGER DEFAULT 300000,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  created_by VARCHAR(255),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_runbooks_category (category),
  INDEX idx_runbooks_automation (automation_level),
  INDEX idx_runbooks_published (is_published),
  INDEX idx_runbooks_created_at (created_at DESC)
);
