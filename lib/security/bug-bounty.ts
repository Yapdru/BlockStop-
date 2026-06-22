/**
 * BlockStop Phase 30.3 - Enterprise Security: Bug Bounty Program
 * Production-ready bug bounty and vulnerability disclosure management
 * - Vulnerability submission and tracking
 * - CVSS severity scoring
 * - Responsible disclosure timeline enforcement
 * - Reward calculation and payment
 * - Reporter reputation management
 * - Public disclosure reporting
 * - Hall of fame tracking
 */

import * as crypto from 'crypto';

/**
 * Vulnerability submission and tracking
 */
export type VulnerabilityStatus =
  | 'submitted'
  | 'acknowledged'
  | 'triaged'
  | 'assigned'
  | 'in-progress'
  | 'resolved'
  | 'verified'
  | 'disclosed'
  | 'rejected'
  | 'duplicate';

export type CVSSVersion = 'v3.0' | 'v3.1' | 'v4.0';

export interface VulnerabilityReport {
  id: string;
  reporterEmail: string;
  reporterName?: string;
  reporterId?: string;
  reportedAt: Date;
  title: string;
  description: string;
  affectedComponent: string;
  affectedVersion?: string;
  reproductionSteps: string;
  attachmentUrls?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvssScore: number; // 0.0-10.0
  cvssVector: string; // e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
  cvssVersion: CVSSVersion;
  status: VulnerabilityStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  discoveryDate: Date;
  firstResponseDate?: Date;
  resolutionDate?: Date;
  disclosureDate?: Date;
  assignedTo?: string;
  internalNotes?: string;
  publicNotes?: string;
  cveAssigned?: string;
  affectedUsers?: number;
  impactDescription?: string;
  timeline: DisclosureTimeline;
  reward?: RewardInfo;
}

export interface DisclosureTimeline {
  initialReportDate: Date;
  acknowledgeByDate: Date;
  triageByDate: Date;
  targetFixDate: Date;
  maxDisclosureDate: Date;
  actualAcknowledgeDate?: Date;
  actualTriageDate?: Date;
  actualFixDate?: Date;
  actualDisclosureDate?: Date;
  daysToFix?: number;
  complianceStatus: 'on-track' | 'at-risk' | 'overdue';
}

export interface RewardInfo {
  eligible: boolean;
  tierLevel: 'critical' | 'high' | 'medium' | 'low' | 'acknowledgment';
  suggestedReward: number;
  actualReward?: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  paidAt?: Date;
  paymentMethod?: 'stripe' | 'paypal' | 'bank' | 'crypto' | 'donations';
  paymentReference?: string;
  notes?: string;
}

export interface BugBountyReporter {
  id: string;
  email: string;
  name?: string;
  country?: string;
  taxInfo?: {
    type: 'individual' | 'business';
    id?: string; // SSN/Business ID
    name?: string;
  };
  reportCount: number;
  successfulReports: number;
  totalRewardsEarned: number;
  reputation: number; // 0-100
  verificationStatus: 'unverified' | 'verified' | 'trusted';
  joinedAt: Date;
  lastReportAt?: Date;
  bankDetails?: {
    accountHolder: string;
    accountNumber?: string; // Last 4 digits only
    routingNumber?: string;
    swiftCode?: string;
    iban?: string;
  };
  paypalEmail?: string;
  cryptoWallets?: {
    type: 'bitcoin' | 'ethereum' | 'other';
    address: string;
  }[];
  nda: boolean;
  ndaSignedAt?: Date;
  communicationPreference: 'email' | 'slack' | 'dashboard';
  tags?: string[];
}

export interface RewardTier {
  level: 'critical' | 'high' | 'medium' | 'low' | 'acknowledgment';
  cvssRange: [number, number];
  minReward: number;
  maxReward: number;
  multipliers: {
    firstDiscover: number;
    complexityBonus: number;
    impactBonus: number;
  };
  description: string;
}

export interface HallOfFameEntry {
  reporterId: string;
  reporterName: string;
  country?: string;
  reportCount: number;
  totalRewardsEarned: number;
  reputation: number;
  rank: number;
  joinedAt: Date;
  website?: string;
  bio?: string;
  profileImage?: string;
  displayPublicly: boolean;
}

export interface PublicDisclosureReport {
  id: string;
  reportId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  affectedComponent: string;
  affectedVersions: string[];
  fixedVersion: string;
  disclosureDate: Date;
  acknowledgment?: string;
  reporterCredit?: string;
  cve?: string;
  references?: string[];
}

export class BugBountyManager {
  private reports: Map<string, VulnerabilityReport> = new Map();
  private reporters: Map<string, BugBountyReporter> = new Map();
  private rewardTiers: RewardTier[] = [];
  private publicDisclosures: Map<string, PublicDisclosureReport> = new Map();

  constructor() {
    this.initializeRewardTiers();
  }

  /**
   * Initialize default reward tiers
   */
  private initializeRewardTiers(): void {
    this.rewardTiers = [
      {
        level: 'critical',
        cvssRange: [9.0, 10.0],
        minReward: 10000,
        maxReward: 50000,
        multipliers: {
          firstDiscover: 1.5,
          complexityBonus: 1.2,
          impactBonus: 1.3,
        },
        description: 'Remote code execution, authentication bypass, data exposure',
      },
      {
        level: 'high',
        cvssRange: [7.0, 8.9],
        minReward: 5000,
        maxReward: 15000,
        multipliers: {
          firstDiscover: 1.3,
          complexityBonus: 1.1,
          impactBonus: 1.2,
        },
        description: 'Significant security impact with reasonable attack vector',
      },
      {
        level: 'medium',
        cvssRange: [4.0, 6.9],
        minReward: 1000,
        maxReward: 5000,
        multipliers: {
          firstDiscover: 1.2,
          complexityBonus: 1.1,
          impactBonus: 1.1,
        },
        description: 'Moderate security impact',
      },
      {
        level: 'low',
        cvssRange: [0.1, 3.9],
        minReward: 100,
        maxReward: 1000,
        multipliers: {
          firstDiscover: 1.0,
          complexityBonus: 1.0,
          impactBonus: 1.0,
        },
        description: 'Minor security issue',
      },
      {
        level: 'acknowledgment',
        cvssRange: [0.0, 0.0],
        minReward: 0,
        maxReward: 500,
        multipliers: {
          firstDiscover: 1.0,
          complexityBonus: 1.0,
          impactBonus: 1.0,
        },
        description: 'Non-security issue or informational',
      },
    ];
  }

  /**
   * Submit a vulnerability report
   */
  public submitReport(report: Omit<VulnerabilityReport, 'id' | 'reportedAt' | 'status' | 'timeline'>): VulnerabilityReport {
    const reportId = this.generateId('VRN');
    const now = new Date();

    const timeline: DisclosureTimeline = {
      initialReportDate: now,
      acknowledgeByDate: this.addDays(now, 1),
      triageByDate: this.addDays(now, 3),
      targetFixDate: this.addDays(now, 14), // 14 days standard
      maxDisclosureDate: this.addDays(now, 90), // 90-day standard
      complianceStatus: 'on-track',
    };

    const newReport: VulnerabilityReport = {
      ...report,
      id: reportId,
      reportedAt: now,
      status: 'submitted',
      timeline,
      reward: {
        eligible: true,
        tierLevel: this.determineTierLevel(report.cvssScore),
        suggestedReward: this.calculateBaseReward(report.cvssScore),
        status: 'pending',
        currency: 'USD',
      },
    };

    this.reports.set(reportId, newReport);
    this.updateReporterStats(report.reporterEmail);

    return newReport;
  }

  /**
   * Acknowledge receipt of a report
   */
  public acknowledgeReport(reportId: string, internalNotes?: string): VulnerabilityReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const now = new Date();
    report.status = 'acknowledged';
    report.firstResponseDate = now;
    report.timeline.actualAcknowledgeDate = now;
    if (internalNotes) {
      report.internalNotes = internalNotes;
    }

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Triage and prioritize a report
   */
  public triageReport(
    reportId: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    internalNotes?: string,
    affectedUserEstimate?: number
  ): VulnerabilityReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const now = new Date();
    report.status = 'triaged';
    report.priority = priority;
    report.timeline.actualTriageDate = now;
    if (affectedUserEstimate) {
      report.affectedUsers = affectedUserEstimate;
    }
    if (internalNotes) {
      report.internalNotes = internalNotes;
    }

    // Update fix timeline based on severity
    const fixDays = priority === 'critical' ? 3 : priority === 'high' ? 7 : priority === 'medium' ? 14 : 30;
    report.timeline.targetFixDate = this.addDays(now, fixDays);

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Assign report to team member
   */
  public assignReport(reportId: string, assignee: string): VulnerabilityReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    report.status = 'assigned';
    report.assignedTo = assignee;
    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Mark a vulnerability as resolved/fixed
   */
  public resolveVulnerability(reportId: string, fixNotes?: string): VulnerabilityReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const now = new Date();
    report.status = 'resolved';
    report.resolutionDate = now;
    report.timeline.actualFixDate = now;
    report.timeline.daysToFix = Math.ceil(
      (now.getTime() - report.reportedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (fixNotes) {
      report.internalNotes = fixNotes;
    }

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Verify fix and approve for disclosure
   */
  public verifyAndApproveDisclosure(reportId: string, verificationNotes?: string): VulnerabilityReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (report.status !== 'resolved') {
      throw new Error('Cannot approve disclosure for non-resolved vulnerability');
    }

    report.status = 'verified';
    if (verificationNotes) {
      report.publicNotes = verificationNotes;
    }

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Publish public disclosure
   */
  public publishDisclosure(reportId: string, reporterCredit?: string): PublicDisclosureReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (report.status !== 'verified') {
      throw new Error('Cannot publish unverified vulnerability');
    }

    const now = new Date();
    report.status = 'disclosed';
    report.disclosureDate = now;
    report.timeline.actualDisclosureDate = now;

    const disclosureReport: PublicDisclosureReport = {
      id: this.generateId('PDR'),
      reportId,
      title: report.title,
      description: report.description,
      severity: report.severity,
      cvssScore: report.cvssScore,
      affectedComponent: report.affectedComponent,
      affectedVersions: report.affectedVersion ? [report.affectedVersion] : [],
      fixedVersion: 'Latest',
      disclosureDate: now,
      acknowledgment: report.publicNotes,
      reporterCredit: reporterCredit || report.reporterName || 'Anonymous',
      cve: report.cveAssigned,
      references: report.attachmentUrls,
    };

    this.publicDisclosures.set(disclosureReport.id, disclosureReport);
    this.reports.set(reportId, report);

    return disclosureReport;
  }

  /**
   * Calculate reward for a vulnerability
   */
  public calculateReward(reportId: string, addFactors?: {
    isFirstDiscover?: boolean;
    complexityBonus?: number;
    impactBonus?: number;
  }): RewardInfo {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    if (!report.reward) {
      throw new Error('Report not eligible for reward');
    }

    const tier = this.rewardTiers.find(t => t.level === report.reward!.tierLevel);
    if (!tier) {
      throw new Error('Tier not found');
    }

    let reward = (tier.minReward + tier.maxReward) / 2; // Base: average of range

    if (addFactors?.isFirstDiscover) {
      reward *= tier.multipliers.firstDiscover;
    }
    if (addFactors?.complexityBonus) {
      reward *= addFactors.complexityBonus;
    }
    if (addFactors?.impactBonus) {
      reward *= addFactors.impactBonus;
    }

    // Cap to tier limits
    reward = Math.min(Math.max(reward, tier.minReward), tier.maxReward);

    report.reward.suggestedReward = Math.round(reward);
    this.reports.set(reportId, report);

    return report.reward;
  }

  /**
   * Approve and process reward payment
   */
  public approveReward(
    reportId: string,
    approverEmail: string,
    amount?: number,
    notes?: string
  ): RewardInfo {
    const report = this.reports.get(reportId);
    if (!report || !report.reward) {
      throw new Error('Report or reward not found');
    }

    report.reward.status = 'approved';
    report.reward.actualReward = amount || report.reward.suggestedReward;
    report.reward.approvedBy = approverEmail;
    report.reward.approvedAt = new Date();
    if (notes) {
      report.reward.notes = notes;
    }

    this.reports.set(reportId, report);
    return report.reward;
  }

  /**
   * Record reward payment
   */
  public recordPayment(
    reportId: string,
    paymentMethod: 'stripe' | 'paypal' | 'bank' | 'crypto' | 'donations',
    paymentReference: string
  ): RewardInfo {
    const report = this.reports.get(reportId);
    if (!report || !report.reward) {
      throw new Error('Report or reward not found');
    }

    if (report.reward.status !== 'approved') {
      throw new Error('Reward must be approved before payment');
    }

    report.reward.status = 'paid';
    report.reward.paymentMethod = paymentMethod;
    report.reward.paymentReference = paymentReference;
    report.reward.paidAt = new Date();

    this.reports.set(reportId, report);
    return report.reward;
  }

  /**
   * Get or create reporter profile
   */
  public getOrCreateReporter(email: string, name?: string): BugBountyReporter {
    let reporter = this.reporters.get(email);
    if (!reporter) {
      reporter = {
        id: this.generateId('REP'),
        email,
        name,
        reportCount: 0,
        successfulReports: 0,
        totalRewardsEarned: 0,
        reputation: 50, // Start at neutral
        verificationStatus: 'unverified',
        joinedAt: new Date(),
        nda: false,
        communicationPreference: 'email',
      };
      this.reporters.set(email, reporter);
    }
    return reporter;
  }

  /**
   * Update reporter verification status
   */
  public verifyReporter(email: string, verificationStatus: 'verified' | 'trusted'): BugBountyReporter {
    const reporter = this.reporters.get(email);
    if (!reporter) {
      throw new Error(`Reporter ${email} not found`);
    }

    reporter.verificationStatus = verificationStatus;
    this.reporters.set(email, reporter);
    return reporter;
  }

  /**
   * Update reporter reputation score
   */
  public updateReporterReputation(email: string, delta: number): number {
    const reporter = this.reporters.get(email);
    if (!reporter) {
      throw new Error(`Reporter ${email} not found`);
    }

    reporter.reputation = Math.max(0, Math.min(100, reporter.reputation + delta));
    this.reporters.set(email, reporter);
    return reporter.reputation;
  }

  /**
   * Get hall of fame leaderboard
   */
  public getHallOfFame(limit: number = 100): HallOfFameEntry[] {
    return Array.from(this.reporters.values())
      .filter(r => r.reportCount > 0 && r.verificationStatus !== 'unverified')
      .map(r => ({
        reporterId: r.id,
        reporterName: r.name || r.email,
        country: r.country,
        reportCount: r.reportCount,
        totalRewardsEarned: r.totalRewardsEarned,
        reputation: r.reputation,
        rank: 0,
        joinedAt: r.joinedAt,
        displayPublicly: true,
      }))
      .sort((a, b) => b.totalRewardsEarned - a.totalRewardsEarned)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))
      .slice(0, limit);
  }

  /**
   * Get public disclosures
   */
  public getPublicDisclosures(limit: number = 50): PublicDisclosureReport[] {
    return Array.from(this.publicDisclosures.values())
      .sort((a, b) => b.disclosureDate.getTime() - a.disclosureDate.getTime())
      .slice(0, limit);
  }

  /**
   * Check disclosure timeline compliance
   */
  public checkTimelineCompliance(reportId: string): {
    status: 'on-track' | 'at-risk' | 'overdue';
    daysRemaining: number;
    recommendedActions: string[];
  } {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const now = new Date();
    const maxDate = report.timeline.maxDisclosureDate;
    const daysRemaining = Math.ceil((maxDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: 'on-track' | 'at-risk' | 'overdue' = 'on-track';
    const recommendedActions: string[] = [];

    if (daysRemaining <= 0) {
      status = 'overdue';
      recommendedActions.push('Immediately publish disclosure or request extended timeline');
      recommendedActions.push('Document any extenuating circumstances');
      recommendedActions.push('Notify reporter and discuss resolution');
    } else if (daysRemaining <= 14) {
      status = 'at-risk';
      recommendedActions.push('Prioritize fix completion');
      recommendedActions.push('Begin disclosure preparation');
      recommendedActions.push('Notify reporter if timeline will slip');
    }

    if (!report.timeline.actualFixDate && now > report.timeline.targetFixDate) {
      recommendedActions.push('Fix is overdue - escalate to engineering');
    }

    return { status, daysRemaining, recommendedActions };
  }

  /**
   * Get vulnerability report
   */
  public getReport(reportId: string): VulnerabilityReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Get all reports (with optional filtering)
   */
  public getReports(filters?: {
    status?: VulnerabilityStatus;
    severity?: string;
    assignedTo?: string;
    reporterEmail?: string;
  }): VulnerabilityReport[] {
    let results = Array.from(this.reports.values());

    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters?.severity) {
      results = results.filter(r => r.severity === filters.severity);
    }
    if (filters?.assignedTo) {
      results = results.filter(r => r.assignedTo === filters.assignedTo);
    }
    if (filters?.reporterEmail) {
      results = results.filter(r => r.reporterEmail === filters.reporterEmail);
    }

    return results.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  /**
   * Get reporter statistics
   */
  public getReporterStats(email: string): {
    totalReports: number;
    successfulReports: number;
    totalRewards: number;
    averageReward: number;
    reputation: number;
  } {
    const reporter = this.reporters.get(email);
    if (!reporter) {
      throw new Error(`Reporter ${email} not found`);
    }

    return {
      totalReports: reporter.reportCount,
      successfulReports: reporter.successfulReports,
      totalRewards: reporter.totalRewardsEarned,
      averageReward: reporter.reportCount > 0 ? reporter.totalRewardsEarned / reporter.reportCount : 0,
      reputation: reporter.reputation,
    };
  }

  /**
   * Private helper: Determine tier from CVSS score
   */
  private determineTierLevel(cvssScore: number): 'critical' | 'high' | 'medium' | 'low' | 'acknowledgment' {
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    if (cvssScore >= 0.1) return 'low';
    return 'acknowledgment';
  }

  /**
   * Private helper: Calculate base reward
   */
  private calculateBaseReward(cvssScore: number): number {
    const tier = this.rewardTiers.find(t =>
      cvssScore >= t.cvssRange[0] && cvssScore <= t.cvssRange[1]
    );
    if (!tier) return 0;
    return (tier.minReward + tier.maxReward) / 2;
  }

  /**
   * Private helper: Update reporter statistics
   */
  private updateReporterStats(email: string): void {
    const reporter = this.getOrCreateReporter(email);
    reporter.reportCount += 1;
    reporter.lastReportAt = new Date();
    this.reporters.set(email, reporter);
  }

  /**
   * Private helper: Generate ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private helper: Add days to date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

// Singleton instance
export const bugBountyManager = new BugBountyManager();
