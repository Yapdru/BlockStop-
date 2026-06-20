import { query } from '@/lib/db';
import { rbacEngine } from './rbac-engine';
import { attributeAccessControl } from './attribute-access-control';
import { resourcePermissions } from './resource-permissions';
import { permissionCache } from './permission-cache';
import crypto from 'crypto';

export interface AccessDecision {
  allowed: boolean;
  accessToken?: string;
  expiresIn?: number;
  restrictions?: string[];
  reason?: string;
  requiresChallenge?: boolean;
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  context?: any;
  timestamp: Date;
}

const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour in seconds
const SESSION_TOKEN_EXPIRY = 86400; // 24 hours in seconds

export class AccessRequestEvaluator {
  /**
   * Evaluate an access request and return an access decision
   */
  async evaluateAccessRequest(
    userId: string,
    resource: string,
    action: string
  ): Promise<AccessDecision> {
    try {
      // Check cache first
      const cached = await permissionCache.getPermission(userId, resource, action);
      if (cached !== null) {
        return {
          allowed: cached,
          reason: 'Decision from cache',
        };
      }

      const restrictions: string[] = [];
      let allowed = false;
      let reason = '';

      // Step 1: Check if user exists and is active
      const userCheck = await query(
        'SELECT id, status FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        reason = 'User not found';
        await permissionCache.setPermission(userId, resource, action, false);
        return { allowed: false, reason };
      }

      const user = userCheck.rows[0];
      if (user.status !== 'active') {
        reason = `User status is ${user.status}`;
        await permissionCache.setPermission(userId, resource, action, false);
        return { allowed: false, reason };
      }

      // Step 2: Check attribute-based access control policies
      const aacDecision = await attributeAccessControl.evaluatePolicy(
        userId,
        resource,
        action
      );

      if (!aacDecision.allowed) {
        reason = aacDecision.reason || 'Failed attribute-based access control';
        await permissionCache.setPermission(userId, resource, action, false);
        return { allowed: false, reason };
      }

      // Step 3: Check resource-level permissions
      const resourceAccess = await resourcePermissions.checkResourceAccess(
        userId,
        resource,
        action
      );

      if (!resourceAccess) {
        reason = 'No resource-level permission';
        await permissionCache.setPermission(userId, resource, action, false);
        return { allowed: false, reason };
      }

      // Step 4: Check RBAC permissions
      const hasPermission = await rbacEngine.checkPermission(
        userId,
        `${resource}:${action}`
      );

      if (!hasPermission) {
        reason = 'No role-based permission';
        await permissionCache.setPermission(userId, resource, action, false);
        return { allowed: false, reason };
      }

      // Step 5: Evaluate attribute conditions
      const attrEval = await this.evaluateAttributeConditions(userId, resource);
      if (!attrEval.allowed) {
        reason = attrEval.reason || 'Failed attribute evaluation';
        await permissionCache.setPermission(userId, resource, action, false);
        return { allowed: false, reason };
      }

      // Step 6: Get resource requirements and restrictions
      const requirements = await this.getResourceRequirements(resource);
      if (requirements.oneTimeUse) {
        restrictions.push('ONE_TIME_USE');
      }

      // All checks passed - generate access token
      allowed = true;
      reason = 'Access granted';

      const accessToken = await this.generateAccessToken(
        userId,
        resource,
        action,
        {
          expiresIn: requirements.sessionTimeout,
          oneTimeUse: requirements.oneTimeUse,
        }
      );

      // Cache the positive decision
      await permissionCache.setPermission(userId, resource, action, true, ACCESS_TOKEN_EXPIRY);

      // Log the access request
      await this.logAccessRequest({
        userId,
        resource,
        action,
        context: { status: 'ALLOWED', restrictions },
        timestamp: new Date(),
      });

      return {
        allowed,
        accessToken,
        expiresIn: requirements.sessionTimeout || ACCESS_TOKEN_EXPIRY,
        restrictions: restrictions.length > 0 ? restrictions : undefined,
        reason,
      };
    } catch (error) {
      console.error('Error evaluating access request:', error);
      return {
        allowed: false,
        reason: 'Access evaluation error',
      };
    }
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(role: string): Promise<string[]> {
    try {
      const result = await query(
        `SELECT DISTINCT p.permission
         FROM roles r
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE r.name = $1 OR r.id = $1
         ORDER BY p.permission`,
        [role]
      );

      return result.rows.map(row => row.permission);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  }

  /**
   * Get resource requirements (timeout, one-time use, etc.)
   */
  async getResourceRequirements(resource: string): Promise<{
    sessionTimeout?: number;
    oneTimeUse?: boolean;
  }> {
    try {
      const result = await query(
        `SELECT session_timeout as "sessionTimeout", one_time_use as "oneTimeUse"
         FROM resource_requirements
         WHERE resource_id = $1`,
        [resource]
      );

      if (result.rows.length === 0) {
        return {
          sessionTimeout: ACCESS_TOKEN_EXPIRY,
          oneTimeUse: false,
        };
      }

      return {
        sessionTimeout: result.rows[0].sessionTimeout || ACCESS_TOKEN_EXPIRY,
        oneTimeUse: result.rows[0].oneTimeUse || false,
      };
    } catch (error) {
      console.error('Error fetching resource requirements:', error);
      return {
        sessionTimeout: ACCESS_TOKEN_EXPIRY,
        oneTimeUse: false,
      };
    }
  }

  /**
   * Generate an access token
   */
  async generateAccessToken(
    userId: string,
    resource: string,
    action: string,
    options: { expiresIn?: number; oneTimeUse?: boolean } = {}
  ): Promise<string> {
    try {
      const expiresIn = options.expiresIn || ACCESS_TOKEN_EXPIRY;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await query(
        `INSERT INTO access_tokens (token, user_id, resource_id, action, expires_at, one_time_use, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [token, userId, resource, action, expiresAt, options.oneTimeUse || false]
      );

      return token;
    } catch (error) {
      console.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Get access restrictions for a role and resource
   */
  async getAccessRestrictions(role: string, resource: string): Promise<string[]> {
    try {
      const result = await query(
        `SELECT DISTINCT restriction
         FROM role_restrictions
         WHERE (role_id = $1 OR role_name = $1)
         AND (resource_id = $2 OR resource_pattern = $2)`,
        [role, resource]
      );

      return result.rows.map(row => row.restriction);
    } catch (error) {
      console.error('Error fetching access restrictions:', error);
      return [];
    }
  }

  /**
   * Evaluate attribute conditions for a user and resource
   */
  private async evaluateAttributeConditions(
    userId: string,
    resource: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Fetch user attributes
      const userAttrs = await query(
        `SELECT attr_name as "name", attr_value as "value", attr_type as "type"
         FROM user_attributes
         WHERE user_id = $1`,
        [userId]
      );

      // Fetch resource attributes
      const resourceAttrs = await query(
        `SELECT attr_name as "name", attr_value as "value", attr_type as "type"
         FROM resource_attributes
         WHERE resource_id = $1`,
        [resource]
      );

      // Check if user attributes match resource requirements
      const userAttrMap = new Map(
        userAttrs.rows.map((row: any) => [row.name, row.value])
      );

      const requiredAttrs = resourceAttrs.rows.filter((row: any) =>
        row.name.startsWith('required_')
      );

      for (const required of requiredAttrs) {
        const attrName = required.name.replace('required_', '');
        if (!userAttrMap.has(attrName) || userAttrMap.get(attrName) !== required.value) {
          return {
            allowed: false,
            reason: `Missing or mismatched required attribute: ${attrName}`,
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error evaluating attribute conditions:', error);
      // On error, be conservative and allow if we can't evaluate
      return { allowed: true };
    }
  }

  /**
   * Log an access request for audit purposes
   */
  private async logAccessRequest(request: AccessRequest): Promise<void> {
    try {
      await query(
        `INSERT INTO access_logs (user_id, resource_id, action, context, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          request.userId,
          request.resource,
          request.action,
          JSON.stringify(request.context || {}),
          new Date(),
        ]
      );
    } catch (error) {
      console.error('Error logging access request:', error);
      // Don't throw - logging failures should not block access
    }
  }
}

// Export singleton instance
export const accessRequestEvaluator = new AccessRequestEvaluator();
