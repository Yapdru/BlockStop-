import { query } from '@/lib/db';

export interface Role {
  roleId: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export class RBACEngine {
  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const result = await query(
        `SELECT DISTINCT r.id as "roleId", r.name, r.description,
                COALESCE(array_agg(p.permission) FILTER (WHERE p.permission IS NOT NULL), ARRAY[]::text[]) as permissions,
                r.created_at as "createdAt", r.updated_at as "updatedAt"
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
         GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at`,
        [userId]
      );

      return result.rows.map(row => ({
        roleId: row.roleId,
        name: row.name,
        description: row.description,
        permissions: row.permissions || [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw new Error('Failed to retrieve user roles');
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: string,
    roleId: string,
    expiresAt?: Date
  ): Promise<UserRoleAssignment> {
    try {
      // Check if role exists
      const roleCheck = await query(
        'SELECT id FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleCheck.rows.length === 0) {
        throw new Error(`Role ${roleId} does not exist`);
      }

      // Check if user exists
      const userCheck = await query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        throw new Error(`User ${userId} does not exist`);
      }

      const result = await query(
        `INSERT INTO user_roles (user_id, role_id, assigned_at, expires_at)
         VALUES ($1, $2, NOW(), $3)
         ON CONFLICT (user_id, role_id) DO UPDATE
         SET expires_at = EXCLUDED.expires_at, assigned_at = NOW()
         RETURNING user_id as "userId", role_id as "roleId", assigned_at as "assignedAt", expires_at as "expiresAt"`,
        [userId, roleId, expiresAt || null]
      );

      return {
        userId: result.rows[0].userId,
        roleId: result.rows[0].roleId,
        assignedAt: new Date(result.rows[0].assignedAt),
        expiresAt: result.rows[0].expiresAt ? new Date(result.rows[0].expiresAt) : undefined,
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      throw new Error('Failed to assign role to user');
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    try {
      await query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
      );
    } catch (error) {
      console.error('Error removing role:', error);
      throw new Error('Failed to remove role from user');
    }
  }

  /**
   * Create a new role
   */
  async createRole(
    name: string,
    description: string,
    permissions: string[]
  ): Promise<Role> {
    try {
      // Create the role
      const roleResult = await query(
        `INSERT INTO roles (name, description, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id as "roleId", name, description, created_at as "createdAt", updated_at as "updatedAt"`,
        [name, description]
      );

      const roleId = roleResult.rows[0].roleId;

      // Assign permissions to role
      if (permissions && permissions.length > 0) {
        for (const permission of permissions) {
          // Get or create permission
          const permResult = await query(
            `INSERT INTO permissions (permission, created_at)
             VALUES ($1, NOW())
             ON CONFLICT (permission) DO UPDATE SET permission = EXCLUDED.permission
             RETURNING id`,
            [permission]
          );

          // Link permission to role
          await query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT (role_id, permission_id) DO NOTHING`,
            [roleId, permResult.rows[0].id]
          );
        }
      }

      return {
        roleId,
        name: roleResult.rows[0].name,
        description: roleResult.rows[0].description,
        permissions,
        createdAt: new Date(roleResult.rows[0].createdAt),
        updatedAt: new Date(roleResult.rows[0].updatedAt),
      };
    } catch (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: string,
    updates: Partial<Role>
  ): Promise<Role> {
    try {
      const { name, description, permissions } = updates;

      // Update role metadata
      if (name || description) {
        await query(
          `UPDATE roles SET name = COALESCE($1, name),
                           description = COALESCE($2, description),
                           updated_at = NOW()
           WHERE id = $3`,
          [name || null, description || null, roleId]
        );
      }

      // Update permissions if provided
      if (permissions) {
        // Remove existing permissions
        await query(
          'DELETE FROM role_permissions WHERE role_id = $1',
          [roleId]
        );

        // Add new permissions
        for (const permission of permissions) {
          const permResult = await query(
            `INSERT INTO permissions (permission, created_at)
             VALUES ($1, NOW())
             ON CONFLICT (permission) DO UPDATE SET permission = EXCLUDED.permission
             RETURNING id`,
            [permission]
          );

          await query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT (role_id, permission_id) DO NOTHING`,
            [roleId, permResult.rows[0].id]
          );
        }
      }

      // Fetch and return updated role
      const result = await query(
        `SELECT id as "roleId", name, description,
                COALESCE(array_agg(p.permission) FILTER (WHERE p.permission IS NOT NULL), ARRAY[]::text[]) as permissions,
                created_at as "createdAt", updated_at as "updatedAt"
         FROM roles r
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE r.id = $1
         GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at`,
        [roleId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Role ${roleId} not found`);
      }

      const row = result.rows[0];
      return {
        roleId: row.roleId,
        name: row.name,
        description: row.description,
        permissions: row.permissions || [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      console.error('Error updating role:', error);
      throw new Error('Failed to update role');
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      // Delete role permissions
      await query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId]
      );

      // Delete user role assignments
      await query(
        'DELETE FROM user_roles WHERE role_id = $1',
        [roleId]
      );

      // Delete role
      await query(
        'DELETE FROM roles WHERE id = $1',
        [roleId]
      );
    } catch (error) {
      console.error('Error deleting role:', error);
      throw new Error('Failed to delete role');
    }
  }

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT COUNT(*) > 0 as has_permission
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1 AND p.permission = $2
         AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
        [userId, permission]
      );

      return result.rows[0].has_permission || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get all effective permissions for a user (merged from all roles)
   */
  async getEffectivePermissions(userId: string): Promise<string[]> {
    try {
      const result = await query(
        `SELECT DISTINCT p.permission
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
         ORDER BY p.permission`,
        [userId]
      );

      return result.rows.map(row => row.permission);
    } catch (error) {
      console.error('Error fetching effective permissions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const rbacEngine = new RBACEngine();
