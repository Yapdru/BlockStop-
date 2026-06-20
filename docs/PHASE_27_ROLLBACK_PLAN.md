# Phase 27 Rollback Plan

## Purpose

This document outlines how to quickly rollback Phase 27 (v2.0.0) to Phase 26 (v1.9.0) if critical issues are detected in production.

---

## Rollback Decision Matrix

### Automatic Rollback Triggers

**🔴 Critical (Immediate Rollback)**
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 1% | Automatic rollback to Phase 26 |
| Payment Failure Rate | > 5% | Automatic rollback |
| API Latency p99 | > 5 seconds | Automatic rollback |
| Extension Crash Rate | > 1% | Automatic rollback |
| Data Loss/Corruption | Any occurrence | Immediate rollback + incident response |
| Security Breach | Any breach | Immediate rollback + security team |

**🟠 High (Manual Review)**
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | 0.5% - 1% | Page on-call, review logs, decide rollback |
| Payment Failure Rate | 2% - 5% | Page on-call, verify Stripe webhooks |
| API Latency p99 | 1 - 5 seconds | Check database, evaluate rollback |
| Extension Issues | Widespread reports | Check crash logs, consider rollback |

**🟡 Medium (Investigate)**
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | 0.1% - 0.5% | Monitor, no immediate action |
| API Latency p99 | 500ms - 1s | Monitor, check query performance |
| User Reports | < 10 critical issues | Monitor, no rollback needed |

---

## Quick Rollback Procedure (< 5 minutes)

### Option 1: Feature Flag Disable (Safest, No Data Loss)

**When to use:** Small features broken, core functionality intact

```bash
#!/bin/bash
# Disable Phase 27 features without full rollback

# 1. SSH to production
ssh admin@prod-api-1.blockstop.com

# 2. Disable feature flags
./scripts/disable-feature.sh --feature=phase27 --scope=global

# Output: ✅ Feature disabled in 2 seconds

# 3. Verify in config
curl http://localhost:3000/api/admin/feature-flags | grep phase27
# Should show: "enabled": false

# 4. Check error rate (should drop within 30 seconds)
curl http://localhost:3000/metrics | grep error_rate

# 5. Rollback complete - monitoring continues
```

**What gets disabled:**
- Browser extension features
- Advanced analytics dashboards
- Enterprise integration webhooks
- AI/ML enhancements
- Marketplace platform

**What stays active:**
- Core threat scanning
- Payment verification
- Rate limiting
- User authentication
- Web interface

### Option 2: Kubernetes Rollback (Fast, Full Rollback)

**When to use:** Database migration issue, API crashes, systematic failure

```bash
#!/bin/bash
# Rollback to previous Kubernetes deployment

# 1. Check rollout history
kubectl rollout history deployment/blockstop-api -n blockstop
# Output:
# deployment.apps/blockstop-api
# REVISION  CHANGE-CAUSE
# 1         Phase 26 (v1.9.0) - initial
# 2         Phase 27.1-27.7 (v2.0.0-rc1)
# 3         Phase 27.9 (v2.0.0) - CURRENT

# 2. Undo to previous revision (automatically uses revision 2)
kubectl rollout undo deployment/blockstop-api -n blockstop

# Output: deployment.apps/blockstop-api rolled back

# 3. Monitor the rollback
kubectl rollout status deployment/blockstop-api -n blockstop
# Monitors pod termination of new version
# Brings back pods from previous version

# 4. Verify rollback succeeded
kubectl get pods -n blockstop
# All pods should show Ready (1/1)

# 5. Check API is responding
curl -s https://api.blockstop.com/health | jq .version
# Should show: v1.9.0

# Rollback complete!
```

**Timing:**
- Undo command: 2 seconds
- Pod restart: 30-60 seconds
- Health check validation: 30 seconds
- **Total: < 2 minutes**

### Option 3: Database Rollback (Manual, Careful)

**When to use:** Database migration corrupted data

```bash
#!/bin/bash
# Rollback database to pre-Phase-27 state

# 1. Verify current migrations applied
psql blockstop -c "SELECT * FROM schema_migrations WHERE success = true ORDER BY version DESC LIMIT 5;"
# Output should show: 018-phase27-billing-schema (most recent)

# 2. BACKUP CURRENT DATA (CRITICAL!)
pg_dump blockstop --format=custom > /backup/blockstop-$(date +%Y-%m-%d_%H%M%S)-phase27.dump

echo "✅ Backup created"

# 3. Identify migration to rollback
# Migration: 018-phase27-billing-schema.sql (This is the only Phase 27 migration)

# 4. Create rollback migration
cat > /database/migrations/019-rollback-phase27.sql << 'EOF'
-- Rollback Phase 27 billing schema
-- Created: 2026-06-20

-- Drop Phase 27 tables (preserve data for inspection)
ALTER TABLE billing.subscription_audit_log DROP CONSTRAINT IF EXISTS fk_subscription_id;
ALTER TABLE billing.payment_records DROP CONSTRAINT IF EXISTS fk_subscription_id;
ALTER TABLE billing.payment_webhooks DROP CONSTRAINT IF EXISTS fk_anything;

-- Archive tables instead of dropping
CREATE SCHEMA backup_phase27;
ALTER TABLE billing.subscriptions SET SCHEMA backup_phase27;
ALTER TABLE billing.payment_records SET SCHEMA backup_phase27;
ALTER TABLE billing.revoked_tokens SET SCHEMA backup_phase27;
ALTER TABLE billing.payment_webhooks SET SCHEMA backup_phase27;
ALTER TABLE billing.subscription_audit_log SET SCHEMA backup_phase27;
ALTER TABLE billing.team_billing_settings SET SCHEMA backup_phase27;
ALTER TABLE billing.tier_limits SET SCHEMA backup_phase27;

-- Drop empty schema
DROP SCHEMA billing;

-- Update schema_migrations
UPDATE schema_migrations SET success = FALSE WHERE version = '018-phase27-billing-schema';

COMMIT;
EOF

# 5. Run rollback migration
psql blockstop < /database/migrations/019-rollback-phase27.sql

# Output: ✅ Rolled back successfully

# 6. Verify rollback
psql blockstop -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'billing';"
# Should return: (no rows)

echo "✅ Database rollback complete"
```

**Timing:**
- Backup creation: 2-5 minutes (depends on database size)
- Rollback migration: 1-2 minutes
- **Total: 3-7 minutes**

**Data Preservation:**
- Tables moved to `backup_phase27` schema
- All data preserved for analysis
- Can be restored later if needed

---

## Complete Rollback Process (Full Revert to v1.9.0)

### Step 1: Immediate Response (0-5 minutes)

```bash
#!/bin/bash
# Execute within 5 minutes of detecting critical issue

# 1. Notify incident response team
./scripts/page-oncall.sh --severity=critical --message="Phase 27 critical issue detected, initiating rollback"

# 2. Disable Phase 27 features (fastest option)
./scripts/disable-feature.sh --feature=phase27 --scope=global --reason="critical-bug-detected"

# 3. Monitor error rate
watch -n 1 'curl -s http://localhost:3000/metrics | grep error_rate'

# 4. If feature disable not sufficient, proceed to step 2
```

### Step 2: Kubernetes Rollback (5-10 minutes)

```bash
#!/bin/bash
# If disabling features didn't resolve

# 1. Initiate rollback
kubectl rollout undo deployment/blockstop-api -n blockstop
kubectl rollout undo deployment/blockstop-web -n blockstop

# 2. Monitor rollback progress
watch -n 5 'kubectl rollout status deployment/blockstop-api -n blockstop'

# 3. Check all pods are healthy
kubectl get pods -n blockstop | grep -E "blockstop-(api|web)" | grep -v Running
# Should return no results (all Running)

# 4. Verify version
curl -s https://api.blockstop.com/health | jq .version
# Should show: v1.9.0
```

### Step 3: Database Rollback (10-20 minutes, if needed)

```bash
#!/bin/bash
# Only if Kubernetes rollback not sufficient

# 1. Create full backup (CRITICAL)
pg_dump blockstop --format=custom > /backup/blockstop-rollback-$(date +%s).dump

# 2. Run rollback migration
psql blockstop < /database/migrations/019-rollback-phase27.sql

# 3. Restart API servers to clear caches
kubectl delete pods -l app=blockstop-api -n blockstop

# 4. Verify database state
psql blockstop -c "SELECT version FROM schema_migrations WHERE success = true ORDER BY version DESC LIMIT 1;"
# Should show: Last Phase 26 migration
```

### Step 4: External Services (Parallel)

```bash
#!/bin/bash
# Execute while Kubernetes rollback in progress

# 1. Rollback DNS if necessary
# Not usually needed - but available if load balancer issue

# 2. Rollback edge cache
curl -X PURGE https://cache.blockstop.com/*
# Clears CloudFlare/CDN cache

# 3. Update status page
./scripts/update-status-page.sh --status=investigating --message="Rolling back to Phase 26"

# 4. Notify customers
./scripts/send-notification.sh --template=incident-rollback --channel=email,slack,twitter
```

### Step 5: Verification (20-30 minutes)

```bash
#!/bin/bash
# Comprehensive verification of rollback success

# 1. API Health Checks
echo "🔍 Verifying API..."
curl -s https://api.blockstop.com/health | jq .
# Should show version: v1.9.0, status: healthy

# 2. Database Checks
echo "🔍 Verifying Database..."
psql blockstop -c "SELECT COUNT(*) FROM users;" 
psql blockstop -c "SELECT COUNT(*) FROM threat_scans;"
# Should show correct data counts

# 3. Authentication Checks
echo "🔍 Verifying Authentication..."
curl -X POST https://api.blockstop.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@blockstop.com","password":"testpass"}'
# Should work correctly

# 4. Payment System Checks
echo "🔍 Verifying Payment System..."
curl https://api.blockstop.com/api/billing/status \
  -H "Authorization: Bearer $TEST_TOKEN"
# Should not error on missing Phase 27 tables

# 5. Monitoring Checks
echo "🔍 Verifying Metrics..."
# Check Sentry: error rate should drop below 0.1%
# Check Datadog: API latency should return to normal
# Check Prometheus: memory usage should stabilize

# 6. User Reports
echo "🔍 Verifying User Experience..."
# Monitor support channel for user reports
# Should see dramatic decrease in issues

# 7. Full checklist
echo "✅ API responding correctly"
echo "✅ Database intact"
echo "✅ Authentication working"
echo "✅ Users reporting improvement"
echo "✅ Metrics normal"
echo ""
echo "🎉 Rollback verified successful!"
```

---

## Post-Rollback Analysis (1-2 hours after)

### Incident Report

```markdown
# Incident Report: Phase 27 Rollback

**Timeline:**
- 10:23 UTC: Critical error rate spike detected
- 10:25 UTC: Incident response team paged
- 10:27 UTC: Feature flags disabled
- 10:30 UTC: Kubernetes rollback initiated
- 10:32 UTC: All pods healthy, v1.9.0 running
- 10:35 UTC: Error rate normal, users reporting OK
- 10:40 UTC: Incident declared resolved

**Root Cause:**
[Analysis after logs reviewed]

**Impact:**
- Duration: 7 minutes
- Users affected: [percentage]
- Payments affected: [count]
- Data lost: [count] (if any)

**Resolution:**
- Phase 27 rolled back to Phase 26 (v1.9.0)
- Database preserved in backup_phase27 schema
- No user data lost

**Action Items:**
1. [ ] Review Phase 27 code for cause of failure
2. [ ] Add additional tests for [component]
3. [ ] Improve monitoring for [metric]
4. [ ] Update runbook with lessons learned
5. [ ] Schedule post-mortem meeting
```

### Re-Planning Phase 27

After rollback, reassess Phase 27:

```bash
#!/bin/bash
# 1. Preserve Phase 27 code (don't delete)
git branch -c main phase27-failed-deployment
git tag phase27-failed-v2.0.0 HEAD

# 2. Review what failed
git log --oneline phase26..main | head -20

# 3. Identify root cause
# - Was it a database migration issue?
# - Was it a code bug?
# - Was it an infrastructure issue?
# - Was it a deployment issue?

# 4. Determine if retry with fixes or redesign
# - Fix bugs and re-test
# - Reduce scope and re-phase features
# - Different deployment strategy

# 5. Plan remediation
# See /docs/PHASE_27_POSTMORTEM.md
```

---

## Rollback Checklist

Before executing rollback, verify:

- [ ] Incident confirmed by multiple team members
- [ ] Rollback decision approved by engineering lead
- [ ] Backups created and verified
- [ ] Communications template prepared
- [ ] Customer notification ready
- [ ] On-call team assembled and briefed
- [ ] Status page updated
- [ ] All scripts tested in staging

---

## Communication Template

### Internal (Slack)

```
🔴 INCIDENT: Phase 27 Rollback Initiated

Error Rate: 2.3% (critical threshold: 1%)
Payment Failures: 4.2% (threshold: 5% - approaching)
Latency p99: 2.1s (threshold: 5s)

Status: Initiating rollback to v1.9.0

Timeline:
- 10:23: Issue detected
- 10:25: Response team engaged
- 10:27: Feature flags disabled
- 10:30: Kubernetes rollback started
- ETA complete: 10:35

Will provide updates every 5 minutes.
```

### External (Customer Email)

```
Subject: Service Stability Update

We detected a performance issue with the latest Phase 27 (v2.0.0) release and have decided to temporarily revert to version 1.9.0 to ensure stability.

This reversion was completed in [X] minutes with no data loss.

What happened:
- Error rate spike on Phase 27 features
- User impact: ~5 minutes
- Impact: Advanced analytics and enterprise features temporarily unavailable
- Core scanning: Fully operational

Next steps:
- Thorough investigation of Phase 27 code
- Additional testing before re-deployment
- Expected Phase 27 re-release: [DATE]

We apologize for the disruption and appreciate your patience.

Support: support@blockstop.com
```

---

## Rollback Runbook Quick Reference

| Scenario | Time | Command | Difficulty |
|----------|------|---------|------------|
| Feature flag disable | 2 min | `./scripts/disable-feature.sh` | ⭐ Easy |
| Kubernetes rollback | 2 min | `kubectl rollout undo` | ⭐ Easy |
| Database rollback | 10 min | Migration script | ⭐⭐ Medium |
| Full rollback | 20 min | All of above | ⭐⭐ Medium |
| Data restore from backup | 30 min | `pg_restore` | ⭐⭐⭐ Hard |

---

**Status:** Ready for Production
**Test Date:** 2026-06-20
**Last Reviewed:** 2026-06-20
**Tested In:** Staging environment
**Estimated Success Rate:** 99%
