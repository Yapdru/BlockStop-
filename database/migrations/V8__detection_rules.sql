-- Detection Rules Schema

-- Detection Rules Table
CREATE TABLE IF NOT EXISTS detection_rules (
    rule_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    severity VARCHAR(20),
    author VARCHAR(255),
    conditions JSONB NOT NULL,
    actions JSONB,
    filters JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rule Groups Table
CREATE TABLE IF NOT EXISTS rule_groups (
    group_id VARCHAR(255) PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    rule_ids TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rule Deployments Table
CREATE TABLE IF NOT EXISTS rule_deployments (
    deployment_id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL REFERENCES detection_rules(rule_id),
    target VARCHAR(255),
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_by VARCHAR(255),
    status VARCHAR(50)
);

-- Rule Test Results Table
CREATE TABLE IF NOT EXISTS rule_test_results (
    test_id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL REFERENCES detection_rules(rule_id),
    test_data JSONB,
    expected_matches INTEGER,
    actual_matches INTEGER,
    passed BOOLEAN,
    execution_time INTEGER,
    tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rule Violations/Alerts Table
CREATE TABLE IF NOT EXISTS rule_violations (
    violation_id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL REFERENCES detection_rules(rule_id),
    entity_id VARCHAR(255),
    alert_severity VARCHAR(20),
    matched_conditions JSONB,
    source_data JSONB,
    action_taken VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (rule_id, detected_at),
    INDEX (entity_id),
    INDEX (alert_severity)
);

-- Rule Statistics Table
CREATE TABLE IF NOT EXISTS rule_statistics (
    rule_id VARCHAR(255) NOT NULL,
    timestamp DATE NOT NULL,
    matches INTEGER,
    false_positives INTEGER,
    true_positives INTEGER,
    PRIMARY KEY (rule_id, timestamp)
);

-- Create indexes for performance
CREATE INDEX idx_detection_rules_severity ON detection_rules(severity);
CREATE INDEX idx_detection_rules_enabled ON detection_rules(enabled);
CREATE INDEX idx_rule_violations_rule_time ON rule_violations(rule_id, detected_at);
CREATE INDEX idx_rule_violations_entity ON rule_violations(entity_id);
CREATE INDEX idx_rule_statistics_rule ON rule_statistics(rule_id);
