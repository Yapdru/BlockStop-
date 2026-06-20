-- PayTM billing and user settings

CREATE TABLE IF NOT EXISTS paytm_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'initiated',
  paytm_transaction_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_paytm_orders_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  threat_alert_level TEXT DEFAULT 'high',
  auto_scan_enabled BOOLEAN DEFAULT true,
  auto_scan_interval TEXT DEFAULT 'daily',
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user_settings_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_access_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  accessed_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_admin_logs_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_paytm_orders_user_id ON paytm_orders(user_id);
CREATE INDEX idx_paytm_orders_status ON paytm_orders(status);
CREATE INDEX idx_paytm_orders_created_at ON paytm_orders(created_at DESC);
CREATE INDEX idx_admin_access_logs_user_id ON admin_access_logs(user_id);
CREATE INDEX idx_admin_access_logs_accessed_at ON admin_access_logs(accessed_at DESC);
