# BlockStop CI/CD Setup Guide

Complete guide for setting up GitHub Actions CI/CD pipeline for BlockStop.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Secrets Configuration](#secrets-configuration)
4. [Workflow Configuration](#workflow-configuration)
5. [Docker Registry Setup](#docker-registry-setup)
6. [Build Caching](#build-caching)
7. [Status Checks](#status-checks)
8. [Notifications](#notifications)
9. [Advanced Configuration](#advanced-configuration)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access

- GitHub repository with admin access
- Docker Hub or GitHub Container Registry account
- AWS Account with permissions to EKS, ECR, S3
- Slack workspace for notifications (optional)
- SonarQube/CodeQL access for code quality (optional)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourorg/BlockStop.git
cd BlockStop

# Verify GitHub CLI
gh --version  # >= 2.0

# Authenticate with GitHub
gh auth login
```

## GitHub Repository Setup

### Enable Required Features

```bash
# Enable branch protection rules
gh repo edit --enable-issues

# Enable Actions
gh workflow enable test.yml
gh workflow enable build.yml
gh workflow enable deploy.yml

# Set default branch
gh repo edit --default-branch main
```

### Branch Protection Rules

Set up protection on `main` and `develop` branches:

```bash
# Create branch protection for main
gh api repos/{owner}/{repo}/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["test","build"]}' \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  -f enforce_admins=true
```

### Required Status Checks

Configure in `.github/branch-protection.yml`:

```yaml
branches:
  - name: main
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "Tests & Code Quality"
          - "Build & Security Scan"
          - "CodeQL"
          - "Dependency Check"
      required_pull_request_reviews:
        required_approving_review_count: 1
        dismiss_stale_reviews: true
      enforce_admins: true
      restrictions:
        teams:
          - "core-team"
```

### Teams & Access Control

```bash
# Create teams
gh api orgs/{org}/teams -f name=core-team

# Add team to repository
gh api repos/{owner}/{repo}/teams/core-team \
  -f permission=maintain

# Require code owner reviews
echo "* @core-team" > .github/CODEOWNERS

# Commit CODEOWNERS
git add .github/CODEOWNERS
git commit -m "Add CODEOWNERS for code review requirements"
git push
```

## Secrets Configuration

### Environment Secrets

Create secrets in GitHub for each environment:

```bash
# Development environment
gh secret set -R {owner}/{repo} \
  --env development \
  DATABASE_URL "postgresql://dev:pass@localhost/blockstop_dev"

# Staging environment
gh secret set -R {owner}/{repo} \
  --env staging \
  DATABASE_URL "postgresql://user:pass@staging-db.rds.amazonaws.com/blockstop"

# Production environment
gh secret set -R {owner}/{repo} \
  --env production \
  DATABASE_URL "postgresql://user:pass@prod-db.rds.amazonaws.com/blockstop"
```

### AWS Credentials

```bash
# Create IAM user for GitHub Actions
aws iam create-user --user-name github-actions

# Create access key
aws iam create-access-key --user-name github-actions

# Attach policy
aws iam attach-user-policy \
  --user-name github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

# Store credentials in GitHub
gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
gh secret set AWS_SECRET_ACCESS_KEY --body "..."
gh secret set AWS_REGION --body "us-east-1"
```

### Docker Registry Credentials

#### GitHub Container Registry (GHCR)

```bash
# Create personal access token
gh auth token

# Store in GitHub (already available as GITHUB_TOKEN)
# No additional setup needed
```

#### Docker Hub (if using)

```bash
# Create access token on Docker Hub

# Store credentials
gh secret set DOCKERHUB_USERNAME --body "username"
gh secret set DOCKERHUB_TOKEN --body "..."
```

### ArgoCD Credentials

```bash
# Get ArgoCD server URL
kubectl get svc argocd-server -n argocd

# Create API token
argocd account generate-token --account github-actions

# Store in GitHub
gh secret set ARGOCD_SERVER --body "https://argocd.example.com"
gh secret set ARGOCD_TOKEN --body "..."
gh secret set ARGOCD_WEBHOOK_URL --body "https://argocd.example.com/api/webhooks"
```

### Slack Webhooks

```bash
# Create incoming webhook in Slack workspace
# (Slack App > Incoming Webhooks > Add New Webhook to Workspace)

# Store webhook URL
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."

# Optional: Create different webhooks for environments
gh secret set -R {owner}/{repo} \
  --env production \
  SLACK_WEBHOOK_URL "https://hooks.slack.com/services/prod-..."
```

### Code Quality Tools

#### SonarCloud

```bash
# Create SonarCloud organization account
# https://sonarcloud.io

# Generate token
# (SonarCloud > Security > Generate Token)

# Store token
gh secret set SONAR_TOKEN --body "squ_..."
```

#### Snyk

```bash
# Create Snyk account
# Get API token from settings

# Store token
gh secret set SNYK_TOKEN --body "..."
```

#### CodeQL

```bash
# CodeQL is built-in to GitHub
# Advanced Security must be enabled (Premium feature)

# Enable in repository settings
# Settings > Code security and analysis > Enable CodeQL analysis
```

## Workflow Configuration

### Workflow Triggers

Define when workflows run:

```yaml
# On pull request
on:
  pull_request:
    branches: [main, develop]
    paths-ignore:
      - 'docs/**'
      - '**.md'

# On push
on:
  push:
    branches: [main, develop]

# On schedule
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

# Manual trigger
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
```

### Workflow Permissions

Set minimum required permissions:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      security-events: write
      id-token: write  # For OIDC
```

### Matrix Strategy

Test across multiple configurations:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, macos-latest]
    postgres-version: ['14', '15']

  # Continue even if one fails
  fail-fast: false
```

### Conditional Steps

```yaml
steps:
  - name: Run only on main
    if: github.ref == 'refs/heads/main'
    run: npm run deploy

  - name: Run on pull requests
    if: github.event_name == 'pull_request'
    run: npm run test:integration

  - name: Run if previous failed
    if: failure()
    run: npm run notify-failure
```

## Docker Registry Setup

### GitHub Container Registry

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Tag image
docker tag blockstop-web:latest ghcr.io/yourorg/blockstop-web:latest

# Push image
docker push ghcr.io/yourorg/blockstop-web:latest

# List images
gh api repos/{owner}/{repo}/packages --jq '.[] | .name'

# Delete old images
gh api -X DELETE repos/{owner}/{repo}/packages/container/blockstop-web/versions/{version_id}
```

### Configure Package Visibility

```bash
# Make packages public (optional)
gh api repos/{owner}/{repo}/packages/container/blockstop-web \
  -f visibility=public

# Set retention policy
gh api repos/{owner}/{repo}/packages/container/blockstop-web/retention-policy \
  -f retention_days=30
```

### Pull Image in Kubernetes

```bash
# Create image pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=$GITHUB_TOKEN \
  --docker-email=<email> \
  -n blockstop

# Use in deployment
spec:
  imagePullSecrets:
    - name: ghcr-secret
  containers:
    - image: ghcr.io/yourorg/blockstop-web:latest
```

## Build Caching

### GitHub Actions Cache

```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Or using npm ci directly
- run: npm ci
```

### Docker Build Cache

```yaml
- uses: docker/setup-buildx-action@v3

- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Layer Caching Strategy

```dockerfile
# Dockerfile optimization for caching
FROM node:20-alpine

WORKDIR /app

# Copy only dependencies first (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source code (invalidated on changes)
COPY . .

# Build
RUN npm run build

# Remove dev dependencies
RUN npm prune --production
```

## Status Checks

### Required Status Checks

Configure which checks must pass:

```bash
# List required checks
gh api repos/{owner}/{repo}/branches/main \
  --jq '.protection.required_status_checks.contexts'

# Add required check
gh api repos/{owner}/{repo}/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["test","build","codeql"]}'
```

### Badge in README

```markdown
# BlockStop

[![Tests](https://github.com/yourorg/BlockStop/workflows/Tests%20%26%20Code%20Quality/badge.svg)](https://github.com/yourorg/BlockStop/actions)
[![Build](https://github.com/yourorg/BlockStop/workflows/Build%20%26%20Security%20Scan/badge.svg)](https://github.com/yourorg/BlockStop/actions)
[![codecov](https://codecov.io/gh/yourorg/BlockStop/branch/main/graph/badge.svg)](https://codecov.io/gh/yourorg/BlockStop)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
```

## Notifications

### Slack Integration

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Deployment Status",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "${{ job.status == 'success' && '✅' || '❌' }} Job Status\nBranch: ${{ github.ref }}\nAuthor: ${{ github.actor }}"
            }
          }
        ]
      }
```

### Email Notifications

```bash
# Configure in GitHub Settings > Notifications
# Select "Email" for workflow failures
```

### GitHub Discussions

```yaml
- name: Post to discussions
  uses: aendi/discussions-action@v1
  with:
    repo: ${{ github.repository }}
    title: "Deployment Result"
    body: "Deployment to production completed successfully"
    category: "Announcements"
```

## Advanced Configuration

### Dependent Jobs

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    steps:
      - run: kubectl apply -f kubernetes/
```

### Reusable Workflows

Create `.github/workflows/reusable-deploy.yml`:

```yaml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      DATABASE_URL:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
        env:
          ENVIRONMENT: ${{ inputs.environment }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Use in main workflow:

```yaml
deploy:
  uses: ./.github/workflows/reusable-deploy.yml
  with:
    environment: production
  secrets:
    DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
```

### Concurrency Control

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

# Only one deployment per branch at a time
# New push cancels previous deployment
```

### Self-Hosted Runners

```bash
# Add self-hosted runner to repository
# Settings > Actions > Runners > New self-hosted runner

# Run workflow on self-hosted runner
jobs:
  deploy:
    runs-on: [self-hosted, linux, x64]
```

## Troubleshooting

### Workflow Failures

```bash
# View workflow logs
gh run view <run-id> --log

# Re-run failed job
gh run rerun <run-id> --failed

# Debug workflow
# Add: - run: set -x  before problematic step
```

### Secret Issues

```bash
# Verify secrets are set
gh secret list

# Re-create a secret
gh secret set SECRET_NAME --body "new-value"

# Remove a secret
gh secret delete SECRET_NAME
```

### Cache Issues

```bash
# Clear workflow cache
gh api repos/{owner}/{repo}/actions/caches \
  -X DELETE

# Or in workflow:
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ github.run_id }}
```

### Permission Denied Errors

```bash
# Check token permissions
gh api user/installations

# Verify GITHUB_TOKEN permissions in workflow
# Settings > Actions > General > Workflow permissions

# Should be: "Read and write permissions"
```

### Docker Build Failures

```bash
# Build locally to test
docker build -t blockstop-web:test .

# Check for layer cache issues
docker build --no-cache -t blockstop-web:test .

# View Docker builder logs
docker buildx ls
```

### Deployment Failures

```bash
# Check ArgoCD sync status
argocd app get blockstop-production

# View ArgoCD logs
kubectl logs deployment/argocd-application-controller -n argocd

# Check webhook delivery
# GitHub > Settings > Webhooks > Deliveries
```

---

## Next Steps

1. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for infrastructure setup
2. Review [KUBERNETES_GUIDE.md](KUBERNETES_GUIDE.md) for Kubernetes management
3. Review [TERRAFORM_GUIDE.md](TERRAFORM_GUIDE.md) for Infrastructure as Code
4. Configure environment secrets in GitHub
5. Test pipeline with a pull request
6. Monitor initial deployments
