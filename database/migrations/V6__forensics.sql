-- Forensics Schema

-- Investigation Cases Table
CREATE TABLE IF NOT EXISTS forensic_cases (
    case_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    severity VARCHAR(20),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forensic Evidence Table
CREATE TABLE IF NOT EXISTS forensic_evidence (
    evidence_id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL REFERENCES forensic_cases(case_id),
    evidence_type VARCHAR(50),
    source VARCHAR(255),
    timestamp TIMESTAMP,
    description TEXT,
    data JSONB,
    metadata JSONB,
    hash VARCHAR(255),
    size INTEGER,
    owner VARCHAR(255),
    path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chain of Custody Table
CREATE TABLE IF NOT EXISTS chain_of_custody (
    custody_id VARCHAR(255) PRIMARY KEY,
    evidence_id VARCHAR(255) NOT NULL REFERENCES forensic_evidence(evidence_id),
    action VARCHAR(100),
    actor VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Forensic Findings Table
CREATE TABLE IF NOT EXISTS forensic_findings (
    finding_id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL REFERENCES forensic_cases(case_id),
    finding_type VARCHAR(100),
    description TEXT,
    confidence FLOAT,
    indicators JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investigation Timeline Table
CREATE TABLE IF NOT EXISTS investigation_timeline (
    timeline_id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL REFERENCES forensic_cases(case_id),
    timestamp TIMESTAMP NOT NULL,
    event VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (case_id, timestamp)
);

-- Evidence Artifacts Table
CREATE TABLE IF NOT EXISTS evidence_artifacts (
    artifact_id VARCHAR(255) PRIMARY KEY,
    evidence_id VARCHAR(255) NOT NULL REFERENCES forensic_evidence(evidence_id),
    artifact_type VARCHAR(100),
    artifact_data JSONB,
    risk_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_forensic_cases_status ON forensic_cases(status);
CREATE INDEX idx_forensic_cases_created_at ON forensic_cases(created_at);
CREATE INDEX idx_forensic_evidence_case ON forensic_evidence(case_id);
CREATE INDEX idx_forensic_evidence_hash ON forensic_evidence(hash);
CREATE INDEX idx_chain_custody_evidence ON chain_of_custody(evidence_id);
CREATE INDEX idx_forensic_findings_case ON forensic_findings(case_id);
