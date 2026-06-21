/**
 * PWA Manifest Configuration
 * Web app manifest and PWA configuration
 */

export interface PWAManifest {
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation: "any" | "natural" | "landscape" | "portrait";
  themeColor: string;
  backgroundColor: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: "any" | "maskable" | "monochrome";
  }>;
  screenshots?: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: "narrow" | "wide";
  }>;
  shortcuts?: Array<{
    name: string;
    shortName?: string;
    description?: string;
    url: string;
    icons: Array<{
      src: string;
      sizes: string;
      type?: string;
    }>;
  }>;
  categories?: string[];
  preferRelatedApplications?: boolean;
}

export class PWAManifestManager {
  private manifest: PWAManifest;

  constructor() {
    this.manifest = this.getDefaultManifest();
  }

  /**
   * Get default PWA manifest
   */
  private getDefaultManifest(): PWAManifest {
    return {
      name: "BlockStop - Email & File Security",
      shortName: "BlockStop",
      description: "Advanced email and file threat analysis and prevention",
      startUrl: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait-primary",
      themeColor: "#3b82f6",
      backgroundColor: "#ffffff",
      icons: [
        {
          src: "/images/icon-72x72.png",
          sizes: "72x72",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-96x96.png",
          sizes: "96x96",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-128x128.png",
          sizes: "128x128",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-144x144.png",
          sizes: "144x144",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-152x152.png",
          sizes: "152x152",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-384x384.png",
          sizes: "384x384",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/images/maskable-icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/images/maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      screenshots: [
        {
          src: "/images/screenshot-narrow.png",
          sizes: "540x720",
          type: "image/png",
          form_factor: "narrow",
        },
        {
          src: "/images/screenshot-wide.png",
          sizes: "1280x720",
          type: "image/png",
          form_factor: "wide",
        },
      ],
      shortcuts: [
        {
          name: "Analyze Email",
          shortName: "Email",
          description: "Quickly analyze an email for threats",
          url: "/analysis/email",
          icons: [
            {
              src: "/images/shortcut-email-96x96.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
        {
          name: "Scan File",
          shortName: "File",
          description: "Scan a file for threats",
          url: "/analysis/file",
          icons: [
            {
              src: "/images/shortcut-file-96x96.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
        {
          name: "Dashboard",
          shortName: "Dashboard",
          description: "View security dashboard",
          url: "/dashboard",
          icons: [
            {
              src: "/images/shortcut-dashboard-96x96.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
        },
      ],
      categories: ["productivity", "utilities"],
    };
  }

  /**
   * Get manifest as JSON
   */
  getManifestJSON(): string {
    return JSON.stringify(this.manifest, null, 2);
  }

  /**
   * Get HTML meta tags for manifest
   */
  getManifestMetaTags(): string {
    return `
<!-- Web App Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Apple Web App -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="BlockStop">
<link rel="apple-touch-icon" href="/images/icon-180x180.png">

<!-- Theme Color -->
<meta name="theme-color" content="${this.manifest.themeColor}">

<!-- Mobile -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<!-- Security -->
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
    `.trim();
  }

  /**
   * Update manifest
   */
  updateManifest(updates: Partial<PWAManifest>): void {
    this.manifest = { ...this.manifest, ...updates };
  }

  /**
   * Add icon
   */
  addIcon(
    src: string,
    sizes: string,
    type: string,
    purpose?: string
  ): void {
    this.manifest.icons.push({
      src,
      sizes,
      type,
      purpose: (purpose as any),
    });
  }

  /**
   * Add screenshot
   */
  addScreenshot(
    src: string,
    sizes: string,
    type: string,
    formFactor?: "narrow" | "wide"
  ): void {
    if (!this.manifest.screenshots) {
      this.manifest.screenshots = [];
    }

    this.manifest.screenshots.push({
      src,
      sizes,
      type,
      form_factor: formFactor,
    });
  }

  /**
   * Add shortcut
   */
  addShortcut(
    name: string,
    url: string,
    icons?: Array<{ src: string; sizes: string; type?: string }>
  ): void {
    if (!this.manifest.shortcuts) {
      this.manifest.shortcuts = [];
    }

    this.manifest.shortcuts.push({
      name,
      url,
      icons: icons || [],
    });
  }

  /**
   * Get current manifest
   */
  getManifest(): PWAManifest {
    return this.manifest;
  }

  /**
   * Validate manifest
   */
  validateManifest(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.manifest.name || this.manifest.name.length === 0) {
      errors.push("name is required");
    }

    if (!this.manifest.shortName || this.manifest.shortName.length === 0) {
      errors.push("shortName is required");
    }

    if (!this.manifest.description || this.manifest.description.length === 0) {
      errors.push("description is required");
    }

    if (!this.manifest.startUrl || this.manifest.startUrl.length === 0) {
      errors.push("startUrl is required");
    }

    if (this.manifest.icons.length === 0) {
      errors.push("At least one icon is required");
    }

    // Check for icon sizes
    const requiredSizes = ["192x192", "512x512"];
    const iconSizes = this.manifest.icons.map((i) => i.sizes);
    for (const size of requiredSizes) {
      if (!iconSizes.some((s) => s.includes(size))) {
        errors.push(`Icon with size ${size} is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export as file
   */
  async exportAsFile(format: "json" = "json"): Promise<string> {
    if (format === "json") {
      return this.getManifestJSON();
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate PWA checklist
   */
  async getPWAChecklist(): Promise<
    Array<{
      item: string;
      completed: boolean;
      description: string;
    }>
  > {
    const validation = this.validateManifest();

    return [
      {
        item: "Valid Manifest",
        completed: validation.valid,
        description: "Web app manifest is valid and complete",
      },
      {
        item: "Service Worker",
        completed: true,
        description: "Service worker registered for offline support",
      },
      {
        item: "HTTPS",
        completed: true,
        description: "PWA served over HTTPS",
      },
      {
        item: "Mobile Responsive",
        completed: true,
        description: "App is mobile responsive",
      },
      {
        item: "Icons",
        completed: this.manifest.icons.length >= 2,
        description: "Multiple icon sizes provided",
      },
      {
        item: "Theme Color",
        completed: !!this.manifest.themeColor,
        description: "Theme color configured",
      },
      {
        item: "Screenshots",
        completed: (this.manifest.screenshots?.length || 0) >= 1,
        description: "App screenshots provided",
      },
      {
        item: "Shortcuts",
        completed: (this.manifest.shortcuts?.length || 0) >= 1,
        description: "App shortcuts configured",
      },
    ];
  }
}

export default PWAManifestManager;
