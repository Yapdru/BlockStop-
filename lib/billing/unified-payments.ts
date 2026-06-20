import { getDb } from '@/lib/db';
import crypto from 'crypto';

export type PaymentMethod = 'upi' | 'bhim' | 'paytm' | 'apple_pay';
export type ProductTier = 'free' | 'neo' | 'pro' | 'office' | 'health';

export interface PaymentTransaction {
  id: string;
  userId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  product: ProductTier;
  status: 'pending' | 'success' | 'failed';
  metadata: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProductConfig {
  tier: ProductTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  maxTeamSize: number;
  integrations: string[];
}

export const PRODUCTS: Record<ProductTier, ProductConfig> = {
  free: {
    tier: 'free',
    name: 'BlockStop Free',
    description: 'Personal security scanning',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Email analysis (DRAR AI)',
      'File scanning (BetterBot PRO)',
      '50 scans/month',
      'Basic threat detection',
      'Personal use only'
    ],
    maxTeamSize: 1,
    integrations: []
  },
  neo: {
    tier: 'neo',
    name: 'BlockStop NEO',
    description: 'Team security with advanced features',
    monthlyPrice: 99,
    annualPrice: 999,
    features: [
      'All Free features',
      'Team collaboration (6 users)',
      'Unlimited scans',
      'WiFi security scanning',
      'VPN integration',
      '2FA authentication',
      'Advanced analytics',
      'Priority support'
    ],
    maxTeamSize: 6,
    integrations: ['slack', 'teams', 'gmail', 'outlook', 'google-drive', 'onedrive']
  },
  pro: {
    tier: 'pro',
    name: 'BlockStop PRO',
    description: 'Enterprise security platform',
    monthlyPrice: 299,
    annualPrice: 2999,
    features: [
      'All NEO features',
      'Unlimited team members',
      'Custom integrations',
      'Advanced threat hunting',
      'AI-powered analysis',
      'Compliance reporting (SOC2, ISO 27001)',
      'Custom branded dashboards',
      'API access',
      'Dedicated support'
    ],
    maxTeamSize: 500,
    integrations: ['slack', 'teams', 'discord', 'gmail', 'outlook', 'google-drive', 'onedrive', 'dropbox', 'box', 'jira', 'servicenow', 'splunk']
  },
  office: {
    tier: 'office',
    name: 'BlockStop Office',
    description: 'Enterprise office security',
    monthlyPrice: 499,
    annualPrice: 4999,
    features: [
      'All PRO features',
      'On-premises deployment',
      'LDAP/Active Directory integration',
      'File server scanning',
      'Email archival scanning',
      'User behavior analytics',
      'Automated threat response',
      'Compliance automation',
      'Executive dashboards',
      '24/7 managed services'
    ],
    maxTeamSize: 5000,
    integrations: ['slack', 'teams', 'discord', 'gmail', 'outlook', 'google-drive', 'onedrive', 'dropbox', 'box', 'jira', 'servicenow', 'splunk', 'active-directory', 'okta', 'azure-ad', 'salesforce']
  },
  health: {
    tier: 'health',
    name: 'BlockStop Health',
    description: 'Healthcare compliance and security',
    monthlyPrice: 599,
    annualPrice: 5999,
    features: [
      'All Office features',
      'HIPAA compliance',
      'HITECH act compliance',
      'Patient data protection',
      'Audit logging',
      'Encryption at rest & transit',
      'DLP (Data Loss Prevention)',
      'Secure file sharing',
      'Medical records scanning',
      'Healthcare-specific threat detection',
      'Compliance reports for audits',
      'Healthcare support team'
    ],
    maxTeamSize: 5000,
    integrations: ['slack', 'teams', 'discord', 'gmail', 'outlook', 'google-drive', 'onedrive', 'dropbox', 'box', 'jira', 'servicenow', 'splunk', 'active-directory', 'okta', 'azure-ad', 'salesforce', 'epic-emr', 'cerner']
  }
};

export class UnifiedPaymentService {
  async processPayment(
    userId: string,
    method: PaymentMethod,
    product: ProductTier,
    frequency: 'monthly' | 'annual' = 'monthly'
  ): Promise<PaymentTransaction> {
    const db = getDb();
    const productConfig = PRODUCTS[product];
    const amount = frequency === 'annual' ? productConfig.annualPrice : productConfig.monthlyPrice;

    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create transaction record
    await db.query(
      `INSERT INTO unified_transactions (id, user_id, payment_method, amount, currency, product, status, frequency, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [transactionId, userId, method, amount, 'INR', product, 'pending', frequency]
    );

    // Route to appropriate payment processor
    let paymentData: any;

    switch (method) {
      case 'upi':
        paymentData = await this.initiateUPI(transactionId, amount, product);
        break;
      case 'bhim':
        paymentData = await this.initiateBHIM(transactionId, amount, product);
        break;
      case 'paytm':
        paymentData = await this.initiatePay TMTransfer(transactionId, amount, product);
        break;
      case 'apple_pay':
        paymentData = await this.initiateApplePay(transactionId, amount, product);
        break;
    }

    return {
      id: transactionId,
      userId,
      method,
      amount,
      currency: 'INR',
      product,
      status: 'pending',
      metadata: paymentData,
      createdAt: new Date()
    };
  }

  async completePayment(transactionId: string): Promise<boolean> {
    const db = getDb();

    const result = await db.query(
      `SELECT * FROM unified_transactions WHERE id = $1`,
      [transactionId]
    );

    if (result.rows.length === 0) return false;

    const transaction = result.rows[0];

    // Update transaction status
    await db.query(
      `UPDATE unified_transactions SET status = 'success', completed_at = NOW() WHERE id = $1`,
      [transactionId]
    );

    // Upgrade user to product tier
    await this.upgradeTierByProduct(transaction.user_id, transaction.product, transaction.frequency);

    return true;
  }

  private async initiateUPI(txnId: string, amount: number, product: string): Promise<any> {
    // Use existing UPI service
    return { method: 'upi', transactionId: txnId };
  }

  private async initiateBHIM(txnId: string, amount: number, product: string): Promise<any> {
    // BHIM deep link: bhim://upi/pay?pa=upiid&pn=name&tn=desc&am=amount&tr=ref
    const bhimUPI = process.env.BHIM_UPI_ID || 'blockstop@okhdfcbank';
    const deepLink = `bhim://upi/pay?pa=${bhimUPI}&pn=BlockStop&tn=${product}&am=${amount}&tr=${txnId}`;

    return { method: 'bhim', deepLink, transactionId: txnId };
  }

  private async initiatePay TMTransfer(txnId: string, amount: number, product: string): Promise<any> {
    // Existing PayTM integration
    return { method: 'paytm', transactionId: txnId };
  }

  private async initiateApplePay(txnId: string, amount: number, product: string): Promise<any> {
    // Apple Pay token request (for iOS/Safari)
    return {
      method: 'apple_pay',
      transactionId: txnId,
      amount,
      currency: 'INR',
      supportedNetworks: ['amex', 'masterCard', 'visa'],
      capabilities: ['supports3DS'],
      merchantCapabilities: ['supports3DS', 'supportsCredit', 'supportsDebit']
    };
  }

  private async upgradeTierByProduct(userId: string, product: ProductTier, frequency: string): Promise<void> {
    const db = getDb();

    // Get plan ID for product
    const planResult = await db.query(
      `SELECT id FROM plans WHERE name = $1`,
      [product]
    );

    if (planResult.rows.length === 0) {
      throw new Error(`Plan not found for product: ${product}`);
    }

    const planId = planResult.rows[0].id;

    // Update user plan
    await db.query(
      `UPDATE users_neo SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [planId, userId]
    );

    // Create/update subscription
    const subscriptionId = `sub_${Date.now()}`;
    const currentPeriodEnd = new Date();

    if (frequency === 'annual') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    await db.query(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         plan_id = $3,
         status = 'active',
         current_period_end = $5,
         updated_at = NOW()`,
      [subscriptionId, userId, planId, 'active', currentPeriodEnd]
    );
  }

  getProductConfig(product: ProductTier): ProductConfig {
    return PRODUCTS[product];
  }

  getAllProducts(): ProductConfig[] {
    return Object.values(PRODUCTS);
  }
}

export const createUnifiedPaymentService = (): UnifiedPaymentService => {
  return new UnifiedPaymentService();
};
