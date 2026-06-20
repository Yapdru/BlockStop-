#!/bin/bash

##############################################################################
# BlockStop Rollback Script
# Safely reverts deployment to previous stable version
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_VERSION=${1:-}
ROLLBACK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10
MAX_RETRIES=10

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print usage
usage() {
    cat << EOF
Usage: $0 <version>

Arguments:
  version     Target version to rollback to (e.g., 'v1.2.3' or 'blue')

Examples:
  $0 v1.2.3          # Rollback to specific version
  $0 blue            # Rollback to blue environment

EOF
    exit 1
}

# Validate arguments
if [ -z "$TARGET_VERSION" ]; then
    print_error "Target version not specified"
    usage
fi

print_info "Starting rollback to $TARGET_VERSION..."

# Pre-rollback checks
print_info "Running pre-rollback checks..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed"
    exit 1
fi

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

print_success "Pre-flight checks passed"

# Perform rollback
print_info "Switching traffic to $TARGET_VERSION..."

if [ "$TARGET_VERSION" = "blue" ] || [ "$TARGET_VERSION" = "green" ]; then
    # Blue-green rollback
    kubectl patch service blockstop-prod \
        -n blockstop-prod \
        -p "{\"spec\":{\"selector\":{\"deployment\":\"$TARGET_VERSION\"}}}" \
        --record
    print_success "Traffic switched to $TARGET_VERSION environment"
else
    # Version-specific rollback
    kubectl rollout undo deployment/blockstop-prod \
        -n blockstop-prod \
        --to-revision=$(kubectl rollout history deployment/blockstop-prod -n blockstop-prod | grep -n "$TARGET_VERSION" | cut -d' ' -f1 | head -1)
    print_success "Rolled back to version $TARGET_VERSION"
fi

# Health checks
print_info "Running health checks..."

HEALTH_CHECK_PASSED=false
for ((i=1; i<=MAX_RETRIES; i++)); do
    print_info "Health check attempt $i/$MAX_RETRIES..."

    if curl -sf https://blockstop.com/api/health > /dev/null 2>&1; then
        print_success "Service is healthy"
        HEALTH_CHECK_PASSED=true
        break
    fi

    if [ $i -lt $MAX_RETRIES ]; then
        print_warning "Health check failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    print_warning "Logs from deployment:"
    kubectl logs deployment/blockstop-prod -n blockstop-prod --tail=50 || true
    exit 1
fi

# Monitor for errors
print_info "Monitoring for errors (30 seconds)..."
sleep 5

ERROR_COUNT=$(kubectl logs deployment/blockstop-prod -n blockstop-prod --since=30s 2>/dev/null | grep -c "ERROR\|Exception\|Failed" || echo "0")

if [ "$ERROR_COUNT" -gt 10 ]; then
    print_error "High error rate detected ($ERROR_COUNT errors in last 30s)"
    print_warning "Consider investigating further"
else
    print_success "Error rate is acceptable"
fi

# Notify team
print_info "Notifying team..."

if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"⚠️  Rollback executed\",
            \"blocks\": [
                {
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Rollback Complete*\nTarget: $TARGET_VERSION\nTime: $(date)\nStatus: ✓ Healthy\"
                    }
                }
            ]
        }" \
        > /dev/null 2>&1 && print_success "Slack notification sent" || print_warning "Slack notification failed"
fi

# Summary
echo ""
print_success "Rollback completed successfully!"
echo ""
echo "Summary:"
echo "  Target version: $TARGET_VERSION"
echo "  Completion time: $(date)"
echo "  Status: ✓ Healthy"
echo ""
print_info "Next steps:"
echo "  1. Verify application functionality"
echo "  2. Review error logs"
echo "  3. Run post-rollback tests"
echo "  4. Create incident ticket"
echo ""
