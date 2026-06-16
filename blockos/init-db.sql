-- BlockOS Database Initialization
-- PostgreSQL schema for BlockStop NEO

-- Create plans table (tier definitions)
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    max_users INTEGER DEFAULT 1,
    price_monthly DECIMAL(10, 2) DEFAULT 0,
    features_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table with auth support
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    plan_id INTEGER DEFAULT 1 REFERENCES plans(id),
    auth_method VARCHAR(20) DEFAULT 'password',
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    passkey_credential_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create email scan history table
CREATE TABLE IF NOT EXISTS email_scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_content TEXT NOT NULL,
    risk_score INTEGER,
    threats TEXT[],
    phishing_risk INTEGER,
    spam_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file scan history table
CREATE TABLE IF NOT EXISTS file_scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_hash VARCHAR(64),
    threat_level VARCHAR(20),
    threats TEXT[],
    malware_signatures INTEGER,
    ransomware_risk INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_scans_user_id ON email_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_email_scans_created_at ON email_scans(created_at);
CREATE INDEX IF NOT EXISTS idx_file_scans_user_id ON file_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_file_scans_created_at ON file_scans(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create statistics table
CREATE TABLE IF NOT EXISTS statistics (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    total_scans INTEGER DEFAULT 0,
    threats_detected INTEGER DEFAULT 0,
    malware_found INTEGER DEFAULT 0,
    average_risk_score DECIMAL(5, 2)
);

-- Insert plan tiers
INSERT INTO plans (name, max_users, price_monthly, features_json) VALUES
('free', 1, 0, '{"emailAnalysis": true, "fileScanning": true, "teamCollaboration": false, "twoFactor": false, "captchaRequired": false, "vpnIntegration": false, "wifiChecker": false, "advancedAnalytics": false}'),
('pro', 6, 9.99, '{"emailAnalysis": true, "fileScanning": true, "teamCollaboration": true, "twoFactor": true, "captchaRequired": true, "vpnIntegration": true, "wifiChecker": true, "advancedAnalytics": true}')
ON CONFLICT (name) DO NOTHING;

-- PHASE 2: TEAM MANAGEMENT, VPN, AND BILLING

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    max_users INTEGER DEFAULT 6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create team members table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    token VARCHAR(255) UNIQUE NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create VPN providers table
CREATE TABLE IF NOT EXISTS vpn_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    server_count INTEGER,
    tier VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user VPN preferences table
CREATE TABLE IF NOT EXISTS user_vpn_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vpn_id INTEGER REFERENCES vpn_providers(id),
    is_enabled BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vpn_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active',
    billing_period_end TIMESTAMP,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CAPTCHA challenges table
CREATE TABLE IF NOT EXISTS captcha_challenges (
    id VARCHAR(255) PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update users table with Phase 2 fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vpn_preferences_user_id ON user_vpn_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_expires_at ON captcha_challenges(expires_at);

-- Grant permissions to blockstop user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blockstop;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO blockstop;
