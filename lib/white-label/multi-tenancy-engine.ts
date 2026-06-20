/**
 * Multi-Tenancy Engine
 * Manages tenant isolation and multi-tenancy
 */

export type TenantTier = 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  tenantId: string;
  name: string;
  tier: TenantTier;
  customDomain?: string;
  databaseConnection?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  maxUsers: number;
  maxStorageGB: number;
  features: Set<string>;
  metadata?: Record<string, any>;
}

export interface TenantUsage {
  tenantId: string;
  currentUsers: number;
  storageUsedGB: number;
  apiCallsThisMonth: number;
  scanCountThisMonth: number;
  lastUpdated: Date;
}

export interface TenantLimits {
  tier: TenantTier;
  maxUsers: number;
  maxStorageGB: number;
  monthlyApiCallLimit: number;
  monthlyScansLimit: number;
  customDomainAllowed: boolean;
  ssoAllowed: boolean;
  supportLevel: 'community' | 'standard' | 'priority' | 'dedicated';
  features: string[];
}

export const TENANT_TIER_LIMITS: Record<TenantTier, TenantLimits> = {
  starter: {
    tier: 'starter',
    maxUsers: 5,
    maxStorageGB: 100,
    monthlyApiCallLimit: 10000,
    monthlyScansLimit: 100,
    customDomainAllowed: false,
    ssoAllowed: false,
    supportLevel: 'community',
    features: ['basic-scanning', 'threat-detection', 'basic-reports'],
  },
  professional: {
    tier: 'professional',
    maxUsers: 50,
    maxStorageGB: 1000,
    monthlyApiCallLimit: 100000,
    monthlyScansLimit: 1000,
    customDomainAllowed: true,
    ssoAllowed: true,
    supportLevel: 'standard',
    features: [
      'basic-scanning',
      'threat-detection',
      'advanced-reports',
      'integrations',
      'automation',
      'team-collaboration',
    ],
  },
  enterprise: {
    tier: 'enterprise',
    maxUsers: 1000,
    maxStorageGB: 10000,
    monthlyApiCallLimit: 1000000,
    monthlyScansLimit: 10000,
    customDomainAllowed: true,
    ssoAllowed: true,
    supportLevel: 'dedicated',
    features: [
      'basic-scanning',
      'threat-detection',
      'advanced-reports',
      'integrations',
      'automation',
      'team-collaboration',
      'custom-integrations',
      'dedicated-support',
      'sla-support',
      'advanced-analytics',
      'whitelabel',
      'multi-instance',
    ],
  },
};

export class MultiTenancyEngine {
  private tenants: Map<string, Tenant> = new Map();
  private tenantUsage: Map<string, TenantUsage> = new Map();
  private domainTenantMap: Map<string, string> = new Map();

  /**
   * Create new tenant
   */
  createTenant(name: string, tier: TenantTier = 'starter', metadata?: Record<string, any>): Tenant {
    const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const limits = TENANT_TIER_LIMITS[tier];
    const now = new Date();

    const tenant: Tenant = {
      tenantId,
      name,
      tier,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      maxUsers: limits.maxUsers,
      maxStorageGB: limits.maxStorageGB,
      features: new Set(limits.features),
      metadata,
    };

    this.tenants.set(tenantId, tenant);

    // Initialize usage tracking
    this.tenantUsage.set(tenantId, {
      tenantId,
      currentUsers: 0,
      storageUsedGB: 0,
      apiCallsThisMonth: 0,
      scanCountThisMonth: 0,
      lastUpdated: now,
    });

    return tenant;
  }

  /**
   * Get tenant
   */
  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Get tenant by custom domain
   */
  getTenantByDomain(domain: string): Tenant | undefined {
    const tenantId = this.domainTenantMap.get(domain);
    if (!tenantId) return undefined;
    return this.tenants.get(tenantId);
  }

  /**
   * Upgrade tenant tier
   */
  upgradeTenant(tenantId: string, newTier: TenantTier): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const limits = TENANT_TIER_LIMITS[newTier];

    tenant.tier = newTier;
    tenant.maxUsers = limits.maxUsers;
    tenant.maxStorageGB = limits.maxStorageGB;
    tenant.features = new Set(limits.features);
    tenant.updatedAt = new Date();

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  /**
   * Set custom domain
   */
  setCustomDomain(tenantId: string, domain: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const limits = TENANT_TIER_LIMITS[tenant.tier];
    if (!limits.customDomainAllowed) {
      throw new Error('Custom domains not allowed for this tier');
    }

    // Check if domain is already taken
    if (this.domainTenantMap.has(domain) && this.domainTenantMap.get(domain) !== tenantId) {
      throw new Error('Domain already in use');
    }

    // Remove old domain mapping
    if (tenant.customDomain) {
      this.domainTenantMap.delete(tenant.customDomain);
    }

    tenant.customDomain = domain;
    this.domainTenantMap.set(domain, tenantId);

    return tenant;
  }

  /**
   * Get tenant usage
   */
  getTenantUsage(tenantId: string): TenantUsage | undefined {
    return this.tenantUsage.get(tenantId);
  }

  /**
   * Record API call
   */
  recordApiCall(tenantId: string): void {
    const usage = this.tenantUsage.get(tenantId);
    if (usage) {
      usage.apiCallsThisMonth++;
      usage.lastUpdated = new Date();
    }
  }

  /**
   * Record scan
   */
  recordScan(tenantId: string, sizeGB: number): void {
    const usage = this.tenantUsage.get(tenantId);
    if (!usage) return;

    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    usage.scanCountThisMonth++;
    usage.storageUsedGB += sizeGB;
    usage.lastUpdated = new Date();

    // Check limits
    const limits = TENANT_TIER_LIMITS[tenant.tier];
    if (usage.scanCountThisMonth > limits.monthlyScansLimit) {
      // In production, would trigger alert
      console.warn(`Tenant ${tenantId} exceeded scan limit`);
    }

    if (usage.storageUsedGB > tenant.maxStorageGB) {
      console.warn(`Tenant ${tenantId} exceeded storage limit`);
    }
  }

  /**
   * Check resource limits
   */
  checkResourceLimits(tenantId: string): { usage: TenantUsage; limits: TenantLimits; violations: string[] } {
    const usage = this.tenantUsage.get(tenantId);
    const tenant = this.tenants.get(tenantId);

    if (!usage || !tenant) throw new Error('Tenant not found');

    const limits = TENANT_TIER_LIMITS[tenant.tier];
    const violations: string[] = [];

    if (usage.currentUsers > tenant.maxUsers) {
      violations.push(`User limit exceeded: ${usage.currentUsers} / ${tenant.maxUsers}`);
    }

    if (usage.storageUsedGB > tenant.maxStorageGB) {
      violations.push(`Storage limit exceeded: ${usage.storageUsedGB}GB / ${tenant.maxStorageGB}GB`);
    }

    if (usage.apiCallsThisMonth > limits.monthlyApiCallLimit) {
      violations.push(`API call limit exceeded: ${usage.apiCallsThisMonth} / ${limits.monthlyApiCallLimit}`);
    }

    if (usage.scanCountThisMonth > limits.monthlyScansLimit) {
      violations.push(`Scan limit exceeded: ${usage.scanCountThisMonth} / ${limits.monthlyScansLimit}`);
    }

    return { usage, limits, violations };
  }

  /**
   * Enable feature for tenant
   */
  enableFeature(tenantId: string, feature: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    tenant.features.add(feature);
    return tenant;
  }

  /**
   * Disable feature for tenant
   */
  disableFeature(tenantId: string, feature: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    tenant.features.delete(feature);
    return tenant;
  }

  /**
   * Check if tenant has feature
   */
  hasFeature(tenantId: string, feature: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    return tenant.features.has(feature);
  }

  /**
   * Deactivate tenant
   */
  deactivateTenant(tenantId: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    tenant.isActive = false;
    tenant.updatedAt = new Date();

    // Remove domain mapping
    if (tenant.customDomain) {
      this.domainTenantMap.delete(tenant.customDomain);
    }

    return tenant;
  }

  /**
   * Reset monthly usage
   */
  resetMonthlyUsage(tenantId: string): void {
    const usage = this.tenantUsage.get(tenantId);
    if (usage) {
      usage.apiCallsThisMonth = 0;
      usage.scanCountThisMonth = 0;
      usage.lastUpdated = new Date();
    }
  }

  /**
   * Get all tenants
   */
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get tenants by tier
   */
  getTenantsByTier(tier: TenantTier): Tenant[] {
    return Array.from(this.tenants.values()).filter((t) => t.tier === tier && t.isActive);
  }
}

export const multiTenancyEngine = new MultiTenancyEngine();
