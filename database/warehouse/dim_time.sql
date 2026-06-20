-- Dimension Table: Time
-- Complete time dimension for temporal analysis

CREATE TABLE IF NOT EXISTS dim_time (
  date_key BIGINT PRIMARY KEY,
  full_date DATE NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  month INTEGER NOT NULL,
  week INTEGER NOT NULL,
  day_of_year INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  day_name VARCHAR(10),
  week_name VARCHAR(20),
  month_name VARCHAR(15),
  quarter_name VARCHAR(10),

  -- Day classification
  is_weekday BOOLEAN,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_last_day_of_month BOOLEAN,
  is_last_day_of_quarter BOOLEAN,
  is_last_day_of_year BOOLEAN,

  -- Previous/next period keys
  previous_date_key BIGINT,
  next_date_key BIGINT,
  same_day_last_year BIGINT,
  same_day_last_month BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_dim_time_year (year),
  INDEX idx_dim_time_month (month),
  INDEX idx_dim_time_quarter (quarter),
  INDEX idx_dim_time_day_of_week (day_of_week),
  INDEX idx_dim_time_is_weekday (is_weekday),
  INDEX idx_dim_time_is_holiday (is_holiday)
);

-- Hour dimension table
CREATE TABLE IF NOT EXISTS dim_hour (
  hour_key BIGINT PRIMARY KEY,
  full_hour TIMESTAMP NOT NULL UNIQUE,
  hour_of_day INTEGER NOT NULL,
  hour_minute VARCHAR(5),
  is_business_hours BOOLEAN DEFAULT FALSE,
  is_peak_hours BOOLEAN DEFAULT FALSE,
  date_key BIGINT NOT NULL REFERENCES dim_time(date_key),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_hour_hour_of_day (hour_of_day),
  INDEX idx_dim_hour_is_business_hours (is_business_hours),
  INDEX idx_dim_hour_date_key (date_key)
);

-- Minute dimension table
CREATE TABLE IF NOT EXISTS dim_minute (
  minute_key BIGINT PRIMARY KEY,
  full_minute TIMESTAMP NOT NULL UNIQUE,
  hour_key BIGINT NOT NULL REFERENCES dim_hour(hour_key),
  minute_of_hour INTEGER NOT NULL,
  minute_of_day INTEGER NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_dim_minute_minute_of_hour (minute_of_hour),
  INDEX idx_dim_minute_hour_key (hour_key)
);

-- Fiscal calendar dimension
CREATE TABLE IF NOT EXISTS dim_fiscal_calendar (
  date_key BIGINT PRIMARY KEY REFERENCES dim_time(date_key),
  fiscal_year INTEGER,
  fiscal_quarter INTEGER,
  fiscal_month INTEGER,
  fiscal_week INTEGER,
  fiscal_day_of_year INTEGER,
  fiscal_period_name VARCHAR(20),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_fiscal_year (fiscal_year),
  INDEX idx_fiscal_quarter (fiscal_quarter),
  INDEX idx_fiscal_month (fiscal_month)
);

-- Business calendar dimension (for holidays and special dates)
CREATE TABLE IF NOT EXISTS dim_business_calendar (
  date_key BIGINT PRIMARY KEY REFERENCES dim_time(date_key),
  business_days_in_month INTEGER,
  business_days_remaining INTEGER,
  next_business_day BIGINT,
  previous_business_day BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Season and weather dimension
CREATE TABLE IF NOT EXISTS dim_season (
  date_key BIGINT PRIMARY KEY REFERENCES dim_time(date_key),
  season VARCHAR(20),
  is_holiday_season BOOLEAN DEFAULT FALSE,
  quarter_name VARCHAR(20),
  month_in_quarter INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_season (season)
);

-- Event dimension (for special events and campaign periods)
CREATE TABLE IF NOT EXISTS dim_events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  start_date_key BIGINT NOT NULL REFERENCES dim_time(date_key),
  end_date_key BIGINT REFERENCES dim_time(date_key),
  event_type VARCHAR(50),
  event_category VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_event_name (event_name),
  INDEX idx_event_type (event_type),
  INDEX idx_event_start_date (start_date_key)
);

-- Relative date dimension (for easier relative date filtering)
CREATE TABLE IF NOT EXISTS dim_relative_date (
  date_key BIGINT PRIMARY KEY REFERENCES dim_time(date_key),
  is_today BOOLEAN DEFAULT FALSE,
  is_yesterday BOOLEAN DEFAULT FALSE,
  is_this_week BOOLEAN DEFAULT FALSE,
  is_last_week BOOLEAN DEFAULT FALSE,
  is_this_month BOOLEAN DEFAULT FALSE,
  is_last_month BOOLEAN DEFAULT FALSE,
  is_this_quarter BOOLEAN DEFAULT FALSE,
  is_last_quarter BOOLEAN DEFAULT FALSE,
  is_this_year BOOLEAN DEFAULT FALSE,
  is_last_year BOOLEAN DEFAULT FALSE,
  is_future BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_is_today (is_today),
  INDEX idx_is_this_week (is_this_week),
  INDEX idx_is_this_month (is_this_month),
  INDEX idx_is_this_year (is_this_year)
);
