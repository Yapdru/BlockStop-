-- Migration: Optimize Indexes
-- Description: Create comprehensive index strategy with composite, partial, and function-based indexes
-- Created: 2024-01-15

-- ===== Composite Indexes =====
-- These indexes are optimized for common multi-column WHERE and JOIN conditions

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email_status
ON users (email, status)
WHERE status != 'deleted';

CREATE INDEX IF NOT EXISTS idx_users_created_at_organization
ON users (created_at DESC, organization_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_organization_role
ON users (organization_id, role)
WHERE active = true;

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_status
ON orders (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_organization_date
ON orders (organization_id, created_at DESC)
WHERE status NOT IN ('cancelled', 'failed');

CREATE INDEX IF NOT EXISTS idx_orders_status_updated
ON orders (status, updated_at DESC)
WHERE deleted_at IS NULL;

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_status
ON products (category_id, status)
WHERE active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_vendor_sku
ON products (vendor_id, sku)
UNIQUE;

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
ON transactions (user_id, created_at DESC)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_transactions_type_date
ON transactions (transaction_type, created_at DESC)
WHERE deleted_at IS NULL;

-- ===== Partial Indexes =====
-- These indexes only index filtered rows, saving space for filtered queries

-- Active users only
CREATE INDEX IF NOT EXISTS idx_users_active
ON users (id)
WHERE active = true AND deleted_at IS NULL;

-- Recent orders (last 90 days)
CREATE INDEX IF NOT EXISTS idx_orders_recent
ON orders (id, user_id, created_at)
WHERE created_at > CURRENT_DATE - INTERVAL '90 days';

-- Pending transactions
CREATE INDEX IF NOT EXISTS idx_transactions_pending
ON transactions (id, user_id, created_at)
WHERE status IN ('pending', 'processing');

-- High-value orders (> 1000)
CREATE INDEX IF NOT EXISTS idx_orders_high_value
ON orders (id, user_id, total_amount)
WHERE total_amount > 1000;

-- ===== Function-Based Indexes =====
-- These indexes are based on function results for advanced queries

-- Case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_users_email_lower
ON users (LOWER(email));

-- Year from timestamps for range queries
CREATE INDEX IF NOT EXISTS idx_orders_year
ON orders (EXTRACT(YEAR FROM created_at), status);

CREATE INDEX IF NOT EXISTS idx_transactions_month
ON transactions (EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at));

-- Full text search on product names and descriptions
CREATE INDEX IF NOT EXISTS idx_products_search
ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ===== GIN Indexes (for arrays) =====
-- These are useful if you have array columns

CREATE INDEX IF NOT EXISTS idx_users_tags_gin
ON users USING GIN (tags)
WHERE tags IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_tags_gin
ON products USING GIN (tags)
WHERE tags IS NOT NULL;

-- ===== GIST Indexes (for geometric types) =====
-- These are useful if you have location or geometry columns

CREATE INDEX IF NOT EXISTS idx_locations_gist
ON locations USING GIST (coordinates)
WHERE deleted_at IS NULL;

-- ===== Performance Monitoring Tables =====

-- Query log table for tracking slow queries
CREATE TABLE IF NOT EXISTS query_log (
    id SERIAL PRIMARY KEY,
    normalized_query TEXT NOT NULL,
    execution_time NUMERIC NOT NULL,
    rows_affected INTEGER,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_query_log_executed_at
ON query_log (executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_log_normalized_query
ON query_log (normalized_query);

CREATE INDEX IF NOT EXISTS idx_query_log_user_id
ON query_log (user_id)
WHERE user_id IS NOT NULL;

-- Slow queries table
CREATE TABLE IF NOT EXISTS slow_queries (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    execution_time NUMERIC NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    rows_affected INTEGER,
    plan_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_slow_queries_timestamp
ON slow_queries (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_slow_queries_user_id
ON slow_queries (user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_slow_queries_query
ON slow_queries (query) USING HASH;

-- Replication events table
CREATE TABLE IF NOT EXISTS replication_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    severity VARCHAR(20),
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_replication_events_timestamp
ON replication_events (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_replication_events_type
ON replication_events (event_type)
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days';

-- ===== Cleanup Old Indexes =====
-- Drop redundant indexes if any exist

-- Drop individual column indexes if composite indexes exist
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;

-- ===== Index Analysis =====

-- Analyze all indexes to update statistics
ANALYZE;

-- Grant permissions
GRANT SELECT ON query_log TO PUBLIC;
GRANT SELECT ON slow_queries TO PUBLIC;
GRANT SELECT ON replication_events TO PUBLIC;
