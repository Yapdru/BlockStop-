# BlockStop REST API Guide

**API Version**: v1  
**Base URL**: `https://api.blockstop.io/api/v1`  
**Last Updated**: June 2026

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Threat Endpoints](#threat-endpoints)
4. [Scan Endpoints](#scan-endpoints)
5. [Organization Endpoints](#organization-endpoints)
6. [Team Endpoints](#team-endpoints)
7. [Webhook Endpoints](#webhook-endpoints)
8. [Integration Endpoints](#integration-endpoints)
9. [Error Handling](#error-handling)
10. [Batch Operations](#batch-operations)

---

## Authentication

BlockStop API supports multiple authentication methods:

### API Key Authentication

Include your API key in the `Authorization` header:

```bash
curl -X GET https://api.blockstop.io/api/v1/threats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### OAuth2 Bearer Token

```bash
curl -X GET https://api.blockstop.io/api/v1/threats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Getting an API Key

```bash
curl -X POST https://api.blockstop.io/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Key",
    "scopes": ["read:threats", "read:scans"],
    "expires_in_days": 365
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Integration Key",
    "key": "bsk_live_abc123def456",
    "secret": "bsk_secret_xyz789",
    "created_at": "2026-06-18T10:00:00Z",
    "expires_at": "2027-06-18T10:00:00Z"
  }
}
```

---

## Rate Limiting

Rate limits vary by tier:

| Tier | Requests/Min | Requests/Hour | Burst |
|------|--------------|---------------|-------|
| Free | 100 | 5,000 | 150 |
| Pro | 10,000 | 500,000 | 15,000 |
| Enterprise | 100,000 | 5,000,000 | 150,000 |

Rate limit headers in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1687095660
```

When rate limit is exceeded (HTTP 429):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "timestamp": "2026-06-18T10:05:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Threat Endpoints

### List Threats

**GET** `/threats`

Query Parameters:
- `page` (number, default: 1)
- `per_page` (number, default: 20, max: 100)
- `threat_type` (string) - Filter by type
- `severity` (string) - Filter by severity
- `status` (string) - Filter by status

```bash
curl -X GET "https://api.blockstop.io/api/v1/threats?severity=high" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "threat_type": "phishing",
      "severity": "high",
      "source": "email",
      "detected_at": "2026-06-18T10:00:00Z",
      "status": "active",
      "indicators": ["sender@malicious.com", "http://phishing.site"]
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Create Threat

**POST** `/threats`

Request body:
```json
{
  "threat_type": "phishing",
  "source": "email",
  "severity": "high",
  "description": "Phishing email targeting HR department",
  "indicators": ["sender@malicious.com"]
}
```

Response (HTTP 201):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "threat_type": "phishing",
    "source": "email",
    "severity": "high",
    "created_at": "2026-06-18T10:05:00Z",
    "status": "active"
  }
}
```

### Get Threat Details

**GET** `/threats/:id`

```bash
curl -X GET https://api.blockstop.io/api/v1/threats/123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "threat_type": "phishing",
    "source": "email",
    "severity": "high",
    "status": "active",
    "detected_at": "2026-06-18T10:00:00Z",
    "indicators": ["sender@malicious.com"],
    "affected_users": 5,
    "confidence_score": 0.98
  }
}
```

### Update Threat

**PUT** `/threats/:id`

Request body:
```json
{
  "severity": "critical",
  "status": "remediated"
}
```

### Delete Threat

**DELETE** `/threats/:id`

---

## Scan Endpoints

### List Scans

**GET** `/scans`

```bash
curl -X GET "https://api.blockstop.io/api/v1/scans?status=completed" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Create Scan

**POST** `/scans`

Request body:
```json
{
  "scan_type": "email",
  "email_address": "user@company.com",
  "priority": "high"
}
```

Response (HTTP 201):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "scan_type": "email",
    "status": "queued",
    "created_at": "2026-06-18T10:05:00Z",
    "estimated_completion": "2026-06-18T10:15:00Z"
  }
}
```

### Get Scan Results

**GET** `/scans/:id/results`

```bash
curl -X GET https://api.blockstop.io/api/v1/scans/456/results \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "success": true,
  "data": {
    "scan_id": 456,
    "status": "completed",
    "threats_detected": 3,
    "results": [
      {
        "threat_type": "phishing",
        "severity": "high",
        "confidence": 0.95
      }
    ],
    "completed_at": "2026-06-18T10:15:00Z"
  }
}
```

### Delete Scan

**DELETE** `/scans/:id`

---

## Organization Endpoints

### List Organizations

**GET** `/organizations`

### Create Organization

**POST** `/organizations`

Request body:
```json
{
  "name": "Acme Corp",
  "description": "Security team for Acme",
  "tier": "pro"
}
```

### Get Organization Details

**GET** `/organizations/:id`

### Update Organization

**PUT** `/organizations/:id`

### Get Organization Statistics

**GET** `/organizations/:id/stats`

Response:
```json
{
  "success": true,
  "data": {
    "org_id": 789,
    "total_threats_detected": 1234,
    "total_scans": 5678,
    "threats_this_month": 234,
    "scans_this_month": 567,
    "critical_threats": 12,
    "average_scan_time_ms": 2500
  }
}
```

---

## Webhook Endpoints

### List Webhooks

**GET** `/webhooks`

### Register Webhook

**POST** `/webhooks`

Request body:
```json
{
  "url": "https://your-system.com/blockstop/webhooks",
  "events": ["threat.detected", "scan.completed", "alert.triggered"]
}
```

Response (HTTP 201):
```json
{
  "success": true,
  "data": {
    "id": 101,
    "url": "https://your-system.com/blockstop/webhooks",
    "events": ["threat.detected", "scan.completed"],
    "secret": "whsec_live_abc123",
    "is_active": true,
    "created_at": "2026-06-18T10:00:00Z"
  }
}
```

### Test Webhook

**POST** `/webhooks/:id/test`

Response:
```json
{
  "success": true,
  "data": {
    "status": "success",
    "status_code": 200,
    "delivery_time_ms": 125,
    "event_type": "threat.detected"
  }
}
```

### Update Webhook

**PUT** `/webhooks/:id`

### Delete Webhook

**DELETE** `/webhooks/:id`

---

## Integration Endpoints

### List Available Integrations

**GET** `/integrations`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "slack",
      "name": "Slack",
      "category": "communication",
      "description": "Send threats to Slack channels",
      "version": "1.0.0",
      "rating": 4.8,
      "installed": true
    }
  ]
}
```

### Connect Integration

**POST** `/integrations/:id/connect`

Request body:
```json
{
  "config": {
    "webhook_url": "https://hooks.slack.com/services/...",
    "channel": "#security-alerts"
  }
}
```

Response (HTTP 201):
```json
{
  "success": true,
  "data": {
    "id": 202,
    "integration_type": "slack",
    "status": "connected",
    "connected_at": "2026-06-18T10:00:00Z",
    "health_status": "healthy"
  }
}
```

### Check Integration Status

**GET** `/integrations/:id/status`

### Get Integration Health

**GET** `/integrations/:id/health`

Response:
```json
{
  "success": true,
  "data": {
    "integration_id": 202,
    "health_status": "healthy",
    "last_sync": "2026-06-18T10:05:00Z",
    "latency_ms": 125,
    "error_count": 0,
    "success_count": 234
  }
}
```

### Disconnect Integration

**DELETE** `/integrations/:id`

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "error details"
    },
    "timestamp": "2026-06-18T10:05:00Z",
    "request_id": "req_abc123xyz789"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| BAD_REQUEST | 400 | Invalid request parameters |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Server error |

---

## Batch Operations

### Batch Request

**POST** `/batch`

Send multiple requests in a single API call:

```json
{
  "requests": [
    {
      "method": "GET",
      "path": "/threats",
      "body": null
    },
    {
      "method": "POST",
      "path": "/scans",
      "body": {
        "scan_type": "email",
        "email_address": "user@company.com"
      }
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "status": 200,
      "body": { "success": true, "data": [...] }
    },
    {
      "status": 201,
      "body": { "success": true, "data": {...} }
    }
  ]
}
```

---

## Best Practices

1. **API Keys**: Store keys securely in environment variables
2. **Rate Limiting**: Implement exponential backoff for retries
3. **Webhooks**: Validate webhook signatures using HMAC-SHA256
4. **Error Handling**: Always check the `success` field
5. **Pagination**: Use cursor-based pagination for large datasets
6. **Monitoring**: Track rate limit headers to anticipate limits

---

## Support

For API support, contact: api-support@blockstop.io
