/**
 * Enterprise License Generator
 * Generate perpetual, annual, and per-user licenses
 */

import * as crypto from "crypto";

export interface LicenseKey {
  licenseId: string;
  key: string; // The actual license key
  type: "perpetual" | "annual" | "per-user";
  tier: "pro" | "enterprise";
  organizationId: string;
  organizationName: string;
  issuedAt: Date;
  expiresAt?: Date;
  maxUsers?: number; // For per-user licenses
  maxInstances?: number;
  features: string[];
  status: "active" | "expired" | "revoked";
  checksum: string;
}

export interface LicenseTemplate {
  type: "perpetual" | "annual" | "per-user";
  tier: "pro" | "enterprise";
  defaultFeatures: string[];
  maxInstances?: number;
  maxUsers?: number;
}

export class LicenseGenerator {
  private licenses: Map<string, LicenseKey> = new Map();
  private templates: Map<string, LicenseTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize license templates
   */
  private initializeTemplates(): void {
    const perpetualTemplate: LicenseTemplate = {
      type: "perpetual",
      tier: "enterprise",
      defaultFeatures: [
        "advanced_analytics",
        "api_access",
        "webhook_support",
        "custom_dashboards",
        "priority_support",
        "sso",
        "audit_logs",
        "white_labeling",
      ],
      maxInstances: 1000,
    };

    const annualTemplate: LicenseTemplate = {
      type: "annual",
      tier: "pro",
      defaultFeatures: [
        "advanced_analytics",
        "api_access",
        "webhook_support",
        "custom_dashboards",
        "priority_support",
        "audit_logs",
      ],
      maxInstances: 500,
    };

    const perUserTemplate: LicenseTemplate = {
      type: "per-user",
      tier: "pro",
      defaultFeatures: [
        "core_scanning",
        "api_access",
        "webhook_support",
        "audit_logs",
      ],
    };

    this.templates.set("perpetual", perpetualTemplate);
    this.templates.set("annual", annualTemplate);
    this.templates.set("per-user", perUserTemplate);
  }

  /**
   * Generate a new license key
   */
  async generateLicense(
    organizationId: string,
    organizationName: string,
    licenseType: "perpetual" | "annual" | "per-user",
    options?: {
      customFeatures?: string[];
      maxUsers?: number;
      maxInstances?: number;
    }
  ): Promise<LicenseKey> {
    const licenseId = `LIC-${Date.now()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    const template = this.templates.get(licenseType);

    if (!template) {
      throw new Error(`Unknown license type: ${licenseType}`);
    }

    // Generate license key
    const keyData = `${organizationId}:${licenseId}:${Date.now()}`;
    const key = this.encryptLicenseKey(keyData);

    const licenseKey: LicenseKey = {
      licenseId,
      key,
      type: licenseType,
      tier: template.tier,
      organizationId,
      organizationName,
      issuedAt: new Date(),
      expiresAt: this.calculateExpiration(licenseType),
      maxUsers: options?.maxUsers || template.maxUsers,
      maxInstances: options?.maxInstances || template.maxInstances,
      features: options?.customFeatures || template.defaultFeatures,
      status: "active",
      checksum: this.calculateChecksum(key),
    };

    this.licenses.set(licenseId, licenseKey);
    return licenseKey;
  }

  /**
   * Calculate license expiration date
   */
  private calculateExpiration(licenseType: "perpetual" | "annual" | "per-user"): Date | undefined {
    if (licenseType === "perpetual") {
      return undefined; // No expiration
    }

    const expiryDate = new Date();
    if (licenseType === "annual") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      // Per-user licenses expire in 1 year by default
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    return expiryDate;
  }

  /**
   * Encrypt license key
   */
  private encryptLicenseKey(data: string): string {
    // Generate checksum and format as license key
    const hash = crypto
      .createHash("sha256")
      .update(data)
      .digest("hex")
      .toUpperCase();

    // Format as readable license key: XXXX-XXXX-XXXX-XXXX-XXXX
    const formatted = hash.match(/.{1,4}/g)?.slice(0, 5).join("-") || hash;

    return formatted;
  }

  /**
   * Calculate license checksum
   */
  private calculateChecksum(key: string): string {
    return crypto
      .createHash("sha256")
      .update(key)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Batch generate licenses
   */
  async generateBatch(
    organizationId: string,
    organizationName: string,
    licenseType: "perpetual" | "annual" | "per-user",
    count: number,
    options?: {
      customFeatures?: string[];
      maxUsers?: number;
    }
  ): Promise<LicenseKey[]> {
    const licenses: LicenseKey[] = [];

    for (let i = 0; i < count; i++) {
      const license = await this.generateLicense(
        `${organizationId}-${i}`,
        `${organizationName} (Instance ${i + 1})`,
        licenseType,
        options
      );
      licenses.push(license);
    }

    return licenses;
  }

  /**
   * Retrieve license by ID
   */
  async getLicense(licenseId: string): Promise<LicenseKey | null> {
    return this.licenses.get(licenseId) || null;
  }

  /**
   * Retrieve license by key
   */
  async getLicenseByKey(key: string): Promise<LicenseKey | null> {
    for (const license of this.licenses.values()) {
      if (license.key === key) {
        return license;
      }
    }
    return null;
  }

  /**
   * List all licenses for organization
   */
  async getOrganizationLicenses(organizationId: string): Promise<LicenseKey[]> {
    return Array.from(this.licenses.values()).filter(
      (l) => l.organizationId === organizationId
    );
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseId: string): Promise<boolean> {
    const license = this.licenses.get(licenseId);
    if (license) {
      license.status = "revoked";
      return true;
    }
    return false;
  }

  /**
   * Renew a license
   */
  async renewLicense(licenseId: string): Promise<LicenseKey | null> {
    const license = this.licenses.get(licenseId);
    if (!license) {
      return null;
    }

    const renewedLicense: LicenseKey = {
      ...license,
      issuedAt: new Date(),
      expiresAt: this.calculateExpiration(license.type),
      status: "active",
    };

    this.licenses.set(licenseId, renewedLicense);
    return renewedLicense;
  }

  /**
   * Export license key to file format
   */
  async exportLicense(licenseId: string, format: "json" | "txt" = "txt"): Promise<string> {
    const license = this.licenses.get(licenseId);
    if (!license) {
      throw new Error(`License not found: ${licenseId}`);
    }

    if (format === "json") {
      return JSON.stringify(license, null, 2);
    }

    // TXT format
    return `
BlockStop Enterprise License
============================

License ID: ${license.licenseId}
License Key: ${license.key}
Organization: ${license.organizationName}
License Type: ${license.type}
Tier: ${license.tier}
Status: ${license.status}

Issued: ${license.issuedAt.toISOString()}
${license.expiresAt ? `Expires: ${license.expiresAt.toISOString()}` : "Expires: Never (Perpetual)"}

${license.maxUsers ? `Maximum Users: ${license.maxUsers}` : ""}
${license.maxInstances ? `Maximum Instances: ${license.maxInstances}` : ""}

Features:
${license.features.map((f) => `  - ${f}`).join("\n")}

Checksum: ${license.checksum}

For support, visit: https://blockstop.app/enterprise
    `.trim();
  }

  /**
   * Get license statistics
   */
  async getLicenseStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    byType: Record<string, number>;
  }> {
    const licenses = Array.from(this.licenses.values());

    return {
      total: licenses.length,
      active: licenses.filter((l) => l.status === "active").length,
      expired: licenses.filter((l) => l.status === "expired").length,
      revoked: licenses.filter((l) => l.status === "revoked").length,
      byType: {
        perpetual: licenses.filter((l) => l.type === "perpetual").length,
        annual: licenses.filter((l) => l.type === "annual").length,
        "per-user": licenses.filter((l) => l.type === "per-user").length,
      },
    };
  }

  /**
   * Update license features
   */
  async updateLicenseFeatures(licenseId: string, features: string[]): Promise<LicenseKey | null> {
    const license = this.licenses.get(licenseId);
    if (license) {
      license.features = features;
      return license;
    }
    return null;
  }
}

export default LicenseGenerator;
