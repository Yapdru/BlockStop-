/**
 * Permission scope validator
 * Manages scope-based access control for API operations
 */

export type PermissionScope =
  | 'read:threats'
  | 'read:scans'
  | 'read:reports'
  | 'read:org'
  | 'write:scans'
  | 'write:reports'
  | 'write:org'
  | 'admin:org'
  | 'admin:users'
  | 'admin:api-keys'
  | 'admin:audit'
  | 'admin:integrations'
  | 'webhook:manage'
  | 'api:manage';

export interface ScopeHierarchy {
  [key: string]: PermissionScope[];
}

export class ScopeValidator {
  private scopeHierarchy: ScopeHierarchy = {
    // Admin scopes include all lower scopes
    'admin:org': [
      'admin:org',
      'admin:users',
      'admin:api-keys',
      'admin:audit',
      'admin:integrations',
      'webhook:manage',
      'api:manage',
      'write:org',
      'write:scans',
      'write:reports',
      'read:org',
      'read:scans',
      'read:reports',
      'read:threats',
    ],
    'admin:users': [
      'admin:users',
      'write:org',
      'read:org',
    ],
    'admin:api-keys': [
      'admin:api-keys',
      'read:org',
    ],
    'admin:audit': [
      'admin:audit',
      'read:org',
    ],
    'admin:integrations': [
      'admin:integrations',
      'write:org',
      'read:org',
    ],
    'webhook:manage': [
      'webhook:manage',
      'write:org',
      'read:org',
    ],
    'api:manage': [
      'api:manage',
      'write:org',
      'read:org',
    ],
    // Write scopes include read scopes
    'write:org': [
      'write:org',
      'read:org',
    ],
    'write:scans': [
      'write:scans',
      'read:scans',
      'read:threats',
    ],
    'write:reports': [
      'write:reports',
      'read:reports',
    ],
    // Read scopes
    'read:org': ['read:org'],
    'read:scans': ['read:scans'],
    'read:reports': ['read:reports'],
    'read:threats': ['read:threats'],
  };

  /**
   * Validate if a scope is valid
   */
  isValidScope(scope: string): scope is PermissionScope {
    return Object.keys(this.scopeHierarchy).includes(scope);
  }

  /**
   * Validate if user has required scope
   */
  hasScope(userScopes: string[], requiredScope: PermissionScope): boolean {
    for (const userScope of userScopes) {
      if (this.isValidScope(userScope)) {
        const expandedScopes = this.expandScopes([userScope]);
        if (expandedScopes.includes(requiredScope)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Validate if user has any of the required scopes
   */
  hasScopeAny(userScopes: string[], requiredScopes: PermissionScope[]): boolean {
    return requiredScopes.some((scope) => this.hasScope(userScopes, scope));
  }

  /**
   * Validate if user has all required scopes
   */
  hasScopeAll(userScopes: string[], requiredScopes: PermissionScope[]): boolean {
    return requiredScopes.every((scope) => this.hasScope(userScopes, scope));
  }

  /**
   * Expand scopes based on hierarchy
   */
  expandScopes(scopes: string[]): PermissionScope[] {
    const expandedSet = new Set<PermissionScope>();

    for (const scope of scopes) {
      if (this.isValidScope(scope)) {
        const hierarchyScopes = this.scopeHierarchy[scope];
        hierarchyScopes.forEach((s) => expandedSet.add(s));
      }
    }

    return Array.from(expandedSet);
  }

  /**
   * Validate and sanitize scopes
   */
  sanitizeScopes(scopes: string[]): PermissionScope[] {
    return scopes.filter((scope): scope is PermissionScope => this.isValidScope(scope));
  }

  /**
   * Get scope description
   */
  getScopeDescription(scope: PermissionScope): string {
    const descriptions: Record<PermissionScope, string> = {
      'read:threats': 'Read threat intelligence and patterns',
      'read:scans': 'Read scan results and history',
      'read:reports': 'Read generated reports',
      'read:org': 'Read organization settings',
      'write:scans': 'Create and manage scans',
      'write:reports': 'Create and manage reports',
      'write:org': 'Update organization settings',
      'admin:org': 'Full organization administration',
      'admin:users': 'Manage organization users',
      'admin:api-keys': 'Manage API keys',
      'admin:audit': 'View audit logs',
      'admin:integrations': 'Manage integrations',
      'webhook:manage': 'Create and manage webhooks',
      'api:manage': 'Manage API settings',
    };

    return descriptions[scope] || 'Unknown scope';
  }

  /**
   * Get all available scopes
   */
  getAllScopes(): PermissionScope[] {
    return Object.keys(this.scopeHierarchy) as PermissionScope[];
  }

  /**
   * Get scope groups by category
   */
  getScopesByCategory(): Record<string, PermissionScope[]> {
    return {
      read: [
        'read:threats',
        'read:scans',
        'read:reports',
        'read:org',
      ],
      write: [
        'write:scans',
        'write:reports',
        'write:org',
      ],
      admin: [
        'admin:org',
        'admin:users',
        'admin:api-keys',
        'admin:audit',
        'admin:integrations',
      ],
      management: [
        'webhook:manage',
        'api:manage',
      ],
    };
  }

  /**
   * Validate scope pattern (e.g., "read:*", "admin:*")
   */
  matchesScopePattern(scope: string, pattern: string): boolean {
    if (pattern === '*') return true;

    const parts = pattern.split(':');
    const scopeParts = scope.split(':');

    return parts.every((part, idx) => {
      if (part === '*') return true;
      return part === scopeParts[idx];
    });
  }

  /**
   * Expand wildcard scopes
   */
  expandWildcardScopes(patterns: string[]): PermissionScope[] {
    const expanded = new Set<PermissionScope>();
    const allScopes = this.getAllScopes();

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        allScopes.forEach((scope) => {
          if (this.matchesScopePattern(scope, pattern)) {
            expanded.add(scope);
          }
        });
      } else if (this.isValidScope(pattern)) {
        expanded.add(pattern);
      }
    }

    return Array.from(expanded);
  }
}

export const scopeValidator = new ScopeValidator();
