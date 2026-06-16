/**
 * Plugin Distribution
 * Handles plugin distribution, downloads, and installations
 */

export interface DistributionMetadata {
  pluginId: string;
  version: string;
  publishedAt: Date;
  downloadUrl: string;
  checksum: string;
  fileSize: number;
  releaseNotes?: string;
  minBlockstopVersion?: string;
}

export interface DownloadStats {
  pluginId: string;
  version: string;
  downloads: number;
  lastDownloadAt?: Date;
  uniqueDownloads: number;
}

export class PluginDistributionService {
  private distributions: Map<string, DistributionMetadata> = new Map();
  private downloadStats: Map<string, DownloadStats> = new Map();
  private downloadHistory: Array<{
    timestamp: Date;
    pluginId: string;
    version: string;
    userId?: string;
    ipAddress?: string;
  }> = [];

  public publishDistribution(
    pluginId: string,
    version: string,
    downloadUrl: string,
    checksum: string,
    fileSize: number,
    releaseNotes?: string,
    minBlockstopVersion?: string
  ): string {
    const id = `dist-${pluginId}-${version}-${Date.now()}`;

    const metadata: DistributionMetadata = {
      pluginId,
      version,
      publishedAt: new Date(),
      downloadUrl,
      checksum,
      fileSize,
      releaseNotes,
      minBlockstopVersion,
    };

    this.distributions.set(id, metadata);

    // Initialize download stats
    const statsKey = `${pluginId}:${version}`;
    if (!this.downloadStats.has(statsKey)) {
      this.downloadStats.set(statsKey, {
        pluginId,
        version,
        downloads: 0,
        uniqueDownloads: 0,
      });
    }

    return id;
  }

  public getDistribution(distributionId: string): DistributionMetadata | undefined {
    return this.distributions.get(distributionId);
  }

  public getDistributionByPluginVersion(
    pluginId: string,
    version: string
  ): DistributionMetadata | undefined {
    return Array.from(this.distributions.values()).find(
      d => d.pluginId === pluginId && d.version === version
    );
  }

  public recordDownload(
    pluginId: string,
    version: string,
    userId?: string,
    ipAddress?: string
  ): void {
    const statsKey = `${pluginId}:${version}`;
    const stats = this.downloadStats.get(statsKey);

    if (!stats) {
      throw new Error(`No distribution found for ${pluginId}@${version}`);
    }

    stats.downloads++;
    stats.lastDownloadAt = new Date();

    // Track unique downloads by IP if available
    if (ipAddress) {
      const key = `${pluginId}:${version}:${ipAddress}`;
      if (!this.downloadHistory.some(h => h.pluginId === pluginId && h.version === version)) {
        stats.uniqueDownloads++;
      }
    }

    this.downloadHistory.push({
      timestamp: new Date(),
      pluginId,
      version,
      userId,
      ipAddress,
    });
  }

  public getDownloadStats(pluginId: string, version: string): DownloadStats | undefined {
    const statsKey = `${pluginId}:${version}`;
    return this.downloadStats.get(statsKey);
  }

  public getPluginDownloadStats(pluginId: string): DownloadStats[] {
    return Array.from(this.downloadStats.values()).filter(
      s => s.pluginId === pluginId
    );
  }

  public getTotalDownloads(pluginId: string): number {
    return this.getPluginDownloadStats(pluginId).reduce(
      (sum, s) => sum + s.downloads,
      0
    );
  }

  public getTrendingPlugins(limit: number = 10): Array<{
    pluginId: string;
    totalDownloads: number;
    versions: number;
  }> {
    const pluginStats = new Map<
      string,
      { downloads: number; versions: Set<string> }
    >();

    for (const stats of this.downloadStats.values()) {
      if (!pluginStats.has(stats.pluginId)) {
        pluginStats.set(stats.pluginId, { downloads: 0, versions: new Set() });
      }

      const pluginStat = pluginStats.get(stats.pluginId)!;
      pluginStat.downloads += stats.downloads;
      pluginStat.versions.add(stats.version);
    }

    return Array.from(pluginStats.entries())
      .map(([pluginId, stat]) => ({
        pluginId,
        totalDownloads: stat.downloads,
        versions: stat.versions.size,
      }))
      .sort((a, b) => b.totalDownloads - a.totalDownloads)
      .slice(0, limit);
  }

  public verifyChecksum(data: string, expectedChecksum: string): boolean {
    // In production, implement actual checksum verification
    // For now, this is a placeholder
    return true;
  }

  public getDownloadHistory(
    pluginId?: string,
    limit: number = 100
  ): typeof this.downloadHistory {
    let history = this.downloadHistory;

    if (pluginId) {
      history = history.filter(h => h.pluginId === pluginId);
    }

    return history.slice(-limit);
  }

  public getDistributionStats(): {
    totalDistributions: number;
    totalDownloads: number;
    averageDownloadsPerVersion: number;
    pluginsPublished: number;
  } {
    const stats = {
      totalDistributions: this.distributions.size,
      totalDownloads: 0,
      averageDownloadsPerVersion: 0,
      pluginsPublished: new Set<string>(),
    };

    for (const downloadStat of this.downloadStats.values()) {
      stats.totalDownloads += downloadStat.downloads;
      stats.pluginsPublished.add(downloadStat.pluginId);
    }

    if (this.downloadStats.size > 0) {
      stats.averageDownloadsPerVersion = stats.totalDownloads / this.downloadStats.size;
    }

    return {
      ...stats,
      pluginsPublished: stats.pluginsPublished.size,
    };
  }

  public getAllDistributions(): DistributionMetadata[] {
    return Array.from(this.distributions.values());
  }

  public getVersionsForPlugin(pluginId: string): DistributionMetadata[] {
    return Array.from(this.distributions.values())
      .filter(d => d.pluginId === pluginId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}
