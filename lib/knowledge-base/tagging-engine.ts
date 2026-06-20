import { KBTag } from './types';
import { COMMON_TAGS, ERROR_MESSAGES } from './constants';
import { v4 as uuidv4 } from 'uuid';

export class TaggingEngine {
  private tags: Map<string, KBTag> = new Map();
  private documentTags: Map<string, Set<string>> = new Map();
  private tagFrequency: Map<string, number> = new Map();

  constructor() {
    this.initializeCommonTags();
  }

  private initializeCommonTags(): void {
    COMMON_TAGS.forEach(tagName => {
      const tag: KBTag = {
        id: uuidv4(),
        name: tagName,
        description: `Common tag: ${tagName}`,
        color: this.generateColor(tagName),
        usageCount: 0,
        category: 'common',
      };

      this.tags.set(tagName, tag);
    });
  }

  async createTag(
    name: string,
    description: string,
    category: string,
    color?: string
  ): Promise<KBTag> {
    if (this.tags.has(name)) {
      throw new Error(`Tag '${name}' already exists`);
    }

    const tag: KBTag = {
      id: uuidv4(),
      name,
      description,
      color: color || this.generateColor(name),
      usageCount: 0,
      category,
    };

    this.tags.set(name, tag);
    this.tagFrequency.set(name, 0);

    return tag;
  }

  async getTag(name: string): Promise<KBTag | null> {
    return this.tags.get(name) || null;
  }

  async updateTag(name: string, updates: Partial<KBTag>): Promise<KBTag> {
    const tag = this.tags.get(name);
    if (!tag) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const updated: KBTag = {
      ...tag,
      ...updates,
      name: tag.name,
      id: tag.id,
    };

    this.tags.set(name, updated);
    return updated;
  }

  async deleteTag(name: string): Promise<boolean> {
    const tag = this.tags.get(name);
    if (!tag) return false;

    this.documentTags.forEach(tagSet => {
      tagSet.delete(name);
    });

    this.tags.delete(name);
    this.tagFrequency.delete(name);

    return true;
  }

  async assignTagToDocument(documentId: string, tagName: string): Promise<void> {
    const tag = this.tags.get(tagName);
    if (!tag) throw new Error(`Tag '${tagName}' not found`);

    const docTags = this.documentTags.get(documentId) || new Set();
    if (!docTags.has(tagName)) {
      docTags.add(tagName);
      this.documentTags.set(documentId, docTags);

      tag.usageCount++;
      const freq = (this.tagFrequency.get(tagName) || 0) + 1;
      this.tagFrequency.set(tagName, freq);
    }
  }

  async removeTagFromDocument(documentId: string, tagName: string): Promise<void> {
    const docTags = this.documentTags.get(documentId);
    if (docTags && docTags.has(tagName)) {
      docTags.delete(tagName);

      const tag = this.tags.get(tagName);
      if (tag && tag.usageCount > 0) {
        tag.usageCount--;
      }
    }
  }

  async getDocumentTags(documentId: string): Promise<KBTag[]> {
    const tagNames = this.documentTags.get(documentId) || new Set();
    return Array.from(tagNames)
      .map(name => this.tags.get(name))
      .filter((tag): tag is KBTag => tag !== undefined);
  }

  async getDocumentsWithTag(tagName: string): Promise<string[]> {
    const documents: string[] = [];

    this.documentTags.forEach((tagSet, docId) => {
      if (tagSet.has(tagName)) {
        documents.push(docId);
      }
    });

    return documents;
  }

  async getAllTags(): Promise<KBTag[]> {
    return Array.from(this.tags.values());
  }

  async getTagsByCategory(category: string): Promise<KBTag[]> {
    return Array.from(this.tags.values()).filter(tag => tag.category === category);
  }

  async getPopularTags(limit: number = 10): Promise<KBTag[]> {
    return Array.from(this.tags.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  async suggestTags(documentTitle: string, limit: number = 5): Promise<string[]> {
    const titleTerms = documentTitle
      .toLowerCase()
      .split(/\W+/)
      .filter(term => term.length > 2);

    const suggestions = new Map<string, number>();

    titleTerms.forEach(term => {
      this.tags.forEach((tag, tagName) => {
        if (
          tag.name.toLowerCase().includes(term) ||
          tag.description.toLowerCase().includes(term)
        ) {
          suggestions.set(tagName, (suggestions.get(tagName) || 0) + 1);
        }
      });
    });

    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tagName]) => tagName);
  }

  async mergeTagsIntoOne(fromTags: string[], intoTag: string): Promise<void> {
    const targetTag = this.tags.get(intoTag);
    if (!targetTag) throw new Error(`Target tag '${intoTag}' not found`);

    fromTags.forEach(fromTag => {
      if (!this.tags.has(fromTag)) return;

      const documentsToUpdate = this.getDocumentsWithTag(fromTag);

      documentsToUpdate.forEach(docId => {
        const docTags = this.documentTags.get(docId);
        if (docTags) {
          docTags.delete(fromTag);
          docTags.add(intoTag);
        }
      });

      const sourceTag = this.tags.get(fromTag);
      if (sourceTag) {
        targetTag.usageCount += sourceTag.usageCount;
        this.tags.delete(fromTag);
      }
    });
  }

  async getTagStats(): Promise<{
    totalTags: number;
    usedTags: number;
    unusedTags: number;
    avgUsagePerTag: number;
  }> {
    const allTags = Array.from(this.tags.values());
    const usedTags = allTags.filter(t => t.usageCount > 0);
    const totalUsage = usedTags.reduce((sum, t) => sum + t.usageCount, 0);

    return {
      totalTags: allTags.length,
      usedTags: usedTags.length,
      unusedTags: allTags.length - usedTags.length,
      avgUsagePerTag: usedTags.length > 0 ? totalUsage / usedTags.length : 0,
    };
  }

  async cleanupUnusedTags(): Promise<string[]> {
    const removed: string[] = [];

    const allTags = Array.from(this.tags.entries());
    for (const [tagName, tag] of allTags) {
      if (tag.usageCount === 0 && tag.category !== 'common') {
        this.tags.delete(tagName);
        removed.push(tagName);
      }
    }

    return removed;
  }

  private generateColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = (hash & 0xffffff) % 360;
    const saturation = 70 + (hash % 20);
    const lightness = 45 + (hash % 20);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  async replaceTag(oldTagName: string, newTagName: string): Promise<void> {
    const oldTag = this.tags.get(oldTagName);
    if (!oldTag) throw new Error(`Tag '${oldTagName}' not found`);

    let newTag = this.tags.get(newTagName);
    if (!newTag) {
      newTag = await this.createTag(
        newTagName,
        `Replacement for ${oldTagName}`,
        oldTag.category,
        oldTag.color
      );
    }

    const documents = this.getDocumentsWithTag(oldTagName);
    documents.forEach(docId => {
      this.removeTagFromDocument(docId, oldTagName);
      this.assignTagToDocument(docId, newTagName);
    });

    this.tags.delete(oldTagName);
  }
}
