/**
 * Affiliate Manager
 * Manages affiliate relationships and registrations
 */

import { query } from '@/lib/db';

export interface Affiliate {
  affiliateId: string;
  userId: number;
  affiliateCode: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinDate: Date;
  websiteUrl?: string;
  bankAccountDetails?: {
    accountHolder: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';
  paymentEmail?: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateStats {
  affiliateId: string;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  averageOrderValue: number;
  lastReferralDate?: Date;
  thisMonthReferrals: number;
  thisMonthCommission: number;
}

export class AffiliateManager {
  /**
   * Register new affiliate
   */
  async registerAffiliate(
    userId: number,
    email: string,
    firstName: string,
    lastName: string,
    paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto',
    websiteUrl?: string,
    companyName?: string
  ): Promise<Affiliate> {
    const affiliateId = `aff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const affiliateCode = this.generateAffiliateCode();

    try {
      await query(
        `INSERT INTO affiliates (
          affiliate_id, user_id, affiliate_code, email, first_name, last_name,
          company_name, status, tier, join_date, website_url, payment_method,
          payment_email, total_referrals, active_referrals, total_commission_earned,
          total_commission_paid, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          affiliateId,
          userId,
          affiliateCode,
          email,
          firstName,
          lastName,
          companyName || null,
          'pending',
          'bronze',
          new Date(),
          websiteUrl || null,
          paymentMethod,
          email,
          0,
          0,
          0,
          0,
          new Date(),
          new Date(),
        ]
      );

      return {
        affiliateId,
        userId,
        affiliateCode,
        email,
        firstName,
        lastName,
        companyName,
        status: 'pending',
        tier: 'bronze',
        joinDate: new Date(),
        websiteUrl,
        paymentMethod,
        paymentEmail: email,
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to register affiliate: ${error}`);
    }
  }

  /**
   * Get affiliate by ID
   */
  async getAffiliate(affiliateId: string): Promise<Affiliate | null> {
    try {
      const result = await query(
        `SELECT * FROM affiliates WHERE affiliate_id = $1`,
        [affiliateId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToAffiliate(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch affiliate: ${error}`);
    }
  }

  /**
   * Get affiliate by code
   */
  async getAffiliateByCode(affiliateCode: string): Promise<Affiliate | null> {
    try {
      const result = await query(
        `SELECT * FROM affiliates WHERE affiliate_code = $1`,
        [affiliateCode]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToAffiliate(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch affiliate: ${error}`);
    }
  }

  /**
   * Get affiliate by user ID
   */
  async getAffiliateByUserId(userId: number): Promise<Affiliate | null> {
    try {
      const result = await query(
        `SELECT * FROM affiliates WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToAffiliate(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch affiliate: ${error}`);
    }
  }

  /**
   * Approve affiliate application
   */
  async approveAffiliate(affiliateId: string): Promise<Affiliate> {
    try {
      const result = await query(
        `UPDATE affiliates
         SET status = 'active', tier = 'bronze', updated_at = NOW()
         WHERE affiliate_id = $1
         RETURNING *`,
        [affiliateId]
      );

      if (result.rows.length === 0) {
        throw new Error('Affiliate not found');
      }

      return this.mapRowToAffiliate(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to approve affiliate: ${error}`);
    }
  }

  /**
   * Suspend affiliate
   */
  async suspendAffiliate(affiliateId: string, reason?: string): Promise<Affiliate> {
    try {
      const result = await query(
        `UPDATE affiliates
         SET status = 'suspended', notes = $2, updated_at = NOW()
         WHERE affiliate_id = $1
         RETURNING *`,
        [affiliateId, reason || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Affiliate not found');
      }

      return this.mapRowToAffiliate(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to suspend affiliate: ${error}`);
    }
  }

  /**
   * Update affiliate tier based on performance
   */
  async updateAffiliateTier(affiliateId: string): Promise<Affiliate> {
    try {
      const affiliate = await this.getAffiliate(affiliateId);
      if (!affiliate) throw new Error('Affiliate not found');

      let newTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';

      // Tier based on total referrals
      if (affiliate.totalReferrals >= 100) newTier = 'silver';
      if (affiliate.totalReferrals >= 300) newTier = 'gold';
      if (affiliate.totalReferrals >= 1000) newTier = 'platinum';

      const result = await query(
        `UPDATE affiliates
         SET tier = $2, updated_at = NOW()
         WHERE affiliate_id = $1
         RETURNING *`,
        [affiliateId, newTier]
      );

      return this.mapRowToAffiliate(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update affiliate tier: ${error}`);
    }
  }

  /**
   * Get affiliate statistics
   */
  async getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
    try {
      const affiliate = await this.getAffiliate(affiliateId);
      if (!affiliate) throw new Error('Affiliate not found');

      const thisMonthResult = await query(
        `SELECT COUNT(*) as referral_count, COALESCE(SUM(commission_amount), 0) as commission_sum
         FROM referrals
         WHERE affiliate_id = $1
         AND created_at >= DATE_TRUNC('month', NOW())
         AND status = 'active'`,
        [affiliateId]
      );

      const thisMonthReferrals = parseInt(thisMonthResult.rows[0].referral_count) || 0;
      const thisMonthCommission = parseFloat(thisMonthResult.rows[0].commission_sum) || 0;

      return {
        affiliateId,
        totalReferrals: affiliate.totalReferrals,
        activeReferrals: affiliate.activeReferrals,
        conversionRate: affiliate.totalReferrals > 0 ? (affiliate.activeReferrals / affiliate.totalReferrals) * 100 : 0,
        totalCommissionEarned: affiliate.totalCommissionEarned,
        totalCommissionPaid: affiliate.totalCommissionPaid,
        pendingCommission: affiliate.totalCommissionEarned - affiliate.totalCommissionPaid,
        averageOrderValue: affiliate.activeReferrals > 0 ? affiliate.totalCommissionEarned / affiliate.activeReferrals : 0,
        thisMonthReferrals,
        thisMonthCommission,
      };
    } catch (error) {
      throw new Error(`Failed to get affiliate stats: ${error}`);
    }
  }

  /**
   * Get all affiliates (admin)
   */
  async getAllAffiliates(limit: number = 100, offset: number = 0): Promise<Affiliate[]> {
    try {
      const result = await query(
        `SELECT * FROM affiliates ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows.map((row: any) => this.mapRowToAffiliate(row));
    } catch (error) {
      throw new Error(`Failed to fetch affiliates: ${error}`);
    }
  }

  /**
   * Search affiliates
   */
  async searchAffiliates(searchTerm: string): Promise<Affiliate[]> {
    try {
      const result = await query(
        `SELECT * FROM affiliates
         WHERE email ILIKE $1
         OR first_name ILIKE $1
         OR last_name ILIKE $1
         OR company_name ILIKE $1
         OR affiliate_code ILIKE $1
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`]
      );

      return result.rows.map((row: any) => this.mapRowToAffiliate(row));
    } catch (error) {
      throw new Error(`Failed to search affiliates: ${error}`);
    }
  }

  /**
   * Get affiliates by status
   */
  async getAffiliatesByStatus(status: string): Promise<Affiliate[]> {
    try {
      const result = await query(
        `SELECT * FROM affiliates WHERE status = $1 ORDER BY created_at DESC`,
        [status]
      );

      return result.rows.map((row: any) => this.mapRowToAffiliate(row));
    } catch (error) {
      throw new Error(`Failed to fetch affiliates: ${error}`);
    }
  }

  /**
   * Private helper to map database row to Affiliate
   */
  private mapRowToAffiliate(row: any): Affiliate {
    return {
      affiliateId: row.affiliate_id,
      userId: row.user_id,
      affiliateCode: row.affiliate_code,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      status: row.status,
      tier: row.tier,
      joinDate: new Date(row.join_date),
      websiteUrl: row.website_url,
      bankAccountDetails: row.bank_account_details,
      paymentMethod: row.payment_method,
      paymentEmail: row.payment_email,
      totalReferrals: row.total_referrals,
      activeReferrals: row.active_referrals,
      totalCommissionEarned: parseFloat(row.total_commission_earned) || 0,
      totalCommissionPaid: parseFloat(row.total_commission_paid) || 0,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Generate unique affiliate code
   */
  private generateAffiliateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const affiliateManager = new AffiliateManager();
