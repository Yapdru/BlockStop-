-- Phase 16: Enterprise API & Integrations Platform
-- Database schema for API management, webhooks, and integrations

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  secret_hash VARCHAR(255) NOT NULL,
  scopes TEXT[] DEFAULT '{"read:threats","read:scans"}',
  rate_limit INT DEFAULT 100,
  ip_whitelist INET[],
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_delivery_at TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 7,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INT REFERENCES users(id)
);

CREATE INDEX idx_webhooks_org ON webhooks(org_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active);
CREATE INDEX idx_webhooks_retry ON webhooks(next_retry_at) WHERE is_active = TRUE;

-- OAuth2 Tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  access_token_hash VARCHAR(255) UNIQUE NOT NULL,
  refresh_token_hash VARCHAR(255) UNIQUE,
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP NOT NULL,
  refresh_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_client ON oauth_tokens(client_id);
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_revoked ON oauth_tokens(revoked_at) WHERE revoked_at IS NULL;

-- OAuth2 Clients (for third-party integrations)
CREATE TABLE IF NOT EXISTS oauth_clients (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_secret_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] DEFAULT '{}',
  is_confidential BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  org_id INT REFERENCES organizations(id)
);

CREATE INDEX idx_oauth_clients_id ON oauth_clients(client_id);
CREATE INDEX idx_oauth_clients_org ON oauth_clients(org_id);

-- Integration Connections table
CREATE TABLE IF NOT EXISTS integration_connections (
  id SERIAL PRIMARY KEY,
  org_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type VARCHAR(100) NOT NULL,
  integration_name VARCHAR(255) NOT NULL,
  config JSONB DEFAULT '{}',
  auth_token VARCHAR(512),
  auth_refresh_token VARCHAR(512),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  last_error VARCHAR(1024),
  health_status VARCHAR(50) DEFAULT 'healthy',
  health_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INT REFERENCES users(id)
);

CREATE INDEX idx_integration_connections_org ON integration_connections(org_id);
CREATE INDEX idx_integration_connections_type ON integration_connections(integration_type);
CREATE INDEX idx_integration_connections_active ON integration_connections(is_active);
CREATE INDEX idx_integration_connections_health ON integration_connections(health_status);

-- API Audit Log table
CREATE TABLE IF NOT EXISTS api_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  api_key_id INT REFERENCES api_keys(id) ON DELETE SET NULL,
  org_id INT REFERENCES organizations(id),
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(512) NOT NULL,
  status_code INT,
  response_time_ms INT,
  request_size INT,
  response_size INT,
  error_message VARCHAR(1024),
  user_agent VARCHAR(512),
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_audit_logs_key ON api_audit_logs(api_key_id);
CREATE INDEX idx_api_audit_logs_org ON api_audit_logs(org_id);
CREATE INDEX idx_api_audit_logs_endpoint ON api_audit_logs(endpoint);
CREATE INDEX idx_api_audit_logs_created ON api_audit_logs(created_at);

-- Webhook Events (delivery tracking)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  webhook_id INT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  org_id INT REFERENCES organizations(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  last_attempt_status_code INT,
  last_attempt_error VARCHAR(1024),
  next_retry_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_webhook ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_org ON webhook_events(org_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at);
CREATE INDEX idx_webhook_events_retry ON webhook_events(next_retry_at) WHERE status = 'pending';

-- Dead Letter Queue for failed webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_dlq (
  id BIGSERIAL PRIMARY KEY,
  webhook_event_id BIGINT REFERENCES webhook_events(id),
  webhook_id INT REFERENCES webhooks(id),
  reason VARCHAR(1024),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_dlq_webhook ON webhook_dlq(webhook_id);
CREATE INDEX idx_webhook_dlq_created ON webhook_dlq(created_at);

-- Integration Health Metrics
CREATE TABLE IF NOT EXISTS integration_health_metrics (
  id BIGSERIAL PRIMARY KEY,
  integration_connection_id INT NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  latency_ms INT,
  error_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  last_error VARCHAR(1024),
  checked_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integration_health_metrics_connection ON integration_health_metrics(integration_connection_id);
CREATE INDEX idx_integration_health_metrics_created ON integration_health_metrics(created_at);

-- Rate Limit Tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id SERIAL PRIMARY KEY,
  api_key_id INT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMP NOT NULL,
  request_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_rate_limits_key ON api_rate_limits(api_key_id);
CREATE INDEX idx_api_rate_limits_window ON api_rate_limits(window_start);

-- API Rate Limit Exceeded Events
CREATE TABLE IF NOT EXISTS api_rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  api_key_id INT REFERENCES api_keys(id),
  org_id INT REFERENCES organizations(id),
  limit_value INT,
  exceeded_by INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_events_key ON api_rate_limit_events(api_key_id);
CREATE INDEX idx_rate_limit_events_org ON api_rate_limit_events(org_id);
CREATE INDEX idx_rate_limit_events_created ON api_rate_limit_events(created_at);

-- Grant tables for OAuth2
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL REFERENCES oauth_clients(client_id),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(255) UNIQUE NOT NULL,
  redirect_uri VARCHAR(2048) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX idx_auth_codes_client ON oauth_authorization_codes(client_id);
CREATE INDEX idx_auth_codes_expires ON oauth_authorization_codes(expires_at);

-- Create views for common queries
CREATE OR REPLACE VIEW active_api_keys AS
SELECT * FROM api_keys WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW());

CREATE OR REPLACE VIEW active_webhooks AS
SELECT * FROM webhooks WHERE is_active = TRUE;

CREATE OR REPLACE VIEW active_integrations AS
SELECT * FROM integration_connections WHERE is_active = TRUE;

-- Add audit columns to existing tables if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threats' AND column_name = 'api_created') THEN
    ALTER TABLE threats ADD COLUMN api_created BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'api_request_id') THEN
    ALTER TABLE scans ADD COLUMN api_request_id VARCHAR(255);
  END IF;
END $$;
