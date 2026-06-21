/**
 * Referral Tracker
 * Tracks referral sources and conversions
 */

import { query } from '@/lib/db';

export interface Referral {
  referralId: string;
  affiliateId: string;
  affiliateCode: string;
  referredUserId?: number;
  referredEmail: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  referralSource: 'direct_link' | 'email' | 'social' | 'website' | 'other';
  amount?: number;
  commission?: number;
  conversionDate?: Date;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  activeReferrals: number;
  expiredReferrals: number;
  cancelledReferrals: number;
  conversionRate: number;
  totalRevenueGenerated: number;
  topReferralSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
}

export interface ReferralSource {
  source: 'direct_link' | 'email' | 'social' | 'website' | 'other';
  label: string;
  description: string;
  conversionRateExpectation: number; // percentage
  recommendedUseCase: string;
}

export class ReferralTracker {
  private readonly REFERRAL_VALIDITY_DAYS = 90; // Referral link valid for 90 days

  private readonly REFERRAL_SOURCES: Map<string, ReferralSource> = new Map([
    [
      'direct_link',
      {
        source: 'direct_link',
        label: 'Direct Link',
        description: 'Unique referral link shared directly',
        conversionRateExpectation: 8,
        recommendedUseCase: 'Personal outreach, one-on-one recommendations',
      },
    ],
    [
      'email',
      {
        source: 'email',
        label: 'Email Campaign',
        description: 'Referral link shared via email',
        conversionRateExpectation: 5,
        recommendedUseCase: 'Newsletter, email marketing campaigns',
      },
    ],
    [
      'social',
      {
        source: 'social',
        label: 'Social Media',
        description: 'Shared on social media platforms',
        conversionRateExpectation: 3,
        recommendedUseCase: 'Twitter, LinkedIn, Facebook posts',
      },
    ],
    [
      'website',
      {
        source: 'website',
        label: 'Website Banner',
        description: 'Embedded on affiliate website',
        conversionRateExpectation: 4,
        recommendedUseCase: 'Blog posts, website sidebars',
      },
    ],
    [
      'other',
      {
        source: 'other',
        label: 'Other',
        description: 'Other referral sources',
        conversionRateExpectation: 2,
        recommendedUseCase: 'Any other referral channel',
      },
    ],
  ]);

  /**
   * Create a new referral tracking record
   */
  async createReferral(
    affiliateId: string,
    affiliateCode: string,
    referredEmail: string,
    source: 'direct_link' | 'email' | 'social' | 'website' | 'other' = 'direct_link'
  ): Promise<Referral> {
    const referralId = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.REFERRAL_VALIDITY_DAYS);

    try {
      await query(
        `INSERT INTO referrals (
          referral_id, affiliate_id, affiliate_code, referred_email, status,
          referral_source, expiry_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          referralId,
          affiliateId,
          affiliateCode,
          referredEmail,
          'pending',
          source,
          expiryDate,
          new Date(),
          new Date(),
        ]
      );

      return {
        referralId,
        affiliateId,
        affiliateCode,
        referredEmail,
        status: 'pending',
        referralSource: source,
        expiryDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create referral: ${error}`);
    }
  }

  /**
   * Convert referral to active (user signed up)
   */
  async convertReferral(
    referralId: string,
    referredUserId: number,
    amount?: number
  ): Promise<Referral> {
    try {
      const result = await query(
        `UPDATE referrals
         SET status = 'active', referred_user_id = $2, amount = $3,
             conversion_date = NOW(), updated_at = NOW()
         WHERE referral_id = $1
         RETURNING *`,
        [referralId, referredUserId, amount || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Referral not found');
      }

      return this.mapRowToReferral(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to convert referral: ${error}`);
    }
  }

  /**
   * Get referral by ID
   */
  async getReferral(referralId: string): Promise<Referral | null> {
    try {
      const result = await query(
        `SELECT * FROM referrals WHERE referral_id = $1`,
        [referralId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToReferral(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch referral: ${error}`);
    }
  }

  /**
   * Get referrals for affiliate
   */
  async getAffiliateReferrals(
    affiliateId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Referral[]> {
    try {
      let sql = `SELECT * FROM referrals WHERE affiliate_id = $1`;
      const params: any[] = [affiliateId];

      if (status) {
        sql += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);

      return result.rows.map((row: any) => this.mapRowToReferral(row));
    } catch (error) {
      throw new Error(`Failed to fetch referrals: ${error}`);
    }
  }

  /**
   * Get referral stats for affiliate
   */
  async getAffiliateReferralStats(affiliateId: string): Promise<ReferralStats> {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as total_revenue
         FROM referrals
         WHERE affiliate_id = $1`,
        [affiliateId]
      );

      const stats = result.rows[0];
      const total = parseInt(stats.total) || 0;
      const active = parseInt(stats.active) || 0;
      const conversionRate = total > 0 ? (active / total) * 100 : 0;

      // Get top referral sources
      const sourcesResult = await query(
        `SELECT referral_source, COUNT(*) as count
         FROM referrals
         WHERE affiliate_id = $1
         GROUP BY referral_source
         ORDER BY count DESC`,
        [affiliateId]
      );

      const topReferralSources = sourcesResult.rows.map((row: any) => ({
        source: row.referral_source,
        count: parseInt(row.count),
        percentage: total > 0 ? (parseInt(row.count) / total) * 100 : 0,
      }));

      return {
        totalReferrals: total,
        pendingReferrals: parseInt(stats.pending) || 0,
        activeReferrals: active,
        expiredReferrals: parseInt(stats.expired) || 0,
        cancelledReferrals: parseInt(stats.cancelled) || 0,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalRevenueGenerated: parseFloat(stats.total_revenue) || 0,
        topReferralSources,
      };
    } catch (error) {
      throw new Error(`Failed to get referral stats: ${error}`);
    }
  }

  /**
   * Track referral click
   */
  async trackReferralClick(affiliateCode: string, source?: string): Promise<string> {
    const trackingId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await query(
        `INSERT INTO referral_tracking (
          tracking_id, affiliate_code, referral_source, clicked_at
        ) VALUES ($1, $2, $3, $4)`,
        [trackingId, affiliateCode, source || 'unknown', new Date()]
      );

      return trackingId;
    } catch (error) {
      console.error('Failed to track referral click:', error);
      return trackingId; // Still return tracking ID even if logging fails
    }
  }

  /**
   * Get referral source details
   */
  getReferralSourceDetails(source: string): ReferralSource | null {
    return this.REFERRAL_SOURCES.get(source) || null;
  }

  /**
   * Get all referral sources
   */
  getAllReferralSources(): ReferralSource[] {
    return Array.from(this.REFERRAL_SOURCES.values());
  }

  /**
   * Expire old referrals
   */
  async expireOldReferrals(): Promise<number> {
    try {
      const result = await query(
        `UPDATE referrals
         SET status = 'expired', updated_at = NOW()
         WHERE status = 'pending'
         AND expiry_date < NOW()`,
        []
      );

      return result.rowCount || 0;
    } catch (error) {
      throw new Error(`Failed to expire old referrals: ${error}`);
    }
  }

  /**
   * Generate referral link
   */
  generateReferralLink(affiliateCode: string, source: string = 'direct_link'): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blockstop.io';
    return `${baseUrl}/signup?ref=${affiliateCode}&src=${source}`;
  }

  /**
   * Parse referral from URL
   */
  parseReferralFromUrl(url: string | null): { code: string; source: string } | null {
    if (!url) return null;

    const urlParams = new URLSearchParams(new URL(url).search);
    const code = urlParams.get('ref');
    const source = urlParams.get('src') || 'direct_link';

    if (!code) return null;

    return { code, source };
  }

  /**
   * Get referral performance by source
   */
  async getPerformanceBySource(
    affiliateId: string
  ): Promise<Array<{ source: string; conversions: number; conversionRate: number; revenue: number }>> {
    try {
      const result = await query(
        `SELECT
          referral_source,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as revenue
         FROM referrals
         WHERE affiliate_id = $1
         GROUP BY referral_source
         ORDER BY active DESC`,
        [affiliateId]
      );

      return result.rows.map((row: any) => ({
        source: row.referral_source,
        conversions: parseInt(row.active) || 0,
        conversionRate: parseInt(row.total) > 0 ? ((parseInt(row.active) || 0) / parseInt(row.total)) * 100 : 0,
        revenue: parseFloat(row.revenue) || 0,
      }));
    } catch (error) {
      throw new Error(`Failed to get performance by source: ${error}`);
    }
  }

  /**
   * Private helper to map database row to Referral
   */
  private mapRowToReferral(row: any): Referral {
    return {
      referralId: row.referral_id,
      affiliateId: row.affiliate_id,
      affiliateCode: row.affiliate_code,
      referredUserId: row.referred_user_id,
      referredEmail: row.referred_email,
      status: row.status,
      referralSource: row.referral_source,
      amount: row.amount,
      commission: row.commission,
      conversionDate: row.conversion_date ? new Date(row.conversion_date) : undefined,
      expiryDate: new Date(row.expiry_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const referralTracker = new ReferralTracker();
