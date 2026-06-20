-- Zero Trust Security Framework Schema

-- Zero Trust Identities Table
CREATE TABLE IF NOT EXISTS zero_trust_identities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  identity_hash VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  risk_level VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Zero Trust Devices Table
CREATE TABLE IF NOT EXISTS zero_trust_devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  os_type VARCHAR(100),
  os_version VARCHAR(100),
  browser_type VARCHAR(100),
  browser_version VARCHAR(100),
  trust_score NUMERIC(5,2) DEFAULT 50.00,
  trust_level VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'active',
  is_compromised BOOLEAN DEFAULT FALSE,
  compromised_reason TEXT,
  quarantine_reason TEXT,
  quarantined_at TIMESTAMP,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_health_check TIMESTAMP,
  health_score NUMERIC(5,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, device_id)
);

-- Zero Trust Sessions Table
CREATE TABLE IF NOT EXISTS zero_trust_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  identity_id INTEGER,
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(255),
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  trust_score NUMERIC(5,2),
  access_level VARCHAR(50) DEFAULT 'full-access',
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_identity FOREIGN KEY (identity_id) REFERENCES zero_trust_identities(id) ON DELETE SET NULL
);

-- Zero Trust Behaviors Table
CREATE TABLE IF NOT EXISTS zero_trust_behaviors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  baseline_id VARCHAR(255) UNIQUE,
  usual_hours TEXT,
  usual_locations TEXT,
  known_devices TEXT,
  usual_access_patterns TEXT,
  avg_data_volume_mb NUMERIC(12,2),
  avg_session_duration_minutes INTEGER,
  typical_resource_access TEXT,
  anomaly_threshold NUMERIC(5,2) DEFAULT 0.75,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Zero Trust Access Requests Table
CREATE TABLE IF NOT EXISTS zero_trust_access_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  session_id INTEGER,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  action VARCHAR(50),
  location VARCHAR(255),
  ip_address INET,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  anomaly_detected BOOLEAN DEFAULT FALSE,
  anomaly_score NUMERIC(5,2),
  anomaly_type VARCHAR(100),
  decision VARCHAR(50) DEFAULT 'pending',
  access_level VARCHAR(50),
  restrictions TEXT,
  denial_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES zero_trust_sessions(id) ON DELETE SET NULL
);

-- Zero Trust Credentials Table
CREATE TABLE IF NOT EXISTS zero_trust_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  credential_type VARCHAR(100),
  credential_hash VARCHAR(255) NOT NULL,
  public_key TEXT,
  private_key_encrypted TEXT,
  encryption_key_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  rotation_required BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Device Health Issues Table
CREATE TABLE IF NOT EXISTS zero_trust_device_health_issues (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  issue_type VARCHAR(100),
  severity VARCHAR(20),
  description TEXT,
  recommendation TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Trust History (audit trail)
CREATE TABLE IF NOT EXISTS zero_trust_device_trust_history (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  previous_trust_score NUMERIC(5,2),
  new_trust_score NUMERIC(5,2),
  previous_level VARCHAR(20),
  new_level VARCHAR(20),
  reason TEXT,
  changed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly Events Table
CREATE TABLE IF NOT EXISTS zero_trust_anomalies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  device_id VARCHAR(255),
  anomaly_type VARCHAR(100),
  severity VARCHAR(20),
  description TEXT,
  anomaly_score NUMERIC(5,2),
  location VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  investigation_status VARCHAR(50) DEFAULT 'pending',
  investigation_notes TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zero_trust_devices_user_id ON zero_trust_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_devices_device_id ON zero_trust_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_devices_status ON zero_trust_devices(status);
CREATE INDEX IF NOT EXISTS idx_zero_trust_sessions_user_id ON zero_trust_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_sessions_device_id ON zero_trust_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_sessions_is_active ON zero_trust_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_zero_trust_sessions_expires_at ON zero_trust_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_zero_trust_behaviors_user_id ON zero_trust_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_access_requests_user_id ON zero_trust_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_access_requests_timestamp ON zero_trust_access_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_zero_trust_access_requests_decision ON zero_trust_access_requests(decision);
CREATE INDEX IF NOT EXISTS idx_zero_trust_anomalies_user_id ON zero_trust_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_zero_trust_anomalies_detected_at ON zero_trust_anomalies(detected_at);
CREATE INDEX IF NOT EXISTS idx_zero_trust_device_health_device_id ON zero_trust_device_health_issues(device_id);
