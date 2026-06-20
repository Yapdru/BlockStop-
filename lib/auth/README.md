# BlockStop Phase 16: Authentication System

Comprehensive authentication and authorization system for BlockStop, supporting OAuth2, API Keys, JWT tokens, and comprehensive audit logging.

## Overview

This authentication system provides:

- **Multiple Authentication Methods**
  - API Keys (service-to-service)
  - OAuth2 (authorization code flow)
  - OAuth2 (client credentials for service accounts)
  - JWT Bearer tokens
  - HMAC signature validation

- **Token Management**
  - Access tokens (1 hour expiry)
  - Refresh tokens (7 days expiry)
  - Configurable API key expiry
  - Token revocation
  - Token refresh capability

- **Permission System**
  - Scope-based access control
  - Hierarchical permission scopes
  - Wildcard scope matching
  - Comprehensive scope validation

- **Security Features**
  - Rate limiting per API key
  - IP whitelist support
  - Token expiration
  - Automatic cleanup of expired tokens
  - Multi-factor authentication hooks
  - Comprehensive audit trail

- **Audit Logging**
  - Authentication events
  - Authorization events
  - API key operations
  - OAuth2 events
  - Security events
  - High-severity event tracking

## Architecture

```
lib/auth/
├── jwt-handler.ts           # JWT token creation and verification
├── scope-validator.ts       # Permission scope management
├── audit-logger.ts          # Comprehensive audit logging
├── api-key-manager.ts       # API key generation and validation
├── token-manager.ts         # Token CRUD operations
├── oauth2-server.ts         # OAuth2 implementation
├── auth-middleware.ts       # Express middleware for auth
└── README.md               # This file
```

## Permission Scopes

### Read Scopes
- `read:threats` - Read threat intelligence and patterns
- `read:scans` - Read scan results and history
- `read:reports` - Read generated reports
- `read:org` - Read organization settings

### Write Scopes
- `write:scans` - Create and manage scans
- `write:reports` - Create and manage reports
- `write:org` - Update organization settings

### Admin Scopes
- `admin:org` - Full organization administration (includes all scopes)
- `admin:users` - Manage organization users
- `admin:api-keys` - Manage API keys
- `admin:audit` - View audit logs
- `admin:integrations` - Manage integrations

### Management Scopes
- `webhook:manage` - Create and manage webhooks
- `api:manage` - Manage API settings

## Usage Examples

### JWT Token Authentication

```typescript
import { jwtHandler } from '@/lib/auth/jwt-handler';
import { tokenManager } from '@/lib/auth/token-manager';

// Create tokens for a user
const tokens = await tokenManager.createTokens(
  userId,
  userEmail,
  ['read:scans', 'write:scans'],
  { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
);

// Verify access token
const payload = jwtHandler.verifyAccessToken(tokens.accessToken);
if (payload) {
  console.log('User:', payload.userId);
  console.log('Scopes:', payload.scopes);
}

// Refresh tokens
const refreshed = await tokenManager.refreshAccessToken(
  tokens.refreshToken,
  userEmail
);
```

### API Key Management

```typescript
import { apiKeyManager } from '@/lib/auth/api-key-manager';

// Create API key
const apiKey = await apiKeyManager.createAPIKey(
  userId,
  {
    name: 'Scan Integration',
    scopes: ['read:scans', 'write:scans'],
    ipWhitelist: ['192.168.1.1', '192.168.1.2'],
    rateLimit: 1000, // requests per hour
    expiresIn: 31536000 // 1 year
  },
  ipAddress
);

console.log('New API Key:', apiKey.key); // Only printed once!

// Validate API key
const validKey = await apiKeyManager.validateAPIKey(apiKey.key, ipAddress);

// List user's API keys
const keys = await apiKeyManager.getUserAPIKeys(userId);

// Revoke API key
await apiKeyManager.revokeAPIKey(keyId, userId);

// Rotate API key
const newKey = await apiKeyManager.rotateAPIKey(oldKeyId, userId);
```

### OAuth2 Authorization Code Flow

```typescript
import { oauth2Server } from '@/lib/auth/oauth2-server';

// Step 1: Register OAuth2 client
const client = await oauth2Server.registerClient(
  'My Integration',
  ['http://localhost:3000/callback'],
  ['read:scans', 'write:scans'],
  false // isPublic
);

// Step 2: Create authorization code
const authCode = await oauth2Server.createAuthorizationCode(
  clientId,
  userId,
  'http://localhost:3000/callback',
  ['read:scans', 'write:scans'],
  ipAddress
);

// Step 3: Exchange code for tokens
const tokenResponse = await oauth2Server.exchangeAuthorizationCode(
  clientId,
  clientSecret,
  authCode,
  'http://localhost:3000/callback',
  ipAddress
);

// Use tokens
console.log('Access Token:', tokenResponse.accessToken);
console.log('Refresh Token:', tokenResponse.refreshToken);
console.log('Expires In:', tokenResponse.expiresIn);
```

### OAuth2 Client Credentials Flow

```typescript
// For service-to-service authentication
const tokenResponse = await oauth2Server.issueClientCredentialsToken(
  clientId,
  clientSecret,
  ['read:scans'],
  ipAddress
);
```

### Scope Validation

```typescript
import { scopeValidator } from '@/lib/auth/scope-validator';

// Check if user has scope
if (scopeValidator.hasScope(userScopes, 'write:scans')) {
  // Allow operation
}

// Check if user has any required scope
if (scopeValidator.hasScopeAny(userScopes, ['admin:org', 'admin:users'])) {
  // Allow operation
}

// Check if user has all required scopes
if (scopeValidator.hasScopeAll(userScopes, ['read:scans', 'write:scans'])) {
  // Allow operation
}

// Get scope description
const desc = scopeValidator.getScopeDescription('write:scans');
// Returns: "Create and manage scans"

// Expand scopes (with hierarchy)
const expanded = scopeValidator.expandScopes(['admin:org']);
// Returns all admin and read/write scopes
```

### Audit Logging

```typescript
import { auditLogger } from '@/lib/auth/audit-logger';

// Log authentication event
await auditLogger.logAuthEvent(
  'auth.login',
  userId,
  'User logged in',
  'success',
  {},
  ipAddress,
  userAgent
);

// Log API key event
await auditLogger.logApiKeyEvent(
  'apikey.created',
  userId,
  keyId,
  'API key created',
  'success',
  { name: 'Production Key', scopes: [...] },
  ipAddress
);

// Log OAuth2 event
await auditLogger.logOAuthEvent(
  'oauth.authorization_granted',
  userId,
  clientId,
  'Authorization granted',
  'success',
  { scopes: [...] },
  ipAddress
);

// Log security event
await auditLogger.logSecurityEvent(
  'security.suspicious_activity',
  'Multiple failed login attempts',
  'high',
  { attempts: 5, duration: '5m' },
  userId,
  ipAddress
);

// Get audit logs
const logs = await auditLogger.getUserAuditLogs(userId, 100, 0);

// Search audit logs
const results = await auditLogger.searchAuditLogs({
  eventType: 'auth.login',
  userId,
  status: 'failure',
  severity: 'high',
  dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
});
```

### Express Middleware

```typescript
import { authMiddleware } from '@/lib/auth/auth-middleware';
import express from 'express';

const app = express();

// Protected route with scope requirement
app.get(
  '/api/scans',
  authMiddleware.authenticate,
  authMiddleware.requireScopes(['read:scans']),
  (req, res) => {
    console.log('User:', req.userId);
    console.log('Scopes:', req.scopes);
    // Handle request
  }
);

// Rate limited endpoint
app.post(
  '/api/scans',
  authMiddleware.rateLimit(100, 3600), // 100 req/hour
  authMiddleware.requireScopes(['write:scans']),
  (req, res) => {
    // Handle request
  }
);

// Optional authentication
app.get(
  '/api/public-report',
  authMiddleware.optionalAuth,
  (req, res) => {
    if (req.userId) {
      // Authenticated
    } else {
      // Anonymous
    }
  }
);

// Require MFA
app.post(
  '/api/sensitive-operation',
  authMiddleware.authenticate,
  authMiddleware.requireMFA,
  (req, res) => {
    // Handle sensitive operation
  }
);
```

## Database Schema

The authentication system requires the following tables:

- `api_keys` - API key storage and metadata
- `tokens` - JWT and session tokens
- `oauth2_clients` - OAuth2 application registration
- `oauth2_auth_codes` - Authorization codes
- `oauth2_tokens` - Service account tokens
- `audit_logs` - Comprehensive audit trail
- `rate_limits` - Rate limiting tracking
- `ip_whitelist` - IP whitelist entries
- `hmac_secrets` - HMAC signing secrets
- `sessions` - Session management
- `mfa_methods` - MFA configuration

Run the schema migration:

```bash
psql $DATABASE_URL < database/schema/phase-16-auth-system.sql
```

## Security Best Practices

1. **Never log actual tokens** - Only log token hashes
2. **Store secrets hashed** - All secrets (API keys, OAuth secrets) are SHA256 hashed
3. **Use HTTPS only** - All authentication should use HTTPS in production
4. **Validate redirects** - Always validate OAuth2 redirect URIs against whitelist
5. **Rate limit aggressively** - Especially on authentication endpoints
6. **Monitor audit logs** - Set up alerts for high-severity events
7. **Rotate keys regularly** - Implement key rotation policy
8. **Use IP whitelisting** - For sensitive API keys
9. **Require MFA for admins** - Especially for admin:* scopes
10. **Clean up expired tokens** - Run cleanup job regularly

## Configuration

Environment variables:

```env
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
DATABASE_URL=postgresql://...
NODE_ENV=production
```

## API Endpoints (Example Implementation)

```typescript
// POST /api/v1/auth/tokens - Get tokens
// POST /api/v1/auth/refresh - Refresh tokens
// POST /api/v1/auth/logout - Revoke tokens

// POST /api/v1/api-keys - Create API key
// GET /api/v1/api-keys - List API keys
// DELETE /api/v1/api-keys/:id - Revoke API key
// POST /api/v1/api-keys/:id/rotate - Rotate API key

// POST /api/v1/oauth/authorize - Create auth code
// POST /api/v1/oauth/token - Exchange code for tokens
// DELETE /api/v1/oauth/authorize/:clientId - Revoke authorization

// GET /api/v1/audit-logs - List audit logs
// GET /api/v1/audit-logs/search - Search audit logs
```

## Maintenance

### Regular Tasks

1. **Clean up expired tokens** (daily)
   ```typescript
   await tokenManager.cleanupExpiredTokens();
   ```

2. **Monitor high-severity events** (continuous)
   ```typescript
   const events = await auditLogger.getHighSeverityEvents();
   ```

3. **Review API key usage** (weekly)
   ```typescript
   const keys = await apiKeyManager.getUserAPIKeys(userId);
   ```

4. **Rotate credentials** (quarterly)
   ```typescript
   await apiKeyManager.rotateAPIKey(oldKeyId, userId);
   ```

## Testing

```typescript
// Test JWT creation and verification
const token = jwtHandler.createAccessToken(1, 'user@example.com', ['read:scans']);
const verified = jwtHandler.verifyAccessToken(token);
assert(verified?.userId === 1);

// Test API key validation
const key = await apiKeyManager.createAPIKey(1, {
  name: 'Test Key',
  scopes: ['read:scans'],
  expiresIn: 3600
});
const validated = await apiKeyManager.validateAPIKey(key.key);
assert(validated?.id === key.id);

// Test scope validation
assert(scopeValidator.hasScope(['admin:org'], 'read:scans'));
assert(!scopeValidator.hasScope(['read:scans'], 'write:scans'));
```

## Troubleshooting

### Token Invalid After Creation
- Check JWT secrets are set correctly
- Verify token hasn't expired
- Check token hasn't been revoked

### API Key Not Validating
- Ensure API key hasn't been revoked
- Check IP address is whitelisted (if configured)
- Verify key hasn't expired

### Rate Limiting Issues
- Check rate limit configuration
- Monitor usage patterns
- Adjust limits based on needs

### Audit Log Queries Slow
- Ensure indexes are created
- Archive old logs periodically
- Use date range filters

## Future Enhancements

- [ ] WebAuthn/FIDO2 support
- [ ] Device trust/anomaly detection
- [ ] Passwordless authentication
- [ ] Risk-based authentication
- [ ] SSO integration (SAML/OIDC)
- [ ] Token introspection endpoint
- [ ] Enhanced rate limiting (adaptive)
- [ ] Decentralized identity support
