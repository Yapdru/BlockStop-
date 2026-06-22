/**
 * App Marketplace - Community App Store
 * Manages app installation, updates, permissions, ratings, and developer revenue sharing
 */

export interface AppPermission {
  id: string;
  resource: string; // 'incidents', 'threats', 'users', 'files', 'api', etc.
  action: 'read' | 'write' | 'delete' | 'execute';
  description: string;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  homepage?: string;
  license: string;
  repository?: string;
  keywords: string[];
  permissions: AppPermission[];
  entryPoint: string; // main component/function
  configuration?: Record<string, any>;
  minVersion?: string; // minimum BlockStop version
  icon?: string; // base64 or URL
  screenshots?: string[];
}

export interface MarketplaceApp {
  id: string;
  manifest: AppManifest;
  status: 'draft' | 'published' | 'deprecated' | 'suspended';
  rating: number; // 0-5
  reviewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  updatedBy: string;
}

export interface AppInstallation {
  id: string;
  appId: string;
  appName: string;
  appVersion: string;
  userId: string;
  organizationId: string;
  status: 'installing' | 'active' | 'disabled' | 'error';
  configuration: Record<string, any>;
  permissions: AppPermission[];
  installedAt: Date;
  lastUpdated?: Date;
  error?: string;
}

export interface AppSandbox {
  appId: string;
  isolationLevel: 'basic' | 'restricted' | 'isolated';
  allowedAPIs: string[];
  maxMemory: number; // MB
  maxCPU: number; // percentage
  timeout: number; // milliseconds
  fileSystemAccess: boolean;
  networkAccess: boolean;
  databaseAccess: boolean;
}

export interface AppReview {
  id: string;
  appId: string;
  userId: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt?: Date;
  verified: boolean; // user has installed the app
}

export interface DeveloperRevenue {
  developerId: string;
  appId: string;
  appName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalInstalls: number;
  newInstalls: number;
  uninstalls: number;
  totalRevenue: number;
  commission: number; // percentage
  earnings: number;
  payoutStatus: 'pending' | 'processed' | 'failed';
  payoutDate?: Date;
}

export interface AppUpdate {
  id: string;
  appId: string;
  version: string;
  releaseNotes: string;
  changelog: string[];
  downloadUrl: string;
  releaseDate: Date;
  breaking: boolean; // breaking changes
  autoUpdate: boolean;
  securityPatch: boolean;
}

export class AppMarketplace {
  private apps: Map<string, MarketplaceApp> = new Map();
  private installations: Map<string, AppInstallation> = new Map();
  private reviews: Map<string, AppReview> = new Map();
  private sandboxes: Map<string, AppSandbox> = new Map();
  private revenues: Map<string, DeveloperRevenue> = new Map();
  private updates: Map<string, AppUpdate> = new Map();

  private readonly COMMISSION_RATE = 0.3; // 30% commission

  /**
   * Submit app to marketplace
   */
  submitApp(manifest: AppManifest, submittedBy: string): MarketplaceApp {
    const appId = this.generateId();

    const app: MarketplaceApp = {
      id: appId,
      manifest,
      status: 'draft',
      rating: 0,
      reviewCount: 0,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: submittedBy,
    };

    this.apps.set(appId, app);

    // Create default sandbox
    const sandbox: AppSandbox = {
      appId,
      isolationLevel: 'restricted',
      allowedAPIs: [],
      maxMemory: 256,
      maxCPU: 50,
      timeout: 30000,
      fileSystemAccess: false,
      networkAccess: false,
      databaseAccess: false,
    };

    this.sandboxes.set(appId, sandbox);

    return app;
  }

  /**
   * Publish app
   */
  publishApp(appId: string): MarketplaceApp | null {
    const app = this.apps.get(appId);
    if (!app) return null;

    app.status = 'published';
    app.publishedAt = new Date();
    app.updatedAt = new Date();

    return app;
  }

  /**
   * Deprecate app
   */
  deprecateApp(appId: string): MarketplaceApp | null {
    const app = this.apps.get(appId);
    if (!app) return null;

    app.status = 'deprecated';
    app.updatedAt = new Date();

    return app;
  }

  /**
   * Suspend app
   */
  suspendApp(appId: string, reason: string): MarketplaceApp | null {
    const app = this.apps.get(appId);
    if (!app) return null;

    app.status = 'suspended';
    app.updatedAt = new Date();

    // Disable all installations
    Array.from(this.installations.values())
      .filter((i) => i.appId === appId)
      .forEach((i) => {
        i.status = 'disabled';
        i.error = `App suspended: ${reason}`;
      });

    return app;
  }

  /**
   * Get app
   */
  getApp(appId: string): MarketplaceApp | null {
    return this.apps.get(appId) || null;
  }

  /**
   * List apps
   */
  listApps(filters?: { status?: string; author?: string; keyword?: string; limit?: number }): MarketplaceApp[] {
    let apps = Array.from(this.apps.values()).filter((a) => a.status === 'published');

    if (filters?.author) {
      apps = apps.filter((a) => a.manifest.author.name === filters.author);
    }

    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.manifest.name.toLowerCase().includes(keyword) ||
          a.manifest.description.toLowerCase().includes(keyword) ||
          a.manifest.keywords.some((k) => k.toLowerCase().includes(keyword))
      );
    }

    apps.sort((a, b) => b.rating - a.rating || b.downloadCount - a.downloadCount);

    if (filters?.limit) {
      apps = apps.slice(0, filters.limit);
    }

    return apps;
  }

  /**
   * Install app
   */
  installApp(
    appId: string,
    userId: string,
    organizationId: string,
    configuration?: Record<string, any>
  ): AppInstallation | null {
    const app = this.apps.get(appId);
    if (!app || app.status !== 'published') {
      throw new Error('App not available for installation');
    }

    const installId = this.generateId();

    const installation: AppInstallation = {
      id: installId,
      appId,
      appName: app.manifest.name,
      appVersion: app.manifest.version,
      userId,
      organizationId,
      status: 'installing',
      configuration: configuration || {},
      permissions: app.manifest.permissions,
      installedAt: new Date(),
    };

    this.installations.set(installId, installation);

    // Update download count
    app.downloadCount++;

    return installation;
  }

  /**
   * Uninstall app
   */
  uninstallApp(installationId: string): boolean {
    const installation = this.installations.get(installationId);
    if (!installation) return false;

    const app = this.apps.get(installation.appId);
    if (app) {
      app.downloadCount = Math.max(0, app.downloadCount - 1);
    }

    this.installations.delete(installationId);
    return true;
  }

  /**
   * Get installation
   */
  getInstallation(installationId: string): AppInstallation | null {
    return this.installations.get(installationId) || null;
  }

  /**
   * List installations for user
   */
  listInstallations(userId: string, organizationId?: string): AppInstallation[] {
    return Array.from(this.installations.values()).filter(
      (i) => i.userId === userId && (!organizationId || i.organizationId === organizationId)
    );
  }

  /**
   * Add review
   */
  addReview(
    appId: string,
    userId: string,
    rating: number,
    title: string,
    comment: string
  ): AppReview {
    const app = this.apps.get(appId);
    if (!app) {
      throw new Error('App not found');
    }

    const reviewId = this.generateId();

    const review: AppReview = {
      id: reviewId,
      appId,
      userId,
      rating: Math.max(1, Math.min(5, rating)),
      title,
      comment,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      verified: this.isUserInstalledApp(userId, appId),
    };

    this.reviews.set(reviewId, review);

    // Update app rating
    this.updateAppRating(appId);

    return review;
  }

  /**
   * Get reviews for app
   */
  getReviews(appId: string, limit: number = 50): AppReview[] {
    return Array.from(this.reviews.values())
      .filter((r) => r.appId === appId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Mark review as helpful
   */
  markReviewHelpful(reviewId: string): AppReview | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    review.helpful++;
    return review;
  }

  /**
   * Update app version
   */
  updateAppVersion(appId: string, newVersion: string, releaseNotes: string, changelog: string[]): AppUpdate {
    const updateId = this.generateId();

    const update: AppUpdate = {
      id: updateId,
      appId,
      version: newVersion,
      releaseNotes,
      changelog,
      downloadUrl: `https://marketplace.blockstop.io/apps/${appId}/v${newVersion}`,
      releaseDate: new Date(),
      breaking: false,
      autoUpdate: true,
      securityPatch: false,
    };

    this.updates.set(updateId, update);

    // Update app version in marketplace
    const app = this.apps.get(appId);
    if (app) {
      app.manifest.version = newVersion;
      app.updatedAt = new Date();
    }

    return update;
  }

  /**
   * Get app sandbox
   */
  getSandbox(appId: string): AppSandbox | null {
    return this.sandboxes.get(appId) || null;
  }

  /**
   * Update sandbox permissions
   */
  updateSandbox(appId: string, sandbox: Partial<AppSandbox>): AppSandbox | null {
    const existing = this.sandboxes.get(appId);
    if (!existing) return null;

    const updated = { ...existing, ...sandbox };
    this.sandboxes.set(appId, updated);
    return updated;
  }

  /**
   * Calculate revenue for developer
   */
  calculateRevenue(
    developerId: string,
    startDate: Date,
    endDate: Date
  ): DeveloperRevenue[] {
    const developerApps = Array.from(this.apps.values()).filter(
      (a) => a.manifest.author.email === developerId
    );

    const revenues: DeveloperRevenue[] = [];

    for (const app of developerApps) {
      const installations = Array.from(this.installations.values())
        .filter((i) => i.appId === app.id && i.installedAt >= startDate && i.installedAt <= endDate)
        .length;

      const totalRevenue = installations * 99; // $99 per installation

      const revenue: DeveloperRevenue = {
        developerId,
        appId: app.id,
        appName: app.manifest.name,
        period: { startDate, endDate },
        totalInstalls: app.downloadCount,
        newInstalls: installations,
        uninstalls: 0,
        totalRevenue,
        commission: this.COMMISSION_RATE * 100,
        earnings: totalRevenue * (1 - this.COMMISSION_RATE),
        payoutStatus: 'pending',
      };

      revenues.push(revenue);
    }

    return revenues;
  }

  /**
   * Process payout
   */
  processPayout(developerId: string, month: number, year: number): boolean {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const revenues = this.calculateRevenue(developerId, startDate, endDate);

    for (const revenue of revenues) {
      revenue.payoutStatus = 'processed';
      revenue.payoutDate = new Date();
    }

    return true;
  }

  /**
   * Check if user installed app
   */
  private isUserInstalledApp(userId: string, appId: string): boolean {
    return Array.from(this.installations.values()).some(
      (i) => i.userId === userId && i.appId === appId && i.status === 'active'
    );
  }

  /**
   * Update app rating
   */
  private updateAppRating(appId: string): void {
    const reviews = Array.from(this.reviews.values()).filter((r) => r.appId === appId);

    if (reviews.length === 0) return;

    const app = this.apps.get(appId);
    if (!app) return;

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    app.rating = Math.round(averageRating * 10) / 10;
    app.reviewCount = reviews.length;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AppMarketplace;
