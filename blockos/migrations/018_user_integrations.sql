-- Create user_integrations table for storing OAuth connections
CREATE TABLE IF NOT EXISTS user_integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  service_type TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  scopes TEXT DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_integrations_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON user_integrations(provider);
CREATE INDEX idx_user_integrations_service_type ON user_integrations(service_type);
CREATE INDEX idx_user_integrations_is_active ON user_integrations(is_active);

-- Create scan_logs table for tracking integration scans
CREATE TABLE IF NOT EXISTS integration_scan_logs (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  items_scanned INTEGER DEFAULT 0,
  threats_detected INTEGER DEFAULT 0,
  scan_duration_ms INTEGER,
  status TEXT NOT NULL,
  error_message TEXT,
  scan_details JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_scan_logs_user_integrations FOREIGN KEY (integration_id) REFERENCES user_integrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_scan_logs_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_integration_scan_logs_integration_id ON integration_scan_logs(integration_id);
CREATE INDEX idx_integration_scan_logs_user_id ON integration_scan_logs(user_id);
CREATE INDEX idx_integration_scan_logs_provider ON integration_scan_logs(provider);
CREATE INDEX idx_integration_scan_logs_created_at ON integration_scan_logs(created_at DESC);

-- Create integration_preferences table for user settings
CREATE TABLE IF NOT EXISTS integration_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  auto_scan_enabled BOOLEAN DEFAULT false,
  auto_scan_interval_minutes INTEGER DEFAULT 60,
  notification_on_threat BOOLEAN DEFAULT true,
  notification_on_scan_complete BOOLEAN DEFAULT false,
  preferred_providers TEXT DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_preferences_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_integration_preferences_user_id ON integration_preferences(user_id);
