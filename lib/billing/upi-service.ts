import { getDb } from '@/lib/db';
import QRCode from 'qrcode';
import crypto from 'crypto';

export interface UPITransaction {
  transactionId: string;
  userId: string;
  upiId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired';
  planType: 'pro_monthly' | 'pro_annual';
  qrCode?: string;
  deepLink?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class UPIBillingService {
  private merchantUPI = process.env.MERCHANT_UPI_ID || 'blockstop@upi';
  private merchantName = 'BlockStop Security';

  async generateUPITransaction(
    userId: string,
    planType: 'pro_monthly' | 'pro_annual' = 'pro_monthly'
  ): Promise<{ transactionId: string; qrCode: string; deepLink: string; upiId: string; amount: number }> {
    const db = getDb();
    const transactionId = `UPI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine amount
    const amounts = {
      pro_monthly: 99,
      pro_annual: 999
    };

    const amount = amounts[planType];

    // Generate UPI string
    const upiString = this.generateUPIString(transactionId, amount, planType);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(upiString);

    // Generate deep link for app-based UPI
    const deepLink = this.generateDeepLink(upiString);

    // Store transaction
    await db.query(
      `INSERT INTO upi_transactions (id, user_id, upi_id, amount, plan_type, status, qr_code, deep_link, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [transactionId, userId, this.merchantUPI, amount, planType, 'pending', qrCode, deepLink]
    );

    return {
      transactionId,
      qrCode,
      deepLink,
      upiId: this.merchantUPI,
      amount
    };
  }

  async verifyUPIPayment(transactionId: string, referenceId?: string): Promise<boolean> {
    const db = getDb();

    // Get transaction
    const result = await db.query(
      `SELECT * FROM upi_transactions WHERE id = $1`,
      [transactionId]
    );

    if (result.rows.length === 0) {
      console.error(`UPI transaction not found: ${transactionId}`);
      return false;
    }

    const transaction = result.rows[0];

    // In production, verify with UPI gateway/bank
    // For now, simulate successful payment after marking as complete

    // Update transaction status
    await db.query(
      `UPDATE upi_transactions SET status = 'success', reference_id = $1, completed_at = NOW() WHERE id = $2`,
      [referenceId || `REF_${Date.now()}`, transactionId]
    );

    // Upgrade user to PRO
    await this.upgradeUserToPro(transaction.user_id, transaction.plan_type);

    return true;
  }

  async markTransactionFailed(transactionId: string): Promise<void> {
    const db = getDb();

    await db.query(
      `UPDATE upi_transactions SET status = 'failed', completed_at = NOW() WHERE id = $1`,
      [transactionId]
    );
  }

  async getTransactionStatus(transactionId: string): Promise<UPITransaction | null> {
    const db = getDb();

    const result = await db.query(
      `SELECT * FROM upi_transactions WHERE id = $1`,
      [transactionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      transactionId: row.id,
      userId: row.user_id,
      upiId: row.upi_id,
      amount: row.amount,
      status: row.status,
      planType: row.plan_type,
      qrCode: row.qr_code,
      deepLink: row.deep_link,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }

  private generateUPIString(transactionId: string, amount: number, planType: string): string {
    // UPI string format: upi://pay?pa=upiid&pn=name&tn=desc&tr=ref&am=amount&cu=INR
    const params = new URLSearchParams({
      pa: this.merchantUPI,
      pn: this.merchantName.replace(/\s/g, '%20'),
      tn: `BlockStop ${planType === 'pro_annual' ? 'Annual' : 'Monthly'} Subscription`,
      tr: transactionId,
      am: amount.toString(),
      cu: 'INR'
    });

    return `upi://pay?${params.toString()}`;
  }

  private generateDeepLink(upiString: string): string {
    // Deep link for UPI apps (Google Pay, PhonePe, Paytm, etc.)
    return `intent://${upiString}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end`;
  }

  private async upgradeUserToPro(userId: string, planType: string): Promise<void> {
    const db = getDb();

    // Get PRO plan
    const planResult = await db.query(
      `SELECT id FROM plans WHERE name = 'pro'`
    );

    if (planResult.rows.length === 0) {
      throw new Error('PRO plan not found');
    }

    const proPlanId = planResult.rows[0].id;

    // Update user plan
    await db.query(
      `UPDATE users_neo SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [proPlanId, userId]
    );

    // Create subscription
    const subscriptionId = `sub_${Date.now()}`;
    const currentPeriodEnd = new Date();

    if (planType === 'pro_annual') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    await db.query(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         plan_id = $3,
         status = 'active',
         current_period_end = $5,
         updated_at = NOW()`,
      [subscriptionId, userId, proPlanId, 'active', currentPeriodEnd]
    );
  }
}

export const createUPIService = (): UPIBillingService => {
  return new UPIBillingService();
};
