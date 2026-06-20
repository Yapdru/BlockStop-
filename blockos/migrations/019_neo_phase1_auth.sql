-- NEO Phase 1: Tiered Licensing & User Management

-- Plans table (tier definitions)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_scans_per_month INTEGER,
  features JSONB DEFAULT '{}',
  price_monthly DECIMAL DEFAULT 0,
  price_annual DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced users table for multi-user support
CREATE TABLE IF NOT EXISTS users_neo (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  auth_method TEXT NOT NULL,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  passkey_credential_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  team_id TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_users_neo_plans FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Teams table (for PRO tier)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  max_users INTEGER DEFAULT 6,
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_teams_users_neo FOREIGN KEY (created_by) REFERENCES users_neo(id),
  CONSTRAINT fk_teams_plans FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_team_members_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  team_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_subscriptions_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plans FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- VPN preferences (PRO feature)
CREATE TABLE IF NOT EXISTS vpn_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preferred_vpn TEXT,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_vpn_prefs_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

-- Neo scans (user-scoped)
CREATE TABLE IF NOT EXISTS scans_neo (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  result JSONB,
  threat_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_scans_neo_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE,
  CONSTRAINT fk_scans_neo_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_users_neo_email ON users_neo(email);
CREATE INDEX idx_users_neo_plan_id ON users_neo(plan_id);
CREATE INDEX idx_users_neo_team_id ON users_neo(team_id);
CREATE INDEX idx_teams_plan_id ON teams(plan_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_team_id ON subscriptions(team_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_scans_neo_user_id ON scans_neo(user_id);
CREATE INDEX idx_scans_neo_team_id ON scans_neo(team_id);
CREATE INDEX idx_scans_neo_created_at ON scans_neo(created_at DESC);
