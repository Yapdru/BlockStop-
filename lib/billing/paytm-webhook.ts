import crypto from 'crypto';
import { PaymentVerificationService } from './payment-verification';

/**
 * PayTM Webhook Handler - Automated Payment Verification
 * 
 * When user pays via PayTM QR code:
 * 1. PayTM detects payment
 * 2. PayTM sends webhook to BlockStop
 * 3. This handler processes webhook
 * 4. Verifies payment amount + user
 * 5. Issues JWT token automatically
 * 6. User gets instant access
 */

export interface PayTMWebhookPayload {
  EVENT: string; // "TXN_SUCCESS", "TXN_FAILED"
  TXNID: string;
  BANKTXNID: string;
  ORDERID: string;
  TXNAMOUNT: string;
  TXNTIME: string;
  STATUS: string; // "TXN_SUCCESS" or "TXN_FAILURE"
  USERID: string;
  EMAIL: string;
  MOBILE: string;
  CHECKSUMHASH: string;
  RESPCODE: string;
  RESPMSG: string;
  GATEWAYNAME: string;
}

export interface BlockStopPaymentMetadata {
  userId: string;
  email: string;
  tier: 'neo' | 'pro' | 'office' | 'health' | 'max';
  amount: number; // in rupees
}

export class PayTMWebhookHandler {
  private static PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
  private static PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;

  /**
   * Process incoming PayTM webhook
   * 
   * Flow:
   * 1. Verify webhook signature (PayTM authenticity)
   * 2. Verify payment status
   * 3. Extract user & amount from order metadata
   * 4. Verify amount matches tier price
   * 5. Create subscription in DB
   * 6. Issue JWT token
   * 7. Send to user
   */
  static async handleWebhook(payload: PayTMWebhookPayload): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      // 1. Verify webhook signature
      if (!this.verifyWebhookSignature(payload)) {
        console.error('❌ Invalid PayTM webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // 2. Verify payment was successful
      if (payload.STATUS !== 'TXN_SUCCESS') {
        console.warn(`⚠️ Payment failed: ${payload.RESPMSG}`);
        return { success: false, error: 'Payment failed' };
      }

      // 3. Extract metadata from order ID
      // Format: "{userId}_{tier}_{timestamp}"
      const metadata = this.parseOrderId(payload.ORDERID);
      if (!metadata) {
        console.error('❌ Invalid order ID format');
        return { success: false, error: 'Invalid order' };
      }

      // 4. Verify amount matches tier
      const tierPrices: Record<string, number> = {
        neo: 99,
        pro: 299,
        office: 499,
        health: 599,
        max: 299,
      };

      const expectedAmount = tierPrices[metadata.tier];
      const actualAmount = parseFloat(payload.TXNAMOUNT);

      if (actualAmount !== expectedAmount) {
        console.error(
          `❌ Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`
        );
        return { success: false, error: 'Amount mismatch' };
      }

      // 5. Calculate subscription expiry (30 days from now)
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      // 6. Create subscription in DB
      const subscriptionData = {
        userId: metadata.userId,
        email: payload.EMAIL,
        stripeSubscriptionId: payload.TXNID, // Use PayTM transaction ID as subscription ID
        tier: metadata.tier,
        billingCycleEndsAt: expiresAt,
        paytmTxnId: payload.TXNID,
        paytmOrderId: payload.ORDERID,
        amount: actualAmount,
        status: 'active' as const,
      };

      // 7. Issue JWT token
      const token = await PaymentVerificationService.createPaymentToken(
        subscriptionData
      );

      // 8. Store webhook event in audit log
      await this.logWebhookEvent(payload, 'success', token);

      console.log(`✅ Payment verified for ${payload.EMAIL} - Tier: ${metadata.tier}`);
      console.log(`✅ JWT Token issued: ${token.slice(0, 20)}...`);

      return { success: true, token };
    } catch (error) {
      console.error('Error processing PayTM webhook:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Verify PayTM webhook signature
   * PayTM uses HMAC-SHA256 checksum
   */
  private static verifyWebhookSignature(payload: PayTMWebhookPayload): boolean {
    if (!this.PAYTM_MERCHANT_KEY) {
      console.error('PAYTM_MERCHANT_KEY not configured');
      return false;
    }

    // Remove checksum from payload (don't include it in verification)
    const { CHECKSUMHASH, ...dataForHash } = payload;

    // Create string from all fields (order matters)
    const dataString = Object.keys(dataForHash)
      .sort()
      .map((key) => `${key}=${dataForHash[key as keyof typeof dataForHash]}`)
      .join('|');

    // Generate HMAC-SHA256
    const hash = crypto
      .createHmac('sha256', this.PAYTM_MERCHANT_KEY)
      .update(dataString)
      .digest('hex');

    // Compare with provided checksum
    const isValid = hash === CHECKSUMHASH;

    if (!isValid) {
      console.error(
        `Checksum mismatch: expected ${CHECKSUMHASH}, got ${hash}`
      );
    }

    return isValid;
  }

  /**
   * Parse order ID to extract user metadata
   * Format: "userId_tier_timestamp"
   */
  private static parseOrderId(
    orderId: string
  ): BlockStopPaymentMetadata | null {
    try {
      const parts = orderId.split('_');
      if (parts.length < 2) return null;

      const userId = parts[0];
      const tier = parts[1] as any;
      const validTiers = ['neo', 'pro', 'office', 'health', 'max'];

      if (!validTiers.includes(tier)) return null;

      return {
        userId,
        email: '', // Will be filled from webhook
        tier,
        amount: 0, // Will be filled from webhook
      };
    } catch {
      return null;
    }
  }

  /**
   * Log webhook event for audit trail
   */
  private static async logWebhookEvent(
    payload: PayTMWebhookPayload,
    status: 'success' | 'failure',
    token?: string
  ): Promise<void> {
    // TODO: Implement with your database
    // INSERT INTO webhook_logs (txn_id, order_id, email, status, amount, token, created_at)
    console.log(
      `[WEBHOOK LOG] ${status.toUpperCase()} - TXN: ${payload.TXNID}, ORDER: ${payload.ORDERID}`
    );
  }
}

/**
 * Helper: Generate order ID for payment
 * Use when creating PayTM QR code or payment request
 */
export function generatePayTMOrderId(
  userId: string,
  tier: string,
  timestamp: number = Date.now()
): string {
  return `${userId}_${tier}_${timestamp}`;
}

/**
 * Helper: Get PayTM QR code generation URL
 * User scans this QR to initiate payment
 */
export function getPayTMQRUrl(
  amount: number,
  orderId: string,
  email: string
): string {
  const merchantId = process.env.PAYTM_MERCHANT_ID;

  // Format: upi://pay?pa={payeeAddress}&pn={payeeName}&am={amount}&tn={transactionRef}&tr={transactionRef}
  // For personal PayTM wallet: upi://pay?pa={email}@paytm&am={amount}&tn=BlockStop
  
  return `upi://pay?pa=${email}@paytm&pn=BlockStop&am=${amount}&tn=BlockStop%20Order%20${orderId}&tr=${orderId}`;
}

/**
 * Helper: Validate PayTM transaction before processing
 */
export async function verifyPayTMTransaction(
  transactionId: string
): Promise<boolean> {
  // TODO: Call PayTM API to verify transaction details
  // GET https://secure.paytm.in/oltp-web/checkStatus?MID={MERCHANT_ID}&ORDERID={ORDER_ID}
  return true;
}
