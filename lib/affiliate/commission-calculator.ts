/**
 * Commission Calculator
 * Calculates affiliate commissions based on tier and performance
 */

export interface CommissionTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  baseCommissionRate: number; // percentage
  referralBonusRate: number; // percentage per referral milestone
  teamCommissionRate?: number; // percentage if referring other affiliates
  minimumPayout: number;
  description: string;
}

export interface CommissionCalculation {
  baseAmount: number;
  baseCommission: number;
  bonusCommission: number;
  referralBonus: number;
  totalCommission: number;
  tier: string;
  reason: string;
}

export class CommissionCalculator {
  private readonly COMMISSION_TIERS: Map<string, CommissionTier> = new Map([
    [
      'bronze',
      {
        tier: 'bronze',
        baseCommissionRate: 10,
        referralBonusRate: 0.5,
        minimumPayout: 50,
        description: '10% base commission, no bonuses',
      },
    ],
    [
      'silver',
      {
        tier: 'silver',
        baseCommissionRate: 15,
        referralBonusRate: 1,
        teamCommissionRate: 2,
        minimumPayout: 25,
        description: '15% base + 1% per 10 referrals + 2% team commission',
      },
    ],
    [
      'gold',
      {
        tier: 'gold',
        baseCommissionRate: 20,
        referralBonusRate: 1.5,
        teamCommissionRate: 3,
        minimumPayout: 10,
        description: '20% base + 1.5% per 10 referrals + 3% team commission',
      },
    ],
    [
      'platinum',
      {
        tier: 'platinum',
        baseCommissionRate: 30,
        referralBonusRate: 2,
        teamCommissionRate: 5,
        minimumPayout: 0,
        description: '30% base + 2% per 10 referrals + 5% team commission',
      },
    ],
  ]);

  /**
   * Calculate commission for a single sale/referral
   */
  calculateCommission(
    baseAmount: number,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum',
    totalAffiliateReferrals: number = 0,
    isTeamReferral: boolean = false
  ): CommissionCalculation {
    const tierConfig = this.COMMISSION_TIERS.get(tier);
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    // Base commission
    const baseCommission = (baseAmount * tierConfig.baseCommissionRate) / 100;

    // Referral bonus (every 10 referrals adds bonus)
    const referralMilestones = Math.floor(totalAffiliateReferrals / 10);
    const referralBonus = (baseAmount * tierConfig.referralBonusRate * referralMilestones) / 100;

    // Team commission bonus
    let teamCommissionBonus = 0;
    if (isTeamReferral && tierConfig.teamCommissionRate) {
      teamCommissionBonus = (baseAmount * tierConfig.teamCommissionRate) / 100;
    }

    const totalCommission = baseCommission + referralBonus + teamCommissionBonus;

    return {
      baseAmount,
      baseCommission: parseFloat(baseCommission.toFixed(2)),
      bonusCommission: parseFloat(referralBonus.toFixed(2)),
      referralBonus: parseFloat(teamCommissionBonus.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      tier,
      reason: `${tierConfig.baseCommissionRate}% base + ${referralMilestones} milestone bonuses`,
    };
  }

  /**
   * Calculate cumulative commission for multiple referrals
   */
  calculateCumulativeCommission(
    referrals: Array<{ amount: number; isActive: boolean; isTeamReferral?: boolean }>,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum',
    totalAffiliateReferrals: number
  ): number {
    let totalCommission = 0;

    for (const referral of referrals) {
      if (referral.isActive) {
        const calculation = this.calculateCommission(
          referral.amount,
          tier,
          totalAffiliateReferrals,
          referral.isTeamReferral || false
        );
        totalCommission += calculation.totalCommission;
      }
    }

    return parseFloat(totalCommission.toFixed(2));
  }

  /**
   * Get commission tier details
   */
  getTierDetails(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): CommissionTier | null {
    return this.COMMISSION_TIERS.get(tier) || null;
  }

  /**
   * Get all commission tiers
   */
  getAllTiers(): CommissionTier[] {
    return Array.from(this.COMMISSION_TIERS.values());
  }

  /**
   * Calculate bonus for reaching referral milestone
   */
  calculateMilestoneBonus(
    totalReferrals: number,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  ): { milestone: number; bonusPercentage: number; unlocked: boolean } | null {
    const tierConfig = this.COMMISSION_TIERS.get(tier);
    if (!tierConfig) return null;

    const nextMilestone = Math.ceil((totalReferrals + 1) / 10) * 10;
    const bonusPercentage = tierConfig.referralBonusRate * (nextMilestone / 10);
    const unlocked = totalReferrals >= nextMilestone;

    return {
      milestone: nextMilestone,
      bonusPercentage,
      unlocked,
    };
  }

  /**
   * Estimate monthly commission based on referral pattern
   */
  estimateMonthlyCommission(
    monthlyReferrals: number,
    averageOrderValue: number,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum',
    totalAffiliateReferrals: number,
    conversionRate: number = 0.8
  ): number {
    const activeReferrals = Math.floor(monthlyReferrals * conversionRate);
    const totalSales = activeReferrals * averageOrderValue;

    const calculation = this.calculateCommission(
      totalSales,
      tier,
      totalAffiliateReferrals,
      false
    );

    return calculation.totalCommission;
  }

  /**
   * Check if payout meets minimum threshold
   */
  isPayoutEligible(amount: number, tier: 'bronze' | 'silver' | 'gold' | 'platinum'): boolean {
    const tierConfig = this.COMMISSION_TIERS.get(tier);
    if (!tierConfig) return false;
    return amount >= tierConfig.minimumPayout;
  }

  /**
   * Get minimum payout for tier
   */
  getMinimumPayout(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): number {
    const tierConfig = this.COMMISSION_TIERS.get(tier);
    return tierConfig?.minimumPayout || 0;
  }

  /**
   * Calculate tier upgrade commission bonus
   */
  calculateTierUpgradeBonus(
    previousTier: 'bronze' | 'silver' | 'gold' | 'platinum',
    newTier: 'bronze' | 'silver' | 'gold' | 'platinum',
    totalCommissionEarned: number
  ): number {
    const previousConfig = this.COMMISSION_TIERS.get(previousTier);
    const newConfig = this.COMMISSION_TIERS.get(newTier);

    if (!previousConfig || !newConfig) return 0;

    // 5% bonus on earned commissions when upgrading tier
    const rateDifference = newConfig.baseCommissionRate - previousConfig.baseCommissionRate;
    const bonus = (totalCommissionEarned * rateDifference) / 100 * 0.05;

    return parseFloat(bonus.toFixed(2));
  }

  /**
   * Get commission breakdown by category
   */
  getCommissionBreakdown(
    baseAmount: number,
    tier: 'bronze' | 'silver' | 'gold' | 'platinum',
    totalReferrals: number,
    isTeamReferral: boolean = false
  ): Record<string, number> {
    const tierConfig = this.COMMISSION_TIERS.get(tier);
    if (!tierConfig) throw new Error(`Invalid tier: ${tier}`);

    const baseCommission = (baseAmount * tierConfig.baseCommissionRate) / 100;
    const milestones = Math.floor(totalReferrals / 10);
    const bonusCommission = (baseAmount * tierConfig.referralBonusRate * milestones) / 100;
    const teamCommission = isTeamReferral && tierConfig.teamCommissionRate
      ? (baseAmount * tierConfig.teamCommissionRate) / 100
      : 0;

    return {
      baseCommission: parseFloat(baseCommission.toFixed(2)),
      bonusCommission: parseFloat(bonusCommission.toFixed(2)),
      teamCommission: parseFloat(teamCommission.toFixed(2)),
      totalCommission: parseFloat((baseCommission + bonusCommission + teamCommission).toFixed(2)),
    };
  }
}

export const commissionCalculator = new CommissionCalculator();
