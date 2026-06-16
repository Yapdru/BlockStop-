# BlockStop Cloud Infrastructure & Deployment Guide

Complete production-grade cloud infrastructure setup for BlockStop across multiple cloud providers with comprehensive CI/CD pipelines.

## Overview

This infrastructure includes:

- **Docker & Containerization**: Multi-stage builds for web, API, and worker services
- **Kubernetes Orchestration**: Complete K8s manifests for EKS, GKE, and AKS
- **Cloud Infrastructure as Code**: Terraform for AWS, GCP, and Azure
- **CI/CD Pipelines**: GitHub Actions for build, test, and deployment
- **Operational Tools**: Scripts for deployment, scaling, backups, and health checks

## Directory Structure

```
BlockStop-/
├── docker/                          # Container definitions
│   ├── Dockerfile.web              # Next.js web app
│   ├── Dockerfile.api              # Express API server
│   ├── Dockerfile.worker           # Background worker service
│   ├── docker-compose.production.yml
│   ├── nginx.conf                  # Reverse proxy config
│   └── .dockerignore
│
├── kubernetes/                      # K8s manifests
│   ├── namespace.yaml              # Namespace & policies
│   ├── configmap.yaml              # Configuration
│   ├── secrets.yaml                # Secrets management
│   ├── deployment-api.yaml         # API deployment
│   ├── deployment-web.yaml         # Web deployment
│   ├── deployment-worker.yaml      # Worker deployment
│   ├── ingress.yaml                # Ingress & TLS
│   ├── storage.yaml                # Volumes & storage classes
│   └── rbac.yaml                   # Service accounts & RBAC
│
├── terraform/
│   ├── aws/                        # AWS infrastructure
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars.example
│   │   └── modules/                # Reusable modules
│   ├── gcp/                        # GCP infrastructure (optional)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars.example
│   └── azure/                      # Azure infrastructure (optional)
│       ├── main.bicep
│       ├── aks.bicep
│       └── outputs.bicep
│
├── .github/workflows/              # CI/CD pipelines
│   ├── build.yml                   # Build & test
│   ├── deploy-staging.yml          # Staging deployment
│   ├── deploy-prod.yml             # Production deployment
│   ├── security-scan.yml           # Security scanning
│   └── performance-test.yml        # Performance testing
│
└── scripts/                        # Operational scripts
    ├── deploy.sh                   # Deployment automation
    ├── scale.sh                    # Auto-scaling management
    ├── backup.sh                   # Backup automation
    ├── restore.sh                  # Restore procedures
    └── health-check.sh             # Health monitoring
```

## Quick Start

### 1. Docker Setup (Local Development)

```bash
# Build Docker images
docker-compose -f docker/docker-compose.production.yml build

# Start all services
docker-compose -f docker/docker-compose.production.yml up -d

# View logs
docker-compose -f docker/docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.production.yml down
```

### 2. Kubernetes Setup

#### Prerequisites
- `kubectl` installed and configured
- `helm` installed (for package management)
- Access to a Kubernetes cluster (EKS, GKE, or AKS)

#### Deploy to Kubernetes

```bash
# Create namespace and apply configurations
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/storage.yaml
kubectl apply -f kubernetes/rbac.yaml

# Deploy applications
kubectl apply -f kubernetes/deployment-api.yaml
kubectl apply -f kubernetes/deployment-web.yaml
kubectl apply -f kubernetes/deployment-worker.yaml

# Deploy ingress
kubectl apply -f kubernetes/ingress.yaml

# Verify deployment
kubectl get pods -n blockstop
kubectl get services -n blockstop
```

### 3. Terraform Infrastructure (AWS Example)

```bash
cd terraform/aws

# Initialize Terraform
terraform init

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration

# Plan infrastructure
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Get outputs
terraform output -json > infrastructure.json
```

## Cloud Provider Setup

### AWS (EKS)

**Prerequisites:**
- AWS account with appropriate permissions
- AWS CLI configured
- Terraform >= 1.0

**Steps:**

1. **Update Variables:**
   ```bash
   cd terraform/aws
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your values
   ```

2. **Configure AWS Credentials:**
   ```bash
   aws configure
   # or use environment variables
   export AWS_ACCESS_KEY_ID=xxx
   export AWS_SECRET_ACCESS_KEY=xxx
   ```

3. **Deploy Infrastructure:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Configure kubectl:**
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name blockstop-cluster
   ```

5. **Deploy Applications:**
   ```bash
   kubectl apply -f ../../kubernetes/
   ```

### GCP (GKE)

Similar process with GCP-specific Terraform configuration.

### Azure (AKS)

Uses Bicep ARM templates for infrastructure.

## CI/CD Pipelines

### Build Pipeline (.github/workflows/build.yml)

Triggered on push to main/develop:
- Builds Docker images
- Runs linters and tests
- Scans for vulnerabilities
- Uploads artifacts

### Staging Deployment (.github/workflows/deploy-staging.yml)

Triggered on push to develop:
- Builds images with staging tag
- Deploys to staging EKS cluster
- Runs smoke tests
- Verifies health checks

### Production Deployment (.github/workflows/deploy-prod.yml)

Triggered on push to main or tag:
- Blue-green deployment strategy
- Database backups before deployment
- Comprehensive health checks
- Automatic rollback on failure
- Release notes generation

### Security Scanning (.github/workflows/security-scan.yml)

Runs daily and on PR:
- Trivy container scanning
- Snyk vulnerability scanning
- OWASP Dependency-Check
- CodeQL analysis
- Secret detection (TruffleHog)
- SAST scanning (Semgrep)

### Performance Testing (.github/workflows/performance-test.yml)

Runs daily on main:
- Load testing
- Performance benchmarks
- Bundle size analysis
- Lighthouse audits

## Operational Scripts

### Deployment Script

```bash
./scripts/deploy.sh <version>

# Example
./scripts/deploy.sh v1.0.0
```

Features:
- Automated image building and pushing
- Zero-downtime rolling updates
- Health check verification
- Automatic rollback on failure

### Scaling Script

```bash
# Check current status
./scripts/scale.sh status

# Manual scaling
./scripts/scale.sh manual 3 3 2  # api, web, worker replicas

# View HPA
./scripts/scale.sh list-hpa

# Update HPA limits
./scripts/scale.sh update-hpa api 3 10
```

### Backup Script

```bash
# Full backup (postgres, redis, PVCs)
./scripts/backup.sh full

# Specific backups
./scripts/backup.sh postgres
./scripts/backup.sh redis
./scripts/backup.sh pvc

# Upload to S3
./scripts/backup.sh s3

# Verify backups
./scripts/backup.sh verify
```

### Restore Script

```bash
# List available backups
./scripts/restore.sh list

# Restore PostgreSQL
./scripts/restore.sh postgres backups/postgres_backup_*.sql.gz

# Restore Redis
./scripts/restore.sh redis backups/redis_backup_*.rdb

# Download from S3
./scripts/restore.sh s3 2024/01/01/postgres_backup.sql.gz backups/
```

### Health Check Script

```bash
# Single health check
./scripts/health-check.sh check

# Continuous monitoring
./scripts/health-check.sh monitor
```

## Configuration

### Environment Variables

Create `.env` file in project root:

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Kubernetes
KUBE_NAMESPACE=blockstop
EKS_CLUSTER_NAME=blockstop-cluster

# Docker
REGISTRY=ghcr.io
IMAGE_NAME=blockstop

# Database
DB_NAME=blockstop
DB_USER=blockstop
DB_PASSWORD=secure_password

# Redis
REDIS_PASSWORD=redis_secure

# Backup
BACKUP_DIR=./backups
S3_BACKUP_BUCKET=blockstop-backups

# Health Checks
SLACK_WEBHOOK=https://hooks.slack.com/...
ALERT_EMAIL=admin@blockstop.io
```

### Secrets Management

**Production Recommendation:** Use external secrets management

```bash
# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name blockstop/db-password \
  --secret-string 'secure_password'

# Using HashiCorp Vault
vault kv put secret/blockstop/database password=secure_password
```

Kubernetes will sync these automatically if configured with External Secrets Operator.

## Security Best Practices

1. **Network Security**
   - Network policies restrict pod-to-pod communication
   - Ingress TLS with auto-renewal via cert-manager
   - WAF/DDoS protection at load balancer level

2. **Image Security**
   - Multi-stage builds minimize image size
   - Non-root user execution
   - Signed images recommended

3. **Secrets Management**
   - Never commit secrets to git
   - Use sealed-secrets or external-secrets
   - Rotate credentials regularly

4. **Access Control**
   - RBAC for pod access
   - Service accounts with minimal permissions
   - Regular audit of access logs

5. **Data Protection**
   - Encryption at rest (EBS, S3)
   - Encryption in transit (TLS)
   - Database backups encrypted and tested

## Monitoring & Logging

### Prometheus Metrics

Pods expose metrics on `:9090/metrics`. Configure Prometheus:

```yaml
scrape_configs:
  - job_name: 'blockstop'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - blockstop
```

### Logging

View logs:

```bash
# Recent logs
kubectl logs -n blockstop -l app=blockstop --tail=100

# Stream logs
kubectl logs -f -n blockstop -l app=blockstop

# Specific pod
kubectl logs <pod-name> -n blockstop
```

### Alerts

Configure alerting rules in your monitoring system:

- High CPU/memory usage
- Pod crashes or restarts
- Service unavailability
- Slow response times

## Cost Optimization

1. **Use Spot Instances**: 70% cost savings
   ```hcl
   capacity_type = "spot"
   ```

2. **Right-size Resources**:
   - Monitor actual usage
   - Adjust resource requests/limits

3. **Auto-scaling**:
   - Automatic scaling reduces idle costs
   - Schedule-based scaling during off-hours

4. **Data Transfer**:
   - Use CloudFront/CDN for static assets
   - Batch small requests

## Disaster Recovery

### RTO/RPO Targets

- **RTO**: 1 hour
- **RPO**: 1 hour

### Recovery Procedures

1. **Database Recovery**:
   ```bash
   ./scripts/restore.sh postgres backups/latest.sql.gz
   ```

2. **Full Infrastructure Recovery**:
   ```bash
   cd terraform/aws
   terraform apply
   kubectl apply -f ../../kubernetes/
   ./scripts/restore.sh postgres backups/latest.sql.gz
   ```

3. **Testing DR**:
   - Run restore tests monthly
   - Document procedures
   - Test in non-production first

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n blockstop

# Check logs
kubectl logs <pod-name> -n blockstop

# Check events
kubectl get events -n blockstop --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check endpoints
kubectl get endpoints -n blockstop

# Check service
kubectl describe service blockstop-api -n blockstop

# Test connectivity
kubectl exec -it <pod> -n blockstop -- curl http://blockstop-api:4000/health
```

### Storage Issues

```bash
# Check PVCs
kubectl get pvc -n blockstop

# Check PV details
kubectl describe pvc <pvc-name> -n blockstop

# Check disk space
kubectl exec -it <pod> -n blockstop -- df -h
```

### Performance Issues

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n blockstop

# Check HPA status
kubectl get hpa -n blockstop
kubectl describe hpa blockstop-api-hpa -n blockstop
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [OWASP Container Security](https://owasp.org/www-project-container-security/)

## Support

For infrastructure issues:
1. Check health check script output
2. Review logs and events
3. Consult troubleshooting section
4. Contact DevOps team

---

Last Updated: 2024
Version: 1.0.0
