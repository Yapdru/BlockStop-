import { SearchResult, SearchFilters, KBCategory } from './types';
import { SEARCH_WEIGHTS } from './constants';
import { v4 as uuidv4 } from 'uuid';

export interface IndexedDocument {
  id: string;
  title: string;
  content: string;
  category: KBCategory;
  tags: string[];
  createdBy: string;
  isPublished: boolean;
  url?: string;
}

export class SearchEngine {
  private index: Map<string, Set<string>> = new Map();
  private documents: Map<string, IndexedDocument> = new Map();
  private searchHistory: Array<{ query: string; timestamp: Date; resultCount: number }> = [];
  private maxHistorySize = 1000;

  async indexDocument(document: IndexedDocument): Promise<void> {
    this.documents.set(document.id, document);

    const terms = this.tokenize(document.title, document.content, document.tags);

    terms.forEach(term => {
      const docSet = this.index.get(term) || new Set();
      docSet.add(document.id);
      this.index.set(term, docSet);
    });
  }

  async removeFromIndex(documentId: string): Promise<void> {
    this.documents.delete(documentId);

    this.index.forEach(docSet => {
      docSet.delete(documentId);
    });
  }

  async search(query: string, filters?: SearchFilters, limit: number = 100): Promise<SearchResult[]> {
    const startTime = Date.now();
    const terms = this.tokenize(query);
    const candidates = new Map<string, number>();

    terms.forEach(term => {
      const docIds = this.index.get(term) || new Set();

      docIds.forEach(docId => {
        const score = candidates.get(docId) || 0;
        candidates.set(docId, score + 1);
      });
    });

    let results: SearchResult[] = Array.from(candidates.entries())
      .map(([docId, termMatches]) => {
        const doc = this.documents.get(docId);
        if (!doc) return null;

        const score = this.calculateRelevanceScore(doc, query, termMatches);

        return {
          id: doc.id,
          title: doc.title,
          content: doc.content.substring(0, 200),
          score,
          category: doc.category,
          matchedTerms: terms,
          url: doc.url,
        };
      })
      .filter((r): r is SearchResult => r !== null);

    results = this.applyFilters(results, filters);
    results = results.sort((a, b) => b.score - a.score).slice(0, limit);

    this.recordSearch(query, results.length);

    return results;
  }

  async advancedSearch(
    query: string,
    options: {
      category?: KBCategory;
      tags?: string[];
      author?: string;
      dateFrom?: Date;
      dateTo?: Date;
      isPublished?: boolean;
    },
    limit: number = 100
  ): Promise<SearchResult[]> {
    const basicResults = await this.search(query, undefined, limit * 2);

    return basicResults
      .filter(result => {
        const doc = this.documents.get(result.id);
        if (!doc) return false;

        if (options.category && doc.category !== options.category) return false;
        if (options.author && doc.createdBy !== options.author) return false;
        if (options.isPublished !== undefined && doc.isPublished !== options.isPublished) return false;

        if (options.tags && options.tags.length > 0) {
          return options.tags.some(tag => doc.tags.includes(tag));
        }

        return true;
      })
      .slice(0, limit);
  }

  async suggestTerms(prefix: string, limit: number = 10): Promise<string[]> {
    const suggestions = new Set<string>();

    this.index.forEach((_, term) => {
      if (term.startsWith(prefix.toLowerCase())) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  async getRelatedDocuments(docId: string, limit: number = 5): Promise<SearchResult[]> {
    const doc = this.documents.get(docId);
    if (!doc) return [];

    const terms = this.tokenize(doc.title, doc.content);
    const relatedCandidates = new Map<string, number>();

    terms.forEach(term => {
      const docIds = this.index.get(term) || new Set();

      docIds.forEach(relatedDocId => {
        if (relatedDocId !== docId) {
          const score = relatedCandidates.get(relatedDocId) || 0;
          relatedCandidates.set(relatedDocId, score + 1);
        }
      });
    });

    return Array.from(relatedCandidates.entries())
      .map(([relatedDocId, matches]) => {
        const relatedDoc = this.documents.get(relatedDocId);
        if (!relatedDoc) return null;

        return {
          id: relatedDoc.id,
          title: relatedDoc.title,
          content: relatedDoc.content.substring(0, 200),
          score: matches,
          category: relatedDoc.category,
          matchedTerms: terms.filter(t =>
            relatedDoc.title.toLowerCase().includes(t) ||
            relatedDoc.content.toLowerCase().includes(t)
          ),
          url: relatedDoc.url,
        };
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateRelevanceScore(
    doc: IndexedDocument,
    query: string,
    termMatches: number
  ): number {
    let score = termMatches;

    const titleWeight = query.split(/\s+/).filter(term =>
      doc.title.toLowerCase().includes(term.toLowerCase())
    ).length * SEARCH_WEIGHTS.TITLE;

    const tagWeight = query.split(/\s+/).filter(term =>
      doc.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
    ).length * SEARCH_WEIGHTS.TAGS;

    score += titleWeight + tagWeight;

    if (doc.isPublished) score *= 1.2;

    return score;
  }

  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      const doc = this.documents.get(result.id);
      if (!doc) return false;

      if (filters.category && doc.category !== filters.category) return false;
      if (filters.createdBy && doc.createdBy !== filters.createdBy) return false;
      if (filters.isPublished !== undefined && doc.isPublished !== filters.isPublished) return false;

      if (filters.tags && filters.tags.length > 0) {
        return filters.tags.some(tag => doc.tags.includes(tag));
      }

      return true;
    });
  }

  private tokenize(...texts: (string | string[] | undefined)[]): string[] {
    const tokens = new Set<string>();

    texts.forEach(text => {
      if (!text) return;

      const str = Array.isArray(text) ? text.join(' ') : text;
      const parts = str
        .toLowerCase()
        .split(/\W+/)
        .filter(term => term.length > 2);

      parts.forEach(term => tokens.add(term));
    });

    return Array.from(tokens);
  }

  private recordSearch(query: string, resultCount: number): void {
    this.searchHistory.push({
      query,
      timestamp: new Date(),
      resultCount,
    });

    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(-this.maxHistorySize);
    }
  }

  async getSearchStats(): Promise<{
    indexSize: number;
    documentCount: number;
    uniqueTerms: number;
    recentQueries: string[];
  }> {
    return {
      indexSize: this.index.size,
      documentCount: this.documents.size,
      uniqueTerms: this.index.size,
      recentQueries: this.searchHistory
        .slice(-10)
        .reverse()
        .map(h => h.query),
    };
  }

  async clearSearchHistory(): Promise<void> {
    this.searchHistory = [];
  }

  async rebuildIndex(documents: IndexedDocument[]): Promise<void> {
    this.index.clear();
    this.documents.clear();

    for (const doc of documents) {
      await this.indexDocument(doc);
    }
  }
}
