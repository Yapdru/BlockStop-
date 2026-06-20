-- Revenue & Marketplace Schema

CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  plugin_id VARCHAR(255) NOT NULL,
  developer_id VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'subscription', 'one-time', 'affiliate', 'custom'
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  gross_amount DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  blockstop_fee DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  customer_id VARCHAR(255),
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id VARCHAR(255) NOT NULL UNIQUE,
  developer_id VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  bank_details JSONB,
  paypal_email VARCHAR(255),
  stripe_connect_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  transaction_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id VARCHAR(255) NOT NULL UNIQUE,
  developer_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  commission_rate DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id VARCHAR(255) NOT NULL UNIQUE,
  developer_id VARCHAR(255) NOT NULL,
  referred_customer_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  link_id VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approval_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_developer ON revenue_transactions(developer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_plugin ON revenue_transactions(plugin_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON revenue_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payouts_developer ON payout_requests(developer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_commissions_developer ON affiliate_commissions(developer_id);
