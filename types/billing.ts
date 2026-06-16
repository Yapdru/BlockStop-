export interface Invoice {
  id: number;
  userId: number;
  subscriptionId?: number;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'draft';
  invoiceDate: Date;
  dueDate?: Date;
  pdfUrl?: string;
  description?: string;
  createdAt: Date;
}

export interface BillingInfo {
  currentPlan: string;
  planId: number;
  status: 'active' | 'cancelled' | 'past_due';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  nextBillingDate: Date;
  amount: number;
  currency: string;
}

export interface TeamBillingInfo {
  teamId: number;
  currentPlan: string;
  planId: number;
  status: 'active' | 'cancelled' | 'past_due';
  memberCount: number;
  maxMembers: number;
  billingPeriodEnd: Date;
  amount: number;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  priceMonthly: number;
  features: string[];
  maxUsers: number;
  maxStorage?: string;
  highlighted?: boolean;
}

export interface UpgradeRequest {
  newPlanId: number;
  immediateChange?: boolean;
}

export interface DowngradeRequest {
  newPlanId: number;
  reason?: string;
  effectiveDate?: 'immediate' | 'next_billing_period';
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
}

export interface BillingResponse {
  success: boolean;
  message: string;
  data?: unknown;
}
