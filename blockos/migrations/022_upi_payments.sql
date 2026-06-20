-- UPI Payment Integration

CREATE TABLE IF NOT EXISTS upi_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reference_id TEXT UNIQUE,
  qr_code TEXT,
  deep_link TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_upi_transactions_users FOREIGN KEY (user_id) REFERENCES users_neo(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_upi_transactions_user_id ON upi_transactions(user_id);
CREATE INDEX idx_upi_transactions_status ON upi_transactions(status);
CREATE INDEX idx_upi_transactions_created_at ON upi_transactions(created_at DESC);
CREATE INDEX idx_upi_transactions_reference_id ON upi_transactions(reference_id);
