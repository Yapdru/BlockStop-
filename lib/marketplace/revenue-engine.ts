/**
 * Revenue Engine
 * Tracks and manages plugin revenue
 */

export interface RevenueTransaction {
  transactionId: string;
  pluginId: string;
  developerId: string;
  type: 'subscription' | 'one-time' | 'affiliate' | 'custom';
  amount: number;
  currency: string;
  grossAmount: number; // Before fees
  netAmount: number; // Developer receives
  blockstopFee: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  timestamp: Date;
  customerId?: string;
  description: string;
}

export interface DeveloperEarnings {
  developerId: string;
  totalEarnings: number;
  monthlyBreakdown: Map<string, number>;
  transactions: RevenueTransaction[];
  affiliateEarnings: number;
  subscriptionEarnings: number;
  oneTimeEarnings: number;
}

export interface RevenueReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;
  blockstopRevenue: number;
  developerPayouts: number;
  transactionCount: number;
  topPlugins: Array<{ pluginId: string; revenue: number }>;
  topDevelopers: Array<{ developerId: string; revenue: number }>;
}

export class RevenueEngine {
  private transactions: Map<string, RevenueTransaction> = new Map();
  private developerEarnings: Map<string, DeveloperEarnings> = new Map();

  /**
   * Record a revenue transaction
   */
  recordTransaction(transaction: Omit<RevenueTransaction, 'transactionId'>): RevenueTransaction {
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullTransaction: RevenueTransaction = {
      ...transaction,
      transactionId,
    };

    this.transactions.set(transactionId, fullTransaction);

    // Update developer earnings
    this.updateDeveloperEarnings(transaction.developerId, fullTransaction);

    return fullTransaction;
  }

  /**
   * Record subscription revenue
   */
  recordSubscriptionRevenue(
    pluginId: string,
    developerId: string,
    monthlyAmount: number,
    revenueSharePercentage: number,
    customerId: string
  ): RevenueTransaction {
    const developerShare = monthlyAmount * (revenueSharePercentage / 100);
    const blockstopShare = monthlyAmount - developerShare;

    return this.recordTransaction({
      pluginId,
      developerId,
      type: 'subscription',
      amount: monthlyAmount,
      currency: 'USD',
      grossAmount: monthlyAmount,
      netAmount: developerShare,
      blockstopFee: blockstopShare,
      paymentMethod: 'stripe',
      status: 'completed',
      timestamp: new Date(),
      customerId,
      description: `Subscription revenue for ${pluginId}`,
    });
  }

  /**
   * Record one-time revenue
   */
  recordOneTimeRevenue(
    pluginId: string,
    developerId: string,
    amount: number,
    revenueSharePercentage: number
  ): RevenueTransaction {
    const developerShare = amount * (revenueSharePercentage / 100);
    const blockstopShare = amount - developerShare;

    return this.recordTransaction({
      pluginId,
      developerId,
      type: 'one-time',
      amount,
      currency: 'USD',
      grossAmount: amount,
      netAmount: developerShare,
      blockstopFee: blockstopShare,
      paymentMethod: 'stripe',
      status: 'completed',
      timestamp: new Date(),
      description: `One-time purchase for ${pluginId}`,
    });
  }

  /**
   * Record affiliate commission
   */
  recordAffiliateCommission(
    developerId: string,
    referralSource: string,
    commissionAmount: number
  ): RevenueTransaction {
    return this.recordTransaction({
      pluginId: 'affiliate-commission',
      developerId,
      type: 'affiliate',
      amount: commissionAmount,
      currency: 'USD',
      grossAmount: commissionAmount,
      netAmount: commissionAmount,
      blockstopFee: 0,
      paymentMethod: 'stripe',
      status: 'completed',
      timestamp: new Date(),
      description: `Affiliate commission from ${referralSource}`,
    });
  }

  /**
   * Get developer earnings
   */
  getDeveloperEarnings(developerId: string): DeveloperEarnings {
    let earnings = this.developerEarnings.get(developerId);

    if (!earnings) {
      earnings = {
        developerId,
        totalEarnings: 0,
        monthlyBreakdown: new Map(),
        transactions: [],
        affiliateEarnings: 0,
        subscriptionEarnings: 0,
        oneTimeEarnings: 0,
      };
    }

    return earnings;
  }

  /**
   * Get monthly revenue breakdown for a plugin
   */
  getPluginMonthlyRevenue(pluginId: string): Map<string, number> {
    const monthlyRevenue = new Map<string, number>();

    for (const transaction of this.transactions.values()) {
      if (transaction.pluginId === pluginId && transaction.status === 'completed') {
        const month = transaction.timestamp.toISOString().substring(0, 7); // YYYY-MM

        const current = monthlyRevenue.get(month) || 0;
        monthlyRevenue.set(month, current + transaction.amount);
      }
    }

    return monthlyRevenue;
  }

  /**
   * Generate revenue report
   */
  generateRevenueReport(startDate: Date, endDate: Date): RevenueReport {
    let totalRevenue = 0;
    let blockstopRevenue = 0;
    let developerPayouts = 0;
    let transactionCount = 0;

    const pluginRevenue = new Map<string, number>();
    const developerRevenue = new Map<string, number>();

    for (const transaction of this.transactions.values()) {
      if (
        transaction.timestamp >= startDate &&
        transaction.timestamp <= endDate &&
        transaction.status === 'completed'
      ) {
        totalRevenue += transaction.amount;
        blockstopRevenue += transaction.blockstopFee;
        developerPayouts += transaction.netAmount;
        transactionCount++;

        // Track by plugin
        const current = pluginRevenue.get(transaction.pluginId) || 0;
        pluginRevenue.set(transaction.pluginId, current + transaction.amount);

        // Track by developer
        const devCurrent = developerRevenue.get(transaction.developerId) || 0;
        developerRevenue.set(transaction.developerId, devCurrent + transaction.netAmount);
      }
    }

    const topPlugins = Array.from(pluginRevenue.entries())
      .map(([pluginId, revenue]) => ({ pluginId, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topDevelopers = Array.from(developerRevenue.entries())
      .map(([developerId, revenue]) => ({ developerId, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: { startDate, endDate },
      totalRevenue,
      blockstopRevenue,
      developerPayouts,
      transactionCount,
      topPlugins,
      topDevelopers,
    };
  }

  /**
   * Get transaction history
   */
  getTransactions(
    developerId?: string,
    pluginId?: string,
    type?: RevenueTransaction['type']
  ): RevenueTransaction[] {
    return Array.from(this.transactions.values()).filter((tx) => {
      if (developerId && tx.developerId !== developerId) return false;
      if (pluginId && tx.pluginId !== pluginId) return false;
      if (type && tx.type !== type) return false;
      return true;
    });
  }

  /**
   * Update developer earnings
   */
  private updateDeveloperEarnings(developerId: string, transaction: RevenueTransaction): void {
    let earnings = this.developerEarnings.get(developerId);

    if (!earnings) {
      earnings = {
        developerId,
        totalEarnings: 0,
        monthlyBreakdown: new Map(),
        transactions: [],
        affiliateEarnings: 0,
        subscriptionEarnings: 0,
        oneTimeEarnings: 0,
      };
      this.developerEarnings.set(developerId, earnings);
    }

    if (transaction.status === 'completed') {
      earnings.totalEarnings += transaction.netAmount;

      // Add to monthly breakdown
      const month = transaction.timestamp.toISOString().substring(0, 7);
      const current = earnings.monthlyBreakdown.get(month) || 0;
      earnings.monthlyBreakdown.set(month, current + transaction.netAmount);

      // Category earnings
      if (transaction.type === 'subscription') {
        earnings.subscriptionEarnings += transaction.netAmount;
      } else if (transaction.type === 'one-time') {
        earnings.oneTimeEarnings += transaction.netAmount;
      } else if (transaction.type === 'affiliate') {
        earnings.affiliateEarnings += transaction.netAmount;
      }
    }

    earnings.transactions.push(transaction);
  }
}

export const revenueEngine = new RevenueEngine();
