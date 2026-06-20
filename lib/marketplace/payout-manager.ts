/**
 * Payout Manager
 * Manages developer payouts and payment processing
 */

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PayoutRequest {
  payoutId: string;
  developerId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  };
  paypalEmail?: string;
  stripeConnectId?: string;
  status: PayoutStatus;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  transactionReference?: string;
}

export interface PayoutConfiguration {
  minimumPayoutAmount: number;
  payoutFrequency: 'monthly' | 'weekly' | 'daily';
  payoutDay: number; // Day of month (1-31)
  processingFee: number; // Percentage
  tax1099Threshold: number;
  enableAutoPayouts: boolean;
}

export class PayoutManager {
  private payouts: Map<string, PayoutRequest> = new Map();
  private configuration: PayoutConfiguration = {
    minimumPayoutAmount: 50,
    payoutFrequency: 'monthly',
    payoutDay: 15,
    processingFee: 2,
    tax1099Threshold: 20000,
    enableAutoPayouts: true,
  };

  /**
   * Create a payout request
   */
  createPayoutRequest(
    developerId: string,
    amount: number,
    paymentMethod: 'stripe' | 'paypal' | 'bank_transfer',
    details?: Record<string, any>
  ): PayoutRequest {
    if (amount < this.configuration.minimumPayoutAmount) {
      throw new Error(`Amount must be at least $${this.configuration.minimumPayoutAmount}`);
    }

    const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payout: PayoutRequest = {
      payoutId,
      developerId,
      amount,
      currency: 'USD',
      paymentMethod,
      bankDetails: details?.bankDetails,
      paypalEmail: details?.paypalEmail,
      stripeConnectId: details?.stripeConnectId,
      status: 'pending',
      requestedAt: new Date(),
    };

    this.payouts.set(payoutId, payout);
    return payout;
  }

  /**
   * Process a payout
   */
  async processPayoutRequest(payoutId: string): Promise<PayoutRequest> {
    const payout = this.payouts.get(payoutId);
    if (!payout) throw new Error('Payout not found');

    if (payout.status !== 'pending') {
      throw new Error(`Cannot process payout with status: ${payout.status}`);
    }

    payout.status = 'processing';
    payout.processedAt = new Date();

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In production, would call actual payment processor
    const success = await this.processPaymentWithProvider(payout);

    if (success) {
      payout.status = 'completed';
      payout.completedAt = new Date();
      payout.transactionReference = `txn-${Date.now()}`;
    } else {
      payout.status = 'failed';
      payout.failureReason = 'Payment processing failed';
    }

    this.payouts.set(payoutId, payout);
    return payout;
  }

  /**
   * Cancel a payout
   */
  cancelPayoutRequest(payoutId: string, reason: string): PayoutRequest {
    const payout = this.payouts.get(payoutId);
    if (!payout) throw new Error('Payout not found');

    if (payout.status !== 'pending' && payout.status !== 'processing') {
      throw new Error(`Cannot cancel payout with status: ${payout.status}`);
    }

    payout.status = 'cancelled';
    payout.failureReason = reason;

    this.payouts.set(payoutId, payout);
    return payout;
  }

  /**
   * Get developer payouts
   */
  getDeveloperPayouts(developerId: string, status?: PayoutStatus): PayoutRequest[] {
    return Array.from(this.payouts.values())
      .filter((p) => p.developerId === developerId && (!status || p.status === status))
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  /**
   * Get pending payouts
   */
  getPendingPayouts(): PayoutRequest[] {
    return Array.from(this.payouts.values())
      .filter((p) => p.status === 'pending')
      .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
  }

  /**
   * Process batch payouts
   */
  async processBatchPayouts(payoutIds: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const payoutId of payoutIds) {
      try {
        await this.processPayoutRequest(payoutId);
        successful.push(payoutId);
      } catch (error) {
        failed.push(payoutId);
      }
    }

    return { successful, failed };
  }

  /**
   * Calculate payout amount with fees
   */
  calculateNetPayout(grossAmount: number): { netAmount: number; fee: number } {
    const fee = (grossAmount * this.configuration.processingFee) / 100;
    const netAmount = grossAmount - fee;

    return { netAmount, fee };
  }

  /**
   * Get payout configuration
   */
  getConfiguration(): PayoutConfiguration {
    return this.configuration;
  }

  /**
   * Update payout configuration
   */
  updateConfiguration(updates: Partial<PayoutConfiguration>): PayoutConfiguration {
    this.configuration = { ...this.configuration, ...updates };
    return this.configuration;
  }

  /**
   * Check if developer requires 1099 tax form
   */
  requiresTaxForm1099(developerId: string, year: number): boolean {
    const payouts = this.getDeveloperPayouts(developerId, 'completed');
    const yearPayouts = payouts.filter((p) => p.completedAt?.getFullYear() === year);
    const totalAmount = yearPayouts.reduce((sum, p) => sum + p.amount, 0);

    return totalAmount >= this.configuration.tax1099Threshold;
  }

  /**
   * Get payout history analytics
   */
  getPayoutAnalytics(developerId: string): {
    totalPayouts: number;
    totalAmount: number;
    averagePayoutAmount: number;
    lastPayoutDate?: Date;
  } {
    const payouts = this.getDeveloperPayouts(developerId, 'completed');

    return {
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
      averagePayoutAmount: payouts.length > 0 ? payouts.reduce((sum, p) => sum + p.amount, 0) / payouts.length : 0,
      lastPayoutDate: payouts[0]?.completedAt,
    };
  }

  /**
   * Process payment with provider
   */
  private async processPaymentWithProvider(payout: PayoutRequest): Promise<boolean> {
    // Simulate payment processing
    // In production, would integrate with Stripe Connect, PayPal, or bank transfer API

    switch (payout.paymentMethod) {
      case 'stripe':
        return await this.stripeTransfer(payout);
      case 'paypal':
        return await this.paypalPayout(payout);
      case 'bank_transfer':
        return await this.bankTransfer(payout);
      default:
        return false;
    }
  }

  private async stripeTransfer(payout: PayoutRequest): Promise<boolean> {
    // Simulate Stripe transfer
    return Math.random() > 0.05; // 95% success rate
  }

  private async paypalPayout(payout: PayoutRequest): Promise<boolean> {
    // Simulate PayPal payout
    return Math.random() > 0.08; // 92% success rate
  }

  private async bankTransfer(payout: PayoutRequest): Promise<boolean> {
    // Simulate bank transfer
    return Math.random() > 0.03; // 97% success rate
  }
}

export const payoutManager = new PayoutManager();
