/**
 * Authentication System Examples
 * Real-world usage examples for BlockStop Phase 16 auth system
 */

import express, { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from './auth-middleware';
import { tokenManager } from './token-manager';
import { apiKeyManager } from './api-key-manager';
import { oauth2Server } from './oauth2-server';
import { scopeValidator } from './scope-validator';
import { auditLogger } from './audit-logger';
import { jwtHandler } from './jwt-handler';

// ============================================================================
// Example 1: Express Server Setup with Authentication
// ============================================================================

export function setupAuthenticationRouter(): Router {
  const router = express.Router();
  const authMiddlewareInstance = authMiddleware;

  // Public endpoints
  router.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // TODO: Create user in database
      // const user = await createUser(email, password);

      // Create tokens for new user
      // const tokens = await tokenManager.createTokens(
      //   user.id,
      //   user.email,
      //   ['read:scans', 'read:reports'],
      //   { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      // );

      // res.json(tokens);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  router.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // TODO: Validate user credentials
      // const user = await validateUser(email, password);
      // if (!user) {
      //   return res.status(401).json({ error: 'Invalid credentials' });
      // }

      // Create tokens
      // const tokens = await tokenManager.createTokens(
      //   user.id,
      //   user.email,
      //   ['read:scans', 'write:scans', 'read:reports'],
      //   { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      // );

      // res.json(tokens);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  router.post('/auth/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // TODO: Get user by refresh token
      // const user = await getUserByRefreshToken(refreshToken);

      // const newToken = await tokenManager.refreshAccessToken(
      //   refreshToken,
      //   user.email,
      //   { ipAddress: req.ip }
      // );

      // res.json(newToken);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Protected endpoints
  router.post(
    '/auth/logout',
    authMiddlewareInstance.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (req.userId && token) {
          await tokenManager.revokeToken(token, req.userId);
        }
        res.json({ message: 'Logged out successfully' });
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  // API Key endpoints
  router.post(
    '/api-keys',
    authMiddlewareInstance.authenticate,
    authMiddlewareInstance.requireScopes(['admin:api-keys']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { name, scopes, expiresIn, rateLimit } = req.body;

        const apiKey = await apiKeyManager.createAPIKey(
          req.userId!,
          {
            name,
            scopes,
            expiresIn,
            rateLimit,
          },
          req.ip
        );

        res.json(apiKey);
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  router.get(
    '/api-keys',
    authMiddlewareInstance.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const keys = await apiKeyManager.getUserAPIKeys(req.userId!);
        res.json(keys);
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  router.delete(
    '/api-keys/:keyId',
    authMiddlewareInstance.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        await apiKeyManager.revokeAPIKey(req.params.keyId, req.userId!, req.ip);
        res.json({ message: 'API key revoked' });
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  router.post(
    '/api-keys/:keyId/rotate',
    authMiddlewareInstance.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const newKey = await apiKeyManager.rotateAPIKey(
          req.params.keyId,
          req.userId!,
          req.ip
        );
        res.json(newKey);
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  // OAuth2 endpoints
  router.post(
    '/oauth/authorize',
    authMiddlewareInstance.authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { clientId, redirectUri, scopes, state } = req.body;

        const code = await oauth2Server.createAuthorizationCode(
          clientId,
          req.userId!,
          redirectUri,
          scopes,
          req.ip
        );

        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.append('code', code);
        if (state) redirectUrl.searchParams.append('state', state);

        res.json({ redirectUrl: redirectUrl.toString() });
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  router.post('/oauth/token', async (req: Request, res: Response) => {
    try {
      const { grantType, clientId, clientSecret, code, redirectUri } = req.body;

      if (grantType === 'authorization_code') {
        const tokens = await oauth2Server.exchangeAuthorizationCode(
          clientId,
          clientSecret,
          code,
          redirectUri,
          req.ip
        );

        if (!tokens) {
          return res.status(400).json({ error: 'Invalid authorization code' });
        }

        res.json(tokens);
      } else if (grantType === 'client_credentials') {
        const tokens = await oauth2Server.issueClientCredentialsToken(
          clientId,
          clientSecret,
          req.body.scopes,
          req.ip
        );

        if (!tokens) {
          return res.status(400).json({ error: 'Invalid client credentials' });
        }

        res.json(tokens);
      } else {
        res.status(400).json({ error: 'Unsupported grant type' });
      }
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  // Audit log endpoints
  router.get(
    '/audit-logs',
    authMiddlewareInstance.authenticate,
    authMiddlewareInstance.requireScopes(['admin:audit']),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { limit = 100, offset = 0, eventType, status, severity } = req.query;

        const logs = await auditLogger.searchAuditLogs(
          {
            eventType: eventType as any,
            status: status as any,
            severity: severity as any,
          },
          parseInt(limit as string)
        );

        res.json(logs);
      } catch (error) {
        res.status(400).json({ error: String(error) });
      }
    }
  );

  // Protected endpoints with scope requirements
  router.get(
    '/scans',
    authMiddlewareInstance.authenticate,
    authMiddlewareInstance.requireScopes(['read:scans']),
    async (req: AuthenticatedRequest, res: Response) => {
      // Only users with read:scans scope can access this
      res.json({ scans: [] });
    }
  );

  router.post(
    '/scans',
    authMiddlewareInstance.authenticate,
    authMiddlewareInstance.requireScopes(['write:scans']),
    authMiddlewareInstance.rateLimit(100, 3600), // 100 requests per hour
    async (req: AuthenticatedRequest, res: Response) => {
      // Only users with write:scans scope can access this
      res.json({ scanId: '123' });
    }
  );

  return router;
}

// ============================================================================
// Example 2: Using with async utilities
// ============================================================================

export async function createUserAndTokens(
  userId: number,
  email: string,
  ipAddress?: string
) {
  // Create tokens with appropriate scopes based on user role
  const tokens = await tokenManager.createTokens(
    userId,
    email,
    ['read:scans', 'read:reports', 'read:threats'],
    {
      ipAddress,
      userAgent: 'Mozilla/5.0...',
    }
  );

  return tokens;
}

export async function validateAndUseAPIKey(
  apiKey: string,
  ipAddress?: string
) {
  const validatedKey = await apiKeyManager.validateAPIKey(apiKey, ipAddress);

  if (!validatedKey) {
    throw new Error('Invalid API key');
  }

  // Check scopes before proceeding
  if (!scopeValidator.hasScope(validatedKey.scopes, 'read:scans')) {
    throw new Error('API key lacks read:scans permission');
  }

  // Record the usage
  await apiKeyManager.recordKeyUsage(validatedKey.id, ipAddress);

  return validatedKey;
}

export async function startOAuth2Flow(
  clientId: string,
  redirectUri: string,
  userId: number
) {
  // Create authorization code
  const authCode = await oauth2Server.createAuthorizationCode(
    clientId,
    userId,
    redirectUri,
    ['read:scans', 'read:reports'],
  );

  // Return authorization code for client to exchange
  return {
    code: authCode,
    state: Math.random().toString(36).substring(7),
  };
}

export async function completeOAuth2Exchange(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
) {
  const tokens = await oauth2Server.exchangeAuthorizationCode(
    clientId,
    clientSecret,
    code,
    redirectUri
  );

  if (!tokens) {
    throw new Error('Failed to exchange authorization code');
  }

  return tokens;
}

// ============================================================================
// Example 3: Custom authorization logic
// ============================================================================

export async function checkUserPermissions(
  userId: number,
  requiredScope: string
): Promise<boolean> {
  // TODO: Get user scopes from database
  // const user = await getUserScopes(userId);

  // return scopeValidator.hasScope(user.scopes, requiredScope);
  return false;
}

export async function auditUserAction(
  userId: number,
  action: string,
  resourceType: string,
  resourceId: string,
  success: boolean,
  ipAddress?: string
) {
  await auditLogger.logEvent({
    eventType: 'admin.user_added',
    userId,
    action,
    status: success ? 'success' : 'failure',
    resourceType,
    resourceId,
    ipAddress,
    severity: success ? 'low' : 'high',
  });
}

export async function checkRateLimitStatus(
  userId: number
): Promise<{ remaining: number; limit: number; resetTime: Date }> {
  // This would query the rate_limits table
  // const stats = await query('SELECT * FROM rate_limits WHERE user_id = $1', [userId]);
  return {
    remaining: 95,
    limit: 100,
    resetTime: new Date(Date.now() + 3600000),
  };
}

// ============================================================================
// Example 4: Integration with database operations
// ============================================================================

export async function refreshUserSession(
  userId: number,
  email: string,
  refreshToken: string,
  ipAddress?: string
) {
  // Validate the refresh token
  const isValid = await tokenManager.validateRefreshToken(refreshToken);

  if (!isValid.valid) {
    throw new Error('Invalid refresh token');
  }

  // Get user's current scopes
  // const scopes = await getUserScopes(userId);

  // Create new access token
  const newTokens = await tokenManager.refreshAccessToken(
    refreshToken,
    email,
    { ipAddress }
  );

  if (!newTokens) {
    throw new Error('Failed to refresh token');
  }

  return newTokens;
}

export async function revokeAllUserTokens(userId: number) {
  const count = await tokenManager.revokeAllUserTokens(userId);

  await auditLogger.logAuthEvent(
    'auth.logout',
    userId,
    'All user tokens revoked',
    'success'
  );

  return { revokedCount: count };
}

export async function getUserSecurityStatus(userId: number) {
  const tokens = await tokenManager.getUserTokens(userId);
  const apiKeys = await apiKeyManager.getUserAPIKeys(userId);
  const stats = await tokenManager.getTokenStats(userId);

  return {
    activeTokens: stats.activeTokens,
    revokedTokens: stats.revokedTokens,
    expiredTokens: stats.expiredTokens,
    activeAPIKeys: apiKeys.filter((k) => k.isActive).length,
    totalAPIKeys: apiKeys.length,
    recentActivity: tokens.slice(0, 5),
  };
}

// ============================================================================
// Example 5: Error handling
// ============================================================================

export class AuthorizationHandler {
  async handleMissingScope(
    userId: number,
    requiredScope: string,
    ipAddress?: string
  ) {
    await auditLogger.logPermissionEvent(
      'scope.permission_denied',
      userId,
      requiredScope,
      [], // user's actual scopes
      false,
      ipAddress
    );

    const error = new Error(`Missing required scope: ${requiredScope}`);
    return { error };
  }

  async handleRateLimitExceeded(
    userId: number,
    ipAddress?: string,
    retryAfter: number = 3600
  ) {
    await auditLogger.logSecurityEvent(
      'ratelimit.threshold_exceeded',
      'Rate limit exceeded for user',
      'medium',
      { retryAfter },
      userId,
      ipAddress
    );

    return {
      error: 'Rate limit exceeded',
      retryAfter,
      statusCode: 429,
    };
  }

  async handleInvalidToken(
    tokenType: string,
    ipAddress?: string
  ) {
    await auditLogger.logSecurityEvent(
      'security.suspicious_activity',
      `Invalid ${tokenType} provided`,
      'high',
      {},
      undefined,
      ipAddress
    );

    return {
      error: 'Invalid token',
      statusCode: 401,
    };
  }
}

// ============================================================================
// Example 6: Cleanup jobs
// ============================================================================

export async function runAuthCleanupJobs() {
  console.log('Running authentication cleanup jobs...');

  // Clean up expired tokens
  const deletedTokens = await tokenManager.cleanupExpiredTokens();
  console.log(`Deleted ${deletedTokens} expired tokens`);

  // Get high severity audit events
  const highSeverityEvents = await auditLogger.getHighSeverityEvents(10);
  if (highSeverityEvents.length > 0) {
    console.log(`Found ${highSeverityEvents.length} high-severity events`);
    // TODO: Send alerts
  }

  console.log('Cleanup jobs completed');
}

// ============================================================================
// Example 7: Token introspection
// ============================================================================

export async function inspectToken(token: string) {
  const decoded = jwtHandler.decodeToken(token);

  if (!decoded) {
    return { valid: false, error: 'Invalid token format' };
  }

  const isExpired = jwtHandler.isTokenExpired(token);
  const timeToExpiry = jwtHandler.getTimeToExpiry(token);

  return {
    valid: !isExpired,
    isExpired,
    timeToExpiry,
    payload: decoded,
  };
}

export async function getTokenInfo(token: string) {
  const validation = await tokenManager.validateAccessToken(token);

  if (!validation.valid) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: validation.userId,
    scopes: validation.scopes,
    decoded: jwtHandler.decodeToken(token),
  };
}
