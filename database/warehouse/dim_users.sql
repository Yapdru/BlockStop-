-- Dimension Table: Users
-- Customer and user attributes with slowly changing dimensions (SCD Type 2)

CREATE TABLE IF NOT EXISTS dim_users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  username VARCHAR(255),
  tier_level VARCHAR(50),
  subscription_status VARCHAR(50),
  country VARCHAR(100),
  organization VARCHAR(255),
  api_key_active BOOLEAN DEFAULT FALSE,

  -- SCD Type 2 fields
  is_current BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_dim_users_user_id (user_id),
  INDEX idx_dim_users_email (email),
  INDEX idx_dim_users_is_current (is_current),
  INDEX idx_dim_users_tier_level (tier_level),
  INDEX idx_dim_users_subscription_status (subscription_status),
  INDEX idx_dim_users_start_date (start_date DESC)
);

-- Create unique constraint on current records
CREATE UNIQUE INDEX idx_dim_users_user_id_current ON dim_users(user_id) WHERE is_current = TRUE;

-- Dimension table for user activity levels
CREATE TABLE IF NOT EXISTS dim_user_activity (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  activity_level VARCHAR(50),
  days_active INTEGER,
  scans_last_30_days INTEGER DEFAULT 0,
  threats_detected_last_30_days INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ,
  login_frequency VARCHAR(50),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_user_activity_user_id (user_id),
  INDEX idx_dim_user_activity_level (activity_level),
  INDEX idx_dim_user_activity_is_current (is_current)
);

-- Dimension table for user segments
CREATE TABLE IF NOT EXISTS dim_user_segments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  segment_name VARCHAR(100),
  segment_value VARCHAR(255),
  priority_level VARCHAR(50),
  risk_profile VARCHAR(50),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_user_segments_user_id (user_id),
  INDEX idx_dim_user_segments_segment (segment_name),
  INDEX idx_dim_user_segments_is_current (is_current)
);

-- Dimension table for user behavior metrics
CREATE TABLE IF NOT EXISTS dim_user_behavior (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  average_files_per_scan NUMERIC(10, 2),
  average_scan_frequency VARCHAR(50),
  threat_avoidance_score NUMERIC(5, 2),
  security_awareness_level VARCHAR(50),
  file_type_preference VARCHAR(255),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_user_behavior_user_id (user_id),
  INDEX idx_dim_user_behavior_awareness_level (security_awareness_level)
);

-- Geography dimension
CREATE TABLE IF NOT EXISTS dim_geography (
  id SERIAL PRIMARY KEY,
  country VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  continent VARCHAR(50),
  timezone VARCHAR(50),
  language_code VARCHAR(10),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(country),
  INDEX idx_dim_geography_country (country)
);

-- Organization dimension
CREATE TABLE IF NOT EXISTS dim_organization (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL UNIQUE,
  organization_name VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  region VARCHAR(100),

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_org_id (organization_id),
  INDEX idx_dim_org_name (organization_name),
  INDEX idx_dim_org_is_current (is_current)
);

-- Account status dimension
CREATE TABLE IF NOT EXISTS dim_account_status (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  account_status VARCHAR(50),
  verification_status VARCHAR(50),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  password_strength VARCHAR(50),
  last_password_change TIMESTAMPTZ,
  account_creation_date TIMESTAMPTZ,

  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_account_status_user_id (user_id),
  INDEX idx_dim_account_status (account_status),
  INDEX idx_dim_account_status_is_current (is_current)
);
