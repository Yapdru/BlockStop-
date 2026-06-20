import { KBDocument, KBCategory, AccessLevel, Version, SearchFilters } from './types';
import { KB_CONFIG, ERROR_MESSAGES } from './constants';
import { v4 as uuidv4 } from 'uuid';

export class KBEngine {
  private documents: Map<string, KBDocument> = new Map();
  private versions: Map<string, Version[]> = new Map();
  private accessControl: Map<string, Set<string>> = new Map();
  private lastModified: Map<string, Date> = new Map();

  async createDocument(
    document: Omit<KBDocument, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<KBDocument> {
    const id = uuidv4();
    const now = new Date();

    const newDoc: KBDocument = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.documents.set(id, newDoc);
    this.lastModified.set(id, now);

    await this.createVersion(id, newDoc.content, 'Initial version', newDoc.createdBy);

    return newDoc;
  }

  async updateDocument(id: string, updates: Partial<KBDocument>, userId: string): Promise<KBDocument> {
    const doc = this.documents.get(id);
    if (!doc) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const updatedDoc: KBDocument = {
      ...doc,
      ...updates,
      id: doc.id,
      createdAt: doc.createdAt,
      updatedAt: new Date(),
      version: doc.version + 1,
    };

    this.documents.set(id, updatedDoc);
    this.lastModified.set(id, updatedDoc.updatedAt);

    if (updates.content) {
      await this.createVersion(
        id,
        updates.content,
        `Updated by ${userId}`,
        userId
      );
    }

    return updatedDoc;
  }

  async getDocument(id: string, userId: string): Promise<KBDocument | null> {
    const doc = this.documents.get(id);
    if (!doc) return null;

    if (!this.hasAccess(id, userId)) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    return doc;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    if (doc.createdBy !== userId && !this.isAdmin(userId)) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    this.documents.delete(id);
    this.versions.delete(id);
    this.lastModified.delete(id);

    return true;
  }

  async getDocumentVersion(id: string, versionNumber: number): Promise<Version | null> {
    const versions = this.versions.get(id);
    if (!versions) return null;

    return versions.find(v => v.versionNumber === versionNumber) || null;
  }

  async listDocuments(filters?: SearchFilters, userId?: string): Promise<KBDocument[]> {
    let docs = Array.from(this.documents.values());

    if (filters?.category) {
      docs = docs.filter(d => d.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      docs = docs.filter(d => filters.tags!.some(t => d.tags.includes(t)));
    }

    if (filters?.createdBy) {
      docs = docs.filter(d => d.createdBy === filters.createdBy);
    }

    if (filters?.isPublished !== undefined) {
      docs = docs.filter(d => d.isPublished === filters.isPublished);
    }

    if (userId) {
      docs = docs.filter(d => this.hasAccess(d.id, userId));
    }

    return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async publishDocument(id: string, userId: string): Promise<KBDocument> {
    const doc = await this.getDocument(id, userId);
    if (!doc) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    return this.updateDocument(id, { isPublished: true }, userId);
  }

  async unpublishDocument(id: string, userId: string): Promise<KBDocument> {
    const doc = await this.getDocument(id, userId);
    if (!doc) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    return this.updateDocument(id, { isPublished: false }, userId);
  }

  async grantAccess(documentId: string, userId: string, accessLevel: AccessLevel): Promise<void> {
    if (!this.documents.has(documentId)) {
      throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);
    }

    const key = `${documentId}:${userId}`;
    const accessSet = this.accessControl.get(documentId) || new Set();
    accessSet.add(userId);
    this.accessControl.set(documentId, accessSet);
  }

  async revokeAccess(documentId: string, userId: string): Promise<void> {
    const accessSet = this.accessControl.get(documentId);
    if (accessSet) {
      accessSet.delete(userId);
    }
  }

  async getVersionHistory(id: string, limit: number = 10): Promise<Version[]> {
    const versions = this.versions.get(id) || [];
    return versions.slice(-limit).reverse();
  }

  async restoreVersion(documentId: string, versionNumber: number, userId: string): Promise<KBDocument> {
    const version = await this.getDocumentVersion(documentId, versionNumber);
    if (!version) throw new Error(ERROR_MESSAGES.INVALID_VERSION);

    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    return this.updateDocument(
      documentId,
      { content: version.content },
      userId
    );
  }

  private async createVersion(
    documentId: string,
    content: string,
    changes: string,
    userId: string
  ): Promise<void> {
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
      status: 'draft',
    };

    versions.push(version);
    this.versions.set(documentId, versions);

    if (versions.length > KB_CONFIG.MAX_VERSIONS) {
      versions.shift();
    }
  }

  private hasAccess(documentId: string, userId: string): boolean {
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    if (doc.accessLevel === AccessLevel.PUBLIC) return true;
    if (doc.createdBy === userId) return true;
    if (this.isAdmin(userId)) return true;

    const accessSet = this.accessControl.get(documentId);
    return accessSet?.has(userId) || false;
  }

  private isAdmin(userId: string): boolean {
    return userId.endsWith(':admin');
  }

  getStats(): { totalDocuments: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};

    Array.from(this.documents.values()).forEach(doc => {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
    });

    return {
      totalDocuments: this.documents.size,
      categories,
    };
  }
}
