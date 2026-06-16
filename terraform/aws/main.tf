terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  backend "s3" {
    bucket         = "blockstop-terraform-state"
    key            = "aws/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "BlockStop"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  project     = var.project_name

  cidr_block           = var.vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = var.environment == "production" ? false : true

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Component = "Networking"
  }
}

# EKS Module
module "eks" {
  source = "./modules/eks"

  cluster_name            = var.cluster_name
  cluster_version         = var.kubernetes_version
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  control_plane_subnet_ids = module.vpc.private_subnet_ids

  enable_cluster_autoscaling = true
  enable_cluster_logging     = true
  log_retention_days         = 30

  node_groups = {
    general = {
      desired_size       = var.node_group_desired_size
      min_size          = var.node_group_min_size
      max_size          = var.node_group_max_size
      instance_types    = var.node_instance_types
      disk_size         = 50
      capacity_type     = "on-demand"
    }
    spot = {
      desired_size      = var.spot_node_desired_size
      min_size          = var.spot_node_min_size
      max_size          = var.spot_node_max_size
      instance_types    = var.spot_instance_types
      disk_size         = 50
      capacity_type     = "spot"
    }
  }

  tags = {
    Component = "Container Orchestration"
  }
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment         = var.environment
  project_name        = var.project_name
  db_identifier       = var.db_identifier
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = random_password.db_password.result
  db_instance_class   = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  engine               = "postgres"
  engine_version       = var.db_engine_version
  family               = var.db_family
  major_engine_version = var.db_major_version

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  security_group_ids  = [aws_security_group.rds_sg.id]

  enable_backup       = true
  backup_retention    = var.backup_retention_days
  backup_window       = "03:00-04:00"
  maintenance_window  = "mon:04:00-mon:05:00"

  enable_multi_az     = var.environment == "production"
  enable_iam_auth     = true
  storage_encrypted   = true
  deletion_protection = var.environment == "production"

  enable_monitoring   = true
  monitoring_interval = 60

  parameters = {
    "max_connections" = "200"
    "shared_buffers"  = "{DBInstanceClassMemory/32768}"
    "log_min_duration_statement" = "1000"
  }

  tags = {
    Component = "Database"
  }
}

# ElastiCache Redis Module
module "elasticache" {
  source = "./modules/elasticache"

  environment         = var.environment
  project_name        = var.project_name
  cache_identifier    = var.cache_identifier

  engine               = "redis"
  engine_version       = var.redis_version
  node_type           = var.cache_node_type
  num_cache_nodes     = var.environment == "production" ? 3 : 1
  parameter_group_name = var.redis_parameter_group

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  security_group_ids  = [aws_security_group.redis_sg.id]

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled           = var.environment == "production"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_password.result

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "mon:04:00-mon:06:00"

  enable_automatic_backups = true
  enable_monitoring        = true
  log_delivery_configuration = {
    slow_log = {
      cloudwatch_logs_enabled = true
      log_group_name          = aws_cloudwatch_log_group.redis_logs.name
    }
  }

  tags = {
    Component = "Cache"
  }
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment  = var.environment
  project_name = var.project_name

  buckets = {
    uploads = {
      name          = "blockstop-uploads-${var.aws_region}-${var.environment}"
      force_destroy = false
    }
    backups = {
      name          = "blockstop-backups-${var.aws_region}-${var.environment}"
      force_destroy = false
    }
    logs = {
      name          = "blockstop-logs-${var.aws_region}-${var.environment}"
      force_destroy = false
    }
  }

  enable_versioning         = true
  enable_server_side_encryption = true
  enable_logging           = true
  enable_lifecycle_rules   = true

  lifecycle_rules = {
    transition_to_ia_days      = 30
    transition_to_glacier_days = 90
    expiration_days            = 365
  }

  block_public_access = true
  enable_mfa_delete   = var.environment == "production"

  tags = {
    Component = "Storage"
  }
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  environment  = var.environment
  project_name = var.project_name

  origin_domain = module.s3.uploads_bucket_regional_domain
  default_root_object = "index.html"

  enable_compression = true
  viewer_protocol_policy = "redirect-to-https"

  allowed_methods = ["GET", "HEAD", "OPTIONS"]
  cached_methods  = ["GET", "HEAD"]

  min_ttl     = 0
  default_ttl = 86400
  max_ttl     = 31536000

  enable_logging = true
  log_bucket    = module.s3.logs_bucket_id

  tags = {
    Component = "Content Delivery"
  }
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment

  create_application_role = true
  create_ci_role         = true

  application_role_policies = [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "rds-db:connect",
    "elasticache:DescribeCacheClusters",
    "cloudwatch:PutMetricData"
  ]

  tags = {
    Component = "Identity & Access"
  }
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Component = "Logging"
  }
}

resource "aws_cloudwatch_log_group" "redis_logs" {
  name              = "/aws/elasticache/redis/${var.cache_identifier}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = {
    Component = "Logging"
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Component = "Encryption"
  }
}

resource "aws_kms_alias" "logs" {
  name          = "alias/blockstop-logs"
  target_key_id = aws_kms_key.logs.key_id
}

# Security Groups
resource "aws_security_group" "rds_sg" {
  name        = "blockstop-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Component = "Database Security"
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "blockstop-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Component = "Cache Security"
  }
}

# Random Passwords
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_password" {
  length  = 32
  special = true
}

# Outputs
output "eks_cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}

output "eks_cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS cluster endpoint"
}

output "rds_endpoint" {
  value       = module.rds.db_instance_endpoint
  description = "RDS endpoint"
  sensitive   = true
}

output "redis_endpoint" {
  value       = module.elasticache.primary_endpoint_address
  description = "ElastiCache Redis endpoint"
  sensitive   = true
}

output "s3_upload_bucket" {
  value       = module.s3.uploads_bucket_id
  description = "S3 uploads bucket"
}

output "cloudfront_domain" {
  value       = module.cloudfront.domain_name
  description = "CloudFront distribution domain"
}
