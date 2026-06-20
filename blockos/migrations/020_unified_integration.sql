-- Unified integration tracking and results

CREATE TABLE IF NOT EXISTS unified_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  integrations TEXT[],
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_unified_jobs_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_unified_jobs_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS unified_results (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  team_id TEXT,
  provider TEXT NOT NULL,
  items_scanned INTEGER DEFAULT 0,
  threats_detected INTEGER DEFAULT 0,
  risk_score DECIMAL DEFAULT 0,
  threat_data JSONB DEFAULT '[]',
  ai_analysis JSONB,
  hunting_matches JSONB DEFAULT '[]',
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_unified_results_jobs FOREIGN KEY (job_id) REFERENCES unified_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_unified_results_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_unified_results_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS threat_timeline (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  provider TEXT,
  source_id TEXT,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_threat_timeline_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_threat_timeline_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS remediation_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT,
  threat_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB,
  status TEXT DEFAULT 'pending',
  executed_at TIMESTAMP,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_remediation_actions_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_remediation_actions_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_remediation_actions_threats FOREIGN KEY (threat_id) REFERENCES threat_timeline(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scan_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT,
  integration_ids TEXT[],
  schedule TEXT,
  next_scan TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_scan_subs_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_scan_subs_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_unified_jobs_user_id ON unified_jobs(user_id);
CREATE INDEX idx_unified_jobs_team_id ON unified_jobs(team_id);
CREATE INDEX idx_unified_jobs_status ON unified_jobs(status);
CREATE INDEX idx_unified_jobs_created_at ON unified_jobs(created_at DESC);
CREATE INDEX idx_unified_results_job_id ON unified_results(job_id);
CREATE INDEX idx_unified_results_user_id ON unified_results(user_id);
CREATE INDEX idx_unified_results_provider ON unified_results(provider);
CREATE INDEX idx_threat_timeline_user_id ON threat_timeline(user_id);
CREATE INDEX idx_threat_timeline_severity ON threat_timeline(severity);
CREATE INDEX idx_threat_timeline_created_at ON threat_timeline(created_at DESC);
CREATE INDEX idx_remediation_actions_threat_id ON remediation_actions(threat_id);
CREATE INDEX idx_remediation_actions_status ON remediation_actions(status);
CREATE INDEX idx_scan_subs_user_id ON scan_subscriptions(user_id);
CREATE INDEX idx_scan_subs_is_active ON scan_subscriptions(is_active);
