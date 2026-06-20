-- Migration: Add Table Partitioning
-- Description: Implement range partitioning for time-series data
-- Created: 2024-01-15

-- ===== Enable Partitioning Extension =====
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- ===== Orders Table Partitioning by Date =====
-- Partition orders table by month for better performance on time-range queries

-- First, create the partitioned table structure
CREATE TABLE IF NOT EXISTS orders_partitioned (
    id BIGSERIAL,
    user_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    metadata JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (DATE_TRUNC('month', created_at));

-- Create partitions for the last 24 months and next 12 months
-- Partitions for 2023
CREATE TABLE IF NOT EXISTS orders_partitioned_2023_01 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_02 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_03 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-03-01') TO ('2023-04-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_04 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-04-01') TO ('2023-05-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_05 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-05-01') TO ('2023-06-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_06 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-06-01') TO ('2023-07-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_07 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-07-01') TO ('2023-08-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_08 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-08-01') TO ('2023-09-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_09 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-09-01') TO ('2023-10-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_10 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-10-01') TO ('2023-11-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_11 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-11-01') TO ('2023-12-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2023_12 PARTITION OF orders_partitioned
FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');

-- Partitions for 2024
CREATE TABLE IF NOT EXISTS orders_partitioned_2024_01 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_02 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_03 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_04 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_05 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_06 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_07 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_08 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_09 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_10 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_11 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2024_12 PARTITION OF orders_partitioned
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Partitions for 2025
CREATE TABLE IF NOT EXISTS orders_partitioned_2025_01 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_02 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_03 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_04 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_05 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_06 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_07 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_08 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_09 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_10 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_11 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS orders_partitioned_2025_12 PARTITION OF orders_partitioned
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- ===== Transactions Table Partitioning by Date =====

CREATE TABLE IF NOT EXISTS transactions_partitioned (
    id BIGSERIAL,
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    metadata JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (DATE_TRUNC('month', created_at));

-- Create partitions for transactions (similar structure to orders)
CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_01 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_02 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_03 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_04 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_05 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_06 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_07 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_08 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_09 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_10 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_11 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE IF NOT EXISTS transactions_partitioned_2024_12 PARTITION OF transactions_partitioned
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- ===== Create Indexes on Partitions =====

-- Indexes on orders partitions
CREATE INDEX IF NOT EXISTS idx_orders_part_user_status
ON orders_partitioned (user_id, status)
WHERE status NOT IN ('cancelled', 'failed');

CREATE INDEX IF NOT EXISTS idx_orders_part_org_date
ON orders_partitioned (organization_id, created_at DESC);

-- Indexes on transactions partitions
CREATE INDEX IF NOT EXISTS idx_transactions_part_user_date
ON transactions_partitioned (user_id, created_at DESC)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_transactions_part_type_date
ON transactions_partitioned (transaction_type, created_at DESC);

-- ===== Partition Retention Policies =====

-- Store partition metadata
CREATE TABLE IF NOT EXISTS partition_metadata (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    partition_name VARCHAR(255) NOT NULL,
    partition_start_date TIMESTAMP,
    partition_end_date TIMESTAMP,
    retention_days INTEGER DEFAULT 365,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partition_metadata_table
ON partition_metadata (table_name);

CREATE INDEX IF NOT EXISTS idx_partition_metadata_archived
ON partition_metadata (is_archived)
WHERE is_archived = FALSE;

-- ===== Archive Old Partitions =====
-- This function should be called periodically to move old data to archive storage

CREATE OR REPLACE FUNCTION archive_old_partitions(retention_days INTEGER DEFAULT 365)
RETURNS TABLE(partition_name VARCHAR, status VARCHAR) AS $$
DECLARE
    v_partition RECORD;
    v_cutoff_date TIMESTAMP;
BEGIN
    v_cutoff_date := CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;

    FOR v_partition IN
        SELECT partition_name, partition_end_date
        FROM partition_metadata
        WHERE partition_end_date < v_cutoff_date
        AND is_archived = FALSE
    LOOP
        -- In a real scenario, you would export to archive storage here
        UPDATE partition_metadata
        SET is_archived = TRUE, archived_at = CURRENT_TIMESTAMP
        WHERE partition_name = v_partition.partition_name;

        RETURN QUERY SELECT v_partition.partition_name, 'archived'::VARCHAR;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===== Grant Permissions =====
GRANT SELECT, INSERT, UPDATE ON orders_partitioned TO app_user;
GRANT SELECT, INSERT, UPDATE ON transactions_partitioned TO app_user;
GRANT SELECT ON partition_metadata TO app_user;

-- ===== Analyze Tables =====
ANALYZE orders_partitioned;
ANALYZE transactions_partitioned;
