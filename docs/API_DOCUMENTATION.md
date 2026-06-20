# BlockStop Enterprise API Documentation

## Overview

BlockStop provides comprehensive REST and GraphQL APIs for integrating threat detection and incident response capabilities into your enterprise security infrastructure.

**API Version**: v1  
**Base URL**: `https://api.blockstop.io/v1`  
**Authentication**: Bearer Token (API Key)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [API Response Format](#api-response-format)
4. [Threat Management](#threat-management)
5. [Webhooks](#webhooks)
6. [Integrations](#integrations)
7. [Batch Operations](#batch-operations)
8. [GraphQL](#graphql)
9. [Error Handling](#error-handling)
10. [SDKs](#sdks)

---

## Authentication

### API Key Management

All API requests require authentication using an API key. Generate API keys in the BlockStop admin panel.

#### Creating an API Key

```bash
curl -X POST https://api.blockstop.io/v1/api-keys \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "scopes": ["threats:read", "webhooks:write", "integrations:read"],
    "expiresIn": 365
  }'
```

#### API Key Scopes

- `threats:read` - List and view threats
- `threats:write` - Create and update threats
- `threats:delete` - Delete threats
- `webhooks:read` - List webhooks
- `webhooks:write` - Create and manage webhooks
- `integrations:read` - List integrations
- `integrations:write` - Create and manage integrations
- `api-keys:read` - List API keys
- `api-keys:write` - Create and revoke API keys
- `*` - Full access (use with caution)

#### Using API Keys

```bash
curl -H "Authorization: Bearer bs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  https://api.blockstop.io/v1/threats
```

### Tier-Based Rate Limits

| Tier | Requests/Min | Concurrent | Monthly |
|------|-------------|-----------|---------|
| Free | 100 | 5 | 10,000 |
| Pro | 10,000 | 50 | 1,000,000 |
| Enterprise | 100,000 | 500 | 10,000,000 |

---

## Rate Limiting

Rate limit information is provided in response headers:

```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9999
X-RateLimit-Reset: 1640000000
```

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "statusCode": 429,
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "threat-123",
    "type": "phishing",
    "severity": "high",
    "status": "open"
  },
  "meta": {
    "requestId": "req_12345",
    "timestamp": "2024-06-18T10:00:00Z",
    "duration": 145,
    "version": "v1"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required field: type",
    "statusCode": 400,
    "timestamp": "2024-06-18T10:00:00Z",
    "requestId": "req_12345"
  }
}
```

---

## Threat Management

### List Threats

```bash
GET /threats?limit=20&offset=0&severity=high&status=open
```

**Query Parameters:**
- `limit` (integer, max 100): Results per page
- `offset` (integer): Pagination offset
- `severity` (string): Filter by severity (critical, high, medium, low, info)
- `status` (string): Filter by status (open, investigating, remediated, false_positive)
- `sort` (string): Sort field
- `order` (string): asc or desc

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "threat-001",
        "type": "phishing",
        "severity": "high",
        "status": "open",
        "source": "email",
        "subject": "Suspicious Email",
        "indicators": ["malicious@example.com"],
        "timestamp": "2024-06-18T10:00:00Z",
        "detectedAt": "2024-06-18T10:00:00Z"
      }
    ],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Single Threat

```bash
GET /threats/{id}
```

### Create Threat

```bash
POST /threats
Content-Type: application/json

{
  "type": "phishing",
  "source": "email",
  "subject": "Suspicious Email",
  "senderEmail": "attacker@example.com",
  "indicators": ["url1", "url2"]
}
```

### Update Threat

```bash
PUT /threats/{id}
Content-Type: application/json

{
  "status": "investigating",
  "severity": "critical"
}
```

### Delete Threat

```bash
DELETE /threats/{id}
```

---

## Webhooks

### Register Webhook

```bash
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/blockstop",
  "eventTypes": ["threat.detected", "threat.updated"],
  "secret": "optional-secret-key"
}
```

**Event Types:**
- `threat.detected` - New threat detected
- `threat.updated` - Threat status/severity updated
- `threat.remediated` - Threat has been remediated
- `scan.completed` - Email/file scan completed

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook-123",
    "url": "https://your-app.com/webhooks/blockstop",
    "eventTypes": ["threat.detected", "threat.updated"],
    "active": true,
    "createdAt": "2024-06-18T10:00:00Z"
  }
}
```

### Webhook Event Payload

```json
{
  "id": "event-456",
  "webhookId": "webhook-123",
  "eventType": "threat.detected",
  "timestamp": "2024-06-18T10:00:00Z",
  "payload": {
    "threat": {
      "id": "threat-001",
      "type": "phishing",
      "severity": "high",
      "source": "email",
      "indicators": ["malicious@example.com"]
    }
  }
}
```

### Webhook Signature Verification

Each webhook is signed with an HMAC-SHA256 signature. Verify it using the secret:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}
```

### List Webhooks

```bash
GET /webhooks
```

### Update Webhook

```bash
PUT /webhooks/{id}
Content-Type: application/json

{
  "eventTypes": ["threat.detected"],
  "active": false
}
```

### Test Webhook

```bash
POST /webhooks/{id}/test
```

### Delete Webhook

```bash
DELETE /webhooks/{id}
```

---

## Integrations

### List Integrations

```bash
GET /integrations?type=siem&enabled=true
```

### Get Available Templates

```bash
GET /integrations/templates?type=siem
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "template-splunk",
        "name": "Splunk",
        "type": "siem",
        "description": "Send BlockStop threats to Splunk",
        "requiredFields": [
          {
            "name": "apiEndpoint",
            "type": "string",
            "label": "Splunk API Endpoint",
            "required": true,
            "placeholder": "https://splunk.example.com:8089"
          },
          {
            "name": "apiKey",
            "type": "string",
            "label": "API Key",
            "required": true
          }
        ]
      }
    ]
  }
}
```

### Create Integration

```bash
POST /integrations
Content-Type: application/json

{
  "name": "My Splunk Instance",
  "type": "siem",
  "category": "splunk",
  "config": {
    "apiEndpoint": "https://splunk.example.com:8089",
    "apiKey": "xxx",
    "index": "blockstop_threats"
  }
}
```

### Test Integration

```bash
POST /integrations/{id}/test
```

### Update Integration

```bash
PUT /integrations/{id}
Content-Type: application/json

{
  "enabled": true,
  "config": {
    "index": "new_index"
  }
}
```

---

## Batch Operations

Process multiple requests in a single API call:

```bash
POST /batch
Content-Type: application/json

{
  "requests": [
    {
      "id": "req-1",
      "method": "GET",
      "path": "/threats/threat-001"
    },
    {
      "id": "req-2",
      "method": "POST",
      "path": "/threats",
      "body": {
        "type": "malware",
        "source": "file"
      }
    }
  ],
  "sequential": false,
  "stopOnError": false
}
```

---

## GraphQL

### Endpoint

```
POST https://api.blockstop.io/graphql
```

### Example Query

```graphql
query {
  threats(limit: 10, severity: HIGH) {
    items {
      id
      type
      severity
      status
      source
      timestamp
      indicators
      analysis {
        spamScore
        phishingScore
      }
    }
  }
}
```

### Example Mutation

```graphql
mutation {
  createThreat(
    type: PHISHING
    source: "email"
    subject: "Suspicious Email"
  ) {
    id
    type
    severity
    status
  }
}
```

---

## Error Handling

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid API key |
| INVALID_API_KEY | 401 | API key not found or expired |
| INSUFFICIENT_SCOPES | 403 | API key lacks required scopes |
| VALIDATION_FAILED | 400 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit reached |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_SERVER_ERROR | 500 | Server error |

---

## SDKs

### Python

```bash
pip install blockstop-sdk
```

```python
from blockstop import BlockStop

client = BlockStop(api_key="bs_xxx")

# List threats
threats = client.threats.list(severity="high")

# Create threat
threat = client.threats.create(
    type="phishing",
    source="email",
    subject="Suspicious Email"
)

# Register webhook
webhook = client.webhooks.create(
    url="https://your-app.com/webhooks",
    event_types=["threat.detected"]
)
```

### JavaScript/TypeScript

```bash
npm install blockstop-sdk
```

```typescript
import BlockStop from 'blockstop-sdk';

const client = new BlockStop({ apiKey: 'bs_xxx' });

// List threats
const threats = await client.threats.list({ severity: 'high' });

// Create threat
const threat = await client.threats.create({
  type: 'phishing',
  source: 'email',
  subject: 'Suspicious Email'
});

// Register webhook
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhooks',
  eventTypes: ['threat.detected']
});
```

---

## Support

- **Documentation**: https://docs.blockstop.io
- **API Status**: https://status.blockstop.io
- **Support**: https://support.blockstop.io
- **Email**: api@blockstop.io
