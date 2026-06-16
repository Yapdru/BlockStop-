-- Behavioral Analytics Schema

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Baselines Table
CREATE TABLE IF NOT EXISTS baselines (
    baseline_id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    avg_events_per_day FLOAT,
    avg_events_per_hour FLOAT,
    std_deviation FLOAT,
    variance FLOAT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id)
);

-- Anomalies Table
CREATE TABLE IF NOT EXISTS anomalies (
    anomaly_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id),
    event_id VARCHAR(255),
    severity VARCHAR(20),
    anomaly_type VARCHAR(100),
    reasons JSONB,
    score FLOAT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id, detected_at)
);

-- Behavioral Events Table
CREATE TABLE IF NOT EXISTS behavioral_events (
    event_id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100),
    action VARCHAR(255),
    target VARCHAR(255),
    source_ip INET,
    location VARCHAR(255),
    resource_access JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (entity_id, created_at)
);

-- Risk Scores Table
CREATE TABLE IF NOT EXISTS risk_scores (
    entity_id VARCHAR(255) NOT NULL,
    overall_score FLOAT,
    anomaly_score FLOAT,
    behavior_score FLOAT,
    timeline_score FLOAT,
    relationship_score FLOAT,
    trend FLOAT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (entity_id, calculated_at)
);

-- Classifications Table
CREATE TABLE IF NOT EXISTS classifications (
    classification_id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    behavior_type VARCHAR(100),
    category VARCHAR(50),
    confidence FLOAT,
    indicators JSONB,
    severity VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (entity_id, created_at)
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
    event_id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    event_text VARCHAR(500),
    event_type VARCHAR(100),
    risk_level VARCHAR(20),
    actor VARCHAR(255),
    action VARCHAR(255),
    target VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (entity_id, timestamp)
);

-- Relationships Table
CREATE TABLE IF NOT EXISTS entity_relationships (
    relationship_id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(255) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50),
    strength FLOAT,
    frequency INTEGER,
    last_interaction TIMESTAMP,
    risk_association FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (source_id, target_id)
);

-- Create indexes for better performance
CREATE INDEX idx_anomalies_severity ON anomalies(severity);
CREATE INDEX idx_behavioral_events_entity ON behavioral_events(entity_id);
CREATE INDEX idx_classifications_entity ON classifications(entity_id);
CREATE INDEX idx_timeline_entity ON timeline_events(entity_id);
