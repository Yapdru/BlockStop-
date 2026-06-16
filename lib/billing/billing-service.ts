import { query } from '@/lib/db';
import { BillingInfo, Invoice, Plan } from '@/types/billing';

export class BillingService {
  /**
   * Get user's current billing information
   */
  async getUserBillingInfo(userId: number): Promise<BillingInfo> {
    const result = await query(
      `SELECT
        u.id, u.plan_id as "planId", p.name,
        s.status,
        s.billing_period_end as "billingPeriodEnd",
        CASE
          WHEN s.billing_period_end > NOW() THEN s.billing_period_end
          ELSE NOW()
        END as "nextBillingDate",
        p.price_monthly as "amount"
       FROM users u
       LEFT JOIN plans p ON u.plan_id = p.id
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const row = result.rows[0];
    const billingPeriodStart = new Date();
    billingPeriodStart.setMonth(billingPeriodStart.getMonth() - 1);

    return {
      currentPlan: row.name || 'free',
      planId: row.planId || 1,
      status: row.status || 'active',
      billingPeriodStart,
      billingPeriodEnd: row.billingPeriodEnd || new Date(),
      nextBillingDate: row.nextBillingDate || new Date(),
      amount: row.amount || 0,
      currency: 'USD',
    };
  }

  /**
   * Get paginated invoices for a user
   */
  async getInvoices(userId: number, limit: number = 20, offset: number = 0): Promise<Invoice[]> {
    const result = await query(
      `SELECT
        id, user_id as "userId", subscription_id as "subscriptionId",
        amount, currency, status, invoice_date as "invoiceDate",
        due_date as "dueDate", pdf_url as "pdfUrl", description,
        created_at as "createdAt"
       FROM invoices
       WHERE user_id = $1
       ORDER BY invoice_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      subscriptionId: row.subscriptionId,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      pdfUrl: row.pdfUrl,
      description: row.description,
      createdAt: row.createdAt,
    }));
  }

  /**
   * Get a specific invoice
   */
  async getInvoiceById(invoiceId: number): Promise<Invoice | null> {
    const result = await query(
      `SELECT
        id, user_id as "userId", subscription_id as "subscriptionId",
        amount, currency, status, invoice_date as "invoiceDate",
        due_date as "dueDate", pdf_url as "pdfUrl", description,
        created_at as "createdAt"
       FROM invoices WHERE id = $1`,
      [invoiceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      subscriptionId: row.subscriptionId,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      pdfUrl: row.pdfUrl,
      description: row.description,
      createdAt: row.createdAt,
    };
  }

  /**
   * Upgrade user's subscription
   */
  async upgradeSubscription(userId: number, newPlanId: number): Promise<boolean> {
    // Verify plan exists
    const planCheck = await query(
      `SELECT id FROM plans WHERE id = $1`,
      [newPlanId]
    );

    if (planCheck.rows.length === 0) {
      throw new Error('Plan not found');
    }

    // Update user's plan
    await query(
      `UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [newPlanId, userId]
    );

    // Create upgrade log/invoice if needed
    await query(
      `INSERT INTO invoices (user_id, amount, currency, status, invoice_date)
       SELECT $1, p.price_monthly, 'USD', 'paid', NOW()
       FROM plans p WHERE p.id = $2`,
      [userId, newPlanId]
    );

    return true;
  }

  /**
   * Downgrade user's subscription
   */
  async downgradeSubscription(userId: number, newPlanId: number): Promise<boolean> {
    // Verify plan exists
    const planCheck = await query(
      `SELECT id FROM plans WHERE id = $1`,
      [newPlanId]
    );

    if (planCheck.rows.length === 0) {
      throw new Error('Plan not found');
    }

    // Get current plan
    const currentPlan = await query(
      `SELECT plan_id FROM users WHERE id = $1`,
      [userId]
    );

    if (currentPlan.rows.length === 0) {
      throw new Error('User not found');
    }

    // Update user's plan
    await query(
      `UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [newPlanId, userId]
    );

    return true;
  }

  /**
   * Cancel user's subscription
   */
  async cancelSubscription(userId: number): Promise<boolean> {
    // Update to free plan
    const freePlan = await query(
      `SELECT id FROM plans WHERE name = 'free'`,
      []
    );

    if (freePlan.rows.length === 0) {
      throw new Error('Free plan not found');
    }

    await query(
      `UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [freePlan.rows[0].id, userId]
    );

    // Create cancellation record
    await query(
      `INSERT INTO cancellations (user_id, cancelled_at, reason)
       VALUES ($1, NOW(), 'User requested cancellation')`,
      [userId]
    );

    return true;
  }

  /**
   * Get available plans
   */
  async getAvailablePlans(): Promise<Plan[]> {
    const result = await query(
      `SELECT id, name, description, price_monthly as "priceMonthly", max_users as "maxUsers"
       FROM plans
       ORDER BY price_monthly ASC`,
      []
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      priceMonthly: parseFloat(row.priceMonthly),
      features: [], // Would be populated from separate features table in production
      maxUsers: row.maxUsers,
    }));
  }

  /**
   * Create invoice from subscription
   */
  async createInvoice(
    userId: number,
    subscriptionId: number,
    amount: number,
    description: string
  ): Promise<Invoice> {
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const result = await query(
      `INSERT INTO invoices (user_id, subscription_id, amount, currency, status, invoice_date, due_date, description)
       VALUES ($1, $2, $3, 'USD', 'pending', $4, $5, $6)
       RETURNING id, user_id as "userId", subscription_id as "subscriptionId",
                 amount, currency, status, invoice_date as "invoiceDate",
                 due_date as "dueDate", description, created_at as "createdAt"`,
      [userId, subscriptionId, amount, invoiceDate, dueDate, description]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      subscriptionId: row.subscriptionId,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      description: row.description,
      createdAt: row.createdAt,
    };
  }
}

export const billingService = new BillingService();
