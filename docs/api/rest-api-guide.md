# BlockStop REST API Guide

## Overview

The BlockStop REST API provides a comprehensive interface for integrating threat detection, incident response, and security automation into your enterprise infrastructure. This guide covers all available endpoints, authentication methods, and best practices.

**API Version**: v1  
**Base URL**: `https://api.blockstop.io/v1`  
**Rate Limit**: 1000 requests/hour per API key

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Keys Management](#api-keys-management)
4. [OAuth2 Flow](#oauth2-flow)
5. [Webhooks](#webhooks)
6. [Integrations](#integrations)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)

---

## Getting Started

### Prerequisites

- BlockStop account with API access enabled
- API key or OAuth2 credentials
- Familiarity with REST APIs and HTTP

### Making Your First Request

```bash
curl -X GET https://api.blockstop.io/v1/health \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

---

## Authentication

BlockStop supports three authentication methods:

### 1. API Key Authentication (Recommended)

API keys are the simplest way to authenticate API requests.

```bash
curl -X GET https://api.blockstop.io/v1/api-keys/list \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Security Best Practices:**
- Store API keys in environment variables
- Never commit keys to version control
- Rotate keys regularly (every 90 days)
- Use different keys for development and production
- Restrict key scopes to minimum required permissions

### 2. OAuth2 (For User-Facing Applications)

Use OAuth2 for applications that need user authorization.

#### Authorization Code Flow

```
GET /auth/oauth2/authorize?
  client_id=your_client_id&
  redirect_uri=https://yourapp.com/callback&
  response_type=code&
  scope=read%20write&
  state=random_state_value
```

#### Token Exchange

```bash
curl -X POST https://api.blockstop.io/v1/auth/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE",
    "redirect_uri": "https://yourapp.com/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret"
  }'
```

### 3. JWT Bearer Tokens

Enterprise customers can use JWT tokens with custom claims.

```bash
curl -X GET https://api.blockstop.io/v1/api-keys/list \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## API Keys Management

### List API Keys

Retrieve all API keys for the authenticated user.

**Request:**
```bash
curl -X GET https://api.blockstop.io/v1/api-keys/list \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Query Parameters:**
- `limit` (optional): Number of keys to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "keys": [
    {
      "id": "key_1",
      "name": "Production Integration",
      "key_prefix": "sk_live_4eC39HqLyjWDarh",
      "scopes": ["api_keys:read", "webhooks:write"],
      "created_at": "2024-01-15T10:30:00Z",
      "last_used_at": "2024-06-18T14:20:00Z",
      "expires_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Create API Key

Create a new API key with specified scopes.

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/api-keys/create \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "scopes": ["api_keys:read", "webhooks:write", "integrations:read"],
    "expires_in": 31536000,
    "description": "For production threat detection integration"
  }'
```

**Request Parameters:**
- `name` (required): Display name for the key
- `scopes` (required): Array of permission scopes
- `expires_in` (optional): Expiry time in seconds (max 31536000 = 1 year)
- `description` (optional): Key description

**Available Scopes:**
- `api_keys:read` - List API keys
- `api_keys:write` - Create and revoke API keys
- `webhooks:read` - List and view webhooks
- `webhooks:write` - Create and manage webhooks
- `integrations:read` - List integrations
- `integrations:write` - Connect and configure integrations
- `threats:read` - View threat data
- `threats:write` - Create and manage threats
- `analytics:read` - Access analytics data

**Response:**
```json
{
  "id": "key_2",
  "name": "Production Integration",
  "key": "sk_live_REDACTED_FOR_SECURITY",
  "key_prefix": "sk_live_REDACTED",
  "scopes": ["api_keys:read", "webhooks:write"],
  "created_at": "2024-06-18T15:00:00Z",
  "expires_at": "2025-06-18T15:00:00Z"
}
```

**Important:** The full API key is only returned when created. Store it securely.

### Revoke API Key

Deactivate an API key immediately.

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/api-keys/revoke \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_id": "key_1",
    "reason": "Security rotation"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "key_id": "key_1",
  "revoked_at": "2024-06-18T15:30:00Z"
}
```

---

## OAuth2 Flow

### 1. Authorization Endpoint

Redirects users to grant your application access.

**Request:**
```
GET /auth/oauth2/authorize?
  client_id=your_client_id&
  redirect_uri=https://yourapp.com/oauth/callback&
  response_type=code&
  scope=read%20write&
  state=abc123&
  code_challenge=E9Mrozoa2owUedPyoapXXQPSO2R3XQBmyB9g7mRK5gg&
  code_challenge_method=S256
```

**Parameters:**
- `client_id` (required): Your application's client ID
- `redirect_uri` (required): Where to redirect after authorization
- `response_type` (required): "code" or "token"
- `scope` (required): Requested permissions
- `state` (recommended): CSRF protection token
- `code_challenge` (recommended): PKCE code challenge
- `code_challenge_method` (optional): "S256" or "plain"

### 2. Token Endpoint

Exchange authorization code for access token.

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/auth/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "auth_code_from_authorize",
    "redirect_uri": "https://yourapp.com/oauth/callback",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "code_verifier": "E9Mrozoa2owUedPyoapXXQPSO2R3XQBmyB9g7mRK5gg"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_value",
  "scope": "read write"
}
```

### 3. Refresh Token

Obtain a new access token without user interaction.

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/auth/token/refresh \
  -H "Authorization: Bearer current_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "refresh_token_value",
    "grant_type": "refresh_token"
  }'
```

**Response:**
```json
{
  "access_token": "new_access_token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new_refresh_token",
  "scope": "read write"
}
```

### 4. Token Revocation

Invalidate access and refresh tokens.

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/auth/token/revoke \
  -H "Authorization: Bearer access_token_to_revoke" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "access_token_to_revoke",
    "token_type_hint": "access_token"
  }'
```

---

## Webhooks

### List Webhooks

**Request:**
```bash
curl -X GET https://api.blockstop.io/v1/webhooks/list \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Query Parameters:**
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset (default: 0)
- `active`: Filter by active status (true/false)

**Response:**
```json
{
  "webhooks": [
    {
      "id": "wh_1",
      "url": "https://example.com/webhooks/threats",
      "events": ["threat.detected", "threat.resolved"],
      "active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "last_triggered_at": "2024-06-18T14:20:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Create Webhook

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/webhooks/create \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhooks/threats",
    "events": ["threat.detected", "threat.resolved"],
    "description": "Main threat detection webhook",
    "active": true,
    "headers": {
      "X-Custom-Header": "value"
    }
  }'
```

**Available Events:**
- `threat.detected` - New threat detected
- `threat.resolved` - Threat resolved
- `file.scanned` - File scan completed
- `email.checked` - Email check completed
- `integration.connected` - Integration connected
- `integration.disconnected` - Integration disconnected
- `api_key.created` - API key created
- `api_key.revoked` - API key revoked

**Response:**
```json
{
  "id": "wh_2",
  "url": "https://example.com/webhooks/threats",
  "events": ["threat.detected"],
  "active": true,
  "created_at": "2024-06-18T15:00:00Z",
  "signing_secret": "whsec_1234567890"
}
```

**Important:** Store the `signing_secret` securely. You'll need it to verify webhook signatures.

### Update Webhook

**Request:**
```bash
curl -X PATCH https://api.blockstop.io/v1/webhooks/wh_1/update \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://newurl.example.com/webhooks",
    "events": ["threat.detected", "file.scanned"],
    "active": true
  }'
```

### Test Webhook

Send a test webhook event.

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/webhooks/test \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": "wh_1",
    "event_type": "threat.detected"
  }'
```

**Response:**
```json
{
  "success": true,
  "delivery_id": "del_12345",
  "webhook_id": "wh_1",
  "event": "threat.detected",
  "status": "pending",
  "message": "Test webhook dispatched successfully"
}
```

### Delete Webhook

**Request:**
```bash
curl -X DELETE https://api.blockstop.io/v1/webhooks/wh_1/delete \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

### Webhook Payload Structure

All webhooks follow this structure:

```json
{
  "id": "evt_abc123",
  "event": "threat.detected",
  "timestamp": "2024-06-18T14:20:00Z",
  "data": {
    "threat_id": "threat_xyz",
    "threat_type": "malware",
    "severity": "high",
    "source": "email",
    "detected_at": "2024-06-18T14:20:00Z"
  },
  "signature": "sha256=abcdef123456",
  "webhook_id": "wh_1"
}
```

### Verifying Webhook Signatures

Use the `X-Blockstop-Signature` header and `signing_secret`:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Integrations

### List Integrations

**Request:**
```bash
curl -X GET https://api.blockstop.io/v1/integrations/list \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Query Parameters:**
- `connected`: Filter by connection status (true/false)
- `include_available`: Include list of available integrations

**Response:**
```json
{
  "integrations": [
    {
      "id": "int_slack",
      "name": "Slack",
      "type": "communication",
      "status": "connected",
      "connected_at": "2024-01-15T10:30:00Z",
      "last_sync": "2024-06-18T14:20:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "available_integrations": [
    {
      "id": "slack",
      "name": "Slack",
      "description": "Send BlockStop notifications to Slack",
      "category": "communication"
    }
  ]
}
```

### Connect Integration

**For OAuth2 Integrations (Slack, Microsoft Teams):**

```bash
curl -X POST https://api.blockstop.io/v1/integrations/slack/connect \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Workspace"
  }'
```

The response will include an `authorization_url` to redirect users to.

**For API Key Integrations (Jira, Zendesk):**

```bash
curl -X POST https://api.blockstop.io/v1/integrations/jira/connect \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {
      "url": "https://company.atlassian.net",
      "email": "user@company.com",
      "api_token": "your_api_token"
    },
    "config": {
      "project_key": "SECURITY",
      "issue_type": "Bug"
    },
    "name": "Jira Security"
  }'
```

### Check Integration Status

**Request:**
```bash
curl -X GET https://api.blockstop.io/v1/integrations/slack/status \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Response:**
```json
{
  "id": "slack",
  "status": "connected",
  "connected_at": "2024-01-15T10:30:00Z",
  "last_sync": "2024-06-18T14:20:00Z",
  "health": {
    "status": "healthy",
    "last_check": "2024-06-18T14:25:00Z"
  },
  "sync_stats": {
    "last_successful_sync": "2024-06-18T14:20:00Z",
    "sync_count": 42,
    "items_synced": 1240,
    "errors": 0
  }
}
```

### Disconnect Integration

**Request:**
```bash
curl -X POST https://api.blockstop.io/v1/integrations/slack/disconnect \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "No longer needed",
    "revoke_access": true
  }'
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "error_code",
  "error_description": "Human readable description",
  "status": 400,
  "request_id": "req_abc123"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `202` - Accepted (async operation)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

- `invalid_request` - Malformed request
- `unauthorized` - Missing or invalid authentication
- `forbidden` - Insufficient permissions
- `not_found` - Resource not found
- `invalid_credentials` - Bad credentials
- `rate_limited` - Rate limit exceeded
- `server_error` - Internal server error

---

## Rate Limiting

API calls are rate limited to 1000 requests per hour per API key.

### Rate Limit Headers

Every response includes:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1624090800
```

When you hit the limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "rate_limited",
  "error_description": "Rate limit exceeded. Reset at 2024-06-18T15:00:00Z",
  "retry_after": 3600
}
```

### Best Practices

- Implement exponential backoff
- Cache responses when possible
- Use webhooks instead of polling
- Consider upgrading to Enterprise for higher limits

---

## Examples

See the `examples/` directory for complete code samples in JavaScript, Python, and cURL.
