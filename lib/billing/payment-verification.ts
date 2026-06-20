import { jwtVerify, SignJWT } from 'jose';
import crypto from 'crypto';
import { pool } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'blockstop-secret-key-change-in-production'
);

// Hash token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface PaymentToken {
  userId: string;
  email: string;
  tier: 'free' | 'neo' | 'pro' | 'office' | 'health' | 'max';
  subscriptionId: string;
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  expiresAt: number;
  issuedAt: number;
}

export class PaymentVerificationService {
  /**
   * SOLVE THE INTEGRATION PROBLEM:
   * How does BlockStop know if someone paid?
   * 
   * Answer: Stripe webhook → DB record → JWT token issued to user
   * User sends token with every request → API validates token
   */

  /**
   * 1. When user pays in app (Upgrade page):
   *    - User submits payment (Stripe)
   *    - Stripe webhook fires
   *    - This function creates subscription in DB
   *    - JWT token issued to user
   */
  static async createPaymentToken(paymentData: {
    userId: string;
    email: string;
    stripeSubscriptionId: string;
    tier: 'free' | 'neo' | 'pro' | 'office' | 'health' | 'max';
    billingCycleEndsAt: number;
  }): Promise<string> {
    const expiresAt = paymentData.billingCycleEndsAt;

    const payload: PaymentToken = {
      userId: paymentData.userId,
      email: paymentData.email,
      tier: paymentData.tier,
      subscriptionId: paymentData.stripeSubscriptionId,
      subscriptionStatus: 'active',
      expiresAt,
      issuedAt: Date.now(),
    };

    // Sign JWT token (expires at billing cycle end)
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(expiresAt / 1000))
      .sign(JWT_SECRET);

    // CRITICAL: Store in DB for verification
    await this.storePaymentRecord({
      userId: paymentData.userId,
      email: paymentData.email,
      stripeSubscriptionId: paymentData.stripeSubscriptionId,
      tier: paymentData.tier,
      status: 'active',
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return token;
  }

  /**
   * 2. When user makes API request (email scan, file scan, etc):
   *    - Extension/app sends token in Authorization header
   *    - API validates token signature
   *    - Check expiration
   *    - Check subscription status in DB
   *    - Grant or deny access
   */
  static async verifyPaymentToken(token: string): Promise<PaymentToken | null> {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      const payload = verified.payload as PaymentToken;

      // 1. Check token signature (done by jwtVerify)
      // 2. Check expiration
      if (payload.expiresAt < Date.now()) {
        return null; // Token expired
      }

      // 3. Check subscription status in DB
      const subscription = await this.getSubscriptionFromDB(
        payload.userId,
        payload.subscriptionId
      );

      if (!subscription || subscription.status !== 'active') {
        return null; // Subscription inactive
      }

      // 4. Verify token hasn't been revoked
      if (!await this.isTokenValid(token)) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * 3. When Stripe webhook fires (payment received):
   *    - Handle webhook from Stripe
   *    - Create/update subscription in DB
   *    - Issue JWT token to user
   */
  static async handleStripeWebhook(stripeEvent: any): Promise<void> {
    const signature = stripeEvent.headers['stripe-signature'];

    // Verify webhook signature (critical for security)
    if (!this.verifyStripeSignature(stripeEvent.body, signature)) {
      throw new Error('Invalid Stripe signature');
    }

    const event = JSON.parse(stripeEvent.body);

    // Handle different Stripe events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  /**
   * Stripe webhook: Subscription created or updated
   */
  private static async handleSubscriptionCreated(subscription: any) {
    const tier = this.mapStripePriceToTier(subscription.items.data[0].price.id);
    const billingCycleEndsAt = subscription.current_period_end * 1000;

    // Get user from Stripe metadata
    const userId = subscription.metadata.userId;
    const email = subscription.metadata.email;

    // Create payment token
    const token = await this.createPaymentToken({
      userId,
      email,
      stripeSubscriptionId: subscription.id,
      tier,
      billingCycleEndsAt,
    });

    // Return token to user (via webhook response or store for later retrieval)
    console.log(`✅ Payment verified for ${email} - Tier: ${tier}`);
  }

  /**
   * Stripe webhook: Subscription cancelled
   */
  private static async handleSubscriptionCancelled(subscription: any) {
    const userId = subscription.metadata.userId;

    // Update DB: Mark subscription as cancelled
    await this.updateSubscriptionStatus(
      userId,
      subscription.id,
      'cancelled'
    );

    console.log(`❌ Subscription cancelled for user ${userId}`);
  }

  /**
   * Stripe webhook: Payment succeeded
   */
  private static async handlePaymentSucceeded(invoice: any) {
    const subscription = await this.getStripeSubscription(invoice.subscription);

    if (subscription) {
      await this.handleSubscriptionCreated(subscription);
    }
  }

  /**
   * Stripe webhook: Payment failed
   */
  private static async handlePaymentFailed(invoice: any) {
    const userId = invoice.customer_metadata.userId;

    // Update DB: Mark subscription as past_due
    await this.updateSubscriptionStatus(
      userId,
      invoice.subscription,
      'past_due'
    );

    console.log(`⚠️ Payment failed for user ${userId}`);
  }

  /**
   * Helper: Map Stripe price ID to BlockStop tier
   */
  private static mapStripePriceToTier(
    priceId: string
  ): 'free' | 'neo' | 'pro' | 'office' | 'health' | 'max' {
    const tierMap: Record<string, any> = {
      'price_stripe_neo': 'neo',
      'price_stripe_pro': 'pro',
      'price_stripe_office': 'office',
      'price_stripe_health': 'health',
      'price_stripe_max': 'max',
    };

    return tierMap[priceId] || 'free';
  }

  /**
   * Helper: Verify Stripe webhook signature (critical security)
   */
  private static verifyStripeSignature(body: string, signature: string): boolean {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');

    const hash = crypto
      .createHmac('sha256', stripeSecret)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  // Database operations (PostgreSQL implementation)

  /**
   * Store payment record and create subscription in DB
   */
  private static async storePaymentRecord(record: any): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if subscription already exists
      const existingSubscription = await client.query(
        'SELECT id FROM billing.subscriptions WHERE stripe_subscription_id = $1',
        [record.stripeSubscriptionId]
      );

      if (existingSubscription.rows.length === 0) {
        // Create new subscription
        await client.query(
          `INSERT INTO billing.subscriptions
           (user_id, stripe_subscription_id, stripe_customer_id, tier, status, current_period_start, current_period_end)
           VALUES ($1, $2, $3, $4, $5, NOW(), TO_TIMESTAMP($6/1000))`,
          [record.userId, record.stripeSubscriptionId, 'cust_default', record.tier, record.status, record.expiresAt]
        );
      }

      // Create payment record
      await client.query(
        `INSERT INTO billing.payment_records
         (user_id, subscription_id, stripe_invoice_id, status, jwt_token, token_issued_at, token_expires_at, description)
         VALUES ($1, (SELECT id FROM billing.subscriptions WHERE stripe_subscription_id = $2),
                 $3, $4, $5, NOW(), TO_TIMESTAMP($6/1000), $7)`,
        [record.userId, record.stripeSubscriptionId, record.stripeSubscriptionId, record.status, record.token, record.expiresAt, 'Payment verification token']
      );

      // Log subscription change
      await client.query(
        `INSERT INTO billing.subscription_audit_log
         (subscription_id, user_id, action, new_status, new_tier, ip_address)
         VALUES ((SELECT id FROM billing.subscriptions WHERE stripe_subscription_id = $1), $2, $3, $4, $5, $6)`,
        [record.stripeSubscriptionId, record.userId, 'created', record.status, record.tier, '0.0.0.0']
      );

      await client.query('COMMIT');
      console.log(`✅ Payment record stored for user ${record.userId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to store payment record:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get subscription status from DB
   */
  private static async getSubscriptionFromDB(
    userId: string,
    subscriptionId: string
  ): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT * FROM billing.subscriptions
         WHERE user_id = $1 AND stripe_subscription_id = $2`,
        [userId, subscriptionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const subscription = result.rows[0];
      return {
        id: subscription.id,
        userId: subscription.user_id,
        subscriptionId: subscription.stripe_subscription_id,
        tier: subscription.tier,
        status: subscription.status,
        expiresAt: new Date(subscription.current_period_end).getTime(),
      };
    } catch (error) {
      console.error('Failed to get subscription from DB:', error);
      return null;
    }
  }

  /**
   * Update subscription status in DB
   */
  private static async updateSubscriptionStatus(
    userId: string,
    subscriptionId: string,
    status: string
  ): Promise<void> {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update subscription
        const result = await client.query(
          `UPDATE billing.subscriptions
           SET status = $1, updated_at = NOW()
           WHERE user_id = $2 AND stripe_subscription_id = $3
           RETURNING id, status`,
          [status, userId, subscriptionId]
        );

        if (result.rows.length > 0) {
          const subscription = result.rows[0];

          // Log the change
          await client.query(
            `INSERT INTO billing.subscription_audit_log
             (subscription_id, user_id, action, new_status)
             VALUES ($1, $2, $3, $4)`,
            [subscription.id, userId, 'status_update', status]
          );

          // If cancelling, set cancelled_at
          if (status === 'cancelled') {
            await client.query(
              `UPDATE billing.subscriptions SET cancelled_at = NOW() WHERE id = $1`,
              [subscription.id]
            );
          }
        }

        await client.query('COMMIT');
        console.log(`✅ Updated subscription ${subscriptionId} to ${status}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to update subscription status:', error);
      throw error;
    }
  }

  /**
   * Check if token is valid (not revoked)
   */
  private static async isTokenValid(token: string): Promise<boolean> {
    try {
      const tokenHash = hashToken(token);
      const result = await pool.query(
        'SELECT id FROM billing.revoked_tokens WHERE token_hash = $1 LIMIT 1',
        [tokenHash]
      );

      return result.rows.length === 0; // Token is valid if NOT in revoked list
    } catch (error) {
      console.error('Failed to check token validity:', error);
      return false;
    }
  }

  /**
   * Fetch subscription details from Stripe API
   */
  private static async getStripeSubscription(id: string): Promise<any> {
    try {
      const stripeApiKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeApiKey) {
        throw new Error('STRIPE_SECRET_KEY not set');
      }

      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Stripe subscription:', error);
      return null;
    }
  }
}

/**
 * MIDDLEWARE: Verify payment before allowing API access
 */
export async function verifyPaymentMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const paymentToken = await PaymentVerificationService.verifyPaymentToken(token);

  if (!paymentToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach to request for use in route handlers
  req.user = {
    id: paymentToken.userId,
    email: paymentToken.email,
    tier: paymentToken.tier,
    subscription: {
      id: paymentToken.subscriptionId,
      status: paymentToken.subscriptionStatus,
      expiresAt: paymentToken.expiresAt,
    },
  };

  next();
}

/**
 * TIER-BASED ACCESS CONTROL
 */
export function requireTier(...allowedTiers: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedTiers.includes(req.user.tier)) {
      return res.status(403).json({
        error: 'This feature requires a higher tier',
        requiredTier: allowedTiers[0],
        currentTier: req.user.tier,
      });
    }

    next();
  };
}
