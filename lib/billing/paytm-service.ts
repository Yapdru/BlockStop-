import { getDb } from '@/lib/db';
import crypto from 'crypto';

export interface PayTMOrder {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'initiated' | 'pending' | 'success' | 'failed';
  paytmTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class PayTMBillingService {
  private merchantId = process.env.PAYTM_MERCHANT_ID || 'BLOCKSTOP_MERCHANT';
  private merchantKey = process.env.PAYTM_MERCHANT_KEY || 'test_key';
  private paytmUrl = 'https://securegw.paytm.in/order/initiate';
  private callbackUrl = process.env.PAYTM_CALLBACK_URL || 'https://blockstop.app/api/billing/paytm/callback';

  async initializeOrder(
    userId: string,
    amount: number,
    planType: 'pro_monthly' | 'pro_annual' = 'pro_monthly'
  ): Promise<{ orderId: string; paytmUrl: string; checksum: string }> {
    const db = getDb();
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store order in database
    await db.query(
      `INSERT INTO paytm_orders (id, user_id, plan_type, amount, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [orderId, userId, planType, amount, 'initiated']
    );

    // Generate checksum
    const checksum = this.generateChecksum(orderId, amount);

    // Build PayTM URL with parameters
    const params = new URLSearchParams({
      MID: this.merchantId,
      ORDER_ID: orderId,
      CUST_ID: userId,
      TXN_AMOUNT: amount.toString(),
      CURRENCY: 'INR',
      CALLBACK_URL: this.callbackUrl,
      CHECKSUM: checksum
    });

    const paytmUrl = `${this.paytmUrl}?${params.toString()}`;

    return {
      orderId,
      paytmUrl,
      checksum
    };
  }

  async verifyPayment(
    orderId: string,
    paytmTransactionId: string,
    checksum: string
  ): Promise<boolean> {
    const db = getDb();

    // Verify checksum
    const isValid = this.verifyChecksum(orderId, paytmTransactionId, checksum);

    if (!isValid) {
      console.error(`Invalid checksum for order ${orderId}`);
      return false;
    }

    // Get order details
    const result = await db.query(
      `SELECT * FROM paytm_orders WHERE id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      console.error(`Order not found: ${orderId}`);
      return false;
    }

    const order = result.rows[0];

    // Update order status
    await db.query(
      `UPDATE paytm_orders SET status = 'success', paytm_transaction_id = $1, completed_at = NOW() WHERE id = $2`,
      [paytmTransactionId, orderId]
    );

    // Upgrade user to PRO tier
    await this.upgradeToPro(order.user_id, order.plan_type);

    return true;
  }

  private async upgradeToPro(userId: string, planType: string): Promise<void> {
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
       ON CONFLICT (user_id) DO UPDATE SET plan_id = $3, current_period_end = $5, updated_at = NOW()`,
      [subscriptionId, userId, proPlanId, 'active', currentPeriodEnd]
    );
  }

  async getOrderStatus(orderId: string): Promise<PayTMOrder | null> {
    const db = getDb();
    const result = await db.query(
      `SELECT * FROM paytm_orders WHERE id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      orderId: row.id,
      userId: row.user_id,
      amount: row.amount,
      currency: 'INR',
      status: row.status,
      paytmTransactionId: row.paytm_transaction_id,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }

  private generateChecksum(orderId: string, amount: number): string {
    const data = `${this.merchantId}|${orderId}|${amount}|INR|${this.merchantKey}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private verifyChecksum(orderId: string, txnId: string, checksum: string): boolean {
    const data = `${this.merchantId}|${orderId}|${txnId}|${this.merchantKey}`;
    const expectedChecksum = crypto.createHash('sha256').update(data).digest('hex');
    return checksum === expectedChecksum;
  }
}

export const createPayTMService = (): PayTMBillingService => {
  return new PayTMBillingService();
};
