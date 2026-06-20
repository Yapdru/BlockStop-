import { query } from '@/lib/db';
import { rbacEngine } from './rbac-engine';

export interface ResourcePermission {
  resourceId: string;
  permission: string;
  roleId?: string;
  userId?: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface ResourceACL {
  resourceId: string;
  owner: string;
  permissions: ResourcePermission[];
}

export class ResourcePermissions {
  /**
   * Grant permission on a resource to a user
   */
  async grantPermission(
    resourceId: string,
    userId: string,
    permission: string,
    expiresAt?: Date
  ): Promise<ResourcePermission> {
    try {
      // Get current user ID for 'granted by' field
      const currentUserId = process.env.SYSTEM_USER_ID || 'system';

      // Verify resource exists
      const resourceCheck = await query(
        'SELECT id FROM resources WHERE id = $1',
        [resourceId]
      );

      if (resourceCheck.rows.length === 0) {
        throw new Error(`Resource ${resourceId} does not exist`);
      }

      // Verify user exists
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error(`User ${userId} does not exist`);
      }

      const result = await query(
        `INSERT INTO resource_permissions (resource_id, user_id, permission, granted_at, granted_by, expires_at)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         ON CONFLICT (resource_id, user_id, permission) DO UPDATE
         SET expires_at = EXCLUDED.expires_at, granted_at = NOW()
         RETURNING resource_id as "resourceId", permission, user_id as "userId",
                   granted_at as "grantedAt", granted_by as "grantedBy", expires_at as "expiresAt"`,
        [resourceId, userId, permission, currentUserId, expiresAt || null]
      );

      return {
        resourceId: result.rows[0].resourceId,
        permission: result.rows[0].permission,
        userId: result.rows[0].userId,
        grantedAt: new Date(result.rows[0].grantedAt),
        grantedBy: result.rows[0].grantedBy,
        expiresAt: result.rows[0].expiresAt ? new Date(result.rows[0].expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Error granting permission:', error);
      throw new Error('Failed to grant resource permission');
    }
  }

  /**
   * Revoke permission on a resource from a user
   */
  async revokePermission(
    resourceId: string,
    userId: string,
    permission: string
  ): Promise<void> {
    try {
      await query(
        `DELETE FROM resource_permissions
         WHERE resource_id = $1 AND user_id = $2 AND permission = $3`,
        [resourceId, userId, permission]
      );
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw new Error('Failed to revoke resource permission');
    }
  }

  /**
   * Get the access control list for a resource
   */
  async getResourceACL(resourceId: string): Promise<ResourceACL> {
    try {
      // Get resource owner
      const resourceResult = await query(
        `SELECT owner_id as "ownerId"
         FROM resources
         WHERE id = $1`,
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      const owner = resourceResult.rows[0].ownerId;

      // Get permissions
      const permResult = await query(
        `SELECT resource_id as "resourceId", permission, user_id as "userId",
                role_id as "roleId", granted_at as "grantedAt",
                granted_by as "grantedBy", expires_at as "expiresAt"
         FROM resource_permissions
         WHERE resource_id = $1
         ORDER BY granted_at DESC`,
        [resourceId]
      );

      const permissions: ResourcePermission[] = permResult.rows.map(row => ({
        resourceId: row.resourceId,
        permission: row.permission,
        userId: row.userId,
        roleId: row.roleId,
        grantedAt: new Date(row.grantedAt),
        grantedBy: row.grantedBy,
        expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      }));

      return {
        resourceId,
        owner,
        permissions,
      };
    } catch (error) {
      console.error('Error fetching resource ACL:', error);
      throw new Error('Failed to retrieve resource ACL');
    }
  }

  /**
   * Check if a user has access to perform an action on a resource
   */
  async checkResourceAccess(
    userId: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    try {
      // Check if user is the resource owner
      const ownerCheck = await query(
        `SELECT id FROM resources WHERE id = $1 AND owner_id = $2`,
        [resourceId, userId]
      );

      if (ownerCheck.rows.length > 0) {
        return true; // Owner has all permissions
      }

      // Check for direct user permission
      const result = await query(
        `SELECT COUNT(*) > 0 as has_access
         FROM resource_permissions
         WHERE resource_id = $1 AND user_id = $2 AND permission = $3
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [resourceId, userId, action]
      );

      if (result.rows[0].has_access) {
        return true;
      }

      // Check for role-based permission
      const roles = await rbacEngine.getUserRoles(userId);
      for (const role of roles) {
        const rolePermCheck = await query(
          `SELECT COUNT(*) > 0 as has_access
           FROM resource_permissions rp
           WHERE rp.resource_id = $1 AND rp.role_id = $2 AND rp.permission = $3
           AND (rp.expires_at IS NULL OR rp.expires_at > NOW())`,
          [resourceId, role.roleId, action]
        );

        if (rolePermCheck.rows[0].has_access) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  /**
   * List all resources a user has access to
   */
  async listUserResources(userId: string, action?: string): Promise<string[]> {
    try {
      let query_str = `
        SELECT DISTINCT r.id
        FROM resources r
        LEFT JOIN resource_permissions rp ON r.id = rp.resource_id
        WHERE r.owner_id = $1
      `;

      const params: any[] = [userId];

      if (action) {
        query_str += ` OR (rp.user_id = $1 AND rp.permission = $2
                          AND (rp.expires_at IS NULL OR rp.expires_at > NOW()))`;
        params.push(action);
      } else {
        query_str += ` OR (rp.user_id = $1 AND (rp.expires_at IS NULL OR rp.expires_at > NOW()))`;
      }

      query_str += ` ORDER BY r.id`;

      const result = await query(query_str, params);
      return result.rows.map(row => row.id);
    } catch (error) {
      console.error('Error listing user resources:', error);
      return [];
    }
  }

  /**
   * Transfer resource ownership to a new owner
   */
  async transferResourceOwnership(
    resourceId: string,
    newOwnerId: string
  ): Promise<void> {
    try {
      // Verify new owner exists
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1',
        [newOwnerId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error(`User ${newOwnerId} does not exist`);
      }

      // Transfer ownership
      const result = await query(
        `UPDATE resources
         SET owner_id = $1
         WHERE id = $2
         RETURNING id`,
        [newOwnerId, resourceId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      // Log the ownership transfer
      await query(
        `INSERT INTO audit_logs (resource_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          resourceId,
          'OWNERSHIP_TRANSFER',
          JSON.stringify({ newOwnerId }),
        ]
      );
    } catch (error) {
      console.error('Error transferring ownership:', error);
      throw new Error('Failed to transfer resource ownership');
    }
  }
}

// Export singleton instance
export const resourcePermissions = new ResourcePermissions();
