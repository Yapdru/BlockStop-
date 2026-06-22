/**
 * Revenue Sharing System
 * Manage partner payouts, affiliate commissions, plugin revenue splits, and licensing fees
 * Comprehensive financial tracking and distribution
 */

import { query } from '@/lib/db';
import crypto from 'crypto';

// ===== Revenue Sharing Types =====

export interface RevenueShare {
  id: string;
  type: 'plugin' | 'affiliate' | 'white-label' | 'reseller';
  partnerId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  grossRevenue: number; // Total revenue before splits
  blockstopCut: number; // 30% for platform
  partnerCut: number; // 70% for partner
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginRevenue {
  id: string;
  pluginId: string;
  authorId: string;
  pluginName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalInstalls: number;
    newInstalls: number;
    activeInstalls: number;
    uninstalls: number;
  };
  revenueBreakdown: {
    subscriptionRevenue: number; // From plugin subscriptions
    premiumFeatures: number; // Premium feature purchases
    donations: number;
    sponsorships: number;
    total: number;
  };
  splits: {
    blockstopCut: number; // 30%
    authorPayout: number; // 70%
  };
  currency: string;
  payoutStatus: 'pending' | 'scheduled' | 'processed' | 'failed';
  payoutDate?: Date;
  payoutMethod?: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';
  transactionId?: string;
}

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  referralId: string; // User/organization referred
  commissionType: 'signup' | 'subscription' | 'upgrade' | 'lifetime';
  baseAmount: number; // Amount that commission is based on
  commissionRate: number; // Percentage (e.g., 20)
  commissionAmount: number; // Actual commission earned
  status: 'pending' | 'earned' | 'paid' | 'disputed' | 'reversed';
  conversionDate: Date;
  payoutDate?: Date;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelPayout {
  id: string;
  partnerId: string;
  licenseType: string; // starter, professional, enterprise
  licensesActive: number;
  licensesExpiring: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  revenueBreakdown: {
    licensingFees: number;
    supportRevenue: number;
    customizationFees: number;
    total: number;
  };
  partnerCut: number; // Variable based on tier
  blockstopCut: number;
  currency: string;
  payoutStatus: 'pending' | 'scheduled' | 'processed' | 'failed';
  payoutDate?: Date;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string; // Encrypted
    routingNumber?: string;
    swiftCode?: string;
    iban?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ResellerPayout {
  id: string;
  resellerId: string;
  resaleName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metricsTracking: {
    customersReferred: number;
    newCustomers: number;
    mrr: number; // Monthly recurring revenue
    arr: number; // Annual recurring revenue
  };
  revenueBreakdown: {
    newCustomerRevenue: number;
    renewalRevenue: number;
    upsellRevenue: number;
    supportRevenue: number;
    total: number;
  };
  commissionStructure: {
    newCustomerRate: number; // %, e.g., 25%
    renewalRate: number; // %, e.g., 10%
    upsellRate: number; // %, e.g., 15%
  };
  payoutAmount: number;
  blockstopRetention: number;
  currency: string;
  payoutStatus: 'pending' | 'scheduled' | 'processed' | 'failed';
  payoutDate?: Date;
  payoutMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutRecord {
  id: string;
  type: 'plugin' | 'affiliate' | 'white-label' | 'reseller';
  recipientId: string;
  recipientName: string;
  amount: number;
  currency: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  payoutMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' | 'check';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  transactionId?: string;
  reference?: string;
  bankDetails?: any;
  taxes?: {
    grossAmount: number;
    taxAmount: number;
    taxRate: number;
    netAmount: number;
  };
  fees?: {
    processingFee: number;
    currencyConversionFee: number;
    totalFees: number;
  };
  notes?: string;
  initiatedAt: Date;
  processedAt?: Date;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialReport {
  id: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalGrossRevenue: number;
  totalPayouts: number;
  blockstopRetention: number;
  revenueByType: {
    plugin: number;
    affiliate: number;
    whiteLabelLicensing: number;
    reseller: number;
    subscriptions: number;
  };
  payoutsByType: {
    plugin: number;
    affiliate: number;
    whiteLabelLicensing: number;
    reseller: number;
  };
  topPerformers: Array<{
    partnerId: string;
    partnerName: string;
    type: string;
    earnings: number;
  }>;
  metrics: {
    totalPartners: number;
    totalPayouts: number;
    averagePayoutSize: number;
    taxesPaid: number;
    feesCollected: number;
  };
  currency: string;
  status: 'draft' | 'pending_review' | 'approved' | 'finalized';
  createdAt: Date;
  updatedAt: Date;
}

// ===== Revenue Share Service =====

export class RevenueShareService {
  private readonly PLUGIN_REVENUE_SHARE = {
    blockstop: 0.30,
    author: 0.70
  };

  private readonly AFFILIATE_COMMISSION = {
    signup: 0.25, // $50 per signup
    subscription: 0.20, // 20% of subscription
    upgrade: 0.15, // 15% of upgrade amount
    lifetime: 0.30 // 30% for life
  };

  private readonly WHITE_LABEL_SPLITS = {
    starter: { partner: 0.60, blockstop: 0.40 },
    professional: { partner: 0.65, blockstop: 0.35 },
    enterprise: { partner: 0.70, blockstop: 0.30 },
    custom: { partner: 0.75, blockstop: 0.25 }
  };

  private readonly RESELLER_SPLITS = {
    newCustomer: 0.25,
    renewal: 0.10,
    upsell: 0.15
  };

  // ===== Plugin Revenue =====

  /**
   * Record plugin revenue
   */
  async recordPluginRevenue(
    pluginId: string,
    authorId: string,
    pluginName: string,
    grossRevenue: number,
    period: { startDate: Date; endDate: Date },
    currency: string = 'USD'
  ): Promise<PluginRevenue> {
    try {
      const revenueId = this.generateRevenueId();
      const blockstopCut = grossRevenue * this.PLUGIN_REVENUE_SHARE.blockstop;
      const authorCut = grossRevenue * this.PLUGIN_REVENUE_SHARE.author;

      const result = await query(
        `INSERT INTO plugin_revenue (
          id, plugin_id, author_id, plugin_name, period_start_date,
          period_end_date, revenue_breakdown, splits, currency,
          payout_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          revenueId,
          pluginId,
          authorId,
          pluginName,
          period.startDate,
          period.endDate,
          JSON.stringify({
            subscriptionRevenue: grossRevenue * 0.6,
            premiumFeatures: grossRevenue * 0.3,
            donations: grossRevenue * 0.1,
            total: grossRevenue
          }),
          JSON.stringify({
            blockstopCut,
            authorPayout: authorCut
          }),
          currency,
          'pending'
        ]
      );

      return this.mapToPluginRevenue(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to record plugin revenue: ${error}`);
    }
  }

  /**
   * Calculate plugin author earnings
   */
  async calculatePluginEarnings(
    authorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEarnings: number;
    byPlugin: Array<{ pluginId: string; earnings: number }>;
    pendingPayout: number;
    paidOut: number;
  }> {
    try {
      const result = await query(
        `SELECT plugin_id, SUM(CAST(splits->>'authorPayout' AS FLOAT)) as earnings
         FROM plugin_revenue
         WHERE author_id = $1 AND period_end_date >= $2 AND period_end_date <= $3
         GROUP BY plugin_id`,
        [authorId, startDate, endDate]
      );

      const byPlugin = result.rows.map(row => ({
        pluginId: row.plugin_id,
        earnings: parseFloat(row.earnings || 0)
      }));

      const totalEarnings = byPlugin.reduce((sum, item) => sum + item.earnings, 0);

      // Get pending and paid amounts
      const payoutResult = await query(
        `SELECT payout_status, SUM(CAST(splits->>'authorPayout' AS FLOAT)) as amount
         FROM plugin_revenue
         WHERE author_id = $1 AND period_end_date >= $2 AND period_end_date <= $3
         GROUP BY payout_status`,
        [authorId, startDate, endDate]
      );

      let pendingPayout = 0;
      let paidOut = 0;

      for (const row of payoutResult.rows) {
        const amount = parseFloat(row.amount || 0);
        if (row.payout_status === 'pending' || row.payout_status === 'scheduled') {
          pendingPayout += amount;
        } else if (row.payout_status === 'processed') {
          paidOut += amount;
        }
      }

      return {
        totalEarnings,
        byPlugin,
        pendingPayout,
        paidOut
      };
    } catch (error) {
      throw new Error(`Failed to calculate plugin earnings: ${error}`);
    }
  }

  // ===== Affiliate Commissions =====

  /**
   * Record affiliate commission
   */
  async recordAffiliateCommission(
    affiliateId: string,
    referralId: string,
    commissionType: 'signup' | 'subscription' | 'upgrade' | 'lifetime',
    baseAmount: number,
    currency: string = 'USD'
  ): Promise<AffiliateCommission> {
    try {
      const commissionId = this.generateCommissionId();
      const commissionRate = this.AFFILIATE_COMMISSION[commissionType];
      const commissionAmount = baseAmount * commissionRate;

      const result = await query(
        `INSERT INTO affiliate_commissions (
          id, affiliate_id, referral_id, commission_type, base_amount,
          commission_rate, commission_amount, status, conversion_date,
          currency, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), NOW())
        RETURNING *`,
        [
          commissionId,
          affiliateId,
          referralId,
          commissionType,
          baseAmount,
          commissionRate * 100, // Store as percentage
          commissionAmount,
          'pending',
          currency
        ]
      );

      return this.mapToAffiliateCommission(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to record affiliate commission: ${error}`);
    }
  }

  /**
   * Get affiliate earnings
   */
  async getAffiliateEarnings(
    affiliateId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarnings: number;
    pending: number;
    paid: number;
    byType: Record<string, number>;
  }> {
    try {
      let sql = `
        SELECT status, commission_type, SUM(commission_amount) as amount
        FROM affiliate_commissions
        WHERE affiliate_id = $1
      `;
      const params: any[] = [affiliateId];

      if (startDate && endDate) {
        sql += ` AND conversion_date >= $2 AND conversion_date <= $3`;
        params.push(startDate, endDate);
      }

      sql += ` GROUP BY status, commission_type`;

      const result = await query(sql, params);

      let totalEarnings = 0;
      let pending = 0;
      let paid = 0;
      const byType: Record<string, number> = {};

      for (const row of result.rows) {
        const amount = parseFloat(row.amount || 0);
        totalEarnings += amount;

        if (row.status === 'pending' || row.status === 'earned') {
          pending += amount;
        } else if (row.status === 'paid') {
          paid += amount;
        }

        byType[row.commission_type] = (byType[row.commission_type] || 0) + amount;
      }

      return { totalEarnings, pending, paid, byType };
    } catch (error) {
      throw new Error(`Failed to fetch affiliate earnings: ${error}`);
    }
  }

  // ===== White-Label Licensing =====

  /**
   * Calculate white-label payout
   */
  async calculateWhiteLabelPayout(
    partnerId: string,
    licenseType: 'starter' | 'professional' | 'enterprise' | 'custom',
    period: { startDate: Date; endDate: Date }
  ): Promise<WhiteLabelPayout> {
    try {
      // Get licensing revenue for period
      const licenseResult = await query(
        `SELECT COUNT(*) as active_licenses,
                SUM(CASE WHEN expires_at <= $3 THEN 1 ELSE 0 END) as expiring_licenses,
                SUM(CAST(amount AS FLOAT)) as total_revenue
         FROM white_label_licenses
         WHERE partner_id = $1 AND tier = $2
         AND created_at >= $4 AND created_at <= $5`,
        [partnerId, licenseType, period.endDate, period.startDate, period.endDate]
      );

      const licensesActive = parseInt(licenseResult.rows[0].active_licenses || 0);
      const licensesExpiring = parseInt(licenseResult.rows[0].expiring_licenses || 0);
      const totalRevenue = parseFloat(licenseResult.rows[0].total_revenue || 0);

      const splits = this.WHITE_LABEL_SPLITS[licenseType];
      const partnerCut = totalRevenue * splits.partner;
      const blockstopCut = totalRevenue * splits.blockstop;

      const payoutId = this.generatePayoutId();

      const result = await query(
        `INSERT INTO white_label_payouts (
          id, partner_id, license_type, licenses_active, licenses_expiring,
          period_start_date, period_end_date, revenue_breakdown,
          partner_cut, blockstop_cut, currency, payout_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          payoutId,
          partnerId,
          licenseType,
          licensesActive,
          licensesExpiring,
          period.startDate,
          period.endDate,
          JSON.stringify({
            licensingFees: totalRevenue * 0.7,
            supportRevenue: totalRevenue * 0.2,
            customizationFees: totalRevenue * 0.1,
            total: totalRevenue
          }),
          partnerCut,
          blockstopCut,
          'USD',
          'pending'
        ]
      );

      return this.mapToWhiteLabelPayout(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to calculate white-label payout: ${error}`);
    }
  }

  // ===== Reseller Payouts =====

  /**
   * Calculate reseller payout
   */
  async calculateResellerPayout(
    resellerId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<ResellerPayout> {
    try {
      // Get reseller metrics
      const metricsResult = await query(
        `SELECT
          COUNT(DISTINCT customer_id) as customers_referred,
          COUNT(DISTINCT CASE WHEN created_at >= $2 THEN customer_id END) as new_customers,
          SUM(CAST(subscription_value AS FLOAT)) as mrr,
          SUM(CAST(subscription_value AS FLOAT)) * 12 as arr
         FROM reseller_sales
         WHERE reseller_id = $1 AND created_at >= $2 AND created_at <= $3`,
        [resellerId, period.startDate, period.endDate]
      );

      const metrics = {
        customersReferred: parseInt(metricsResult.rows[0].customers_referred || 0),
        newCustomers: parseInt(metricsResult.rows[0].new_customers || 0),
        mrr: parseFloat(metricsResult.rows[0].mrr || 0),
        arr: parseFloat(metricsResult.rows[0].arr || 0)
      };

      // Calculate commission
      const newCustomerRevenue = metrics.mrr * this.RESELLER_SPLITS.newCustomer;
      const renewalRevenue = metrics.mrr * this.RESELLER_SPLITS.renewal;
      const upsellRevenue = metrics.mrr * this.RESELLER_SPLITS.upsell;
      const supportRevenue = metrics.mrr * 0.05;
      const totalRevenue = newCustomerRevenue + renewalRevenue + upsellRevenue + supportRevenue;

      const payoutId = this.generatePayoutId();

      const result = await query(
        `INSERT INTO reseller_payouts (
          id, reseller_id, period_start_date, period_end_date,
          metrics_tracking, revenue_breakdown, commission_structure,
          payout_amount, blockstop_retention, currency, payout_status,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          payoutId,
          resellerId,
          period.startDate,
          period.endDate,
          JSON.stringify(metrics),
          JSON.stringify({
            newCustomerRevenue,
            renewalRevenue,
            upsellRevenue,
            supportRevenue,
            total: totalRevenue
          }),
          JSON.stringify(this.RESELLER_SPLITS),
          totalRevenue,
          metrics.mrr - totalRevenue,
          'USD',
          'pending'
        ]
      );

      return this.mapToResellerPayout(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to calculate reseller payout: ${error}`);
    }
  }

  // ===== Payout Processing =====

  /**
   * Schedule payout for processing
   */
  async schedulePayout(
    type: 'plugin' | 'affiliate' | 'white-label' | 'reseller',
    recipientId: string,
    amount: number,
    method: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' = 'bank_transfer',
    currency: string = 'USD',
    scheduledDate?: Date
  ): Promise<PayoutRecord> {
    try {
      const payoutId = this.generatePayoutId();

      // Get recipient name
      let recipientName = '';
      if (type === 'plugin') {
        const result = await query(
          `SELECT name FROM users WHERE id = (
            SELECT author_id FROM plugins WHERE id = $1
          )`,
          [recipientId]
        );
        recipientName = result.rows[0]?.name || 'Unknown';
      } else if (type === 'affiliate') {
        const result = await query(`SELECT name FROM users WHERE id = $1`, [recipientId]);
        recipientName = result.rows[0]?.name || 'Unknown';
      } else if (type === 'white-label') {
        const result = await query(
          `SELECT company_name FROM white_label_partners WHERE id = $1`,
          [recipientId]
        );
        recipientName = result.rows[0]?.company_name || 'Unknown';
      }

      const result = await query(
        `INSERT INTO payouts (
          id, type, recipient_id, recipient_name, amount, currency,
          payout_method, status, initiated_at, scheduled_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), NOW())
        RETURNING *`,
        [
          payoutId,
          type,
          recipientId,
          recipientName,
          amount,
          currency,
          method,
          'pending',
          scheduledDate || new Date()
        ]
      );

      return this.mapToPayoutRecord(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to schedule payout: ${error}`);
    }
  }

  /**
   * Process pending payouts
   */
  async processPendingPayouts(limit: number = 100): Promise<PayoutRecord[]> {
    try {
      const payouts = await query(
        `SELECT * FROM payouts WHERE status = 'pending'
         ORDER BY scheduled_date ASC LIMIT $1`,
        [limit]
      );

      const processed: PayoutRecord[] = [];

      for (const payout of payouts.rows) {
        try {
          // Process payout (integrate with payment provider)
          const transactionId = await this.executePayment(
            payout.id,
            payout.amount,
            payout.currency,
            payout.payout_method
          );

          await query(
            `UPDATE payouts SET status = $1, transaction_id = $2, processed_at = NOW(),
             estimated_delivery = $3, updated_at = NOW()
             WHERE id = $4`,
            [
              'processing',
              transactionId,
              new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              payout.id
            ]
          );

          processed.push(this.mapToPayoutRecord(payout));
        } catch (error) {
          // Log error and continue
          await query(
            `UPDATE payouts SET status = $1, updated_at = NOW() WHERE id = $2`,
            ['failed', payout.id]
          );
        }
      }

      return processed;
    } catch (error) {
      throw new Error(`Failed to process payouts: ${error}`);
    }
  }

  /**
   * Complete payout
   */
  async completePayout(payoutId: string): Promise<PayoutRecord> {
    try {
      const result = await query(
        `UPDATE payouts SET status = $1, processed_at = NOW(), updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        ['completed', payoutId]
      );

      return this.mapToPayoutRecord(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to complete payout: ${error}`);
    }
  }

  /**
   * Dispute payout
   */
  async disputePayout(
    payoutId: string,
    reason: string,
    evidence?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE payouts SET status = $1, notes = $2, updated_at = NOW()
         WHERE id = $3`,
        ['disputed', reason + (evidence ? ` [Evidence: ${evidence}]` : ''), payoutId]
      );

      // Notify support team
      await query(
        `INSERT INTO support_tickets (type, category, subject, description, priority, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'payout_dispute',
          'payment',
          `Payout Dispute: ${payoutId}`,
          `Reason: ${reason}\nEvidence: ${evidence || 'None provided'}`,
          'high'
        ]
      );
    } catch (error) {
      throw new Error(`Failed to dispute payout: ${error}`);
    }
  }

  // ===== Financial Reporting =====

  /**
   * Generate financial report
   */
  async generateFinancialReport(
    period: { startDate: Date; endDate: Date }
  ): Promise<FinancialReport> {
    try {
      const reportId = this.generateReportId();

      // Calculate metrics
      const pluginResult = await query(
        `SELECT SUM(CAST(splits->>'blockstopCut' AS FLOAT)) as blockstop_cut,
                SUM(CAST(splits->>'authorPayout' AS FLOAT)) as author_payout
         FROM plugin_revenue
         WHERE period_end_date >= $1 AND period_end_date <= $2`,
        [period.startDate, period.endDate]
      );

      const affiliateResult = await query(
        `SELECT SUM(commission_amount) as total_commissions
         FROM affiliate_commissions
         WHERE conversion_date >= $1 AND conversion_date <= $2`,
        [period.startDate, period.endDate]
      );

      const payoutResult = await query(
        `SELECT type, SUM(amount) as total FROM payouts
         WHERE status = 'completed' AND processed_at >= $1 AND processed_at <= $2
         GROUP BY type`,
        [period.startDate, period.endDate]
      );

      const pluginRevenue = parseFloat(pluginResult.rows[0]?.blockstop_cut || 0);
      const pluginPayouts = parseFloat(pluginResult.rows[0]?.author_payout || 0);
      const affiliateRevenue = parseFloat(affiliateResult.rows[0]?.total_commissions || 0);

      const payoutsByType: Record<string, number> = {};
      for (const row of payoutResult.rows) {
        payoutsByType[row.type] = parseFloat(row.total || 0);
      }

      const totalGrossRevenue = pluginRevenue + affiliateRevenue;
      const totalPayouts = Object.values(payoutsByType).reduce((a, b) => a + b, 0);

      const result = await query(
        `INSERT INTO financial_reports (
          id, period_start_date, period_end_date, total_gross_revenue,
          total_payouts, blockstop_retention, revenue_by_type, payouts_by_type,
          metrics, currency, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [
          reportId,
          period.startDate,
          period.endDate,
          totalGrossRevenue,
          totalPayouts,
          totalGrossRevenue - totalPayouts,
          JSON.stringify({
            plugin: pluginRevenue,
            affiliate: affiliateRevenue,
            whiteLabelLicensing: 0,
            reseller: 0,
            subscriptions: 0
          }),
          JSON.stringify(payoutsByType),
          JSON.stringify({
            totalPartners: 0,
            totalPayouts: Object.keys(payoutsByType).length,
            averagePayoutSize: totalPayouts / Object.keys(payoutsByType).length,
            taxesPaid: 0,
            feesCollected: 0
          }),
          'USD',
          'draft'
        ]
      );

      return this.mapToFinancialReport(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to generate financial report: ${error}`);
    }
  }

  /**
   * Get revenue summary for partner
   */
  async getRevenueSummary(partnerId: string): Promise<{
    totalEarnings: number;
    bySource: Record<string, number>;
    pending: number;
    paid: number;
    lastPayoutDate?: Date;
  }> {
    try {
      // Plugin revenue
      const pluginResult = await query(
        `SELECT SUM(CAST(splits->>'authorPayout' AS FLOAT)) as total
         FROM plugin_revenue WHERE author_id = $1`,
        [partnerId]
      );

      // Affiliate commissions
      const affiliateResult = await query(
        `SELECT SUM(commission_amount) as total
         FROM affiliate_commissions WHERE affiliate_id = $1`,
        [partnerId]
      );

      // White-label payouts
      const whiteLabelResult = await query(
        `SELECT SUM(partner_cut) as total FROM white_label_payouts
         WHERE partner_id = $1`,
        [partnerId]
      );

      // Get pending and paid
      const statusResult = await query(
        `SELECT
          CASE WHEN type = 'plugin' THEN 'plugin'
               WHEN type = 'affiliate' THEN 'affiliate'
               WHEN type = 'white-label' THEN 'whiteLabelLicensing'
               ELSE type END as source,
          status, SUM(amount) as amount
         FROM payouts WHERE recipient_id = $1 GROUP BY source, status`,
        [partnerId]
      );

      const bySource: Record<string, number> = {
        plugin: parseFloat(pluginResult.rows[0]?.total || 0),
        affiliate: parseFloat(affiliateResult.rows[0]?.total || 0),
        whiteLabelLicensing: parseFloat(whiteLabelResult.rows[0]?.total || 0)
      };

      let pending = 0;
      let paid = 0;
      for (const row of statusResult.rows) {
        const amount = parseFloat(row.amount || 0);
        if (row.status === 'pending' || row.status === 'processing') {
          pending += amount;
        } else if (row.status === 'completed') {
          paid += amount;
        }
      }

      const totalEarnings = Object.values(bySource).reduce((a, b) => a + b, 0);

      const lastPayoutResult = await query(
        `SELECT MAX(processed_at) as last_payout FROM payouts
         WHERE recipient_id = $1 AND status = 'completed'`,
        [partnerId]
      );

      return {
        totalEarnings,
        bySource,
        pending,
        paid,
        lastPayoutDate: lastPayoutResult.rows[0]?.last_payout
          ? new Date(lastPayoutResult.rows[0].last_payout)
          : undefined
      };
    } catch (error) {
      throw new Error(`Failed to get revenue summary: ${error}`);
    }
  }

  // ===== Helper Methods =====

  private generateRevenueId(): string {
    return `rev_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateCommissionId(): string {
    return `comm_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generatePayoutId(): string {
    return `payout_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateReportId(): string {
    return `report_${crypto.randomBytes(8).toString('hex')}`;
  }

  private async executePayment(
    payoutId: string,
    amount: number,
    currency: string,
    method: string
  ): Promise<string> {
    // Placeholder for payment processor integration
    // In production, this would integrate with Stripe, PayPal, etc.
    return `txn_${crypto.randomBytes(16).toString('hex')}`;
  }

  // Mapping methods
  private mapToPluginRevenue(row: any): PluginRevenue {
    const splits = JSON.parse(row.splits || '{}');
    return {
      id: row.id,
      pluginId: row.plugin_id,
      authorId: row.author_id,
      pluginName: row.plugin_name,
      period: {
        startDate: new Date(row.period_start_date),
        endDate: new Date(row.period_end_date)
      },
      metrics: {
        totalInstalls: parseInt(row.total_installs || 0),
        newInstalls: parseInt(row.new_installs || 0),
        activeInstalls: parseInt(row.active_installs || 0),
        uninstalls: parseInt(row.uninstalls || 0)
      },
      revenueBreakdown: JSON.parse(row.revenue_breakdown || '{}'),
      splits: {
        blockstopCut: splits.blockstopCut || 0,
        authorPayout: splits.authorPayout || 0
      },
      currency: row.currency,
      payoutStatus: row.payout_status,
      payoutDate: row.payout_date ? new Date(row.payout_date) : undefined,
      payoutMethod: row.payout_method,
      transactionId: row.transaction_id
    };
  }

  private mapToAffiliateCommission(row: any): AffiliateCommission {
    return {
      id: row.id,
      affiliateId: row.affiliate_id,
      referralId: row.referral_id,
      commissionType: row.commission_type,
      baseAmount: parseFloat(row.base_amount),
      commissionRate: parseFloat(row.commission_rate) / 100,
      commissionAmount: parseFloat(row.commission_amount),
      status: row.status,
      conversionDate: new Date(row.conversion_date),
      payoutDate: row.payout_date ? new Date(row.payout_date) : undefined,
      currency: row.currency,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToWhiteLabelPayout(row: any): WhiteLabelPayout {
    return {
      id: row.id,
      partnerId: row.partner_id,
      licenseType: row.license_type,
      licensesActive: parseInt(row.licenses_active || 0),
      licensesExpiring: parseInt(row.licenses_expiring || 0),
      period: {
        startDate: new Date(row.period_start_date),
        endDate: new Date(row.period_end_date)
      },
      revenueBreakdown: JSON.parse(row.revenue_breakdown || '{}'),
      partnerCut: parseFloat(row.partner_cut),
      blockstopCut: parseFloat(row.blockstop_cut),
      currency: row.currency,
      payoutStatus: row.payout_status,
      payoutDate: row.payout_date ? new Date(row.payout_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToResellerPayout(row: any): ResellerPayout {
    return {
      id: row.id,
      resellerId: row.reseller_id,
      resaleName: row.resale_name,
      period: {
        startDate: new Date(row.period_start_date),
        endDate: new Date(row.period_end_date)
      },
      metricsTracking: JSON.parse(row.metrics_tracking || '{}'),
      revenueBreakdown: JSON.parse(row.revenue_breakdown || '{}'),
      commissionStructure: JSON.parse(row.commission_structure || '{}'),
      payoutAmount: parseFloat(row.payout_amount),
      blockstopRetention: parseFloat(row.blockstop_retention),
      currency: row.currency,
      payoutStatus: row.payout_status,
      payoutDate: row.payout_date ? new Date(row.payout_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToPayoutRecord(row: any): PayoutRecord {
    return {
      id: row.id,
      type: row.type,
      recipientId: row.recipient_id,
      recipientName: row.recipient_name,
      amount: parseFloat(row.amount),
      currency: row.currency,
      period: {
        startDate: new Date(row.period_start_date),
        endDate: new Date(row.period_end_date)
      },
      payoutMethod: row.payout_method,
      status: row.status,
      transactionId: row.transaction_id,
      reference: row.reference,
      notes: row.notes,
      initiatedAt: new Date(row.initiated_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapToFinancialReport(row: any): FinancialReport {
    return {
      id: row.id,
      period: {
        startDate: new Date(row.period_start_date),
        endDate: new Date(row.period_end_date)
      },
      totalGrossRevenue: parseFloat(row.total_gross_revenue),
      totalPayouts: parseFloat(row.total_payouts),
      blockstopRetention: parseFloat(row.blockstop_retention),
      revenueByType: JSON.parse(row.revenue_by_type || '{}'),
      payoutsByType: JSON.parse(row.payouts_by_type || '{}'),
      topPerformers: [],
      metrics: JSON.parse(row.metrics || '{}'),
      currency: row.currency,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const revenueShareService = new RevenueShareService();
