// Webhook Payload Signer - HMAC-SHA256 Signature Generation and Validation
import crypto from 'crypto';

export interface SignatureHeaders {
  'X-BlockStop-Signature': string;
  'X-BlockStop-Timestamp': string;
  'X-BlockStop-Nonce': string;
}

export class PayloadSigner {
  /**
   * Generate HMAC-SHA256 signature for webhook payload
   * Uses timestamp and nonce to prevent replay attacks
   */
  static generateSignature(
    payload: string,
    secret: string,
    timestamp: number = Date.now()
  ): {
    signature: string;
    timestamp: number;
    nonce: string;
  } {
    const nonce = crypto.randomBytes(16).toString('hex');
    const signatureBase = `${payload}.${timestamp}.${nonce}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(signatureBase)
      .digest('hex');

    return {
      signature,
      timestamp,
      nonce,
    };
  }

  /**
   * Generate signature headers for webhook delivery
   */
  static generateSignatureHeaders(
    payload: string,
    secret: string
  ): SignatureHeaders {
    const { signature, timestamp, nonce } = this.generateSignature(
      payload,
      secret
    );

    return {
      'X-BlockStop-Signature': signature,
      'X-BlockStop-Timestamp': timestamp.toString(),
      'X-BlockStop-Nonce': nonce,
    };
  }

  /**
   * Verify webhook signature
   * Protects against tampering and man-in-the-middle attacks
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: number,
    nonce: string,
    maxAge: number = 300000 // 5 minutes default
  ): {
    valid: boolean;
    error?: string;
  } {
    // Check timestamp freshness to prevent replay attacks
    const now = Date.now();
    if (now - timestamp > maxAge) {
      return {
        valid: false,
        error: `Signature timestamp too old: ${now - timestamp}ms > ${maxAge}ms`,
      };
    }

    // Reconstruct the signed message
    const signatureBase = `${payload}.${timestamp}.${nonce}`;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBase)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      const valid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      return { valid };
    } catch {
      return {
        valid: false,
        error: 'Signature mismatch',
      };
    }
  }

  /**
   * Verify webhook delivery using headers
   */
  static verifyDelivery(
    payload: string,
    headers: Record<string, string | undefined>,
    secret: string,
    maxAge?: number
  ): {
    valid: boolean;
    error?: string;
  } {
    const signature = headers['x-blockstop-signature'] ||
      headers['X-BlockStop-Signature'];
    const timestamp =
      headers['x-blockstop-timestamp'] ||
      headers['X-BlockStop-Timestamp'];
    const nonce =
      headers['x-blockstop-nonce'] || headers['X-BlockStop-Nonce'];

    if (!signature || !timestamp || !nonce) {
      return {
        valid: false,
        error: 'Missing signature headers',
      };
    }

    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
      return {
        valid: false,
        error: 'Invalid timestamp format',
      };
    }

    return this.verifySignature(
      payload,
      signature,
      secret,
      timestampNum,
      nonce,
      maxAge
    );
  }

  /**
   * Simple HMAC-SHA256 signing (legacy format for backward compatibility)
   */
  static simpleSign(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Simple signature verification (legacy format)
   */
  static simpleVerify(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = this.simpleSign(payload, secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
}
