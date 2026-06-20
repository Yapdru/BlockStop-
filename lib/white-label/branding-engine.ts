/**
 * Branding Engine
 * Manages white-label branding customization
 */

export interface BrandCustomization {
  tenantId: string;
  companyName: string;
  companyLogo: string; // URL
  favicon: string; // URL
  primaryColor: string; // Hex color
  secondaryColor: string; // Hex color
  accentColor: string; // Hex color
  fontFamily: string;
  loginPageBackground?: string;
  customCSS?: string;
  emailLogoUrl?: string;
  reportHeaderImageUrl?: string;
  reportFooterText?: string;
  supportContactEmail?: string;
  supportPhoneNumber?: string;
  documentationUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  customDomain?: string;
  customEmailDomain?: string;
}

export interface BrandTemplate {
  templateId: string;
  name: string;
  description: string;
  industry: string;
  preview: string;
  customization: Partial<BrandCustomization>;
}

export interface BrandAsset {
  assetId: string;
  assetType: 'logo' | 'favicon' | 'background' | 'email-template' | 'report-template' | 'css';
  filename: string;
  url: string;
  uploadedAt: Date;
  fileSize: number;
}

export class BrandingEngine {
  private brandCustomizations: Map<string, BrandCustomization> = new Map();
  private brandAssets: Map<string, BrandAsset[]> = new Map();
  private brandTemplates: Map<string, BrandTemplate> = new Map();

  private readonly DEFAULT_CUSTOMIZATION: BrandCustomization = {
    tenantId: '',
    companyName: 'BlockStop',
    companyLogo: 'https://blockstop.io/logo.png',
    favicon: 'https://blockstop.io/favicon.ico',
    primaryColor: '#0066CC',
    secondaryColor: '#6C7E9F',
    accentColor: '#FF6B6B',
    fontFamily: 'Inter, sans-serif',
    emailLogoUrl: 'https://blockstop.io/email-logo.png',
    reportHeaderImageUrl: '',
    reportFooterText: '© BlockStop Security. All rights reserved.',
    supportContactEmail: 'support@blockstop.io',
    documentationUrl: 'https://docs.blockstop.io',
  };

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Get or create branding customization for tenant
   */
  getOrCreateBranding(tenantId: string): BrandCustomization {
    let branding = this.brandCustomizations.get(tenantId);

    if (!branding) {
      branding = {
        ...this.DEFAULT_CUSTOMIZATION,
        tenantId,
      };
      this.brandCustomizations.set(tenantId, branding);
    }

    return branding;
  }

  /**
   * Update branding
   */
  updateBranding(tenantId: string, updates: Partial<BrandCustomization>): BrandCustomization {
    const branding = this.getOrCreateBranding(tenantId);
    const updated = { ...branding, ...updates, tenantId };
    this.brandCustomizations.set(tenantId, updated);
    return updated;
  }

  /**
   * Upload brand asset
   */
  uploadAsset(
    tenantId: string,
    assetType: BrandAsset['assetType'],
    filename: string,
    url: string,
    fileSize: number
  ): BrandAsset {
    const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const asset: BrandAsset = {
      assetId,
      assetType,
      filename,
      url,
      uploadedAt: new Date(),
      fileSize,
    };

    if (!this.brandAssets.has(tenantId)) {
      this.brandAssets.set(tenantId, []);
    }

    this.brandAssets.get(tenantId)!.push(asset);
    return asset;
  }

  /**
   * Get tenant assets
   */
  getTenantAssets(tenantId: string, assetType?: BrandAsset['assetType']): BrandAsset[] {
    const assets = this.brandAssets.get(tenantId) || [];

    if (assetType) {
      return assets.filter((a) => a.assetType === assetType);
    }

    return assets;
  }

  /**
   * Delete asset
   */
  deleteAsset(tenantId: string, assetId: string): void {
    const assets = this.brandAssets.get(tenantId);
    if (assets) {
      const index = assets.findIndex((a) => a.assetId === assetId);
      if (index > -1) {
        assets.splice(index, 1);
      }
    }
  }

  /**
   * Apply template
   */
  applyTemplate(tenantId: string, templateId: string): BrandCustomization {
    const template = this.brandTemplates.get(templateId);
    if (!template) throw new Error('Template not found');

    const customization = this.getOrCreateBranding(tenantId);
    const updated = { ...customization, ...template.customization };
    this.brandCustomizations.set(tenantId, updated);

    return updated;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): BrandTemplate[] {
    return Array.from(this.brandTemplates.values());
  }

  /**
   * Get template by industry
   */
  getTemplatesByIndustry(industry: string): BrandTemplate[] {
    return Array.from(this.brandTemplates.values()).filter((t) => t.industry === industry);
  }

  /**
   * Generate CSS for branding
   */
  generateBrandCSS(tenantId: string): string {
    const branding = this.getOrCreateBranding(tenantId);

    return `
:root {
  --primary-color: ${branding.primaryColor};
  --secondary-color: ${branding.secondaryColor};
  --accent-color: ${branding.accentColor};
  --font-family: ${branding.fontFamily};
}

body {
  font-family: ${branding.fontFamily};
  color: ${branding.secondaryColor};
}

a {
  color: ${branding.primaryColor};
}

button, .btn {
  background-color: ${branding.primaryColor};
}

button:hover, .btn:hover {
  background-color: ${this.darkenColor(branding.primaryColor)};
}

.header {
  background-color: ${branding.primaryColor};
}

.accent {
  color: ${branding.accentColor};
}

${branding.customCSS ? branding.customCSS : ''}
    `.trim();
  }

  /**
   * Get branding metadata
   */
  getBrandingMetadata(tenantId: string): Record<string, any> {
    const branding = this.getOrCreateBranding(tenantId);

    return {
      companyName: branding.companyName,
      logo: branding.companyLogo,
      favicon: branding.favicon,
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        accent: branding.accentColor,
      },
      contact: {
        email: branding.supportContactEmail,
        phone: branding.supportPhoneNumber,
      },
      links: {
        documentation: branding.documentationUrl,
        privacy: branding.privacyPolicyUrl,
        terms: branding.termsOfServiceUrl,
      },
    };
  }

  /**
   * Create custom theme
   */
  createCustomTheme(tenantId: string, name: string, customization: Partial<BrandCustomization>): BrandCustomization {
    return this.updateBranding(tenantId, customization);
  }

  /**
   * Reset to default branding
   */
  resetToDefault(tenantId: string): BrandCustomization {
    const branding = {
      ...this.DEFAULT_CUSTOMIZATION,
      tenantId,
    };
    this.brandCustomizations.set(tenantId, branding);
    return branding;
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    const templates: BrandTemplate[] = [
      {
        templateId: 'tech-startups',
        name: 'Tech Startups',
        description: 'Modern, clean design for technology companies',
        industry: 'Technology',
        preview: 'tech-startups.jpg',
        customization: {
          primaryColor: '#0066CC',
          secondaryColor: '#6C7E9F',
          accentColor: '#FF6B6B',
          fontFamily: 'Inter, sans-serif',
        },
      },
      {
        templateId: 'enterprise',
        name: 'Enterprise',
        description: 'Professional design for large enterprises',
        industry: 'Enterprise',
        preview: 'enterprise.jpg',
        customization: {
          primaryColor: '#1A3A52',
          secondaryColor: '#4A4A4A',
          accentColor: '#F39C12',
          fontFamily: 'Roboto, sans-serif',
        },
      },
      {
        templateId: 'fintech',
        name: 'FinTech',
        description: 'Trust-focused design for financial services',
        industry: 'Finance',
        preview: 'fintech.jpg',
        customization: {
          primaryColor: '#003D7A',
          secondaryColor: '#556B7B',
          accentColor: '#00A86B',
          fontFamily: 'Poppins, sans-serif',
        },
      },
      {
        templateId: 'healthcare',
        name: 'Healthcare',
        description: 'Caring design for healthcare organizations',
        industry: 'Healthcare',
        preview: 'healthcare.jpg',
        customization: {
          primaryColor: '#2E7D32',
          secondaryColor: '#5A5A5A',
          accentColor: '#D32F2F',
          fontFamily: 'Lato, sans-serif',
        },
      },
    ];

    for (const template of templates) {
      this.brandTemplates.set(template.templateId, template);
    }
  }

  /**
   * Darken color
   */
  private darkenColor(color: string): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const darkerR = Math.max(0, r - 30);
    const darkerG = Math.max(0, g - 30);
    const darkerB = Math.max(0, b - 30);

    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  }
}

export const brandingEngine = new BrandingEngine();
