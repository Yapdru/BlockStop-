import { Request } from 'express';
import { GraphQLError } from 'graphql';

export interface AuthContext {
  userId?: string;
  organizationId?: string;
  apiKeyId?: string;
  scopes?: string[];
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RequestWithAuth extends Request {
  auth?: AuthContext;
}

/**
 * GraphQL Authentication Middleware
 * Validates JWT tokens and API keys from request headers
 */
export class GraphQLAuthMiddleware {
  /**
   * Extract and validate authentication from request
   */
  static async authenticate(req: RequestWithAuth): Promise<AuthContext> {
    const context: AuthContext = {};

    // Check for Bearer token (JWT)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const userData = this.verifyJWT(token);
      if (userData) {
        context.userId = userData.id;
        context.organizationId = userData.organizationId;
        context.user = userData;
      }
    }

    // Check for API Key
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const keyData = await this.verifyAPIKey(apiKey);
      if (keyData) {
        context.apiKeyId = keyData.id;
        context.organizationId = keyData.organizationId;
        context.scopes = keyData.scopes;
      }
    }

    // At least one auth method must be present
    if (!context.userId && !context.apiKeyId) {
      // Some operations allow anonymous access
      if (!this.isPublicOperation()) {
        throw new GraphQLError('Unauthorized: Missing authentication', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
    }

    return context;
  }

  /**
   * Verify JWT token
   */
  static verifyJWT(token: string): any {
    try {
      // In production, use proper JWT verification with RS256
      // This is a simplified example
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const decoded = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Verify expiration
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return null;
      }

      return decoded;
    } catch (err) {
      return null;
    }
  }

  /**
   * Verify API Key
   * In production, validate against database
   */
  static async verifyAPIKey(key: string): Promise<any> {
    try {
      // This would query the database in production
      // For now, return null - implement based on your data store
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Check if operation is public (doesn't require auth)
   */
  static isPublicOperation(): boolean {
    // Define which operations are public
    return false;
  }

  /**
   * Create context object for GraphQL resolvers
   */
  static async createContext(req: RequestWithAuth): Promise<any> {
    return {
      auth: await this.authenticate(req),
      req,
    };
  }

  /**
   * Require specific scope
   */
  static requireScope(requiredScope: string) {
    return (context: AuthContext) => {
      if (!context.scopes?.includes(requiredScope)) {
        throw new GraphQLError(
          `Unauthorized: Missing required scope: ${requiredScope}`,
          {
            extensions: { code: 'FORBIDDEN', scope: requiredScope },
          }
        );
      }
    };
  }

  /**
   * Require authentication
   */
  static requireAuth(context: AuthContext) {
    if (!context.userId && !context.apiKeyId) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
  }

  /**
   * Require organization membership
   */
  static requireOrganization(context: AuthContext, organizationId: string) {
    this.requireAuth(context);
    if (context.organizationId !== organizationId) {
      throw new GraphQLError('Unauthorized access to organization', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
  }

  /**
   * Check field-level permissions
   */
  static checkFieldPermission(
    context: AuthContext,
    field: string,
    requiredPermission: string
  ) {
    // Implement field-level access control
    const fieldPermissions: Record<string, string[]> = {
      'Threat.metadata': ['read:threats:metadata'],
      'Organization.billingInfo': ['read:billing'],
      'APIKey.secret': [], // Secret never accessible
    };

    const permissions = fieldPermissions[field] || [];
    if (permissions.length > 0 && !permissions.some(p => context.scopes?.includes(p))) {
      throw new GraphQLError(`Access denied to field: ${field}`, {
        extensions: { code: 'FORBIDDEN', field },
      });
    }
  }

  /**
   * Rate limit context
   */
  static getRateLimitKey(context: AuthContext): string {
    if (context.apiKeyId) {
      return `api-key:${context.apiKeyId}`;
    }
    if (context.userId) {
      return `user:${context.userId}`;
    }
    return 'anonymous';
  }
}

/**
 * Field-level permission resolver
 */
export const fieldPermission = (permission: string) => {
  return (parent: any, args: any, context: AuthContext) => {
    if (!context.scopes?.includes(permission)) {
      return null; // Or throw error based on policy
    }
    return parent;
  };
};
