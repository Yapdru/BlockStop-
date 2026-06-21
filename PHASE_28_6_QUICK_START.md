# Phase 28.6 - Performance Optimization Quick Start

## Quick Setup Guide

### 1. Initialize Monitoring on App Startup

```typescript
// In your root layout or app initialization
import { initializeMonitoring, startAPITracker } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  // Server-side initialization
  initializeMonitoring();

  return (
    <html>
      <body>
        {children}
        <ClientTracker />
      </body>
    </html>
  );
}

function ClientTracker() {
  useEffect(() => {
    // Client-side API tracking
    startAPITracker();
  }, []);

  return null;
}
```

### 2. Configure Environment Variables

Create `.env.local` with these settings:

```bash
# Database Sharding
SHARD_COUNT=5
DATABASE_URL=postgresql://user:pass@localhost:5432/blockstop

# Database Pool
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000

# Region Configuration (Optional - defaults provided)
DB_HOST_US_EAST=localhost
CACHE_HOST_US_EAST=localhost:6379
API_ENDPOINT_US_EAST=http://localhost:3000
```

### 3. Access Monitoring Dashboard

Navigate to: `http://localhost:3000/app/monitoring`

### 4. Common Usage Patterns

#### Track API Latency

```typescript
import { recordMetric } from '@/lib/monitoring';

export async function GET(request: Request) {
  const start = Date.now();
  
  // Your API logic
  const data = await fetchData();
  
  const duration = Date.now() - start;
  recordMetric('api-request', duration);
  
  return Response.json(data);
}
```

#### Use Region Selector

```typescript
import { regionSelector } from '@/lib/deployment/region-selector';

const headers = Object.fromEntries(request.headers);
const region = regionSelector.selectRegionFromHeaders(headers);
console.log(`Routing to: ${region}`);
```

#### Query a Shard

```typescript
import { shardRouter, ShardKey } from '@/lib/db/shard-router';

const user = await shardRouter.route(
  ShardKey.USER_ID,
  userId,
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

#### Select Load Balancer Backend

```typescript
import { loadBalancer } from '@/lib/lb/load-balancer';

// Register servers (once at startup)
loadBalancer.addBackend('api-1', 'api1.local', 3000);
loadBalancer.addBackend('api-2', 'api2.local', 3000);
loadBalancer.startHealthChecks();

// Select backend (per request)
const backend = loadBalancer.selectBackend(clientIp);
const url = `http://${backend.host}:${backend.port}/api/...`;
```

#### Get System Status

```typescript
import { getSystemStatus } from '@/lib/monitoring';

const status = getSystemStatus();
console.log(status);
// {
//   health: 'healthy',
//   uptime: 86400,
//   alerts: { total: 0, active: 0, critical: 0 },
//   services: [...],
//   performance: { pageLoadTime: 1200, ... }
// }
```

### 5. Monitoring Dashboard Features

- **Real-time Metrics**: CPU, Memory, Disk, Network
- **API Performance**: Latency, p95, p99, error rates
- **Core Web Vitals**: FCP, LCP, CLS, TTFB
- **Active Alerts**: System status, performance issues
- **Database Metrics**: Slow queries, connection pool usage
- **Service Health**: Database, Cache, API, Auth

### 6. Alert Configuration

```typescript
import { alertsSystem } from '@/lib/monitoring/alerts';

// Add custom alert rule
alertsSystem.addAlertRule({
  id: 'api-timeout',
  type: AlertType.HIGH_LATENCY,
  metric: 'api-latency',
  condition: 'greater_than',
  threshold: 2000,
  duration: 60,
  severity: AlertSeverity.CRITICAL,
  enabled: true,
  notification: {
    email: ['ops@blockstop.io'],
    slack: process.env.SLACK_WEBHOOK,
  },
});

// Listen to alerts
alertsSystem.on('alert', (alert) => {
  console.log('Alert triggered:', alert.title);
});
```

### 7. Query Optimization

```typescript
import { queryOptimizer } from '@/lib/db/query-optimizer';

// Get recommendations
const recommendations = queryOptimizer.getIndexRecommendations();
recommendations.forEach((rec) => {
  console.log(`Add index on ${rec.table}.${rec.columns.join(',')}`);
  console.log(`Expected improvement: ${rec.expectedImprovement}%`);
});

// Get slow queries
const slowQueries = queryOptimizer.getSlowQueries(60, 10);
slowQueries.forEach((q) => {
  console.log(`${q.executionTime}ms: ${q.query.substring(0, 50)}...`);
});
```

### 8. Multi-Region Failover

```typescript
import { regionSelector, regionConfigManager } from '@/lib/deployment/region-selector';

// Get primary and fallback regions
const selection = regionSelector.selectNearestRegion(userLocation);
const primaryRegion = selection.primaryRegion;
const fallbackRegions = regionSelector.getFallbackRegions(primaryRegion);

// Implement retry logic
for (const region of [primaryRegion, ...fallbackRegions]) {
  try {
    const config = regionConfigManager.getRegionConfig(region);
    return await queryRegion(config.apiEndpoint);
  } catch (error) {
    console.warn(`Region ${region} failed, trying next...`);
  }
}
```

## File Locations

```
Core Performance Files:
├── lib/deployment/
│   ├── region-config.ts          (Region definitions)
│   └── region-selector.ts        (Region selection logic)
├── lib/db/
│   ├── shard-manager.ts          (Shard operations)
│   ├── shard-router.ts           (Query routing)
│   └── query-optimizer.ts        (Query analysis)
├── lib/lb/
│   └── load-balancer.ts          (Load balancing)
├── lib/monitoring/
│   ├── index.ts                  (Central hub)
│   ├── performance-tracker.ts    (Performance metrics)
│   ├── metrics-collector.ts      (System metrics)
│   ├── alerts.ts                 (Alert system)
│   └── api-tracker-middleware.ts (Middleware)

Dashboard & API:
├── app/(app)/monitoring/page.tsx (Dashboard)
└── app/api/monitoring/metrics/   (API endpoints)
```

## Monitoring API Endpoints

### GET /api/monitoring/metrics
Returns comprehensive system metrics:
- Page load statistics
- API latency percentiles
- Core Web Vitals
- System CPU/memory/disk
- Active alerts
- Service health

### POST /api/monitoring/metrics
Record custom metrics:
```bash
curl -X POST http://localhost:3000/api/monitoring/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "type": "api-latency",
    "endpoint": "/api/users",
    "method": "GET",
    "latency": 150,
    "statusCode": 200,
    "responseSize": 2048
  }'
```

## Performance Baselines

Target metrics for optimization:

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| FCP | <1800ms | 1800-3000ms | >3000ms |
| LCP | <2500ms | 2500-4000ms | >4000ms |
| CLS | <0.1 | 0.1-0.25 | >0.25 |
| TTFB | <600ms | 600-1800ms | >1800ms |
| API Latency | <200ms | 200-500ms | >500ms |
| Error Rate | <1% | 1-5% | >5% |
| Cache Hit Rate | >80% | 60-80% | <60% |

## Troubleshooting

### Metrics not showing on dashboard?
1. Check monitoring initialization: `initializeMonitoring()`
2. Verify `/api/monitoring/metrics` endpoint
3. Check browser console for errors
4. Ensure metrics collection is running

### High latency alerts?
1. Check query performance: `queryOptimizer.getSlowQueries()`
2. Review index recommendations
3. Check region selection latency
4. Monitor load balancer distribution

### Shard imbalance?
```typescript
const stats = await shardManager.getShardStats();
stats.forEach((stat, shardId) => {
  if (stat.percentage > 30) {
    console.warn(`Shard ${shardId} is imbalanced!`);
  }
});
```

## Production Checklist

- [ ] Initialize monitoring in app startup
- [ ] Configure all environment variables
- [ ] Set appropriate alert thresholds
- [ ] Deploy monitoring dashboard
- [ ] Register backend servers
- [ ] Configure region databases
- [ ] Enable health checks
- [ ] Test failover scenarios
- [ ] Monitor alert notifications
- [ ] Review slow query recommendations
- [ ] Optimize identified queries
- [ ] Monitor system metrics

## Need Help?

1. Read full guide: `PHASE_28_6_IMPLEMENTATION.md`
2. Check type definitions in each file
3. Review usage examples in this document
4. Monitor dashboard at `/app/monitoring`
5. Check server logs for errors

---

All systems are production-ready. Deploy with confidence!
