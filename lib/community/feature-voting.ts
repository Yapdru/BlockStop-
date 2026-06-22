/**
 * Feature Voting System Module
 * Handles democratic feature selection and voting mechanism
 */

import { FeatureProposal, FeatureComment, FeatureVote, VotingLeaderboardEntry } from '@/types/community';

/**
 * Feature Voting Service
 * Manages proposal creation, voting, and community influence tracking
 */
export class FeatureVotingService {
  private proposals: Map<string, FeatureProposal> = new Map();
  private votes: Map<string, FeatureVote[]> = new Map();
  private leaderboard: VotingLeaderboardEntry[] = [];

  /**
   * Create a new feature proposal
   */
  async createProposal(
    title: string,
    description: string,
    category: FeatureProposal['category'],
    proposedBy: string,
    estimatedComplexity: 'low' | 'medium' | 'high' = 'medium',
    tags: string[] = []
  ): Promise<FeatureProposal> {
    const id = this.generateId();
    const proposal: FeatureProposal = {
      id,
      title,
      description,
      category,
      proposedBy,
      proposedAt: new Date(),
      updatedAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      comments: [],
      status: 'proposed',
      estimatedComplexity,
      tags,
      communityVotePercentage: 0,
    };

    this.proposals.set(id, proposal);
    this.votes.set(id, []);

    // Notify subscribers
    await this.notifyProposalCreated(proposal);

    return proposal;
  }

  /**
   * Get all proposals with optional filtering
   */
  async getProposals(filters?: {
    category?: FeatureProposal['category'];
    status?: FeatureProposal['status'];
    sort?: 'votes' | 'recent' | 'trending';
    limit?: number;
    offset?: number;
  }): Promise<FeatureProposal[]> {
    let proposals = Array.from(this.proposals.values());

    // Apply filters
    if (filters?.category) {
      proposals = proposals.filter((p) => p.category === filters.category);
    }
    if (filters?.status) {
      proposals = proposals.filter((p) => p.status === filters.status);
    }

    // Sort
    if (filters?.sort === 'votes') {
      proposals.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    } else if (filters?.sort === 'recent') {
      proposals.sort((a, b) => b.proposedAt.getTime() - a.proposedAt.getTime());
    } else if (filters?.sort === 'trending') {
      proposals.sort((a, b) => this.calculateTrendingScore(b) - this.calculateTrendingScore(a));
    }

    // Paginate
    const start = filters?.offset || 0;
    const end = start + (filters?.limit || 20);

    return proposals.slice(start, end);
  }

  /**
   * Get a single proposal by ID
   */
  async getProposal(proposalId: string): Promise<FeatureProposal | null> {
    return this.proposals.get(proposalId) || null;
  }

  /**
   * Vote on a proposal
   */
  async vote(proposalId: string, userId: string, voteType: 'upvote' | 'downvote'): Promise<FeatureProposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const existingVotes = this.votes.get(proposalId) || [];
    const existingVote = existingVotes.find((v) => v.userId === userId);

    // Remove previous vote if exists
    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        proposal.upvotes = Math.max(0, proposal.upvotes - 1);
      } else {
        proposal.downvotes = Math.max(0, proposal.downvotes - 1);
      }
    }

    // Add new vote
    if (voteType === 'upvote') {
      proposal.upvotes++;
    } else {
      proposal.downvotes++;
    }

    // Update vote record
    if (existingVote) {
      existingVote.voteType = voteType;
      existingVote.createdAt = new Date();
    } else {
      existingVotes.push({
        id: this.generateId(),
        proposalId,
        userId,
        voteType,
        createdAt: new Date(),
      });
    }

    this.votes.set(proposalId, existingVotes);

    // Calculate vote percentage
    const totalVotes = proposal.upvotes + proposal.downvotes;
    proposal.communityVotePercentage = totalVotes > 0 ? (proposal.upvotes / totalVotes) * 100 : 0;

    proposal.updatedAt = new Date();

    await this.updateLeaderboard(userId);

    return proposal;
  }

  /**
   * Add a comment to a proposal
   */
  async addComment(
    proposalId: string,
    userId: string,
    userName: string,
    content: string,
    userAvatar?: string
  ): Promise<FeatureComment> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const comment: FeatureComment = {
      id: this.generateId(),
      proposalId,
      userId,
      userName,
      userAvatar,
      content,
      createdAt: new Date(),
      likes: 0,
    };

    proposal.comments.push(comment);
    proposal.updatedAt = new Date();

    await this.notifyCommentAdded(proposal, comment);

    return comment;
  }

  /**
   * Update proposal status (admin only)
   */
  async updateProposalStatus(
    proposalId: string,
    status: FeatureProposal['status'],
    targetRelease?: string
  ): Promise<FeatureProposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    proposal.status = status;
    if (targetRelease) {
      proposal.targetRelease = targetRelease;
    }
    proposal.updatedAt = new Date();

    await this.notifyStatusChanged(proposal);

    return proposal;
  }

  /**
   * Get voting leaderboard
   */
  async getLeaderboard(limit: number = 50): Promise<VotingLeaderboardEntry[]> {
    return this.leaderboard.slice(0, limit);
  }

  /**
   * Get user's voting stats
   */
  async getUserVotingStats(userId: string): Promise<{
    totalVotes: number;
    acceptedProposals: number;
    communityScore: number;
    impactLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  }> {
    const leaderboardEntry = this.leaderboard.find((entry) => entry.userId === userId);

    if (!leaderboardEntry) {
      return {
        totalVotes: 0,
        acceptedProposals: 0,
        communityScore: 0,
        impactLevel: 'bronze',
      };
    }

    return {
      totalVotes: leaderboardEntry.totalVotes,
      acceptedProposals: leaderboardEntry.acceptedProposals,
      communityScore: leaderboardEntry.communityScore,
      impactLevel: leaderboardEntry.impactLevel,
    };
  }

  /**
   * Get proposals by category
   */
  async getProposalsByCategory(
    category: FeatureProposal['category'],
    limit?: number
  ): Promise<FeatureProposal[]> {
    return this.getProposals({ category, sort: 'votes', limit });
  }

  /**
   * Get trending proposals
   */
  async getTrendingProposals(limit: number = 10): Promise<FeatureProposal[]> {
    return this.getProposals({ sort: 'trending', limit });
  }

  /**
   * Search proposals
   */
  async searchProposals(query: string): Promise<FeatureProposal[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.proposals.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get related proposals
   */
  async getRelatedProposals(proposalId: string, limit: number = 5): Promise<FeatureProposal[]> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return [];

    return Array.from(this.proposals.values())
      .filter((p) => p.id !== proposalId && p.category === proposal.category)
      .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      .slice(0, limit);
  }

  /**
   * Calculate trending score based on velocity and engagement
   */
  private calculateTrendingScore(proposal: FeatureProposal): number {
    const now = new Date();
    const ageHours = (now.getTime() - proposal.updatedAt.getTime()) / (1000 * 60 * 60);
    const velocityMultiplier = Math.exp(-ageHours / 168); // Decay over a week

    const engagementScore =
      proposal.upvotes * 2 + proposal.downvotes + proposal.comments.length * 0.5;

    return engagementScore * velocityMultiplier;
  }

  /**
   * Update leaderboard
   */
  private async updateLeaderboard(userId: string): Promise<void> {
    const userVotes = Array.from(this.votes.values()).flatMap((votes) =>
      votes.filter((v) => v.userId === userId)
    );

    const userProposals = Array.from(this.proposals.values()).filter((p) => p.proposedBy === userId);

    const acceptedProposals = userProposals.filter((p) => p.status === 'completed').length;

    const totalVotes = userVotes.length;
    const voteInfluence = userVotes.filter((v) => v.voteType === 'upvote').length;

    const communityScore =
      totalVotes * 10 + acceptedProposals * 50 + voteInfluence * 5 + userProposals.length * 20;

    let impactLevel: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (communityScore >= 1000) impactLevel = 'platinum';
    else if (communityScore >= 500) impactLevel = 'gold';
    else if (communityScore >= 200) impactLevel = 'silver';

    const existingIndex = this.leaderboard.findIndex((entry) => entry.userId === userId);
    const entry: VotingLeaderboardEntry = {
      rank: 0,
      userId,
      userName: userId,
      totalVotes,
      acceptedProposals,
      communityScore,
      impactLevel,
    };

    if (existingIndex >= 0) {
      this.leaderboard[existingIndex] = entry;
    } else {
      this.leaderboard.push(entry);
    }

    // Re-rank
    this.leaderboard.sort((a, b) => b.communityScore - a.communityScore);
    this.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify proposal created
   */
  private async notifyProposalCreated(proposal: FeatureProposal): Promise<void> {
    // Implementation for notifications
    console.log(`New proposal created: ${proposal.title}`);
  }

  /**
   * Notify comment added
   */
  private async notifyCommentAdded(proposal: FeatureProposal, comment: FeatureComment): Promise<void> {
    console.log(`Comment added to proposal: ${proposal.title}`);
  }

  /**
   * Notify status changed
   */
  private async notifyStatusChanged(proposal: FeatureProposal): Promise<void> {
    console.log(`Proposal status changed: ${proposal.title} -> ${proposal.status}`);
  }
}

// Export singleton instance
export const featureVotingService = new FeatureVotingService();

/**
 * Helper functions for feature voting
 */

export async function proposeFeature(
  title: string,
  description: string,
  category: FeatureProposal['category'],
  userId: string
): Promise<FeatureProposal> {
  return featureVotingService.createProposal(title, description, category, userId);
}

export async function voteOnProposal(
  proposalId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<void> {
  await featureVotingService.vote(proposalId, userId, voteType);
}

export async function commentOnProposal(
  proposalId: string,
  userId: string,
  userName: string,
  content: string
): Promise<FeatureComment> {
  return featureVotingService.addComment(proposalId, userId, userName, content);
}

export async function getAllProposals(): Promise<FeatureProposal[]> {
  return featureVotingService.getProposals({ sort: 'votes' });
}

export async function getTrendingProposals(): Promise<FeatureProposal[]> {
  return featureVotingService.getTrendingProposals();
}

export async function getVotingLeaderboard(): Promise<VotingLeaderboardEntry[]> {
  return featureVotingService.getLeaderboard();
}

export async function searchProposals(query: string): Promise<FeatureProposal[]> {
  return featureVotingService.searchProposals(query);
}
