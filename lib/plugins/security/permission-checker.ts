/**
 * Permission Checker
 * Validates plugin permissions and enforces security policies
 */

import { PluginPermission, PluginManifest } from '../plugin-types';

export enum PermissionLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface PermissionPolicy {
  resource: string;
  action: string;
  level: PermissionLevel;
  requiresApproval: boolean;
  description?: string;
}

export class PermissionChecker {
  private permissions: Map<string, PluginPermission[]> = new Map();
  private policies: Map<string, PermissionPolicy> = new Map();
  private approvedPermissions: Set<string> = new Set();

  constructor() {
    this.registerDefaultPolicies();
  }

  private registerDefaultPolicies(): void {
    const policies: PermissionPolicy[] = [
      // Critical permissions
      {
        resource: 'threats',
        action: 'delete',
        level: PermissionLevel.CRITICAL,
        requiresApproval: true,
        description: 'Delete threats from the system',
      },
      {
        resource: 'storage',
        action: 'delete',
        level: PermissionLevel.CRITICAL,
        requiresApproval: true,
        description: 'Delete plugin storage data',
      },
      {
        resource: 'integrations',
        action: 'execute',
        level: PermissionLevel.CRITICAL,
        requiresApproval: true,
        description: 'Execute external integrations',
      },

      // High permissions
      {
        resource: 'http',
        action: 'execute',
        level: PermissionLevel.HIGH,
        requiresApproval: true,
        description: 'Make external HTTP requests',
      },
      {
        resource: 'scans',
        action: 'create',
        level: PermissionLevel.HIGH,
        requiresApproval: false,
        description: 'Create security scans',
      },
      {
        resource: 'threats',
        action: 'write',
        level: PermissionLevel.HIGH,
        requiresApproval: false,
        description: 'Modify threat information',
      },

      // Medium permissions
      {
        resource: 'threats',
        action: 'read',
        level: PermissionLevel.MEDIUM,
        requiresApproval: false,
        description: 'Read threat information',
      },
      {
        resource: 'scans',
        action: 'read',
        level: PermissionLevel.MEDIUM,
        requiresApproval: false,
        description: 'Read scan results',
      },
      {
        resource: 'files',
        action: 'read',
        level: PermissionLevel.MEDIUM,
        requiresApproval: false,
        description: 'Read file information',
      },

      // Low permissions
      {
        resource: 'storage',
        action: 'read',
        level: PermissionLevel.LOW,
        requiresApproval: false,
        description: 'Read plugin storage',
      },
      {
        resource: 'storage',
        action: 'write',
        level: PermissionLevel.LOW,
        requiresApproval: false,
        description: 'Write to plugin storage',
      },
      {
        resource: 'config',
        action: 'read',
        level: PermissionLevel.LOW,
        requiresApproval: false,
        description: 'Read plugin configuration',
      },
      {
        resource: 'ui',
        action: 'render',
        level: PermissionLevel.LOW,
        requiresApproval: false,
        description: 'Render UI components',
      },
    ];

    for (const policy of policies) {
      this.registerPolicy(policy);
    }
  }

  public registerPolicy(policy: PermissionPolicy): void {
    const key = `${policy.resource}:${policy.action}`;
    this.policies.set(key, policy);
  }

  public setPermissionsForPlugin(
    pluginId: string,
    permissions: PluginPermission[]
  ): void {
    this.permissions.set(pluginId, permissions);
  }

  public addPermission(pluginId: string, permission: PluginPermission): void {
    const perms = this.permissions.get(pluginId) || [];
    if (!perms.some(p => p.resource === permission.resource && p.action === permission.action)) {
      perms.push(permission);
      this.permissions.set(pluginId, perms);
    }
  }

  public removePermission(
    pluginId: string,
    resource: string,
    action: string
  ): void {
    const perms = this.permissions.get(pluginId) || [];
    this.permissions.set(
      pluginId,
      perms.filter(p => !(p.resource === resource && p.action === action))
    );
  }

  public hasPermission(
    pluginId: string,
    resource: string,
    action: string
  ): boolean {
    const perms = this.permissions.get(pluginId) || [];
    return perms.some(
      p =>
        p.resource === resource &&
        p.action === action &&
        this.isPermissionApproved(`${pluginId}:${resource}:${action}`)
    );
  }

  public approvePermission(
    pluginId: string,
    resource: string,
    action: string
  ): void {
    this.approvedPermissions.add(`${pluginId}:${resource}:${action}`);
  }

  public revokePermission(
    pluginId: string,
    resource: string,
    action: string
  ): void {
    this.approvedPermissions.delete(`${pluginId}:${resource}:${action}`);
  }

  public isPermissionApproved(key: string): boolean {
    return this.approvedPermissions.has(key);
  }

  public getRequiredApprovals(pluginId: string): PluginPermission[] {
    const perms = this.permissions.get(pluginId) || [];
    return perms.filter(p => {
      const policy = this.policies.get(`${p.resource}:${p.action}`);
      return policy?.requiresApproval ?? false;
    });
  }

  public getPermissionLevel(resource: string, action: string): PermissionLevel {
    const policy = this.policies.get(`${resource}:${action}`);
    return policy?.level ?? PermissionLevel.LOW;
  }

  public getPermissionsForPlugin(pluginId: string): PluginPermission[] {
    return this.permissions.get(pluginId) || [];
  }

  public validatePermissions(manifest: PluginManifest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.permissions || manifest.permissions.length === 0) {
      warnings.push('Plugin does not request any permissions');
      return { valid: true, errors, warnings };
    }

    for (const perm of manifest.permissions) {
      const policy = this.policies.get(`${perm.resource}:${perm.action}`);

      if (!policy) {
        warnings.push(
          `Unknown permission: ${perm.resource}:${perm.action}`
        );
      }

      if (policy?.level === PermissionLevel.CRITICAL) {
        warnings.push(
          `Plugin requests critical permission: ${perm.resource}:${perm.action}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public getScopedPermissions(
    pluginId: string,
    scope: string
  ): PluginPermission[] {
    const perms = this.permissions.get(pluginId) || [];
    return perms.filter(p => (p.scope || 'default') === scope);
  }

  public restrictPermissions(pluginId: string, allowedResources: string[]): void {
    const perms = this.permissions.get(pluginId) || [];
    this.permissions.set(
      pluginId,
      perms.filter(p => allowedResources.includes(p.resource))
    );
  }

  public getAllPermissions(): Record<string, PluginPermission[]> {
    const result: Record<string, PluginPermission[]> = {};

    for (const [pluginId, perms] of this.permissions.entries()) {
      result[pluginId] = perms;
    }

    return result;
  }

  public getPolicies(): PermissionPolicy[] {
    return Array.from(this.policies.values());
  }
}

export class PermissionAuditor {
  private auditLog: Array<{
    timestamp: Date;
    pluginId: string;
    resource: string;
    action: string;
    result: 'allowed' | 'denied';
    reason?: string;
  }> = [];

  public logPermissionCheck(
    pluginId: string,
    resource: string,
    action: string,
    result: 'allowed' | 'denied',
    reason?: string
  ): void {
    this.auditLog.push({
      timestamp: new Date(),
      pluginId,
      resource,
      action,
      result,
      reason,
    });
  }

  public getAuditLog(
    pluginId?: string,
    limit: number = 100
  ): typeof this.auditLog {
    let log = this.auditLog;

    if (pluginId) {
      log = log.filter(entry => entry.pluginId === pluginId);
    }

    return log.slice(-limit);
  }

  public clearAuditLog(): void {
    this.auditLog = [];
  }

  public getViolations(): typeof this.auditLog {
    return this.auditLog.filter(entry => entry.result === 'denied');
  }
}
