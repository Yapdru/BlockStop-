#!/bin/bash

##############################################################################
# BlockStop Load Testing Script
# Uses k6 for performance and load testing
##############################################################################

set -e

# Configuration
BASE_URL=${1:-"http://localhost:3000"}
USERS=${2:-100}
DURATION=${3:-"5m"}
STAGE=${4:-"moderate"}

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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    print_error "k6 is not installed"
    print_info "Install k6 from https://k6.io/docs/getting-started/installation/"
    exit 1
fi

print_info "Starting load test"
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Users: $USERS"
echo "  Duration: $DURATION"
echo "  Stage: $STAGE"
echo ""

# Create k6 test script
cat > /tmp/blockstop-load-test.js << 'EOF'
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

export const options = {
  stages: [
    { duration: '2m', target: __ENV.USERS },    // Ramp-up
    { duration: '5m', target: __ENV.USERS },    // Steady
    { duration: '2m', target: 0 }                // Ramp-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
    'errors': ['rate<0.1']
  }
};

export default function() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  group('Email Analysis', function() {
    const emailResponse = http.post(`${baseUrl}/api/email/check`, {
      email: 'test@example.com'
    });

    check(emailResponse, {
      'email check status 200': (r) => r.status === 200,
      'email check response time < 100ms': (r) => r.timings.duration < 100
    });

    apiDuration.add(emailResponse.timings.duration);
    errorRate.add(emailResponse.status !== 200);
  });

  group('File Upload', function() {
    const fileResponse = http.post(`${baseUrl}/api/file/upload`, {
      file: 'test-file-content'
    });

    check(fileResponse, {
      'file upload status 200': (r) => r.status === 200,
      'file upload response time < 500ms': (r) => r.timings.duration < 500
    });

    apiDuration.add(fileResponse.timings.duration);
    errorRate.add(fileResponse.status !== 200);
  });

  group('Dashboard', function() {
    const dashResponse = http.get(`${baseUrl}/dashboard`);

    check(dashResponse, {
      'dashboard status 200': (r) => r.status === 200,
      'dashboard response time < 2000ms': (r) => r.timings.duration < 2000
    });

    apiDuration.add(dashResponse.timings.duration);
    errorRate.add(dashResponse.status !== 200);
  });

  sleep(1);
}
EOF

# Run load test
print_info "Running load test..."
echo ""

k6 run \
    --vus "$USERS" \
    --duration "$DURATION" \
    -e "BASE_URL=$BASE_URL" \
    -e "USERS=$USERS" \
    /tmp/blockstop-load-test.js

# Cleanup
rm -f /tmp/blockstop-load-test.js

print_success "Load test completed"
