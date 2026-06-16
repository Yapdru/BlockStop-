/**
 * Marketplace Service
 * Main service coordinating marketplace operations
 */

import { PluginSubmissionService, SubmissionStatus } from './plugin-submission';
import { PluginReviewService } from './plugin-review';
import { PluginVersioningService } from './plugin-versioning';
import { PluginDistributionService } from './plugin-distribution';

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId: string;
  type: string;
  version: string;
  rating: number;
  downloads: number;
  published: boolean;
  publishedAt?: Date;
  updatedAt: Date;
  icon?: string;
  tags?: string[];
  license?: string;
  repository?: string;
}

export interface MarketplaceStats {
  totalPlugins: number;
  totalDownloads: number;
  averageRating: number;
  pendingReviews: number;
  totalReviews: number;
}

export class MarketplaceService {
  private submissionService: PluginSubmissionService;
  private reviewService: PluginReviewService;
  private versioningService: PluginVersioningService;
  private distributionService: PluginDistributionService;
  private plugins: Map<string, MarketplacePlugin> = new Map();

  constructor() {
    this.submissionService = new PluginSubmissionService();
    this.reviewService = new PluginReviewService();
    this.versioningService = new PluginVersioningService();
    this.distributionService = new PluginDistributionService();
  }

  public async submitPlugin(
    pluginData: Omit<MarketplacePlugin, 'published' | 'publishedAt' | 'updatedAt'> & {
      manifest: any;
      changeLog?: string;
    }
  ): Promise<string> {
    const submissionId = await this.submissionService.submitPlugin(
      pluginData.id,
      pluginData.version,
      pluginData.authorId,
      pluginData.author,
      pluginData.manifest,
      pluginData.changeLog
    );

    return submissionId;
  }

  public async publishPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.published = true;
    plugin.publishedAt = new Date();
    plugin.updatedAt = new Date();
  }

  public async unpublishPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.published = false;
  }

  public registerPlugin(plugin: MarketplacePlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }

    this.plugins.set(plugin.id, {
      ...plugin,
      updatedAt: new Date(),
    });
  }

  public getPlugin(pluginId: string): MarketplacePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  public searchPlugins(query: string): MarketplacePlugin[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.plugins.values()).filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.id.toLowerCase().includes(lowerQuery) ||
        p.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  public getPluginsByType(type: string): MarketplacePlugin[] {
    return Array.from(this.plugins.values()).filter(
      p => p.type === type && p.published
    );
  }

  public getPluginsByAuthor(authorId: string): MarketplacePlugin[] {
    return Array.from(this.plugins.values()).filter(
      p => p.authorId === authorId
    );
  }

  public getTrendingPlugins(limit: number = 10): MarketplacePlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.published)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  public getTopRatedPlugins(limit: number = 10): MarketplacePlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.published)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  public getNewPlugins(limit: number = 10): MarketplacePlugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.published)
      .sort(
        (a, b) =>
          (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
      )
      .slice(0, limit);
  }

  public updatePluginMetadata(pluginId: string, metadata: Partial<MarketplacePlugin>): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    Object.assign(plugin, metadata, { updatedAt: new Date() });
  }

  public async getMarketplaceStats(): Promise<MarketplaceStats> {
    const plugins = Array.from(this.plugins.values());
    const publishedPlugins = plugins.filter(p => p.published);

    let totalDownloads = 0;
    let totalRating = 0;

    for (const plugin of publishedPlugins) {
      totalDownloads += plugin.downloads;
      totalRating += plugin.rating;
    }

    const submissionStats = this.submissionService.getSubmissionStats();
    const reviewStats = this.reviewService.getReviewStats();

    return {
      totalPlugins: publishedPlugins.length,
      totalDownloads,
      averageRating:
        publishedPlugins.length > 0 ? totalRating / publishedPlugins.length : 0,
      pendingReviews: submissionStats.byStatus[SubmissionStatus.UNDER_REVIEW] || 0,
      totalReviews: reviewStats.total,
    };
  }

  public listAllPlugins(): MarketplacePlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.published);
  }

  public getSubmissionService(): PluginSubmissionService {
    return this.submissionService;
  }

  public getReviewService(): PluginReviewService {
    return this.reviewService;
  }

  public getVersioningService(): PluginVersioningService {
    return this.versioningService;
  }

  public getDistributionService(): PluginDistributionService {
    return this.distributionService;
  }
}
