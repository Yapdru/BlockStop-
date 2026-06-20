-- BlockStop Phase 17 - Advanced Compliance & Auditing Schema
-- Comprehensive compliance framework support with audit logging

-- Compliance Frameworks Table
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  description TEXT,
  published_by VARCHAR(100),
  published_date TIMESTAMP,
  total_controls INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Framework Control Categories
CREATE TABLE IF NOT EXISTS framework_control_categories (
  id SERIAL PRIMARY KEY,
  framework_id INT REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  control_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(framework_id, category_name)
);

-- Compliance Controls
CREATE TABLE IF NOT EXISTS compliance_controls (
  id SERIAL PRIMARY KEY,
  framework_id INT REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  control_number VARCHAR(50) NOT NULL,
  control_title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  severity VARCHAR(50),
  criticality VARCHAR(50),
  maturity_level INT,
  implementation_effort VARCHAR(50),
  estimated_hours INT DEFAULT 0,
  testing_frequency VARCHAR(50),
  automation_possible BOOLEAN DEFAULT FALSE,
  implementation_guidance TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(framework_id, control_number)
);

-- Organization Framework Enablement
CREATE TABLE IF NOT EXISTS org_enabled_frameworks (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id INT REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  enabled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disabled_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  UNIQUE(org_id, framework_id)
);

-- Organization Compliance Status
CREATE TABLE IF NOT EXISTS org_compliance_status (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id INT REFERENCES compliance_frameworks(id),
  compliance_score DECIMAL(5, 2),
  status VARCHAR(50),
  last_assessed_at TIMESTAMP,
  next_assessment_at TIMESTAMP,
  assessment_period_days INT DEFAULT 365,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, framework_id)
);

-- Control Implementation Status
CREATE TABLE IF NOT EXISTS control_implementation_status (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  control_id INT REFERENCES compliance_controls(id),
  implementation_status VARCHAR(50),
  maturity_level INT,
  implementation_date TIMESTAMP,
  last_tested_date TIMESTAMP,
  owner_id INT REFERENCES users(id),
  percentage_complete INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id, control_id)
);

-- Compliance Evidence
CREATE TABLE IF NOT EXISTS compliance_evidence (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  control_id INT REFERENCES compliance_controls(id),
  evidence_type VARCHAR(100),
  evidence_title VARCHAR(255),
  evidence_description TEXT,
  location VARCHAR(255),
  storage_path VARCHAR(512),
  source_system VARCHAR(100),
  uploaded_by INT REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by INT REFERENCES users(id),
  verification_date TIMESTAMP,
  is_valid BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  expiry_date TIMESTAMP,
  relevance_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Records
CREATE TABLE IF NOT EXISTS compliance_audits (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id INT REFERENCES compliance_frameworks(id),
  audit_type VARCHAR(50),
  scheduled_date TIMESTAMP,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  auditor_name VARCHAR(255),
  auditor_organization VARCHAR(255),
  status VARCHAR(50),
  findings_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Findings
CREATE TABLE IF NOT EXISTS audit_findings (
  id SERIAL PRIMARY KEY,
  audit_id INT REFERENCES compliance_audits(id) ON DELETE CASCADE,
  control_id INT REFERENCES compliance_controls(id),
  finding_type VARCHAR(50),
  severity VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  root_cause TEXT,
  business_impact TEXT,
  control_expectation TEXT,
  status VARCHAR(50) DEFAULT 'OPEN',
  remediation_required BOOLEAN DEFAULT TRUE,
  target_remediation_date TIMESTAMP,
  assigned_to INT REFERENCES users(id),
  reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Remediation Actions
CREATE TABLE IF NOT EXISTS remediation_actions (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  finding_id INT REFERENCES audit_findings(id) ON DELETE CASCADE,
  action_title VARCHAR(255) NOT NULL,
  action_description TEXT NOT NULL,
  expected_outcome TEXT,
  assigned_to INT REFERENCES users(id),
  assigned_date TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  completion_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'PLANNED',
  priority VARCHAR(50),
  estimated_cost DECIMAL(10, 2),
  estimated_effort VARCHAR(100),
  completion_evidence TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Reports
CREATE TABLE IF NOT EXISTS compliance_reports (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id INT REFERENCES compliance_frameworks(id),
  report_type VARCHAR(100),
  report_title VARCHAR(255),
  file_path VARCHAR(512),
  file_format VARCHAR(20),
  signature VARCHAR(512),
  signed_at TIMESTAMP,
  signed_by INT REFERENCES users(id),
  status VARCHAR(50),
  confidentiality VARCHAR(50),
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Dashboard Configuration
CREATE TABLE IF NOT EXISTS compliance_dashboard_config (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  compliance_officer_id INT REFERENCES users(id),
  audit_committee_ids TEXT, -- JSON array of user IDs
  auditing_frequency VARCHAR(50) DEFAULT 'ANNUAL',
  external_audit_required BOOLEAN DEFAULT FALSE,
  compliance_threshold INT DEFAULT 80,
  critical_finding_response_hours INT DEFAULT 24,
  escalation_rules JSONB,
  notification_rules JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(org_id)
);

-- Control Mapping (Cross-Framework)
CREATE TABLE IF NOT EXISTS control_mappings (
  id SERIAL PRIMARY KEY,
  control_id1 INT REFERENCES compliance_controls(id) ON DELETE CASCADE,
  control_id2 INT REFERENCES compliance_controls(id) ON DELETE CASCADE,
  alignment_level VARCHAR(50),
  alignment_description TEXT,
  mapping_strength INT,
  mapped_by INT REFERENCES users(id),
  mapped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(control_id1, control_id2)
);

-- Compliance Snapshots (for trend analysis)
CREATE TABLE IF NOT EXISTS compliance_snapshots (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id INT REFERENCES compliance_frameworks(id),
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  compliance_score DECIMAL(5, 2),
  total_controls INT,
  compliant_controls INT,
  non_compliant_controls INT,
  snapshot_data JSONB,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Events Log (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS compliance_events_log (
  id SERIAL PRIMARY KEY,
  org_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  action VARCHAR(50),
  changes JSONB,
  user_id INT REFERENCES users(id),
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_compliance_status ON org_compliance_status(org_id, framework_id);
CREATE INDEX IF NOT EXISTS idx_control_impl_status ON control_implementation_status(org_id, implementation_status);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_control ON compliance_evidence(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_evidence_org ON compliance_evidence(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_status ON remediation_actions(status);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_owner ON remediation_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_compliance_events_org ON compliance_events_log(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON compliance_events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_snapshots ON compliance_snapshots(org_id, framework_id, snapshot_date DESC);

-- Create views for common queries
CREATE OR REPLACE VIEW compliance_status_summary AS
SELECT
  ocs.org_id,
  cf.code,
  cf.name,
  ocs.compliance_score,
  COUNT(DISTINCT cis.control_id) as total_controls,
  COUNT(CASE WHEN cis.implementation_status = 'COMPLIANT' THEN 1 END) as compliant_controls,
  COUNT(CASE WHEN cis.implementation_status = 'NON_COMPLIANT' THEN 1 END) as non_compliant_controls,
  ocs.last_assessed_at
FROM org_compliance_status ocs
LEFT JOIN compliance_frameworks cf ON ocs.framework_id = cf.id
LEFT JOIN control_implementation_status cis ON ocs.org_id = cis.org_id AND cf.id = cis.control_id / 1000 * 1000
GROUP BY ocs.org_id, cf.code, cf.name, ocs.compliance_score, ocs.last_assessed_at;

CREATE OR REPLACE VIEW open_findings_summary AS
SELECT
  af.org_id,
  af.severity,
  COUNT(*) as count,
  COUNT(CASE WHEN af.assigned_to IS NOT NULL THEN 1 END) as assigned,
  COUNT(CASE WHEN af.target_remediation_date < CURRENT_TIMESTAMP THEN 1 END) as overdue
FROM audit_findings af
WHERE af.status != 'REMEDIATED'
GROUP BY af.org_id, af.severity;

-- Seed initial compliance frameworks
INSERT INTO compliance_frameworks (code, name, version, description, published_by, published_date) VALUES
  ('SOC2', 'SOC 2 Trust Service Criteria', '2.0', 'Service Organization Control framework', 'AICPA', '2022-01-01'),
  ('ISO27001', 'ISO/IEC 27001:2022', '2022', 'Information Security Management System', 'ISO/IEC', '2022-10-25'),
  ('HIPAA', 'HIPAA Security and Privacy Rules', '2023', 'Healthcare data protection standard', 'HHS', '1996-08-21'),
  ('PCIДSS', 'PCI DSS v3.2.1', '3.2.1', 'Payment Card Industry Data Security', 'PCI Council', '2018-05-01'),
  ('GDPR', 'General Data Protection Regulation', '2018', 'EU data protection regulation', 'EU', '2018-05-25'),
  ('NIST', 'NIST Cybersecurity Framework', '1.1', 'Cybersecurity risk management', 'NIST', '2018-04-16')
ON CONFLICT (code) DO NOTHING;
