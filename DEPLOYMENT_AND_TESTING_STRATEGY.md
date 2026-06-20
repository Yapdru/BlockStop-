# BlockStop PRO - Comprehensive Deployment & Testing Strategy

**Version**: 1.0  
**Last Updated**: 2026-06-17  
**Scope**: Phases 1-20  
**Maintainer**: BlockStop Engineering Team  

---

## Executive Summary

This document outlines a comprehensive deployment and testing strategy for BlockStop PRO across all 20 planned phases. It provides a structured approach to ensure code quality, system reliability, performance, and security across the entire development lifecycle. The strategy encompasses automated testing, CI/CD pipelines, deployment procedures, and production monitoring.

### Key Objectives
- **Quality Assurance**: 90%+ test coverage across all phases
- **Continuous Delivery**: Automated deployment pipelines with zero-downtime releases
- **Security First**: Comprehensive security testing at every phase
- **Performance Excellence**: Maintain < 100ms API response times, < 2s page load times
- **Reliability**: 99.9% uptime with automated incident response
- **Compliance**: GDPR, SOC 2, HIPAA compliance verification

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Deployment Architecture](#deployment-architecture)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Environment Management](#environment-management)
5. [Database Migration Strategy](#database-migration-strategy)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Monitoring & Observability](#monitoring--observability)
9. [Rollback Procedures](#rollback-procedures)
10. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)

---

## Testing Strategy

### 1. Testing Pyramid

```
        ⬜ E2E Tests (5%)
       ⬜⬜⬜ Integration Tests (25%)
      ⬜⬜⬜⬜⬜⬜⬜ Unit Tests (70%)
```

### 2. Unit Testing

**Framework**: Jest + TypeScript support

**Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/app', '<rootDir>/lib', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

**Test Categories**:

#### 2.1 AI Engine Tests
- **DRAR AI Tests**: `lib/ai/__tests__/drar-ai.test.ts`
  - Phishing keyword detection accuracy
  - Urgency tactic identification
  - Domain reputation analysis
  - Suspicious link identification
  - Spam score calculation
  - Edge cases (empty input, special characters, etc.)

```typescript
describe('DRAR AI', () => {
  it('should detect phishing keywords', () => {
    const result = drarAI.analyzeEmail('Verify account immediately');
    expect(result.threats).toContain('phishing');
    expect(result.riskScore).toBeGreaterThan(70);
  });

  it('should handle malformed emails gracefully', () => {
    expect(() => drarAI.analyzeEmail('')).not.toThrow();
  });
});
```

- **BetterBot PRO Tests**: `lib/ai/__tests__/betterbot-pro.test.ts`
  - File signature detection (6+ file types)
  - Entropy calculation accuracy
  - Ransomware indicator detection
  - Trojan pattern matching
  - Shellcode detection
  - Extension-based classification
  - False positive rates < 2%

#### 2.2 API Route Tests
- **Email Check Route**: `app/api/email/__tests__/check.test.ts`
  - Valid email analysis
  - Invalid input handling
  - Rate limiting
  - Response format validation
  - Error responses

- **File Upload Route**: `app/api/file/__tests__/upload.test.ts`
  - File size validation (50MB limit)
  - File type validation
  - Virus scan integration
  - Response payload structure
  - Concurrent uploads

- **Authentication Routes**: `app/api/auth/__tests__/auth.test.ts`
  - OAuth flow validation
  - Token generation and validation
  - Session management
  - 2FA setup and verification
  - Password reset workflows

#### 2.3 Utility Function Tests
- Database connection pooling
- Environment variable loading
- Type validation helpers
- Encryption/decryption functions
- Email formatting utilities

**Test Coverage Requirements**:
- **Critical Path**: 100% coverage (auth, payments, file upload)
- **Core Features**: 90% coverage (AI engines, API routes)
- **Utilities**: 80% coverage (helpers, formatters)

### 3. Integration Testing

**Framework**: Jest + Supertest for HTTP testing

**Configuration** (`tests/integration/setup.ts`):
```typescript
import { createServer } from 'http';
import request from 'supertest';
import { Pool } from 'pg';

// Test database setup
const testDb = new Pool({
  connectionString: 'postgresql://test:test@localhost:5432/blockstop_test'
});

// Test server setup
const app = createServer();
export const testRequest = request(app);

// Cleanup after tests
afterAll(async () => {
  await testDb.end();
});
```

**Integration Test Categories**:

#### 3.1 Email-to-Database Flow
- Analyze email → Store in database → Retrieve history
- Verify data consistency
- Test concurrent scans
- Validate indexing performance

#### 3.2 File Upload Pipeline
- Upload file → Scan → Store result → Return to user
- Multi-part form data handling
- File cleanup after scan
- Database transaction integrity

#### 3.3 Authentication Flow
- Registration → Email verification → Login → OAuth → Session
- Credential validation
- Token refresh mechanisms
- Session timeout handling

#### 3.4 Multi-Service Integration
- Email checker + Gmail API
- File scanner + Storage backend
- Dashboard + Statistics aggregator
- Alert system + Email notification

**Integration Test Matrix**:
| Component | Dependency | Test Scenario | Pass Criteria |
|-----------|-----------|---------------|---------------|
| Email API | Database | Analyze → Store → Retrieve | Data integrity |
| File API | Storage | Upload → Scan → Archive | File integrity |
| Auth API | Session Store | Register → Login | Valid JWT |
| Dashboard | All services | All metrics computed | Performance < 500ms |

### 4. End-to-End Testing

**Framework**: Playwright (primary), Cypress (alternative)

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

**E2E Test Scenarios**:

#### 4.1 Email Checker Flow
```typescript
test('Email analysis complete flow', async ({ page }) => {
  // Navigate to email checker
  await page.goto('/email-checker');
  
  // Fill form
  await page.fill('input[name="email"]', 'suspicious@example.com');
  
  // Submit and wait for results
  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-testid="result-card"]');
  
  // Verify results displayed
  const riskScore = await page.locator('[data-testid="risk-score"]').textContent();
  expect(riskScore).toMatch(/\d+/);
  
  // Verify threat badges
  const threats = await page.locator('[data-testid="threat-badge"]').count();
  expect(threats).toBeGreaterThan(0);
});
```

#### 4.2 File Scanner Flow
```typescript
test('File upload and scan complete flow', async ({ page }) => {
  await page.goto('/file-scanner');
  
  // Upload test file
  await page.locator('input[type="file"]').setInputFiles('./tests/fixtures/test.exe');
  
  // Wait for scan completion
  await page.waitForSelector('[data-testid="scan-complete"]', { timeout: 30000 });
  
  // Verify threat detection
  const threatLevel = await page.locator('[data-testid="threat-level"]').textContent();
  expect(['safe', 'warning', 'dangerous']).toContain(threatLevel);
});
```

#### 4.3 Dashboard Flow
```typescript
test('Dashboard statistics and history display', async ({ page }) => {
  // Perform scans
  await emailScan(page, 'test@example.com');
  await fileScan(page, './test.txt');
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Verify statistics
  const totalScans = await page.locator('[data-testid="total-scans"]').textContent();
  expect(parseInt(totalScans || '0')).toBeGreaterThanOrEqual(2);
  
  // Verify history table
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBe(2);
});
```

#### 4.4 Authentication Flow
```typescript
test('User registration and login flow', async ({ page }) => {
  // Register
  await page.goto('/auth/register');
  await page.fill('input[name="email"]', 'newuser@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  
  // Verify email sent (mocked)
  await page.waitForURL('**/verify-email');
  
  // Login with credentials
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'newuser@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  
  // Verify redirected to dashboard
  await page.waitForURL('**/dashboard');
});
```

**E2E Test Coverage**:
- **Critical Paths**: 100% coverage
- **Happy Paths**: All major user journeys
- **Error Paths**: Error handling, validation messages
- **Cross-browser**: Chrome, Firefox, Safari
- **Mobile**: Responsive design on iOS and Android

### 5. Performance Testing

**Framework**: k6 (primary), Apache JMeter (alternative)

**Load Test Configuration** (`tests/performance/load-test.js`):
```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 }     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1']
  }
};

export default function() {
  group('Email Analysis API', function() {
    let response = http.post('http://localhost:3000/api/email/check', {
      email: 'test@example.com'
    });
    
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100
    });
  });
  
  sleep(1);
}
```

**Performance Test Scenarios**:
- **API Load Test**: 1000 concurrent requests
- **Database Load Test**: 500 concurrent queries
- **File Upload Test**: 100 parallel uploads (50MB each)
- **Dashboard Load Test**: 200 concurrent dashboard loads
- **Memory Leak Test**: 24-hour stress test

**Performance Targets**:
| Metric | Phase 1-5 | Phase 6-12 | Phase 13-20 |
|--------|----------|----------|-----------|
| API P95 Response | < 100ms | < 150ms | < 200ms |
| Page Load Time | < 2s | < 2.5s | < 3s |
| File Scan Time | < 5s | < 10s | < 15s |
| Database Query | < 50ms | < 75ms | < 100ms |
| Memory Usage | < 500MB | < 800MB | < 1.2GB |

---

## Deployment Architecture

### 1. Environment Structure

```
Development (Local)
    ↓
Staging (Pre-production)
    ↓
Production (Live)
```

### 2. Environment Specifications

#### Development Environment
- **Purpose**: Local development and testing
- **Database**: PostgreSQL (local container)
- **API Keys**: Test/sandbox keys
- **Logging**: Verbose, console output
- **Monitoring**: Disabled

**Setup** (`docker-compose.dev.yml`):
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres-dev
  
  postgres-dev:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=blockstop_dev
      - POSTGRES_USER=dev
      - POSTGRES_PASSWORD=dev_password
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
```

#### Staging Environment
- **Purpose**: Pre-production testing and validation
- **Database**: PostgreSQL (managed cloud)
- **API Keys**: Production-like keys (separate account)
- **Logging**: Structured logging to ElasticSearch
- **Monitoring**: Full monitoring enabled

**Infrastructure**:
```yaml
# Kubernetes deployment for staging
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blockstop-staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: blockstop-staging
  template:
    metadata:
      labels:
        app: blockstop-staging
    spec:
      containers:
      - name: app
        image: blockstop:staging-latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "staging"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: blockstop-secrets
              key: staging-db-url
```

#### Production Environment
- **Purpose**: Live user environment
- **Database**: PostgreSQL (replicated, high availability)
- **API Keys**: Production keys with rotation
- **Logging**: Structured, encrypted logging
- **Monitoring**: Full observability, alerting enabled

**Infrastructure** (`production-deployment.yaml`):
```yaml
# Production-grade Kubernetes deployment
apiVersion: v1
kind: Namespace
metadata:
  name: blockstop-prod

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blockstop-prod
  namespace: blockstop-prod
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: blockstop-prod
  template:
    metadata:
      labels:
        app: blockstop-prod
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - blockstop-prod
              topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: blockstop:prod-latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## CI/CD Pipeline

### 1. GitHub Actions Workflows

#### 1.1 Pull Request Validation (`tests.yml`)

```yaml
name: PR Tests and Quality Checks

on:
  pull_request:
    branches: [main, develop]
    paths-ignore:
      - 'docs/**'
      - '**.md'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: blockstop_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/blockstop_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: blockstop_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/blockstop_test
          NEXTAUTH_URL: http://localhost:3000
          NEXTAUTH_SECRET: test-secret-key

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'BlockStop'
          path: '.'
          format: 'JSON'

  build:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, security-scan]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: .next
          retention-days: 1
```

#### 1.2 Staging Deployment (`staging-deploy.yml`)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_run:
    workflows: ["PR Tests and Quality Checks"]
    types: [completed]
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            blockstop:staging-latest
            blockstop:staging-${{ github.sha }}
          cache-from: type=registry,ref=blockstop:staging-latest
          cache-to: type=inline
      
      - name: Deploy to staging cluster
        run: |
          kubectl set image deployment/blockstop-staging \
            app=blockstop:staging-${{ github.sha }} \
            -n blockstop-staging
          kubectl rollout status deployment/blockstop-staging \
            -n blockstop-staging --timeout=5m
        env:
          KUBECONFIG: ${{ secrets.KUBE_CONFIG }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: https://staging.blockstop.com
      
      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Staging deployment: ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment*\nStatus: ${{ job.status }}\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
```

#### 1.3 Production Deployment (`production-deploy.yml`)

```yaml
name: Deploy to Production

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  pre-deployment-checks:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify release notes exist
        run: |
          if [ ! -f "releases/${{ github.event.release.tag_name }}.md" ]; then
            echo "Release notes not found"
            exit 1
          fi
      
      - name: Verify version tag
        run: |
          VERSION=${{ github.event.release.tag_name }}
          if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Invalid version format"
            exit 1
          fi
      
      - name: Check all tests passed
        run: |
          # Verify previous workflow run was successful
          gh run view ${{ github.event.workflow_run.id }} --json conclusion -q .conclusion
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: pre-deployment-checks
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            blockstop:latest
            blockstop:prod-${{ github.event.release.tag_name }}
      
      - name: Blue-Green Deployment
        run: |
          # Deploy to green environment
          kubectl set image deployment/blockstop-prod-green \
            app=blockstop:prod-${{ github.event.release.tag_name }} \
            -n blockstop-prod
          
          # Wait for green deployment
          kubectl rollout status deployment/blockstop-prod-green \
            -n blockstop-prod --timeout=10m
          
          # Run health checks
          ./scripts/health-check.sh https://green.blockstop.com
          
          # Switch traffic to green
          kubectl patch service blockstop-prod \
            -n blockstop-prod \
            -p '{"spec":{"selector":{"deployment":"green"}}}'
          
          # Keep blue running for rollback
          sleep 5m
        env:
          KUBECONFIG: ${{ secrets.KUBE_CONFIG }}
      
      - name: Smoke tests on production
        run: npm run test:smoke:production
        env:
          BASE_URL: https://blockstop.com
      
      - name: Monitor for errors
        run: |
          # Monitor logs for 5 minutes
          kubectl logs deployment/blockstop-prod-green \
            -n blockstop-prod --tail=100 --timestamps=true
          
          # Check metrics
          ./scripts/check-metrics.sh 5m
      
      - name: Slack notification - Success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚀 Production deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment Successful*\nVersion: ${{ github.event.release.tag_name }}\nTime: $(date)"
                  }
                }
              ]
            }
      
      - name: Slack notification - Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ Production deployment FAILED!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment FAILED*\nVersion: ${{ github.event.release.tag_name }}\nCheck: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }

  rollback-on-failure:
    runs-on: ubuntu-latest
    needs: deploy-production
    if: failure()
    environment: production
    
    steps:
      - name: Execute rollback
        run: |
          # Switch traffic back to blue
          kubectl patch service blockstop-prod \
            -n blockstop-prod \
            -p '{"spec":{"selector":{"deployment":"blue"}}}'
          
          echo "Rolled back to previous version"
        env:
          KUBECONFIG: ${{ secrets.KUBE_CONFIG }}
      
      - name: Notify rollback
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "⚠️ Production rollback executed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Automatic Rollback Executed*\nVersion: ${{ github.event.release.tag_name }}\nRolled back to: Previous stable version"
                  }
                }
              ]
            }
```

### 2. Testing Gates

Each phase requires passing specific gates before proceeding to next phase:

```
Phase N Code → Unit Tests → Integration Tests → E2E Tests → Security Scan → Performance Test → Staging Deploy → Production Deploy
                   ✅           ✅               ✅          ✅             ✅               ✅              ✅
```

**Gate Definitions**:
- **Unit Test Gate**: 80%+ code coverage, all tests passing
- **Integration Gate**: All critical paths tested, no flaky tests
- **E2E Gate**: Happy path and error paths tested, mobile responsive
- **Security Gate**: No critical vulnerabilities, OWASP compliance
- **Performance Gate**: P95 < 500ms, memory < 1GB, no memory leaks
- **Staging Gate**: 24-hour stability, no errors in logs
- **Production Gate**: Blue-green deployment ready, rollback tested

---

## Environment Management

### 1. Configuration Management

**Environment Variables** (`.env.local.example`):
```bash
# App Configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blockstop_dev

# Third-party Services
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GMAIL_API_KEY=your-gmail-api-key

# Security
JWT_SECRET=your-jwt-secret
API_RATE_LIMIT=1000

# Feature Flags
ENABLE_GMAIL_OAUTH=true
ENABLE_TEAM_FEATURES=false
ENABLE_ENTERPRISE_REPORTING=false

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
ELASTIC_SEARCH_URL=http://localhost:9200
```

### 2. Secrets Management

**GitHub Secrets Configuration**:
```bash
# Authentication
NEXTAUTH_SECRET: [generated secret]
JWT_SECRET: [generated secret]

# Third-party APIs
GOOGLE_CLIENT_ID: [google console]
GOOGLE_CLIENT_SECRET: [google console]
SNYK_TOKEN: [snyk dashboard]

# Infrastructure
DOCKER_USERNAME: [docker hub]
DOCKER_PASSWORD: [docker hub]
KUBE_CONFIG: [base64 encoded kubeconfig]

# Monitoring
SENTRY_DSN: [sentry dashboard]
SLACK_WEBHOOK: [slack workspace]

# Database
DB_PASSWORD_DEV: [generated password]
DB_PASSWORD_STAGING: [generated password]
DB_PASSWORD_PROD: [generated password]
```

### 3. Infrastructure as Code

**Terraform Configuration** (`infra/main.tf`):
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.0"
    }
  }
  
  backend "s3" {
    bucket         = "blockstop-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# Kubernetes deployment
resource "kubernetes_namespace" "blockstop" {
  metadata {
    name = "blockstop-${var.environment}"
  }
}

# PostgreSQL managed database
resource "aws_rds_cluster" "blockstop_db" {
  cluster_identifier      = "blockstop-${var.environment}"
  engine                  = "aurora-postgresql"
  database_name           = "blockstop"
  master_username         = "blockstop"
  master_password         = random_password.db_password.result
  backup_retention_period = var.environment == "prod" ? 30 : 7
  skip_final_snapshot     = var.environment != "prod"
  
  tags = {
    Environment = var.environment
    Project     = "BlockStop"
  }
}

# Outputs
output "db_endpoint" {
  value = aws_rds_cluster.blockstop_db.endpoint
}

output "db_reader_endpoint" {
  value = aws_rds_cluster.blockstop_db.reader_endpoint
}
```

---

## Database Migration Strategy

### 1. Migration Framework

**Tool**: TypeORM migrations

**Migration Structure**:
```
database/migrations/
├── 001-initial-schema.ts
├── 002-add-users-table.ts
├── 003-add-email-scans-table.ts
├── 004-add-file-scans-table.ts
├── 005-add-indexes.ts
└── ...
```

### 2. Migration Procedures

**Forward Migration** (`database/migration-up.ts`):
```typescript
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

export class MigrationRunner {
  private pool: Pool;
  private migrationsDir = './database/migrations';

  async runMigrations(env: 'dev' | 'staging' | 'prod') {
    // Load connection string
    const connectionString = process.env.DATABASE_URL;
    this.pool = new Pool({ connectionString });

    // Create migrations table if not exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const result = await this.pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const appliedVersions = result.rows.map(r => r.version);

    // Load migration files
    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.ts'))
      .sort();

    for (const file of files) {
      const match = file.match(/^(\d+)-(.+)\.ts$/);
      if (!match) continue;

      const [, versionStr, name] = match;
      const version = parseInt(versionStr);

      if (appliedVersions.includes(version)) {
        console.log(`✓ Migration ${version} already applied`);
        continue;
      }

      try {
        // Import and run migration
        const migration = require(path.join(this.migrationsDir, file));
        const upSql = migration.up;

        await this.pool.query(upSql);
        await this.pool.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, name]
        );

        console.log(`✓ Migration ${version} applied successfully`);
      } catch (error) {
        console.error(`✗ Migration ${version} failed:`, error.message);
        throw error;
      }
    }

    await this.pool.end();
  }
}

// CLI usage
const runner = new MigrationRunner();
runner.runMigrations(process.env.NODE_ENV as any)
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

**Rollback Migration** (`database/migration-down.ts`):
```typescript
export class RollbackRunner {
  async rollbackMigration(version: number) {
    // Load and execute down() migration
    const migration = require(`./migrations/${version.toString().padStart(3, '0')}-*.ts`);
    const downSql = migration.down;
    
    await this.pool.query(downSql);
    await this.pool.query(
      'DELETE FROM schema_migrations WHERE version = $1',
      [version]
    );
    
    console.log(`✓ Migration ${version} rolled back`);
  }
}
```

### 3. Migration Examples

**Example 1: Initial Schema**:
```typescript
// database/migrations/001-initial-schema.ts
export const up = `
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE email_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    email_address VARCHAR(255),
    risk_score INTEGER,
    threats TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_email_scans_user_id ON email_scans(user_id);
  CREATE INDEX idx_email_scans_created_at ON email_scans(created_at);
`;

export const down = `
  DROP TABLE email_scans CASCADE;
  DROP TABLE users CASCADE;
`;
```

**Example 2: Add Column**:
```typescript
// database/migrations/002-add-email-verified.ts
export const up = `
  ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;
`;

export const down = `
  ALTER TABLE users DROP COLUMN email_verified;
  ALTER TABLE users DROP COLUMN verified_at;
`;
```

### 4. Zero-Downtime Migration Strategy

**Principle**: Deploy code changes first, then schema changes

**For Adding Columns**:
1. Deploy code that ignores the new column
2. Run migration to add column with default value
3. Deploy code that uses the column

**For Removing Columns**:
1. Deploy code that stops using the column
2. Wait 24 hours for deployment propagation
3. Run migration to drop column

**For Renaming Columns**:
1. Add new column
2. Update code to write to both columns
3. Run data migration to populate new column
4. Deploy code to read from new column
5. Drop old column

---

## Performance Testing

### 1. Load Testing Strategy

**Tool**: k6

**Load Test Phases**:
```
Phase 1: Ramp-up (0-100 users over 2 minutes)
Phase 2: Steady state (100 users for 5 minutes)
Phase 3: Spike (jump to 500 users for 2 minutes)
Phase 4: Ramp-down (100 to 0 users over 2 minutes)
```

**Load Test Thresholds**:
| Metric | Phase 1-5 | Phase 6-12 | Phase 13-20 |
|--------|----------|----------|-----------|
| HTTP P95 | < 500ms | < 750ms | < 1000ms |
| HTTP P99 | < 1000ms | < 1500ms | < 2000ms |
| Error Rate | < 0.1% | < 0.5% | < 1% |
| Success Rate | > 99.9% | > 99.5% | > 99% |

### 2. Benchmark Tests

**Database Query Performance**:
```typescript
// tests/performance/db-benchmark.ts
import { performance } from 'perf_hooks';

async function benchmarkQueries() {
  const queries = [
    'SELECT * FROM users WHERE id = $1',
    'SELECT * FROM email_scans WHERE user_id = $1 LIMIT 100',
    'SELECT COUNT(*) FROM email_scans WHERE created_at > NOW() - INTERVAL \'24 hours\'',
    'SELECT * FROM email_scans GROUP BY user_id HAVING COUNT(*) > 10'
  ];

  for (const query of queries) {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      await db.query(query, [userId]);
    }
    
    const end = performance.now();
    const avgTime = (end - start) / 1000;
    
    console.log(`Query: ${query.substring(0, 50)}...`);
    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Expected: < 50ms`);
    console.log(`  Status: ${avgTime < 50 ? '✓' : '✗'}`);
  }
}
```

### 3. Memory Leak Testing

**24-hour Stress Test** (`tests/performance/memory-leak-test.ts`):
```typescript
import { performance } from 'perf_hooks';

async function memoryLeakTest(duration = 24 * 60 * 60 * 1000) {
  const startTime = Date.now();
  const measurements: Array<{time: number; heapUsed: number}> = [];
  
  while (Date.now() - startTime < duration) {
    // Simulate user operations
    await scanEmail('test@example.com');
    await scanFile(Buffer.alloc(1024 * 1024)); // 1MB file
    
    // Measure memory every 5 minutes
    const elapsed = Date.now() - startTime;
    if (elapsed % (5 * 60 * 1000) === 0) {
      const heapUsed = process.memoryUsage().heapUsed;
      measurements.push({ time: elapsed, heapUsed });
      console.log(`Memory at ${elapsed / 1000}s: ${(heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Analyze for memory leaks
  const trend = measurements.slice(-10);
  const avgIncrease = trend[trend.length - 1].heapUsed - trend[0].heapUsed;
  console.log(`Average memory increase in last hour: ${(avgIncrease / 1024 / 1024).toFixed(2)}MB`);
  
  if (avgIncrease > 100 * 1024 * 1024) {
    console.error('❌ MEMORY LEAK DETECTED');
    process.exit(1);
  }
  console.log('✓ No memory leaks detected');
}
```

---

## Security Testing

### 1. Security Scanning

**Tool**: Snyk (SAST)

**Configuration** (`snyk.yaml`):
```yaml
# Automatically scan dependencies for vulnerabilities
version: v1.0.0
autodetect: true
test-uninstalled: true
scan-all-uninstalled: true
ignore-policy: true

# Severity levels to fail on
fail-on-threshold:
  high: 1
  critical: 1
```

**OWASP Scanning** (DAST):
```bash
#!/bin/bash
# scripts/owasp-zap-scan.sh

SCAN_URL=${1:-https://staging.blockstop.com}
REPORT_FILE="owasp-zap-report.html"

docker run -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable zap-baseline.py \
  -t $SCAN_URL \
  -r $REPORT_FILE \
  -J owasp-zap-report.json

# Parse results
CRITICAL=$(grep -o '"riskcode":"3"' owasp-zap-report.json | wc -l)
HIGH=$(grep -o '"riskcode":"2"' owasp-zap-report.json | wc -l)

if [ $CRITICAL -gt 0 ]; then
  echo "❌ CRITICAL vulnerabilities found: $CRITICAL"
  exit 1
fi

if [ $HIGH -gt 5 ]; then
  echo "⚠️ Multiple HIGH vulnerabilities found: $HIGH"
  exit 1
fi

echo "✓ Security scan passed"
```

### 2. Penetration Testing

**Scope**: Phase 6 (before public beta)

**Test Categories**:
- **Authentication**: Credential brute force, session hijacking, token forgery
- **Authorization**: Privilege escalation, horizontal privilege escalation
- **Input Validation**: SQL injection, XSS, command injection
- **API Security**: Rate limiting bypass, CORS misconfigurations
- **Data Security**: Encryption validation, secure transmission

**Penetration Test Report Template**:
```markdown
# Penetration Test Report

## Executive Summary
- Test Date: [date]
- Tested Version: [version]
- Severity: [critical|high|medium|low|none]

## Vulnerabilities Found
| # | Type | Severity | Status |
|---|------|----------|--------|
| 1 | SQL Injection | Critical | Patched |
| 2 | Missing HTTPS | High | Fixed |

## Remediation Timeline
- Immediate (24 hours): Critical issues
- 7 days: High priority
- 30 days: Medium priority
```

### 3. Compliance Testing

**GDPR Compliance Checklist**:
```
✓ Data minimization (only collect needed data)
✓ Purpose limitation (defined use of data)
✓ Storage limitation (retention policies)
✓ Encryption at rest and in transit
✓ Right to deletion (GDPR delete endpoint)
✓ Data portability (export user data)
✓ Privacy policy available and clear
✓ Cookie consent before non-essential cookies
✓ Third-party processor agreements (Google, AWS)
✓ Data breach notification procedures (72-hour rule)
```

**SOC 2 Compliance**:
```
✓ Access controls (authentication, authorization)
✓ Change management (version control, CI/CD)
✓ Backup and recovery (daily backups, tested restores)
✓ Encryption (TLS 1.3+, AES-256)
✓ Logging and monitoring (audit logs, alerting)
✓ Incident response plan documented
✓ Security policy and procedures documented
✓ Employee training (security awareness)
```

---

## Monitoring & Observability

### 1. Logging Strategy

**Tool**: ELK Stack (Elasticsearch, Logstash, Kibana)

**Log Configuration** (`lib/logger.ts`):
```typescript
import winston from 'winston';
import ElasticsearchTransport from 'winston-elasticsearch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'blockstop',
    environment: process.env.NODE_ENV
  },
  transports: [
    // File logs
    new winston.transports.File({
      filename: '/var/log/blockstop/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/blockstop/combined.log'
    }),
    // Elasticsearch (staging/prod only)
    ...(process.env.NODE_ENV !== 'development' ? [
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: { node: process.env.ELASTIC_SEARCH_URL },
        index: 'blockstop-logs'
      })
    ] : [])
  ]
});

// Console logging for development
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

**Log Levels and Examples**:
```typescript
// Error: System failures, exceptions
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  duration: '5000ms'
});

// Warn: Unusual conditions
logger.warn('High error rate detected', {
  errorRate: '5.2%',
  threshold: '5%'
});

// Info: Important events
logger.info('File scan completed', {
  fileName: 'test.exe',
  threatLevel: 'dangerous',
  duration: '2500ms'
});

// Debug: Detailed diagnostic information
logger.debug('API request received', {
  method: 'POST',
  path: '/api/email/check',
  userId: 'user-123'
});
```

### 2. Metrics and Monitoring

**Tool**: Prometheus + Grafana

**Prometheus Metrics** (`lib/metrics.ts`):
```typescript
import * as prometheus from 'prom-client';

// Request duration histogram
export const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Email scans counter
export const emailScansTotal = new prometheus.Counter({
  name: 'email_scans_total',
  help: 'Total number of email scans',
  labelNames: ['threat_level']
});

// File scans counter
export const fileScansTotal = new prometheus.Counter({
  name: 'file_scans_total',
  help: 'Total number of file scans',
  labelNames: ['threat_level']
});

// Database connection pool
export const dbPoolConnections = new prometheus.Gauge({
  name: 'database_pool_connections',
  help: 'Number of active database connections',
  labelNames: ['status']
});

// Middleware for recording metrics
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
}
```

**Grafana Dashboards**:
```json
{
  "dashboard": {
    "title": "BlockStop Health Dashboard",
    "panels": [
      {
        "title": "API Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Email Scans per Minute",
        "targets": [
          {
            "expr": "rate(email_scans_total[1m])"
          }
        ]
      },
      {
        "title": "Threat Detection Rate",
        "targets": [
          {
            "expr": "email_scans_total{threat_level='dangerous'} / email_scans_total"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "targets": [
          {
            "expr": "database_pool_connections"
          }
        ]
      }
    ]
  }
}
```

### 3. Alerting Strategy

**Alert Rules** (`monitoring/alerts.yml`):
```yaml
groups:
  - name: blockstop-alerts
    interval: 30s
    rules:
      # API Latency Alert
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: "API latency is high"
          description: "P95 latency > 500ms for 5 minutes"
        labels:
          severity: warning

      # Error Rate Alert
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.01
        for: 2m
        annotations:
          summary: "Error rate is high"
          description: "Error rate > 1% for 2 minutes"
        labels:
          severity: critical

      # Database Connection Alert
      - alert: DatabaseConnectionWarning
        expr: database_pool_connections{status="active"} > 80
        for: 5m
        annotations:
          summary: "Database connection pool near capacity"
        labels:
          severity: warning

      # Memory Leak Detection
      - alert: PossibleMemoryLeak
        expr: |
          (
            container_memory_usage_bytes{pod="blockstop"}
            -
            avg_over_time(container_memory_usage_bytes{pod="blockstop"}[1h])
          ) > 100_000_000
        for: 30m
        annotations:
          summary: "Possible memory leak detected"
        labels:
          severity: warning
```

**Notification Channels**:
```yaml
# Slack notifications
alerting:
  alertmanagers:
    - scheme: https
      static_configs:
        - targets: ['alertmanager:9093']

routes:
  - match:
      severity: critical
    receiver: pagerduty
    continue: true
  - match:
      severity: warning
    receiver: slack
  - match:
      severity: info
    receiver: slack-dev

receivers:
  - name: slack
    slack_configs:
      - api_url: ${SLACK_WEBHOOK}
        channel: '#blockstop-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'

  - name: pagerduty
    pagerduty_configs:
      - service_key: ${PAGERDUTY_KEY}
```

### 4. Incident Response

**Incident Response Runbook** (`docs/incident-response.md`):

```markdown
## Incident Response Procedure

### 1. Detection Phase
- Alert triggered via Prometheus → Slack
- On-call engineer notified
- Severity level assigned

### 2. Assessment Phase
- Check error logs in Kibana
- Review metrics in Grafana
- Identify affected systems
- Estimate impact scope

### 3. Mitigation Phase

#### High API Latency
```bash
# Check database performance
kubectl exec -it blockstop-prod-0 -- psql -U blockstop -d blockstop -c "
  SELECT query, calls, mean_time FROM pg_stat_statements 
  ORDER BY mean_time DESC LIMIT 10;
"

# Scale deployment if needed
kubectl scale deployment blockstop-prod --replicas=10 -n blockstop-prod

# Monitor recovery
kubectl logs -f deployment/blockstop-prod -n blockstop-prod
```

#### High Error Rate
```bash
# Check recent errors
kubectl logs deployment/blockstop-prod -n blockstop-prod --since=5m --grep="ERROR"

# Rollback if needed (see Rollback Procedures section)
./scripts/rollback.sh

# Verify rollback
curl https://blockstop.com/api/health
```

### 4. Communication Phase
- Update status page
- Notify affected customers
- Post updates to Slack every 15 minutes

### 5. Resolution Phase
- Confirm incident is resolved
- Post-mortem within 24 hours
- Document root cause
- Create follow-up tickets

### 6. Post-Incident Phase
- Implement fixes to prevent recurrence
- Update runbooks with findings
- Review monitoring and alerting
```

---

## Rollback Procedures

### 1. Deployment Rollback

**Blue-Green Rollback** (Immediate):
```bash
#!/bin/bash
# scripts/rollback.sh

TARGET_VERSION=$1  # e.g., "prod-v1.2.3"

if [ -z "$TARGET_VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

echo "🔄 Starting rollback to $TARGET_VERSION..."

# Switch traffic to blue (previous version)
kubectl patch service blockstop-prod \
  -n blockstop-prod \
  -p '{"spec":{"selector":{"deployment":"blue"}}}'

echo "✓ Traffic switched to $TARGET_VERSION"

# Verify health
echo "🔍 Running health checks..."
for i in {1..10}; do
  if curl -f https://blockstop.com/api/health > /dev/null 2>&1; then
    echo "✓ Service is healthy"
    break
  fi
  echo "Waiting... ($i/10)"
  sleep 10
done

# Log the rollback
kubectl logs deployment/blockstop-prod-blue -n blockstop-prod --tail=50

echo "✅ Rollback complete!"

# Notify team
curl -X POST $SLACK_WEBHOOK \
  -d "{\"text\": \"⚠️ Rolled back to $TARGET_VERSION - Issue: [describe issue]\"}"
```

**Automated Rollback Trigger**:
```yaml
# monitoring/rollback-trigger.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rollback-rules
data:
  error-rate-threshold: "5"      # 5% error rate triggers rollback
  latency-threshold: "1000"      # 1000ms P95 latency
  timeout-seconds: "300"         # Wait 5 minutes before rollback
```

### 2. Database Rollback

**Schema Rollback**:
```bash
#!/bin/bash
# scripts/db-rollback.sh

TARGET_VERSION=$1

# Get applied migrations
CURRENT=$(psql -U blockstop -d blockstop -t -c \
  "SELECT MAX(version) FROM schema_migrations")

if [ "$CURRENT" -le "$TARGET_VERSION" ]; then
  echo "Already at target version"
  exit 0
fi

# Rollback migrations
for version in $(seq $CURRENT -1 $((TARGET_VERSION + 1))); do
  echo "Rolling back migration $version..."
  
  # Load and execute down() SQL
  DOWN_SQL=$(grep -A 50 "export const down" \
    database/migrations/$(printf "%03d" $version)-*.ts | \
    sed '1d;$d')
  
  psql -U blockstop -d blockstop -c "$DOWN_SQL"
  psql -U blockstop -d blockstop -c \
    "DELETE FROM schema_migrations WHERE version = $version"
done

echo "✓ Database rolled back to v$TARGET_VERSION"
```

**Data Rollback**:
```bash
#!/bin/bash
# scripts/data-recovery.sh

BACKUP_DATE=$1  # e.g., "2026-06-17-12:00:00"

echo "Restoring database from backup: $BACKUP_DATE"

# Download backup from S3
aws s3 cp s3://blockstop-backups/db-$BACKUP_DATE.dump ./recovery.dump

# Restore to database
pg_restore -U blockstop -d blockstop-recovery ./recovery.dump

# Verify integrity
psql -U blockstop -d blockstop-recovery -c "SELECT COUNT(*) FROM users"

# Switch to recovered database
kubectl patch statefulset blockstop-db -n blockstop-prod \
  -p '{"spec":{"selector":{"version":"recovery"}}}'

echo "✓ Data restored from $BACKUP_DATE"
```

### 3. Feature Flag Rollback

**Immediate Feature Disable**:
```typescript
// lib/feature-flags.ts
export const featureFlags = {
  ENABLE_NEW_EMAIL_PARSER: {
    default: false,
    canDisableAtRuntime: true,
    rollbackDelay: 0  // Immediate
  },
  ENABLE_ADVANCED_ANALYTICS: {
    default: false,
    canDisableAtRuntime: true,
    rollbackDelay: 0
  }
};

// In API route
if (!isFeatureEnabled('ENABLE_NEW_EMAIL_PARSER')) {
  return useOldEmailParser();
}
```

---

## Zero-Downtime Deployment

### 1. Blue-Green Deployment

**Process**:
1. Green environment has new code, Blue has old code
2. Run migrations on Green (if needed)
3. Run smoke tests on Green
4. Switch traffic to Green (instant cutover)
5. Keep Blue running for 24 hours for quick rollback

**Kubernetes Manifest**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: blockstop-prod
spec:
  selector:
    deployment: blue  # Points to blue or green
  ports:
    - port: 443
      targetPort: 3000

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blockstop-prod-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      deployment: blue
  template:
    metadata:
      labels:
        deployment: blue
    spec:
      containers:
      - name: app
        image: blockstop:prod-v1.2.3
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 10

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blockstop-prod-green
spec:
  replicas: 3
  selector:
    matchLabels:
      deployment: green
  template:
    metadata:
      labels:
        deployment: green
    spec:
      containers:
      - name: app
        image: blockstop:prod-v1.2.4
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 10
```

**Switch Traffic** (`scripts/switch-traffic.sh`):
```bash
#!/bin/bash

# Update service to point to green
kubectl patch service blockstop-prod \
  -n blockstop-prod \
  -p '{"spec":{"selector":{"deployment":"green"}}}'

# Monitor for errors
kubectl logs deployment/blockstop-prod-green \
  -n blockstop-prod --tail=100 --follow --timestamps=true &

MONITOR_PID=$!

# Wait 5 minutes with monitoring
sleep 300

# Check if there are errors
ERRORS=$(kubectl logs deployment/blockstop-prod-green \
  -n blockstop-prod --since=5m | grep -c ERROR || true)

kill $MONITOR_PID

if [ $ERRORS -gt 10 ]; then
  echo "❌ Too many errors detected, rolling back..."
  kubectl patch service blockstop-prod \
    -n blockstop-prod \
    -p '{"spec":{"selector":{"deployment":"blue"}}}'
  exit 1
fi

echo "✅ Successfully deployed to green environment"
```

### 2. Canary Deployment

**Gradual Rollout** (10% → 25% → 50% → 100%):
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: blockstop
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: blockstop-prod
  progressDeadlineSeconds: 60
  service:
    port: 443
  analysis:
    interval: 1m
    threshold: 5  # 5 failed checks triggers rollback
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
  webhooks:
  - name: smoke-tests
    url: http://flagger-loadtester/
    metadata:
      type: smoke
      cmd: "curl -sd 'test' http://blockstop-prod-canary:443/api/health"
```

---

## Phase-by-Phase Breakdown

### Phase 1: Core Platform (Phases 1.0-1.4)
**Testing Focus**: Unit tests, API integration tests
**Deployment**: Docker Compose for development
**Status**: ✅ Complete

**Testing Checklist**:
- [ ] All AI engines tested (DRAR AI, BetterBot PRO)
- [ ] Email and file API endpoints tested
- [ ] Frontend components tested
- [ ] Database integration tested
- [ ] Authentication flows tested

**Deployment Checklist**:
- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] Database migrations run
- [ ] API endpoints respond correctly
- [ ] Health check endpoint works

### Phase 2: Browser Extension (Planned)
**Testing Focus**: Extension-specific E2E tests, content script tests
**Deployment**: Chrome Web Store, Firefox Add-ons

**Testing Checklist**:
- [ ] Content script injection works
- [ ] Background service worker functions
- [ ] Pop-up UI renders correctly
- [ ] Gmail integration works
- [ ] Permission requests handled
- [ ] Cross-browser compatibility verified

**Deployment Checklist**:
- [ ] Manifest version correct
- [ ] All permissions documented
- [ ] Privacy policy referenced
- [ ] Code signing complete
- [ ] Store submission approved

### Phase 3: Desktop Application (Planned)
**Testing Focus**: Electron-specific tests, native integrations
**Deployment**: Auto-update mechanism, installer

**Testing Checklist**:
- [ ] Electron forge build works
- [ ] Code signing verified
- [ ] Notarization complete (macOS)
- [ ] System tray integration works
- [ ] File system access tested
- [ ] Auto-update mechanism verified

### Phase 4: Mobile App (Planned)
**Testing Focus**: React Native tests, platform-specific tests
**Deployment**: Apple App Store, Google Play

**Testing Checklist**:
- [ ] iOS build successful
- [ ] Android build successful
- [ ] Push notifications work
- [ ] Offline mode functions
- [ ] Mobile-specific permissions handled
- [ ] App store review requirements met

### Phases 5-20: Advanced Features
**Testing Focus**: Integration with Phase 4 components
**Deployment**: Feature flag rollouts, canary deployments

**Key Features**:
- Phase 5: Advanced threat intelligence
- Phase 6-8: Enterprise features
- Phase 9-12: Team collaboration
- Phase 13-15: Marketplace & ecosystem
- Phase 16-20: AI/ML enhancements

---

## Testing Metrics & Targets

### Coverage Targets

| Phase | Unit | Integration | E2E | Coverage |
|-------|------|-------------|-----|----------|
| 1-2 | 85% | 70% | 60% | 80%+ |
| 3-5 | 85% | 75% | 70% | 82%+ |
| 6-10 | 85% | 80% | 75% | 85%+ |
| 11-20 | 90% | 85% | 80% | 90%+ |

### Performance Targets

| Metric | Baseline | Phase 10 | Phase 20 |
|--------|----------|----------|----------|
| API P95 | 100ms | 150ms | 200ms |
| Page Load | 2s | 2.5s | 3s |
| Database Query | 50ms | 75ms | 100ms |
| File Scan | 5s | 10s | 15s |

### Reliability Targets

| Metric | Phase 1-5 | Phase 6-12 | Phase 13-20 |
|--------|----------|----------|-----------|
| Uptime | 99% | 99.5% | 99.9% |
| Error Rate | 1% | 0.5% | 0.1% |
| Recovery Time | 30m | 15m | 5m |

---

## Continuous Improvement

### 1. Testing Retrospectives

**Monthly Review** (First Monday of month):
- Review test coverage trends
- Identify flaky tests
- Discuss failed test runs
- Plan coverage improvements

**Test Failures Analysis**:
- Root cause analysis
- Prevention strategies
- Automation improvements

### 2. Performance Optimization

**Quarterly Review**:
- Analyze performance trends
- Identify bottlenecks
- Benchmark against competitors
- Set quarterly targets

**Optimization Process**:
1. Identify slowest operations (profiling)
2. Analyze root cause
3. Implement optimization
4. Benchmark improvement
5. Deploy to production
6. Monitor for regression

### 3. Security Reviews

**Monthly Security Audit**:
- Review new dependencies
- Check for known vulnerabilities
- Analyze security logs
- Penetration test (quarterly)

---

## Documentation & Training

### 1. Testing Documentation
- Test plan and strategy (this document)
- Test case specifications
- Automation framework documentation
- Troubleshooting guides

### 2. Deployment Documentation
- Deployment runbooks
- Emergency procedures
- Configuration guides
- Infrastructure diagrams

### 3. Training Materials
- Video tutorials for testing tools
- Code examples for common scenarios
- Best practices documentation
- Q&A sessions and recordings

---

## Appendix: Tools & Frameworks

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Supertest**: HTTP request testing
- **Playwright**: E2E browser automation
- **k6**: Load and performance testing
- **OWASP ZAP**: Security scanning

### Deployment Tools
- **Docker**: Containerization
- **Kubernetes**: Orchestration
- **GitHub Actions**: CI/CD
- **Terraform**: Infrastructure as Code

### Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **ELK Stack**: Logging and analysis
- **Sentry**: Error tracking
- **New Relic**: Application performance monitoring

### Security Tools
- **Snyk**: Vulnerability scanning
- **SonarQube**: Code quality analysis
- **Vault**: Secrets management
- **Falco**: Runtime security

---

## Conclusion

This comprehensive deployment and testing strategy provides a structured, scalable approach to ensuring BlockStop PRO's quality and reliability across all 20 planned phases. By implementing automated testing at all levels, maintaining comprehensive CI/CD pipelines, and following proven deployment practices, we can deliver features quickly while maintaining high reliability and security standards.

Key success factors:
1. **Automation First**: Automate all testing and deployment processes
2. **Continuous Monitoring**: Detect and respond to issues in real-time
3. **Gradual Rollout**: Use canary and blue-green deployments
4. **Rollback Ready**: Always have a quick rollback path
5. **Security Priority**: Test security at every phase
6. **Performance Focus**: Monitor and optimize continuously

**Last Updated**: 2026-06-17  
**Next Review**: 2026-09-17  
**Maintained By**: BlockStop Engineering Team
