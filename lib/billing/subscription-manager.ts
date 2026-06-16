import { query } from '@/lib/db';

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  billingPeriodEnd: Date;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionManager {
  async initializeFreePlan(userId: number): Promise<void> {
    // Get free plan ID
    const planResult = await query(
      "SELECT id FROM plans WHERE name = 'free'",
      []
    );

    if (planResult.rows.length === 0) {
      throw new Error('Free plan not found');
    }

    const freePlanId = planResult.rows[0].id;

    // Create free subscription (no renewal)
    await query(
      `INSERT INTO subscriptions (user_id, plan_id, status, billing_period_end)
       VALUES ($1, $2, 'active', NOW() + INTERVAL '100 years')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, freePlanId]
    );
  }

  async createSubscription(
    userId: number,
    _stripePaymentMethodId?: string
  ): Promise<Subscription> {
    // In real implementation, would create Stripe subscription
    // For now, return a mock subscription

    const result = await query(
      `INSERT INTO subscriptions (user_id, plan_id, status, billing_period_end, stripe_subscription_id)
       VALUES ($1, (SELECT id FROM plans WHERE name = 'pro'), 'active', NOW() + INTERVAL '1 month', $2)
       ON CONFLICT (user_id) DO UPDATE
       SET plan_id = (SELECT id FROM plans WHERE name = 'pro'), status = 'active', stripe_subscription_id = $2
       RETURNING id, user_id as "userId", plan_id as "planId", status, billing_period_end as "billingPeriodEnd",
                 stripe_subscription_id as "stripeSubscriptionId", created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, `stripe_sub_${Date.now()}`]
    );

    return result.rows[0];
  }

  async cancelSubscription(userId: number): Promise<void> {
    // In real implementation, would cancel Stripe subscription
    await query(
      `UPDATE subscriptions
       SET status = 'canceled'
       WHERE user_id = $1`,
      [userId]
    );

    // Downgrade user to free plan
    const freeResult = await query(
      "SELECT id FROM plans WHERE name = 'free'",
      []
    );

    if (freeResult.rows.length > 0) {
      await query(
        'UPDATE users SET plan_id = $1 WHERE id = $2',
        [freeResult.rows[0].id, userId]
      );
    }
  }

  async getUserSubscription(userId: number): Promise<Subscription | null> {
    const result = await query(
      `SELECT id, user_id as "userId", plan_id as "planId", status,
              billing_period_end as "billingPeriodEnd",
              stripe_subscription_id as "stripeSubscriptionId",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async checkSubscriptionStatus(userId: number): Promise<{
    isActive: boolean;
    plan: string;
    renewalDate?: Date;
    daysUntilRenewal?: number;
  }> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return {
        isActive: false,
        plan: 'none',
      };
    }

    const isActive = subscription.status === 'active';
    const now = new Date();
    const daysUntilRenewal = subscription.billingPeriodEnd
      ? Math.ceil(
          (subscription.billingPeriodEnd.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : undefined;

    // Get plan name
    const planResult = await query(
      'SELECT name FROM plans WHERE id = $1',
      [subscription.planId]
    );

    const planName = planResult.rows[0]?.name || 'unknown';

    return {
      isActive,
      plan: planName,
      renewalDate: subscription.billingPeriodEnd,
      daysUntilRenewal,
    };
  }

  async handleStripeWebhook(event: unknown): Promise<void> {
    // In real implementation, would process Stripe webhooks
    // For now, just log the event
    console.log('Stripe webhook received:', event);
  }

  async upgradeUserPlan(userId: number, newPlanName: string): Promise<void> {
    const planResult = await query(
      'SELECT id FROM plans WHERE name = $1',
      [newPlanName]
    );

    if (planResult.rows.length === 0) {
      throw new Error('Plan not found');
    }

    await query(
      'UPDATE users SET plan_id = $1 WHERE id = $2',
      [planResult.rows[0].id, userId]
    );
  }

  async getUserUsage(userId: number): Promise<{
    scansThisMonth: number;
    storageUsed: number;
    teamMembersCount?: number;
  }> {
    // Get email scans count
    const emailScans = await query(
      `SELECT COUNT(*) as count FROM email_scans
       WHERE user_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`,
      [userId]
    );

    // Get file scans count
    const fileScans = await query(
      `SELECT COUNT(*) as count FROM file_scans
       WHERE user_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`,
      [userId]
    );

    // Get team members count if in team
    const teamMembers = await query(
      `SELECT COUNT(*) as count FROM team_members
       WHERE user_id = $1`,
      [userId]
    );

    return {
      scansThisMonth: (emailScans.rows[0]?.count || 0) + (fileScans.rows[0]?.count || 0),
      storageUsed: 0, // Would calculate from file sizes
      teamMembersCount: teamMembers.rows[0]?.count || 0,
    };
  }
}

export const subscriptionManager = new SubscriptionManager();
