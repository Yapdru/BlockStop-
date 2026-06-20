-- Plugin Certification Schema

CREATE TABLE IF NOT EXISTS plugin_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  plugin_name VARCHAR(255) NOT NULL,
  developer_id VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  certification_level VARCHAR(50) NOT NULL DEFAULT 'uncertified',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rejection_reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plugin_id, version)
);

CREATE TABLE IF NOT EXISTS certification_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID NOT NULL REFERENCES plugin_certifications(id) ON DELETE CASCADE,
  audit_type VARCHAR(50) NOT NULL, -- 'security', 'performance', 'compatibility', 'code_quality'
  passed BOOLEAN NOT NULL,
  score INTEGER NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID NOT NULL REFERENCES plugin_certifications(id) ON DELETE CASCADE,
  badge_type VARCHAR(100) NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certifications_plugin ON plugin_certifications(plugin_id);
CREATE INDEX IF NOT EXISTS idx_certifications_developer ON plugin_certifications(developer_id);
CREATE INDEX IF NOT EXISTS idx_certifications_level ON plugin_certifications(certification_level);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON plugin_certifications(status);
