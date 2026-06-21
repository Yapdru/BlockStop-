/**
 * License Manager
 * Issues and manages white-label licenses
 */

import { query } from '@/lib/db';

export interface WhiteLabelLicense {
  licenseId: string;
  tenantId: string;
  licenseKey: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  licenseType: 'starter' | 'professional' | 'enterprise';
  maxUsers?: number;
  maxCustomers?: number;
  startDate: Date;
  expiryDate: Date;
  autoRenew: boolean;
  features: string[];
  customBrandingIncluded: boolean;
  customDomainIncluded: boolean;
  apiAccessIncluded: boolean;
  supportTier: 'community' | 'priority' | 'dedicated';
  supportEmail?: string;
  supportPhone?: string;
  integrations: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseValidation {
  isValid: boolean;
  reason?: string;
  daysRemaining?: number;
  features: string[];
}

export class LicenseManager {
  /**
   * Issue new license
   */
  async issueLicense(
    tenantId: string,
    licenseType: 'starter' | 'professional' | 'enterprise',
    expiryDays: number = 365,
    features: string[] = [],
    customBrandingIncluded: boolean = false,
    customDomainIncluded: boolean = false,
    apiAccessIncluded: boolean = false,
    supportTier: 'community' | 'priority' | 'dedicated' = 'community'
  ): Promise<WhiteLabelLicense> {
    const licenseId = `lic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const licenseKey = this.generateLicenseKey();

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Set defaults based on license type
    const { maxUsers, maxCustomers, defaultFeatures } = this.getLicenseDefaults(licenseType);

    const allFeatures = Array.from(new Set([...defaultFeatures, ...features]));

    try {
      await query(
        `INSERT INTO white_label_licenses (
          license_id, tenant_id, license_key, status, license_type,
          max_users, max_customers, start_date, expiry_date, auto_renew,
          features, custom_branding_included, custom_domain_included,
          api_access_included, support_tier, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          licenseId,
          tenantId,
          licenseKey,
          'active',
          licenseType,
          maxUsers || null,
          maxCustomers || null,
          startDate,
          expiryDate,
          true,
          JSON.stringify(allFeatures),
          customBrandingIncluded,
          customDomainIncluded,
          apiAccessIncluded,
          supportTier,
          new Date(),
          new Date(),
        ]
      );

      return {
        licenseId,
        tenantId,
        licenseKey,
        status: 'active',
        licenseType,
        maxUsers,
        maxCustomers,
        startDate,
        expiryDate,
        autoRenew: true,
        features: allFeatures,
        customBrandingIncluded,
        customDomainIncluded,
        apiAccessIncluded,
        supportTier,
        integrations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to issue license: ${error}`);
    }
  }

  /**
   * Get license by ID
   */
  async getLicense(licenseId: string): Promise<WhiteLabelLicense | null> {
    try {
      const result = await query(
        `SELECT * FROM white_label_licenses WHERE license_id = $1`,
        [licenseId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch license: ${error}`);
    }
  }

  /**
   * Get license by key
   */
  async getLicenseByKey(licenseKey: string): Promise<WhiteLabelLicense | null> {
    try {
      const result = await query(
        `SELECT * FROM white_label_licenses WHERE license_key = $1`,
        [licenseKey]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch license: ${error}`);
    }
  }

  /**
   * Get tenant's licenses
   */
  async getTenantLicenses(tenantId: string): Promise<WhiteLabelLicense[]> {
    try {
      const result = await query(
        `SELECT * FROM white_label_licenses WHERE tenant_id = $1 ORDER BY created_at DESC`,
        [tenantId]
      );

      return result.rows.map((row: any) => this.mapRowToLicense(row));
    } catch (error) {
      throw new Error(`Failed to fetch tenant licenses: ${error}`);
    }
  }

  /**
   * Validate license
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidation> {
    try {
      const license = await this.getLicenseByKey(licenseKey);

      if (!license) {
        return {
          isValid: false,
          reason: 'License not found',
          features: [],
        };
      }

      if (license.status === 'revoked') {
        return {
          isValid: false,
          reason: 'License has been revoked',
          features: [],
        };
      }

      if (license.status === 'suspended') {
        return {
          isValid: false,
          reason: 'License is suspended',
          features: [],
        };
      }

      const now = new Date();
      if (license.expiryDate < now) {
        return {
          isValid: false,
          reason: 'License has expired',
          features: [],
        };
      }

      const daysRemaining = Math.ceil((license.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        isValid: true,
        daysRemaining,
        features: license.features,
      };
    } catch (error) {
      throw new Error(`Failed to validate license: ${error}`);
    }
  }

  /**
   * Renew license
   */
  async renewLicense(licenseId: string, additionalDays: number = 365): Promise<WhiteLabelLicense> {
    try {
      const license = await this.getLicense(licenseId);
      if (!license) throw new Error('License not found');

      const newExpiryDate = new Date(license.expiryDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

      const result = await query(
        `UPDATE white_label_licenses
         SET expiry_date = $2, status = 'active', updated_at = NOW()
         WHERE license_id = $1
         RETURNING *`,
        [licenseId, newExpiryDate]
      );

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to renew license: ${error}`);
    }
  }

  /**
   * Add feature to license
   */
  async addFeatureToLicense(licenseId: string, feature: string): Promise<WhiteLabelLicense> {
    try {
      const license = await this.getLicense(licenseId);
      if (!license) throw new Error('License not found');

      if (!license.features.includes(feature)) {
        license.features.push(feature);
      }

      const result = await query(
        `UPDATE white_label_licenses
         SET features = $2, updated_at = NOW()
         WHERE license_id = $1
         RETURNING *`,
        [licenseId, JSON.stringify(license.features)]
      );

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to add feature: ${error}`);
    }
  }

  /**
   * Remove feature from license
   */
  async removeFeatureFromLicense(licenseId: string, feature: string): Promise<WhiteLabelLicense> {
    try {
      const license = await this.getLicense(licenseId);
      if (!license) throw new Error('License not found');

      license.features = license.features.filter((f) => f !== feature);

      const result = await query(
        `UPDATE white_label_licenses
         SET features = $2, updated_at = NOW()
         WHERE license_id = $1
         RETURNING *`,
        [licenseId, JSON.stringify(license.features)]
      );

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to remove feature: ${error}`);
    }
  }

  /**
   * Suspend license
   */
  async suspendLicense(licenseId: string, reason?: string): Promise<WhiteLabelLicense> {
    try {
      const result = await query(
        `UPDATE white_label_licenses
         SET status = 'suspended', notes = $2, updated_at = NOW()
         WHERE license_id = $1
         RETURNING *`,
        [licenseId, reason || null]
      );

      if (result.rows.length === 0) {
        throw new Error('License not found');
      }

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to suspend license: ${error}`);
    }
  }

  /**
   * Revoke license
   */
  async revokeLicense(licenseId: string, reason?: string): Promise<WhiteLabelLicense> {
    try {
      const result = await query(
        `UPDATE white_label_licenses
         SET status = 'revoked', notes = $2, updated_at = NOW()
         WHERE license_id = $1
         RETURNING *`,
        [licenseId, reason || null]
      );

      if (result.rows.length === 0) {
        throw new Error('License not found');
      }

      return this.mapRowToLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to revoke license: ${error}`);
    }
  }

  /**
   * Get license defaults by type
   */
  private getLicenseDefaults(licenseType: string): {
    maxUsers?: number;
    maxCustomers?: number;
    defaultFeatures: string[];
  } {
    const defaults: Record<string, any> = {
      starter: {
        maxUsers: 5,
        maxCustomers: 50,
        defaultFeatures: ['basic-branding', 'email-support'],
      },
      professional: {
        maxUsers: 20,
        maxCustomers: 500,
        defaultFeatures: ['custom-branding', 'advanced-reporting', 'api-access', 'priority-support'],
      },
      enterprise: {
        maxUsers: undefined,
        maxCustomers: undefined,
        defaultFeatures: [
          'custom-branding',
          'custom-domain',
          'advanced-reporting',
          'api-access',
          'dedicated-support',
          'sso',
          'audit-logs',
        ],
      },
    };

    return defaults[licenseType] || { defaultFeatures: [] };
  }

  /**
   * Generate license key
   */
  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += '-';
    }

    return key;
  }

  /**
   * Get expiring licenses (admin)
   */
  async getExpiringLicenses(daysUntilExpiry: number = 30): Promise<WhiteLabelLicense[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      const result = await query(
        `SELECT * FROM white_label_licenses
         WHERE status = 'active'
         AND expiry_date <= $1
         AND expiry_date > NOW()
         ORDER BY expiry_date ASC`,
        [expiryDate]
      );

      return result.rows.map((row: any) => this.mapRowToLicense(row));
    } catch (error) {
      throw new Error(`Failed to get expiring licenses: ${error}`);
    }
  }

  /**
   * Private helper to map database row to WhiteLabelLicense
   */
  private mapRowToLicense(row: any): WhiteLabelLicense {
    return {
      licenseId: row.license_id,
      tenantId: row.tenant_id,
      licenseKey: row.license_key,
      status: row.status,
      licenseType: row.license_type,
      maxUsers: row.max_users,
      maxCustomers: row.max_customers,
      startDate: new Date(row.start_date),
      expiryDate: new Date(row.expiry_date),
      autoRenew: row.auto_renew,
      features: row.features ? JSON.parse(row.features) : [],
      customBrandingIncluded: row.custom_branding_included,
      customDomainIncluded: row.custom_domain_included,
      apiAccessIncluded: row.api_access_included,
      supportTier: row.support_tier,
      supportEmail: row.support_email,
      supportPhone: row.support_phone,
      integrations: row.integrations ? JSON.parse(row.integrations) : [],
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const licenseManager = new LicenseManager();
