/**
 * BlockStop Phase 28.5 - Regional Payment Methods
 * Local payment gateways for different regions
 */

import { DataRegion } from '@/lib/data/region-manager';

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'bhim'
  | 'phonepe'
  | 'google_pay'
  | 'sepa_transfer'
  | 'ideal'
  | 'ach_transfer'
  | 'wechat_pay'
  | 'alipay'
  | 'bank_transfer'
  | 'wallet';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethod;
  region: DataRegion;
  countries: string[];
  minAmount: number;
  maxAmount: number;
  fees: {
    fixed: number;
    percentage: number;
  };
  processingTime: string; // e.g., "1-2 business days"
  supported: boolean;
  requiresVerification: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  region: DataRegion;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  transactionId?: string;
  failureReason?: string;
}

export const REGIONAL_PAYMENT_METHODS: Record<DataRegion, PaymentMethod[]> = {
  US: [
    {
      id: 'pm-us-cc',
      name: 'Credit/Debit Card',
      type: 'credit_card',
      region: 'US',
      countries: ['US', 'CA'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0.30, percentage: 0.029 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-us-ach',
      name: 'ACH Transfer',
      type: 'ach_transfer',
      region: 'US',
      countries: ['US'],
      minAmount: 10,
      maxAmount: 50000,
      fees: { fixed: 0.50, percentage: 0.001 },
      processingTime: '1-2 business days',
      supported: true,
      requiresVerification: true,
    },
  ],
  EU: [
    {
      id: 'pm-eu-cc',
      name: 'Credit/Debit Card',
      type: 'credit_card',
      region: 'EU',
      countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0.35, percentage: 0.029 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-eu-sepa',
      name: 'SEPA Transfer',
      type: 'sepa_transfer',
      region: 'EU',
      countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK'],
      minAmount: 0.01,
      maxAmount: 100000,
      fees: { fixed: 0, percentage: 0.005 },
      processingTime: '1-3 business days',
      supported: true,
      requiresVerification: true,
    },
    {
      id: 'pm-eu-ideal',
      name: 'iDEAL (Netherlands)',
      type: 'ideal',
      region: 'EU',
      countries: ['NL'],
      minAmount: 0.01,
      maxAmount: 50000,
      fees: { fixed: 0.25, percentage: 0.01 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
  ],
  India: [
    {
      id: 'pm-in-cc',
      name: 'Credit/Debit Card',
      type: 'credit_card',
      region: 'India',
      countries: ['IN'],
      minAmount: 100,
      maxAmount: 500000,
      fees: { fixed: 0, percentage: 0.025 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-in-upi',
      name: 'UPI',
      type: 'upi',
      region: 'India',
      countries: ['IN'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0, percentage: 0 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-in-bhim',
      name: 'BHIM',
      type: 'bhim',
      region: 'India',
      countries: ['IN'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0, percentage: 0 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-in-phonepe',
      name: 'PhonePe',
      type: 'phonepe',
      region: 'India',
      countries: ['IN'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0, percentage: 0.015 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-in-googlepay',
      name: 'Google Pay',
      type: 'google_pay',
      region: 'India',
      countries: ['IN'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0, percentage: 0.015 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-in-bank',
      name: 'Bank Transfer',
      type: 'bank_transfer',
      region: 'India',
      countries: ['IN'],
      minAmount: 100,
      maxAmount: 10000000,
      fees: { fixed: 0, percentage: 0.005 },
      processingTime: '1-2 business days',
      supported: true,
      requiresVerification: true,
    },
  ],
  APAC: [
    {
      id: 'pm-apac-cc',
      name: 'Credit/Debit Card',
      type: 'credit_card',
      region: 'APAC',
      countries: ['JP', 'SG', 'AU', 'NZ', 'HK', 'MY', 'TH', 'PH'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0.30, percentage: 0.035 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-apac-wallet',
      name: 'Digital Wallet',
      type: 'wallet',
      region: 'APAC',
      countries: ['JP', 'SG', 'AU', 'NZ', 'HK', 'MY', 'TH', 'PH'],
      minAmount: 0.50,
      maxAmount: 50000,
      fees: { fixed: 0, percentage: 0.02 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
  ],
  MENA: [
    {
      id: 'pm-mena-cc',
      name: 'Credit/Debit Card',
      type: 'credit_card',
      region: 'MENA',
      countries: ['AE', 'SA', 'KW', 'QA'],
      minAmount: 1,
      maxAmount: 100000,
      fees: { fixed: 0.35, percentage: 0.035 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-mena-bank',
      name: 'Bank Transfer',
      type: 'bank_transfer',
      region: 'MENA',
      countries: ['AE', 'SA', 'KW', 'QA'],
      minAmount: 100,
      maxAmount: 1000000,
      fees: { fixed: 0, percentage: 0.01 },
      processingTime: '1-3 business days',
      supported: true,
      requiresVerification: true,
    },
  ],
  LATAM: [
    {
      id: 'pm-latam-cc',
      name: 'Credit/Debit Card',
      type: 'credit_card',
      region: 'LATAM',
      countries: ['BR', 'MX', 'AR', 'CL', 'CO'],
      minAmount: 10,
      maxAmount: 100000,
      fees: { fixed: 0.40, percentage: 0.035 },
      processingTime: 'Instant',
      supported: true,
      requiresVerification: false,
    },
    {
      id: 'pm-latam-bank',
      name: 'Bank Transfer',
      type: 'bank_transfer',
      region: 'LATAM',
      countries: ['BR', 'MX', 'AR', 'CL', 'CO'],
      minAmount: 50,
      maxAmount: 500000,
      fees: { fixed: 1, percentage: 0.01 },
      processingTime: '2-3 business days',
      supported: true,
      requiresVerification: true,
    },
  ],
};

export class RegionalPaymentGateway {
  private payments: Map<string, Payment> = new Map();

  /**
   * Get available payment methods for region
   */
  public getPaymentMethodsForRegion(region: DataRegion): PaymentMethod[] {
    return REGIONAL_PAYMENT_METHODS[region] || [];
  }

  /**
   * Get payment methods for country
   */
  public getPaymentMethodsForCountry(countryCode: string): PaymentMethod[] {
    const methods: PaymentMethod[] = [];

    for (const regionMethods of Object.values(REGIONAL_PAYMENT_METHODS)) {
      for (const method of regionMethods) {
        if (method.countries.includes(countryCode)) {
          methods.push(method);
        }
      }
    }

    return methods;
  }

  /**
   * Get payment method details
   */
  public getPaymentMethodDetails(methodId: string): PaymentMethod | null {
    for (const regionMethods of Object.values(REGIONAL_PAYMENT_METHODS)) {
      const method = regionMethods.find(m => m.id === methodId);
      if (method) {
        return method;
      }
    }
    return null;
  }

  /**
   * Calculate payment fees
   */
  public calculateFees(methodId: string, amount: number): { fixed: number; percentage: number; total: number } | null {
    const method = this.getPaymentMethodDetails(methodId);
    if (!method) {
      return null;
    }

    const fixedFee = method.fees.fixed;
    const percentageFee = amount * method.fees.percentage;
    const totalFees = fixedFee + percentageFee;

    return {
      fixed: fixedFee,
      percentage: percentageFee,
      total: totalFees,
    };
  }

  /**
   * Validate payment amount
   */
  public validatePaymentAmount(methodId: string, amount: number): { valid: boolean; reason?: string } {
    const method = this.getPaymentMethodDetails(methodId);
    if (!method) {
      return { valid: false, reason: 'Payment method not found' };
    }

    if (amount < method.minAmount) {
      return { valid: false, reason: `Minimum amount: ${method.minAmount}` };
    }

    if (amount > method.maxAmount) {
      return { valid: false, reason: `Maximum amount: ${method.maxAmount}` };
    }

    return { valid: true };
  }

  /**
   * Create payment
   */
  public createPayment(
    userId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    region: DataRegion
  ): Payment {
    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount,
      currency,
      method,
      status: 'pending',
      region,
      createdAt: new Date(),
    };

    this.payments.set(payment.id, payment);
    return payment;
  }

  /**
   * Process payment
   */
  async processPayment(paymentId: string, token: string): Promise<Payment | null> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return null;
    }

    payment.status = 'processing';

    // Simulate payment processing
    try {
      // In production, call the appropriate payment gateway API
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.transactionId = `txn-${Date.now()}`;
    } catch (error) {
      payment.status = 'failed';
      payment.failureReason = 'Payment processing failed';
    }

    return payment;
  }

  /**
   * Get payment status
   */
  public getPaymentStatus(paymentId: string): Payment | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Refund payment
   */
  public refundPayment(paymentId: string, reason: string): boolean {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.status !== 'completed') {
      return false;
    }

    payment.status = 'refunded';
    return true;
  }

  /**
   * Get recommended payment methods for region
   */
  public getRecommendedMethods(region: DataRegion, amount: number): PaymentMethod[] {
    const methods = this.getPaymentMethodsForRegion(region);

    return methods
      .filter(m => {
        const validation = this.validatePaymentAmount(m.id, amount);
        return validation.valid;
      })
      .sort((a, b) => {
        // Sort by percentage fees (lowest first)
        return a.fees.percentage - b.fees.percentage;
      });
  }

  /**
   * Get payment methods by type
   */
  public getMethodsByType(type: PaymentMethod, region?: DataRegion): PaymentMethod[] {
    let methods: PaymentMethod[] = [];

    if (region) {
      methods = this.getPaymentMethodsForRegion(region);
    } else {
      methods = Object.values(REGIONAL_PAYMENT_METHODS).flat();
    }

    return methods.filter(m => m.type === type);
  }
}

export const regionalPaymentGateway = new RegionalPaymentGateway();
