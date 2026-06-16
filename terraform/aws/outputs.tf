output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "EKS cluster version"
  value       = module.eks.cluster_version
}

output "cluster_platform_version" {
  description = "EKS cluster platform version"
  value       = module.eks.cluster_platform_version
}

output "cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "nat_gateway_ips" {
  description = "NAT Gateway public IPs"
  value       = module.vpc.nat_gateway_ips
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_address" {
  description = "RDS database address"
  value       = module.rds.db_instance_address
  sensitive   = true
}

output "rds_port" {
  description = "RDS database port"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_instance_name
}

output "rds_resource_id" {
  description = "RDS resource ID"
  value       = module.rds.db_resource_id
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = module.elasticache.port
}

output "redis_cluster_id" {
  description = "ElastiCache cluster ID"
  value       = module.elasticache.cluster_id
}

output "s3_uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = module.s3.uploads_bucket_id
}

output "s3_uploads_bucket_arn" {
  description = "S3 uploads bucket ARN"
  value       = module.s3.uploads_bucket_arn
}

output "s3_backups_bucket" {
  description = "S3 backups bucket name"
  value       = module.s3.backups_bucket_id
}

output "s3_logs_bucket" {
  description = "S3 logs bucket name"
  value       = module.s3.logs_bucket_id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.cloudfront.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = module.cloudfront.distribution_arn
}

output "iam_application_role_arn" {
  description = "IAM application role ARN"
  value       = module.iam.application_role_arn
}

output "iam_ci_role_arn" {
  description = "IAM CI/CD role ARN"
  value       = module.iam.ci_role_arn
}

output "kms_logs_key_id" {
  description = "KMS key ID for logs encryption"
  value       = aws_kms_key.logs.id
}

output "kms_logs_key_arn" {
  description = "KMS key ARN for logs encryption"
  value       = aws_kms_key.logs.arn
}

output "configure_kubectl_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "cluster_authentication_base64" {
  description = "Base64 encoded cluster authentication"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

# Kubernetes ConfigMap and connection info
output "kubernetes_config" {
  description = "Kubernetes cluster connection configuration"
  value = {
    cluster_name           = module.eks.cluster_name
    cluster_endpoint       = module.eks.cluster_endpoint
    region                 = var.aws_region
    cluster_ca_certificate = module.eks.cluster_certificate_authority_data
  }
  sensitive = true
}

output "database_connection_string" {
  description = "PostgreSQL connection string for application"
  value       = "postgresql://${var.db_username}:PASSWORD@${module.rds.db_instance_address}:${module.rds.db_instance_port}/${var.db_name}"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string for application"
  value       = "redis://PASSWORD@${module.elasticache.primary_endpoint_address}:${module.elasticache.port}"
  sensitive   = true
}

output "infrastructure_status" {
  description = "Infrastructure deployment status"
  value = {
    eks_ready       = try(module.eks.cluster_status == "ACTIVE", false)
    database_ready  = try(module.rds.db_instance_status == "available", false)
    cache_ready     = try(module.elasticache.cluster_enabled, false)
    vpc_ready       = try(module.vpc.vpc_id != "", false)
  }
}
