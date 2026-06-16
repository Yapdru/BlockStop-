-- Threat Hunting Schema

-- Hunt Configurations Table
CREATE TABLE IF NOT EXISTS threat_hunts (
    hunt_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hunt_type VARCHAR(50),
    target_scope JSONB,
    time_range JSONB,
    status VARCHAR(50),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hunt Results Table
CREATE TABLE IF NOT EXISTS hunt_results (
    result_id VARCHAR(255) PRIMARY KEY,
    hunt_id VARCHAR(255) NOT NULL REFERENCES threat_hunts(hunt_id),
    findings JSONB,
    statistics JSONB,
    execution_time INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hunt Schedules Table
CREATE TABLE IF NOT EXISTS hunt_schedules (
    schedule_id VARCHAR(255) PRIMARY KEY,
    hunt_id VARCHAR(255) NOT NULL REFERENCES threat_hunts(hunt_id),
    frequency VARCHAR(50),
    next_run TIMESTAMP,
    last_run TIMESTAMP,
    enabled BOOLEAN DEFAULT true,
    cron_expression VARCHAR(255)
);

-- IOC (Indicator of Compromise) Table
CREATE TABLE IF NOT EXISTS ioc_hunts (
    ioc_id VARCHAR(255) PRIMARY KEY,
    hunt_id VARCHAR(255) NOT NULL REFERENCES threat_hunts(hunt_id),
    ioc_type VARCHAR(50),
    ioc_value VARCHAR(500),
    severity VARCHAR(20),
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    matches INTEGER DEFAULT 0
);

-- Threat Intelligence Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    intel_id VARCHAR(255) PRIMARY KEY,
    indicator VARCHAR(500),
    indicator_type VARCHAR(50),
    threat_type VARCHAR(100),
    severity VARCHAR(20),
    tlp VARCHAR(10),
    source VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hunt Templates Table
CREATE TABLE IF NOT EXISTS hunt_templates (
    template_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    hunt_type VARCHAR(50),
    difficulty VARCHAR(20),
    estimated_duration INTEGER,
    mitre_techniques JSONB,
    indicators JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_hunts_status ON threat_hunts(status);
CREATE INDEX idx_hunts_created_at ON threat_hunts(created_at);
CREATE INDEX idx_hunt_results_hunt_id ON hunt_results(hunt_id);
CREATE INDEX idx_ioc_hunts_hunt_id ON ioc_hunts(hunt_id);
CREATE INDEX idx_threat_intel_indicator ON threat_intelligence(indicator);
