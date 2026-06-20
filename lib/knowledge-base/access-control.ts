import { AccessLevel } from './types';
import { ERROR_MESSAGES } from './constants';

export interface Permission {
  userId: string;
  documentId: string;
  accessLevel: AccessLevel;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: Set<string>;
  description: string;
}

export class AccessControl {
  private permissions: Map<string, Permission[]> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, Set<string>> = new Map();

  async grantAccess(
    userId: string,
    documentId: string,
    accessLevel: AccessLevel,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<Permission> {
    const permission: Permission = {
      userId,
      documentId,
      accessLevel,
      grantedAt: new Date(),
      grantedBy,
      expiresAt,
    };

    const key = this.getPermissionKey(documentId, userId);
    const permissions = this.permissions.get(key) || [];

    const existingIndex = permissions.findIndex(p => p.userId === userId);
    if (existingIndex >= 0) {
      permissions[existingIndex] = permission;
    } else {
      permissions.push(permission);
    }

    this.permissions.set(key, permissions);
    return permission;
  }

  async revokeAccess(documentId: string, userId: string): Promise<boolean> {
    const key = this.getPermissionKey(documentId, userId);
    return this.permissions.delete(key);
  }

  async checkAccess(
    userId: string,
    documentId: string,
    requiredLevel: AccessLevel
  ): Promise<boolean> {
    const permission = await this.getPermission(userId, documentId);

    if (!permission) return false;
    if (permission.expiresAt && permission.expiresAt < new Date()) {
      await this.revokeAccess(documentId, userId);
      return false;
    }

    return this.hasRequiredLevel(permission.accessLevel, requiredLevel);
  }

  async getPermission(userId: string, documentId: string): Promise<Permission | null> {
    const key = this.getPermissionKey(documentId, userId);
    const permissions = this.permissions.get(key) || [];
    return permissions.find(p => p.userId === userId) || null;
  }

  async getDocumentPermissions(documentId: string): Promise<Permission[]> {
    const allPermissions: Permission[] = [];

    this.permissions.forEach((perms, key) => {
      if (key.startsWith(documentId)) {
        allPermissions.push(...perms);
      }
    });

    return allPermissions;
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const allPermissions: Permission[] = [];

    this.permissions.forEach(perms => {
      const userPerms = perms.filter(p => p.userId === userId);
      allPermissions.push(...userPerms);
    });

    return allPermissions;
  }

  async createRole(name: string, description: string, permissions: string[]): Promise<Role> {
    const role: Role = {
      id: `role_${name.toLowerCase()}`,
      name,
      permissions: new Set(permissions),
      description,
    };

    this.roles.set(role.id, role);
    return role;
  }

  async getRole(roleId: string): Promise<Role | null> {
    return this.roles.get(roleId) || null;
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const role = this.roles.get(roleId);
    if (!role) throw new Error('Role not found');

    const updated: Role = {
      ...role,
      ...updates,
      id: role.id,
    };

    this.roles.set(roleId, updated);
    return updated;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) throw new Error('Role not found');

    const userRoles = this.userRoles.get(userId) || new Set();
    userRoles.add(roleId);
    this.userRoles.set(userId, userRoles);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const userRoles = this.userRoles.get(userId);
    if (userRoles) {
      userRoles.delete(roleId);
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = this.userRoles.get(userId) || new Set();
    return Array.from(roleIds)
      .map(id => this.roles.get(id))
      .filter((r): r is Role => r !== undefined);
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);

    for (const role of userRoles) {
      if (role.permissions.has(permission)) {
        return true;
      }
    }

    return false;
  }

  async grantPermissionToRole(roleId: string, permission: string): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) throw new Error('Role not found');

    role.permissions.add(permission);
  }

  async revokePermissionFromRole(roleId: string, permission: string): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) throw new Error('Role not found');

    role.permissions.delete(permission);
  }

  async cleanupExpiredPermissions(): Promise<number> {
    const now = new Date();
    let removedCount = 0;

    this.permissions.forEach((perms, key) => {
      const filtered = perms.filter(p => {
        if (p.expiresAt && p.expiresAt < now) {
          removedCount++;
          return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        this.permissions.delete(key);
      } else {
        this.permissions.set(key, filtered);
      }
    });

    return removedCount;
  }

  async getAccessReport(): Promise<{
    totalPermissions: number;
    totalRoles: number;
    usersWithAccess: number;
    expiredPermissions: number;
  }> {
    const now = new Date();
    let expiredCount = 0;
    const usersSet = new Set<string>();

    this.permissions.forEach(perms => {
      perms.forEach(p => {
        usersSet.add(p.userId);
        if (p.expiresAt && p.expiresAt < now) {
          expiredCount++;
        }
      });
    });

    return {
      totalPermissions: Array.from(this.permissions.values()).reduce((sum, p) => sum + p.length, 0),
      totalRoles: this.roles.size,
      usersWithAccess: usersSet.size,
      expiredPermissions: expiredCount,
    };
  }

  private getPermissionKey(documentId: string, userId: string): string {
    return `${documentId}:${userId}`;
  }

  private hasRequiredLevel(granted: AccessLevel, required: AccessLevel): boolean {
    const levelHierarchy: Record<AccessLevel, number> = {
      [AccessLevel.PUBLIC]: 1,
      [AccessLevel.INTERNAL]: 2,
      [AccessLevel.RESTRICTED]: 3,
      [AccessLevel.PRIVATE]: 4,
    };

    return levelHierarchy[granted] >= levelHierarchy[required];
  }
}
