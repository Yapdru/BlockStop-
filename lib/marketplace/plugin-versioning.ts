/**
 * Plugin Versioning
 * Manages plugin versions and compatibility
 */

export interface PluginVersion {
  id: string;
  pluginId: string;
  version: string;
  releaseDate: Date;
  description?: string;
  changeLog?: string;
  releaseNotes?: string;
  downloadCount: number;
  rating: number;
  stable: boolean;
  deprecated: boolean;
  deprecatedReason?: string;
  downloadUrl?: string;
  fileSize?: number;
  dependencies?: Record<string, string>;
  minBlockstopVersion?: string;
  maxBlockstopVersion?: string;
}

export class PluginVersioningService {
  private versions: Map<string, PluginVersion> = new Map();
  private pluginVersions: Map<string, string[]> = new Map(); // pluginId -> [versionIds]

  public createVersion(
    pluginId: string,
    versionNumber: string,
    description?: string
  ): string {
    const versionId = `${pluginId}-${versionNumber}`;

    if (this.versions.has(versionId)) {
      throw new Error(`Version ${versionNumber} of plugin ${pluginId} already exists`);
    }

    const version: PluginVersion = {
      id: versionId,
      pluginId,
      version: versionNumber,
      releaseDate: new Date(),
      description,
      downloadCount: 0,
      rating: 0,
      stable: true,
      deprecated: false,
    };

    this.versions.set(versionId, version);

    if (!this.pluginVersions.has(pluginId)) {
      this.pluginVersions.set(pluginId, []);
    }
    this.pluginVersions.get(pluginId)!.push(versionId);

    return versionId;
  }

  public getVersion(versionId: string): PluginVersion | undefined {
    return this.versions.get(versionId);
  }

  public getPluginVersions(pluginId: string): PluginVersion[] {
    const versionIds = this.pluginVersions.get(pluginId) || [];
    return versionIds
      .map(id => this.versions.get(id)!)
      .filter(v => !v.deprecated)
      .sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
  }

  public getLatestVersion(pluginId: string): PluginVersion | undefined {
    const versions = this.getPluginVersions(pluginId);
    return versions[0];
  }

  public getStableVersion(pluginId: string): PluginVersion | undefined {
    const versions = this.getPluginVersions(pluginId);
    return versions.find(v => v.stable);
  }

  public getAllVersions(pluginId: string): PluginVersion[] {
    const versionIds = this.pluginVersions.get(pluginId) || [];
    return versionIds
      .map(id => this.versions.get(id)!)
      .sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
  }

  public updateVersion(versionId: string, updates: Partial<PluginVersion>): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    Object.assign(version, updates);
  }

  public markAsStable(versionId: string): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Mark all other versions as unstable
    for (const v of this.versions.values()) {
      if (v.pluginId === version.pluginId) {
        v.stable = false;
      }
    }

    version.stable = true;
  }

  public deprecateVersion(versionId: string, reason?: string): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    version.deprecated = true;
    version.deprecatedReason = reason;
  }

  public undeprecateVersion(versionId: string): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    version.deprecated = false;
    version.deprecatedReason = undefined;
  }

  public incrementDownloadCount(versionId: string): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    version.downloadCount++;
  }

  public setRating(versionId: string, rating: number): void {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    version.rating = rating;
  }

  public compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  public checkCompatibility(
    versionId: string,
    blockstopVersion: string
  ): { compatible: boolean; reason?: string } {
    const version = this.versions.get(versionId);
    if (!version) {
      return { compatible: false, reason: `Version ${versionId} not found` };
    }

    if (
      version.minBlockstopVersion &&
      this.compareVersions(blockstopVersion, version.minBlockstopVersion) < 0
    ) {
      return {
        compatible: false,
        reason: `BlockStop version ${blockstopVersion} is below minimum ${version.minBlockstopVersion}`,
      };
    }

    if (
      version.maxBlockstopVersion &&
      this.compareVersions(blockstopVersion, version.maxBlockstopVersion) > 0
    ) {
      return {
        compatible: false,
        reason: `BlockStop version ${blockstopVersion} is above maximum ${version.maxBlockstopVersion}`,
      };
    }

    return { compatible: true };
  }

  public getVersionHistory(pluginId: string, limit: number = 10): PluginVersion[] {
    return this.getAllVersions(pluginId).slice(0, limit);
  }

  public getVersionStats(pluginId: string): {
    total: number;
    stable: number;
    deprecated: number;
    totalDownloads: number;
    averageRating: number;
  } {
    const versions = this.getAllVersions(pluginId);

    const stats = {
      total: versions.length,
      stable: 0,
      deprecated: 0,
      totalDownloads: 0,
      averageRating: 0,
    };

    let ratingSum = 0;

    for (const version of versions) {
      if (version.stable) stats.stable++;
      if (version.deprecated) stats.deprecated++;
      stats.totalDownloads += version.downloadCount;
      ratingSum += version.rating;
    }

    if (versions.length > 0) {
      stats.averageRating = ratingSum / versions.length;
    }

    return stats;
  }

  public getAllVersionsOfAllPlugins(): PluginVersion[] {
    return Array.from(this.versions.values());
  }
}
