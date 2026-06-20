# BlockStop REST API v1 Documentation

## Overview

BlockStop REST API v1 provides enterprise-grade endpoints for threat detection, vulnerability scanning, and organization management. All endpoints are production-ready with comprehensive error handling, rate limiting, and authentication.

**API Base URL:** `https://api.blockstop.dev/api/v1`

## Authentication

All API requests require Bearer token authentication using an API Key.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.blockstop.dev/api/v1/threats
```

### Scopes

API Keys require specific scopes to access endpoints:

- `threats:read` - Read threat data
- `threats:write` - Create and modify threats
- `threats:delete` - Delete threats
- `scans:read` - Read scan results
- `scans:write` - Create and manage scans
- `scans:delete` - Delete scans
- `orgs:read` - Read organization data
- `orgs:write` - Manage organization settings
- `orgs:delete` - Delete organizations
- `teams:read` - Read team data
- `teams:write` - Manage teams
- `teams:delete` - Delete teams

## Rate Limiting

Rate limits vary by tier:

| Tier | Limit | Window |
|------|-------|--------|
| Free | 100 requests | 1 minute |
| Pro | 10,000 requests | 1 minute |
| Enterprise | 100,000 requests | 1 minute |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait when rate limited (429 responses)

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-06-18T10:30:00Z",
    "version": "v1",
    "rateLimit": {
      "limit": 10000,
      "remaining": 9999,
      "reset": 1718701800
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": {
      "name": ["Missing required field: name"]
    },
    "statusCode": 400,
    "timestamp": "2026-06-18T10:30:00Z",
    "requestId": "req_..."
  }
}
```

## Endpoints

### Threats

#### List Threats
```
GET /api/v1/threats
```

Query Parameters:
- `limit` (integer, default 50): Items per page
- `offset` (integer, default 0): Pagination offset
- `type` (string): Filter by threat type
- `severity` (string): Filter by severity
- `active` (boolean): Filter by active status
- `search` (string): Search in name/description
- `sort` (string, default 'createdAt'): Sort field
- `order` (string, default 'desc'): asc or desc

Response:
```json
{
  "items": [ { threat objects } ],
  "cursor": "...",
  "hasMore": false,
  "total": 42,
  "pageSize": 50
}
```

#### Get Threat
```
GET /api/v1/threats/:id
```

Returns single threat object.

#### Create Threat
```
POST /api/v1/threats
```

Request Body:
```json
{
  "name": "Emotet Banking Trojan",
  "type": "trojan",
  "severity": "critical",
  "description": "Dangerous banking trojan...",
  "indicators": ["hash1", "hash2"],
  "metadata": { ... }
}
```

#### Update Threat
```
PUT /api/v1/threats/:id
```

Request Body: Same as create (all fields optional)

#### Delete Threat
```
DELETE /api/v1/threats/:id
```

#### Get Threat Detections
```
GET /api/v1/threats/:id/detections
```

Query Parameters: `limit`, `offset`

#### Get Threat Indicators
```
GET /api/v1/threats/:id/indicators
```

Returns array of threat IOCs.

#### Get Threat Statistics
```
GET /api/v1/threats/stats
```

Returns aggregated threat statistics.

### Scans

#### List Scans
```
GET /api/v1/scans
```

Query Parameters:
- `limit` (integer, default 50)
- `offset` (integer, default 0)
- `type` (string): email, file, domain, ip, url
- `status` (string): pending, running, completed, failed
- `priority` (string): low, medium, high, critical
- `threatLevel` (string): safe, suspicious, malicious

#### Get Scan
```
GET /api/v1/scans/:id
```

#### Create Scan
```
POST /api/v1/scans
```

Request Body:
```json
{
  "type": "email",
  "target": "user@example.com",
  "priority": "high",
  "options": { ... }
}
```

Supported types:
- `email` - Email address scanning
- `file` - File hash/content scanning
- `domain` - Domain reputation check
- `ip` - IP address analysis
- `url` - URL threat analysis

#### Bulk Create Scans
```
POST /api/v1/scans/bulk
```

Request Body:
```json
{
  "targets": [
    { "type": "email", "target": "test@example.com" },
    { "type": "url", "target": "https://example.com" }
  ]
}
```

Maximum 100 scans per request.

#### Get Scan Results
```
GET /api/v1/scans/:id/results
```

Returns:
```json
{
  "threatLevel": "malicious",
  "riskScore": 85,
  "detectedThreats": [ ... ],
  "summary": "URL contains phishing indicators..."
}
```

#### Delete Scan
```
DELETE /api/v1/scans/:id
```

#### Get Scan History
```
GET /api/v1/scans/:type/:target/history
```

Returns historical scans for specific target.

#### Get Scan Statistics
```
GET /api/v1/scans/stats
```

#### Get Scan Templates
```
GET /api/v1/scans/templates
```

Returns pre-configured scan templates.

### Organizations

#### List Organizations
```
GET /api/v1/organizations
```

Query Parameters:
- `limit` (integer, default 50)
- `offset` (integer, default 0)
- `tier` (string): free, pro, enterprise
- `status` (string): active, suspended, deleted
- `search` (string): Search in name

#### Get Organization
```
GET /api/v1/organizations/:id
```

#### Create Organization
```
POST /api/v1/organizations
```

Request Body:
```json
{
  "name": "Acme Corp",
  "description": "Security-first organization",
  "website": "https://acme.com",
  "industry": "Finance",
  "metadata": { ... }
}
```

#### Update Organization
```
PUT /api/v1/organizations/:id
```

Request Body: Same as create (all optional)

#### Delete Organization
```
DELETE /api/v1/organizations/:id
```

Only org owner can delete.

#### Get Organization Members
```
GET /api/v1/organizations/:id/members
```

#### Invite Member
```
POST /api/v1/organizations/:id/members/invite
```

Request Body:
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

Roles: `owner`, `admin`, `member`

#### Remove Member
```
DELETE /api/v1/organizations/:id/members/:memberId
```

#### Update Member Role
```
PUT /api/v1/organizations/:id/members/:memberId/role
```

Request Body:
```json
{
  "role": "admin"
}
```

#### Get Organization Settings
```
GET /api/v1/organizations/:id/settings
```

#### Update Organization Settings
```
PUT /api/v1/organizations/:id/settings
```

Request Body:
```json
{
  "dataRetention": 90,
  "enableWebhooks": true,
  "enforceSSO": false,
  "defaultScanPriority": "medium"
}
```

#### Get Organization Statistics
```
GET /api/v1/organizations/:id/stats
```

### Teams

#### List Teams
```
GET /api/v1/organizations/:orgId/teams
```

#### Get Team
```
GET /api/v1/organizations/:orgId/teams/:teamId
```

#### Create Team
```
POST /api/v1/organizations/:orgId/teams
```

Request Body:
```json
{
  "name": "Security Team",
  "description": "Primary security group",
  "maxMembers": 50
}
```

#### Update Team
```
PUT /api/v1/organizations/:orgId/teams/:teamId
```

#### Delete Team
```
DELETE /api/v1/organizations/:orgId/teams/:teamId
```

#### Get Team Members
```
GET /api/v1/organizations/:orgId/teams/:teamId/members
```

#### Add Team Member
```
POST /api/v1/organizations/:orgId/teams/:teamId/members
```

Request Body:
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "member"
}
```

#### Remove Team Member
```
DELETE /api/v1/organizations/:orgId/teams/:teamId/members/:memberId
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| INVALID_API_KEY | 401 | API key is invalid or expired |
| INSUFFICIENT_SCOPES | 403 | API key lacks required scopes |
| VALIDATION_FAILED | 400 | Request body validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |
| QUOTA_EXCEEDED | 429 | Daily/monthly quota exceeded |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_SERVER_ERROR | 500 | Server error |

## Pagination

List endpoints support cursor-based pagination:

```json
{
  "items": [ ... ],
  "cursor": "base64_encoded_cursor",
  "hasMore": true,
  "total": 1000,
  "pageSize": 50
}
```

Use the `cursor` value in next request to fetch next page.

## Examples

### Create a threat and get detections

```bash
# Create threat
curl -X POST https://api.blockstop.dev/api/v1/threats \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ransomware Campaign",
    "type": "ransomware",
    "severity": "critical",
    "indicators": ["hash1", "hash2"]
  }'

# Get threat (returns ID)
curl https://api.blockstop.dev/api/v1/threats/threat_123 \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get detections
curl https://api.blockstop.dev/api/v1/threats/threat_123/detections \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Scan an email and get results

```bash
# Create scan
RESPONSE=$(curl -X POST https://api.blockstop.dev/api/v1/scans \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "target": "suspicious@example.com",
    "priority": "high"
  }')

SCAN_ID=$(echo $RESPONSE | jq -r '.data.id')

# Poll for results
sleep 5
curl https://api.blockstop.dev/api/v1/scans/$SCAN_ID/results \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Manage organization members

```bash
# Create org
curl -X POST https://api.blockstop.dev/api/v1/organizations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Organization",
    "industry": "Finance"
  }'

# Invite member
curl -X POST https://api.blockstop.dev/api/v1/organizations/org_123/members/invite \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@company.com",
    "role": "admin"
  }'

# List members
curl https://api.blockstop.dev/api/v1/organizations/org_123/members \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Version History

### v1.0.0 (Current)
- Threat detection endpoints
- Scan management endpoints
- Organization management endpoints
- Team collaboration endpoints
- Rate limiting and quota management
- Full authentication and authorization

## Support

For API support, contact: api-support@blockstop.dev

## Security

- All endpoints use HTTPS only
- API Keys should be kept secure
- Rotate API Keys regularly
- Use minimal required scopes
- Implement request signing (HMAC) for critical operations
