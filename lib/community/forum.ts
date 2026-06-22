/**
 * BlockStop Phase 30.8 - Community Forum System
 * Discussion threads, voting, expert tagging, moderation, and reputation management
 * Production-ready implementation with full community engagement features
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export type ForumCategory = 'general' | 'features' | 'bugs' | 'security' | 'compliance' | 'support' | 'practices' | 'cases' | 'integrations' | 'threats';
export type PostStatus = 'published' | 'pending' | 'archived' | 'flagged' | 'deleted';
export type ModerationAction = 'flag' | 'hide' | 'delete' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'warn' | 'ban' | 'approve';
export type VoteType = 'upvote' | 'downvote' | 'remove';
export type NotificationType = 'reply' | 'mention' | 'answer' | 'thread-update' | 'moderation' | 'expert-response';

export interface ForumThread {
  threadId: string;
  title: string;
  description?: string;
  category: ForumCategory;
  subcategory?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  posts: ForumPost[];
  tags: string[];
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  acceptedAnswerId?: string;
  visibility: 'public' | 'internal' | 'restricted';
  views: number;
  votes: number;
  status: 'active' | 'archived' | 'deleted';
  subscribers: Set<string>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  linkedResources?: LinkedResource[];
  attachments: ForumAttachment[];
}

export interface LinkedResource {
  resourceId: string;
  resourceType: 'article' | 'course' | 'lab' | 'documentation';
  resourceTitle: string;
  resourceUrl: string;
  linkedAt: Date;
}

export interface ForumPost {
  postId: string;
  threadId: string;
  content: string;
  htmlContent?: string;
  author: ForumAuthor;
  createdAt: Date;
  updatedAt: Date;
  editHistory: EditHistory[];
  votes: number;
  userVotes: Map<string, VoteType>;
  replies: ForumReply[];
  attachments: ForumAttachment[];
  isAnswer: boolean;
  acceptedAt?: Date;
  markedHelpful: number;
  status: PostStatus;
  codeBlocks: CodeBlock[];
  mentions: string[]; // User IDs
  reputation: ReputationContribution;
}

export interface EditHistory {
  editedAt: Date;
  editedBy: string;
  previousContent: string;
  changeReason?: string;
}

export interface ForumReply {
  replyId: string;
  postId: string;
  threadId: string;
  content: string;
  htmlContent?: string;
  author: ForumAuthor;
  createdAt: Date;
  updatedAt: Date;
  votes: number;
  userVotes: Map<string, VoteType>;
  mentions: string[];
  attachments: ForumAttachment[];
  status: PostStatus;
}

export interface ForumAuthor {
  userId: string;
  userName: string;
  email?: string;
  avatar?: string;
  title?: string;
  bio?: string;
  reputation: number;
  badges: string[];
  isExpert: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  joinedAt: Date;
  lastSeen: Date;
  verified: boolean;
  organization?: string;
}

export interface ForumAttachment {
  attachmentId: string;
  postId?: string;
  replyId?: string;
  type: 'image' | 'video' | 'document' | 'code' | 'log' | 'screenshot';
  url: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CodeBlock {
  blockId: string;
  language: string;
  code: string;
  lineNumbers: boolean;
  highlighted: boolean;
  description?: string;
}

export interface ExpertTag {
  tagId: string;
  name: string;
  description: string;
  category: string;
  relatedTopics: string[];
  expertIds: Set<string>;
  threadCount: number;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
  icon?: string;
  color?: string;
}

export interface ExpertProfile {
  profileId: string;
  userId: string;
  userName: string;
  expertise: ExpertiseArea[];
  following: Set<string>;
  followers: Set<string>;
  totalAnswers: number;
  acceptedAnswers: number;
  answerRate: number;
  averageResponseTime: number; // minutes
  responseStreak: number;
  verification: {
    verified: boolean;
    verifiedAt?: Date;
    verificationLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  bio: string;
  credentials: string[];
  availableForConsultation: boolean;
  website?: string;
  social?: Record<string, string>;
}

export interface ExpertiseArea {
  areaId: string;
  name: string;
  proficiencyLevel: 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  certifications: string[];
  recentAnswers: number;
}

export interface UserReputation {
  reputationId: string;
  userId: string;
  userName: string;
  totalReputation: number;
  breakdown: {
    askingQuestions: number;
    answeringQuestions: number;
    postQuality: number;
    helping: number;
    moderation: number;
    community: number;
  };
  postsCreated: number;
  answersProvided: number;
  helpfulAnswers: number;
  questionsAsked: number;
  commentsWritten: number;
  threadsCreated: number;
  badges: UserBadge[];
  ranking: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  achievements: Achievement[];
  updatedAt: Date;
}

export interface UserBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  progress?: number; // For progressive badges
}

export interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number; // 0-100
  requirement: string;
}

export interface ReputationContribution {
  upvotesReceived: number;
  downvotesReceived: number;
  markedAsAnswer: boolean;
  markedAsHelpful: number;
  acceptanceRate: number; // For answers
}

export interface ForumModerationAction {
  actionId: string;
  type: ModerationAction;
  targetId: string; // thread or post ID
  targetType: 'thread' | 'post' | 'reply' | 'user';
  reason: string;
  details?: string;
  moderatorId: string;
  moderatorName: string;
  createdAt: Date;
  status: 'pending' | 'resolved' | 'appealed' | 'cancelled';
  appealedBy?: string;
  appealReason?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  relatedActions?: string[]; // Related moderation actions
}

export interface ForumNotification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  relatedThreadId?: string;
  relatedPostId?: string;
  relatedUserId?: string;
  message: string;
  preview?: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl: string;
  priority: 'low' | 'normal' | 'high';
}

export interface ForumSearchQuery {
  query: string;
  filters: {
    category?: ForumCategory;
    author?: string;
    dateRange?: { start: Date; end: Date };
    tags?: string[];
    solved?: boolean;
    minVotes?: number;
    hasAcceptedAnswer?: boolean;
  };
  sortBy: 'relevance' | 'recent' | 'votes' | 'views' | 'unanswered';
  pageNumber: number;
  pageSize: number;
}

export interface ForumSearchResult {
  itemId: string;
  itemType: 'thread' | 'post';
  title: string;
  excerpt: string;
  author: string;
  score: number;
  matchedTerms: string[];
  createdAt: Date;
  votes: number;
  hasAcceptedAnswer: boolean;
}

export interface ThreadSubscription {
  subscriptionId: string;
  userId: string;
  threadId: string;
  createdAt: Date;
  notifyOn: Array<'all-posts' | 'expert-posts' | 'answers'>;
  mutedAt?: Date;
  digest: 'real-time' | 'daily' | 'weekly' | 'none';
}

export class CommunityForumManager extends EventEmitter {
  private threads: Map<string, ForumThread> = new Map();
  private posts: Map<string, ForumPost> = new Map();
  private replies: Map<string, ForumReply> = new Map();
  private tags: Map<string, ExpertTag> = new Map();
  private expertProfiles: Map<string, ExpertProfile> = new Map();
  private userReputation: Map<string, UserReputation> = new Map();
  private moderationActions: Map<string, ForumModerationAction> = new Map();
  private notifications: Map<string, ForumNotification[]> = new Map();
  private subscriptions: Map<string, ThreadSubscription> = new Map();
  private searchIndex: ForumSearchResult[] = [];
  private spamScores: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeDefaultTags();
    this.startModeration();
  }

  // ============ THREAD MANAGEMENT ============

  /**
   * Create a new forum thread
   */
  createThread(threadData: Omit<ForumThread, 'threadId' | 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'posts' | 'views' | 'votes' | 'subscribers' | 'status'>): ForumThread {
    const threadId = `thread-${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();

    const thread: ForumThread = {
      ...threadData,
      threadId,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      posts: [],
      views: 0,
      votes: 0,
      subscribers: new Set([threadData.createdBy]),
      status: 'active',
    };

    this.threads.set(threadId, thread);

    // Award reputation for thread creation
    this.addReputation(threadData.createdBy, 'asking', 10);

    // Update search index
    this.indexThread(thread);

    this.emit('thread:created', thread);
    return thread;
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): ForumThread | undefined {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.views++;
    }
    return thread;
  }

  /**
   * Get threads by category
   */
  getThreadsByCategory(category: ForumCategory, limit: number = 20): ForumThread[] {
    return Array.from(this.threads.values())
      .filter(t => t.category === category && t.status === 'active')
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
      .slice(0, limit);
  }

  /**
   * Update thread
   */
  updateThread(threadId: string, updates: Partial<ForumThread>): ForumThread | null {
    const thread = this.threads.get(threadId);
    if (!thread) return null;

    Object.assign(thread, updates, { updatedAt: new Date() });
    this.emit('thread:updated', thread);
    return thread;
  }

  /**
   * Pin/unpin thread
   */
  toggleThreadPin(threadId: string, pinned: boolean): ForumThread | null {
    return this.updateThread(threadId, { pinned });
  }

  /**
   * Lock/unlock thread
   */
  toggleThreadLock(threadId: string, locked: boolean): ForumThread | null {
    return this.updateThread(threadId, { locked });
  }

  /**
   * Mark thread as solved
   */
  markThreadSolved(threadId: string, acceptedAnswerId: string): ForumThread | null {
    return this.updateThread(threadId, { solved: true, acceptedAnswerId });
  }

  /**
   * Get trending threads
   */
  getTrendingThreads(limit: number = 10, daysBack: number = 7): ForumThread[] {
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    return Array.from(this.threads.values())
      .filter(t => t.status === 'active' && t.createdAt >= cutoffDate)
      .sort((a, b) => {
        const aScore = a.views + (a.votes * 2);
        const bScore = b.views + (b.votes * 2);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Get unanswered threads
   */
  getUnansweredThreads(category?: ForumCategory, limit: number = 20): ForumThread[] {
    return Array.from(this.threads.values())
      .filter(t => {
        if (t.status !== 'active') return false;
        if (category && t.category !== category) return false;
        return !t.solved && (!t.acceptedAnswerId);
      })
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
      .slice(0, limit);
  }

  // ============ POST MANAGEMENT ============

  /**
   * Create post in thread
   */
  createPost(postData: Omit<ForumPost, 'postId' | 'createdAt' | 'updatedAt' | 'editHistory' | 'votes' | 'userVotes' | 'replies' | 'status' | 'reputation'>): ForumPost {
    const postId = `post-${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();

    const post: ForumPost = {
      ...postData,
      postId,
      createdAt: now,
      updatedAt: now,
      editHistory: [],
      votes: 0,
      userVotes: new Map(),
      replies: [],
      status: 'published',
      codeBlocks: postData.codeBlocks || [],
      mentions: postData.mentions || [],
      reputation: {
        upvotesReceived: 0,
        downvotesReceived: 0,
        markedAsAnswer: false,
        markedAsHelpful: 0,
        acceptanceRate: 0,
      },
    };

    this.posts.set(postId, post);

    // Add to thread
    const thread = this.threads.get(postData.threadId);
    if (thread) {
      thread.posts.push(post);
      thread.lastActivityAt = now;
    }

    // Notify mentions
    this.notifyMentions(post.mentions, 'mention', postId, post.threadId);

    // Award reputation
    this.addReputation(post.author.userId, 'answering', 5);

    // Update search index
    this.indexPost(post);

    this.emit('post:created', post);
    return post;
  }

  /**
   * Get post
   */
  getPost(postId: string): ForumPost | undefined {
    return this.posts.get(postId);
  }

  /**
   * Update post
   */
  updatePost(postId: string, content: string, changeReason?: string): ForumPost | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    const previousContent = post.content;
    post.content = content;
    post.updatedAt = new Date();
    post.editHistory.push({
      editedAt: new Date(),
      editedBy: post.author.userId,
      previousContent,
      changeReason,
    });

    this.emit('post:updated', post);
    return post;
  }

  /**
   * Delete post
   */
  deletePost(postId: string, reason?: string): ForumPost | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    post.status = 'deleted';

    // Remove from thread
    const thread = this.threads.get(post.threadId);
    if (thread) {
      thread.posts = thread.posts.filter(p => p.postId !== postId);
    }

    this.emit('post:deleted', { post, reason });
    return post;
  }

  /**
   * Create reply to post
   */
  createReply(replyData: Omit<ForumReply, 'replyId' | 'createdAt' | 'updatedAt' | 'votes' | 'userVotes' | 'status'>): ForumReply {
    const replyId = `reply-${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date();

    const reply: ForumReply = {
      ...replyData,
      replyId,
      createdAt: now,
      updatedAt: now,
      votes: 0,
      userVotes: new Map(),
      status: 'published',
    };

    this.replies.set(replyId, reply);

    // Add to post
    const post = this.posts.get(replyData.postId);
    if (post) {
      post.replies.push(reply);
    }

    // Notify mentions and post author
    this.notifyMentions(reply.mentions, 'reply', replyData.postId, replyData.threadId);
    if (post) {
      this.notify(post.author.userId, 'reply', replyData.threadId, replyData.postId, reply.author.userId, `${reply.author.userName} replied to your post`);
    }

    // Award reputation
    this.addReputation(reply.author.userId, 'answering', 3);

    this.emit('reply:created', reply);
    return reply;
  }

  // ============ VOTING SYSTEM ============

  /**
   * Vote on post
   */
  voteOnPost(postId: string, userId: string, voteType: VoteType): ForumPost | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    const currentVote = post.userVotes.get(userId);

    // Remove previous vote
    if (currentVote === 'upvote') {
      post.votes--;
    } else if (currentVote === 'downvote') {
      post.votes++;
    }

    // Add new vote
    if (voteType === 'upvote') {
      post.votes++;
      post.userVotes.set(userId, 'upvote');
      post.reputation.upvotesReceived++;
      this.addReputation(post.author.userId, 'quality', 10);
    } else if (voteType === 'downvote') {
      post.votes--;
      post.userVotes.set(userId, 'downvote');
      post.reputation.downvotesReceived++;
      this.addReputation(post.author.userId, 'quality', -2);
    } else if (voteType === 'remove') {
      post.userVotes.delete(userId);
    }

    this.emit('post:voted', { post, userId, voteType });
    return post;
  }

  /**
   * Vote on reply
   */
  voteOnReply(replyId: string, userId: string, voteType: VoteType): ForumReply | null {
    const reply = this.replies.get(replyId);
    if (!reply) return null;

    const currentVote = reply.userVotes.get(userId);

    if (currentVote === 'upvote') {
      reply.votes--;
    } else if (currentVote === 'downvote') {
      reply.votes++;
    }

    if (voteType === 'upvote') {
      reply.votes++;
      reply.userVotes.set(userId, 'upvote');
    } else if (voteType === 'downvote') {
      reply.votes--;
      reply.userVotes.set(userId, 'downvote');
    } else if (voteType === 'remove') {
      reply.userVotes.delete(userId);
    }

    this.emit('reply:voted', { reply, userId, voteType });
    return reply;
  }

  // ============ EXPERT MANAGEMENT ============

  /**
   * Create expert profile
   */
  createExpertProfile(profileData: Omit<ExpertProfile, 'profileId' | 'following' | 'followers' | 'totalAnswers' | 'acceptedAnswers'>): ExpertProfile {
    const profileId = `expert-${crypto.randomBytes(8).toString('hex')}`;

    const profile: ExpertProfile = {
      ...profileData,
      profileId,
      following: new Set(),
      followers: new Set(),
      totalAnswers: 0,
      acceptedAnswers: 0,
    };

    this.expertProfiles.set(profileData.userId, profile);
    this.emit('expert:profile-created', profile);
    return profile;
  }

  /**
   * Get expert profile
   */
  getExpertProfile(userId: string): ExpertProfile | undefined {
    return this.expertProfiles.get(userId);
  }

  /**
   * Mark user as expert on tag
   */
  addExpertToTag(userId: string, tagId: string): ExpertTag | null {
    const tag = this.tags.get(tagId);
    if (!tag) return null;

    tag.expertIds.add(userId);
    this.emit('expert:tag-added', { userId, tagId });
    return tag;
  }

  /**
   * Get experts by tag
   */
  getExpertsByTag(tagId: string): ExpertProfile[] {
    const tag = this.tags.get(tagId);
    if (!tag) return [];

    return Array.from(tag.expertIds)
      .map(userId => this.expertProfiles.get(userId))
      .filter(Boolean) as ExpertProfile[];
  }

  // ============ REPUTATION SYSTEM ============

  /**
   * Get user reputation
   */
  getUserReputation(userId: string): UserReputation | undefined {
    return this.userReputation.get(userId);
  }

  /**
   * Get user ranking
   */
  getUserRanking(userId: string): number {
    const sorted = Array.from(this.userReputation.values())
      .sort((a, b) => b.totalReputation - a.totalReputation);

    return sorted.findIndex(r => r.userId === userId) + 1;
  }

  /**
   * Get top contributors
   */
  getTopContributors(limit: number = 20): UserReputation[] {
    return Array.from(this.userReputation.values())
      .sort((a, b) => b.totalReputation - a.totalReputation)
      .slice(0, limit);
  }

  /**
   * Add reputation points
   */
  private addReputation(userId: string, category: string, points: number): void {
    if (!this.userReputation.has(userId)) {
      this.userReputation.set(userId, {
        reputationId: `rep-${crypto.randomBytes(8).toString('hex')}`,
        userId,
        userName: `User ${userId.substring(0, 8)}`,
        totalReputation: 0,
        breakdown: {
          askingQuestions: 0,
          answeringQuestions: 0,
          postQuality: 0,
          helping: 0,
          moderation: 0,
          community: 0,
        },
        postsCreated: 0,
        answersProvided: 0,
        helpfulAnswers: 0,
        questionsAsked: 0,
        commentsWritten: 0,
        threadsCreated: 0,
        badges: [],
        ranking: 0,
        tier: 'bronze',
        achievements: [],
        updatedAt: new Date(),
      });
    }

    const rep = this.userReputation.get(userId)!;
    rep.totalReputation += points;

    switch (category) {
      case 'asking':
        rep.breakdown.askingQuestions += points;
        rep.questionsAsked++;
        break;
      case 'answering':
        rep.breakdown.answeringQuestions += points;
        rep.answersProvided++;
        break;
      case 'quality':
        rep.breakdown.postQuality += points;
        break;
      case 'helping':
        rep.breakdown.helping += points;
        rep.helpfulAnswers++;
        break;
    }

    // Update tier
    if (rep.totalReputation >= 10000) {
      rep.tier = 'legendary';
    } else if (rep.totalReputation >= 5000) {
      rep.tier = 'platinum';
    } else if (rep.totalReputation >= 1000) {
      rep.tier = 'gold';
    } else if (rep.totalReputation >= 100) {
      rep.tier = 'silver';
    }

    rep.updatedAt = new Date();
    this.emit('reputation:updated', rep);
  }

  // ============ MODERATION ============

  /**
   * Flag content for moderation
   */
  flagContent(
    targetId: string,
    targetType: 'thread' | 'post' | 'reply',
    reason: string,
    reporterId: string
  ): ForumModerationAction {
    const actionId = `action-${crypto.randomBytes(8).toString('hex')}`;

    const action: ForumModerationAction = {
      actionId,
      type: 'flag',
      targetId,
      targetType,
      reason,
      moderatorId: '',
      moderatorName: '',
      createdAt: new Date(),
      status: 'pending',
    };

    this.moderationActions.set(actionId, action);

    // Increase spam score
    let targetUser = '';
    if (targetType === 'thread') {
      const thread = this.threads.get(targetId);
      if (thread) targetUser = thread.createdBy;
    } else if (targetType === 'post') {
      const post = this.posts.get(targetId);
      if (post) targetUser = post.author.userId;
    }

    if (targetUser) {
      const score = this.spamScores.get(targetUser) || 0;
      this.spamScores.set(targetUser, score + 1);

      // Auto-moderate if score too high
      if (score >= 5) {
        this.moderateContent(actionId, 'delete', '', 'system', 'Automatic: Spam score exceeded');
      }
    }

    this.emit('content:flagged', action);
    return action;
  }

  /**
   * Moderate content
   */
  moderateContent(
    actionId: string,
    actionType: ModerationAction,
    details: string,
    moderatorId: string,
    moderatorName: string
  ): ForumModerationAction | null {
    const action = this.moderationActions.get(actionId);
    if (!action) return null;

    action.type = actionType;
    action.details = details;
    action.moderatorId = moderatorId;
    action.moderatorName = moderatorName;
    action.status = 'resolved';
    action.resolvedAt = new Date();
    action.resolvedBy = moderatorId;

    // Apply action
    if (action.targetType === 'thread') {
      const thread = this.threads.get(action.targetId);
      if (thread) {
        switch (actionType) {
          case 'delete':
            thread.status = 'deleted';
            break;
          case 'lock':
            thread.locked = true;
            break;
          case 'unlock':
            thread.locked = false;
            break;
          case 'pin':
            thread.pinned = true;
            break;
          case 'unpin':
            thread.pinned = false;
            break;
        }
      }
    } else if (action.targetType === 'post') {
      const post = this.posts.get(action.targetId);
      if (post) {
        switch (actionType) {
          case 'delete':
            post.status = 'deleted';
            break;
          case 'hide':
            post.status = 'archived';
            break;
        }
      }
    }

    this.emit('content:moderated', action);
    return action;
  }

  /**
   * Get moderation queue
   */
  getModerationQueue(limit: number = 50): ForumModerationAction[] {
    return Array.from(this.moderationActions.values())
      .filter(a => a.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // ============ NOTIFICATIONS ============

  /**
   * Get user notifications
   */
  getUserNotifications(userId: string, unreadOnly: boolean = false): ForumNotification[] {
    const notifications = this.notifications.get(userId) || [];
    if (unreadOnly) {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId);
    if (notifications) {
      const notification = notifications.find(n => n.notificationId === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    }
  }

  /**
   * Send notification
   */
  private notify(
    userId: string,
    type: NotificationType,
    threadId?: string,
    postId?: string,
    relatedUserId?: string,
    message?: string
  ): void {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    const notification: ForumNotification = {
      notificationId: `notif-${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type,
      relatedThreadId: threadId,
      relatedPostId: postId,
      relatedUserId,
      message: message || `New ${type} in forum`,
      isRead: false,
      createdAt: new Date(),
      actionUrl: threadId ? `/forum/threads/${threadId}` : '',
      priority: 'normal',
    };

    this.notifications.get(userId)!.push(notification);
    this.emit('notification:sent', notification);
  }

  /**
   * Notify mentions
   */
  private notifyMentions(mentionedUserIds: string[], type: NotificationType, postId?: string, threadId?: string): void {
    for (const userId of mentionedUserIds) {
      this.notify(userId, type, threadId, postId, '', `You were mentioned in a post`);
    }
  }

  // ============ SEARCH ============

  /**
   * Search forum
   */
  searchForum(query: SearchQuery): ForumSearchResult[] {
    const queryLower = query.query.toLowerCase();
    const results: ForumSearchResult[] = [];

    // Search threads
    for (const thread of this.threads.values()) {
      if (thread.status !== 'active') continue;
      if (query.filters.category && thread.category !== query.filters.category) continue;
      if (query.filters.author && thread.createdBy !== query.filters.author) continue;

      let score = 0;
      const matchedTerms: string[] = [];

      if (thread.title.toLowerCase().includes(queryLower)) {
        score += 100;
        matchedTerms.push('title');
      }

      if (thread.description?.toLowerCase().includes(queryLower)) {
        score += 50;
        matchedTerms.push('description');
      }

      if (matchedTerms.length > 0) {
        results.push({
          itemId: thread.threadId,
          itemType: 'thread',
          title: thread.title,
          excerpt: thread.description || '',
          author: thread.createdByName,
          score,
          matchedTerms,
          createdAt: thread.createdAt,
          votes: thread.votes,
          hasAcceptedAnswer: thread.solved,
        });
      }
    }

    // Sort
    results.sort((a, b) => {
      switch (query.sortBy) {
        case 'relevance':
          return b.score - a.score;
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'votes':
          return b.votes - a.votes;
        default:
          return 0;
      }
    });

    return results.slice(
      (query.pageNumber - 1) * query.pageSize,
      query.pageNumber * query.pageSize
    );
  }

  // ============ SUBSCRIPTIONS ============

  /**
   * Subscribe to thread
   */
  subscribeToThread(userId: string, threadId: string, notifyOn: string[] = ['all-posts']): ThreadSubscription {
    const subscriptionId = `sub-${crypto.randomBytes(8).toString('hex')}`;

    const subscription: ThreadSubscription = {
      subscriptionId,
      userId,
      threadId,
      createdAt: new Date(),
      notifyOn: notifyOn as any[],
      digest: 'real-time',
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Add to thread subscribers
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.subscribers.add(userId);
    }

    return subscription;
  }

  /**
   * Unsubscribe from thread
   */
  unsubscribeFromThread(subscriptionId: string): ThreadSubscription | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return null;

    const thread = this.threads.get(subscription.threadId);
    if (thread) {
      thread.subscribers.delete(subscription.userId);
    }

    this.subscriptions.delete(subscriptionId);
    return subscription;
  }

  // ============ PRIVATE HELPERS ============

  private initializeDefaultTags(): void {
    const defaultTags: Record<string, { description: string; category: string }> = {
      'threat-detection': { description: 'Questions about threat detection', category: 'security' },
      'incident-response': { description: 'Incident response and handling', category: 'security' },
      'malware': { description: 'Malware analysis and removal', category: 'threats' },
      'ransomware': { description: 'Ransomware specific discussions', category: 'threats' },
      'phishing': { description: 'Phishing attacks and prevention', category: 'security' },
      'compliance': { description: 'Compliance and regulatory topics', category: 'compliance' },
      'integration': { description: 'Integration questions and solutions', category: 'support' },
      'api': { description: 'API and integration development', category: 'integrations' },
      'best-practices': { description: 'Security best practices', category: 'practices' },
      'feature-request': { description: 'Feature requests and ideas', category: 'features' },
    };

    for (const [tagId, data] of Object.entries(defaultTags)) {
      this.tags.set(tagId, {
        tagId,
        name: tagId.replace(/-/g, ' '),
        description: data.description,
        category: data.category,
        relatedTopics: [],
        expertIds: new Set(),
        threadCount: 0,
        followersCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  private indexThread(thread: ForumThread): void {
    this.searchIndex.push({
      itemId: thread.threadId,
      itemType: 'thread',
      title: thread.title,
      excerpt: thread.description || '',
      author: thread.createdByName,
      score: 0,
      matchedTerms: [],
      createdAt: thread.createdAt,
      votes: thread.votes,
      hasAcceptedAnswer: thread.solved,
    });
  }

  private indexPost(post: ForumPost): void {
    // Index post for search
  }

  private startModeration(): void {
    // Run moderation checks periodically
    setInterval(() => {
      // Check for flagged content
      for (const action of this.moderationActions.values()) {
        if (action.status === 'pending' && action.createdAt.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
          // Auto-resolve old flagged content
          this.emit('moderation:pending-review', action);
        }
      }
    }, 60 * 60 * 1000); // Hourly
  }
}

// Export singleton
export const communityForumManager = new CommunityForumManager();
