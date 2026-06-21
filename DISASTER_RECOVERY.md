# BlockStop Disaster Recovery Plan

Comprehensive disaster recovery procedures for BlockStop production systems.

## Table of Contents

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Recovery Procedures](#recovery-procedures)
4. [Failover Procedures](#failover-procedures)
5. [Incident Response](#incident-response)
6. [Testing & Drills](#testing--drills)
7. [RTO & RPO Targets](#rto--rpo-targets)
8. [Escalation Matrix](#escalation-matrix)

## Overview

### Disaster Scenarios

1. **Database Corruption** - Data integrity issues
2. **Data Center Failure** - Complete region outage
3. **Application Failure** - Code bugs, memory leaks
4. **Security Breach** - Compromised credentials
5. **Storage Failure** - S3 or EBS issues
6. **Network Failure** - VPC/connectivity issues

### Recovery Strategy

- **Backup First**: Daily database backups retained 30 days
- **Redundancy**: Multi-AZ deployments, read replicas
- **Monitoring**: Real-time alerts on degradation
- **Documentation**: Detailed runbooks for each scenario
- **Testing**: Monthly DR drills

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
# - RDS automated backups: 30-day retention
# - Transaction logs: 30-day retention
# - Manual snapshots: As-needed

# Verify backup status
aws rds describe-db-instances \
  --db-instance-identifier blockstop-prod \
  --query 'DBInstances[0].[DBInstanceStatus,LatestRestorableTime]'

# List recent snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier blockstop-prod \
  --query 'DBSnapshots[-5:].{Id:DBSnapshotIdentifier,Time:SnapshotCreateTime}'
```

### S3 Backups

```bash
# Versioning enabled on all buckets
aws s3api get-bucket-versioning --bucket blockstop-backups

# Lifecycle policies
aws s3api get-bucket-lifecycle-configuration --bucket blockstop-backups

# Cross-region replication
aws s3api get-bucket-replication --bucket blockstop-backups
```

### Kubernetes Resources

```bash
# Backup etcd cluster
ETCDCTL_API=3 etcdctl --endpoints=<etcd-endpoint> \
  snapshot save /backups/etcd-$(date +%s).db

# Export resources
kubectl get all -n blockstop -o yaml > blockstop-resources-$(date +%Y-%m-%d).yaml

# Store in S3
aws s3 cp blockstop-resources-*.yaml s3://blockstop-backups/k8s-manifests/
```

### Application Data

```bash
# Application logs
aws s3 sync /var/log/blockstop s3://blockstop-backups/application-logs/

# Configuration files
aws s3 sync /etc/blockstop s3://blockstop-backups/config/

# User uploads
aws s3 sync s3://blockstop-uploads s3://blockstop-backups/uploads-backup/
```

## Recovery Procedures

### Full Database Recovery

**RTO**: 15 minutes | **RPO**: 1 hour

#### Step 1: Assess Damage

```bash
# Check database status
aws rds describe-db-instances \
  --db-instance-identifier blockstop-prod \
  --query 'DBInstances[0].[DBInstanceStatus,DBInstanceIdentifier]'

# View error logs
aws rds describe-events \
  --source-identifier blockstop-prod \
  --source-type db-instance \
  --max-items 20

# Estimate data loss
# Latest backup timestamp: $(aws rds describe-db-snapshots ... | jq .[0].SnapshotCreateTime)
```

#### Step 2: Restore Database

```bash
# Create recovery database from latest snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier blockstop-prod-recovery-$(date +%s) \
  --db-snapshot-identifier <latest-snapshot-id> \
  --db-instance-class db.t3.medium

# Wait for recovery
aws rds wait db-instance-available \
  --db-instance-identifier blockstop-prod-recovery-<timestamp>

# Verify recovered database
psql -h <recovery-endpoint> -U blockstop_user -d blockstop -c "SELECT COUNT(*) FROM users;"
```

#### Step 3: Run Recovery Tests

```bash
# Connect to recovery database
export DATABASE_URL="postgresql://user:pass@<recovery-endpoint>/blockstop"

# Run database integrity checks
npm run test:db-integrity

# Check for data anomalies
npm run check:data-consistency

# Verify application functionality
npm run test:critical-paths
```

#### Step 4: Promote Recovery Database

```bash
# Stop applications
kubectl scale deployment blockstop-web --replicas=0 -n blockstop
kubectl scale deployment blockstop-api --replicas=0 -n blockstop
kubectl scale deployment blockstop-worker --replicas=0 -n blockstop

# Update connection string
kubectl set env deployment/blockstop-web \
  DATABASE_URL="postgresql://user:pass@<recovery-endpoint>/blockstop" \
  -n blockstop

# Restart applications
kubectl scale deployment blockstop-web --replicas=3 -n blockstop
kubectl scale deployment blockstop-api --replicas=3 -n blockstop
kubectl scale deployment blockstop-worker --replicas=3 -n blockstop

# Verify
curl https://blockstop.com/api/health
```

#### Step 5: Cleanup

```bash
# Once recovery is verified
# Delete old database
aws rds delete-db-instance \
  --db-instance-identifier blockstop-prod-old \
  --skip-final-snapshot

# Rename recovery database to primary
# OR manually update connection strings
```

### Point-in-Time Recovery (PITR)

**RTO**: 30 minutes | **RPO**: 5 minutes

```bash
# Find corruption timestamp
TARGET_TIME="2024-01-15T10:30:00Z"

# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier blockstop-prod \
  --target-db-instance-identifier blockstop-prod-pitr-$(date +%s) \
  --restore-time "$TARGET_TIME" \
  --use-latest-restorable-time=false

# Wait for restoration
aws rds wait db-instance-available \
  --db-instance-identifier blockstop-prod-pitr-<timestamp>

# Verify data at that point in time
psql -h <pitr-endpoint> -U blockstop_user -d blockstop -c "SELECT * FROM audit_log WHERE timestamp > '2024-01-15 10:20:00';"

# If successful, promote
npm run restore promote blockstop_prod_pitr blockstop
```

### Application Rollback

**RTO**: 5 minutes | **RPO**: 0 (current deployment)

```bash
# View rollout history
kubectl rollout history deployment/blockstop-web -n blockstop

# Rollback to previous version
kubectl rollout undo deployment/blockstop-web -n blockstop
kubectl rollout undo deployment/blockstop-api -n blockstop
kubectl rollout undo deployment/blockstop-worker -n blockstop

# Monitor rollback
kubectl rollout status deployment/blockstop-web -n blockstop

# Verify application
curl https://blockstop.com/api/health

# View revisions
kubectl rollout history deployment/blockstop-web -n blockstop --revision=3
```

### Kubernetes Cluster Recovery

**RTO**: 1 hour | **RPO**: 10 minutes

```bash
# If EKS cluster is healthy but nodes degraded:
# 1. Drain unhealthy nodes
kubectl drain <node-name> --ignore-daemonsets

# 2. Terminate bad ASG instances
aws autoscaling terminate-instance-in-auto-scaling-group \
  --instance-id <instance-id> \
  --should-decrement-desired-capacity

# 3. ASG will automatically replace nodes

# If entire cluster is gone:
# 1. Terraform recreate
cd terraform/aws
terraform destroy -auto-approve
terraform apply -auto-approve

# 2. Wait for cluster
aws eks wait cluster-active --name blockstop-production

# 3. Deploy applications
kubectl apply -f kubernetes/
```

## Failover Procedures

### Database Failover (RDS Multi-AZ)

**Automatic**: ~2 minutes
**Manual trigger**:

```bash
# Manual failover to standby
aws rds reboot-db-instance \
  --db-instance-identifier blockstop-prod \
  --force-failover

# Monitor failover
watch -n 5 'aws rds describe-db-instances \
  --db-instance-identifier blockstop-prod \
  --query "DBInstances[0].DBInstanceStatus"'

# Verify connection
psql -h blockstop-prod.cxxxxx.us-east-1.rds.amazonaws.com -U blockstop_user -d blockstop -c "SELECT 1;"
```

### Redis Failover (Automatic)

```bash
# If automatic failover fails
# 1. Identify unhealthy node
aws elasticache describe-cache-clusters \
  --cache-cluster-id blockstop-redis-prod \
  --show-cache-node-info

# 2. Reboot cluster
aws elasticache reboot-cache-cluster \
  --cache-cluster-id blockstop-redis-prod

# 3. Monitor restart
watch -n 5 'aws elasticache describe-cache-clusters \
  --cache-cluster-id blockstop-redis-prod \
  --query "CacheClusters[0].CacheClusterStatus"'
```

### Application Service Failover

```bash
# Check current replicas
kubectl get deployment -n blockstop

# If multiple replicas unhealthy:
# 1. Check pod status
kubectl describe pod <unhealthy-pod> -n blockstop

# 2. Delete unhealthy pods
kubectl delete pod <pod-name> -n blockstop

# 3. Deployment controller creates new pods
kubectl get pods -n blockstop -w

# 4. Verify service health
kubectl get svc blockstop-api -n blockstop -o wide
```

## Incident Response

### Escalation Checklist

**Level 1**: Single pod/service degraded
- Check pod logs
- Restart pod
- Monitor recovery

**Level 2**: Multiple services affected
- Page on-call engineer
- Create incident ticket
- Check infrastructure

**Level 3**: Complete outage
- Page engineering team lead
- Create SEV-1 incident
- Initiate DR procedures
- Notify stakeholders

### Incident Communication

```bash
# Automated notification
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🔴 SEV-1: Production Database Down",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Production Incident*\nDatabase unavailable\nStarted: 2024-01-15 10:30 UTC\nEscalation: In Progress"
        }
      }
    ]
  }'

# Update status page
curl -X POST https://status.blockstop.com/api/incidents \
  -H "Authorization: Bearer $STATUS_PAGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Database Outage",
    "status": "investigating",
    "components": ["database", "api"]
  }'
```

### Post-Incident

```bash
# 1. Capture data for analysis
kubectl logs -n blockstop -l app=blockstop > incident-logs.txt
aws rds describe-events --source-identifier blockstop-prod > db-events.json

# 2. Document timeline
# - Incident start time
# - Detection time
# - Response actions
# - Recovery time
# - Root cause

# 3. Schedule post-mortem
# - Within 24 hours
# - Include: Engineering, SRE, Product
# - Blameless culture

# 4. Track action items
# - Preventive measures
# - Alerting improvements
# - Documentation updates
```

## Testing & Drills

### Monthly DR Drill

```bash
# Preparation
# - Schedule during low-traffic window (2-4 AM UTC)
# - Notify team 48 hours in advance
# - Use staging environment if possible

# Execution
# 1. Point-in-time recovery
npm run restore pit 2024-01-15T10:00:00Z

# 2. Restore database
export DATABASE_URL="postgresql://user:pass@blockstop-dr.rds.amazonaws.com/blockstop"

# 3. Run integration tests
npm run test:integration

# 4. Load test
npm run test:load

# 5. Smoke tests
npm run test:smoke

# Documentation
# - Document actual RTO/RPO
# - Compare with targets
# - Identify gaps
```

### Quarterly Full Failover Test

```bash
# 1. In staging environment:
terraform workspace new dr-test

# 2. Create complete copy of production
terraform apply -var-file=dr-test.tfvars

# 3. Restore latest production backup
npm run restore restore <latest-backup-id>

# 4. Run full test suite
npm run test

# 5. Load test
npm run test:load

# 6. Cleanup
terraform workspace delete dr-test
```

## RTO & RPO Targets

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Pod failure | 1 min | 0 | K8s auto-restart |
| Node failure | 5 min | 0 | ASG replacement |
| Database failure | 15 min | 1 hr | RDS backup restore |
| Region outage | 4 hours | 1 hr | Manual failover |
| Complete outage | 8 hours | 1 day | Full rebuild |

## Escalation Matrix

| Severity | Response | Owner | Escalation |
|----------|----------|-------|------------|
| SEV-4 | 4 hours | On-call Engineer | Team Lead |
| SEV-3 | 1 hour | On-call Engineer | Engineering Manager |
| SEV-2 | 30 min | Engineering Lead | VP Engineering |
| SEV-1 | 10 min | CTO + Engineering Lead | CEO |

---

## Runbook References

- [Database Recovery](DEPLOYMENT_GUIDE.md#database-operations)
- [Kubernetes Recovery](KUBERNETES_GUIDE.md#troubleshooting)
- [Infrastructure Recovery](TERRAFORM_GUIDE.md#troubleshooting)

## Contact & Escalation

- **On-Call**: See Pagerduty
- **Engineering Lead**: team-lead@blockstop.com
- **CTO**: cto@blockstop.com
- **Status Page**: https://status.blockstop.com
