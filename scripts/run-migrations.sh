#!/bin/bash

# BlockStop Database Migration Runner
# Runs all SQL migrations in order

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection from environment
DB_URL="${DATABASE_URL:-postgresql://blockstop:blockstop@localhost:5432/blockstop_db}"

echo -e "${BLUE}BlockStop Database Migration Runner${NC}"
echo "Database: $DB_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Get migration directory
MIGRATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../blockos/migrations" && pwd)"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found at $MIGRATION_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}Found migrations:${NC}"
ls -1 "$MIGRATION_DIR"/*.sql | sort | while read file; do
    echo "  - $(basename "$file")"
done
echo ""

# Run migrations
MIGRATION_COUNT=0
FAILED=0

for migration in $(ls -1 "$MIGRATION_DIR"/*.sql | sort); do
    MIGRATION_NAME=$(basename "$migration")
    echo -ne "${BLUE}Running $MIGRATION_NAME...${NC} "

    if psql "$DB_URL" -f "$migration" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((MIGRATION_COUNT++))
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Failed to run $MIGRATION_NAME${NC}"
        ((FAILED++))
    fi
done

echo ""
echo -e "${BLUE}Migration Summary:${NC}"
echo "  Successful: $MIGRATION_COUNT"
echo "  Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All migrations completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some migrations failed. Please check your database connection.${NC}"
    exit 1
fi
