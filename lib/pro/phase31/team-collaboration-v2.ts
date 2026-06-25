// PRO Phase 31.1 - Enhanced Team Collaboration v2
// Production-grade incident management with rich collaboration features

import {
  TeamIncident,
  IncidentComment,
  IncidentAttachment,
  TeamMember,
  ActivityTimelineEntry,
  NotificationPreference,
} from '@/types/pro-phase31';

// ============================================================================
// TEAM INCIDENT MANAGEMENT
// ============================================================================

export class TeamCollaborationManager {
  private incidents: Map<string, TeamIncident> = new Map();
  private members: Map<string, TeamMember> = new Map();
  private commentMentions: Map<string, Set<string>> = new Map();
  private incidentSubscribers: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultMembers();
  }

  /**
   * Initialize default team members
   */
  private initializeDefaultMembers(): void {
    const defaultMembers: TeamMember[] = [
      {
        id: 'user_001',
        name: 'Security Lead',
        email: 'security-lead@example.com',
        role: 'admin',
        lastActive: new Date(),
        notificationPreferences: {
          channels: ['email', 'slack'],
          frequency: 'realtime',
          severityFilter: ['critical', 'high'],
        },
      },
      {
        id: 'user_002',
        name: 'Incident Manager',
        email: 'incident-manager@example.com',
        role: 'incident-manager',
        lastActive: new Date(),
        notificationPreferences: {
          channels: ['email', 'in-app'],
          frequency: 'realtime',
          severityFilter: ['critical', 'high', 'medium'],
        },
      },
      {
        id: 'user_003',
        name: 'Security Analyst',
        email: 'analyst@example.com',
        role: 'analyst',
        lastActive: new Date(),
        notificationPreferences: {
          channels: ['in-app'],
          frequency: 'daily',
          severityFilter: ['critical', 'high', 'medium', 'low'],
        },
      },
    ];

    defaultMembers.forEach((member) => {
      this.members.set(member.id, member);
    });
  }

  /**
   * Create a new team incident
   */
  createIncident(
    threatId: string,
    title: string,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    createdBy: string
  ): TeamIncident {
    const incident: TeamIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threatId,
      title,
      description,
      severity,
      status: 'open',
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: [],
      tags: [],
      comments: [],
      attachments: [],
      relatedIncidents: [],
      shareWith: [],
      activityTimeline: [
        {
          id: `activity_${Date.now()}`,
          type: 'status-change',
          actorId: createdBy,
          actorName: this.getMemberName(createdBy),
          action: 'created incident',
          details: { status: 'open' },
          timestamp: new Date(),
        },
      ],
    };

    this.incidents.set(incident.id, incident);
    this.incidentSubscribers.set(incident.id, new Set([createdBy]));

    return incident;
  }

  /**
   * Add comment to incident with mention support
   */
  addComment(
    incidentId: string,
    authorId: string,
    content: string,
    mentions: string[] = []
  ): IncidentComment | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const comment: IncidentComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      authorName: this.getMemberName(authorId),
      content,
      mentions,
      createdAt: new Date(),
      edited: false,
      pinned: false,
      reactions: {},
    };

    incident.comments.push(comment);
    incident.updatedAt = new Date();

    // Add activity timeline entry
    this.addTimelineEntry(incidentId, authorId, 'comment', 'commented on incident', {
      commentId: comment.id,
      preview: content.substring(0, 100),
    });

    // Store mentions for notifications
    if (mentions.length > 0) {
      this.commentMentions.set(comment.id, new Set(mentions));
      this.notifyMentionedUsers(incidentId, comment);
    }

    return comment;
  }

  /**
   * Reply to comment (nested)
   */
  replyToComment(
    incidentId: string,
    commentId: string,
    authorId: string,
    content: string,
    mentions: string[] = []
  ): IncidentComment | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const parentComment = incident.comments.find((c) => c.id === commentId);
    if (!parentComment) return null;

    const reply: IncidentComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      authorName: this.getMemberName(authorId),
      content,
      mentions,
      createdAt: new Date(),
      edited: false,
      pinned: false,
      reactions: {},
    };

    if (!parentComment.replies) {
      parentComment.replies = [];
    }
    parentComment.replies.push(reply);

    incident.updatedAt = new Date();

    this.addTimelineEntry(incidentId, authorId, 'comment', 'replied to comment', {
      parentCommentId: commentId,
      replyId: reply.id,
    });

    return reply;
  }

  /**
   * Edit comment
   */
  editComment(incidentId: string, commentId: string, newContent: string): IncidentComment | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const comment = this.findCommentRecursive(incident.comments, commentId);
    if (!comment) return null;

    comment.content = newContent;
    comment.edited = true;
    comment.updatedAt = new Date();

    incident.updatedAt = new Date();

    return comment;
  }

  /**
   * Add reaction to comment
   */
  addReaction(incidentId: string, commentId: string, userId: string, emoji: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    const comment = this.findCommentRecursive(incident.comments, commentId);
    if (!comment) return false;

    if (!comment.reactions[emoji]) {
      comment.reactions[emoji] = [];
    }

    if (!comment.reactions[emoji].includes(userId)) {
      comment.reactions[emoji].push(userId);
    }

    return true;
  }

  /**
   * Pin/unpin comment
   */
  togglePinComment(incidentId: string, commentId: string): IncidentComment | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const comment = this.findCommentRecursive(incident.comments, commentId);
    if (!comment) return null;

    comment.pinned = !comment.pinned;
    incident.updatedAt = new Date();

    return comment;
  }

  /**
   * Add attachment to incident
   */
  addAttachment(
    incidentId: string,
    filename: string,
    mimeType: string,
    size: number,
    url: string,
    uploadedBy: string
  ): IncidentAttachment | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const attachment: IncidentAttachment = {
      id: `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename,
      mimeType,
      size,
      url,
      uploadedBy,
      uploadedAt: new Date(),
    };

    incident.attachments.push(attachment);
    incident.updatedAt = new Date();

    this.addTimelineEntry(incidentId, uploadedBy, 'attachment', 'uploaded file', {
      filename,
      size,
    });

    return attachment;
  }

  /**
   * Assign incident to team members
   */
  assignIncident(incidentId: string, assigneeIds: string[], assignedBy: string): TeamIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const previousAssignees = [...incident.assignedTo];
    incident.assignedTo = assigneeIds;
    incident.updatedAt = new Date();

    this.addTimelineEntry(incidentId, assignedBy, 'assignment', 'assigned incident', {
      from: previousAssignees,
      to: assigneeIds,
    });

    // Notify new assignees
    assigneeIds.forEach((userId) => {
      this.notifyUserOfAssignment(incidentId, userId, assignedBy);
    });

    return incident;
  }

  /**
   * Share incident with team members
   */
  shareIncident(incidentId: string, teamMemberIds: string[], sharedBy: string): TeamIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const newMembers = teamMemberIds.filter(
      (id) => !incident.shareWith.some((m) => m.id === id)
    );

    newMembers.forEach((id) => {
      const member = this.members.get(id);
      if (member) {
        incident.shareWith.push(member);
        this.incidentSubscribers.get(incidentId)?.add(id);
      }
    });

    incident.updatedAt = new Date();

    if (newMembers.length > 0) {
      this.addTimelineEntry(incidentId, sharedBy, 'status-change', 'shared incident', {
        sharedWith: newMembers,
      });
    }

    return incident;
  }

  /**
   * Update incident status
   */
  updateIncidentStatus(
    incidentId: string,
    newStatus: 'open' | 'investigating' | 'mitigating' | 'resolved' | 'archived',
    updatedBy: string
  ): TeamIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const previousStatus = incident.status;
    incident.status = newStatus;
    incident.updatedAt = new Date();

    this.addTimelineEntry(incidentId, updatedBy, 'status-change', `changed status to ${newStatus}`, {
      from: previousStatus,
      to: newStatus,
    });

    // Notify all subscribers
    this.notifyStatusChange(incidentId, previousStatus, newStatus);

    return incident;
  }

  /**
   * Add tags to incident
   */
  addTags(incidentId: string, tags: string[], addedBy: string): TeamIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const newTags = tags.filter((tag) => !incident.tags.includes(tag));
    incident.tags.push(...newTags);
    incident.updatedAt = new Date();

    if (newTags.length > 0) {
      this.addTimelineEntry(incidentId, addedBy, 'tag-added', 'added tags', {
        tags: newTags,
      });
    }

    return incident;
  }

  /**
   * Link related incidents
   */
  linkRelatedIncident(incidentId: string, relatedId: string, linkedBy: string): boolean {
    const incident = this.incidents.get(incidentId);
    const relatedIncident = this.incidents.get(relatedId);

    if (!incident || !relatedIncident) return false;

    if (!incident.relatedIncidents.includes(relatedId)) {
      incident.relatedIncidents.push(relatedId);
      incident.updatedAt = new Date();

      this.addTimelineEntry(incidentId, linkedBy, 'status-change', 'linked related incident', {
        relatedIncidentId: relatedId,
      });
    }

    if (!relatedIncident.relatedIncidents.includes(incidentId)) {
      relatedIncident.relatedIncidents.push(incidentId);
      relatedIncident.updatedAt = new Date();
    }

    return true;
  }

  /**
   * Get incident with full details
   */
  getIncident(incidentId: string): TeamIncident | null {
    return this.incidents.get(incidentId) || null;
  }

  /**
   * Get all incidents
   */
  getAllIncidents(filter?: {
    status?: string;
    severity?: string;
    assignedTo?: string;
  }): TeamIncident[] {
    let incidents = Array.from(this.incidents.values());

    if (filter?.status) {
      incidents = incidents.filter((i) => i.status === filter.status);
    }

    if (filter?.severity) {
      incidents = incidents.filter((i) => i.severity === filter.severity);
    }

    if (filter?.assignedTo) {
      incidents = incidents.filter((i) => i.assignedTo.includes(filter.assignedTo!));
    }

    return incidents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get incident activity timeline
   */
  getActivityTimeline(incidentId: string): ActivityTimelineEntry[] {
    const incident = this.incidents.get(incidentId);
    return incident?.activityTimeline || [];
  }

  /**
   * Get team members
   */
  getTeamMembers(): TeamMember[] {
    return Array.from(this.members.values());
  }

  /**
   * Add team member
   */
  addTeamMember(
    name: string,
    email: string,
    role: 'admin' | 'incident-manager' | 'analyst' | 'viewer',
    notificationPreferences?: NotificationPreference
  ): TeamMember {
    const member: TeamMember = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      lastActive: new Date(),
      notificationPreferences: notificationPreferences || {
        channels: ['email', 'in-app'],
        frequency: 'daily',
        severityFilter: ['critical', 'high'],
      },
    };

    this.members.set(member.id, member);
    return member;
  }

  /**
   * Search incidents
   */
  searchIncidents(query: string): TeamIncident[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.incidents.values()).filter(
      (incident) =>
        incident.title.toLowerCase().includes(lowerQuery) ||
        incident.description.toLowerCase().includes(lowerQuery) ||
        incident.threatId.toLowerCase().includes(lowerQuery) ||
        incident.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get incident statistics
   */
  getIncidentStats(): {
    total: number;
    open: number;
    investigating: number;
    mitigating: number;
    resolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    averageResolutionTime: number;
  } {
    const incidents = Array.from(this.incidents.values());

    const stats = {
      total: incidents.length,
      open: incidents.filter((i) => i.status === 'open').length,
      investigating: incidents.filter((i) => i.status === 'investigating').length,
      mitigating: incidents.filter((i) => i.status === 'mitigating').length,
      resolved: incidents.filter((i) => i.status === 'resolved').length,
      critical: incidents.filter((i) => i.severity === 'critical').length,
      high: incidents.filter((i) => i.severity === 'high').length,
      medium: incidents.filter((i) => i.severity === 'medium').length,
      low: incidents.filter((i) => i.severity === 'low').length,
      averageResolutionTime: 0,
    };

    // Calculate average resolution time
    const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
    if (resolvedIncidents.length > 0) {
      const totalTime = resolvedIncidents.reduce((sum, incident) => {
        return sum + (incident.updatedAt.getTime() - incident.createdAt.getTime());
      }, 0);
      stats.averageResolutionTime = Math.round(totalTime / resolvedIncidents.length);
    }

    return stats;
  }

  /**
   * Helper: Add timeline entry
   */
  private addTimelineEntry(
    incidentId: string,
    actorId: string,
    type: ActivityTimelineEntry['type'],
    action: string,
    details: Record<string, any>
  ): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    incident.activityTimeline.push({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      actorId,
      actorName: this.getMemberName(actorId),
      action,
      details,
      timestamp: new Date(),
    });
  }

  /**
   * Helper: Find comment recursively (including replies)
   */
  private findCommentRecursive(
    comments: IncidentComment[],
    commentId: string
  ): IncidentComment | null {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return comment;
      }
      if (comment.replies) {
        const found = this.findCommentRecursive(comment.replies, commentId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Helper: Get member name
   */
  private getMemberName(userId: string): string {
    return this.members.get(userId)?.name || 'Unknown User';
  }

  /**
   * Helper: Notify mentioned users
   */
  private notifyMentionedUsers(incidentId: string, comment: IncidentComment): void {
    comment.mentions.forEach((userId) => {
      const member = this.members.get(userId);
      if (member && member.notificationPreferences.channels.includes('email')) {
        console.log(`[NOTIFICATION] Email to ${member.email}: Mentioned in comment`);
      }
    });
  }

  /**
   * Helper: Notify user of assignment
   */
  private notifyUserOfAssignment(incidentId: string, userId: string, assignedBy: string): void {
    const member = this.members.get(userId);
    if (member) {
      console.log(
        `[NOTIFICATION] Email to ${member.email}: You've been assigned to incident ${incidentId}`
      );
    }
  }

  /**
   * Helper: Notify status change
   */
  private notifyStatusChange(
    incidentId: string,
    previousStatus: string,
    newStatus: string
  ): void {
    const subscribers = this.incidentSubscribers.get(incidentId);
    if (subscribers) {
      subscribers.forEach((userId) => {
        const member = this.members.get(userId);
        if (member) {
          console.log(
            `[NOTIFICATION] Email to ${member.email}: Incident status changed to ${newStatus}`
          );
        }
      });
    }
  }
}

/**
 * Singleton instance for team collaboration
 */
export const teamCollaboration = new TeamCollaborationManager();

/**
 * Get collaboration metrics
 */
export function getCollaborationMetrics(incidents: TeamIncident[]): {
  totalComments: number;
  totalAttachments: number;
  mostActive: string;
  averageTimeToFirstComment: number;
  collaborationScore: number;
} {
  let totalComments = 0;
  let totalAttachments = 0;
  const userActivityMap: Map<string, number> = new Map();
  let totalFirstCommentTime = 0;
  let incidentsWithComments = 0;

  incidents.forEach((incident) => {
    totalComments += incident.comments.length;
    totalAttachments += incident.attachments.length;

    // Count comments per user
    incident.comments.forEach((comment) => {
      userActivityMap.set(comment.authorId, (userActivityMap.get(comment.authorId) || 0) + 1);
    });

    // Calculate time to first comment
    if (incident.comments.length > 0) {
      const firstCommentTime = incident.comments[0].createdAt.getTime() - incident.createdAt.getTime();
      totalFirstCommentTime += firstCommentTime;
      incidentsWithComments++;
    }
  });

  const mostActive =
    Array.from(userActivityMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const averageTimeToFirstComment =
    incidentsWithComments > 0 ? Math.round(totalFirstCommentTime / incidentsWithComments) : 0;

  const collaborationScore = Math.min(
    100,
    Math.round((totalComments / Math.max(incidents.length, 1)) * 10)
  );

  return {
    totalComments,
    totalAttachments,
    mostActive,
    averageTimeToFirstComment,
    collaborationScore,
  };
}
