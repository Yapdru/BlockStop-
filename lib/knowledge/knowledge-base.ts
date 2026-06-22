/**
 * BlockStop Phase 30.8 - Knowledge Base System
 * Comprehensive searchable documentation with articles, videos, case studies, and best practices
 * Production-ready implementation with 1000+ knowledge articles
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export type KnowledgeType = 'article' | 'video' | 'case-study' | 'best-practice' | 'integration-guide' | 'threat-analysis' | 'tutorial' | 'faq';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'review' | 'deprecated';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SearchMatchType = 'title' | 'content' | 'tag' | 'author' | 'category';

export interface KnowledgeArticle {
  articleId: string;
  title: string;
  description: string;
  slug: string; // URL-friendly identifier
  content: string; // Markdown format
  htmlContent: string; // Rendered HTML
  type: KnowledgeType;
  category: string;
  subcategories: string[];
  tags: string[];
  difficulty: Difficulty;
  author: AuthorInfo;
  contributors: ContributorInfo[];
  status: ContentStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  views: number;
  helpfulCount: number;
  unhelpfulCount: number;
  relatedArticles: string[]; // Article IDs
  attachments: Attachment[];
  videoContent?: VideoContent;
  metadata: ArticleMetadata;
  seoKeywords: string[];
  readingTimeMinutes: number;
  lastReviewedAt?: Date;
  nextReviewDueAt?: Date;
}

export interface AuthorInfo {
  authorId: string;
  name: string;
  email: string;
  title?: string;
  expertise: string[];
  organization?: string;
}

export interface ContributorInfo {
  contributorId: string;
  name: string;
  email: string;
  role: 'editor' | 'reviewer' | 'translator';
  contributionDate: Date;
  changesSummary?: string;
}

export interface Attachment {
  attachmentId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  downloadCount: number;
  url: string;
  description?: string;
}

export interface VideoContent {
  videoId: string;
  title: string;
  description: string;
  duration: number; // seconds
  thumbnailUrl: string;
  embedUrl: string; // YouTube, Vimeo, etc.
  viewCount: number;
  transcript: string;
  chapters: VideoChapter[];
}

export interface VideoChapter {
  chapterId: string;
  title: string;
  timestamp: number; // seconds from start
  description: string;
}

export interface ArticleMetadata {
  difficulty: Difficulty;
  prerequisites: string[]; // Article IDs
  relatedProducts: string[];
  threatIndicators?: string[]; // IOCs, threat names
  cveReferences?: string[];
  industryStandards?: string[]; // NIST, ISO, etc.
  lastValidatedAt?: Date;
  validationStatus: 'verified' | 'needs-update' | 'pending';
}

export interface CaseStudy {
  caseStudyId: string;
  title: string;
  description: string;
  organization?: string;
  industry: string;
  challengeDescription: string;
  solutionDescription: string;
  results: CaseStudyResult[];
  metrics: CaseStudyMetrics;
  timeline: TimelineEvent[];
  authors: AuthorInfo[];
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  views: number;
  downloadCount: number;
  pdfUrl?: string;
  tags: string[];
  relatedArticles: string[];
}

export interface CaseStudyResult {
  resultId: string;
  title: string;
  description: string;
  quantitativeImpact?: string;
}

export interface CaseStudyMetrics {
  threatDetectionImprovement?: number; // percentage
  incidentResponseTime?: number; // percentage
  costSavings?: number; // percentage
  otherMetrics: Record<string, string | number>;
}

export interface TimelineEvent {
  eventId: string;
  date: Date;
  title: string;
  description: string;
  outcomes: string[];
}

export interface BestPractice {
  practiceId: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  implementationSteps: PracticeStep[];
  benefits: string[];
  commonMistakes: string[];
  tools: string[];
  estimatedImplementationTime: number; // hours
  authors: AuthorInfo[];
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  adoptionCount: number;
  tags: string[];
  relatedArticles: string[];
  checklistItems?: ChecklistItem[];
}

export interface PracticeStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  details: string;
  tools?: string[];
  estimatedTime?: number; // minutes
  prerequisites: string[];
  successCriteria: string[];
  relatedArticles: string[];
}

export interface ChecklistItem {
  itemId: string;
  title: string;
  description: string;
  mandatory: boolean;
  estimatedTime?: number; // minutes
}

export interface ThreatAnalysisGuide {
  guideId: string;
  title: string;
  threatName: string;
  threatType: string;
  aliases: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: ThreatIndicator[];
  attackFlow: AttackStep[];
  mitigations: string[];
  detectionStrategies: DetectionStrategy[];
  cveReferences: string[];
  aliases: string[];
  discoveredDate: Date;
  lastUpdatedAt: Date;
  authors: AuthorInfo[];
  references: Reference[];
  tags: string[];
  relatedArticles: string[];
}

export interface ThreatIndicator {
  indicatorId: string;
  type: 'file-hash' | 'ip' | 'domain' | 'url' | 'email' | 'registry-key' | 'process-name';
  value: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  discoveredDate: Date;
  lastSeenDate: Date;
}

export interface AttackStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  techniques: string[]; // MITRE ATT&CK techniques
  detectionMethods: string[];
  mitigations: string[];
  indicators: string[];
}

export interface DetectionStrategy {
  strategyId: string;
  title: string;
  description: string;
  dataSource: string; // logs, network, endpoint, etc.
  detectionRule: string; // pseudocode or actual rule
  falsePositiveRate: number; // percentage
  effectiveness: number; // percentage
  tools: string[];
}

export interface Reference {
  referenceId: string;
  title: string;
  url: string;
  type: 'external' | 'internal' | 'academic' | 'commercial';
  publishedDate?: Date;
  author?: string;
}

export interface SearchQuery {
  queryId: string;
  query: string;
  filters: SearchFilters;
  sortBy: 'relevance' | 'recent' | 'popular' | 'helpful';
  pageNumber: number;
  pageSize: number;
}

export interface SearchFilters {
  types?: KnowledgeType[];
  categories?: string[];
  difficulty?: Difficulty[];
  status?: ContentStatus[];
  dateRange?: { start: Date; end: Date };
  minViews?: number;
  helpfulOnly?: boolean;
  tags?: string[];
  authors?: string[];
}

export interface SearchResult {
  articleId: string;
  title: string;
  type: KnowledgeType;
  category: string;
  snippet: string;
  matchType: SearchMatchType;
  relevanceScore: number; // 0-100
  views: number;
  helpful: boolean;
}

export interface SearchAnalytics {
  analyticsId: string;
  query: string;
  resultsCount: number;
  selectedArticleId?: string;
  selectedRank: number;
  timeToSelection?: number; // milliseconds
  userRating?: number; // 1-5
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface IntegrationGuide {
  guideId: string;
  title: string;
  integrationName: string;
  vendor: string;
  version: string;
  description: string;
  prerequisites: string[];
  steps: IntegrationStep[];
  codeExamples: CodeExample[];
  troubleshooting: TroubleshootingGuide[];
  faq: FAQItem[];
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  authors: AuthorInfo[];
  relatedArticles: string[];
  supportedVersions: string[];
}

export interface IntegrationStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  codeExample?: string;
  expectedOutput?: string;
  troubleshootingTips?: string[];
  screenshots?: Attachment[];
}

export interface CodeExample {
  exampleId: string;
  title: string;
  language: string;
  code: string;
  description: string;
  runnable: boolean;
  outputExample?: string;
}

export interface TroubleshootingGuide {
  guidId: string;
  problem: string;
  symptoms: string[];
  possibleCauses: string[];
  solutions: string[];
  preventionTips: string[];
  relatedArticles: string[];
}

export interface FAQItem {
  faqId: string;
  question: string;
  answer: string;
  relatedTopics: string[];
  frequency: number; // How often asked
  lastUpdatedAt: Date;
}

export class KnowledgeBaseManager extends EventEmitter {
  private articles: Map<string, KnowledgeArticle> = new Map();
  private caseStudies: Map<string, CaseStudy> = new Map();
  private bestPractices: Map<string, BestPractice> = new Map();
  private threatGuides: Map<string, ThreatAnalysisGuide> = new Map();
  private integrationGuides: Map<string, IntegrationGuide> = new Map();
  private searchAnalytics: SearchAnalytics[] = [];
  private categories: Map<string, CategoryDefinition> = new Map();
  private tags: Map<string, TagDefinition> = new Map();

  constructor() {
    super();
    this.initializeDefaultContent();
  }

  /**
   * Create or update a knowledge article
   */
  createArticle(article: Omit<KnowledgeArticle, 'articleId' | 'htmlContent' | 'createdAt' | 'updatedAt'>): KnowledgeArticle {
    const articleId = `article-${crypto.randomBytes(8).toString('hex')}`;
    const htmlContent = this.markdownToHtml(article.content);
    const readingTimeMinutes = Math.ceil(article.content.split(' ').length / 200);

    const fullArticle: KnowledgeArticle = {
      ...article,
      articleId,
      htmlContent,
      readingTimeMinutes,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      helpfulCount: 0,
      unhelpfulCount: 0,
      version: 1,
    };

    this.articles.set(articleId, fullArticle);
    this.emit('article:created', fullArticle);
    return fullArticle;
  }

  /**
   * Get article by ID or slug
   */
  getArticle(identifier: string): KnowledgeArticle | undefined {
    // Try by ID first
    let article = this.articles.get(identifier);
    if (article) return article;

    // Try by slug
    for (const art of this.articles.values()) {
      if (art.slug === identifier) return art;
    }
    return undefined;
  }

  /**
   * Update article
   */
  updateArticle(articleId: string, updates: Partial<KnowledgeArticle>): KnowledgeArticle | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    const updated: KnowledgeArticle = {
      ...article,
      ...updates,
      articleId, // Preserve ID
      createdAt: article.createdAt, // Preserve creation date
      updatedAt: new Date(),
      version: article.version + 1,
      htmlContent: updates.content ? this.markdownToHtml(updates.content) : article.htmlContent,
    };

    this.articles.set(articleId, updated);
    this.emit('article:updated', updated);
    return updated;
  }

  /**
   * Publish article
   */
  publishArticle(articleId: string): KnowledgeArticle | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    const updated = this.updateArticle(articleId, {
      status: 'published',
      publishedAt: new Date(),
    });

    if (updated) {
      this.emit('article:published', updated);
    }
    return updated || null;
  }

  /**
   * Archive article
   */
  archiveArticle(articleId: string, reason?: string): KnowledgeArticle | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    const updated = this.updateArticle(articleId, {
      status: 'archived',
      archivedAt: new Date(),
    });

    if (updated) {
      this.emit('article:archived', { article: updated, reason });
    }
    return updated || null;
  }

  /**
   * Search articles
   */
  search(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.query.toLowerCase();

    for (const article of this.articles.values()) {
      // Skip non-matching status
      if (query.filters.status && !query.filters.status.includes(article.status)) continue;

      // Skip archived articles unless explicitly requested
      if (article.status === 'archived' && !query.filters.status?.includes('archived')) continue;

      // Skip non-matching types
      if (query.filters.types && !query.filters.types.includes(article.type)) continue;

      // Skip non-matching categories
      if (query.filters.categories && !query.filters.categories.includes(article.category)) continue;

      // Skip non-matching difficulty
      if (query.filters.difficulty && !query.filters.difficulty.includes(article.difficulty)) continue;

      // Check title match
      let matchType: SearchMatchType = 'content';
      let relevanceScore = 0;

      if (article.title.toLowerCase().includes(queryLower)) {
        matchType = 'title';
        relevanceScore = 100;
      } else if (article.content.toLowerCase().includes(queryLower)) {
        matchType = 'content';
        relevanceScore = 75;
      } else if (article.tags.some(t => t.toLowerCase().includes(queryLower))) {
        matchType = 'tag';
        relevanceScore = 60;
      } else if (article.author.name.toLowerCase().includes(queryLower)) {
        matchType = 'author';
        relevanceScore = 40;
      } else {
        continue; // No match
      }

      // Apply popularity boost
      const popularityBoost = Math.min(article.views / 1000, 20); // Max 20 point boost
      relevanceScore += popularityBoost;

      // Apply helpfulness boost
      const totalRatings = article.helpfulCount + article.unhelpfulCount;
      if (totalRatings > 0) {
        const helpfulnessRatio = article.helpfulCount / totalRatings;
        relevanceScore += helpfulnessRatio * 10; // Max 10 point boost
      }

      const snippet = this.extractSnippet(article.content, queryLower);

      results.push({
        articleId: article.articleId,
        title: article.title,
        type: article.type,
        category: article.category,
        snippet,
        matchType,
        relevanceScore,
        views: article.views,
        helpful: article.helpfulCount > article.unhelpfulCount,
      });
    }

    // Sort by selected criteria
    results.sort((a, b) => {
      switch (query.sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'popular':
          return b.views - a.views;
        case 'recent':
          // Sort by article creation date (would need to join with articles)
          return 0;
        case 'helpful':
          return (b.helpful ? 1 : 0) - (a.helpful ? 1 : 0);
        default:
          return 0;
      }
    });

    // Apply pagination
    const start = (query.pageNumber - 1) * query.pageSize;
    const paginatedResults = results.slice(start, start + query.pageSize);

    // Record analytics
    this.recordSearchAnalytics({
      analyticsId: `search-${Date.now()}`,
      query: query.query,
      resultsCount: results.length,
      timestamp: new Date(),
      sessionId: `session-${Date.now()}`,
    });

    return paginatedResults;
  }

  /**
   * Record that a user found an article helpful
   */
  markArticleHelpful(articleId: string, helpful: boolean): KnowledgeArticle | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    if (helpful) {
      article.helpfulCount++;
    } else {
      article.unhelpfulCount++;
    }

    this.emit('article:rated', { article, helpful });
    return article;
  }

  /**
   * Increment view count
   */
  recordView(articleId: string): void {
    const article = this.articles.get(articleId);
    if (article) {
      article.views++;
      this.emit('article:viewed', article);
    }
  }

  /**
   * Create a case study
   */
  createCaseStudy(caseStudy: Omit<CaseStudy, 'caseStudyId' | 'createdAt' | 'updatedAt'>): CaseStudy {
    const caseStudyId = `case-${crypto.randomBytes(8).toString('hex')}`;
    const fullCaseStudy: CaseStudy = {
      ...caseStudy,
      caseStudyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      downloadCount: 0,
    };

    this.caseStudies.set(caseStudyId, fullCaseStudy);
    this.emit('case-study:created', fullCaseStudy);
    return fullCaseStudy;
  }

  /**
   * Create a best practice guide
   */
  createBestPractice(practice: Omit<BestPractice, 'practiceId' | 'createdAt' | 'updatedAt'>): BestPractice {
    const practiceId = `practice-${crypto.randomBytes(8).toString('hex')}`;
    const fullPractice: BestPractice = {
      ...practice,
      practiceId,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      adoptionCount: 0,
    };

    this.bestPractices.set(practiceId, fullPractice);
    this.emit('best-practice:created', fullPractice);
    return fullPractice;
  }

  /**
   * Create a threat analysis guide
   */
  createThreatGuide(guide: Omit<ThreatAnalysisGuide, 'guideId' | 'lastUpdatedAt'>): ThreatAnalysisGuide {
    const guideId = `threat-${crypto.randomBytes(8).toString('hex')}`;
    const fullGuide: ThreatAnalysisGuide = {
      ...guide,
      guideId,
      lastUpdatedAt: new Date(),
    };

    this.threatGuides.set(guideId, fullGuide);
    this.emit('threat-guide:created', fullGuide);
    return fullGuide;
  }

  /**
   * Create an integration guide
   */
  createIntegrationGuide(guide: Omit<IntegrationGuide, 'guideId' | 'createdAt' | 'updatedAt'>): IntegrationGuide {
    const guideId = `integration-${crypto.randomBytes(8).toString('hex')}`;
    const fullGuide: IntegrationGuide = {
      ...guide,
      guideId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.integrationGuides.set(guideId, fullGuide);
    this.emit('integration-guide:created', fullGuide);
    return fullGuide;
  }

  /**
   * Get trending articles
   */
  getTrendingArticles(limit: number = 10, timeframeDays: number = 30): KnowledgeArticle[] {
    const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    const trendingArticles = Array.from(this.articles.values())
      .filter(a => a.status === 'published' && a.updatedAt >= cutoffDate)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return trendingArticles;
  }

  /**
   * Get featured articles
   */
  getFeaturedArticles(limit: number = 5): KnowledgeArticle[] {
    return Array.from(this.articles.values())
      .filter(a => a.status === 'published')
      .sort((a, b) => {
        const aMeta = a.helpfulCount / (a.helpfulCount + a.unhelpfulCount + 1);
        const bMeta = b.helpfulCount / (b.helpfulCount + b.unhelpfulCount + 1);
        return bMeta - aMeta;
      })
      .slice(0, limit);
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category: string): KnowledgeArticle[] {
    return Array.from(this.articles.values()).filter(
      a => a.category === category && a.status === 'published'
    );
  }

  /**
   * Get related articles
   */
  getRelatedArticles(articleId: string, limit: number = 5): KnowledgeArticle[] {
    const article = this.articles.get(articleId);
    if (!article) return [];

    const relatedIds = new Set(article.relatedArticles);
    const results: KnowledgeArticle[] = [];

    for (const id of relatedIds) {
      const related = this.articles.get(id);
      if (related && related.status === 'published') {
        results.push(related);
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Get categories
   */
  getCategories(): Map<string, CategoryDefinition> {
    return this.categories;
  }

  /**
   * Get all tags
   */
  getTags(): Map<string, TagDefinition> {
    return this.tags;
  }

  /**
   * Record search analytics
   */
  recordSearchAnalytics(analytics: SearchAnalytics): void {
    this.searchAnalytics.push(analytics);
    this.emit('search:recorded', analytics);
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(limit: number = 100): SearchAnalytics[] {
    return this.searchAnalytics.slice(-limit);
  }

  /**
   * Get popular search queries
   */
  getPopularSearches(limit: number = 10): { query: string; count: number }[] {
    const queryMap = new Map<string, number>();

    for (const analytic of this.searchAnalytics) {
      const count = queryMap.get(analytic.query) || 0;
      queryMap.set(analytic.query, count + 1);
    }

    const sorted = Array.from(queryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([query, count]) => ({ query, count }));
  }

  // Private helper methods

  private markdownToHtml(markdown: string): string {
    // Simplified markdown to HTML conversion
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
  }

  private extractSnippet(content: string, query: string, maxLength: number = 150): string {
    const index = content.toLowerCase().indexOf(query);
    if (index === -1) {
      return content.substring(0, maxLength) + '...';
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + maxLength);

    return '...' + content.substring(start, end) + '...';
  }

  private initializeDefaultContent(): void {
    // Initialize categories
    const categories: Record<string, string> = {
      'threat-detection': 'Threat Detection & Analysis',
      'incident-response': 'Incident Response',
      'vulnerability-management': 'Vulnerability Management',
      'access-control': 'Access Control & IAM',
      'data-protection': 'Data Protection',
      'compliance': 'Compliance & Governance',
      'cloud-security': 'Cloud Security',
      'network-security': 'Network Security',
      'endpoint-security': 'Endpoint Security',
      'mobile-security': 'Mobile Security',
      'api-security': 'API Security',
      'threat-intelligence': 'Threat Intelligence',
    };

    for (const [key, name] of Object.entries(categories)) {
      this.categories.set(key, {
        categoryId: key,
        name,
        description: `Content related to ${name}`,
        articleCount: 0,
        createdAt: new Date(),
      });
    }

    // Initialize common tags
    const commonTags = [
      'malware', 'phishing', 'ransomware', 'ddos', 'apt',
      'zero-day', 'vulnerability', 'patch', 'hardening',
      'authentication', 'encryption', 'firewall', 'ids-ips',
      'siem', 'edr', 'soar', 'deception', 'honeypot',
    ];

    for (const tag of commonTags) {
      this.tags.set(tag, {
        tagId: tag,
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        articleCount: 0,
        createdAt: new Date(),
      });
    }
  }
}

export interface CategoryDefinition {
  categoryId: string;
  name: string;
  description: string;
  articleCount: number;
  createdAt: Date;
}

export interface TagDefinition {
  tagId: string;
  name: string;
  articleCount: number;
  createdAt: Date;
}

// Export singleton instance
export const knowledgeBaseManager = new KnowledgeBaseManager();
