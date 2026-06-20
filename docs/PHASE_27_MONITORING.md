# Phase 27 Monitoring & Observability Setup

## Overview

Complete monitoring infrastructure for Phase 27 (v2.0.0) production deployment, including error tracking, performance monitoring, logging, and alerting.

---

## 1. Sentry (Error & Crash Tracking)

### Setup

**Environment Variables:**
```bash
SENTRY_DSN=https://xxxxx@sentry.io/project_id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=v2.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10% of transactions
```

**Code Integration:**

```typescript
// /app/layout.tsx or app initialization
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: 'v2.0.0',
  tracesSampleRate: 0.1,
  debug: false,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Server-Side Integration:**

```typescript
// API routes for error tracking
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  try {
    // API logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: "api",
        handler: "threat-scan"
      },
      level: "error"
    });
    throw error;
  }
}
```

### Monitoring Dashboard

**URL:** https://sentry.blockstop.com

**Key Views:**
- **Issues:** Unique errors grouped by root cause
- **Stats:** Error rate trend, release health
- **Performance:** Transaction durations, slowest endpoints
- **Releases:** v2.0.0 issue status and commits involved

**Alerts:**

```
1. Error Rate Spike
   Trigger: > 0.5% error rate in 5 minutes
   Action: Page on-call engineer
   Notification: Slack #blockstop-incidents

2. New Critical Issue
   Trigger: Issue with tag "critical" appears
   Action: Immediate Slack alert
   Notification: Slack #blockstop-critical

3. Release Health
   Trigger: Issue count increases > 10% since release
   Action: Review release QA
   Notification: #blockstop-releases

4. Performance Regression
   Trigger: p99 latency > 1000ms
   Action: Investigate query/code performance
   Notification: Slack #blockstop-performance
```

---

## 2. DataDog (APM & Infrastructure)

### Setup

**Agent Installation:**
```bash
# Install Datadog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=xxxxx bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_mac_os.sh)"

# Configuration
export DD_SERVICE=blockstop-pro
export DD_ENV=production
export DD_VERSION=v2.0.0
export DD_TRACE_SAMPLE_RATE=0.1
```

**Code Integration:**

```typescript
// Next.js Datadog integration
import { tracer } from 'dd-trace';

tracer.init({
  service: 'blockstop-pro',
  version: 'v2.0.0',
  env: 'production',
  sampleRate: 0.1,
  analytics: true,
});

tracer.use('express', {
  recordRoute: true,
  recordQueryString: true,
});

tracer.use('postgresql', {
  service: 'blockstop-postgres',
  analytics: true,
});

tracer.use('redis', {
  service: 'blockstop-redis',
  analytics: true,
});
```

### Pre-Built Dashboards

**1. Phase 27 Deployment Overview**
```
Widgets:
- Deployment status (blue-green state)
- Error rate trend (last 24 hours)
- Request rate (req/s)
- API latency (p50, p95, p99)
- Database connections
- Top 10 slowest endpoints
- Top 5 most common errors
```

**2. API Performance**
```
Metrics:
- Requests per second: [real-time]
- Latency p50/p95/p99: [ms]
- Error rate by status code: [%]
- Request distribution by endpoint: [pie chart]
- Response time by tier: [bar chart]
- Database queries per request: [histogram]
```

**3. Database Health**
```
Metrics:
- Query duration (p50, p95, p99)
- Slow queries (> 1s)
- Connection pool utilization
- Transaction duration
- Lock contention
- Replication lag (if applicable)
- Cache hit rate (Redis)
```

**4. User Activity**
```
Metrics:
- New users/hour: [counter]
- Active users: [gauge]
- Subscription conversions: [counter]
- Top features used: [ranking]
- User error rate: [%]
- Session duration: [seconds]
```

**5. Payment Processing**
```
Metrics:
- Successful payments: [counter]
- Failed payments: [counter]
- Average payment time: [seconds]
- Payment success rate: [%]
- Webhook processing time: [ms]
- JWT token validation failures: [counter]
```

### Custom Metrics

```typescript
// Track custom business metrics
import { statsd } from 'datadog-metrics';

// Payment verification
statsd.increment('blockstop.payment.verified', 1, ['tier:pro']);
statsd.gauge('blockstop.subscription.active_users', activeCount);
statsd.histogram('blockstop.payment.verification_time', durationMs);

// Rate limiting
statsd.increment('blockstop.ratelimit.exceeded', 1, ['tier:free']);
statsd.gauge('blockstop.ratelimit.quota_remaining', remaining);

// Threat detection
statsd.increment('blockstop.threat.detected', 1, ['type:phishing']);
statsd.histogram('blockstop.threat.detection_time', durationMs);

// Extension usage
statsd.increment('blockstop.extension.installed', 1, ['browser:chrome']);
statsd.gauge('blockstop.extension.active_users', activeCount);
```

---

## 3. Prometheus (Metrics Collection)

### Scrape Configuration

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  retention: 15d

scrape_configs:
  - job_name: 'blockstop-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api-1:3000', 'api-2:3000', 'api-3:3000']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance

  - job_name: 'blockstop-postgres'
    static_configs:
      - targets: ['postgres:5432']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance

  - job_name: 'blockstop-redis'
    static_configs:
      - targets: ['redis:6379']
```

### Key Metrics

**HTTP Metrics:**
```
http_requests_total{endpoint="/api/threat/scan", status="200", method="POST"}
http_request_duration_seconds{endpoint="/api/threat/scan", quantile="0.99"}
http_requests_in_progress{endpoint="/api/threat/scan"}
```

**Database Metrics:**
```
pg_stat_user_tables_n_tup_ins{schemaname="billing", relname="subscriptions"}
pg_stat_user_tables_n_tup_upd{schemaname="billing", relname="subscriptions"}
pg_stat_user_tables_n_tup_del{schemaname="billing", relname="subscriptions"}
pg_stat_statements_mean_exec_time{query="SELECT * FROM billing.subscriptions"}
```

**Business Metrics:**
```
blockstop_payment_verified_total{tier="pro", status="success"}
blockstop_ratelimit_exceeded_total{tier="free"}
blockstop_threat_detected_total{type="phishing", severity="critical"}
blockstop_extension_active_users{browser="chrome"}
```

---

## 4. Grafana (Visualization)

### Pre-Built Dashboards

**Dashboard 1: Phase 27 Deployment Overview**
```
URL: https://grafana.blockstop.com/d/phase27-overview

Panels:
- Deployment status (Kubernetes)
- Error rate trend (24-hour)
- Request rate (real-time gauge)
- Latency p99 (real-time gauge)
- Database connections (real-time)
- Top errors (table)
- Error rate by endpoint (bar chart)
```

**Dashboard 2: API Performance Deep Dive**
```
URL: https://grafana.blockstop.com/d/api-performance

Panels:
- Requests per second (time series)
- Latency distribution (histogram)
- Status code distribution (pie chart)
- Top 10 slowest endpoints (table)
- Error rate by endpoint (bar chart)
- Response time by tier (grouped bar chart)
```

**Dashboard 3: Payment & Billing**
```
URL: https://grafana.blockstop.com/d/payment-billing

Panels:
- Payment success rate (gauge)
- Successful payments (counter)
- Failed payments (counter)
- Payment verification latency (histogram)
- JWT token validation (time series)
- Subscription status (pie chart)
```

**Dashboard 4: Database Health**
```
URL: https://grafana.blockstop.com/d/database-health

Panels:
- Query duration p99 (gauge)
- Slow queries (> 1s) (counter)
- Connection pool usage (gauge)
- Replication lag (gauge)
- Cache hit rate (gauge)
- Transaction duration (histogram)
```

**Dashboard 5: Extension Monitoring**
```
URL: https://grafana.blockstop.com/d/extension-monitoring

Panels:
- Active extension users (gauge)
- Daily installs (counter)
- Crash rate (gauge)
- Scan latency (histogram)
- Browser distribution (pie chart)
- Top errors (table)
```

---

## 5. Alerts Configuration

### Alert Rules (Prometheus + AlertManager)

**rules.yml:**
```yaml
groups:
  - name: blockstop_alerts
    rules:
      # API Health Alerts
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate ({{ $value }}%)"
          description: "Error rate > 1% for 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.99, http_request_duration_seconds) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency ({{ $value }}ms)"

      # Database Alerts
      - alert: DatabaseConnectionPoolFull
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearing capacity"

      - alert: SlowQueries
        expr: rate(pg_stat_statements_mean_exec_time[5m]) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"

      # Payment Alerts
      - alert: PaymentFailureRate
        expr: rate(blockstop_payment_verified_total{status="failed"}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Payment failure rate > 5%"

      # Rate Limiting Alerts
      - alert: HighRateLimitExceeded
        expr: rate(blockstop_ratelimit_exceeded_total[5m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Rate limit exceeded for {{ $labels.tier }} users"

      # Extension Alerts
      - alert: HighExtensionCrashRate
        expr: rate(blockstop_extension_crashes_total[1m]) > 0.001
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Extension crash rate > 0.1%"
```

### Alert Routing (AlertManager)

**alertmanager.yml:**
```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/xxx/yyy/zzz'

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    # Critical alerts (immediate)
    - match:
        severity: critical
      receiver: 'page-oncall'
      group_wait: 0s
      repeat_interval: 15m

    # Warning alerts (batch in 30s)
    - match:
        severity: warning
      receiver: 'slack-channel'
      group_wait: 30s
      repeat_interval: 4h

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#blockstop-monitoring'
        title: '{{ .GroupLabels.alertname }}'

  - name: 'page-oncall'
    pagerduty_configs:
      - service_key: 'xxx'
    slack_configs:
      - channel: '#blockstop-critical'
        title: '🚨 {{ .GroupLabels.alertname }}'
```

---

## 6. Logging (ELK Stack)

### Log Aggregation

**Filebeat Configuration (filebeat.yml):**
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/blockstop/api.log
      - /var/log/blockstop/web.log
      - /var/log/blockstop/worker.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "blockstop-%{+yyyy.MM.dd}"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

### Kibana Dashboards

**Dashboard 1: Production Overview**
```
Queries:
- All errors: status >= 400
- API latency: response_time
- Payment events: event.type="payment.*"
- Extension crashes: source="extension" AND level="error"

Visualization:
- Logs timeline (stacked bar chart)
- Top error messages (ranking)
- Error distribution by service (pie chart)
- Latency percentiles (histogram)
```

**Dashboard 2: Payment Processing**
```
Queries:
- All payment events: event.type="payment.*"
- Successful: event.payment.status="success"
- Failed: event.payment.status="failed"
- Webhook events: event.type="webhook.*"

Visualization:
- Payment timeline
- Success rate over time
- Top failure reasons
- Webhook latency
```

**Dashboard 3: Rate Limiter Events**
```
Queries:
- Rate limit exceeded: event.type="ratelimit_exceeded"
- By tier: aggregation on user.tier
- By endpoint: aggregation on http.path

Visualization:
- Rate limit timeline
- Distribution by tier (pie chart)
- Top endpoints (ranking)
```

### Log Retention Policy

```
- Hot: 1 week (searchable)
- Warm: 1 month (archived)
- Cold: 1 year (backup only)
```

---

## 7. Health Check Endpoints

### Implementation

**GET /health** - Basic health check
```json
{
  "status": "healthy",
  "version": "v2.0.0",
  "timestamp": "2026-06-20T10:30:00Z",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "stripe": "healthy"
  }
}
```

**GET /ready** - Readiness probe (for Kubernetes)
```json
{
  "ready": true,
  "checks": {
    "database_connection": true,
    "migrations_applied": true,
    "cache_available": true
  }
}
```

**GET /metrics** - Prometheus metrics
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{endpoint="/api/threat/scan", status="200"} 15234

# HELP http_request_duration_seconds Request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{endpoint="/api/threat/scan", le="0.5"} 14200
```

---

## 8. Custom Dashboards & Queries

### Useful Queries

**DataDog:**
```
# API Error Rate
avg:trace.web.request.errors{env:production} by {http.status_code}

# Payment Success Rate
avg:blockstop.payment.success_rate{env:production}

# Database Latency
p99:trace.postgres.query.duration{env:production}

# Extension Usage
sum:blockstop.extension.active_users{browser:*}
```

**Prometheus:**
```
# Error rate over last 5 minutes
rate(http_requests_total{status=~"5.."}[5m])

# p99 latency
histogram_quantile(0.99, http_request_duration_seconds)

# Payment success rate
rate(blockstop_payment_verified_total{status="success"}[5m]) / 
rate(blockstop_payment_verified_total[5m])

# Active database connections
pg_stat_activity_count
```

**Grafana (PromQL):**
```
# API Request Rate
rate(http_requests_total[5m])

# Error Rate Percentage
(rate(http_requests_total{status=~"5.."}[5m]) / 
 rate(http_requests_total[5m])) * 100

# Database Connections
pg_stat_activity_count
```

---

## 9. Monitoring Checklist

### Pre-Deployment
- [ ] Sentry project created and DSN configured
- [ ] DataDog agent installed and collecting metrics
- [ ] Prometheus scrape config validated
- [ ] Grafana dashboards created and tested
- [ ] AlertManager rules configured
- [ ] ELK stack collecting logs
- [ ] Health check endpoints working
- [ ] All alerts tested in staging

### Post-Deployment (First 24 hours)
- [ ] All dashboards showing real data
- [ ] Error rate normal (< 0.1%)
- [ ] Latency p99 < 500ms
- [ ] No alert storms
- [ ] Logs being collected properly
- [ ] Metrics retention verified
- [ ] On-call rotation active

### Ongoing (Weekly)
- [ ] Review alert effectiveness
- [ ] Check dashboard accuracy
- [ ] Verify log retention
- [ ] Test alert routing
- [ ] Update baselines if needed

---

## 10. Troubleshooting Monitoring

### Sentry not receiving errors
```bash
# Check DSN is correct
echo $SENTRY_DSN

# Test Sentry integration
curl -X POST $SENTRY_DSN/store/ -d '{"message":"test"}'

# Check network connectivity
curl https://sentry.io/api/0/events/
```

### DataDog not collecting metrics
```bash
# Check agent status
sudo datadog-agent status

# Verify metrics being sent
datadog-agent debug stats

# Check API key
echo $DD_API_KEY
```

### Prometheus alerts not firing
```bash
# Access Prometheus UI
curl http://localhost:9090

# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check if metrics exist
curl 'http://localhost:9090/api/v1/query?query=metric_name'
```

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [DataDog APM](https://docs.datadoghq.com/tracing/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboard Building](https://grafana.com/docs/grafana/latest/dashboards/)
- [ELK Stack Setup](https://www.elastic.co/guide/en/welcome/)

---

**Status:** Production Ready
**Version:** v2.0.0
**Last Updated:** 2026-06-20
