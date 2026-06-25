/**
 * Professional Support Portal - Ticket system, knowledge base, video support
 * Manages support tickets, knowledge articles, and customer interactions
 */

import {
  SupportPortal,
  SupportTicket,
  TicketCategory,
  TicketStatus,
  TicketComment,
  SLATrack,
  KnowledgeArticle,
  FAQItem,
  VideoResource,
  SupportChannel,
  SupportStatistics,
} from '@/types/office-phase31';

/**
 * Support Portal Manager
 * Manages support tickets and knowledge base
 */
export class SupportPortalManager {
  private portal: SupportPortal;
  private ticketQueue: SupportTicket[] = [];

  constructor(organizationId: string) {
    this.portal = {
      id: `portal-${organizationId}`,
      organizationId,
      tickets: [],
      knowledgeBase: [],
      faqItems: [],
      videoLibrary: [],
      contactChannels: this.initializeChannels(),
      statistics: this.initializeStatistics(),
    };

    this.initializeKnowledgeBase();
  }

  /**
   * Create support ticket
   */
  public createTicket(
    category: TicketCategory,
    subject: string,
    description: string,
    createdBy: string,
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ): SupportTicket {
    const ticket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: `TKT-${this.portal.tickets.length + 1000}`,
      createdDate: new Date(),
      createdBy,
      category,
      subcategory: this.getSubcategory(category),
      subject,
      description,
      attachments: [],
      priority,
      severity: this.calculateSeverity(priority),
      status: 'open',
      timeSpentHours: 0,
      relatedTickets: [],
      comments: [],
      customFields: {},
      slaTracking: {
        initialResponseTime: this.getResponseSLA(priority),
        resolutionTime: this.getResolutionSLA(priority),
        initialResponseMET: false,
        resolutionMET: false,
      },
    };

    this.portal.tickets.push(ticket);
    this.ticketQueue.push(ticket);

    return ticket;
  }

  /**
   * Add comment to ticket
   */
  public addComment(
    ticketId: string,
    authorId: string,
    content: string,
    isInternal: boolean = false,
    attachments: string[] = []
  ): TicketComment | null {
    const ticket = this.portal.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    const comment: TicketComment = {
      id: `comment-${Date.now()}`,
      authorId,
      authorName: this.getAuthorName(authorId),
      timestamp: new Date(),
      content,
      attachments,
      isInternal,
      status: 'published',
    };

    ticket.comments.push(comment);

    // Update ticket status
    if (!isInternal && ticket.status === 'open') {
      ticket.status = 'assigned';
    }

    return comment;
  }

  /**
   * Assign ticket
   */
  public assignTicket(ticketId: string, assignedTo: string): SupportTicket | null {
    const ticket = this.portal.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    ticket.assignedTo = assignedTo;
    ticket.assignedDate = new Date();
    ticket.status = 'in_progress';

    // Record first response
    if (!ticket.slaTracking.firstResponseTime) {
      ticket.slaTracking.firstResponseTime = new Date();
      const deltaHours = (new Date().getTime() - ticket.createdDate.getTime()) / (1000 * 60 * 60);
      ticket.slaTracking.initialResponseMET = deltaHours <= ticket.slaTracking.initialResponseTime;
    }

    return ticket;
  }

  /**
   * Resolve ticket
   */
  public resolveTicket(
    ticketId: string,
    resolutionSummary: string
  ): SupportTicket | null {
    const ticket = this.portal.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    ticket.status = 'resolved';
    ticket.resolutionSummary = resolutionSummary;
    ticket.closedDate = new Date();

    // Calculate SLA metrics
    const deltaHours = (new Date().getTime() - ticket.createdDate.getTime()) / (1000 * 60 * 60);
    ticket.slaTracking.resolutionMET = deltaHours <= ticket.slaTracking.resolutionTime;

    return ticket;
  }

  /**
   * Close ticket
   */
  public closeTicket(ticketId: string): SupportTicket | null {
    const ticket = this.portal.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    ticket.status = 'closed';
    if (!ticket.closedDate) {
      ticket.closedDate = new Date();
    }

    return ticket;
  }

  /**
   * Create knowledge article
   */
  public createArticle(
    title: string,
    category: string,
    content: string,
    author: string,
    tags: string[] = []
  ): KnowledgeArticle {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const article: KnowledgeArticle = {
      id: `article-${Date.now()}`,
      title,
      slug,
      category,
      tags,
      content,
      createdDate: new Date(),
      updatedDate: new Date(),
      author,
      status: 'draft',
      views: 0,
      helpful: 0,
      unhelpful: 0,
      relatedArticles: [],
      attachments: [],
    };

    this.portal.knowledgeBase.push(article);
    return article;
  }

  /**
   * Publish article
   */
  public publishArticle(articleId: string): KnowledgeArticle | null {
    const article = this.portal.knowledgeBase.find((a) => a.id === articleId);
    if (!article) return null;

    article.status = 'published';
    article.updatedDate = new Date();

    return article;
  }

  /**
   * Add FAQ item
   */
  public addFAQ(
    question: string,
    answer: string,
    category: string,
    order: number
  ): FAQItem {
    const faq: FAQItem = {
      id: `faq-${Date.now()}`,
      question,
      answer,
      category,
      order,
      views: 0,
      helpful: 0,
      lastUpdatedDate: new Date(),
      updatedBy: 'system',
    };

    this.portal.faqItems.push(faq);
    return faq;
  }

  /**
   * Add video resource
   */
  public addVideo(
    title: string,
    description: string,
    category: string,
    duration: number,
    videoUrl: string,
    tags: string[] = []
  ): VideoResource {
    const video: VideoResource = {
      id: `video-${Date.now()}`,
      title,
      description,
      category,
      duration,
      videoUrl,
      createdDate: new Date(),
      updatedDate: new Date(),
      views: 0,
      tags,
      relatedArticles: [],
    };

    this.portal.videoLibrary.push(video);
    return video;
  }

  /**
   * Get ticket by ID
   */
  public getTicket(ticketId: string): SupportTicket | undefined {
    return this.portal.tickets.find((t) => t.id === ticketId);
  }

  /**
   * Get tickets by status
   */
  public getTicketsByStatus(status: TicketStatus): SupportTicket[] {
    return this.portal.tickets.filter((t) => t.status === status);
  }

  /**
   * Search knowledge base
   */
  public searchKnowledgeBase(query: string): KnowledgeArticle[] {
    const lowerQuery = query.toLowerCase();

    return this.portal.knowledgeBase.filter(
      (a) =>
        a.status === 'published' &&
        (a.title.toLowerCase().includes(lowerQuery) ||
          a.content.toLowerCase().includes(lowerQuery) ||
          a.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
    );
  }

  /**
   * Get support statistics
   */
  public getStatistics(): SupportStatistics {
    const openTickets = this.portal.tickets.filter((t) => t.status === 'open').length;
    const closedTickets = this.portal.tickets.filter((t) => t.status === 'closed').length;

    const avgResponseTime =
      this.portal.tickets.reduce((sum, t) => {
        if (t.slaTracking.firstResponseTime) {
          const delta = (t.slaTracking.firstResponseTime.getTime() - t.createdDate.getTime()) / (1000 * 60);
          return sum + delta;
        }
        return sum;
      }, 0) / Math.max(1, closedTickets);

    const avgResolutionTime =
      this.portal.tickets.filter((t) => t.closedDate).reduce((sum, t) => {
        if (t.closedDate) {
          const delta = (t.closedDate.getTime() - t.createdDate.getTime()) / (1000 * 60 * 60);
          return sum + delta;
        }
        return sum;
      }, 0) / Math.max(1, closedTickets);

    const slaMet = this.portal.tickets.filter(
      (t) => t.slaTracking.resolutionMET
    ).length;

    const metByCategory: Record<TicketCategory, number> = {
      incident: 0,
      request: 0,
      problem: 0,
      change: 0,
      vulnerability: 0,
      compliance: 0,
      general: 0,
    };

    const bySeverity: Record<string, number> = {
      blocking: 0,
      major: 0,
      minor: 0,
      cosmetic: 0,
    };

    this.portal.tickets.forEach((t) => {
      metByCategory[t.category]++;
      bySeverity[t.severity]++;
    });

    return {
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
      totalTickets: this.portal.tickets.length,
      openTickets,
      closedTickets,
      averageResolutionTime: avgResolutionTime,
      firstResponseTime: avgResponseTime,
      customerSatisfactionScore: 4.2,
      ticketsByCategory: metByCategory,
      ticketsBySeverity: bySeverity,
      slaMEtRate: (slaMet / Math.max(1, closedTickets)) * 100,
    };
  }

  /**
   * Get support dashboard
   */
  public getDashboard(): {
    openTickets: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaCompliance: number;
    topCategories: Array<{ category: string; count: number }>;
    articleViews: number;
    satisfactionScore: number;
  } {
    const stats = this.getStatistics();

    const topCategories = Object.entries(stats.ticketsByCategory)
      .map(([cat, count]) => ({ category: cat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const articleViews = this.portal.knowledgeBase.reduce((sum, a) => sum + a.views, 0);

    return {
      openTickets: stats.openTickets,
      averageResponseTime: Math.round(stats.firstResponseTime),
      averageResolutionTime: Math.round(stats.averageResolutionTime),
      slaCompliance: Math.round(stats.slaMEtRate),
      topCategories,
      articleViews,
      satisfactionScore: stats.customerSatisfactionScore,
    };
  }

  // ========== Private helper methods ==========

  private initializeChannels(): SupportChannel[] {
    return [
      {
        id: 'channel-email',
        name: 'Email Support',
        type: 'email',
        status: 'active',
        hoursOfOperation: {
          timezone: 'UTC',
          mondayFriday: { startTime: '08:00', endTime: '18:00' },
          weekend: { startTime: '09:00', endTime: '17:00' },
          holidays: [],
        },
        languages: ['en', 'es', 'fr'],
        contactInfo: 'support@organization.com',
        averageResponseTime: 120,
        timezone: 'UTC',
      },
      {
        id: 'channel-chat',
        name: 'Live Chat',
        type: 'chat',
        status: 'active',
        hoursOfOperation: {
          timezone: 'UTC',
          mondayFriday: { startTime: '09:00', endTime: '17:00' },
          weekend: { startTime: '10:00', endTime: '16:00' },
          holidays: [],
        },
        languages: ['en'],
        contactInfo: 'chat.support@organization.com',
        averageResponseTime: 15,
        timezone: 'UTC',
      },
    ];
  }

  private initializeStatistics(): SupportStatistics {
    return {
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
      totalTickets: 0,
      openTickets: 0,
      closedTickets: 0,
      averageResolutionTime: 0,
      firstResponseTime: 0,
      customerSatisfactionScore: 0,
      ticketsByCategory: {
        incident: 0,
        request: 0,
        problem: 0,
        change: 0,
        vulnerability: 0,
        compliance: 0,
        general: 0,
      },
      ticketsBySeverity: {
        blocking: 0,
        major: 0,
        minor: 0,
        cosmetic: 0,
      },
      slaMEtRate: 0,
    };
  }

  private initializeKnowledgeBase(): void {
    this.createArticle(
      'Getting Started with BlockAdmin',
      'Getting Started',
      'Learn the basics of BlockAdmin...',
      'Support Team'
    );

    this.publishArticle(this.portal.knowledgeBase[0].id);

    this.addFAQ(
      'How do I reset my password?',
      'Go to the login page and click "Forgot Password"',
      'Account Management',
      1
    );

    this.addVideo(
      'BlockAdmin Overview',
      'Introduction to BlockAdmin features',
      'Getting Started',
      300,
      'https://example.com/videos/overview',
      ['introduction', 'features']
    );
  }

  private getSubcategory(category: TicketCategory): string {
    const subcategories: Record<TicketCategory, string> = {
      incident: 'System Outage',
      request: 'Feature Request',
      problem: 'Technical Issue',
      change: 'Configuration Change',
      vulnerability: 'Security Vulnerability',
      compliance: 'Compliance Issue',
      general: 'General Inquiry',
    };

    return subcategories[category];
  }

  private calculateSeverity(priority: string): 'blocking' | 'major' | 'minor' | 'cosmetic' {
    switch (priority) {
      case 'critical':
        return 'blocking';
      case 'high':
        return 'major';
      case 'medium':
        return 'minor';
      default:
        return 'cosmetic';
    }
  }

  private getResponseSLA(priority: string): number {
    switch (priority) {
      case 'critical':
        return 1;
      case 'high':
        return 4;
      case 'medium':
        return 8;
      default:
        return 24;
    }
  }

  private getResolutionSLA(priority: string): number {
    switch (priority) {
      case 'critical':
        return 4;
      case 'high':
        return 24;
      case 'medium':
        return 72;
      default:
        return 168;
    }
  }

  private getAuthorName(userId: string): string {
    return userId.split('@')[0] || 'Support Agent';
  }

  public getPortalData(): SupportPortal {
    return this.portal;
  }
}

export default SupportPortalManager;
