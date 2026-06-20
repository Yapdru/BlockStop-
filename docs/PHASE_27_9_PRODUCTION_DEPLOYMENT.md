# Phase 27.9: Production Deployment Guide

## 🚀 Deployment Checklist

### Pre-Deployment Verification (Day 1)

#### ✅ Code Quality
- [ ] `npm run lint` passes without errors
- [ ] `npm run type-check` shows no TypeScript errors
- [ ] `npm run build` completes successfully
- [ ] No console warnings in build output

#### ✅ Testing
- [ ] `npm test` passes with > 80% coverage
- [ ] All unit tests for payment verification pass
- [ ] All integration tests for rate limiting pass
- [ ] End-to-end tests for authentication flow pass

#### ✅ Security
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] GitHub security scan passes
- [ ] Database migration 018-phase27-billing-schema.sql tested locally
- [ ] Encryption keys rotated before production
- [ ] JWT secrets are production-strength (minimum 32 chars)

#### ✅ Documentation
- [ ] Payment Verification documented
- [ ] Security Hardening documented
- [ ] Monitoring setup documented
- [ ] Rollback procedures documented

---

## 📋 Deployment Plan (All-At-Once Strategy)

### Stage 1: Internal Testing (Day 1)
**Duration:** 4-8 hours
**Participants:** Dev, QA, Product team

```
Objectives:
1. Deploy to staging environment
2. Run smoke tests
3. Verify payment flow end-to-end
4. Check rate limiting enforcement
5. Validate encryption
6. Test monitoring/alerting

Success Criteria:
- No critical bugs found
- All features working as expected
- Monitoring alerts firing correctly
- Logs showing expected patterns
```

**Deployment Steps:**
```bash
# 1. Build and test
npm run build
npm run test

# 2. Run database migrations (staging)
./scripts/migrate-staging.sh

# 3. Deploy to staging
./scripts/deploy-staging.sh

# 4. Run smoke tests
npm run test:e2e

# 5. Manual verification checklist
# - User registration
# - Subscription creation (test payment)
# - API rate limiting
# - Extension installation
# - File scanning
```

**Rollback if needed:**
```bash
./scripts/rollback-staging.sh
```

---

### Stage 2: Beta Rollout (Day 2)
**Duration:** 4-8 hours
**Participants:** 50-100 beta users
**Strategy:** 10% of total user base

```
Objectives:
1. Real-world usage validation
2. Performance monitoring
3. User feedback collection
4. Security incident detection

Success Criteria:
- Error rate < 0.1%
- Latency p99 < 500ms
- User satisfaction > 4.5/5
- No security issues reported
```

**Deployment:**
```bash
# 1. Deploy to production (10% traffic)
./scripts/deploy-prod-canary.sh --percentage=10

# 2. Monitor metrics
./scripts/monitor-metrics.sh

# 3. Collect user feedback
./scripts/collect-feedback.sh

# 4. Health checks
./scripts/health-check.sh

# 5. If issues, rollback
./scripts/rollback-prod.sh
```

**Monitoring Dashboard:**
```
Dashboard URL: https://monitoring.blockstop.com/phase27-deployment
Metrics to watch:
- API error rate (target: < 0.1%)
- Latency p99 (target: < 500ms)
- Payment success rate (target: > 99.5%)
- Extension crash rate (target: < 0.01%)
```

---

### Stage 3: Gradual Rollout (Days 3-5)
**Duration:** 3 days
**Strategy:** 10% → 50% → 100%

```
Day 3: Expand to 50% traffic
- Monitor for 4 hours
- Check error rates
- Verify all metrics healthy

Day 4: Expand to 100% traffic
- Full production deployment
- Continued monitoring

Day 5: Stability verification
- 24-hour production run
- No intervention needed
- All metrics nominal
```

**Gradual Rollout Script:**
```bash
# Hour 0: 10%
./scripts/deploy-prod-canary.sh --percentage=10

# Hour 4: Check metrics, expand if OK
./scripts/deploy-prod-canary.sh --percentage=50

# Hour 8: Check metrics, expand if OK
./scripts/deploy-prod-canary.sh --percentage=100

# Hour 12+: Full production
# No traffic policy changes needed
```

---

### Stage 4: Full Production (Day 6)
**Duration:** Ongoing
**Participants:** All users

```
Success Criteria Met:
✅ 0 critical security issues
✅ < 0.1% error rate
✅ < 500ms p99 latency
✅ > 4.5/5 user satisfaction
✅ > 99.5% payment success rate
✅ > 99.9% extension reliability

Actions:
- Release notes published
- Blog post announcing v2.0.0
- Customer communication sent
- Support team trained
- On-call team briefed
```

---

## 🔄 Rollback Plan

### Quick Rollback (< 5 minutes)
**When:** Critical bugs detected in production
**How:** Feature flags + Kubernetes blue-green deployment

```bash
# Option 1: Disable feature via flag
./scripts/disable-feature.sh --feature=phase27 --reason="critical-bug"

# Option 2: Kubernetes rollback
kubectl rollout undo deployment/blockstop-api -n blockstop

# Option 3: Full environment rollback
./scripts/rollback-to-phase26.sh
```

**Automatic Triggers:**
- Error rate > 1%
- Latency p99 > 5 seconds
- Payment failure rate > 5%
- Unhandled exceptions > 100/hour

---

## 📊 Monitoring & Metrics

### Key Metrics Dashboard

**API Health**
```
Metric                  Target      Alert Threshold
==========================================
Error Rate              < 0.1%      > 0.5%
Latency p99             < 500ms     > 1000ms
Success Rate            > 99.9%     < 99%
Request Rate            baseline    +50% variance
Database Connections    < 80        > 90
Redis Memory            < 80%       > 90%
```

**Business Metrics**
```
Metric                  Target      Check Frequency
==========================================
Payment Success Rate    > 99.5%     Every 1 minute
Subscription Rate       > 50 new/day Every 1 hour
Extension Installs      > 100/day    Every 1 hour
User Satisfaction       > 4.5/5      Every 6 hours
Support Tickets         < 20/day     Every 1 hour
```

### Monitoring Setup

**Sentry (Error Tracking)**
```
Setup:
1. Configure SENTRY_DSN in environment
2. Set release version: v2.0.0
3. Configure notification rules
4. Enable performance monitoring

Dashboard: https://sentry.blockstop.com/blockstop-pro
```

**Prometheus (Metrics)**
```
Scrape Endpoints:
- /metrics (API metrics)
- /health (Health check)
- /ready (Readiness probe)

Retention: 15 days (local), 1 year (long-term)
```

**Grafana (Visualization)**
```
Pre-configured Dashboards:
- Phase 27 Deployment Overview
- API Performance
- Database Health
- User Activity
- Payment Processing

URL: https://grafana.blockstop.com
```

**DataDog (APM & Infrastructure)**
```
Services:
- blockstop-api (APM)
- blockstop-web (APM)
- blockstop-worker (APM)
- PostgreSQL (Infrastructure)
- Redis (Infrastructure)

Dashboard: https://app.datadoghq.com/organization-settings/
```

---

## 🔐 Security Verification

### Pre-Deployment Security Checklist

- [ ] Payment verification middleware active
- [ ] Rate limiting rules enforced
- [ ] Encryption keys in production
- [ ] JWT secrets rotated
- [ ] Database backups enabled
- [ ] SSL/TLS certificates valid
- [ ] CORS policies configured
- [ ] API keys rotated
- [ ] Webhook signatures verified
- [ ] Security headers configured

### Post-Deployment Security Checks

```bash
# Test payment verification
./scripts/test-payment-verification.sh

# Test rate limiting
./scripts/test-rate-limiting.sh

# Test encryption
./scripts/test-encryption.sh

# Verify CORS headers
curl -H "Origin: https://external.com" https://api.blockstop.com/health

# Check security headers
curl -I https://blockstop.com | grep -E "Strict-Transport|X-Frame|X-Content"
```

---

## 📞 On-Call Procedures

### Incident Response

**Severity Levels:**
- 🔴 **Critical:** System down, data loss risk, payment failures
- 🟠 **High:** Major feature broken, significant performance issue
- 🟡 **Medium:** Feature partially broken, minor performance issue
- 🟢 **Low:** UI glitch, documentation error

**Response Times:**
- Critical: < 5 minutes
- High: < 15 minutes
- Medium: < 1 hour
- Low: < 4 hours

**Escalation:**
```
Level 1: On-call engineer (pager duty)
Level 2: Engineering manager (if not resolved in 15 min)
Level 3: CTO (if not resolved in 30 min)
Level 4: Full incident response team
```

### Common Issues & Solutions

**Issue: High Error Rate**
```bash
# Check logs
kubectl logs -f deployment/blockstop-api -n blockstop

# Check metrics
./scripts/check-error-rate.sh

# Common fixes:
# 1. Check database connection
# 2. Check Redis connection
# 3. Check API key validity
# 4. Check rate limiter state
```

**Issue: Payment Failures**
```bash
# Check Stripe webhook logs
./scripts/check-stripe-webhooks.sh

# Check payment verification middleware
./scripts/test-payment-verification.sh

# Check database subscription table
./scripts/query-subscriptions.sh --status=failed

# Common fixes:
# 1. Verify Stripe webhook secret
# 2. Check JWT secret matches
# 3. Check database migrations applied
# 4. Verify webhook signature verification logic
```

**Issue: Performance Degradation**
```bash
# Check database query performance
./scripts/analyze-queries.sh

# Check cache hit rate
./scripts/check-redis.sh

# Check API latency distribution
./scripts/analyze-latency.sh

# Common fixes:
# 1. Check database indexes
# 2. Clear Redis cache if corrupted
# 3. Scale API replicas if load high
# 4. Check for slow queries
```

---

## 📝 Release Notes Template

```markdown
# BlockStop v2.0.0 - Enterprise Security Platform

## 🎉 What's New

### Phase 27: Advanced Features & Marketplace
- 🔌 Browser Extensions (Chrome, Firefox, Safari)
- 📊 Advanced Analytics & Threat Intelligence
- 🏢 Enterprise Features (Webhooks, APIs, SIEM)
- 📱 Mobile App Polish
- ⚡ Performance Optimizations
- 🤖 AI/ML Enhancements
- 🛍️ Marketplace Platform

### Security Hardening (27.8)
- ✅ Payment Verification System
- ✅ Rate Limiting (Tier-based)
- ✅ Threat Signature Validation
- ✅ Data Encryption (AES-256)
- ✅ TLS 1.3 Configuration

### Performance
- Email scanning: < 1s (was 2s)
- File scanning: < 2s (was 3s)
- Dashboard load: < 2s (was 4s)
- Bundle size: 500KB (was 800KB)

### Bug Fixes
- Fixed payment verification edge case
- Fixed rate limiter concurrency issue
- Fixed encryption key rotation bug
- Fixed CORS header configuration

## 🚀 Upgrade Instructions

### For Free/NEO Tier Users
No action required. Enjoy new features!

### For PRO/OFFICE/MAX Tier Users
- Browser extension available in Chrome, Firefox, Safari stores
- Analytics dashboard at /analytics
- New integrations available in Settings

### For Enterprise Customers
- SIEM connectors available
- Custom middleware support
- Dedicated account manager

## 📞 Support
- Email: support@blockstop.com
- Slack: #blockstop-support
- Docs: https://docs.blockstop.com
```

---

## 📚 Additional Resources

### Documentation Files
- `/docs/PHASE_27_ARCHITECTURE.md` - System architecture overview
- `/docs/SECURITY_HARDENING.md` - Security implementation details
- `/docs/MONITORING.md` - Monitoring setup guide
- `/docs/RATE_LIMITING.md` - Rate limiter configuration
- `/docs/PAYMENT_VERIFICATION.md` - Payment system setup

### Scripts
```
./scripts/deploy-prod.sh            # Main deployment script
./scripts/rollback-prod.sh          # Rollback to previous version
./scripts/health-check.sh           # Verify system health
./scripts/migrate-db.sh             # Run database migrations
./scripts/test-payment-verification.sh
./scripts/test-rate-limiting.sh
./scripts/collect-metrics.sh
```

### Kubernetes Configuration
```
/kubernetes/deployment-api.yaml     # API deployment
/kubernetes/deployment-web.yaml     # Web deployment
/kubernetes/deployment-worker.yaml  # Worker deployment
/kubernetes/secrets.yaml            # Secret management
/kubernetes/ingress.yaml            # Ingress configuration
```

---

## ✅ Deployment Sign-Off

**Checklist before hitting deploy button:**

- [ ] All tests passing (100%)
- [ ] Security audit passed
- [ ] Database migrations tested
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Rollback plan ready
- [ ] On-call team briefed
- [ ] Customer communication ready
- [ ] Release notes finalized
- [ ] Status page prepared

**Sign-Off:**
- [ ] Engineering Lead: _________________________ (Date: _______)
- [ ] Security Lead: _________________________ (Date: _______)
- [ ] Product Manager: _________________________ (Date: _______)
- [ ] DevOps Lead: _________________________ (Date: _______)

---

**Status:** Ready for Deployment
**Version:** 2.0.0
**Release Date:** 2026-06-21
**Estimated Duration:** 5 days (internal → beta → gradual rollout → full)
