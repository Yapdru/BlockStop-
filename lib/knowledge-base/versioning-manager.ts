import { Version } from './types';
import { KB_CONFIG, ERROR_MESSAGES } from './constants';
import { v4 as uuidv4 } from 'uuid';

export interface VersionComparison {
  versionA: Version;
  versionB: Version;
  differences: Array<{
    type: 'added' | 'removed' | 'changed';
    field: string;
    oldValue?: any;
    newValue?: any;
  }>;
}

export class VersioningManager {
  private versions: Map<string, Version[]> = new Map();
  private versionMetadata: Map<string, Map<string, any>> = new Map();

  async createVersion(
    documentId: string,
    content: string,
    changes: string,
    userId: string,
    status: 'draft' | 'published' | 'archived' = 'draft'
  ): Promise<Version> {
    const versions = this.versions.get(documentId) || [];
    const versionNumber = versions.length + 1;

    const version: Version = {
      id: uuidv4(),
      documentId,
      versionNumber,
      content,
      changes,
      createdAt: new Date(),
      createdBy: userId,
      status,
    };

    versions.push(version);
    this.versions.set(documentId, versions);

    await this.maintainVersionHistory(documentId);

    return version;
  }

  async getVersion(documentId: string, versionNumber: number): Promise<Version | null> {
    const versions = this.versions.get(documentId) || [];
    return versions.find(v => v.versionNumber === versionNumber) || null;
  }

  async getLatestVersion(documentId: string): Promise<Version | null> {
    const versions = this.versions.get(documentId) || [];
    return versions[versions.length - 1] || null;
  }

  async getVersionHistory(documentId: string, limit?: number): Promise<Version[]> {
    const versions = this.versions.get(documentId) || [];
    const result = [...versions].reverse();

    if (limit) {
      return result.slice(0, limit);
    }

    return result;
  }

  async getVersionsByStatus(
    documentId: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<Version[]> {
    const versions = this.versions.get(documentId) || [];
    return versions.filter(v => v.status === status);
  }

  async updateVersionStatus(
    documentId: string,
    versionNumber: number,
    newStatus: 'draft' | 'published' | 'archived'
  ): Promise<Version> {
    const version = await this.getVersion(documentId, versionNumber);
    if (!version) throw new Error(ERROR_MESSAGES.INVALID_VERSION);

    version.status = newStatus;
    return version;
  }

  async compareVersions(
    documentId: string,
    versionA: number,
    versionB: number
  ): Promise<VersionComparison | null> {
    const vA = await this.getVersion(documentId, versionA);
    const vB = await this.getVersion(documentId, versionB);

    if (!vA || !vB) return null;

    const differences: VersionComparison['differences'] = [];

    if (vA.content !== vB.content) {
      differences.push({
        type: 'changed',
        field: 'content',
        oldValue: vA.content.substring(0, 100),
        newValue: vB.content.substring(0, 100),
      });
    }

    if (vA.changes !== vB.changes) {
      differences.push({
        type: 'changed',
        field: 'changes',
        oldValue: vA.changes,
        newValue: vB.changes,
      });
    }

    return {
      versionA: vA,
      versionB: vB,
      differences,
    };
  }

  async rollbackToVersion(
    documentId: string,
    targetVersionNumber: number,
    userId: string
  ): Promise<Version> {
    const targetVersion = await this.getVersion(documentId, targetVersionNumber);
    if (!targetVersion) throw new Error(ERROR_MESSAGES.INVALID_VERSION);

    return this.createVersion(
      documentId,
      targetVersion.content,
      `Rollback to version ${targetVersionNumber}`,
      userId,
      'draft'
    );
  }

  async publishVersion(documentId: string, versionNumber: number): Promise<Version> {
    const version = await this.getVersion(documentId, versionNumber);
    if (!version) throw new Error(ERROR_MESSAGES.INVALID_VERSION);

    const versions = this.versions.get(documentId) || [];
    versions.forEach(v => {
      if (v.status === 'published') {
        v.status = 'archived';
      }
    });

    version.status = 'published';
    return version;
  }

  async archiveVersion(documentId: string, versionNumber: number): Promise<Version> {
    return this.updateVersionStatus(documentId, versionNumber, 'archived');
  }

  async deleteArchivedVersions(documentId: string, keepCount: number = 5): Promise<number> {
    const versions = this.versions.get(documentId) || [];
    const archived = versions.filter(v => v.status === 'archived');

    if (archived.length <= keepCount) {
      return 0;
    }

    const toDelete = archived.length - keepCount;
    const deleted = archived.slice(0, toDelete);

    this.versions.set(
      documentId,
      versions.filter(v => !deleted.includes(v))
    );

    return deleted.length;
  }

  async getVersionMetadata(documentId: string, versionNumber: number): Promise<Record<string, any> | null> {
    const key = `${documentId}:${versionNumber}`;
    return this.versionMetadata.get(documentId)?.get(key) || null;
  }

  async setVersionMetadata(
    documentId: string,
    versionNumber: number,
    metadata: Record<string, any>
  ): Promise<void> {
    const key = `${documentId}:${versionNumber}`;
    let docMetadata = this.versionMetadata.get(documentId);

    if (!docMetadata) {
      docMetadata = new Map();
      this.versionMetadata.set(documentId, docMetadata);
    }

    docMetadata.set(key, metadata);
  }

  async getVersionStats(documentId: string): Promise<{
    totalVersions: number;
    publishedVersions: number;
    archivedVersions: number;
    draftVersions: number;
    oldestVersion: Date | null;
    newestVersion: Date | null;
  }> {
    const versions = this.versions.get(documentId) || [];

    const published = versions.filter(v => v.status === 'published').length;
    const archived = versions.filter(v => v.status === 'archived').length;
    const draft = versions.filter(v => v.status === 'draft').length;

    return {
      totalVersions: versions.length,
      publishedVersions: published,
      archivedVersions: archived,
      draftVersions: draft,
      oldestVersion: versions[0]?.createdAt || null,
      newestVersion: versions[versions.length - 1]?.createdAt || null,
    };
  }

  async pruneOldVersions(
    documentId: string,
    retentionDays: number = KB_CONFIG.AUTO_ARCHIVE_VERSIONS_DAYS
  ): Promise<number> {
    const versions = this.versions.get(documentId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const toArchive = versions.filter(
      v => v.status === 'draft' && v.createdAt < cutoffDate
    );

    toArchive.forEach(v => {
      v.status = 'archived';
    });

    return toArchive.length;
  }

  private async maintainVersionHistory(documentId: string): Promise<void> {
    const versions = this.versions.get(documentId) || [];

    if (versions.length > KB_CONFIG.MAX_VERSIONS) {
      const excess = versions.length - KB_CONFIG.MAX_VERSIONS;
      const toRemove = versions.splice(0, excess);

      toRemove.forEach(v => {
        const key = `${documentId}:${v.versionNumber}`;
        this.versionMetadata.get(documentId)?.delete(key);
      });

      this.versions.set(documentId, versions);
    }
  }

  async exportVersionHistory(documentId: string): Promise<{
    documentId: string;
    versions: Version[];
    exportDate: Date;
  }> {
    const versions = await this.getVersionHistory(documentId);

    return {
      documentId,
      versions,
      exportDate: new Date(),
    };
  }
}
