/**
 * BlockStop Phase 28.2 - Advanced RBAC (Role-Based Access Control)
 * Enterprise-grade role management with fine-grained permissions
 * Team hierarchy support and permission inheritance
 */

import { v4 as uuidv4 } from 'uuid';

export type PermissionScope = 'global' | 'organization' | 'team' | 'project' | 'resource';
export type PermissionAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'execute' | 'manage' | 'approve' | 'export'
  | 'audit' | 'configure' | 'share' | 'transfer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  scope: PermissionScope;
  action: PermissionAction;
  resourceType: string;
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionMapping {
  roleId: string;
  permissionId: string;
  grantedAt: Date;
  grantedBy: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  organizationId: string;
  teamId?: string;
  permissions: Permission[];
  permissionIds: string[];
  parentRoleId?: string; // For role hierarchy
  inheritsFrom?: Role[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface TeamHierarchy {
  teamId: string;
  parentTeamId?: string;
  childTeamIds: string[];
  level: number;
  path: string[]; // Full path from root
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  organizationId: string;
  teamId?: string;
  expiresAt?: Date;
  assignedAt: Date;
  assignedBy: string;
  conditions?: Record<string, any>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  conditions?: Record<string, any>;
  appliedRoles: string[];
}

export class RoleManager {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private rolePermissions: Map<string, Set<string>> = new Map();
  private userRoles: Map<string, RoleAssignment[]> = new Map();
  private teamHierarchy: Map<string, TeamHierarchy> = new Map();
  private organizationId: string;

  // System roles
  private readonly SYSTEM_ROLES = {
    SUPER_ADMIN: 'super-admin',
    ADMIN: 'admin',
    TEAM_LEAD: 'team-lead',
    MEMBER: 'member',
    VIEWER: 'viewer',
    GUEST: 'guest',
  };

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.initializeSystemRoles();
  }

  /**
   * Initialize system roles with default permissions
   */
  private initializeSystemRoles(): void {
    // Super Admin - Full access
    this.createSystemRole('super-admin', 'Super Administrator', 'Full system access');

    // Admin - Organization-wide management
    this.createSystemRole('admin', 'Administrator', 'Organization-wide management access');

    // Team Lead - Team management
    this.createSystemRole('team-lead', 'Team Lead', 'Team management and oversight');

    // Member - Regular user access
    this.createSystemRole('member', 'Team Member', 'Standard team member access');

    // Viewer - Read-only access
    this.createSystemRole('viewer', 'Viewer', 'Read-only access');

    // Guest - Limited access
    this.createSystemRole('guest', 'Guest', 'Limited guest access');
  }

  /**
   * Create a system role
   */
  private createSystemRole(id: string, name: string, description: string): void {
    const role: Role = {
      id,
      name,
      description,
      type: 'system',
      organizationId: this.organizationId,
      permissions: [],
      permissionIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      isActive: true,
    };
    this.roles.set(id, role);
    this.rolePermissions.set(id, new Set());
  }

  /**
   * Create a custom role
   */
  public createRole(
    name: string,
    description: string,
    organizationId: string,
    teamId?: string,
    parentRoleId?: string
  ): Role {
    const roleId = `role-${uuidv4()}`;
    const role: Role = {
      id: roleId,
      name,
      description,
      type: 'custom',
      organizationId,
      teamId,
      permissions: [],
      permissionIds: [],
      parentRoleId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      isActive: true,
    };

    this.roles.set(roleId, role);
    this.rolePermissions.set(roleId, new Set());

    // Handle inheritance
    if (parentRoleId && this.roles.has(parentRoleId)) {
      const parentPermissions = this.rolePermissions.get(parentRoleId);
      if (parentPermissions) {
        this.rolePermissions.set(roleId, new Set(parentPermissions));
      }
    }

    return role;
  }

  /**
   * Create a permission
   */
  public createPermission(
    name: string,
    description: string,
    scope: PermissionScope,
    action: PermissionAction,
    resourceType: string,
    conditions?: Record<string, any>
  ): Permission {
    const permissionId = `perm-${uuidv4()}`;
    const permission: Permission = {
      id: permissionId,
      name,
      description,
      scope,
      action,
      resourceType,
      conditions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.permissions.set(permissionId, permission);
    return permission;
  }

  /**
   * Assign permission to role
   */
  public assignPermissionToRole(roleId: string, permissionId: string): boolean {
    if (!this.roles.has(roleId) || !this.permissions.has(permissionId)) {
      return false;
    }

    const role = this.roles.get(roleId)!;
    const permission = this.permissions.get(permissionId)!;

    if (!role.permissionIds.includes(permissionId)) {
      role.permissionIds.push(permissionId);
      role.permissions.push(permission);
      this.rolePermissions.get(roleId)?.add(permissionId);
      role.updatedAt = new Date();
    }

    return true;
  }

  /**
   * Remove permission from role
   */
  public removePermissionFromRole(roleId: string, permissionId: string): boolean {
    if (!this.roles.has(roleId)) {
      return false;
    }

    const role = this.roles.get(roleId)!;
    const index = role.permissionIds.indexOf(permissionId);
    if (index > -1) {
      role.permissionIds.splice(index, 1);
      role.permissions = role.permissions.filter(p => p.id !== permissionId);
      this.rolePermissions.get(roleId)?.delete(permissionId);
      role.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Assign role to user
   */
  public assignRoleToUser(
    userId: string,
    roleId: string,
    organizationId: string,
    teamId?: string,
    expiresAt?: Date
  ): RoleAssignment | null {
    if (!this.roles.has(roleId)) {
      return null;
    }

    const assignmentId = `assign-${uuidv4()}`;
    const assignment: RoleAssignment = {
      id: assignmentId,
      userId,
      roleId,
      organizationId,
      teamId,
      expiresAt,
      assignedAt: new Date(),
      assignedBy: 'system',
    };

    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, []);
    }

    this.userRoles.get(userId)!.push(assignment);
    return assignment;
  }

  /**
   * Remove role from user
   */
  public removeRoleFromUser(userId: string, roleId: string): boolean {
    if (!this.userRoles.has(userId)) {
      return false;
    }

    const assignments = this.userRoles.get(userId)!;
    const index = assignments.findIndex(a => a.roleId === roleId);
    if (index > -1) {
      assignments.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get user's effective roles (including inherited and team roles)
   */
  public getUserRoles(userId: string, organizationId?: string): Role[] {
    const assignments = this.userRoles.get(userId) || [];
    const now = new Date();

    return assignments
      .filter(a => {
        if (organizationId && a.organizationId !== organizationId) {
          return false;
        }
        if (a.expiresAt && a.expiresAt < now) {
          return false;
        }
        return true;
      })
      .map(a => this.roles.get(a.roleId))
      .filter((r): r is Role => r !== undefined);
  }

  /**
   * Check if user has specific permission
   */
  public checkPermission(
    userId: string,
    permissionId: string,
    context?: Record<string, any>
  ): PermissionCheckResult {
    const userRoles = this.getUserRoles(userId);
    const appliedRoles: string[] = [];

    for (const role of userRoles) {
      if (role.permissionIds.includes(permissionId)) {
        appliedRoles.push(role.id);
        const permission = this.permissions.get(permissionId);

        // Check conditions if any
        if (permission?.conditions && context) {
          const conditionsMet = this.evaluateConditions(permission.conditions, context);
          if (!conditionsMet) {
            continue;
          }
        }

        return {
          allowed: true,
          appliedRoles,
        };
      }
    }

    return {
      allowed: false,
      reason: 'User does not have the required permission',
      appliedRoles,
    };
  }

  /**
   * Check if user has any permission with action
   */
  public hasPermissionAction(
    userId: string,
    action: PermissionAction,
    resourceType: string,
    scope?: PermissionScope
  ): boolean {
    const userRoles = this.getUserRoles(userId);

    for (const role of userRoles) {
      for (const permissionId of role.permissionIds) {
        const permission = this.permissions.get(permissionId);
        if (
          permission &&
          permission.action === action &&
          permission.resourceType === resourceType &&
          (!scope || permission.scope === scope)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate conditions for permission
   */
  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === 'object' && value !== null) {
        if (value.operator === 'equals' && context[key] !== value.value) {
          return false;
        }
        if (value.operator === 'in' && !value.values.includes(context[key])) {
          return false;
        }
        if (value.operator === 'greaterThan' && context[key] <= value.value) {
          return false;
        }
      } else if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create team hierarchy
   */
  public createTeamHierarchy(teamId: string, parentTeamId?: string): TeamHierarchy {
    let level = 0;
    let path: string[] = [teamId];

    if (parentTeamId && this.teamHierarchy.has(parentTeamId)) {
      const parentHierarchy = this.teamHierarchy.get(parentTeamId)!;
      level = parentHierarchy.level + 1;
      path = [...parentHierarchy.path, teamId];

      // Update parent's children
      parentHierarchy.childTeamIds.push(teamId);
    }

    const hierarchy: TeamHierarchy = {
      teamId,
      parentTeamId,
      childTeamIds: [],
      level,
      path,
    };

    this.teamHierarchy.set(teamId, hierarchy);
    return hierarchy;
  }

  /**
   * Get team hierarchy
   */
  public getTeamHierarchy(teamId: string): TeamHierarchy | undefined {
    return this.teamHierarchy.get(teamId);
  }

  /**
   * Get all child teams
   */
  public getChildTeams(teamId: string): string[] {
    const queue: string[] = [teamId];
    const children: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const hierarchy = this.teamHierarchy.get(current);
      if (hierarchy) {
        children.push(...hierarchy.childTeamIds);
        queue.push(...hierarchy.childTeamIds);
      }
    }

    return children;
  }

  /**
   * Get all parent teams
   */
  public getParentTeams(teamId: string): string[] {
    const parents: string[] = [];
    let current = this.teamHierarchy.get(teamId);

    while (current?.parentTeamId) {
      parents.unshift(current.parentTeamId);
      current = this.teamHierarchy.get(current.parentTeamId);
    }

    return parents;
  }

  /**
   * Get role by ID
   */
  public getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Get permission by ID
   */
  public getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  /**
   * List all roles in organization
   */
  public listRoles(organizationId: string, teamId?: string): Role[] {
    return Array.from(this.roles.values()).filter(role => {
      if (role.organizationId !== organizationId) return false;
      if (teamId && role.teamId !== teamId) return false;
      return true;
    });
  }

  /**
   * List all permissions
   */
  public listPermissions(scope?: PermissionScope, resourceType?: string): Permission[] {
    return Array.from(this.permissions.values()).filter(perm => {
      if (scope && perm.scope !== scope) return false;
      if (resourceType && perm.resourceType !== resourceType) return false;
      return true;
    });
  }

  /**
   * Export RBAC configuration
   */
  public exportConfiguration(): {
    roles: Role[];
    permissions: Permission[];
    assignments: Array<RoleAssignment>;
    hierarchies: TeamHierarchy[];
  } {
    const assignments = Array.from(this.userRoles.values()).flat();
    const hierarchies = Array.from(this.teamHierarchy.values());

    return {
      roles: Array.from(this.roles.values()),
      permissions: Array.from(this.permissions.values()),
      assignments,
      hierarchies,
    };
  }

  /**
   * Import RBAC configuration
   */
  public importConfiguration(config: {
    roles: Role[];
    permissions: Permission[];
    assignments: RoleAssignment[];
    hierarchies: TeamHierarchy[];
  }): void {
    // Import permissions
    for (const perm of config.permissions) {
      this.permissions.set(perm.id, perm);
    }

    // Import roles
    for (const role of config.roles) {
      this.roles.set(role.id, role);
      const permSet = new Set(role.permissionIds);
      this.rolePermissions.set(role.id, permSet);
    }

    // Import team hierarchies
    for (const hierarchy of config.hierarchies) {
      this.teamHierarchy.set(hierarchy.teamId, hierarchy);
    }

    // Import assignments
    for (const assignment of config.assignments) {
      if (!this.userRoles.has(assignment.userId)) {
        this.userRoles.set(assignment.userId, []);
      }
      this.userRoles.get(assignment.userId)!.push(assignment);
    }
  }

  /**
   * Get audit trail for role changes
   */
  public getRoleAuditTrail(roleId: string): Array<{
    timestamp: Date;
    action: string;
    details: Record<string, any>;
  }> {
    const role = this.roles.get(roleId);
    if (!role) return [];

    return [
      {
        timestamp: role.createdAt,
        action: 'role_created',
        details: { createdBy: role.createdBy },
      },
      {
        timestamp: role.updatedAt,
        action: 'role_updated',
        details: { permissionCount: role.permissionIds.length },
      },
    ];
  }
}
