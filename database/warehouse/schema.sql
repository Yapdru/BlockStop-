-- Data Warehouse Schema
-- Star schema with fact tables and dimension tables for analytics

-- ETL Job Management
CREATE TABLE IF NOT EXISTS etl_jobs (
  job_id UUID PRIMARY KEY,
  source VARCHAR(255) NOT NULL,
  target VARCHAR(255) NOT NULL,
  schedule VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  rows_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_etl_jobs_status (status),
  INDEX idx_etl_jobs_created_at (created_at DESC)
);

-- Warehouse Backups
CREATE TABLE IF NOT EXISTS warehouse_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  size_bytes BIGINT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  INDEX idx_backups_created_at (created_at DESC)
);

-- Query Audit Log
CREATE TABLE IF NOT EXISTS warehouse_query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  user_id VARCHAR(255),
  execution_time_ms INTEGER,
  row_count INTEGER,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_query_log_user_id (user_id),
  INDEX idx_query_log_created_at (created_at DESC)
);

-- Data Quality Checks
CREATE TABLE IF NOT EXISTS data_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  rule VARCHAR(1000),
  passed BOOLEAN,
  failed_row_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_quality_checks_table_name (table_name),
  INDEX idx_quality_checks_created_at (created_at DESC)
);

-- Aggregation Cache
CREATE TABLE IF NOT EXISTS aggregation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(512) NOT NULL UNIQUE,
  aggregation_query TEXT,
  result JSONB,
  ttl_seconds INTEGER DEFAULT 3600,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  INDEX idx_agg_cache_expires_at (expires_at)
);

-- Warehouse Performance Metrics
CREATE TABLE IF NOT EXISTS warehouse_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC,
  table_name VARCHAR(255),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  INDEX idx_perf_metric_name (metric_name),
  INDEX idx_perf_timestamp (timestamp DESC)
);
