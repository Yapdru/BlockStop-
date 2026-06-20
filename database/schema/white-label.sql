-- White-Label & Multi-Tenancy Schema

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'starter',
  custom_domain VARCHAR(255) UNIQUE,
  database_connection VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  max_users INTEGER NOT NULL,
  max_storage_gb INTEGER NOT NULL,
  features TEXT[],
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL UNIQUE REFERENCES tenants(tenant_id),
  company_name VARCHAR(255),
  company_logo VARCHAR(255),
  favicon VARCHAR(255),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  font_family VARCHAR(100),
  login_page_background VARCHAR(255),
  custom_css TEXT,
  email_logo_url VARCHAR(255),
  report_header_image_url VARCHAR(255),
  report_footer_text TEXT,
  support_contact_email VARCHAR(255),
  support_phone_number VARCHAR(20),
  documentation_url VARCHAR(255),
  privacy_policy_url VARCHAR(255),
  terms_of_service_url VARCHAR(255),
  custom_email_domain VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL UNIQUE REFERENCES tenants(tenant_id),
  current_users INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,
  api_calls_this_month INTEGER DEFAULT 0,
  scan_count_this_month INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR(255) NOT NULL UNIQUE,
  tenant_id VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255),
  url VARCHAR(255),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  address TEXT,
  tier VARCHAR(50) NOT NULL DEFAULT 'silver',
  margin_percentage DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  account_manager VARCHAR(255),
  annual_revenue DECIMAL(15, 2) DEFAULT 0,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS reseller_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255) NOT NULL UNIQUE,
  reseller_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  contact_email VARCHAR(255),
  tier VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  mrr DECIMAL(12, 2) DEFAULT 0,
  FOREIGN KEY (reseller_id) REFERENCES resellers(reseller_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reseller_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL UNIQUE,
  reseller_id VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  reseller_cost DECIMAL(12, 2),
  reseller_margin DECIMAL(12, 2),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  invoice_number VARCHAR(100),
  FOREIGN KEY (reseller_id) REFERENCES resellers(reseller_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deal_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id VARCHAR(255) NOT NULL UNIQUE,
  reseller_id VARCHAR(255) NOT NULL,
  deal_name VARCHAR(255) NOT NULL,
  prospect_name VARCHAR(255),
  deal_amount DECIMAL(15, 2),
  estimated_close_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'registered',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (reseller_id) REFERENCES resellers(reseller_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_tier ON tenants(tier);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_branding_tenant ON tenant_branding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON brand_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resellers_approval ON resellers(approval_status);
CREATE INDEX IF NOT EXISTS idx_resellers_active ON resellers(is_active);
CREATE INDEX IF NOT EXISTS idx_reseller_customers ON reseller_customers(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_orders ON reseller_orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_deals_reseller ON deal_registrations(reseller_id);
