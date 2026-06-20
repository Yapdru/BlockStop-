/**
 * Affiliate Program Module
 * Manages developer affiliate commissions and referrals
 */

export interface AffiliateLink {
  linkId: string;
  developerId: string;
  productId: string;
  code: string;
  commissionRate: number; // percentage
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AffiliateCommission {
  commissionId: string;
  developerId: string;
  referredCustomerId: string;
  productId: string;
  linkId: string;
  amount: number;
  commissionRate: number;
  status: 'pending' | 'approved' | 'paid' | 'refunded';
  referralDate: Date;
  approvalDate?: Date;
  paymentDate?: Date;
}

export interface AffiliateStats {
  developerId: string;
  totalCommissions: number;
  totalEarnings: number;
  activeLinks: number;
  clicksTotal: number;
  conversionsTotal: number;
  conversionRate: number;
  monthlyStats: Map<string, { clicks: number; conversions: number; earnings: number }>;
}

export class AffiliateProgram {
  private affiliateLinks: Map<string, AffiliateLink> = new Map();
  private commissions: Map<string, AffiliateCommission> = new Map();
  private linkClicks: Map<string, number> = new Map();
  private linkConversions: Map<string, number> = new Map();

  private readonly DEFAULT_COMMISSION_RATE = 15; // 15%
  private readonly PREMIUM_COMMISSION_RATE = 25; // 25%

  /**
   * Create affiliate link
   */
  createAffiliateLink(
    developerId: string,
    productId: string,
    customCommissionRate?: number,
    expiryDays?: number
  ): AffiliateLink {
    const linkId = `aff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const code = this.generateAffiliateCode(developerId);

    const link: AffiliateLink = {
      linkId,
      developerId,
      productId,
      code,
      commissionRate: customCommissionRate || this.DEFAULT_COMMISSION_RATE,
      createdAt: new Date(),
      expiresAt: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : undefined,
      isActive: true,
    };

    this.affiliateLinks.set(linkId, link);
    this.linkClicks.set(linkId, 0);
    this.linkConversions.set(linkId, 0);

    return link;
  }

  /**
   * Track link click
   */
  trackLinkClick(linkId: string): void {
    const link = this.affiliateLinks.get(linkId);
    if (!link) return;

    if (!link.isActive || (link.expiresAt && link.expiresAt < new Date())) {
      link.isActive = false;
      return;
    }

    const clicks = (this.linkClicks.get(linkId) || 0) + 1;
    this.linkClicks.set(linkId, clicks);
  }

  /**
   * Record commission
   */
  recordCommission(
    developerId: string,
    referredCustomerId: string,
    productId: string,
    linkId: string,
    purchaseAmount: number
  ): AffiliateCommission {
    const link = this.affiliateLinks.get(linkId);
    if (!link) throw new Error('Affiliate link not found');

    const commissionId = `com-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amount = (purchaseAmount * link.commissionRate) / 100;

    // Track conversion
    const conversions = (this.linkConversions.get(linkId) || 0) + 1;
    this.linkConversions.set(linkId, conversions);

    const commission: AffiliateCommission = {
      commissionId,
      developerId,
      referredCustomerId,
      productId,
      linkId,
      amount,
      commissionRate: link.commissionRate,
      status: 'pending',
      referralDate: new Date(),
    };

    this.commissions.set(commissionId, commission);
    return commission;
  }

  /**
   * Approve commission
   */
  approveCommission(commissionId: string): AffiliateCommission {
    const commission = this.commissions.get(commissionId);
    if (!commission) throw new Error('Commission not found');

    commission.status = 'approved';
    commission.approvalDate = new Date();

    this.commissions.set(commissionId, commission);
    return commission;
  }

  /**
   * Pay commission
   */
  payCommission(commissionId: string): AffiliateCommission {
    const commission = this.commissions.get(commissionId);
    if (!commission) throw new Error('Commission not found');

    if (commission.status !== 'approved') {
      throw new Error('Commission must be approved before payment');
    }

    commission.status = 'paid';
    commission.paymentDate = new Date();

    this.commissions.set(commissionId, commission);
    return commission;
  }

  /**
   * Get affiliate statistics
   */
  getAffiliateStats(developerId: string): AffiliateStats {
    const devLinks = Array.from(this.affiliateLinks.values()).filter((l) => l.developerId === developerId);

    const devCommissions = Array.from(this.commissions.values()).filter(
      (c) => c.developerId === developerId && (c.status === 'approved' || c.status === 'paid')
    );

    let totalClicks = 0;
    let totalConversions = 0;

    for (const link of devLinks) {
      totalClicks += this.linkClicks.get(link.linkId) || 0;
      totalConversions += this.linkConversions.get(link.linkId) || 0;
    }

    const monthlyStats = new Map<string, { clicks: number; conversions: number; earnings: number }>();

    for (const commission of devCommissions) {
      const month = commission.referralDate.toISOString().substring(0, 7);
      const current = monthlyStats.get(month) || { clicks: 0, conversions: 0, earnings: 0 };
      current.earnings += commission.amount;
      monthlyStats.set(month, current);
    }

    return {
      developerId,
      totalCommissions: devCommissions.length,
      totalEarnings: devCommissions.reduce((sum, c) => sum + c.amount, 0),
      activeLinks: devLinks.filter((l) => l.isActive).length,
      clicksTotal: totalClicks,
      conversionsTotal: totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      monthlyStats,
    };
  }

  /**
   * Get developer's affiliate links
   */
  getAffiliateLinks(developerId: string): AffiliateLink[] {
    return Array.from(this.affiliateLinks.values()).filter((l) => l.developerId === developerId);
  }

  /**
   * Get pending commissions for developer
   */
  getPendingCommissions(developerId: string): AffiliateCommission[] {
    return Array.from(this.commissions.values()).filter(
      (c) => c.developerId === developerId && c.status === 'pending'
    );
  }

  /**
   * Deactivate affiliate link
   */
  deactivateLink(linkId: string): AffiliateLink {
    const link = this.affiliateLinks.get(linkId);
    if (!link) throw new Error('Affiliate link not found');

    link.isActive = false;
    this.affiliateLinks.set(linkId, link);

    return link;
  }

  /**
   * Update commission rate for affiliate tier
   */
  updateCommissionRateForTier(tier: 'standard' | 'premium' | 'platinum', rate: number): void {
    // Update commission rates based on developer tier
    // This is a simplified version - in production would be more sophisticated
  }

  /**
   * Generate affiliate code
   */
  private generateAffiliateCode(developerId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${developerId}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Validate affiliate link
   */
  validateAffiliateLink(linkId: string): boolean {
    const link = this.affiliateLinks.get(linkId);
    if (!link) return false;

    if (!link.isActive) return false;

    if (link.expiresAt && link.expiresAt < new Date()) {
      link.isActive = false;
      return false;
    }

    return true;
  }
}

export const affiliateProgram = new AffiliateProgram();
