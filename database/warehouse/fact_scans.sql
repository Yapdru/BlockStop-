-- Fact Table: Scans
-- Measures related to file and email scans

CREATE TABLE IF NOT EXISTS fact_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dimensions
  scan_id UUID NOT NULL,
  user_id VARCHAR(255),
  file_hash VARCHAR(256),
  scan_type VARCHAR(50),
  scan_source VARCHAR(50),
  threat_detected BOOLEAN DEFAULT FALSE,

  -- Metrics
  file_size_bytes BIGINT,
  scan_time_ms INTEGER,
  file_count INTEGER DEFAULT 1,
  threat_count INTEGER DEFAULT 0,
  risk_score NUMERIC(5, 2),

  -- Time dimensions
  scan_date DATE NOT NULL,
  scan_hour TIMESTAMP NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_fact_scans_user_id (user_id),
  INDEX idx_fact_scans_scan_date (scan_date DESC),
  INDEX idx_fact_scans_threat_detected (threat_detected),
  INDEX idx_fact_scans_scan_type (scan_type),
  INDEX idx_fact_scans_created_at (created_at DESC)
) PARTITION BY RANGE (scan_date);

-- Create monthly partitions for the fact_scans table
-- Format: fact_scans_YYYY_MM

-- Create initial partitions for current year and past year
CREATE TABLE IF NOT EXISTS fact_scans_2025_01 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_02 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_03 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_04 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_05 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_06 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_07 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_08 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_09 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_10 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_11 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS fact_scans_2025_12 PARTITION OF fact_scans
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_01 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_02 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_03 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_04 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_05 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_06 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS fact_scans_2026_07 PARTITION OF fact_scans
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Aggregation table for daily scan metrics
CREATE TABLE IF NOT EXISTS agg_scans_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date DATE NOT NULL,
  user_count INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  scans_with_threats INTEGER DEFAULT 0,
  avg_file_size_bytes NUMERIC,
  avg_scan_time_ms NUMERIC,
  avg_risk_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_agg_scans_daily_date (scan_date DESC)
);

-- Hourly aggregation
CREATE TABLE IF NOT EXISTS agg_scans_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_hour TIMESTAMP NOT NULL,
  total_scans INTEGER DEFAULT 0,
  scans_with_threats INTEGER DEFAULT 0,
  avg_risk_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_agg_scans_hourly_hour (scan_hour DESC)
);
