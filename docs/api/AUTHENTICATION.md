# BlockStop API Authentication Guide

**Last Updated**: June 2026

## Overview

BlockStop API supports multiple authentication methods for different use cases:

- **API Keys**: Service-to-service authentication
- **OAuth2**: User delegation and third-party integrations
- **JWT Tokens**: Long-lived authentication
- **HMAC Signatures**: Request signing and verification

---

## API Key Authentication

### Best For
- Server-to-server communication
- Service integrations
- Automation and scripts
- Simple API access

### Creating an API Key

**Via API:**

```bash
curl -X POST https://api.blockstop.io/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_EXISTING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "scopes": ["read:threats", "read:scans", "write:webhooks"],
    "rate_limit": 10000,
    "expires_in_days": 365
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Production Integration",
    "key": "bsk_live_abc123def456ghi789",
    "secret": "bsk_secret_xyz789uvw456pqr123",
    "scopes": ["read:threats", "read:scans", "write:webhooks"],
    "rate_limit": 10000,
    "created_at": "2026-06-18T10:00:00Z",
    "expires_at": "2027-06-18T10:00:00Z"
  }
}
```

### Using an API Key

Include the API key in the Authorization header:

```bash
curl -X GET https://api.blockstop.io/api/v1/threats \
  -H "Authorization: Bearer bsk_live_abc123def456ghi789"
```

### Key Rotation

To rotate a key, revoke the old one and create a new one:

```bash
# Revoke old key
curl -X POST https://api.blockstop.io/api/v1/api-keys/123/revoke \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new key with same scopes
curl -X POST https://api.blockstop.io/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration (rotated)",
    "scopes": ["read:threats", "read:scans", "write:webhooks"],
    "rate_limit": 10000,
    "expires_in_days": 365
  }'
```

### Key Security

- Store keys in environment variables: `BLOCKSTOP_API_KEY=...`
- Never commit keys to version control
- Rotate keys quarterly
- Use separate keys for development/production
- Implement IP whitelisting for critical integrations

---

## OAuth2 Authentication

### Best For
- User-delegated access
- Third-party integrations
- Web applications
- Marketplace integrations

### Authorization Code Flow

**Step 1: Request Authorization**

Direct user to BlockStop authorization endpoint:

```
https://api.blockstop.io/api/v1/auth/oauth2/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://your-app.com/callback&
  response_type=code&
  scope=read:threats+write:scans+read:webhooks&
  state=random_state_value
```

**Step 2: User Grants Permission**

User sees BlockStop authorization screen and grants access to your application.

**Step 3: Handle Callback**

BlockStop redirects user back to your application with authorization code:

```
https://your-app.com/callback?
  code=auth_code_abc123&
  state=random_state_value
```

**Step 4: Exchange Code for Token**

Your backend exchanges the code for an access token:

```bash
curl -X POST https://api.blockstop.io/api/v1/auth/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "auth_code_abc123",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "https://your-app.com/callback"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "ref_token_xyz789",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:threats write:scans read:webhooks"
}
```

**Step 5: Use Access Token**

Include the access token in API requests:

```bash
curl -X GET https://api.blockstop.io/api/v1/threats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Client Credentials Flow

For service-to-service authentication without user involvement:

```bash
curl -X POST https://api.blockstop.io/api/v1/auth/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "scope": "read:threats write:scans"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:threats write:scans"
}
```

### Refresh Token

When access token expires, use refresh token to get a new one:

```bash
curl -X POST https://api.blockstop.io/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "ref_token_xyz789",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

### Revoke Token

Revoke access or refresh tokens:

```bash
curl -X POST https://api.blockstop.io/api/v1/auth/token/revoke \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN"
  }'
```

---

## JWT Bearer Tokens

### For
- Direct token-based authentication
- Service-to-service communication
- Custom authentication flows

### Using JWT Tokens

```bash
curl -X GET https://api.blockstop.io/api/v1/threats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JWT Claims

BlockStop JWT tokens include:

```json
{
  "iss": "https://blockstop.io",
  "sub": "user_123",
  "aud": "api",
  "iat": 1687095600,
  "exp": 1687099200,
  "org_id": 456,
  "scopes": ["read:threats", "write:scans"],
  "token_type": "access"
}
```

---

## Permission Scopes

### Available Scopes

| Scope | Description |
|-------|-------------|
| `read:threats` | Read threat data |
| `write:threats` | Create and modify threats |
| `delete:threats` | Delete threats |
| `read:scans` | Read scan data and results |
| `write:scans` | Create and run scans |
| `delete:scans` | Delete scans |
| `read:organizations` | Read organization data |
| `write:organizations` | Modify organization settings |
| `admin:organizations` | Manage organizations |
| `read:teams` | Read team data |
| `write:teams` | Create and manage teams |
| `admin:teams` | Manage team settings |
| `read:webhooks` | Read webhook configuration |
| `write:webhooks` | Create and modify webhooks |
| `delete:webhooks` | Delete webhooks |
| `read:integrations` | Read integration status |
| `write:integrations` | Connect integrations |
| `delete:integrations` | Disconnect integrations |
| `admin:api_keys` | Manage API keys |
| `admin:audit_logs` | Read audit logs |

### Request Scopes

Include space-separated scopes in authorization requests:

```
scope=read:threats+write:scans+read:webhooks
```

---

## HMAC Request Signing

### For
- Enhanced security for API requests
- Request integrity verification
- Webhook signature validation

### Signing Requests

**JavaScript Example:**

```javascript
const crypto = require('crypto');

function signRequest(method, path, body, apiSecret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(`${timestamp}.${method}.${path}.${JSON.stringify(body)}`)
    .digest('hex');

  return {
    'X-BlockStop-Timestamp': timestamp.toString(),
    'X-BlockStop-Signature': signature,
  };
}

const headers = signRequest('POST', '/api/v1/scans', {
  scan_type: 'email',
  email_address: 'user@company.com',
}, apiSecret);
```

---

## Security Best Practices

### 1. Secure Storage
```bash
# Store in environment variables
export BLOCKSTOP_API_KEY="bsk_live_abc123..."
export BLOCKSTOP_CLIENT_SECRET="secret_xyz789..."

# Load in application
const apiKey = process.env.BLOCKSTOP_API_KEY;
```

### 2. Token Expiration
- OAuth2 tokens expire in 1 hour
- API keys can be set to expire
- Always handle token refresh gracefully

### 3. Scope Minimization
- Request only necessary scopes
- Use read-only scopes where possible
- Separate keys for different services

### 4. IP Whitelisting
Create API key with IP restrictions:

```bash
curl -X POST https://api.blockstop.io/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Production API Key",
    "ip_whitelist": ["203.0.113.0/24", "198.51.100.5"],
    "scopes": ["read:threats"]
  }'
```

### 5. Regular Auditing
Monitor API access with audit logs:

```bash
curl -X GET https://api.blockstop.io/api/v1/audit-logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Error Messages
Never expose sensitive data in error messages:

```javascript
// Bad
throw new Error(`Auth failed for key: ${apiKey}`);

// Good
throw new Error('Authentication failed. Check your credentials.');
```

---

## Troubleshooting

### Invalid API Key
- Verify key format (should start with `bsk_live_` or `bsk_test_`)
- Check key hasn't expired
- Confirm key is for correct organization
- Verify key is active (not revoked)

### Token Expired
- Implement automatic token refresh
- Handle 401 Unauthorized responses
- Regenerate tokens when needed

### Insufficient Permissions
- Check scopes granted to token/key
- Request additional scopes if needed
- Verify user has required permissions

### Rate Limit Exceeded
- Implement exponential backoff retry
- Check rate limit headers
- Consider upgrading to higher tier

---

## Support

For authentication issues, contact: auth-support@blockstop.io
