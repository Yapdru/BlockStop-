variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "blockstop"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

# EKS Configuration
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "blockstop-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_group_desired_size" {
  description = "Desired number of on-demand nodes"
  type        = number
  default     = 3
}

variable "node_group_min_size" {
  description = "Minimum number of on-demand nodes"
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Maximum number of on-demand nodes"
  type        = number
  default     = 10
}

variable "node_instance_types" {
  description = "Instance types for on-demand nodes"
  type        = list(string)
  default     = ["t3.large", "t3a.large"]
}

variable "spot_node_desired_size" {
  description = "Desired number of spot nodes"
  type        = number
  default     = 2
}

variable "spot_node_min_size" {
  description = "Minimum number of spot nodes"
  type        = number
  default     = 1
}

variable "spot_node_max_size" {
  description = "Maximum number of spot nodes"
  type        = number
  default     = 20
}

variable "spot_instance_types" {
  description = "Instance types for spot nodes"
  type        = list(string)
  default     = ["t3.large", "t3a.large", "t2.large"]
}

# RDS Configuration
variable "db_identifier" {
  description = "RDS database identifier"
  type        = string
  default     = "blockstop-postgres"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "blockstop"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "blockstop"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage in GB for autoscaling"
  type        = number
  default     = 500
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.3"
}

variable "db_family" {
  description = "DB parameter group family"
  type        = string
  default     = "postgres15"
}

variable "db_major_version" {
  description = "PostgreSQL major version"
  type        = string
  default     = "15"
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

# ElastiCache Configuration
variable "cache_identifier" {
  description = "ElastiCache cluster identifier"
  type        = string
  default     = "blockstop-redis"
}

variable "redis_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "cache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_parameter_group" {
  description = "Redis parameter group name"
  type        = string
  default     = "default.redis7"
}

# Tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project = "BlockStop"
    Owner   = "DevOps Team"
  }
}
