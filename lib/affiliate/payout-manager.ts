/**
 * Payout Manager
 * Handles affiliate payouts and payment processing
 */

import { query } from '@/lib/db';

export interface Payout {
  payoutId: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';
  paymentReference?: string;
  scheduleDate: Date;
  processedDate?: Date;
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutSchedule {
  scheduleId: string;
  affiliateId: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  nextPayoutDate: Date;
  isActive: boolean;
  minimumThreshold: number;
}

export interface PayoutSummary {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  nextPayoutDate?: Date;
  lastPayoutDate?: Date;
  averagePayoutAmount: number;
  totalPayoutsThisYear: number;
}

export class PayoutManager {
  private readonly PAYOUT_FREQUENCY = {
    weekly: 7,
    'bi-weekly': 14,
    monthly: 30,
  };

  /**
   * Request payout
   */
  async requestPayout(
    affiliateId: string,
    amount: number,
    paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto'
  ): Promise<Payout> {
    const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get affiliate info
      const affiliateResult = await query(
        `SELECT total_commission_earned, total_commission_paid FROM affiliates WHERE affiliate_id = $1`,
        [affiliateId]
      );

      if (affiliateResult.rows.length === 0) {
        throw new Error('Affiliate not found');
      }

      const affiliate = affiliateResult.rows[0];
      const pendingCommission = affiliate.total_commission_earned - affiliate.total_commission_paid;

      if (amount > pendingCommission) {
        throw new Error('Requested amount exceeds pending commission');
      }

      const scheduleDate = new Date();

      await query(
        `INSERT INTO payouts (
          payout_id, affiliate_id, amount, currency, status, payment_method,
          schedule_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          payoutId,
          affiliateId,
          amount,
          'USD',
          'pending',
          paymentMethod,
          scheduleDate,
          new Date(),
          new Date(),
        ]
      );

      return {
        payoutId,
        affiliateId,
        amount,
        currency: 'USD',
        status: 'pending',
        paymentMethod,
        scheduleDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to request payout: ${error}`);
    }
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string): Promise<Payout | null> {
    try {
      const result = await query(
        `SELECT * FROM payouts WHERE payout_id = $1`,
        [payoutId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToPayout(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch payout: ${error}`);
    }
  }

  /**
   * Get payouts for affiliate
   */
  async getAffiliatePayouts(
    affiliateId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Payout[]> {
    try {
      let sql = `SELECT * FROM payouts WHERE affiliate_id = $1`;
      const params: any[] = [affiliateId];

      if (status) {
        sql += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);

      return result.rows.map((row: any) => this.mapRowToPayout(row));
    } catch (error) {
      throw new Error(`Failed to fetch payouts: ${error}`);
    }
  }

  /**
   * Get payout summary for affiliate
   */
  async getPayoutSummary(affiliateId: string): Promise<PayoutSummary> {
    try {
      const result = await query(
        `SELECT
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN amount ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as payout_count,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_amount,
          MAX(CASE WHEN status = 'completed' THEN processed_date ELSE NULL END) as last_payout,
          MIN(CASE WHEN status = 'pending' THEN schedule_date ELSE NULL END) as next_payout
         FROM payouts
         WHERE affiliate_id = $1
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
        [affiliateId]
      );

      const summary = result.rows[0];

      return {
        totalPending: parseFloat(summary.pending) || 0,
        totalProcessing: parseFloat(summary.processing) || 0,
        totalCompleted: parseFloat(summary.completed) || 0,
        nextPayoutDate: summary.next_payout ? new Date(summary.next_payout) : undefined,
        lastPayoutDate: summary.last_payout ? new Date(summary.last_payout) : undefined,
        averagePayoutAmount: parseFloat(summary.avg_amount) || 0,
        totalPayoutsThisYear: parseInt(summary.payout_count) || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get payout summary: ${error}`);
    }
  }

  /**
   * Process pending payouts (admin/scheduled task)
   */
  async processPendingPayouts(): Promise<string[]> {
    try {
      const result = await query(
        `SELECT payout_id FROM payouts
         WHERE status = 'pending'
         AND schedule_date <= NOW()
         ORDER BY schedule_date ASC`,
        []
      );

      const payoutIds: string[] = [];

      for (const row of result.rows) {
        await this.updatePayoutStatus(row.payout_id, 'processing');
        payoutIds.push(row.payout_id);
      }

      return payoutIds;
    } catch (error) {
      throw new Error(`Failed to process pending payouts: ${error}`);
    }
  }

  /**
   * Complete payout
   */
  async completePayout(
    payoutId: string,
    paymentReference?: string
  ): Promise<Payout> {
    try {
      const payout = await this.getPayout(payoutId);
      if (!payout) throw new Error('Payout not found');

      const result = await query(
        `UPDATE payouts
         SET status = 'completed', payment_reference = $2, processed_date = NOW(),
             updated_at = NOW()
         WHERE payout_id = $1
         RETURNING *`,
        [payoutId, paymentReference || null]
      );

      // Update affiliate total paid
      await query(
        `UPDATE affiliates
         SET total_commission_paid = total_commission_paid + $2
         WHERE affiliate_id = $1`,
        [payout.affiliateId, payout.amount]
      );

      return this.mapRowToPayout(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to complete payout: ${error}`);
    }
  }

  /**
   * Fail payout
   */
  async failPayout(payoutId: string, reason: string): Promise<Payout> {
    try {
      const result = await query(
        `UPDATE payouts
         SET status = 'failed', failure_reason = $2, updated_at = NOW()
         WHERE payout_id = $1
         RETURNING *`,
        [payoutId, reason]
      );

      if (result.rows.length === 0) {
        throw new Error('Payout not found');
      }

      return this.mapRowToPayout(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fail payout: ${error}`);
    }
  }

  /**
   * Cancel payout
   */
  async cancelPayout(payoutId: string, reason?: string): Promise<Payout> {
    try {
      const result = await query(
        `UPDATE payouts
         SET status = 'cancelled', failure_reason = $2, updated_at = NOW()
         WHERE payout_id = $1
         AND status IN ('pending', 'processing')
         RETURNING *`,
        [payoutId, reason || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Payout not found or cannot be cancelled');
      }

      return this.mapRowToPayout(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to cancel payout: ${error}`);
    }
  }

  /**
   * Create or update payout schedule
   */
  async setPayoutSchedule(
    affiliateId: string,
    frequency: 'weekly' | 'bi-weekly' | 'monthly',
    minimumThreshold: number = 50
  ): Promise<PayoutSchedule> {
    const scheduleId = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check if schedule exists
      const existingResult = await query(
        `SELECT schedule_id FROM payout_schedules WHERE affiliate_id = $1`,
        [affiliateId]
      );

      if (existingResult.rows.length > 0) {
        // Update existing
        const result = await query(
          `UPDATE payout_schedules
           SET frequency = $2, minimum_threshold = $3, is_active = true
           WHERE affiliate_id = $1
           RETURNING *`,
          [affiliateId, frequency, minimumThreshold]
        );

        return this.mapRowToPayoutSchedule(result.rows[0]);
      }

      // Create new
      const nextPayoutDate = this.calculateNextPayoutDate(frequency);

      await query(
        `INSERT INTO payout_schedules (
          schedule_id, affiliate_id, frequency, next_payout_date,
          is_active, minimum_threshold
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          scheduleId,
          affiliateId,
          frequency,
          nextPayoutDate,
          true,
          minimumThreshold,
        ]
      );

      return {
        scheduleId,
        affiliateId,
        frequency,
        nextPayoutDate,
        isActive: true,
        minimumThreshold,
      };
    } catch (error) {
      throw new Error(`Failed to set payout schedule: ${error}`);
    }
  }

  /**
   * Get payout schedule
   */
  async getPayoutSchedule(affiliateId: string): Promise<PayoutSchedule | null> {
    try {
      const result = await query(
        `SELECT * FROM payout_schedules WHERE affiliate_id = $1`,
        [affiliateId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToPayoutSchedule(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch payout schedule: ${error}`);
    }
  }

  /**
   * Update payout status
   */
  private async updatePayoutStatus(payoutId: string, status: string): Promise<void> {
    await query(
      `UPDATE payouts SET status = $2, updated_at = NOW() WHERE payout_id = $1`,
      [payoutId, status]
    );
  }

  /**
   * Calculate next payout date based on frequency
   */
  private calculateNextPayoutDate(frequency: 'weekly' | 'bi-weekly' | 'monthly'): Date {
    const days = this.PAYOUT_FREQUENCY[frequency] || 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  /**
   * Private helper to map database row to Payout
   */
  private mapRowToPayout(row: any): Payout {
    return {
      payoutId: row.payout_id,
      affiliateId: row.affiliate_id,
      amount: parseFloat(row.amount) || 0,
      currency: row.currency || 'USD',
      status: row.status,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      scheduleDate: new Date(row.schedule_date),
      processedDate: row.processed_date ? new Date(row.processed_date) : undefined,
      failureReason: row.failure_reason,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Private helper to map database row to PayoutSchedule
   */
  private mapRowToPayoutSchedule(row: any): PayoutSchedule {
    return {
      scheduleId: row.schedule_id,
      affiliateId: row.affiliate_id,
      frequency: row.frequency,
      nextPayoutDate: new Date(row.next_payout_date),
      isActive: row.is_active,
      minimumThreshold: parseFloat(row.minimum_threshold) || 0,
    };
  }
}

export const payoutManager = new PayoutManager();
