/**
 * Reseller Manager
 * Manages reseller registrations and relationships
 */

import { query } from '@/lib/db';

export interface Reseller {
  resellerId: string;
  userId: number;
  resellerId: string;
  email: string;
  companyName: string;
  contactName: string;
  industry?: string;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  tier: 'basic' | 'professional' | 'enterprise';
  website?: string;
  markupPercentage: number; // 20-100%
  customerLimit?: number;
  territory?: string;
  taxId?: string;
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  supportTier: 'standard' | 'priority' | 'dedicated';
  joinDate: Date;
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  lastActivityDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResellerStats {
  resellerId: string;
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageCustomerValue: number;
  churnRate: number;
  growthRate: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    monthlyRevenue: number;
  }>;
}

export class ResellerManager {
  /**
   * Register new reseller
   */
  async registerReseller(
    userId: number,
    email: string,
    companyName: string,
    contactName: string,
    markupPercentage: number,
    industry?: string,
    website?: string,
    territory?: string
  ): Promise<Reseller> {
    const resellerId = `reseller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate markup percentage (20-100%)
    if (markupPercentage < 20 || markupPercentage > 100) {
      throw new Error('Markup percentage must be between 20% and 100%');
    }

    try {
      await query(
        `INSERT INTO resellers (
          reseller_id, user_id, email, company_name, contact_name,
          industry, status, tier, website, markup_percentage,
          territory, support_tier, join_date, total_customers,
          active_customers, total_revenue, monthly_recurring_revenue,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          resellerId,
          userId,
          email,
          companyName,
          contactName,
          industry || null,
          'pending',
          'basic',
          website || null,
          markupPercentage,
          territory || null,
          'standard',
          new Date(),
          0,
          0,
          0,
          0,
          new Date(),
          new Date(),
        ]
      );

      return {
        resellerId,
        userId,
        resellerId,
        email,
        companyName,
        contactName,
        industry,
        status: 'pending',
        tier: 'basic',
        website,
        markupPercentage,
        territory,
        supportTier: 'standard',
        joinDate: new Date(),
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to register reseller: ${error}`);
    }
  }

  /**
   * Get reseller by ID
   */
  async getReseller(resellerId: string): Promise<Reseller | null> {
    try {
      const result = await query(
        `SELECT * FROM resellers WHERE reseller_id = $1`,
        [resellerId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToReseller(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch reseller: ${error}`);
    }
  }

  /**
   * Get reseller by user ID
   */
  async getResellerByUserId(userId: number): Promise<Reseller | null> {
    try {
      const result = await query(
        `SELECT * FROM resellers WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToReseller(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch reseller: ${error}`);
    }
  }

  /**
   * Approve reseller application
   */
  async approveReseller(resellerId: string, tier: 'basic' | 'professional' | 'enterprise' = 'basic'): Promise<Reseller> {
    try {
      const result = await query(
        `UPDATE resellers
         SET status = 'active', tier = $2, updated_at = NOW()
         WHERE reseller_id = $1
         RETURNING *`,
        [resellerId, tier]
      );

      if (result.rows.length === 0) {
        throw new Error('Reseller not found');
      }

      return this.mapRowToReseller(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to approve reseller: ${error}`);
    }
  }

  /**
   * Suspend reseller
   */
  async suspendReseller(resellerId: string, reason?: string): Promise<Reseller> {
    try {
      const result = await query(
        `UPDATE resellers
         SET status = 'suspended', notes = $2, updated_at = NOW()
         WHERE reseller_id = $1
         RETURNING *`,
        [resellerId, reason || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Reseller not found');
      }

      return this.mapRowToReseller(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to suspend reseller: ${error}`);
    }
  }

  /**
   * Update reseller tier
   */
  async updateResellerTier(
    resellerId: string,
    tier: 'basic' | 'professional' | 'enterprise'
  ): Promise<Reseller> {
    try {
      const result = await query(
        `UPDATE resellers
         SET tier = $2, updated_at = NOW()
         WHERE reseller_id = $1
         RETURNING *`,
        [resellerId, tier]
      );

      if (result.rows.length === 0) {
        throw new Error('Reseller not found');
      }

      return this.mapRowToReseller(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update reseller tier: ${error}`);
    }
  }

  /**
   * Update markup percentage
   */
  async updateMarkupPercentage(resellerId: string, markupPercentage: number): Promise<Reseller> {
    if (markupPercentage < 20 || markupPercentage > 100) {
      throw new Error('Markup percentage must be between 20% and 100%');
    }

    try {
      const result = await query(
        `UPDATE resellers
         SET markup_percentage = $2, updated_at = NOW()
         WHERE reseller_id = $1
         RETURNING *`,
        [resellerId, markupPercentage]
      );

      if (result.rows.length === 0) {
        throw new Error('Reseller not found');
      }

      return this.mapRowToReseller(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update markup percentage: ${error}`);
    }
  }

  /**
   * Get reseller statistics
   */
  async getResellerStats(resellerId: string): Promise<ResellerStats> {
    try {
      const reseller = await this.getReseller(resellerId);
      if (!reseller) throw new Error('Reseller not found');

      // Get top customers
      const topCustomersResult = await query(
        `SELECT rc.customer_id, rc.customer_name, COALESCE(SUM(s.monthly_amount), 0) as monthly_revenue
         FROM reseller_customers rc
         LEFT JOIN subscriptions s ON rc.subscription_id = s.id
         WHERE rc.reseller_id = $1
         GROUP BY rc.customer_id, rc.customer_name
         ORDER BY monthly_revenue DESC
         LIMIT 10`,
        [resellerId]
      );

      const topCustomers = topCustomersResult.rows.map((row: any) => ({
        customerId: row.customer_id,
        name: row.customer_name,
        monthlyRevenue: parseFloat(row.monthly_revenue) || 0,
      }));

      const previousMonthRevenue = reseller.monthlyRecurringRevenue > 0
        ? (reseller.monthlyRecurringRevenue / 1.05) // Assume 5% growth
        : 0;

      const growthRate = previousMonthRevenue > 0
        ? ((reseller.monthlyRecurringRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      return {
        resellerId,
        totalCustomers: reseller.totalCustomers,
        activeCustomers: reseller.activeCustomers,
        inactiveCustomers: reseller.totalCustomers - reseller.activeCustomers,
        totalRevenue: reseller.totalRevenue,
        monthlyRecurringRevenue: reseller.monthlyRecurringRevenue,
        averageCustomerValue: reseller.activeCustomers > 0
          ? reseller.monthlyRecurringRevenue / reseller.activeCustomers
          : 0,
        churnRate: reseller.totalCustomers > 0
          ? ((reseller.totalCustomers - reseller.activeCustomers) / reseller.totalCustomers) * 100
          : 0,
        growthRate: parseFloat(growthRate.toFixed(2)),
        topCustomers,
      };
    } catch (error) {
      throw new Error(`Failed to get reseller stats: ${error}`);
    }
  }

  /**
   * Get all resellers (admin)
   */
  async getAllResellers(limit: number = 100, offset: number = 0): Promise<Reseller[]> {
    try {
      const result = await query(
        `SELECT * FROM resellers ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows.map((row: any) => this.mapRowToReseller(row));
    } catch (error) {
      throw new Error(`Failed to fetch resellers: ${error}`);
    }
  }

  /**
   * Search resellers
   */
  async searchResellers(searchTerm: string): Promise<Reseller[]> {
    try {
      const result = await query(
        `SELECT * FROM resellers
         WHERE email ILIKE $1
         OR company_name ILIKE $1
         OR contact_name ILIKE $1
         OR reseller_id ILIKE $1
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`]
      );

      return result.rows.map((row: any) => this.mapRowToReseller(row));
    } catch (error) {
      throw new Error(`Failed to search resellers: ${error}`);
    }
  }

  /**
   * Get resellers by tier
   */
  async getResellersByTier(tier: 'basic' | 'professional' | 'enterprise'): Promise<Reseller[]> {
    try {
      const result = await query(
        `SELECT * FROM resellers WHERE tier = $1 ORDER BY created_at DESC`,
        [tier]
      );

      return result.rows.map((row: any) => this.mapRowToReseller(row));
    } catch (error) {
      throw new Error(`Failed to fetch resellers: ${error}`);
    }
  }

  /**
   * Private helper to map database row to Reseller
   */
  private mapRowToReseller(row: any): Reseller {
    return {
      resellerId: row.reseller_id,
      userId: row.user_id,
      resellerId: row.reseller_id,
      email: row.email,
      companyName: row.company_name,
      contactName: row.contact_name,
      industry: row.industry,
      status: row.status,
      tier: row.tier,
      website: row.website,
      markupPercentage: parseFloat(row.markup_percentage) || 0,
      customerLimit: row.customer_limit,
      territory: row.territory,
      taxId: row.tax_id,
      bankDetails: row.bank_details,
      supportTier: row.support_tier,
      joinDate: new Date(row.join_date),
      totalCustomers: row.total_customers,
      activeCustomers: row.active_customers,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      monthlyRecurringRevenue: parseFloat(row.monthly_recurring_revenue) || 0,
      lastActivityDate: row.last_activity_date ? new Date(row.last_activity_date) : undefined,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const resellerManager = new ResellerManager();
