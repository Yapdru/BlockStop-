import { Request, Response, NextFunction } from 'express';
import { jwtHandler } from './jwt-handler';
import { apiKeyManager } from './api-key-manager';
import { tokenManager } from './token-manager';
import { oauth2Server } from './oauth2-server';
import { scopeValidator, PermissionScope } from './scope-validator';
import { auditLogger } from './audit-logger';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  email?: string;
  scopes?: PermissionScope[];
  authMethod?: 'api-key' | 'jwt' | 'oauth2' | 'session';
  clientId?: string;
}

export class AuthMiddleware {
  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    if (req.headers['x-api-key']) {
      return req.headers['x-api-key'] as string;
    }

    // Check query parameter (less secure, but common)
    if (req.query.token) {
      return req.query.token as string;
    }

    return null;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress;
  }

  /**
   * Authenticate request (supports JWT, API Key, OAuth2)
   */
  authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token = this.extractToken(req);
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'];

    if (!token) {
      res.status(401).json({ error: 'Missing authentication token' });
      return;
    }

    // Try JWT first
    const jwtPayload = jwtHandler.verifyAccessToken(token);
    if (jwtPayload) {
      req.userId = jwtPayload.userId;
      req.email = jwtPayload.email;
      req.scopes = jwtPayload.scopes;
      req.authMethod = 'jwt';
      req.clientId = jwtPayload.clientId;

      await auditLogger.logAuthEvent(
        'auth.login',
        req.userId,
        'JWT token authenticated',
        'success',
        {},
        ipAddress,
        userAgent
      );

      next();
      return;
    }

    // Try API Key
    const apiKey = await apiKeyManager.validateAPIKey(token, ipAddress);
    if (apiKey) {
      req.userId = apiKey.userId;
      req.scopes = apiKey.scopes;
      req.authMethod = 'api-key';

      // Record usage
      await apiKeyManager.recordKeyUsage(apiKey.id, ipAddress);

      next();
      return;
    }

    // Try OAuth2 token
    const oauth2Validation = await oauth2Server.validateOAuth2Token(token);
    if (oauth2Validation.valid) {
      req.clientId = oauth2Validation.clientId;
      req.scopes = (oauth2Validation.scopes as PermissionScope[]) || [];
      req.authMethod = 'oauth2';

      await auditLogger.logOAuthEvent(
        'oauth.client_authenticated',
        0,
        oauth2Validation.clientId || '',
        'OAuth2 token authenticated',
        'success',
        {},
        ipAddress
      );

      next();
      return;
    }

    // Try token manager validation (DB lookup)
    const tokenValidation = await tokenManager.validateAccessToken(token);
    if (tokenValidation.valid && tokenValidation.userId) {
      req.userId = tokenValidation.userId;
      req.scopes = (tokenValidation.scopes as PermissionScope[]) || [];
      req.authMethod = 'jwt';

      next();
      return;
    }

    // Authentication failed
    await auditLogger.logAuthEvent(
      'auth.login',
      undefined,
      'Authentication failed - invalid token',
      'failure',
      { tokenPrefix: token.substring(0, 10) },
      ipAddress,
      userAgent
    );

    res.status(401).json({ error: 'Invalid or expired token' });
  };

  /**
   * Require specific scopes
   */
  requireScopes = (requiredScopes: PermissionScope[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.scopes) {
        res.status(403).json({ error: 'No scopes available' });
        return;
      }

      const hasAllScopes = scopeValidator.hasScopeAll(req.scopes, requiredScopes);

      if (!hasAllScopes) {
        await auditLogger.logPermissionEvent(
          'scope.permission_denied',
          req.userId || 0,
          requiredScopes.join(','),
          req.scopes,
          false,
          this.getClientIP(req)
        );

        res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScopes,
          available: req.scopes,
        });
        return;
      }

      await auditLogger.logPermissionEvent(
        'scope.permission_checked',
        req.userId || 0,
        requiredScopes.join(','),
        req.scopes,
        true,
        this.getClientIP(req)
      );

      next();
    };
  };

  /**
   * Require any of the specified scopes
   */
  requireAnyScopeOf = (scopes: PermissionScope[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.scopes) {
        res.status(403).json({ error: 'No scopes available' });
        return;
      }

      const hasAnyScope = scopeValidator.hasScopeAny(req.scopes, scopes);

      if (!hasAnyScope) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: scopes,
          available: req.scopes,
        });
        return;
      }

      next();
    };
  };

  /**
   * Require authentication and optional scopes
   */
  protected = (requiredScopes?: PermissionScope[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // First apply authentication
      this.authenticate(req, res, () => {
        // Then check scopes if required
        if (requiredScopes && requiredScopes.length > 0) {
          this.requireScopes(requiredScopes)(req, res, next);
        } else {
          next();
        }
      });
    };
  };

  /**
   * Rate limiting middleware
   */
  rateLimit = (limit: number, windowSeconds: number = 3600) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      const key = req.userId?.toString() || this.getClientIP(req) || 'unknown';
      const now = Date.now();

      const record = requests.get(key) || { count: 0, resetTime: now + windowSeconds * 1000 };

      if (now >= record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowSeconds * 1000;
      }

      record.count++;

      if (record.count > limit) {
        await auditLogger.logSecurityEvent(
          'ratelimit.threshold_exceeded',
          'Rate limit exceeded',
          'medium',
          { key, limit, windowSeconds },
          req.userId,
          this.getClientIP(req)
        );

        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
        return;
      }

      requests.set(key, record);

      // Add rate limit info to response headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      next();
    };
  };

  /**
   * HMAC signature validation
   */
  validateHMACSignature = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;

    if (!signature || !timestamp) {
      res.status(401).json({ error: 'Missing HMAC signature or timestamp' });
      return;
    }

    // Verify timestamp is recent (within 5 minutes)
    const signatureTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (Math.abs(now - signatureTime) > 5 * 60 * 1000) {
      res.status(401).json({ error: 'Request timestamp too old' });
      return;
    }

    // Signature validation would be done here
    // This is a placeholder for implementation
    next();
  };

  /**
   * Optional authentication (doesn't fail if no token)
   */
  optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token = this.extractToken(req);

    if (!token) {
      next();
      return;
    }

    // Try to authenticate but don't fail if it doesn't work
    const jwtPayload = jwtHandler.verifyAccessToken(token);
    if (jwtPayload) {
      req.userId = jwtPayload.userId;
      req.email = jwtPayload.email;
      req.scopes = jwtPayload.scopes;
      req.authMethod = 'jwt';
    } else {
      const apiKey = await apiKeyManager.validateAPIKey(token);
      if (apiKey) {
        req.userId = apiKey.userId;
        req.scopes = apiKey.scopes;
        req.authMethod = 'api-key';
      }
    }

    next();
  };

  /**
   * MFA verification middleware
   */
  requireMFA = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if user has MFA enabled
    // This is a placeholder - implement based on your DB schema
    const mfaEnabled = false; // TODO: Query from DB

    if (!mfaEnabled) {
      res.status(403).json({ error: 'MFA is required but not enabled' });
      return;
    }

    next();
  };
}

export const authMiddleware = new AuthMiddleware();
