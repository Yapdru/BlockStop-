/**
 * White-Label System - Custom Branding & Configuration
 * Complete white-label solution for MAX tier customers
 */

export interface WhiteLabelOrganization {
  id: string;
  organizationName: string;
  parentTenantId: string;
  whitelabelConfig: WhiteLabelConfig;
  customBranding: BrandingAssets;
  customization: CustomizationSettings;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'suspended';
  customDomain?: string;
}

export interface WhiteLabelConfig {
  enabled: boolean;
  removeBlockStopBranding: boolean;
  customLogoUrl: string;
  customFaviconUrl: string;
  customDomain: string;
  customSupportEmail: string;
  customSupportPhone: string;
  customDocUrl: string;
  customPrivacyUrl: string;
  customTermsUrl: string;
  customContactEmail: string;
  emailTemplate: EmailTemplate;
  apiDocumentation: string;
}

export interface BrandingAssets {
  logo: BrandingAsset;
  favicon: BrandingAsset;
  headerImage: BrandingAsset;
  footerLogo: BrandingAsset;
  loginBackground: BrandingAsset;
  dashboardBackground: BrandingAsset;
  customCSS: string;
  customJavaScript: string;
}

export interface BrandingAsset {
  url: string;
  fileName: string;
  mimeType: string;
  uploadedAt: Date;
  fileSize: number;
  dimensions?: { width: number; height: number };
  altText: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  border: string;
}

export interface CustomizationSettings {
  colors: ColorScheme;
  typography: TypographySettings;
  layout: LayoutSettings;
  features: FeatureCustomization;
  userInterface: UICustomization;
}

export interface TypographySettings {
  primaryFont: string;
  secondaryFont: string;
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  fontWeight: {
    light: number;
    normal: number;
    bold: number;
  };
}

export interface LayoutSettings {
  headerStyle: 'default' | 'minimal' | 'compact';
  sidebarPosition: 'left' | 'right' | 'none';
  footerStyle: 'default' | 'minimal' | 'custom';
  maxContainerWidth: number;
  compactMode: boolean;
}

export interface FeatureCustomization {
  enabledFeatures: string[];
  disabledFeatures: string[];
  featureVisibility: Record<string, boolean>;
  customMenuItems: MenuItem[];
  removedMenuItems: string[];
  customPages: CustomPage[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  order: number;
  roles: string[];
  children?: MenuItem[];
}

export interface CustomPage {
  id: string;
  url: string;
  title: string;
  content: string;
  contentType: 'html' | 'markdown' | 'custom_component';
  published: boolean;
  lastModified: Date;
}

export interface UICustomization {
  buttonStyle: 'default' | 'rounded' | 'flat' | 'custom';
  borderRadius: number;
  shadowStyle: 'none' | 'light' | 'medium' | 'bold' | 'custom';
  animationEnabled: boolean;
  darkModeSupport: boolean;
  customNotifications: boolean;
  customDialogs: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
  variables: string[];
  createdAt: Date;
  lastModified: Date;
}

export interface BrandingAssetUploadRequest {
  assetType: 'logo' | 'favicon' | 'background' | 'banner' | 'custom';
  file: File;
  altText: string;
  description: string;
}

export interface CustomDomainConfig {
  domain: string;
  verified: boolean;
  verificationMethod: 'dns' | 'html_file' | 'cname';
  dnsRecords?: DNSRecord[];
  certDetails?: CertDetails;
  createdAt: Date;
  expiresAt?: Date;
}

export interface DNSRecord {
  type: 'CNAME' | 'A' | 'TXT' | 'MX';
  name: string;
  value: string;
  verified: boolean;
}

export interface CertDetails {
  issuer: string;
  validFrom: Date;
  validUntil: Date;
  autoRenew: boolean;
}

/**
 * White-Label Configuration Engine
 */
export class WhiteLabelEngine {
  private organizations: Map<string, WhiteLabelOrganization>;
  private brandingAssets: Map<string, BrandingAsset>;
  private customDomains: Map<string, CustomDomainConfig>;
  private emailTemplates: Map<string, EmailTemplate>;
  private defaultConfig: WhiteLabelConfig;

  constructor() {
    this.organizations = new Map();
    this.brandingAssets = new Map();
    this.customDomains = new Map();
    this.emailTemplates = new Map();
    this.defaultConfig = this.createDefaultConfig();
    this.initializeDefaultTemplates();
  }

  /**
   * Create default config
   */
  private createDefaultConfig(): WhiteLabelConfig {
    return {
      enabled: false,
      removeBlockStopBranding: false,
      customLogoUrl: '',
      customFaviconUrl: '',
      customDomain: '',
      customSupportEmail: '',
      customSupportPhone: '',
      customDocUrl: '',
      customPrivacyUrl: '',
      customTermsUrl: '',
      customContactEmail: '',
      emailTemplate: {
        id: 'default_template',
        name: 'Default Email Template',
        subject: 'BlockStop Security Alert',
        template: '<p>{{message}}</p>',
        variables: ['message', 'actionUrl', 'timestamp'],
        createdAt: new Date(),
        lastModified: new Date(),
      },
      apiDocumentation: '',
    };
  }

  /**
   * Initialize default email templates
   */
  private initializeDefaultTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'incident_alert',
        name: 'Incident Alert',
        subject: 'Security Incident Detected',
        template: `
          <h2>Security Alert</h2>
          <p>Incident ID: {{incidentId}}</p>
          <p>Severity: {{severity}}</p>
          <p>Description: {{description}}</p>
          <a href="{{dashboardUrl}}">View Details</a>
        `,
        variables: ['incidentId', 'severity', 'description', 'dashboardUrl'],
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: 'weekly_report',
        name: 'Weekly Security Report',
        subject: 'Weekly Security Summary',
        template: `
          <h2>Weekly Security Report</h2>
          <p>Week of {{weekStart}}</p>
          <ul>
            <li>Threats Detected: {{threatCount}}</li>
            <li>Incidents: {{incidentCount}}</li>
            <li>Vulnerabilities: {{vulnCount}}</li>
          </ul>
          <a href="{{reportUrl}}">Full Report</a>
        `,
        variables: ['weekStart', 'threatCount', 'incidentCount', 'vulnCount', 'reportUrl'],
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: 'user_invitation',
        name: 'User Invitation',
        subject: 'You have been invited to {{organizationName}}',
        template: `
          <h2>Welcome to {{organizationName}}</h2>
          <p>You have been invited to join {{organizationName}} on BlockStop.</p>
          <a href="{{invitationUrl}}">Accept Invitation</a>
        `,
        variables: ['organizationName', 'invitationUrl'],
        createdAt: new Date(),
        lastModified: new Date(),
      },
    ];

    templates.forEach((template) => {
      this.emailTemplates.set(template.id, template);
    });
  }

  /**
   * Create white-label organization
   */
  createOrganization(
    organizationName: string,
    parentTenantId: string
  ): WhiteLabelOrganization {
    const org: WhiteLabelOrganization = {
      id: `wl_${Date.now()}`,
      organizationName,
      parentTenantId,
      whitelabelConfig: { ...this.defaultConfig },
      customBranding: this.createDefaultBranding(),
      customization: this.createDefaultCustomization(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    this.organizations.set(org.id, org);
    return org;
  }

  /**
   * Create default branding
   */
  private createDefaultBranding(): BrandingAssets {
    return {
      logo: {
        url: '',
        fileName: '',
        mimeType: 'image/png',
        uploadedAt: new Date(),
        fileSize: 0,
        altText: 'Logo',
      },
      favicon: {
        url: '',
        fileName: '',
        mimeType: 'image/x-icon',
        uploadedAt: new Date(),
        fileSize: 0,
        altText: 'Favicon',
      },
      headerImage: {
        url: '',
        fileName: '',
        mimeType: 'image/png',
        uploadedAt: new Date(),
        fileSize: 0,
        altText: 'Header',
      },
      footerLogo: {
        url: '',
        fileName: '',
        mimeType: 'image/png',
        uploadedAt: new Date(),
        fileSize: 0,
        altText: 'Footer Logo',
      },
      loginBackground: {
        url: '',
        fileName: '',
        mimeType: 'image/png',
        uploadedAt: new Date(),
        fileSize: 0,
        altText: 'Login Background',
      },
      dashboardBackground: {
        url: '',
        fileName: '',
        mimeType: 'image/png',
        uploadedAt: new Date(),
        fileSize: 0,
        altText: 'Dashboard Background',
      },
      customCSS: '',
      customJavaScript: '',
    };
  }

  /**
   * Create default customization
   */
  private createDefaultCustomization(): CustomizationSettings {
    return {
      colors: {
        primary: '#0066CC',
        secondary: '#4A90E2',
        accent: '#FF6B6B',
        background: '#FFFFFF',
        text: '#333333',
        error: '#E74C3C',
        warning: '#F39C12',
        success: '#27AE60',
        border: '#E0E0E0',
      },
      typography: {
        primaryFont: 'Arial, sans-serif',
        secondaryFont: 'Helvetica, sans-serif',
        fontSize: {
          small: 12,
          medium: 14,
          large: 16,
          xlarge: 20,
        },
        fontWeight: {
          light: 300,
          normal: 400,
          bold: 700,
        },
      },
      layout: {
        headerStyle: 'default',
        sidebarPosition: 'left',
        footerStyle: 'default',
        maxContainerWidth: 1400,
        compactMode: false,
      },
      features: {
        enabledFeatures: [],
        disabledFeatures: [],
        featureVisibility: {},
        customMenuItems: [],
        removedMenuItems: [],
        customPages: [],
      },
      userInterface: {
        buttonStyle: 'default',
        borderRadius: 4,
        shadowStyle: 'light',
        animationEnabled: true,
        darkModeSupport: true,
        customNotifications: false,
        customDialogs: false,
      },
    };
  }

  /**
   * Update branding
   */
  updateBranding(orgId: string, branding: Partial<BrandingAssets>): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.customBranding = { ...org.customBranding, ...branding };
    org.updatedAt = new Date();
  }

  /**
   * Update colors
   */
  updateColors(orgId: string, colors: Partial<ColorScheme>): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.customization.colors = { ...org.customization.colors, ...colors };
    org.updatedAt = new Date();
  }

  /**
   * Update layout settings
   */
  updateLayout(orgId: string, layout: Partial<LayoutSettings>): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.customization.layout = { ...org.customization.layout, ...layout };
    org.updatedAt = new Date();
  }

  /**
   * Add custom menu item
   */
  addMenuItem(orgId: string, menuItem: MenuItem): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.customization.features.customMenuItems.push(menuItem);
    org.updatedAt = new Date();
  }

  /**
   * Add custom page
   */
  addCustomPage(orgId: string, page: CustomPage): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.customization.features.customPages.push(page);
    org.updatedAt = new Date();
  }

  /**
   * Create email template
   */
  createEmailTemplate(template: EmailTemplate): void {
    this.emailTemplates.set(template.id, template);
  }

  /**
   * Get email template
   */
  getEmailTemplate(templateId: string): EmailTemplate | null {
    return this.emailTemplates.get(templateId) || null;
  }

  /**
   * Render email template
   */
  renderEmailTemplate(
    templateId: string,
    variables: Record<string, any>
  ): { subject: string; body: string } {
    const template = this.getEmailTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let subject = template.subject;
    let body = template.template;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      body = body.replace(regex, String(value));
    });

    return { subject, body };
  }

  /**
   * Setup custom domain
   */
  setupCustomDomain(
    orgId: string,
    domain: string
  ): CustomDomainConfig {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    const config: CustomDomainConfig = {
      domain,
      verified: false,
      verificationMethod: 'dns',
      dnsRecords: [
        {
          type: 'CNAME',
          name: domain,
          value: `app.blockstop.io`,
          verified: false,
        },
        {
          type: 'TXT',
          name: `_blockstop.${domain}`,
          value: `blockstop-verification=${orgId}`,
          verified: false,
        },
      ],
      createdAt: new Date(),
    };

    this.customDomains.set(domain, config);
    org.customDomain = domain;
    org.whitelabelConfig.customDomain = domain;
    org.updatedAt = new Date();

    return config;
  }

  /**
   * Verify custom domain
   */
  verifyCustomDomain(domain: string): boolean {
    const config = this.customDomains.get(domain);
    if (!config) {
      return false;
    }

    // In production, this would check DNS records
    config.verified = true;
    config.dnsRecords?.forEach((record) => {
      record.verified = true;
    });

    return true;
  }

  /**
   * Enable white-label
   */
  enableWhiteLabel(orgId: string): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.whitelabelConfig.enabled = true;
    org.updatedAt = new Date();
  }

  /**
   * Disable white-label
   */
  disableWhiteLabel(orgId: string): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    org.whitelabelConfig.enabled = false;
    org.updatedAt = new Date();
  }

  /**
   * Get organization config
   */
  getOrganization(orgId: string): WhiteLabelOrganization | null {
    return this.organizations.get(orgId) || null;
  }

  /**
   * Generate preview theme
   */
  generatePreviewTheme(orgId: string): Record<string, any> {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    return {
      colors: org.customization.colors,
      typography: org.customization.typography,
      branding: {
        logo: org.customBranding.logo.url,
        favicon: org.customBranding.favicon.url,
      },
      layout: org.customization.layout,
      customCSS: org.customBranding.customCSS,
    };
  }

  /**
   * Export configuration
   */
  exportConfiguration(orgId: string): string {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    return JSON.stringify({
      organization: org.organizationName,
      whitelabel: org.whitelabelConfig,
      customization: org.customization,
      customBranding: org.customBranding,
      timestamp: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Import configuration
   */
  importConfiguration(orgId: string, config: any): void {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization ${orgId} not found`);
    }

    if (config.whitelabel) {
      org.whitelabelConfig = { ...org.whitelabelConfig, ...config.whitelabel };
    }
    if (config.customization) {
      org.customization = { ...org.customization, ...config.customization };
    }
    if (config.customBranding) {
      org.customBranding = { ...org.customBranding, ...config.customBranding };
    }

    org.updatedAt = new Date();
  }

  /**
   * Clone organization configuration
   */
  cloneConfiguration(sourceOrgId: string, targetOrgId: string): void {
    const source = this.organizations.get(sourceOrgId);
    const target = this.organizations.get(targetOrgId);

    if (!source || !target) {
      throw new Error('Source or target organization not found');
    }

    target.whitelabelConfig = JSON.parse(JSON.stringify(source.whitelabelConfig));
    target.customization = JSON.parse(JSON.stringify(source.customization));
    target.customBranding = JSON.parse(JSON.stringify(source.customBranding));
    target.updatedAt = new Date();
  }
}

export const whiteLabelEngine = new WhiteLabelEngine();
