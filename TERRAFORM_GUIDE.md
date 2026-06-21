# BlockStop Terraform Guide

Complete guide for Infrastructure as Code management with Terraform.

## Table of Contents

1. [Terraform Basics](#terraform-basics)
2. [Project Structure](#project-structure)
3. [Variables & Outputs](#variables--outputs)
4. [State Management](#state-management)
5. [VPC & Networking](#vpc--networking)
6. [EKS Cluster](#eks-cluster)
7. [RDS Database](#rds-database)
8. [ElastiCache Redis](#elasticache-redis)
9. [S3 & Storage](#s3--storage)
10. [Deployment Workflow](#deployment-workflow)
11. [Maintenance](#maintenance)
12. [Troubleshooting](#troubleshooting)

## Terraform Basics

### Install & Setup

```bash
# Install Terraform
brew install terraform  # macOS
# or from https://www.terraform.io/downloads.html

# Verify installation
terraform version

# Initialize working directory
cd terraform/aws
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive
```

### AWS Configuration

```bash
# Configure AWS CLI
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"

# Verify credentials
aws sts get-caller-identity
```

## Project Structure

```
terraform/
├── aws/
│   ├── main.tf              # Main configuration
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── vpc.tf               # VPC configuration
│   ├── eks.tf               # EKS cluster
│   ├── rds.tf               # RDS database
│   ├── redis.tf             # ElastiCache
│   ├── s3.tf                # S3 buckets
│   ├── modules/             # Reusable modules
│   │   ├── vpc/
│   │   ├── eks/
│   │   ├── rds/
│   │   └── redis/
│   ├── terraform.tfvars     # Variable values (Git ignored)
│   └── terraform.tfvars.example  # Example values

├── gcp/                     # GCP configuration
├── azure/                   # Azure configuration
└── .terraform/              # Terraform cache (Git ignored)
```

## Variables & Outputs

### Input Variables

```bash
# Define in variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# Set in terraform.tfvars
aws_region  = "us-east-1"
environment = "production"

# Or via command line
terraform apply -var="environment=production"

# Or via environment variables
export TF_VAR_environment="production"
```

### Output Values

```bash
# Define in outputs.tf
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

# Get outputs
terraform output

# Get specific output
terraform output eks_cluster_endpoint

# Output as JSON
terraform output -json
```

## State Management

### Remote State

```bash
# Configure S3 backend in main.tf
terraform {
  backend "s3" {
    bucket         = "blockstop-terraform-state"
    key            = "aws/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

# Initialize backend
terraform init

# Show backend configuration
terraform show
```

### State Management

```bash
# List resources in state
terraform state list

# Show resource details
terraform state show module.eks.aws_eks_cluster.cluster

# Pull remote state
terraform state pull > terraform.tfstate.backup

# Push local state
terraform state push terraform.tfstate.backup

# Remove resource from state
terraform state rm module.vpc.aws_vpc.main

# Move resource
terraform state mv module.old_name.resource module.new_name.resource
```

### State Locking

```bash
# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_lock" {
  name           = "terraform-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# Automatic locking on apply
# Manual unlock (if needed)
terraform force-unlock <lock-id>
```

## VPC & Networking

### VPC Configuration

```bash
# View VPC module
terraform state show module.vpc

# Get VPC ID
terraform output vpc_id

# Get subnet IDs
terraform output subnet_ids

# Modify CIDR block (plan first)
terraform plan -var="vpc_cidr=10.1.0.0/16"

# Apply changes
terraform apply -var="vpc_cidr=10.1.0.0/16"
```

### Security Groups

```bash
# View security groups
aws ec2 describe-security-groups \
  --filters Name=tag:Environment,Values=production \
  --query 'SecurityGroups[].GroupId'

# Modify ingress rules
resource "aws_security_group_rule" "allow_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}
```

### NAT Gateway

```bash
# View NAT gateways
aws ec2 describe-nat-gateways \
  --filter Name=tag:Environment,Values=production

# Monitor NAT traffic
aws cloudwatch get-metric-statistics \
  --namespace AWS/NatGateway \
  --metric-name BytesOutToDestination \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## EKS Cluster

### Cluster Configuration

```bash
# Get cluster endpoint
terraform output eks_cluster_endpoint

# Get cluster certificate
terraform output eks_cluster_certificate_authority_data

# Configure kubectl
aws eks update-kubeconfig \
  --name $(terraform output -raw cluster_name) \
  --region $(terraform output -raw aws_region)

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Node Groups

```bash
# View node groups
aws eks list-nodegroups \
  --cluster-name $(terraform output -raw cluster_name)

# Scale node group
terraform apply -var="node_group_desired_size=5"

# View node resources
kubectl top nodes

# Drain and replace node
kubectl drain <node-name> --ignore-daemonsets
# Update ASG, wait for replacement
kubectl uncordon <new-node-name>
```

### Add-ons

```bash
# View installed add-ons
aws eks describe-addon \
  --cluster-name blockstop-production \
  --addon-name vpc-cni

# Update add-on
terraform apply

# Verify
kubectl get daemonset -n kube-system
```

## RDS Database

### Database Configuration

```bash
# Get database endpoint
terraform output rds_endpoint

# Get database name
terraform output rds_database_name

# Get database username
terraform output rds_username

# Build connection string
DATABASE_URL="postgresql://$(terraform output -raw rds_username):$(aws secretsmanager get-secret-value --secret-id blockstop/db-password --query SecretString --output text)@$(terraform output -raw rds_endpoint)/$(terraform output -raw rds_database_name)"
```

### Backup Configuration

```bash
# View backup retention
aws rds describe-db-instances \
  --db-instance-identifier blockstop-prod \
  --query 'DBInstances[0].BackupRetentionPeriod'

# Modify backup retention
terraform apply -var="backup_retention_days=30"

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier blockstop-prod \
  --db-snapshot-identifier blockstop-prod-snapshot-$(date +%s)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier blockstop-prod
```

### Read Replicas

```bash
# Create read replica
resource "aws_db_instance" "read_replica" {
  identifier          = "blockstop-prod-replica-1"
  replicate_source_db = aws_db_instance.primary.identifier
  instance_class      = "db.t3.medium"
  skip_final_snapshot = true
}

# Promote replica to primary
aws rds promote-read-replica \
  --db-instance-identifier blockstop-prod-replica-1
```

### Parameter Groups

```bash
# View parameter group
aws rds describe-db-parameters \
  --db-instance-identifier blockstop-prod

# Update parameters
terraform apply -var="db_parameters={shared_buffers=262144,max_connections=200}"
```

## ElastiCache Redis

### Redis Configuration

```bash
# Get cluster endpoint
terraform output redis_endpoint

# Get cluster port
terraform output redis_port

# Connection string
REDIS_URL="redis://$(terraform output -raw redis_endpoint):$(terraform output -raw redis_port)"
```

### Cluster Management

```bash
# View cluster details
aws elasticache describe-cache-clusters \
  --cache-cluster-id blockstop-redis-prod \
  --show-cache-node-info

# Scale up (replace nodes)
terraform apply -var="redis_node_type=cache.r6g.xlarge"

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=CacheClusterId,Value=blockstop-redis-prod \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

### Automatic Failover

```bash
# Enable automatic failover
terraform apply -var="redis_automatic_failover_enabled=true"

# Monitor failover events
aws elasticache describe-events \
  --source-identifier blockstop-redis-prod
```

## S3 & Storage

### S3 Bucket Management

```bash
# View bucket configuration
terraform state show aws_s3_bucket.backups

# Get bucket names
terraform output s3_backup_bucket_name

# List bucket contents
aws s3 ls s3://blockstop-backups/ --recursive

# Enable versioning
terraform apply

# Enable encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

### Backup Storage

```bash
# Check backup bucket size
aws s3api list-objects-v2 \
  --bucket blockstop-backups \
  --prefix database-backups \
  --query 'Contents[].Size' \
  --output text | awk '{sum+=$1} END {print sum/1024/1024 " MB"}'

# Enable lifecycle rules
resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}
```

## Deployment Workflow

### Planning

```bash
# Create plan
terraform plan -out=tfplan

# View plan summary
terraform plan -out=tfplan -var-file=production.tfvars | head -50

# Save detailed plan
terraform plan -out=tfplan -json > plan.json

# Review changes
cat tfplan | grep -E "^  [+-]|^    [+-]"
```

### Applying

```bash
# Apply plan
terraform apply tfplan

# Watch progress
watch 'aws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name]"'

# Verify deployment
kubectl cluster-info
aws rds describe-db-instances --db-instance-identifier blockstop-prod
```

### Validation

```bash
# Test connectivity
kubectl get nodes
kubectl get pods -A

# Health check
curl https://blockstop.com/api/health

# Database connection
kubectl exec -it <pod> -- psql $DATABASE_URL -c "SELECT 1"

# Cache connection
kubectl exec -it <pod> -- redis-cli -u $REDIS_URL ping
```

## Maintenance

### Regular Updates

```bash
# Check Terraform version
terraform version

# Upgrade Terraform
brew upgrade terraform

# Update provider versions
terraform init -upgrade

# Test with new versions
terraform plan -var-file=staging.tfvars
```

### Upgrades

```bash
# Kubernetes version upgrade
terraform apply -var="kubernetes_version=1.29"

# Monitor upgrade
aws eks describe-nodegroup \
  --cluster-name blockstop-production \
  --nodegroup-name general-nodes

# Database version upgrade
terraform apply -var="db_engine_version=15.3"

# During maintenance window (no downtime for RDS)
```

### Cost Optimization

```bash
# Estimate costs
terraform plan -var-file=production.tfvars | grep -E "aws_"

# Right-size instances
terraform apply -var="node_instance_types=[\"t3.medium\"]"

# Use spot instances for non-critical workloads
terraform apply -var="spot_instance_types=[\"t3.large\"]"
```

## Troubleshooting

### Common Issues

```bash
# Lock exists
# Solution:
terraform force-unlock <lock-id>

# State mismatch
# Solution:
terraform refresh

# Resource already exists
# Solution:
terraform import <resource-type>.<name> <resource-id>

# Invalid region
# Solution:
export AWS_REGION=us-east-1
terraform init -reconfigure
```

### Debugging

```bash
# Enable debug logging
export TF_LOG=DEBUG
terraform plan > debug.log 2>&1

# Show detailed errors
terraform apply -var-file=production.tfvars

# Validate configuration
terraform validate
terraform fmt -check

# Compare states
terraform state pull > current.tfstate
aws s3 cp s3://blockstop-terraform-state/aws/terraform.tfstate previous.tfstate
diff -u previous.tfstate current.tfstate
```

### Rollback

```bash
# Destroy specific resources
terraform destroy -target=aws_rds_cluster_instance.primary

# Rollback entire environment
terraform destroy -var-file=staging.tfvars

# Restore from backup
terraform state pull > current-backup.json
# Modify and reapply
terraform state push current-backup.json
```

---

## Next Steps

1. Initialize Terraform: `terraform init`
2. Review variables: `cat terraform.tfvars`
3. Plan deployment: `terraform plan`
4. Apply infrastructure: `terraform apply`
5. Verify: `kubectl cluster-info`
6. Deploy applications: `kubectl apply -f kubernetes/`
