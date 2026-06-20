-- Phase 27.8: Payment Verification & Subscription Management
-- Critical for production deployment
-- Created: 2026-06-20

CREATE SCHEMA IF NOT EXISTS billing;

-- Subscriptions table: Stores all subscription records
CREATE TABLE billing.subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('free', 'neo', 'pro', 'office', 'health', 'max')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for performance
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status) WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_user_id ON billing.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON billing.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON billing.subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON billing.subscriptions(tier);
CREATE INDEX idx_subscriptions_expiry ON billing.subscriptions(current_period_end);

-- Payment records: Detailed log of all payments
CREATE TABLE billing.payment_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id INTEGER NOT NULL REFERENCES billing.subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_charge_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded', 'pending')),
  payment_method VARCHAR(100),
  jwt_token TEXT,
  token_issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_records_user_id ON billing.payment_records(user_id);
CREATE INDEX idx_payment_records_stripe_invoice ON billing.payment_records(stripe_invoice_id);
CREATE INDEX idx_payment_records_status ON billing.payment_records(status);
CREATE INDEX idx_payment_records_created ON billing.payment_records(created_at);

-- Revoked tokens: Track invalidated JWT tokens
CREATE TABLE billing.revoked_tokens (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255),
  metadata JSONB
);

CREATE INDEX idx_revoked_tokens_user_id ON billing.revoked_tokens(user_id);
CREATE INDEX idx_revoked_tokens_hash ON billing.revoked_tokens(token_hash);

-- Payment webhooks: Log all webhook events from payment providers
CREATE TABLE billing.payment_webhooks (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paytm', 'razorpay')),
  event_type VARCHAR(100) NOT NULL,
  external_event_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(512),
  signature_valid BOOLEAN,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_webhooks_provider ON billing.payment_webhooks(provider);
CREATE INDEX idx_payment_webhooks_event_id ON billing.payment_webhooks(external_event_id);
CREATE INDEX idx_payment_webhooks_processed ON billing.payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_created ON billing.payment_webhooks(created_at);

-- Subscription audit log: Track all changes to subscriptions
CREATE TABLE billing.subscription_audit_log (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES billing.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  old_tier VARCHAR(50),
  new_tier VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_subscription ON billing.subscription_audit_log(subscription_id);
CREATE INDEX idx_audit_log_user ON billing.subscription_audit_log(user_id);
CREATE INDEX idx_audit_log_action ON billing.subscription_audit_log(action);

-- Billing settings: Team/organization billing configuration
CREATE TABLE billing.team_billing_settings (
  id SERIAL PRIMARY KEY,
  team_id UUID NOT NULL,
  stripe_customer_id VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address JSONB,
  payment_method VARCHAR(100),
  auto_renew BOOLEAN DEFAULT TRUE,
  renewal_date_day INTEGER CHECK (renewal_date_day >= 1 AND renewal_date_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_billing_team_id ON billing.team_billing_settings(team_id);
CREATE INDEX idx_team_billing_stripe_customer ON billing.team_billing_settings(stripe_customer_id);

-- Tier limits: Define usage limits per tier
CREATE TABLE billing.tier_limits (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL UNIQUE CHECK (tier IN ('free', 'neo', 'pro', 'office', 'health', 'max')),
  scans_per_day INTEGER,
  scans_per_month INTEGER,
  api_requests_per_minute INTEGER,
  storage_gb INTEGER,
  team_members INTEGER,
  custom_rules BOOLEAN,
  siem_integrations BOOLEAN,
  offline_mode BOOLEAN,
  white_label BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tier limits
INSERT INTO billing.tier_limits (tier, scans_per_day, scans_per_month, api_requests_per_minute, storage_gb, team_members, custom_rules, siem_integrations, offline_mode, white_label) VALUES
('free', 10, 300, 10, 1, 1, FALSE, FALSE, FALSE, FALSE),
('neo', 50, 1500, 100, 10, 3, FALSE, FALSE, TRUE, FALSE),
('pro', 200, 6000, 1000, 100, 10, TRUE, FALSE, TRUE, FALSE),
('office', 1000, 30000, 10000, 500, 100, TRUE, TRUE, TRUE, FALSE),
('health', 2000, 60000, 10000, 500, 100, TRUE, TRUE, TRUE, FALSE),
('max', NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE);

-- Automatic update_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON billing.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON billing.payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_billing_settings_updated_at BEFORE UPDATE ON billing.team_billing_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tier_limits_updated_at BEFORE UPDATE ON billing.tier_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant proper permissions
GRANT USAGE ON SCHEMA billing TO blockstop_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA billing TO blockstop_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA billing TO blockstop_app;

COMMIT;
