import { jwtVerify, SignJWT } from 'jose';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'blockstop-secret-key-change-in-production'
);

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

  // Database operations (implement with your DB)
  private static async storePaymentRecord(record: any): Promise<void> {
    // TODO: Implement with your database
    // INSERT INTO payments (user_id, subscription_id, tier, status, token, expires_at)
    console.log('Storing payment record:', record);
  }

  private static async getSubscriptionFromDB(
    userId: string,
    subscriptionId: string
  ): Promise<any> {
    // TODO: Implement with your database
    // SELECT * FROM subscriptions WHERE user_id = ? AND stripe_id = ?
    return null;
  }

  private static async updateSubscriptionStatus(
    userId: string,
    subscriptionId: string,
    status: string
  ): Promise<void> {
    // TODO: Implement with your database
    // UPDATE subscriptions SET status = ? WHERE user_id = ? AND stripe_id = ?
    console.log(`Updated subscription ${subscriptionId} to ${status}`);
  }

  private static async isTokenValid(token: string): Promise<boolean> {
    // TODO: Implement with your database
    // SELECT * FROM revoked_tokens WHERE token = ?
    return true;
  }

  private static async getStripeSubscription(id: string): Promise<any> {
    // TODO: Call Stripe API to get subscription details
    return null;
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
