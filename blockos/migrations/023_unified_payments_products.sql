-- Unified payment system and product tiers

-- Add new product tiers to plans
INSERT INTO plans (id, name, tier_level, max_users, features, price_monthly, price_annual, created_at)
VALUES
  ('plan_health', 'health', 5, 5000, '{"features": ["hipaa", "hitech", "patient_protection"]}', 599, 5999, NOW()),
  ('plan_office', 'office', 4, 5000, '{"features": ["on_premise", "ldap", "automation"]}', 499, 4999, NOW())
ON CONFLICT DO NOTHING;

-- Unified transactions table
CREATE TABLE IF NOT EXISTS unified_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  product TEXT NOT NULL,
  frequency TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'pending',
  reference_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_unified_txns_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

-- BHIM transactions
CREATE TABLE IF NOT EXISTS bhim_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  deep_link TEXT,
  reference_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_bhim_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

-- Apple Pay transactions
CREATE TABLE IF NOT EXISTS apple_pay_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  apple_payment_token TEXT,
  merchant_reference TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_apple_pay_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

-- Enterprise integrations
CREATE TABLE IF NOT EXISTS enterprise_integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT,
  connector_name TEXT NOT NULL,
  connector_category TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_ent_integ_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_ent_integ_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_unified_txns_user_id ON unified_transactions(user_id);
CREATE INDEX idx_unified_txns_method ON unified_transactions(payment_method);
CREATE INDEX idx_unified_txns_status ON unified_transactions(status);
CREATE INDEX idx_unified_txns_product ON unified_transactions(product);
CREATE INDEX idx_bhim_txns_user_id ON bhim_transactions(user_id);
CREATE INDEX idx_bhim_txns_status ON bhim_transactions(status);
CREATE INDEX idx_apple_pay_txns_user_id ON apple_pay_transactions(user_id);
CREATE INDEX idx_apple_pay_txns_status ON apple_pay_transactions(status);
CREATE INDEX idx_ent_integ_user_id ON enterprise_integrations(user_id);
CREATE INDEX idx_ent_integ_connector ON enterprise_integrations(connector_name);
CREATE INDEX idx_ent_integ_active ON enterprise_integrations(is_active);
