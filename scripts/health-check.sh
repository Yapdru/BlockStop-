#!/bin/bash

##############################################################################
# BlockStop Health Check Script
# Verifies application health and readiness
##############################################################################

set -e

# Configuration
BASE_URL=${1:-"http://localhost:3000"}
TIMEOUT=30
RETRIES=5
INTERVAL=5

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Health check endpoints
ENDPOINTS=(
    "/api/health"
    "/api/ready"
    "/api/email/check"
    "/api/file/upload"
)

print_info "Health check starting for $BASE_URL"
echo ""

# Check each endpoint
FAILED=0
PASSED=0

for ENDPOINT in "${ENDPOINTS[@]}"; do
    print_info "Checking $ENDPOINT..."

    for ((attempt=1; attempt<=RETRIES; attempt++)); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            --max-time $TIMEOUT \
            "$BASE_URL$ENDPOINT" 2>/dev/null || echo "000")

        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ]; then
            print_success "$ENDPOINT responded with HTTP $HTTP_CODE"
            ((PASSED++))
            break
        else
            if [ $attempt -lt $RETRIES ]; then
                echo "  Attempt $attempt/$RETRIES failed (HTTP $HTTP_CODE), retrying..."
                sleep $INTERVAL
            else
                print_error "$ENDPOINT failed after $RETRIES attempts (HTTP $HTTP_CODE)"
                ((FAILED++))
            fi
        fi
    done
done

echo ""

# Database health check
print_info "Checking database connectivity..."
DB_RESPONSE=$(curl -s -X GET "$BASE_URL/api/health" | grep -o '"database":"healthy"' || echo "")

if [ -n "$DB_RESPONSE" ]; then
    print_success "Database is healthy"
else
    print_error "Database health check failed"
    ((FAILED++))
fi

# Summary
echo ""
echo "─────────────────────────────────"
echo "Health Check Summary"
echo "─────────────────────────────────"
echo "Endpoints passed: $PASSED"
echo "Endpoints failed: $FAILED"
echo "Base URL: $BASE_URL"
echo "Timestamp: $(date)"
echo "─────────────────────────────────"

if [ $FAILED -eq 0 ]; then
    print_success "All health checks passed!"
    exit 0
else
    print_error "$FAILED health check(s) failed"
    exit 1
fi
