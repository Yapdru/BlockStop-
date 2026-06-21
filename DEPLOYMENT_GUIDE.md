# BlockStop Production Deployment Guide

Complete guide for deploying BlockStop to production environments using Kubernetes, Terraform, and CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Database Operations](#database-operations)
6. [Monitoring & Observability](#monitoring--observability)
7. [Disaster Recovery](#disaster-recovery)
8. [Scaling](#scaling)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

```bash
# AWS CLI
aws --version  # >= 2.0

# Terraform
terraform --version  # >= 1.0

# kubectl
kubectl version --client  # >= 1.24

# Helm
helm version  # >= 3.0

# Docker
docker --version  # >= 20.0

# Node.js
node --version  # >= 18.0
npm --version  # >= 9.0
```

### AWS Accounts

- Development account
- Staging account
- Production account

### Credentials

```bash
# Configure AWS credentials
aws configure

# Set default region
export AWS_REGION=us-east-1

# Setup Kubernetes credentials
aws eks update-kubeconfig \
  --name blockstop-production \
  --region us-east-1
```

## Infrastructure Setup

### Phase 1: Terraform Infrastructure

Initialize and plan the infrastructure:

```bash
# Navigate to Terraform directory
cd terraform/aws

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment (review changes)
terraform plan -out=tfplan -var-file=production.tfvars

# Apply infrastructure
terraform apply tfplan
```

### Phase 2: VPC & Network

The Terraform configuration creates:

- **VPC**: 10.0.0.0/16 CIDR block
- **Subnets**: 3 public, 3 private across AZs
- **NAT Gateways**: Multi-AZ for HA
- **Security Groups**: Ingress/egress rules
- **VPC Endpoints**: S3, CloudWatch

```bash
# Verify VPC
aws ec2 describe-vpcs --filters Name=tag:Environment,Values=production

# Verify subnets
aws ec2 describe-subnets --filters Name=tag:Environment,Values=production
```

### Phase 3: EKS Cluster

Deploy Kubernetes cluster:

```bash
# Monitor EKS creation (takes ~15 minutes)
aws eks describe-cluster \
  --name blockstop-production \
  --region us-east-1 \
  --query 'cluster.status'

# Get cluster endpoint
aws eks describe-cluster \
  --name blockstop-production \
  --query 'cluster.endpoint'

# Get certificate authority
aws eks describe-cluster \
  --name blockstop-production \
  --query 'cluster.certificateAuthority.data'
```

### Phase 4: Database & Cache

Deploy managed services:

```bash
# RDS PostgreSQL
aws rds describe-db-instances \
  --db-instance-identifier blockstop-prod \
  --query 'DBInstances[0].Endpoint'

# ElastiCache Redis
aws elasticache describe-cache-clusters \
  --cache-cluster-id blockstop-redis-prod \
  --show-cache-node-info
```

### Phase 5: Storage

Create S3 buckets for backups and assets:

```bash
# Verify buckets
aws s3 ls | grep blockstop

# Set bucket versioning
aws s3api put-bucket-versioning \
  --bucket blockstop-backups-us-east-1 \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket blockstop-backups-us-east-1 \
  --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
```

## CI/CD Pipeline

### GitHub Actions Workflows

The pipeline consists of three main workflows:

#### 1. Tests & Code Quality (`test.yml`)

Triggered on every push and PR:

```yaml
# Unit tests across Node versions
npm run test:coverage

# Linting and type checking
npm run lint
npm run type-check

# Security scanning
npm audit
```

Runs in parallel:
- Unit tests (Node 18.x, 20.x)
- Integration tests
- ESLint & TypeScript checks
- Security scans (OWASP, Snyk)

**Artifacts:**
- Coverage reports → Codecov
- Test results
- Build artifacts

#### 2. Build & Security (`build.yml`)

Triggered on push to main/develop:

```bash
# Build Docker images
docker build -t blockstop-web:latest .
docker build -t blockstop-api:latest .
docker build -t blockstop-worker:latest .

# Security scanning
trivy image blockstop-web:latest
hadolint Dockerfile

# Push to registry
docker push ghcr.io/blockstop/blockstop-web:latest
```

**Artifacts:**
- Docker images in GHCR
- Trivy scan results → GitHub Security

#### 3. Deploy (`deploy.yml`)

Triggered on merge to main/develop:

```bash
# Staging (develop branch)
# - Database migrations
# - Deploy to EKS staging
# - Health checks
# - Smoke tests
# - Slack notification

# Production (main branch)
# - Database migrations
# - Canary deployment (10%)
# - Health checks
# - Full deployment
# - Performance tests
# - Slack notification
```

### Running the Pipeline

#### Manual Trigger

```bash
# Trigger a workflow run
gh workflow run deploy.yml \
  --ref main \
  -f environment=production
```

#### Monitor Pipeline

```bash
# Watch workflow status
gh run watch

# View workflow logs
gh run view <run-id> --log

# List recent runs
gh run list --workflow test.yml
```

## Kubernetes Deployment

### Namespace & RBAC

```bash
# Create namespace
kubectl create namespace blockstop

# Apply RBAC configuration
kubectl apply -f kubernetes/rbac.yaml

# Verify RBAC
kubectl get serviceaccounts -n blockstop
kubectl get roles -n blockstop
```

### ConfigMaps & Secrets

```bash
# Create ConfigMap for configuration
kubectl apply -f kubernetes/configmap.yaml

# Create Secrets (sensitive data)
kubectl apply -f kubernetes/secrets.yaml

# Verify
kubectl get configmaps -n blockstop
kubectl get secrets -n blockstop
```

### Deploy Applications

#### Web Application

```bash
# Deploy web service
kubectl apply -f kubernetes/deployment-web.yaml

# Monitor deployment
kubectl rollout status deployment/blockstop-web -n blockstop

# Check logs
kubectl logs -f deployment/blockstop-web -n blockstop -c web
```

#### API Service

```bash
# Deploy API service
kubectl apply -f kubernetes/deployment-api.yaml

# Monitor
kubectl rollout status deployment/blockstop-api -n blockstop
kubectl logs -f deployment/blockstop-api -n blockstop
```

#### Worker Service

```bash
# Deploy worker service
kubectl apply -f kubernetes/deployment-worker.yaml

# Monitor
kubectl rollout status deployment/blockstop-worker -n blockstop
kubectl logs -f deployment/blockstop-worker -n blockstop
```

### Verify Deployment

```bash
# Check all pods
kubectl get pods -n blockstop -o wide

# Check services
kubectl get svc -n blockstop

# Check ingress
kubectl get ingress -n blockstop

# Check events
kubectl get events -n blockstop

# Health check
curl https://blockstop.com/api/health
curl https://blockstop.com/api/metrics/prometheus
```

## Database Operations

### Migrations

#### Run Pending Migrations

```bash
# Connect to cluster
kubectl port-forward svc/blockstop-api 4000:4000 -n blockstop

# Run migrations
npm run migrate:up

# Check status
npm run migrate:status
```

#### View Migration History

```bash
# Connect to database
kubectl exec -it <pod-name> -n blockstop -- psql $DATABASE_URL

# Query migration history
SELECT name, hash, executed_at FROM schema_migrations ORDER BY id;
```

### Backups

#### Create Manual Backup

```bash
# Create backup
npm run backup create

# Upload to S3
npm run backup upload

# List backups
npm run backup list

# Get statistics
npm run backup stats
```

#### Automated Daily Backups

Configured via Kubernetes CronJob:

```bash
# View backup jobs
kubectl get cronjobs -n blockstop

# View backup job history
kubectl get jobs -n blockstop -l job-type=backup

# View backup logs
kubectl logs -f job/<backup-job-id> -n blockstop
```

### Restore Operations

#### Point-in-Time Recovery

```bash
# List available backups
npm run restore list

# Restore to specific timestamp
npm run restore pit 2024-01-15T14:30:00Z

# Verify restoration
npm run restore status <backup-id>

# Promote restored database
npm run restore promote blockstop_pit blockstop
```

#### Full Database Restore

```bash
# Restore latest backup
npm run restore restore <backup-id> blockstop_restored

# Run tests against restored database
DATABASE_URL=postgresql://user:pass@host/blockstop_restored npm test

# If successful, promote
npm run restore promote blockstop_restored blockstop
```

## Monitoring & Observability

### Health Checks

Three types of health checks:

#### Liveness Probe

```bash
curl https://blockstop.com/api/health?liveness=true

# Response: 200 OK if service is running
```

#### Readiness Probe

```bash
curl https://blockstop.com/api/health?readiness=true

# Response: 200 OK if ready to serve traffic
# Response: 503 if dependencies unavailable
```

#### Full Health Check

```bash
curl https://blockstop.com/api/health

# Response includes:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "api": { "status": "operational" },
    "database": { "status": "operational", "responseTime": 5 },
    "cache": { "status": "operational", "responseTime": 2 },
    "memory": { "status": "operational", "usage": {...} },
    "disk": { "status": "operational", "usage": {...} }
  }
}
```

### Metrics Collection

#### Prometheus Metrics

```bash
# Scrape Prometheus metrics
curl https://blockstop.com/api/metrics/prometheus

# Returns metrics in Prometheus format:
# blockstop_process_memory_heap_used_bytes 12345678
# blockstop_database_connections_active 5
# blockstop_database_cache_hit_ratio 87.5
```

#### Dashboard Metrics

```bash
# Get aggregated metrics
curl https://blockstop.com/api/monitoring/metrics

# Response includes:
{
  "timestamp": "2024-01-15T10:30:00Z",
  "pageLoad": {...},
  "apiLatency": {...},
  "systemMetrics": {...},
  "alerts": {...}
}
```

### Logging

#### View Application Logs

```bash
# Real-time logs
kubectl logs -f deployment/blockstop-web -n blockstop

# Filter by log level
kubectl logs deployment/blockstop-api -n blockstop | grep ERROR

# View logs from specific pod
kubectl logs <pod-name> -n blockstop -c web

# View previous logs (if pod crashed)
kubectl logs <pod-name> -n blockstop --previous
```

#### CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups

# View logs
aws logs tail /aws/eks/blockstop-production --follow

# Filter logs
aws logs filter-log-events \
  --log-group-name /aws/eks/blockstop-production \
  --filter-pattern ERROR
```

### Alerts

Configure alerts in CloudWatch or Prometheus:

```bash
# CPU > 80%
# Memory > 85%
# Database connections > 90% of max
# API latency > 1000ms
# Error rate > 1%
# Pod restart count > 3
```

## Disaster Recovery

### Backup Strategy

**Daily backups** retained for **30 days**:

```
Day 1-7: Daily backups
Day 8-14: Weekly backups (oldest daily deleted)
Day 15-30: Weekly backups
Day 31+: Deleted
```

### Restore Procedures

#### RTO & RPO Targets

- **RTO (Recovery Time Objective)**: < 15 minutes
- **RPO (Recovery Point Objective)**: < 1 hour

#### Full Site Recovery

```bash
# 1. Infrastructure
terraform destroy --auto-approve  # if needed
terraform apply --auto-approve

# 2. EKS Cluster
aws eks create-cluster ...  # wait for creation

# 3. Deploy Applications
kubectl apply -f kubernetes/

# 4. Database
npm run restore restore <backup-id>

# 5. Verify
curl https://blockstop.com/api/health
```

#### Database-Only Recovery

```bash
# 1. Restore from backup
npm run restore pit 2024-01-15T10:00:00Z

# 2. Run migrations
npm run migrate:up

# 3. Verify data
npm run test:integration

# 4. Promote to primary
npm run restore promote blockstop_pit blockstop

# 5. Restart applications
kubectl rollout restart deployment/blockstop-web -n blockstop
kubectl rollout restart deployment/blockstop-api -n blockstop
```

### Testing Disaster Recovery

Monthly DR drills:

```bash
# Create test environment
terraform workspace new dr-test
terraform apply -var-file=dr-test.tfvars

# Run full restore
npm run restore pit 2024-01-15T10:00:00Z

# Run tests
npm run test:smoke
npm run test:integration

# Verify metrics
curl https://blockstop-dr-test.com/api/health

# Cleanup
terraform workspace delete dr-test
```

## Scaling

### Horizontal Pod Autoscaling

Automatic scaling based on CPU and memory:

```bash
# View HPA status
kubectl get hpa -n blockstop

# Check metrics
kubectl get hpa -n blockstop -o wide

# Manual pod scaling
kubectl scale deployment blockstop-web --replicas=5 -n blockstop
```

HPA Configuration:

- Min replicas: 3
- Max replicas: 10
- CPU target: 80%
- Memory target: 85%

### Node Autoscaling

Cluster autoscaler manages nodes:

```bash
# View cluster autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler

# Scale up is automatic when pods pending
# Scale down after 10 minutes of low utilization
```

### Database Scaling

RDS uses auto-scaling for storage:

```bash
# Current size
aws rds describe-db-instances \
  --db-instance-identifier blockstop-prod \
  --query 'DBInstances[0].AllocatedStorage'

# Auto-scale: max 1000 GB
```

Read replicas for high-load scenarios:

```bash
# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier blockstop-prod-replica-1 \
  --source-db-instance-identifier blockstop-prod
```

## Security

### Network Security

```bash
# Security group rules
aws ec2 describe-security-groups \
  --filters Name=tag:Purpose,Values=blockstop

# Network policies
kubectl get networkpolicies -n blockstop

# Verify traffic restrictions
kubectl apply -f kubernetes/networkpolicy.yaml
```

### Secrets Management

```bash
# Rotate database password
aws secretsmanager rotate-secret \
  --secret-id blockstop/db-password

# Update Kubernetes secret
kubectl create secret generic blockstop-db-secret \
  --from-literal=password=$NEW_PASSWORD \
  --dry-run=client -o yaml | kubectl apply -f -
```

### TLS/SSL

```bash
# Certificate status
kubectl get certificate -n blockstop

# Renew certificates
kubectl annotate certificate blockstop-tls \
  cert-manager.io/issue-temporary-certificate=true
```

### Pod Security

```bash
# Apply security policy
kubectl apply -f kubernetes/pod-security-policy.yaml

# Check pod security standards
kubectl label namespace blockstop \
  pod-security.kubernetes.io/enforce=restricted
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n blockstop

# View events
kubectl get events -n blockstop | grep <pod-name>

# Check resource requests vs available
kubectl top nodes
kubectl describe nodes
```

### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n blockstop

# View heap dump
kubectl exec <pod-name> -n blockstop -- jmap -heap <pid>

# Restart pod
kubectl delete pod <pod-name> -n blockstop
```

### Database Connection Issues

```bash
# Test connection
kubectl exec -it <pod-name> -n blockstop -- \
  psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
curl https://blockstop.com/api/health

# Scale down and back up
kubectl scale deployment blockstop-api --replicas=0 -n blockstop
kubectl scale deployment blockstop-api --replicas=3 -n blockstop
```

### Slow API Response

```bash
# Check API logs for slow queries
kubectl logs deployment/blockstop-api -n blockstop | grep "slow query"

# Check database
curl https://blockstop.com/api/metrics/prometheus | grep database

# Run performance tests
npm run test:performance
```

### Ingress/Load Balancer Issues

```bash
# Check ingress status
kubectl describe ingress blockstop-ingress -n blockstop

# Check load balancer
aws elbv2 describe-load-balancers

# Test DNS resolution
nslookup blockstop.com

# Test HTTPS
curl -v https://blockstop.com
```

---

## Support & Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
