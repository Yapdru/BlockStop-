/**
 * Reseller Management Module
 * Manages reseller program and partnerships
 */

export type ResellerTier = 'silver' | 'gold' | 'platinum';

export interface Reseller {
  resellerId: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  tier: ResellerTier;
  marginPercentage: number;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
  accountManager?: string;
  annualRevenue: number; // Current year
  metadata?: Record<string, any>;
}

export interface ResellerCustomer {
  customerId: string;
  resellerId: string;
  customerName: string;
  contactEmail: string;
  tier: string;
  status: 'active' | 'inactive' | 'churned';
  addedAt: Date;
  mrr: number; // Monthly recurring revenue
}

export interface ResellerOrder {
  orderId: string;
  resellerId: string;
  customerId: string;
  amount: number;
  resellerCost: number;
  resellerMargin: number;
  orderDate: Date;
  status: 'pending' | 'completed' | 'failed';
  invoiceNumber?: string;
}

export interface DealRegistration {
  dealId: string;
  resellerId: string;
  dealName: string;
  prospectName: string;
  dealAmount: number;
  estimatedCloseDate: Date;
  status: 'registered' | 'won' | 'lost';
  registeredAt: Date;
  closedAt?: Date;
}

export const RESELLER_TIER_CONFIG: Record<ResellerTier, any> = {
  silver: {
    tier: 'silver',
    name: 'Silver Partner',
    marginPercentage: 40,
    minAnnualRevenue: 0,
    maxAnnualRevenue: 50000,
    supportLevel: 'standard',
    benefits: [
      'Standard partner portal',
      'Deal registration',
      'Monthly partner meetings',
      'Marketing materials',
      'Training resources',
    ],
    coOpFund: 0.03, // 3% of revenue
  },
  gold: {
    tier: 'gold',
    name: 'Gold Partner',
    marginPercentage: 45,
    minAnnualRevenue: 50000,
    maxAnnualRevenue: 250000,
    supportLevel: 'priority',
    benefits: [
      'Advanced partner portal',
      'Deal registration with priority',
      'Bi-weekly partner calls',
      'Co-marketing opportunities',
      'Dedicated onboarding support',
      'Lead sharing program',
      'Custom training',
    ],
    coOpFund: 0.04, // 4% of revenue
  },
  platinum: {
    tier: 'platinum',
    name: 'Platinum Partner',
    marginPercentage: 50,
    minAnnualRevenue: 250000,
    maxAnnualRevenue: Infinity,
    supportLevel: 'dedicated',
    benefits: [
      'Premium partner portal',
      'Exclusive deal registration',
      'Weekly partner calls',
      'Strategic co-marketing',
      'Dedicated partner manager',
      'Lead sharing with priority',
      'Custom training and certification',
      'Technical escalation support',
      'Revenue goal incentives',
    ],
    coOpFund: 0.05, // 5% of revenue
  },
};

export class ResellerManagement {
  private resellers: Map<string, Reseller> = new Map();
  private resellerCustomers: Map<string, ResellerCustomer[]> = new Map();
  private resellerOrders: Map<string, ResellerOrder[]> = new Map();
  private dealRegistrations: Map<string, DealRegistration[]> = new Map();

  /**
   * Register new reseller
   */
  registerReseller(
    companyName: string,
    contactEmail: string,
    contactPhone?: string,
    address?: string,
    metadata?: Record<string, any>
  ): Reseller {
    const resellerId = `reseller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const reseller: Reseller = {
      resellerId,
      companyName,
      contactEmail,
      contactPhone,
      address,
      tier: 'silver', // Default tier
      marginPercentage: RESELLER_TIER_CONFIG.silver.marginPercentage,
      isActive: false, // Must be approved first
      approvalStatus: 'pending',
      createdAt: new Date(),
      annualRevenue: 0,
      metadata,
    };

    this.resellers.set(resellerId, reseller);
    return reseller;
  }

  /**
   * Approve reseller
   */
  approveReseller(resellerId: string, tier: ResellerTier = 'silver', accountManager?: string): Reseller {
    const reseller = this.resellers.get(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const config = RESELLER_TIER_CONFIG[tier];

    reseller.approvalStatus = 'approved';
    reseller.approvedAt = new Date();
    reseller.isActive = true;
    reseller.tier = tier;
    reseller.marginPercentage = config.marginPercentage;
    reseller.accountManager = accountManager;

    this.resellers.set(resellerId, reseller);
    return reseller;
  }

  /**
   * Reject reseller
   */
  rejectReseller(resellerId: string): Reseller {
    const reseller = this.resellers.get(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    reseller.approvalStatus = 'rejected';

    this.resellers.set(resellerId, reseller);
    return reseller;
  }

  /**
   * Add customer to reseller
   */
  addCustomerToReseller(
    resellerId: string,
    customerName: string,
    contactEmail: string,
    tier: string,
    mrr: number = 0
  ): ResellerCustomer {
    const customerId = `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const customer: ResellerCustomer = {
      customerId,
      resellerId,
      customerName,
      contactEmail,
      tier,
      status: 'active',
      addedAt: new Date(),
      mrr,
    };

    if (!this.resellerCustomers.has(resellerId)) {
      this.resellerCustomers.set(resellerId, []);
    }

    this.resellerCustomers.get(resellerId)!.push(customer);

    // Update reseller annual revenue
    this.updateResellerRevenue(resellerId);

    return customer;
  }

  /**
   * Record reseller order
   */
  recordResellerOrder(resellerId: string, customerId: string, amount: number): ResellerOrder {
    const reseller = this.resellers.get(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const resellerMargin = (amount * reseller.marginPercentage) / 100;
    const resellerCost = amount - resellerMargin;

    const order: ResellerOrder = {
      orderId,
      resellerId,
      customerId,
      amount,
      resellerCost,
      resellerMargin,
      orderDate: new Date(),
      status: 'pending',
    };

    if (!this.resellerOrders.has(resellerId)) {
      this.resellerOrders.set(resellerId, []);
    }

    this.resellerOrders.get(resellerId)!.push(order);
    return order;
  }

  /**
   * Register deal
   */
  registerDeal(resellerId: string, dealName: string, prospectName: string, dealAmount: number, estimatedCloseDate: Date): DealRegistration {
    const dealId = `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const deal: DealRegistration = {
      dealId,
      resellerId,
      dealName,
      prospectName,
      dealAmount,
      estimatedCloseDate,
      status: 'registered',
      registeredAt: new Date(),
    };

    if (!this.dealRegistrations.has(resellerId)) {
      this.dealRegistrations.set(resellerId, []);
    }

    this.dealRegistrations.get(resellerId)!.push(deal);
    return deal;
  }

  /**
   * Close deal
   */
  closeDeal(resellerId: string, dealId: string, won: boolean): DealRegistration {
    const deals = this.dealRegistrations.get(resellerId);
    if (!deals) throw new Error('Reseller not found');

    const deal = deals.find((d) => d.dealId === dealId);
    if (!deal) throw new Error('Deal not found');

    deal.status = won ? 'won' : 'lost';
    deal.closedAt = new Date();

    return deal;
  }

  /**
   * Get reseller
   */
  getReseller(resellerId: string): Reseller | undefined {
    return this.resellers.get(resellerId);
  }

  /**
   * Get reseller customers
   */
  getResellerCustomers(resellerId: string): ResellerCustomer[] {
    return this.resellerCustomers.get(resellerId) || [];
  }

  /**
   * Get reseller orders
   */
  getResellerOrders(resellerId: string): ResellerOrder[] {
    return this.resellerOrders.get(resellerId) || [];
  }

  /**
   * Get reseller deals
   */
  getResellerDeals(resellerId: string): DealRegistration[] {
    return this.dealRegistrations.get(resellerId) || [];
  }

  /**
   * Get reseller metrics
   */
  getResellerMetrics(resellerId: string) {
    const reseller = this.resellers.get(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const customers = this.getResellerCustomers(resellerId);
    const orders = this.getResellerOrders(resellerId);
    const deals = this.getResellerDeals(resellerId);

    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    const totalMargin = orders.reduce((sum, o) => sum + o.resellerMargin, 0);
    const wonDeals = deals.filter((d) => d.status === 'won').length;

    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'active').length,
      totalOrders: orders.length,
      totalRevenue,
      totalMargin,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      totalDealsRegistered: deals.length,
      dealsWon: wonDeals,
      dealWinRate: deals.length > 0 ? (wonDeals / deals.length) * 100 : 0,
      mrr: customers.reduce((sum, c) => sum + c.mrr, 0),
    };
  }

  /**
   * Get all approved resellers
   */
  getAllResellers(): Reseller[] {
    return Array.from(this.resellers.values()).filter((r) => r.isActive);
  }

  /**
   * Get pending reseller applications
   */
  getPendingApplications(): Reseller[] {
    return Array.from(this.resellers.values()).filter((r) => r.approvalStatus === 'pending');
  }

  /**
   * Upgrade reseller tier
   */
  upgradeResellerTier(resellerId: string, newTier: ResellerTier): Reseller {
    const reseller = this.resellers.get(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const config = RESELLER_TIER_CONFIG[newTier];

    reseller.tier = newTier;
    reseller.marginPercentage = config.marginPercentage;

    this.resellers.set(resellerId, reseller);
    return reseller;
  }

  /**
   * Calculate co-op fund available
   */
  getCoOpFundAvailable(resellerId: string): number {
    const reseller = this.resellers.get(resellerId);
    if (!reseller) return 0;

    const config = RESELLER_TIER_CONFIG[reseller.tier];
    return (reseller.annualRevenue * config.coOpFund);
  }

  /**
   * Update reseller revenue
   */
  private updateResellerRevenue(resellerId: string): void {
    const orders = this.resellerOrders.get(resellerId) || [];
    const thisYear = new Date().getFullYear();
    const yearOrders = orders.filter((o) => o.orderDate.getFullYear() === thisYear);
    const totalRevenue = yearOrders.reduce((sum, o) => sum + o.amount, 0);

    const reseller = this.resellers.get(resellerId);
    if (reseller) {
      reseller.annualRevenue = totalRevenue;
    }
  }
}

export const resellerManagement = new ResellerManagement();
