-- Customer Success & Onboarding Schema

CREATE TABLE IF NOT EXISTS onboarding_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255) NOT NULL UNIQUE,
  plan_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  target_completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_phase VARCHAR(50) NOT NULL DEFAULT 'account-setup',
  completion_percentage INTEGER DEFAULT 0,
  dedicated_cse VARCHAR(255),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS onboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(255) NOT NULL REFERENCES onboarding_plans(plan_id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  phase VARCHAR(50) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'not-started',
  assignee VARCHAR(255),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  estimated_hours DECIMAL(5, 2),
  dependencies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, item_id)
);

CREATE TABLE IF NOT EXISTS customer_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255) NOT NULL UNIQUE,
  overall_score INTEGER NOT NULL,
  health_status VARCHAR(50) NOT NULL, -- 'green', 'yellow', 'red'
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  breakdown JSONB,
  trend VARCHAR(50),
  risk_factors TEXT[],
  opportunities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255) NOT NULL,
  survey_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  nps_score INTEGER NOT NULL,
  comment TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_customer ON onboarding_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_phase ON onboarding_plans(current_phase);
CREATE INDEX IF NOT EXISTS idx_checklist_plan ON onboarding_checklist_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_health_customer ON customer_health_scores(customer_id);
CREATE INDEX IF NOT EXISTS idx_nps_customer ON nps_surveys(customer_id);
