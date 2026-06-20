#!/bin/bash

################################################################################
# Database Optimization Script
# Performs comprehensive database optimization tasks
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-blockstop}"
DB_USER="${DB_USER:-postgres}"
LOG_DIR="${LOG_DIR:-./logs}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/optimize_${TIMESTAMP}.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

################################################################################
# Utility Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

# Execute psql command
psql_exec() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>&1 | tee -a "$LOG_FILE"
}

# Execute psql command and get result
psql_get() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null
}

################################################################################
# Optimization Tasks
################################################################################

# 1. Analyze Database Tables
analyze_tables() {
    log "Starting table analysis..."

    # Get list of all tables
    local tables=$(psql_get "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")

    local count=0
    while IFS= read -r table; do
        if [ -n "$table" ]; then
            log "  Analyzing table: $table"
            psql_exec "ANALYZE $table;" > /dev/null 2>&1 && count=$((count + 1))
        fi
    done <<< "$tables"

    success "Analyzed $count tables"
}

# 2. Reindex Tables
reindex_tables() {
    log "Starting table reindexing..."

    # Get list of tables with bloated indexes
    local tables=$(psql_get "
        SELECT schemaname || '.' || tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        LIMIT 10;
    ")

    local count=0
    while IFS= read -r table; do
        if [ -n "$table" ]; then
            log "  Reindexing table: $table"
            psql_exec "REINDEX TABLE CONCURRENTLY $table;" > /dev/null 2>&1 && count=$((count + 1))
        fi
    done <<< "$tables"

    success "Reindexed $count tables"
}

# 3. Vacuum Database
vacuum_database() {
    log "Starting database vacuum..."

    psql_exec "VACUUM ANALYZE;" > /dev/null 2>&1
    success "Completed VACUUM ANALYZE"
}

# 4. Analyze Slow Queries
analyze_slow_queries() {
    log "Analyzing slow queries from last 24 hours..."

    local report=$(psql_get "
        SELECT
            COUNT(*) as query_count,
            ROUND(AVG(execution_time)::numeric, 2) as avg_time,
            MAX(execution_time) as max_time,
            ROUND((SELECT AVG(execution_time) FROM slow_queries WHERE timestamp > NOW() - INTERVAL '24 hours')::numeric, 2) as avg_24h
        FROM slow_queries
        WHERE timestamp > NOW() - INTERVAL '24 hours';
    ")

    echo "$report" | tee -a "$LOG_FILE"

    local top_slow=$(psql_get "
        SELECT
            query,
            COUNT(*) as frequency,
            ROUND(AVG(execution_time)::numeric, 2) as avg_time,
            MAX(execution_time) as max_time
        FROM slow_queries
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY query
        ORDER BY MAX(execution_time) DESC
        LIMIT 5;
    ")

    log "Top 5 slowest queries:"
    echo "$top_slow" | tee -a "$LOG_FILE"
}

# 5. Check Index Usage
check_index_usage() {
    log "Checking index usage..."

    local unused=$(psql_get "
        SELECT
            COUNT(*) as unused_count,
            STRING_AGG(indexrelname, ', ') as unused_indexes
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        AND indexrelname NOT LIKE 'pg_toast%';
    ")

    if [ -n "$unused" ]; then
        warning "Unused indexes found:"
        echo "$unused" | tee -a "$LOG_FILE"
    else
        success "No unused indexes found"
    fi

    # Get index sizes
    log "Largest indexes:"
    psql_get "
        SELECT
            schemaname,
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
            idx_scan as scans
        FROM pg_stat_user_indexes
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 10;
    " | tee -a "$LOG_FILE"
}

# 6. Check Table Bloat
check_table_bloat() {
    log "Checking table bloat..."

    psql_get "
        SELECT
            schemaname,
            tablename,
            ROUND(100 * (CASE WHEN otta > 0 THEN sml.relpages - otta ELSE 0 END) / sml.relpages::numeric, 2) as bloat_ratio,
            pg_size_pretty(sml.relpages * 8192) as table_size
        FROM (
            SELECT
                schemaname,
                tablename,
                cc,
                NULL::int as otta,
                relpages
            FROM pg_tables
            JOIN pg_class ON pg_class.relname = tablename
            WHERE schemaname = 'public'
        ) sml
        WHERE relpages > 100
        ORDER BY bloat_ratio DESC
        LIMIT 10;
    " | tee -a "$LOG_FILE"
}

# 7. Update Statistics
update_statistics() {
    log "Updating database statistics..."

    # Refresh materialized views if any
    psql_get "
        SELECT schemaname || '.' || matviewname
        FROM pg_matviews
        WHERE schemaname = 'public';
    " | while read -r view; do
        if [ -n "$view" ]; then
            log "  Refreshing materialized view: $view"
            psql_exec "REFRESH MATERIALIZED VIEW CONCURRENTLY $view;" > /dev/null 2>&1
        fi
    done

    success "Statistics updated"
}

# 8. Database Health Report
generate_health_report() {
    log "Generating database health report..."

    cat > "${LOG_DIR}/health_report_${TIMESTAMP}.txt" <<EOF
================================================================================
DATABASE HEALTH REPORT
Generated: $(date)
Database: $DB_NAME (Host: $DB_HOST:$DB_PORT)
================================================================================

DATABASE SIZE:
$(psql_get "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;")

TABLE STATISTICS:
$(psql_get "
    SELECT
        COUNT(*) as total_tables,
        ROUND(SUM(pg_total_relation_size(schemaname||'.'||tablename)::numeric)/1024/1024/1024, 2) as total_size_gb,
        SUM(n_live_tup::numeric) as total_rows
    FROM pg_stat_user_tables;
")

ACTIVE CONNECTIONS:
$(psql_get "SELECT count(*) as active_connections FROM pg_stat_activity;")

CACHE HIT RATIO:
$(psql_get "
    SELECT
        ROUND(sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read)), 4) as cache_hit_ratio
    FROM pg_stat_user_tables;
")

SLOW QUERY STATISTICS (Last 24 hours):
$(psql_get "
    SELECT
        COUNT(*) as slow_query_count,
        ROUND(AVG(execution_time)::numeric, 2) as avg_execution_ms,
        MAX(execution_time) as max_execution_ms
    FROM slow_queries
    WHERE timestamp > NOW() - INTERVAL '24 hours';
")

INDEX STATISTICS:
$(psql_get "
    SELECT
        COUNT(*) as total_indexes,
        SUM(CASE WHEN idx_scan = 0 THEN 1 ELSE 0 END) as unused_indexes
    FROM pg_stat_user_indexes;
")

TOP 5 TABLES BY SIZE:
$(psql_get "
    SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 5;
")

REPLICATION STATUS:
$(psql_get "
    SELECT
        CASE WHEN pg_is_in_recovery() THEN 'Replica' ELSE 'Primary' END as role,
        EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) as uptime_seconds;
")

================================================================================
EOF

    success "Health report generated: ${LOG_DIR}/health_report_${TIMESTAMP}.txt"
}

# 9. Cleanup Old Logs
cleanup_logs() {
    log "Cleaning up old slow query logs..."

    local deleted=$(psql_get "
        DELETE FROM slow_queries
        WHERE timestamp < NOW() - INTERVAL '7 days'
        RETURNING id;
    " | wc -l)

    success "Deleted $deleted old slow query entries"
}

# 10. Show Help
show_help() {
    cat <<EOF
Database Optimization Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    all              Run all optimization tasks
    analyze          Analyze all tables
    reindex          Reindex all tables
    vacuum           Run VACUUM ANALYZE
    slow-queries     Analyze slow queries
    index-usage      Check index usage statistics
    table-bloat      Check table bloat
    statistics       Update database statistics
    health           Generate health report
    cleanup          Clean up old logs
    help             Show this help message

Environment Variables:
    DB_HOST          Database host (default: localhost)
    DB_PORT          Database port (default: 5432)
    DB_NAME          Database name (default: blockstop)
    DB_USER          Database user (default: postgres)
    LOG_DIR          Log directory (default: ./logs)

Examples:
    $0 all
    $0 analyze
    DB_HOST=prod.example.com $0 health

EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command="${1:-all}"

    log "Starting database optimization..."
    log "Database: $DB_HOST:$DB_PORT/$DB_NAME"
    log "Command: $command"

    case "$command" in
        all)
            analyze_tables
            reindex_tables
            vacuum_database
            analyze_slow_queries
            check_index_usage
            update_statistics
            generate_health_report
            cleanup_logs
            ;;
        analyze)
            analyze_tables
            ;;
        reindex)
            reindex_tables
            ;;
        vacuum)
            vacuum_database
            ;;
        slow-queries)
            analyze_slow_queries
            ;;
        index-usage)
            check_index_usage
            ;;
        table-bloat)
            check_table_bloat
            ;;
        statistics)
            update_statistics
            ;;
        health)
            generate_health_report
            ;;
        cleanup)
            cleanup_logs
            ;;
        help)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac

    success "Optimization complete! Check log: $LOG_FILE"
}

main "$@"
