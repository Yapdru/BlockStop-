-- Phase 16: Comprehensive Authentication System
-- OAuth2, API Keys, JWT Tokens, and Audit Logging

-- ============================================================================
-- API Keys Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]',
  ip_whitelist JSONB,
  rate_limit INTEGER,
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_user_api_keys (user_id),
  INDEX idx_api_key_active (is_active),
  INDEX idx_api_key_expires (expires_at)
);

-- ============================================================================
-- Tokens Table (JWT and Session Tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token VARCHAR(512) NOT NULL UNIQUE,
  refresh_token VARCHAR(512) NOT NULL UNIQUE,
  scopes JSONB NOT NULL DEFAULT '[]',
  client_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_token_user (user_id),
  INDEX idx_token_access (access_token),
  INDEX idx_token_refresh (refresh_token),
  INDEX idx_token_revoked (revoked_at),
  INDEX idx_token_expires (expires_at)
);

-- ============================================================================
-- OAuth2 Clients Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth2_clients (
  client_id VARCHAR(255) PRIMARY KEY,
  secret_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  redirect_uris JSONB NOT NULL DEFAULT '[]',
  scopes JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  rate_limit INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_oauth_client_active (is_active)
);

-- ============================================================================
-- OAuth2 Authorization Codes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth2_auth_codes (
  code VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL REFERENCES oauth2_clients(client_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scopes JSONB NOT NULL DEFAULT '[]',
  redirect_uri TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_auth_code_client (client_id),
  INDEX idx_auth_code_user (user_id),
  INDEX idx_auth_code_expires (expires_at),
  INDEX idx_auth_code_used (used)
);

-- ============================================================================
-- OAuth2 Tokens Table (for service accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth2_tokens (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  access_token VARCHAR(512) NOT NULL UNIQUE,
  client_id VARCHAR(255) NOT NULL REFERENCES oauth2_clients(client_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  scopes JSONB NOT NULL DEFAULT '[]',
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_oauth_token_client (client_id),
  INDEX idx_oauth_token_user (user_id),
  INDEX idx_oauth_token_access (access_token),
  INDEX idx_oauth_token_expires (expires_at)
);

-- ============================================================================
-- Audit Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  client_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  details JSONB,
  severity VARCHAR(50) DEFAULT 'low',
  mfa_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_audit_user (user_id),
  INDEX idx_audit_event_type (event_type),
  INDEX idx_audit_severity (severity),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_status (status),
  INDEX idx_audit_resource (resource_type, resource_id)
);

-- ============================================================================
-- Rate Limiting Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id VARCHAR(255) PRIMARY KEY,
  api_key_id VARCHAR(255) REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR(255),
  ip_address INET,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  exceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_rate_limit_key (api_key_id),
  INDEX idx_rate_limit_user (user_id),
  INDEX idx_rate_limit_client (client_id),
  INDEX idx_rate_limit_ip (ip_address),
  INDEX idx_rate_limit_window (window_start, window_end)
);

-- ============================================================================
-- IP Whitelist Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id VARCHAR(255) REFERENCES api_keys(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_whitelist_user (user_id),
  INDEX idx_whitelist_key (api_key_id),
  INDEX idx_whitelist_ip (ip_address),
  INDEX idx_whitelist_active (is_active)
);

-- ============================================================================
-- HMAC Signature Secrets Table (for webhook signature validation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hmac_secrets (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  webhook_id VARCHAR(255),
  secret_hash VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_hmac_user (user_id),
  INDEX idx_hmac_webhook (webhook_id),
  INDEX idx_hmac_active (is_active)
);

-- ============================================================================
-- Session Management Table (optional, for session tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id VARCHAR(255) REFERENCES tokens(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  INDEX idx_session_user (user_id),
  INDEX idx_session_active (is_active),
  INDEX idx_session_expires (expires_at)
);

-- ============================================================================
-- MFA Configuration Table (extension to existing 2FA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mfa_methods (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL, -- 'totp', 'sms', 'email', 'backup_codes'
  secret_hash VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  INDEX idx_mfa_user (user_id),
  INDEX idx_mfa_method (method_type),
  INDEX idx_mfa_verified (is_verified)
);

-- ============================================================================
-- Function to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all auth tables
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tokens_updated_at BEFORE UPDATE ON tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER oauth2_clients_updated_at BEFORE UPDATE ON oauth2_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER oauth2_auth_codes_updated_at BEFORE UPDATE ON oauth2_auth_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ip_whitelist_updated_at BEFORE UPDATE ON ip_whitelist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER hmac_secrets_updated_at BEFORE UPDATE ON hmac_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER mfa_methods_updated_at BEFORE UPDATE ON mfa_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Active API keys view
CREATE OR REPLACE VIEW active_api_keys AS
SELECT
  ak.id,
  ak.user_id,
  ak.name,
  ak.scopes,
  ak.rate_limit,
  ak.last_used,
  ak.expires_at,
  ak.created_at,
  (ak.expires_at IS NULL OR ak.expires_at > NOW()) AS is_valid
FROM api_keys ak
WHERE ak.is_active = true;

-- Active tokens view
CREATE OR REPLACE VIEW active_tokens AS
SELECT
  t.id,
  t.user_id,
  t.scopes,
  t.client_id,
  t.expires_at,
  t.created_at,
  (t.expires_at > NOW() AND t.revoked_at IS NULL) AS is_valid
FROM tokens t;

-- Recent audit events view
CREATE OR REPLACE VIEW recent_audit_events AS
SELECT
  al.id,
  al.event_type,
  al.user_id,
  al.action,
  al.status,
  al.severity,
  al.created_at
FROM audit_logs al
WHERE al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

-- User security summary view
CREATE OR REPLACE VIEW user_security_summary AS
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT CASE WHEN ak.is_active THEN ak.id END) AS active_api_keys,
  COUNT(DISTINCT CASE WHEN t.revoked_at IS NULL AND t.expires_at > NOW() THEN t.id END) AS active_tokens,
  MAX(CASE WHEN al.event_type LIKE 'auth.%' THEN al.created_at END) AS last_auth_event,
  COUNT(DISTINCT CASE WHEN al.severity IN ('high', 'critical') THEN al.id END) AS high_severity_events
FROM users u
LEFT JOIN api_keys ak ON u.id = ak.user_id
LEFT JOIN tokens t ON u.id = t.user_id
LEFT JOIN audit_logs al ON u.id = al.user_id AND al.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email;

-- ============================================================================
-- Cleanup Job Procedures (for expired token cleanup)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS TABLE(deleted_tokens BIGINT, deleted_codes BIGINT, deleted_rate_limits BIGINT) AS $$
DECLARE
  v_deleted_tokens BIGINT;
  v_deleted_codes BIGINT;
  v_deleted_rate_limits BIGINT;
BEGIN
  -- Delete expired tokens
  DELETE FROM tokens WHERE refresh_expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS v_deleted_tokens = ROW_COUNT;

  -- Delete expired authorization codes
  DELETE FROM oauth2_auth_codes WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted_codes = ROW_COUNT;

  -- Delete expired rate limit records
  DELETE FROM rate_limits WHERE window_end < NOW();
  GET DIAGNOSTICS v_deleted_rate_limits = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_tokens, v_deleted_codes, v_deleted_rate_limits;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant permissions (adjust based on your application roles)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE ON api_keys TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON tokens TO app_user;
-- GRANT SELECT, INSERT ON audit_logs TO app_user;
-- GRANT SELECT ON oauth2_clients TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON oauth2_auth_codes TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON oauth2_tokens TO app_user;
