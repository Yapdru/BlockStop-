-- Log Analysis Schema

-- Logs Table
CREATE TABLE IF NOT EXISTS logs (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    level VARCHAR(20),
    source VARCHAR(255),
    message TEXT NOT NULL,
    fields JSONB,
    hash VARCHAR(255) UNIQUE,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (timestamp),
    INDEX (source),
    INDEX (level)
);

-- Log Parsing Rules Table
CREATE TABLE IF NOT EXISTS log_parsing_rules (
    rule_id VARCHAR(255) PRIMARY KEY,
    format_type VARCHAR(50),
    pattern VARCHAR(500),
    field_mappings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Correlation Rules Table
CREATE TABLE IF NOT EXISTS correlation_rules (
    correlation_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    rule_logic JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Correlated Events Table
CREATE TABLE IF NOT EXISTS correlated_events (
    correlation_instance_id VARCHAR(255) PRIMARY KEY,
    correlation_id VARCHAR(255) NOT NULL REFERENCES correlation_rules(correlation_id),
    log_ids BIGINT[],
    correlation_score FLOAT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (detected_at)
);

-- Anomaly Detection Rules Table
CREATE TABLE IF NOT EXISTS anomaly_detection_rules (
    rule_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    detection_method VARCHAR(50),
    baseline_duration_days INTEGER,
    threshold_deviation FLOAT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log Statistics Table
CREATE TABLE IF NOT EXISTS log_statistics (
    stat_id VARCHAR(255) PRIMARY KEY,
    timestamp DATE NOT NULL,
    source VARCHAR(255),
    level VARCHAR(20),
    count INTEGER,
    avg_processing_time FLOAT,
    UNIQUE(timestamp, source, level)
);

-- Create indexes for performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_source_timestamp ON logs(source, timestamp DESC);
CREATE INDEX idx_logs_hash ON logs(hash);
CREATE INDEX idx_correlated_events_detected ON correlated_events(detected_at);
CREATE INDEX idx_log_stats_timestamp ON log_statistics(timestamp DESC);
