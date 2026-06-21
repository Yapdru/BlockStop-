/**
 * MSP (Managed Service Provider) Manager
 * Register and manage MSP partners
 */

export interface MSPPartner {
  mspId: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  joinedAt: Date;
  status: "active" | "inactive" | "suspended";
  tier: "standard" | "premium" | "elite";
  apiKey: string;
  apiSecret: string;
  maxCustomers?: number;
  currentCustomers: number;
  revenueShare: number; // percentage
  supportTier: "standard" | "priority" | "dedicated";
}

export interface MSPCustomer {
  customerId: string;
  mspId: string;
  customerName: string;
  email: string;
  domain?: string;
  industry?: string;
  size?: "small" | "medium" | "large" | "enterprise";
  joinedAt: Date;
  status: "active" | "suspended" | "trial";
  subscription?: {
    tier: "free" | "pro" | "enterprise";
    startDate: Date;
    renewalDate: Date;
    autoRenew: boolean;
    price?: number;
  };
  users: number;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    role: string;
  }>;
}

export interface MSPAgreement {
  agreementId: string;
  mspId: string;
  version: string;
  effectiveDate: Date;
  terms: {
    revenueShare: number;
    minCommitment?: number;
    paymentTerms: string;
    supportIncluded: boolean;
    whiteLabel: boolean;
  };
  status: "draft" | "signed" | "active" | "expired";
  signedDate?: Date;
  expiresAt?: Date;
}

export class MSPManager {
  private partners: Map<string, MSPPartner> = new Map();
  private customers: Map<string, MSPCustomer> = new Map();
  private agreements: Map<string, MSPAgreement> = new Map();
  private apiKeys: Map<string, string> = new Map(); // API key -> MSP ID

  /**
   * Register a new MSP partner
   */
  async registerPartner(
    name: string,
    email: string,
    options?: {
      phone?: string;
      website?: string;
      tier?: "standard" | "premium" | "elite";
      maxCustomers?: number;
    }
  ): Promise<MSPPartner> {
    const mspId = `msp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();

    const partner: MSPPartner = {
      mspId,
      name,
      email,
      phone: options?.phone,
      website: options?.website,
      joinedAt: new Date(),
      status: "active",
      tier: options?.tier || "standard",
      apiKey,
      apiSecret,
      maxCustomers: options?.maxCustomers || 100,
      currentCustomers: 0,
      revenueShare: this.getRevenueShare(options?.tier || "standard"),
      supportTier: "standard",
    };

    this.partners.set(mspId, partner);
    this.apiKeys.set(apiKey, mspId);

    return partner;
  }

  /**
   * Get revenue share based on tier
   */
  private getRevenueShare(tier: string): number {
    switch (tier) {
      case "premium":
        return 35;
      case "elite":
        return 40;
      default:
        return 30;
    }
  }

  /**
   * Add customer for MSP
   */
  async addCustomer(
    mspId: string,
    customerName: string,
    email: string,
    options?: {
      domain?: string;
      industry?: string;
      size?: "small" | "medium" | "large" | "enterprise";
      tier?: "free" | "pro" | "enterprise";
    }
  ): Promise<MSPCustomer> {
    const partner = this.partners.get(mspId);
    if (!partner) {
      throw new Error(`MSP not found: ${mspId}`);
    }

    if (
      partner.maxCustomers &&
      partner.currentCustomers >= partner.maxCustomers
    ) {
      throw new Error("Customer limit reached for this MSP");
    }

    const customerId = `cust-${mspId}-${Date.now()}`;

    const customer: MSPCustomer = {
      customerId,
      mspId,
      customerName,
      email,
      domain: options?.domain,
      industry: options?.industry,
      size: options?.size,
      joinedAt: new Date(),
      status: "active",
      subscription: options?.tier
        ? {
            tier: options.tier,
            startDate: new Date(),
            renewalDate: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ),
            autoRenew: true,
          }
        : undefined,
      users: 0,
      contacts: [
        {
          name: customerName,
          email,
          role: "admin",
        },
      ],
    };

    this.customers.set(customerId, customer);
    partner.currentCustomers++;

    return customer;
  }

  /**
   * Update MSP agreement
   */
  async signAgreement(
    mspId: string,
    terms: {
      revenueShare: number;
      minCommitment?: number;
      paymentTerms: string;
      supportIncluded: boolean;
      whiteLabel: boolean;
    }
  ): Promise<MSPAgreement> {
    const partner = this.partners.get(mspId);
    if (!partner) {
      throw new Error(`MSP not found: ${mspId}`);
    }

    const agreementId = `agr-${mspId}-${Date.now()}`;

    const agreement: MSPAgreement = {
      agreementId,
      mspId,
      version: "1.0",
      effectiveDate: new Date(),
      terms,
      status: "signed",
      signedDate: new Date(),
      expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
    };

    this.agreements.set(agreementId, agreement);
    partner.revenueShare = terms.revenueShare;

    return agreement;
  }

  /**
   * Get MSP partner by ID
   */
  async getPartner(mspId: string): Promise<MSPPartner | null> {
    return this.partners.get(mspId) || null;
  }

  /**
   * Get MSP by API key
   */
  async getPartnerByApiKey(apiKey: string): Promise<MSPPartner | null> {
    const mspId = this.apiKeys.get(apiKey);
    if (!mspId) {
      return null;
    }
    return this.partners.get(mspId) || null;
  }

  /**
   * List all partners
   */
  async listPartners(status?: string): Promise<MSPPartner[]> {
    let partners = Array.from(this.partners.values());

    if (status) {
      partners = partners.filter((p) => p.status === status);
    }

    return partners;
  }

  /**
   * List customers for MSP
   */
  async listCustomers(mspId: string): Promise<MSPCustomer[]> {
    return Array.from(this.customers.values()).filter(
      (c) => c.mspId === mspId
    );
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<MSPCustomer | null> {
    return this.customers.get(customerId) || null;
  }

  /**
   * Update customer subscription
   */
  async updateCustomerSubscription(
    customerId: string,
    tier: "free" | "pro" | "enterprise",
    autoRenew: boolean = true
  ): Promise<MSPCustomer | null> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      return null;
    }

    customer.subscription = {
      tier,
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew,
    };

    return customer;
  }

  /**
   * Suspend customer
   */
  async suspendCustomer(customerId: string, reason?: string): Promise<boolean> {
    const customer = this.customers.get(customerId);
    if (customer) {
      customer.status = "suspended";
      return true;
    }
    return false;
  }

  /**
   * Reactivate customer
   */
  async reactivateCustomer(customerId: string): Promise<boolean> {
    const customer = this.customers.get(customerId);
    if (customer) {
      customer.status = "active";
      return true;
    }
    return false;
  }

  /**
   * Get MSP statistics
   */
  async getMSPStats(mspId: string): Promise<{
    customersCount: number;
    activeCustomers: number;
    trialCustomers: number;
    totalUsers: number;
    revenueShare: number;
    tier: string;
  }> {
    const partner = this.partners.get(mspId);
    if (!partner) {
      throw new Error(`MSP not found: ${mspId}`);
    }

    const customers = await this.listCustomers(mspId);

    return {
      customersCount: customers.length,
      activeCustomers: customers.filter((c) => c.status === "active").length,
      trialCustomers: customers.filter((c) => c.status === "trial").length,
      totalUsers: customers.reduce((sum, c) => sum + c.users, 0),
      revenueShare: partner.revenueShare,
      tier: partner.tier,
    };
  }

  /**
   * Get bulk operations for MSP
   */
  async bulkUpdateTier(
    mspId: string,
    customerIds: string[],
    tier: "free" | "pro" | "enterprise"
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const customerId of customerIds) {
      const result = await this.updateCustomerSubscription(customerId, tier);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk suspend customers
   */
  async bulkSuspend(mspId: string, customerIds: string[]): Promise<number> {
    let suspended = 0;

    for (const customerId of customerIds) {
      const result = await this.suspendCustomer(customerId);
      if (result) {
        suspended++;
      }
    }

    return suspended;
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    return `sk_msp_${Math.random().toString(36).substr(2, 32)}`;
  }

  /**
   * Generate API secret
   */
  private generateApiSecret(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  /**
   * Refresh API credentials
   */
  async refreshApiCredentials(mspId: string): Promise<{
    apiKey: string;
    apiSecret: string;
  }> {
    const partner = this.partners.get(mspId);
    if (!partner) {
      throw new Error(`MSP not found: ${mspId}`);
    }

    // Remove old API key
    this.apiKeys.delete(partner.apiKey);

    // Generate new credentials
    const newApiKey = this.generateApiKey();
    const newApiSecret = this.generateApiSecret();

    partner.apiKey = newApiKey;
    partner.apiSecret = newApiSecret;

    this.apiKeys.set(newApiKey, mspId);

    return {
      apiKey: newApiKey,
      apiSecret: newApiSecret,
    };
  }

  /**
   * Export MSP report
   */
  async exportReport(mspId: string, format: "json" | "csv" = "json"): Promise<string> {
    const partner = this.partners.get(mspId);
    if (!partner) {
      throw new Error(`MSP not found: ${mspId}`);
    }

    const stats = await this.getMSPStats(mspId);
    const customers = await this.listCustomers(mspId);

    const report = {
      partner,
      stats,
      customers: customers.map((c) => ({
        id: c.customerId,
        name: c.customerName,
        status: c.status,
        users: c.users,
        tier: c.subscription?.tier,
      })),
      generatedAt: new Date(),
    };

    if (format === "json") {
      return JSON.stringify(report, null, 2);
    }

    // CSV format
    let csv = "Customer Name,Status,Users,Tier,Join Date\n";
    for (const customer of customers) {
      csv += `"${customer.customerName}",${customer.status},${customer.users},${
        customer.subscription?.tier || "N/A"
      },${customer.joinedAt.toISOString()}\n`;
    }

    return csv;
  }
}

export default MSPManager;
