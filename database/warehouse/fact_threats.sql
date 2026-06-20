-- Fact Table: Threats
-- Measures related to detected threats and security incidents

CREATE TABLE IF NOT EXISTS fact_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dimensions
  threat_id UUID NOT NULL,
  user_id VARCHAR(255),
  threat_type VARCHAR(100),
  threat_severity VARCHAR(50),
  threat_category VARCHAR(100),
  source_type VARCHAR(50),
  was_blocked BOOLEAN DEFAULT FALSE,

  -- Metrics
  threat_count INTEGER DEFAULT 1,
  block_count INTEGER DEFAULT 0,
  quarantine_count INTEGER DEFAULT 0,
  false_positive_flag BOOLEAN DEFAULT FALSE,
  detection_confidence NUMERIC(5, 2),

  -- Time dimensions
  threat_date DATE NOT NULL,
  detection_hour TIMESTAMP NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_fact_threats_user_id (user_id),
  INDEX idx_fact_threats_threat_date (threat_date DESC),
  INDEX idx_fact_threats_threat_type (threat_type),
  INDEX idx_fact_threats_threat_severity (threat_severity),
  INDEX idx_fact_threats_was_blocked (was_blocked),
  INDEX idx_fact_threats_created_at (created_at DESC)
) PARTITION BY RANGE (threat_date);

-- Create monthly partitions for the fact_threats table
CREATE TABLE IF NOT EXISTS fact_threats_2025_01 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_02 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_03 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_04 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_05 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_06 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_07 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_08 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_09 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_10 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_11 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS fact_threats_2025_12 PARTITION OF fact_threats
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_01 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_02 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_03 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_04 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_05 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_06 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS fact_threats_2026_07 PARTITION OF fact_threats
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Aggregation table for daily threat metrics
CREATE TABLE IF NOT EXISTS agg_threats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_date DATE NOT NULL,
  total_threats INTEGER DEFAULT 0,
  threats_blocked INTEGER DEFAULT 0,
  threat_types_detected INTEGER DEFAULT 0,
  highest_severity_detected VARCHAR(50),
  false_positives INTEGER DEFAULT 0,
  avg_confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_agg_threats_daily_date (threat_date DESC)
);

-- Threat type aggregation
CREATE TABLE IF NOT EXISTS agg_threats_by_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type VARCHAR(100) NOT NULL,
  threat_date DATE NOT NULL,
  total_count INTEGER DEFAULT 0,
  blocked_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_agg_threat_type (threat_type),
  INDEX idx_agg_threat_type_date (threat_date DESC)
);

-- User-level threat aggregation
CREATE TABLE IF NOT EXISTS agg_threats_by_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  threat_date DATE NOT NULL,
  threat_count INTEGER DEFAULT 0,
  unique_threat_types INTEGER DEFAULT 0,
  blocked_threats INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_agg_threat_user_id (user_id),
  INDEX idx_agg_threat_user_date (threat_date DESC)
);
