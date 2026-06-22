/**
 * White-Label Solution Manager
 * Rebrand BlockStop for partners with custom domains, branding, and licensing
 * Manages multi-tenant white-label deployments
 */

import { query } from '@/lib/db';
import crypto from 'crypto';

// ===== White-Label Types =====

export interface WhiteLabelPartner {
  id: string;
  companyName: string;
  legalName: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  contactEmail: string;
  contactName: string;
  contactPhone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  // Branding
  logo?: string; // base64 or URL
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCss?: string;
  // Licensing
  licenseKey: string;
  licenseTier: string;
  maxUsers: number;
  maxOrganizations: number;
  maxIncidents: number;
  supportTier: 'community' | 'business' | 'premium' | 'custom';
  ssoEnabled: boolean;
  apiAccessEnabled: boolean;
  customizationLevel: 'basic' | 'advanced' | 'full';
  // Dates
  createdAt: Date;
  updatedAt: Date;
  trialExpiresAt?: Date;
  licenseExpiresAt?: Date;
  // Metadata
  metadata?: Record<string, any>;
}

export interface WhiteLabelBranding {
  id: string;
  partnerId: string;
  appName: string; // e.g., "SecureBlock" instead of "BlockStop"
  appDescription: string;
  tagline: string;
  logo: string; // base64 or URL
  favicon: string;
  logoAlt: string;
  // Colors
  primaryColor: string; // hex
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  // Typography
  fontFamily?: string;
  headerFontFamily?: string;
  fontSize?: {
    small: number;
    base: number;
    large: number;
  };
  // UI Elements
  buttonStyle: 'rounded' | 'square' | 'pill';
  borderRadius?: number;
  customCss?: string;
  // Email branding
  emailHeaderImage?: string;
  emailSignature?: string;
  // Dashboard customization
  dashboardLayout?: string;
  hiddenFeatures?: string[]; // Features to hide from UI
  // Strings (i18n)
  customStrings?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomDomain {
  id: string;
  partnerId: string;
  domain: string; // e.g., security.example.com
  subdomain?: string;
  dnsRecords?: DNSRecord[];
  sslCertificate?: SSLCertificate;
  status: 'pending' | 'verified' | 'failed' | 'active' | 'expired';
  verificationCode?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DNSRecord {
  type: 'CNAME' | 'A' | 'MX' | 'TXT';
  name: string;
  value: string;
  ttl?: number;
}

export interface SSLCertificate {
  id: string;
  domain: string;
  issuer: string;
  issuedAt: Date;
  expiresAt: Date;
  fingerprint: string;
  autoRenew: boolean;
}

export interface WhiteLabelLicense {
  id: string;
  partnerId: string;
  licenseKey: string;
  productName: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  maxUsers: number;
  maxOrganizations: number;
  maxIncidents: number;
  features: string[];
  supportTier: string;
  features_enabled: {
    sso: boolean;
    customDomain: boolean;
    api: boolean;
    plugins: boolean;
    customization: boolean;
    advancedReporting: boolean;
    dedicatedSupport: boolean;
    sla: boolean;
  };
  issuedAt: Date;
  expiresAt: Date;
  renewalDate?: Date;
  activations: number; // How many instances activated
  maxActivations: number;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  metadata?: Record<string, any>;
}

export interface CLITool {
  id: string;
  partnerId: string;
  toolName: string;
  packageName: string; // npm package name
  version: string;
  binName: string; // command name
  branding: CLIBranding;
  features: string[];
  status: 'development' | 'staging' | 'published' | 'deprecated';
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CLIBranding {
  appName: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  helpText?: string;
  bannerMessage?: string;
  logoUrl?: string;
}

export interface APIEndpoint {
  id: string;
  partnerId: string;
  endpoint: string; // e.g., api.company.com
  protocol: 'http' | 'https';
  version: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  authentication: {
    type: 'api-key' | 'oauth2' | 'jwt' | 'custom';
    headerName?: string;
    queryParamName?: string;
  };
  allowedOrigins: string[];
  ipWhitelist?: string[];
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerBrandingAssets {
  id: string;
  partnerId: string;
  assets: {
    logos: BrandingAsset[];
    icons: BrandingAsset[];
    screenshots: BrandingAsset[];
    banners: BrandingAsset[];
    customGraphics: BrandingAsset[];
  };
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingAsset {
  id: string;
  name: string;
  type: string; // PNG, SVG, JPG, etc.
  url: string;
  size?: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
}

// ===== White-Label Manager Service =====

export class WhiteLabelManager {
  private readonly PARTNER_KEY_PREFIX = 'wl_partner_';
  private readonly LICENSE_KEY_PREFIX = 'WL-';

  // ===== Partner Management =====

  /**
   * Create new white-label partner
   */
  async createPartner(
    partnerData: Partial<WhiteLabelPartner>
  ): Promise<WhiteLabelPartner> {
    try {
      const partnerId = this.generatePartnerId();
      const licenseKey = this.generateLicenseKey();

      const result = await query(
        `INSERT INTO white_label_partners (
          id, company_name, legal_name, tier, status, contact_email,
          contact_name, website, industry, license_key, license_tier,
          max_users, max_organizations, max_incidents, support_tier,
          sso_enabled, api_access_enabled, customization_level, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING *`,
        [
          partnerId,
          partnerData.companyName,
          partnerData.legalName,
          partnerData.tier || 'starter',
          partnerData.status || 'trial',
          partnerData.contactEmail,
          partnerData.contactName,
          partnerData.website,
          partnerData.industry,
          licenseKey,
          partnerData.licenseTier || 'starter',
          partnerData.maxUsers || 10,
          partnerData.maxOrganizations || 1,
          partnerData.maxIncidents || 1000,
          partnerData.supportTier || 'community',
          partnerData.ssoEnabled || false,
          partnerData.apiAccessEnabled || false,
          partnerData.customizationLevel || 'basic',
        ]
      );

      return this.mapToWhiteLabelPartner(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create white-label partner: ${error}`);
    }
  }

  /**
   * Get partner details
   */
  async getPartner(partnerId: string): Promise<WhiteLabelPartner | null> {
    try {
      const result = await query(
        `SELECT * FROM white_label_partners WHERE id = $1`,
        [partnerId]
      );

      if (result.rows.length === 0) return null;
      return this.mapToWhiteLabelPartner(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch partner: ${error}`);
    }
  }

  /**
   * Get partner by license key
   */
  async getPartnerByLicense(licenseKey: string): Promise<WhiteLabelPartner | null> {
    try {
      const result = await query(
        `SELECT * FROM white_label_partners WHERE license_key = $1`,
        [licenseKey]
      );

      if (result.rows.length === 0) return null;
      return this.mapToWhiteLabelPartner(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch partner by license: ${error}`);
    }
  }

  /**
   * Update partner details
   */
  async updatePartner(
    partnerId: string,
    updates: Partial<WhiteLabelPartner>
  ): Promise<WhiteLabelPartner> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id' || key === 'licenseKey' || key === 'createdAt') continue;

        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      fields.push(`updated_at = NOW()`);
      values.push(partnerId);

      const result = await query(
        `UPDATE white_label_partners SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      return this.mapToWhiteLabelPartner(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update partner: ${error}`);
    }
  }

  /**
   * List all white-label partners
   */
  async listPartners(
    limit: number = 50,
    offset: number = 0
  ): Promise<WhiteLabelPartner[]> {
    try {
      const result = await query(
        `SELECT * FROM white_label_partners
         ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows.map(row => this.mapToWhiteLabelPartner(row));
    } catch (error) {
      throw new Error(`Failed to list partners: ${error}`);
    }
  }

  /**
   * Suspend partner account
   */
  async suspendPartner(partnerId: string, reason: string): Promise<void> {
    try {
      await query(
        `UPDATE white_label_partners
         SET status = 'suspended', updated_at = NOW()
         WHERE id = $1`,
        [partnerId]
      );

      // Log suspension
      await query(
        `INSERT INTO partner_audit_log (partner_id, action, details, created_at)
         VALUES ($1, 'suspended', $2, NOW())`,
        [partnerId, JSON.stringify({ reason })]
      );
    } catch (error) {
      throw new Error(`Failed to suspend partner: ${error}`);
    }
  }

  // ===== Branding Management =====

  /**
   * Set partner branding
   */
  async setBranding(
    partnerId: string,
    branding: Partial<WhiteLabelBranding>
  ): Promise<WhiteLabelBranding> {
    try {
      const result = await query(
        `INSERT INTO white_label_branding (
          id, partner_id, app_name, app_description, tagline, logo, favicon,
          logo_alt, primary_color, secondary_color, accent_color, background_color,
          text_color, button_style, custom_css, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        ON CONFLICT (partner_id) DO UPDATE SET
          app_name = $3, app_description = $4, tagline = $5, logo = $6,
          favicon = $7, logo_alt = $8, primary_color = $9, secondary_color = $10,
          accent_color = $11, background_color = $12, text_color = $13,
          button_style = $14, custom_css = $15, updated_at = NOW()
        RETURNING *`,
        [
          this.generateBrandingId(),
          partnerId,
          branding.appName,
          branding.appDescription,
          branding.tagline,
          branding.logo,
          branding.favicon,
          branding.logoAlt,
          branding.primaryColor,
          branding.secondaryColor,
          branding.accentColor,
          branding.backgroundColor,
          branding.textColor,
          branding.buttonStyle,
          branding.customCss
        ]
      );

      return this.mapToWhiteLabelBranding(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to set branding: ${error}`);
    }
  }

  /**
   * Get partner branding
   */
  async getBranding(partnerId: string): Promise<WhiteLabelBranding | null> {
    try {
      const result = await query(
        `SELECT * FROM white_label_branding WHERE partner_id = $1`,
        [partnerId]
      );

      if (result.rows.length === 0) return null;
      return this.mapToWhiteLabelBranding(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch branding: ${error}`);
    }
  }

  // ===== Custom Domain Management =====

  /**
   * Add custom domain
   */
  async addCustomDomain(
    partnerId: string,
    domain: string,
    subdomain?: string
  ): Promise<CustomDomain> {
    try {
      const domainId = this.generateDomainId();
      const verificationCode = crypto.randomBytes(32).toString('hex');

      const result = await query(
        `INSERT INTO custom_domains (
          id, partner_id, domain, subdomain, status, verification_code, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *`,
        [domainId, partnerId, domain, subdomain, 'pending', verificationCode]
      );

      return this.mapToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to add custom domain: ${error}`);
    }
  }

  /**
   * Get custom domain
   */
  async getCustomDomain(domainId: string): Promise<CustomDomain | null> {
    try {
      const result = await query(
        `SELECT * FROM custom_domains WHERE id = $1`,
        [domainId]
      );

      if (result.rows.length === 0) return null;
      return this.mapToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch custom domain: ${error}`);
    }
  }

  /**
   * Get partner domains
   */
  async getPartnerDomains(partnerId: string): Promise<CustomDomain[]> {
    try {
      const result = await query(
        `SELECT * FROM custom_domains WHERE partner_id = $1
         ORDER BY created_at DESC`,
        [partnerId]
      );

      return result.rows.map(row => this.mapToCustomDomain(row));
    } catch (error) {
      throw new Error(`Failed to fetch partner domains: ${error}`);
    }
  }

  /**
   * Verify custom domain
   */
  async verifyDomain(domainId: string): Promise<void> {
    try {
      // In production, this would verify DNS records
      await query(
        `UPDATE custom_domains
         SET status = $1, verified_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        ['active', domainId]
      );
    } catch (error) {
      throw new Error(`Failed to verify domain: ${error}`);
    }
  }

  /**
   * Generate SSL certificate for domain
   */
  async generateSSLCertificate(domainId: string): Promise<SSLCertificate> {
    try {
      const domain = await this.getCustomDomain(domainId);
      if (!domain) throw new Error('Domain not found');

      const certificateId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const certificate: SSLCertificate = {
        id: certificateId,
        domain: domain.domain,
        issuer: 'Let\'s Encrypt',
        issuedAt: new Date(),
        expiresAt,
        fingerprint: crypto.randomBytes(32).toString('hex'),
        autoRenew: true
      };

      await query(
        `UPDATE custom_domains
         SET ssl_certificate = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(certificate), domainId]
      );

      return certificate;
    } catch (error) {
      throw new Error(`Failed to generate SSL certificate: ${error}`);
    }
  }

  // ===== License Management =====

  /**
   * Create license for partner
   */
  async createLicense(
    partnerId: string,
    licenseData: Partial<WhiteLabelLicense>
  ): Promise<WhiteLabelLicense> {
    try {
      const licenseId = this.generateLicenseId();
      const licenseKey = this.generateLicenseKey();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const result = await query(
        `INSERT INTO white_label_licenses (
          id, partner_id, license_key, product_name, tier, max_users,
          max_organizations, max_incidents, support_tier, features_enabled,
          issued_at, expires_at, max_activations, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13, NOW(), NOW())
        RETURNING *`,
        [
          licenseId,
          partnerId,
          licenseKey,
          licenseData.productName || 'BlockStop White Label',
          licenseData.tier || 'professional',
          licenseData.maxUsers || 50,
          licenseData.maxOrganizations || 5,
          licenseData.maxIncidents || 10000,
          licenseData.supportTier || 'business',
          JSON.stringify(licenseData.features_enabled || {}),
          expiresAt,
          licenseData.maxActivations || 1,
          'active'
        ]
      );

      return this.mapToWhiteLabelLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create license: ${error}`);
    }
  }

  /**
   * Validate license key
   */
  async validateLicense(licenseKey: string): Promise<{
    valid: boolean;
    partner?: WhiteLabelPartner;
    license?: WhiteLabelLicense;
    reason?: string;
  }> {
    try {
      const result = await query(
        `SELECT wl.*, wlp.* FROM white_label_licenses wl
         JOIN white_label_partners wlp ON wl.partner_id = wlp.id
         WHERE wl.license_key = $1`,
        [licenseKey]
      );

      if (result.rows.length === 0) {
        return { valid: false, reason: 'License key not found' };
      }

      const row = result.rows[0];

      // Check expiration
      if (new Date(row.expires_at) < new Date()) {
        return { valid: false, reason: 'License expired' };
      }

      // Check status
      if (row.status !== 'active') {
        return { valid: false, reason: `License is ${row.status}` };
      }

      return {
        valid: true,
        partner: this.mapToWhiteLabelPartner(row),
        license: this.mapToWhiteLabelLicense(row)
      };
    } catch (error) {
      throw new Error(`Failed to validate license: ${error}`);
    }
  }

  /**
   * Renew license
   */
  async renewLicense(licenseId: string, years: number = 1): Promise<WhiteLabelLicense> {
    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + years);

      const result = await query(
        `UPDATE white_label_licenses
         SET expires_at = $1, renewal_date = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [expiresAt, licenseId]
      );

      return this.mapToWhiteLabelLicense(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to renew license: ${error}`);
    }
  }

  /**
   * Revoke license
   */
  async revokeLicense(licenseId: string, reason: string): Promise<void> {
    try {
      await query(
        `UPDATE white_label_licenses SET status = 'revoked', updated_at = NOW()
         WHERE id = $1`,
        [licenseId]
      );

      // Log revocation
      await query(
        `INSERT INTO license_audit_log (license_id, action, details, created_at)
         VALUES ($1, 'revoked', $2, NOW())`,
        [licenseId, JSON.stringify({ reason })]
      );
    } catch (error) {
      throw new Error(`Failed to revoke license: ${error}`);
    }
  }

  // ===== CLI Tool Management =====

  /**
   * Create branded CLI tool
   */
  async createCLITool(
    partnerId: string,
    toolData: Partial<CLITool>
  ): Promise<CLITool> {
    try {
      const toolId = this.generateCLIToolId();

      const result = await query(
        `INSERT INTO cli_tools (
          id, partner_id, tool_name, package_name, version, bin_name,
          branding, features, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          toolId,
          partnerId,
          toolData.toolName,
          toolData.packageName,
          toolData.version || '1.0.0',
          toolData.binName || toolData.toolName?.toLowerCase(),
          JSON.stringify(toolData.branding),
          JSON.stringify(toolData.features || []),
          'development'
        ]
      );

      return this.mapToCLITool(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create CLI tool: ${error}`);
    }
  }

  /**
   * Publish CLI tool to npm
   */
  async publishCLITool(toolId: string): Promise<void> {
    try {
      // In production, this would trigger an npm publish
      await query(
        `UPDATE cli_tools SET status = 'published', updated_at = NOW()
         WHERE id = $1`,
        [toolId]
      );
    } catch (error) {
      throw new Error(`Failed to publish CLI tool: ${error}`);
    }
  }

  // ===== API Endpoint Management =====

  /**
   * Create custom API endpoint
   */
  async createAPIEndpoint(
    partnerId: string,
    endpoint: Partial<APIEndpoint>
  ): Promise<APIEndpoint> {
    try {
      const endpointId = this.generateAPIEndpointId();

      const result = await query(
        `INSERT INTO api_endpoints (
          id, partner_id, endpoint, protocol, version, rate_limit,
          authentication, allowed_origins, ip_whitelist, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          endpointId,
          partnerId,
          endpoint.endpoint,
          endpoint.protocol || 'https',
          endpoint.version || '1.0',
          JSON.stringify(endpoint.rateLimit),
          JSON.stringify(endpoint.authentication),
          JSON.stringify(endpoint.allowedOrigins || []),
          endpoint.ipWhitelist ? JSON.stringify(endpoint.ipWhitelist) : null,
          'active'
        ]
      );

      return this.mapToAPIEndpoint(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create API endpoint: ${error}`);
    }
  }

  /**
   * Get partner API endpoints
   */
  async getPartnerAPIEndpoints(partnerId: string): Promise<APIEndpoint[]> {
    try {
      const result = await query(
        `SELECT * FROM api_endpoints WHERE partner_id = $1
         ORDER BY created_at DESC`,
        [partnerId]
      );

      return result.rows.map(row => this.mapToAPIEndpoint(row));
    } catch (error) {
      throw new Error(`Failed to fetch API endpoints: ${error}`);
    }
  }

  // ===== Branding Assets Management =====

  /**
   * Upload branding asset
   */
  async uploadBrandingAsset(
    partnerId: string,
    assetType: string,
    assetName: string,
    assetUrl: string,
    size?: { width: number; height: number }
  ): Promise<BrandingAsset> {
    try {
      const assetId = crypto.randomUUID();

      // Get or create assets collection
      let assetsResult = await query(
        `SELECT id FROM partner_branding_assets WHERE partner_id = $1`,
        [partnerId]
      );

      if (assetsResult.rows.length === 0) {
        await query(
          `INSERT INTO partner_branding_assets (
            id, partner_id, assets, color_palette, typography, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [
            crypto.randomUUID(),
            partnerId,
            JSON.stringify({ logos: [], icons: [], screenshots: [], banners: [], customGraphics: [] }),
            JSON.stringify({}),
            JSON.stringify({})
          ]
        );

        assetsResult = await query(
          `SELECT id FROM partner_branding_assets WHERE partner_id = $1`,
          [partnerId]
        );
      }

      const asset: BrandingAsset = {
        id: assetId,
        name: assetName,
        type: assetType,
        url: assetUrl,
        size,
        uploadedAt: new Date()
      };

      return asset;
    } catch (error) {
      throw new Error(`Failed to upload branding asset: ${error}`);
    }
  }

  // ===== Helper Methods =====

  private generatePartnerId(): string {
    return `${this.PARTNER_KEY_PREFIX}${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateLicenseKey(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `${this.LICENSE_KEY_PREFIX}${timestamp}-${random}`;
  }

  private generateLicenseId(): string {
    return `lic_${crypto.randomUUID()}`;
  }

  private generateBrandingId(): string {
    return `brand_${crypto.randomUUID()}`;
  }

  private generateDomainId(): string {
    return `domain_${crypto.randomUUID()}`;
  }

  private generateCLIToolId(): string {
    return `cli_${crypto.randomUUID()}`;
  }

  private generateAPIEndpointId(): string {
    return `api_${crypto.randomUUID()}`;
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Mapping methods
  private mapToWhiteLabelPartner(row: any): WhiteLabelPartner {
    return {
      id: row.id,
      companyName: row.company_name,
      legalName: row.legal_name,
      tier: row.tier,
      status: row.status,
      contactEmail: row.contact_email,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      website: row.website,
      industry: row.industry,
      companySize: row.company_size,
      logo: row.logo,
      favicon: row.favicon,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      customCss: row.custom_css,
      licenseKey: row.license_key,
      licenseTier: row.license_tier,
      maxUsers: parseInt(row.max_users),
      maxOrganizations: parseInt(row.max_organizations),
      maxIncidents: parseInt(row.max_incidents),
      supportTier: row.support_tier,
      ssoEnabled: row.sso_enabled,
      apiAccessEnabled: row.api_access_enabled,
      customizationLevel: row.customization_level,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      trialExpiresAt: row.trial_expires_at ? new Date(row.trial_expires_at) : undefined,
      licenseExpiresAt: row.license_expires_at ? new Date(row.license_expires_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private mapToWhiteLabelBranding(row: any): WhiteLabelBranding {
    return {
      id: row.id,
      partnerId: row.partner_id,
      appName: row.app_name,
      appDescription: row.app_description,
      tagline: row.tagline,
      logo: row.logo,
      favicon: row.favicon,
      logoAlt: row.logo_alt,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      backgroundColor: row.background_color,
      textColor: row.text_color,
      fontFamily: row.font_family,
      headerFontFamily: row.header_font_family,
      buttonStyle: row.button_style,
      borderRadius: row.border_radius,
      customCss: row.custom_css,
      emailHeaderImage: row.email_header_image,
      emailSignature: row.email_signature,
      dashboardLayout: row.dashboard_layout,
      hiddenFeatures: row.hidden_features ? JSON.parse(row.hidden_features) : [],
      customStrings: row.custom_strings ? JSON.parse(row.custom_strings) : {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToCustomDomain(row: any): CustomDomain {
    return {
      id: row.id,
      partnerId: row.partner_id,
      domain: row.domain,
      subdomain: row.subdomain,
      dnsRecords: row.dns_records ? JSON.parse(row.dns_records) : undefined,
      sslCertificate: row.ssl_certificate ? JSON.parse(row.ssl_certificate) : undefined,
      status: row.status,
      verificationCode: row.verification_code,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToWhiteLabelLicense(row: any): WhiteLabelLicense {
    return {
      id: row.id,
      partnerId: row.partner_id,
      licenseKey: row.license_key,
      productName: row.product_name,
      tier: row.tier,
      maxUsers: parseInt(row.max_users),
      maxOrganizations: parseInt(row.max_organizations),
      maxIncidents: parseInt(row.max_incidents),
      features: row.features ? JSON.parse(row.features) : [],
      supportTier: row.support_tier,
      features_enabled: row.features_enabled ? JSON.parse(row.features_enabled) : {},
      issuedAt: new Date(row.issued_at),
      expiresAt: new Date(row.expires_at),
      renewalDate: row.renewal_date ? new Date(row.renewal_date) : undefined,
      activations: parseInt(row.activations || 0),
      maxActivations: parseInt(row.max_activations || 1),
      status: row.status,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private mapToCLITool(row: any): CLITool {
    return {
      id: row.id,
      partnerId: row.partner_id,
      toolName: row.tool_name,
      packageName: row.package_name,
      version: row.version,
      binName: row.bin_name,
      branding: JSON.parse(row.branding),
      features: JSON.parse(row.features),
      status: row.status,
      downloadCount: parseInt(row.download_count || 0),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToAPIEndpoint(row: any): APIEndpoint {
    return {
      id: row.id,
      partnerId: row.partner_id,
      endpoint: row.endpoint,
      protocol: row.protocol,
      version: row.version,
      rateLimit: JSON.parse(row.rate_limit),
      authentication: JSON.parse(row.authentication),
      allowedOrigins: JSON.parse(row.allowed_origins),
      ipWhitelist: row.ip_whitelist ? JSON.parse(row.ip_whitelist) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const whiteLabelManager = new WhiteLabelManager();
