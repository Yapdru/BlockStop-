-- Dimension Table: Threats
-- Threat classifications and attributes with SCD Type 2

CREATE TABLE IF NOT EXISTS dim_threats (
  id SERIAL PRIMARY KEY,
  threat_id VARCHAR(255) NOT NULL,
  threat_name VARCHAR(255),
  threat_type VARCHAR(100) NOT NULL,
  threat_category VARCHAR(100),
  threat_severity VARCHAR(50),
  threat_family VARCHAR(255),
  cvss_score NUMERIC(5, 2),
  cve_id VARCHAR(50),

  -- Threat classification
  is_malware BOOLEAN DEFAULT FALSE,
  is_ransomware BOOLEAN DEFAULT FALSE,
  is_phishing BOOLEAN DEFAULT FALSE,
  is_zero_day BOOLEAN DEFAULT FALSE,
  is_critical BOOLEAN DEFAULT FALSE,

  -- SCD Type 2 fields
  is_current BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_threats_threat_id (threat_id),
  INDEX idx_dim_threats_type (threat_type),
  INDEX idx_dim_threats_category (threat_category),
  INDEX idx_dim_threats_severity (threat_severity),
  INDEX idx_dim_threats_is_current (is_current)
);

-- Threat source dimension
CREATE TABLE IF NOT EXISTS dim_threat_source (
  id SERIAL PRIMARY KEY,
  source_id VARCHAR(255) NOT NULL,
  source_name VARCHAR(255),
  source_type VARCHAR(50),
  source_location VARCHAR(100),
  source_ip INET,
  source_country VARCHAR(100),
  source_reputation VARCHAR(50),
  is_known_malicious BOOLEAN DEFAULT FALSE,

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_threat_source_id (source_id),
  INDEX idx_dim_threat_source_type (source_type),
  INDEX idx_dim_threat_source_country (source_country),
  INDEX idx_dim_threat_source_is_current (is_current)
);

-- Threat vector dimension
CREATE TABLE IF NOT EXISTS dim_threat_vector (
  id SERIAL PRIMARY KEY,
  vector_id VARCHAR(255) NOT NULL,
  vector_name VARCHAR(255),
  vector_type VARCHAR(100),
  attack_method VARCHAR(255),
  delivery_mechanism VARCHAR(255),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_threat_vector_id (vector_id),
  INDEX idx_dim_threat_vector_type (vector_type)
);

-- Threat actor dimension
CREATE TABLE IF NOT EXISTS dim_threat_actor (
  id SERIAL PRIMARY KEY,
  actor_id VARCHAR(255) NOT NULL UNIQUE,
  actor_name VARCHAR(255),
  actor_group VARCHAR(255),
  actor_country VARCHAR(100),
  actor_motivation VARCHAR(50),
  sophistication_level VARCHAR(50),
  known_targets TEXT,

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_threat_actor_id (actor_id),
  INDEX idx_dim_threat_actor_name (actor_name),
  INDEX idx_dim_threat_actor_country (actor_country),
  INDEX idx_dim_threat_actor_motivation (actor_motivation)
);

-- Threat indicator dimension
CREATE TABLE IF NOT EXISTS dim_threat_indicator (
  id SERIAL PRIMARY KEY,
  indicator_id VARCHAR(255) NOT NULL,
  indicator_type VARCHAR(50),
  indicator_value VARCHAR(1024),
  confidence_level NUMERIC(5, 2),
  source_feed VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_indicator_id (indicator_id),
  INDEX idx_dim_indicator_type (indicator_type),
  INDEX idx_dim_indicator_value (indicator_value)
);

-- Exploit dimension
CREATE TABLE IF NOT EXISTS dim_exploit (
  id SERIAL PRIMARY KEY,
  exploit_id VARCHAR(255) NOT NULL,
  exploit_name VARCHAR(255),
  vulnerability_id VARCHAR(50),
  target_software VARCHAR(255),
  target_version VARCHAR(100),
  availability_status VARCHAR(50),
  difficulty_level VARCHAR(50),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_exploit_id (exploit_id),
  INDEX idx_dim_exploit_name (exploit_name),
  INDEX idx_dim_exploit_vulnerability (vulnerability_id)
);

-- Payload dimension
CREATE TABLE IF NOT EXISTS dim_payload (
  id SERIAL PRIMARY KEY,
  payload_id VARCHAR(255) NOT NULL,
  payload_name VARCHAR(255),
  payload_type VARCHAR(100),
  payload_hash VARCHAR(256),
  file_extension VARCHAR(20),
  size_bytes BIGINT,
  is_obfuscated BOOLEAN DEFAULT FALSE,

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_payload_id (payload_id),
  INDEX idx_dim_payload_hash (payload_hash),
  INDEX idx_dim_payload_type (payload_type)
);

-- Mitigation dimension
CREATE TABLE IF NOT EXISTS dim_mitigation (
  id SERIAL PRIMARY KEY,
  mitigation_id VARCHAR(255) NOT NULL,
  mitigation_name VARCHAR(255),
  mitigation_type VARCHAR(100),
  applicable_threats TEXT,
  effectiveness_score NUMERIC(5, 2),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_mitigation_id (mitigation_id),
  INDEX idx_dim_mitigation_type (mitigation_type)
);
