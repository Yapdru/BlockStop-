// Community & Future Types

/**
 * Feature Voting System Types
 */
export interface FeatureProposal {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'performance' | 'ui-ux' | 'integration' | 'analytics' | 'compliance' | 'other';
  proposedBy: string;
  proposedAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
  comments: FeatureComment[];
  status: 'proposed' | 'under-review' | 'planned' | 'in-progress' | 'completed' | 'rejected';
  targetRelease?: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  communityVotePercentage?: number;
  tags: string[];
  attachments?: string[];
}

export interface FeatureComment {
  id: string;
  proposalId: string;
  userId: string;
  userAvatar?: string;
  userName: string;
  content: string;
  createdAt: Date;
  likes: number;
  replies?: FeatureComment[];
}

export interface FeatureVote {
  id: string;
  proposalId: string;
  userId: string;
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
}

export interface VotingLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  totalVotes: number;
  acceptedProposals: number;
  communityScore: number;
  impactLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Public Roadmap Types
 */
export interface RoadmapQuarter {
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  startDate: Date;
  endDate: Date;
  milestones: RoadmapMilestone[];
  releaseNotes?: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
  completionPercentage: number;
  features: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  communityRequestCount: number;
  owner?: string;
}

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'planned' | 'in-progress' | 'beta' | 'released' | 'discontinued';
  priority: 'critical' | 'high' | 'medium' | 'low';
  releaseDate?: Date;
  estimatedDate?: Date;
  communityVotes: number;
  linkedProposalIds: string[];
  technicalDetails?: string;
  dependencies?: string[];
}

export interface RoadmapRelease {
  version: string;
  releasedAt: Date;
  highlights: string[];
  features: string[];
  bugFixes: string[];
  performanceImprovements: string[];
  securityUpdates: string[];
}

/**
 * Feedback System Types
 */
export interface UserFeedback {
  id: string;
  userId: string;
  userEmail: string;
  feedbackType: 'feature-request' | 'bug-report' | 'improvement' | 'complaint' | 'praise' | 'other';
  title: string;
  description: string;
  category: string;
  sentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
  sentimentScore: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  attachments?: string[];
  status: 'open' | 'acknowledged' | 'in-progress' | 'resolved' | 'closed' | 'wont-fix';
  createdAt: Date;
  updatedAt: Date;
  responses?: FeedbackResponse[];
  tags: string[];
  upvotes: number;
  linkedProposalIds: string[];
}

export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  responder: string;
  content: string;
  createdAt: Date;
  isOfficial: boolean;
}

export interface FeedbackTrend {
  topic: string;
  frequency: number;
  sentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
  growthTrend: 'up' | 'down' | 'stable';
  mentionCount: number;
  relatedCategories: string[];
}

export interface BugReport {
  id: string;
  feedback: UserFeedback;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reproductionSteps: string[];
  affectedVersions: string[];
  reproductionRate: number;
  relatedIssues?: string[];
  assignedTo?: string;
  dueDate?: Date;
}

/**
 * Community Analytics Types
 */
export interface CommunityEngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  monthlyActiveUsers: number;
  engagementRate: number;
  averageSessionDuration: number;
  returnUserRate: number;
}

export interface CommunityGrowthMetrics {
  signupsThisWeek: number;
  signupsThisMonth: number;
  churnRate: number;
  growthRate: number;
  totalLifetimeUsers: number;
  weekOverWeekGrowth: number;
  monthOverMonthGrowth: number;
}

export interface FeatureAdoptionMetrics {
  featureName: string;
  adoptionRate: number;
  usersWhoCounts: number;
  averageUsagePerUser: number;
  timeToAdoption: number;
  satisfactionScore: number;
}

export interface CommunityContentMetrics {
  totalProposals: number;
  proposalsThisMonth: number;
  averageProposalQuality: number;
  totalComments: number;
  averageCommentsPerProposal: number;
  totalFeedback: number;
  feedbackResolutionRate: number;
}

export interface CommunityHealthScore {
  overallScore: number; // 0-100
  engagementScore: number;
  growthScore: number;
  contentQualityScore: number;
  satisfactionScore: number;
  communityVibe: 'thriving' | 'healthy' | 'stable' | 'declining' | 'critical';
  lastUpdated: Date;
}

export interface NPS {
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  respondents: number;
  trend: 'up' | 'down' | 'stable';
  comments: NPSComment[];
}

export interface NPSComment {
  id: string;
  score: number;
  comment: string;
  userSegment: string;
  createdAt: Date;
}

export interface SentimentAnalysis {
  overallSentiment: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
  sentimentScore: number; // -1 to 1
  topicsPositive: string[];
  topicsNegative: string[];
  emotionCounts: {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    disgust: number;
    anger: number;
    anticipation: number;
  };
  timeSeriesData: Array<{
    date: Date;
    sentiment: number;
    volumeOfMentions: number;
  }>;
}

export interface TrendingContent {
  itemId: string;
  itemType: 'proposal' | 'feedback' | 'discussion';
  title: string;
  mentionCount: number;
  engagementRate: number;
  trendingRank: number;
  velocityScore: number;
  relevantTopics: string[];
}

export interface CommunityAnalyticsDashboard {
  engagementMetrics: CommunityEngagementMetrics;
  growthMetrics: CommunityGrowthMetrics;
  featureAdoption: FeatureAdoptionMetrics[];
  contentMetrics: CommunityContentMetrics;
  healthScore: CommunityHealthScore;
  nps: NPS;
  sentiment: SentimentAnalysis;
  trendingContent: TrendingContent[];
  generatedAt: Date;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

/**
 * Vision & Roadmap Types
 */
export interface ProductVision {
  versionYear: number;
  missionStatement: string;
  coreValues: string[];
  longTermGoals: string[];
  strategicPillars: StrategicPillar[];
  marketPosition: MarketPositioning;
  competitiveAdvantages: string[];
}

export interface StrategicPillar {
  name: string;
  description: string;
  objectives: string[];
  successMetrics: string[];
  ownerTeam: string;
}

export interface MarketPositioning {
  targetMarket: string;
  marketSize: string;
  targetSegments: string[];
  positioning: string;
  uniqueValueProposition: string;
  competitorAnalysis: string;
}

export interface TechnologyRoadmap {
  infrastructure: InfrastructureGoal[];
  scalability: ScalabilityGoal[];
  security: SecurityGoal[];
  performance: PerformanceGoal[];
  modernization: ModernizationGoal[];
}

export interface InfrastructureGoal {
  title: string;
  description: string;
  timeline: string;
  estimatedCost: string;
  expectedBenefit: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ScalabilityGoal extends InfrastructureGoal {}

export interface SecurityGoal extends InfrastructureGoal {}

export interface PerformanceGoal extends InfrastructureGoal {}

export interface ModernizationGoal extends InfrastructureGoal {}

export interface SustainabilityStrategy {
  revenueStreams: RevenueStream[];
  costStructure: CostArea[];
  partnershipStrategy: string;
  customerAcquisitionStrategy: string;
  customerRetentionStrategy: string;
  profitabilityTimeline: string;
}

export interface RevenueStream {
  name: string;
  description: string;
  estimatedContribution: number; // percentage
  targetCustomers: string;
  growthProjection: string;
}

export interface CostArea {
  category: string;
  estimatedAnnualCost: string;
  optimization: string;
}

export interface CommunityRoleStrategy {
  description: string;
  contributorProgram: string;
  partnerProgram: string;
  openSourceInitiatives: string[];
  communityGuidelines: string;
  feedbackLoops: string[];
}

export interface TransformationGoals {
  title: string;
  description: string;
  timeline: string;
  milestones: string[];
  successCriteria: string[];
  requiredInvestment: string;
}
