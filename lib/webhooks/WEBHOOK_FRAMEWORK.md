# BlockStop Webhook Framework - Phase 16

A comprehensive, production-ready webhook framework for BlockStop Phase 16 with event publishing, delivery tracking, retry logic, and dead letter queue support.

## Architecture Overview

### Core Components

1. **webhook-manager.ts** - CRUD operations and webhook lifecycle management
2. **event-publisher.ts** - Event publishing system with Bull queue integration
3. **event-router.ts** - Event routing and filtering logic
4. **payload-signer.ts** - HMAC-SHA256 signature generation and validation
5. **retry-handler.ts** - Exponential backoff retry logic (max 7 attempts)
6. **queue-processor.ts** - Bull queue worker for processing deliveries
7. **webhook-utilities.ts** - Batch operations, replay, and helper functions
8. **types/webhook-events.ts** - Event type definitions

## Supported Event Types

- **threat.detected** - Security threat detection events
- **scan.completed** - Scan operation completion events
- **alert.triggered** - Alert notification events
- **organization.created** - Organization creation events
- **integration.connected** - Integration connection events
- **api.rate_limit_exceeded** - API rate limit exceeded events
- **security.breach_detected** - Security breach detection events

## Features

### 1. Webhook Registration and Management

```typescript
import { webhookManager } from '@/lib/webhooks';

// Register a webhook
const result = webhookManager.registerWebhook(
  'org_123',
  'https://example.com/webhooks',
  ['threat.detected', 'scan.completed'],
  {
    headers: { 'X-Custom-Header': 'value' },
    maxRetries: 7,
    filters: {
      threatLevels: ['critical', 'high'],
    },
  }
);

// Update webhook
webhookManager.updateWebhook(webhookId, {
  active: false,
  eventTypes: ['threat.detected'],
});

// Delete webhook
webhookManager.deleteWebhook(webhookId);

// List webhooks
const webhooks = webhookManager.listWebhooks('org_123');

// Get statistics
const stats = webhookManager.getWebhookStats(webhookId);
```

### 2. Event Publishing

```typescript
import { eventPublisher } from '@/lib/webhooks';

// Publish threat detected event
await eventPublisher.publishThreatDetected(
  'org_123',
  {
    threatId: 'threat_abc123',
    threatLevel: 'critical',
    threatType: 'malware',
    description: 'Detected malware in scan',
    detectedAt: new Date(),
    sourceIndicator: 'antivirus-scan',
  },
  { priority: 'critical' }
);

// Publish scan completed event
await eventPublisher.publishScanCompleted(
  'org_123',
  {
    scanId: 'scan_xyz789',
    scanType: 'file',
    status: 'success',
    startedAt: new Date(),
    completedAt: new Date(),
    duration: 5000,
    itemsScanned: 1000,
    threatsDetected: 5,
    scanTarget: '/data',
  }
);

// Publish alert triggered event
await eventPublisher.publishAlertTriggered(
  'org_123',
  {
    alertId: 'alert_123',
    alertType: 'security',
    severity: 'high',
    title: 'Suspicious Activity Detected',
    description: 'Unusual network activity detected',
    triggeredAt: new Date(),
    actionRequired: true,
  }
);
```

### 3. Event Filtering and Routing

```typescript
import { eventRouter } from '@/lib/webhooks';

// Register subscription with filters
eventRouter.registerSubscription(
  'webhook_id',
  ['threat.detected'],
  {
    threatLevels: ['critical', 'high'],
    sources: ['antivirus-scan'],
  }
);

// Route event to matching webhooks
const result = eventRouter.routeEvent(event);
console.log(`Matched: ${result.matched.length} webhooks`);
console.log(`Filtered: ${result.filtered.length} webhooks`);
```

### 4. Payload Signing and Verification

```typescript
import { PayloadSigner } from '@/lib/webhooks';

// Generate signature headers
const payload = JSON.stringify(event);
const headers = PayloadSigner.generateSignatureHeaders(
  payload,
  webhookSecret
);

// Verify webhook signature
const result = PayloadSigner.verifyDelivery(
  payload,
  headers,
  webhookSecret,
  300000 // 5 minute max age
);

if (result.valid) {
  console.log('Signature valid');
} else {
  console.error('Signature invalid:', result.error);
}
```

### 5. Retry Logic

```typescript
import { RetryHandler } from '@/lib/webhooks';

// Check if error is retryable
const isRetryable = RetryHandler.isRetryable({
  statusCode: 503,
  isRetryable: false,
});

// Calculate retry delay with exponential backoff
const attempt = RetryHandler.getRetryAttempt(3, {
  initialDelayMs: 1000,
  maxDelayMs: 300000,
  backoffMultiplier: 2,
});

console.log(`Retry after ${attempt.delayMs}ms`);

// Get retry schedule
const schedule = RetryHandler.generateRetrySchedule();
```

### 6. Queue Processing

```typescript
import { queueProcessor } from '@/lib/webhooks';

// Start processing queue
await queueProcessor.startProcessing();

// Get queue statistics
const stats = queueProcessor.getStats();

// Access dead letter queue
const dlqEvents = queueProcessor.getDLQEvents(100);

// Replay DLQ event
queueProcessor.replayDLQEvent(jobId);

// Health check
const health = queueProcessor.getHealth();
```

### 7. Batch Operations

```typescript
import { webhookUtils } from '@/lib/webhooks';

// Batch deliver events
const result = await webhookUtils.batchDeliver(events, {
  concurrent: true,
});

// Replay failed deliveries
const replayResult = await webhookUtils.replayDLQEvents({
  webhookId: 'webhook_123',
  limit: 100,
});

// Health check all webhooks
const healthChecks = await webhookUtils.healthCheckWebhooks('org_123');
```

### 8. Testing and Debugging

```typescript
import { webhookManager, webhookUtils } from '@/lib/webhooks';

// Test webhook delivery
const testResult = await webhookManager.testWebhook(webhookId);

// Generate test payload
const testPayload = webhookUtils.generateTestPayload('threat.detected');

// Get webhook summary
const summary = webhookUtils.getWebhookSummary(webhookId);

// Validate configuration
const validation = webhookUtils.validateWebhookConfig(config);
```

## API Endpoints

### Webhook Management

- `GET /api/v1/webhooks` - List webhooks
- `POST /api/v1/webhooks` - Create webhook
- `PUT /api/v1/webhooks/:id` - Update webhook
- `DELETE /api/v1/webhooks/:id` - Delete webhook
- `POST /api/v1/webhooks/:id/test` - Test webhook
- `POST /api/v1/webhooks/:id/rotate-secret` - Rotate secret

### Event Management

- `GET /api/v1/webhooks/:id/deliveries` - Get delivery history
- `POST /api/v1/webhooks/test-delivery` - Send test event
- `GET /api/v1/webhooks/health` - Health check
- `POST /api/v1/webhooks/replay-dlq` - Replay failed deliveries
- `GET /api/v1/webhooks/statistics` - Get statistics

## Configuration

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;           // Default: 7
  initialDelayMs: number;       // Default: 1000
  maxDelayMs: number;           // Default: 300000
  backoffMultiplier: number;    // Default: 2
  jitterFactor: number;         // Default: 0.1
}
```

### Queue Processor Configuration

```typescript
interface ProcessingConfig {
  concurrency: number;          // Default: 5
  processIntervalMs: number;    // Default: 1000
  requestTimeoutMs: number;     // Default: 30000
  retryConfig: RetryConfig;
  dlqMaxSize: number;          // Default: 10000
}
```

## Event Filtering

Events can be filtered by:

- **Event Types** - Specific event types to subscribe to
- **Threat Levels** - critical, high, medium, low
- **Severity** - critical, high, medium, low, info
- **Sources** - Event source indicators
- **Date Range** - Start and end timestamps

## Webhook Headers

### Generated Headers

```
X-BlockStop-Signature: <hmac-sha256-signature>
X-BlockStop-Timestamp: <unix-timestamp>
X-BlockStop-Nonce: <random-nonce>
X-BlockStop-Event-ID: <event-id>
X-BlockStop-Event-Type: <event-type>
X-BlockStop-Delivery-Attempt: <attempt-number>
```

## Dead Letter Queue (DLQ)

Failed deliveries are moved to DLQ after max retries exceeded:

- Configurable max size
- Event replay capability
- DLQ event listing
- Event history tracking

## Signature Verification Example

```typescript
// Webhook receiver code
import { PayloadSigner } from '@/lib/webhooks';

export async function handleWebhook(req: NextRequest) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const webhookSecret = process.env.WEBHOOK_SECRET!;

  const result = PayloadSigner.verifyDelivery(
    payload,
    headers,
    webhookSecret
  );

  if (!result.valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(payload);
  // Process event
  return new Response('OK', { status: 200 });
}
```

## Metrics and Monitoring

```typescript
// Get comprehensive statistics
const metrics = webhookManager.getMetrics();
{
  totalWebhooks: 150,
  totalOrganizations: 25,
  eventTypesTracked: 7,
  totalEvents: 50000,
  overallSuccessRate: 97.5,
}

// Get organization statistics
const orgStats = webhookManager.getOrgStats('org_123');
{
  webhookCount: 5,
  activeWebhooks: 4,
  totalEvents: 1000,
  successRate: 98.5,
}
```

## Best Practices

1. **Always verify signatures** - Verify webhook signatures before processing
2. **Idempotent processing** - Handle duplicate deliveries gracefully
3. **Graceful degradation** - Webhook failures should not impact main operations
4. **Monitor DLQ** - Regularly check and replay DLQ events
5. **Test webhooks** - Use test endpoint before production
6. **Rotate secrets** - Periodically rotate webhook secrets
7. **Filter events** - Use filters to reduce unnecessary deliveries
8. **Set appropriate retry limits** - Balance delivery attempts with resource usage

## Performance Considerations

- **Queue Concurrency** - Configurable concurrent deliveries (default: 5)
- **Event Store** - Configurable retention (purgeOldEvents)
- **DLQ Size** - Configurable max size to prevent memory issues
- **Batch Operations** - Support for efficient batch processing
- **Indexing** - Event type indexing for fast routing

## Error Handling

Retryable errors:
- 408 Request Timeout
- 429 Too Many Requests
- 500+ Server Errors
- Network timeouts/failures

Non-retryable errors:
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found

## Database Integration

The framework is designed to work with PostgreSQL:

```sql
-- Webhook storage
CREATE TABLE webhooks (
  id VARCHAR(32) PRIMARY KEY,
  org_id VARCHAR(32) NOT NULL,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  secret TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event delivery tracking
CREATE TABLE webhook_deliveries (
  id VARCHAR(36) PRIMARY KEY,
  webhook_id VARCHAR(32) NOT NULL,
  event_id VARCHAR(36) NOT NULL,
  status VARCHAR(20),
  attempt_number INTEGER,
  status_code INTEGER,
  response_time INTEGER,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dead letter queue
CREATE TABLE webhook_dlq (
  id VARCHAR(36) PRIMARY KEY,
  webhook_id VARCHAR(32) NOT NULL,
  event_data JSONB,
  failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Integration with Bull Queue (Optional)

For production environments, integrate with Bull queue:

```typescript
import Queue from 'bull';

const webhookQueue = new Queue('webhook-deliveries', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

webhookQueue.process(5, async (job) => {
  // Processing logic
});
```

## Testing

```typescript
import { webhookUtils, eventPublisher } from '@/lib/webhooks';

// Generate test payload
const testPayload = webhookUtils.generateTestPayload('threat.detected');

// Publish test event
const result = await eventPublisher.publishEvent(testPayload);

// Verify success
expect(result.webhooksQueued).toBeGreaterThan(0);
```

## License

Part of BlockStop Phase 16 Framework
