import { KBAnalytics } from './types';
import { KB_CONFIG } from './constants';
import { v4 as uuidv4 } from 'uuid';

export interface AccessEvent {
  id: string;
  documentId: string;
  userId: string;
  eventType: 'view' | 'download' | 'search' | 'share' | 'rate';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsReport {
  reportId: string;
  generatedAt: Date;
  dateRange: { start: Date; end: Date };
  totalViews: number;
  totalDownloads: number;
  totalSearches: number;
  topDocuments: Array<{ id: string; title: string; views: number }>;
  averageRating: number;
  engagementRate: number;
}

export class AnalyticsTracker {
  private analytics: Map<string, KBAnalytics> = new Map();
  private events: AccessEvent[] = [];
  private maxEventsSize = 10000;

  trackAccess(
    documentId: string,
    userId: string,
    eventType: 'view' | 'download' | 'search' | 'share' | 'rate',
    metadata?: Record<string, any>
  ): AccessEvent {
    const event: AccessEvent = {
      id: uuidv4(),
      documentId,
      userId,
      eventType,
      timestamp: new Date(),
      metadata,
    };

    this.events.push(event);

    if (this.events.length > this.maxEventsSize) {
      this.events = this.events.slice(-this.maxEventsSize);
    }

    this.updateAnalytics(documentId, eventType);

    return event;
  }

  private updateAnalytics(documentId: string, eventType: string): void {
    let analytics = this.analytics.get(documentId);

    if (!analytics) {
      analytics = {
        documentId,
        views: 0,
        searches: 0,
        downloads: 0,
        shares: 0,
        lastAccessed: new Date(),
        averageRating: 0,
        feedbackCount: 0,
      };
      this.analytics.set(documentId, analytics);
    }

    switch (eventType) {
      case 'view':
        analytics.views++;
        break;
      case 'download':
        analytics.downloads++;
        break;
      case 'search':
        analytics.searches++;
        break;
      case 'share':
        analytics.shares++;
        break;
      case 'rate':
        analytics.feedbackCount++;
        break;
    }

    analytics.lastAccessed = new Date();
  }

  async getAnalytics(documentId: string): Promise<KBAnalytics | null> {
    return this.analytics.get(documentId) || null;
  }

  async rateDocument(documentId: string, rating: number): Promise<KBAnalytics> {
    let analytics = this.analytics.get(documentId);

    if (!analytics) {
      analytics = {
        documentId,
        views: 0,
        searches: 0,
        downloads: 0,
        shares: 0,
        lastAccessed: new Date(),
        averageRating: 0,
        feedbackCount: 0,
      };
      this.analytics.set(documentId, analytics);
    }

    const totalRating = analytics.averageRating * analytics.feedbackCount;
    analytics.feedbackCount++;
    analytics.averageRating = (totalRating + rating) / analytics.feedbackCount;

    return analytics;
  }

  async getTopDocuments(limit: number = 10, metric: 'views' | 'downloads' | 'ratings' = 'views'): Promise<KBAnalytics[]> {
    let analytics = Array.from(this.analytics.values());

    switch (metric) {
      case 'views':
        analytics = analytics.sort((a, b) => b.views - a.views);
        break;
      case 'downloads':
        analytics = analytics.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'ratings':
        analytics = analytics.sort((a, b) => b.averageRating - a.averageRating);
        break;
    }

    return analytics.slice(0, limit);
  }

  async generateReport(startDate: Date, endDate: Date): Promise<AnalyticsReport> {
    const filteredEvents = this.events.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const documentMetrics = new Map<string, { views: number; downloads: number }>();

    filteredEvents.forEach(event => {
      if (event.eventType === 'view' || event.eventType === 'download') {
        const metrics = documentMetrics.get(event.documentId) || { views: 0, downloads: 0 };
        if (event.eventType === 'view') metrics.views++;
        else metrics.downloads++;
        documentMetrics.set(event.documentId, metrics);
      }
    });

    const topDocuments = Array.from(documentMetrics.entries())
      .map(([id, metrics]) => ({ id, title: `Doc ${id.substring(0, 8)}`, views: metrics.views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const totalRatings = Array.from(this.analytics.values()).reduce((sum, a) => sum + a.feedbackCount, 0);
    const totalAverageRating =
      totalRatings > 0
        ? Array.from(this.analytics.values()).reduce((sum, a) => sum + a.averageRating * a.feedbackCount, 0) /
          totalRatings
        : 0;

    const viewCount = filteredEvents.filter(e => e.eventType === 'view').length;
    const searchCount = filteredEvents.filter(e => e.eventType === 'search').length;

    return {
      reportId: uuidv4(),
      generatedAt: new Date(),
      dateRange: { start: startDate, end: endDate },
      totalViews: viewCount,
      totalDownloads: filteredEvents.filter(e => e.eventType === 'download').length,
      totalSearches: searchCount,
      topDocuments,
      averageRating: totalAverageRating,
      engagementRate: viewCount > 0 ? (searchCount / viewCount) * 100 : 0,
    };
  }

  async getDocumentEngagement(documentId: string): Promise<{
    totalAccesses: number;
    uniqueUsers: number;
    lastAccessedDaysAgo: number;
    engagementTrend: number;
  }> {
    const docEvents = this.events.filter(e => e.documentId === documentId);
    const uniqueUsers = new Set(docEvents.map(e => e.userId)).size;

    const analytics = this.analytics.get(documentId);
    const lastAccessed = analytics?.lastAccessed;
    const daysSinceAccess = lastAccessed
      ? Math.floor((Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
      : -1;

    const recentEvents = docEvents.filter(
      e => e.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    const olderEvents = docEvents.filter(
      e => e.timestamp.getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000 &&
           e.timestamp.getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;

    const trend = olderEvents > 0 ? ((recentEvents - olderEvents) / olderEvents) * 100 : 0;

    return {
      totalAccesses: docEvents.length,
      uniqueUsers,
      lastAccessedDaysAgo: daysSinceAccess,
      engagementTrend: trend,
    };
  }

  async getEventHistory(documentId?: string, limit: number = 100): Promise<AccessEvent[]> {
    let events = [...this.events];

    if (documentId) {
      events = events.filter(e => e.documentId === documentId);
    }

    return events.slice(-limit).reverse();
  }

  async cleanupOldAnalytics(beforeDate: Date): Promise<number> {
    const initialSize = this.events.length;

    this.events = this.events.filter(e => e.timestamp >= beforeDate);

    return initialSize - this.events.length;
  }

  async getAnalyticsStats(): Promise<{
    totalDocuments: number;
    totalViews: number;
    totalDownloads: number;
    avgRating: number;
  }> {
    const allAnalytics = Array.from(this.analytics.values());

    const totalViews = allAnalytics.reduce((sum, a) => sum + a.views, 0);
    const totalDownloads = allAnalytics.reduce((sum, a) => sum + a.downloads, 0);
    const avgRating =
      allAnalytics.length > 0
        ? allAnalytics.reduce((sum, a) => sum + a.averageRating, 0) / allAnalytics.length
        : 0;

    return {
      totalDocuments: allAnalytics.length,
      totalViews,
      totalDownloads,
      avgRating,
    };
  }
}
