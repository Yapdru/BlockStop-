-- Threat Intelligence Database Schema
-- Initialize tables for threat feeds, indicators, correlations, and ML predictions

-- Threat Feeds Table
CREATE TABLE IF NOT EXISTS threat_feeds (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  url VARCHAR(512) NOT NULL,
  api_key VARCHAR(512),
  enabled BOOLEAN DEFAULT true,
  update_interval BIGINT DEFAULT 21600000,
  last_update TIMESTAMP,
  next_update TIMESTAMP,
  status VARCHAR(50) DEFAULT 'unknown',
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Threat Indicators Table
CREATE TABLE IF NOT EXISTS threat_indicators (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL,
  first_seen TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL,
  tags JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (type),
  INDEX (value),
  INDEX (source),
  INDEX (confidence)
);

-- IOC Relationships Table
CREATE TABLE IF NOT EXISTS ioc_relationships (
  id VARCHAR(255) PRIMARY KEY,
  source_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  strength DECIMAL(3, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (source_id) REFERENCES threat_indicators(id),
  FOREIGN KEY (target_id) REFERENCES threat_indicators(id),
  INDEX (source_id),
  INDEX (target_id),
  INDEX (strength)
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  attributed_actors JSONB DEFAULT '[]',
  tactics JSONB DEFAULT '[]',
  techniques JSONB DEFAULT '[]',
  confidence DECIMAL(3, 2),
  related_campaigns JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (name),
  INDEX (start_date)
);

-- Campaign IOC Mappings
CREATE TABLE IF NOT EXISTS campaign_indicators (
  id VARCHAR(255) PRIMARY KEY,
  campaign_id VARCHAR(255) NOT NULL,
  indicator_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id),
  INDEX (campaign_id),
  INDEX (indicator_id)
);

-- Threat Actors Table
CREATE TABLE IF NOT EXISTS threat_actors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  aliases JSONB DEFAULT '[]',
  description TEXT,
  origin VARCHAR(255),
  motivations JSONB DEFAULT '[]',
  capabilities JSONB DEFAULT '[]',
  targeted_sectors JSONB DEFAULT '[]',
  campaigns JSONB DEFAULT '[]',
  first_seen TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL,
  confidence DECIMAL(3, 2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (name),
  INDEX (active)
);

-- Actor Infrastructure (IOCs associated with actors)
CREATE TABLE IF NOT EXISTS actor_infrastructure (
  id VARCHAR(255) PRIMARY KEY,
  actor_id VARCHAR(255) NOT NULL,
  indicator_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (actor_id) REFERENCES threat_actors(id),
  FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id),
  INDEX (actor_id),
  INDEX (indicator_id)
);

-- ML Threat Predictions
CREATE TABLE IF NOT EXISTS ml_threat_predictions (
  id VARCHAR(255) PRIMARY KEY,
  indicator_id VARCHAR(255) NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  threat_level VARCHAR(50) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  confidence DECIMAL(3, 2),
  malware_score DECIMAL(3, 2),
  phishing_score DECIMAL(3, 2),
  c2_score DECIMAL(3, 2),
  ransomware_score DECIMAL(3, 2),
  apt_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id),
  INDEX (indicator_id),
  INDEX (risk_score),
  INDEX (threat_level)
);

-- Anomaly Detection Results
CREATE TABLE IF NOT EXISTS anomaly_detections (
  id VARCHAR(255) PRIMARY KEY,
  indicator_id VARCHAR(255) NOT NULL,
  is_anomaly BOOLEAN NOT NULL,
  anomaly_score DECIMAL(5, 2),
  reason TEXT,
  detected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id),
  INDEX (indicator_id),
  INDEX (is_anomaly),
  INDEX (detected_at)
);

-- Zero-Day Indicators
CREATE TABLE IF NOT EXISTS zeroday_indicators (
  id VARCHAR(255) PRIMARY KEY,
  pattern TEXT NOT NULL,
  risk_score DECIMAL(5, 2),
  first_detected TIMESTAMP NOT NULL,
  last_observed TIMESTAMP,
  exploit_code TEXT,
  affected_systems JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (risk_score),
  INDEX (first_detected)
);

-- Feed Update Logs
CREATE TABLE IF NOT EXISTS feed_update_logs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feed_id VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  new_indicators INT DEFAULT 0,
  updated_indicators INT DEFAULT 0,
  error TEXT,
  duration BIGINT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (feed_id) REFERENCES threat_feeds(id),
  INDEX (feed_id),
  INDEX (timestamp)
);

-- IOC Classification Cache
CREATE TABLE IF NOT EXISTS ioc_classifications (
  id VARCHAR(255) PRIMARY KEY,
  indicator_id VARCHAR(255) NOT NULL UNIQUE,
  primary_class VARCHAR(100) NOT NULL,
  secondary_classes JSONB DEFAULT '[]',
  confidence DECIMAL(3, 2),
  reasoning TEXT,
  cached_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id),
  INDEX (indicator_id),
  INDEX (primary_class)
);

-- Create indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_indicators_value_type ON threat_indicators(value, type);
CREATE INDEX IF NOT EXISTS idx_indicators_source_time ON threat_indicators(source, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_feeds_enabled_type ON threat_feeds(enabled, type);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_score ON ml_threat_predictions(risk_score DESC);

-- Grant appropriate permissions
-- These would depend on your specific PostgreSQL setup and user management
