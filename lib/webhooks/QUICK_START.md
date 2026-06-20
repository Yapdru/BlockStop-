# Webhook Framework - Quick Start Guide

## 5-Minute Setup

### Step 1: Import the Framework

```typescript
import {
  webhookManager,
  eventPublisher,
  queueProcessor,
  PayloadSigner,
} from '@/lib/webhooks';
```

### Step 2: Initialize Queue Processor

```typescript
// In your application startup
async function initializeWebhooks() {
  await queueProcessor.startProcessing();
  console.log('Webhook processor started');
}

initializeWebhooks();
```

### Step 3: Register a Webhook

```typescript
const { webhook, error } = webhookManager.registerWebhook(
  'org_abc123',                           // Organization ID
  'https://example.com/webhooks/alerts',  // Webhook URL
  ['threat.detected', 'alert.triggered'], // Event types to subscribe to
  {
    maxRetries: 7,
    headers: { 'X-Api-Key': 'secret' },
    filters: {
      threatLevels: ['critical', 'high'],
    },
  }
);

if (error) {
  console.error('Registration failed:', error);
} else {
  console.log('Webhook registered:', webhook!.id);
  console.log('Secret:', webhook!.secret); // Save this securely!
}
```

### Step 4: Publish an Event

```typescript
// When a threat is detected
const result = await eventPublisher.publishThreatDetected(
  'org_abc123',
  {
    threatId: 'threat_xyz789',
    threatLevel: 'critical',
    threatType: 'ransomware',
    description: 'Ransomware detected in backup system',
    detectedAt: new Date(),
    sourceIndicator: 'edr-endpoint-1',
    affectedResources: ['/data/backups'],
  },
  { priority: 'critical' }
);

console.log(`Event published to ${result.webhooksQueued} webhooks`);
```

### Step 5: Verify Incoming Webhook (on your endpoint)

```typescript
import { PayloadSigner } from '@/lib/webhooks';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);
  const webhookSecret = process.env.WEBHOOK_SECRET!;

  // Verify signature
  const result = PayloadSigner.verifyDelivery(
    payload,
    headers,
    webhookSecret
  );

  if (!result.valid) {
    console.error('Invalid signature:', result.error);
    return new Response('Unauthorized', { status: 401 });
  }

  // Process the event
  const event = JSON.parse(payload);
  console.log('Received event:', event.eventType);

  // Process based on event type
  switch (event.eventType) {
    case 'threat.detected':
      await handleThreatDetected(event);
      break;
    case 'alert.triggered':
      await handleAlertTriggered(event);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

---

## Common Operations

### List Webhooks for Organization

```typescript
const webhooks = webhookManager.listWebhooks('org_abc123');
console.log(`Found ${webhooks.length} webhooks`);
```

### Test Webhook Delivery

```typescript
const result = await webhookManager.testWebhook(webhookId);
if (result.success) {
  console.log(`✓ Webhook working (${result.responseTime}ms)`);
} else {
  console.log(`✗ Webhook failed: ${result.error}`);
}
```

### Update Webhook

```typescript
const { webhook, error } = webhookManager.updateWebhook(webhookId, {
  url: 'https://example.com/webhooks/v2',
  eventTypes: ['threat.detected'],
  active: true,
});
```

### Disable Webhook Temporarily

```typescript
webhookManager.disableWebhook(webhookId);
// Later, re-enable it
webhookManager.enableWebhook(webhookId);
```

### Get Webhook Statistics

```typescript
const stats = webhookManager.getWebhookStats(webhookId);
console.log(`
  Total Events: ${stats.totalEvents}
  Delivered: ${stats.deliveredEvents}
  Failed: ${stats.failedEvents}
  Success Rate: ${stats.successRate.toFixed(2)}%
`);
```

### Rotate Secret (for security)

```typescript
const { secret } = webhookManager.rotateSecret(webhookId);
console.log('New secret:', secret);
// Send this to the webhook provider
```

### Check Queue Health

```typescript
const health = queueProcessor.getHealth();
console.log(`
  Running: ${health.isRunning}
  Success Rate: ${health.successRate}%
  DLQ Size: ${health.dlqSize}
`);
```

### Get Organization-wide Statistics

```typescript
const stats = webhookManager.getOrgStats('org_abc123');
console.log(`
  Total Webhooks: ${stats.webhookCount}
  Active: ${stats.activeWebhooks}
  Success Rate: ${stats.successRate}%
`);
```

---

## Event Types and Payloads

### 1. Threat Detected

```typescript
await eventPublisher.publishThreatDetected('org_id', {
  threatId: 'threat_123',
  threatLevel: 'critical', // or 'high', 'medium', 'low'
  threatType: 'malware',
  description: 'Malware detected',
  detectedAt: new Date(),
  sourceIndicator: 'scanner-1',
  affectedResources: ['file1.exe'],
  threatIntelligence: {
    ttps: ['T1566.001'],
    actors: ['APT28'],
    malware: ['EMOTET'],
  },
});
```

### 2. Scan Completed

```typescript
await eventPublisher.publishScanCompleted('org_id', {
  scanId: 'scan_456',
  scanType: 'file', // or 'endpoint', 'network', 'cloud'
  status: 'success', // or 'partial', 'failed'
  startedAt: new Date(),
  completedAt: new Date(),
  duration: 5000,
  itemsScanned: 1000,
  threatsDetected: 5,
  scanTarget: '/data',
  summary: {
    criticalThreats: 1,
    highThreats: 2,
    mediumThreats: 2,
    lowThreats: 0,
  },
});
```

### 3. Alert Triggered

```typescript
await eventPublisher.publishAlertTriggered('org_id', {
  alertId: 'alert_789',
  alertType: 'security',
  severity: 'high', // or 'critical', 'medium', 'low', 'info'
  title: 'Suspicious Activity',
  description: 'Unusual network behavior detected',
  triggeredAt: new Date(),
  relatedThreats: ['threat_123'],
  actionRequired: true,
  recommendedActions: ['Isolate system', 'Review logs'],
});
```

### 4. Organization Created

```typescript
await eventPublisher.publishOrganizationCreated('org_id', {
  organizationId: 'org_new',
  organizationName: 'ACME Corp',
  createdAt: new Date(),
  tier: 'professional', // or 'free', 'starter', 'enterprise'
  adminEmail: 'admin@acme.com',
  seatCount: 50,
});
```

### 5. Integration Connected

```typescript
await eventPublisher.publishIntegrationConnected('org_id', {
  integrationId: 'int_123',
  integrationType: 'siem',
  integrationName: 'Splunk Enterprise',
  connectedAt: new Date(),
  status: 'active', // or 'testing', 'inactive'
  configuration: {
    endpoint: 'https://splunk.acme.com',
    authenticationType: 'oauth',
  },
});
```

### 6. Rate Limit Exceeded

```typescript
await eventPublisher.publishRateLimitExceeded('org_id', {
  apiKeyId: 'key_abc123',
  limit: 10000,
  window: 'hour', // or 'minute', 'day'
  exceededAt: new Date(),
  retryAfter: 3600,
  currentUsage: 10500,
});
```

### 7. Security Breach Detected

```typescript
await eventPublisher.publishBreachDetected('org_id', {
  breachId: 'breach_001',
  breachType: 'data-breach',
  severity: 'critical',
  discoveredAt: new Date(),
  affectedSystems: ['database-1', 'file-server-2'],
  impactAssessment: '10,000 user records exposed',
  containmentStatus: 'in_progress',
  threatActors: ['Scattered Spider'],
});
```

---

## Webhook Signature Header Reference

Your webhook endpoint will receive these headers:

```
X-BlockStop-Signature: <hmac-sha256-signature>
X-BlockStop-Timestamp: <unix-timestamp-ms>
X-BlockStop-Nonce: <random-hex-string>
X-BlockStop-Event-ID: <event-uuid>
X-BlockStop-Event-Type: <threat.detected|scan.completed|etc>
X-BlockStop-Delivery-Attempt: <1,2,3...>
```

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check if webhook is active**: `webhookManager.getWebhook(id).active`
2. **Test the webhook**: `await webhookManager.testWebhook(id)`
3. **Check statistics**: `webhookManager.getWebhookStats(id)`
4. **Check DLQ**: `queueProcessor.getDLQEvents()`

### Events Failing to Deliver

1. **Check webhook URL is HTTPS** (production requirement)
2. **Check webhook is returning 2xx status code**
3. **Verify signature on receiving end**
4. **Check request timeout (30 seconds default)**

### Signature Verification Failing

1. **Ensure you're using correct webhook secret**
2. **Check that payload is not modified**
3. **Check timestamp is not too old** (5 minute default max age)
4. **Verify timing-safe comparison is used**

### Queue Processor Not Running

1. **Call `await queueProcessor.startProcessing()`**
2. **Check `queueProcessor.getHealth().isRunning`**
3. **Review logs for initialization errors**

---

## Best Practices

✅ **Always verify signatures** - Never skip signature validation  
✅ **Handle duplicates** - Same event may be delivered multiple times  
✅ **Be idempotent** - Webhook processing should be side-effect safe  
✅ **Return 2xx quickly** - Respond with 200 OK before processing  
✅ **Monitor DLQ** - Regularly check for failed deliveries  
✅ **Test webhooks** - Use test endpoint before production  
✅ **Rotate secrets** - Change webhooks secrets periodically  
✅ **Use HTTPS only** - Enforce HTTPS for all webhook URLs  

---

## Next Steps

1. **Read WEBHOOK_FRAMEWORK.md** for complete documentation
2. **Review api-examples.ts** for API endpoint implementations
3. **Check IMPLEMENTATION_SUMMARY.md** for architecture details
4. **Implement database persistence** for production use
5. **Add Redis Bull queue integration** for scaling
6. **Set up monitoring** for webhook health

---

## Support

For issues or questions:
1. Check WEBHOOK_FRAMEWORK.md troubleshooting section
2. Review api-examples.ts for usage patterns
3. Check PayloadSigner for signature issues
4. Review RetryHandler for retry configuration

---

## Code Examples Repository

See `/lib/webhooks/api-examples.ts` for:
- REST API endpoint implementations
- Webhook creation/update/deletion
- Event publishing examples
- Health check implementations
- Statistics gathering
- Batch operations
- Configuration import/export

All examples are production-ready and follow best practices.
