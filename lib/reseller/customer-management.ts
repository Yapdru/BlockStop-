/**
 * Customer Management
 * Resellers manage their customer relationships and usage
 */

import { query } from '@/lib/db';

export interface ResellerCustomer {
  customerId: string;
  resellerId: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  industry?: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  planId: number;
  subscriptionId?: number;
  monthlyRevenue: number;
  totalRevenue: number;
  usagePercentage: number;
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  supportLevel: 'standard' | 'priority';
  lastActivityDate?: Date;
  contractStartDate: Date;
  contractEndDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerUsageStats {
  customerId: string;
  monthlyUsage: number;
  usageLimit: number;
  usagePercentage: number;
  projectedMonthlyUsage: number;
  warningThreshold: boolean;
  lastUpdated: Date;
}

export interface ResellerCustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  monthlyRecurringRevenue: number;
  totalRevenue: number;
  averageCustomerValue: number;
  churnRate: number;
  customerAcquisitionCost: number;
  topIndustries: Array<{
    industry: string;
    count: number;
    revenue: number;
  }>;
}

export class CustomerManagement {
  /**
   * Add customer to reseller
   */
  async addCustomerToReseller(
    resellerId: string,
    userId: number,
    customerName: string,
    customerEmail: string,
    planId: number,
    supportLevel: 'standard' | 'priority' = 'standard',
    industry?: string,
    website?: string
  ): Promise<ResellerCustomer> {
    const customerId = `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await query(
        `INSERT INTO reseller_customers (
          customer_id, reseller_id, user_id, customer_name, customer_email,
          industry, website, status, plan_id, monthly_revenue, total_revenue,
          usage_percentage, onboarding_status, support_level,
          contract_start_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          customerId,
          resellerId,
          userId,
          customerName,
          customerEmail,
          industry || null,
          website || null,
          'active',
          planId,
          0,
          0,
          0,
          'pending',
          supportLevel,
          new Date(),
          new Date(),
          new Date(),
        ]
      );

      return {
        customerId,
        resellerId,
        userId,
        customerName,
        customerEmail,
        industry,
        website,
        status: 'active',
        planId,
        monthlyRevenue: 0,
        totalRevenue: 0,
        usagePercentage: 0,
        onboardingStatus: 'pending',
        supportLevel,
        contractStartDate: new Date(),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to add customer: ${error}`);
    }
  }

  /**
   * Get customer details
   */
  async getResellerCustomer(customerId: string): Promise<ResellerCustomer | null> {
    try {
      const result = await query(
        `SELECT * FROM reseller_customers WHERE customer_id = $1`,
        [customerId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToResellerCustomer(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch customer: ${error}`);
    }
  }

  /**
   * Get reseller's customers
   */
  async getResellerCustomers(
    resellerId: string,
    status?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ResellerCustomer[]> {
    try {
      let sql = `SELECT * FROM reseller_customers WHERE reseller_id = $1`;
      const params: any[] = [resellerId];

      if (status) {
        sql += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);

      return result.rows.map((row: any) => this.mapRowToResellerCustomer(row));
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error}`);
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    updates: Partial<ResellerCustomer>
  ): Promise<ResellerCustomer> {
    try {
      const allowedFields = [
        'customer_name',
        'industry',
        'website',
        'status',
        'support_level',
        'contract_end_date',
        'notes',
      ];

      const setClause = allowedFields
        .map((field, i) => {
          const value = updates[field as keyof ResellerCustomer];
          if (value !== undefined) return `${field} = $${i + 2}`;
        })
        .filter(Boolean)
        .join(', ');

      if (!setClause) {
        throw new Error('No valid fields to update');
      }

      const params = [customerId];
      allowedFields.forEach((field) => {
        const value = updates[field as keyof ResellerCustomer];
        if (value !== undefined) params.push(value);
      });

      const result = await query(
        `UPDATE reseller_customers
         SET ${setClause}, updated_at = NOW()
         WHERE customer_id = $1
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      return this.mapRowToResellerCustomer(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update customer: ${error}`);
    }
  }

  /**
   * Update customer usage
   */
  async updateCustomerUsage(
    customerId: string,
    usagePercentage: number,
    monthlyRevenue?: number
  ): Promise<ResellerCustomer> {
    try {
      const result = await query(
        `UPDATE reseller_customers
         SET usage_percentage = $2,
             ${monthlyRevenue !== undefined ? 'monthly_revenue = $3,' : ''}
             updated_at = NOW()
         WHERE customer_id = $1
         RETURNING *`,
        monthlyRevenue !== undefined
          ? [customerId, usagePercentage, monthlyRevenue]
          : [customerId, usagePercentage]
      );

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      return this.mapRowToResellerCustomer(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update customer usage: ${error}`);
    }
  }

  /**
   * Get customer usage statistics
   */
  async getCustomerUsageStats(customerId: string): Promise<CustomerUsageStats> {
    try {
      const customer = await this.getResellerCustomer(customerId);
      if (!customer) throw new Error('Customer not found');

      // Get plan usage limit from plans table
      const planResult = await query(
        `SELECT features FROM plans WHERE id = $1`,
        [customer.planId]
      );

      const usageLimit = planResult.rows.length > 0 ? 1000 : 100; // Default limits

      return {
        customerId,
        monthlyUsage: Math.floor((customer.usagePercentage / 100) * usageLimit),
        usageLimit,
        usagePercentage: customer.usagePercentage,
        projectedMonthlyUsage: Math.floor((customer.usagePercentage / 100) * usageLimit * 1.1),
        warningThreshold: customer.usagePercentage > 80,
        lastUpdated: customer.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to get customer usage stats: ${error}`);
    }
  }

  /**
   * Get customer metrics for reseller
   */
  async getResellerCustomerMetrics(resellerId: string): Promise<ResellerCustomerMetrics> {
    try {
      const metricsResult = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          COALESCE(SUM(monthly_revenue), 0) as mrr,
          COALESCE(SUM(total_revenue), 0) as total_rev,
          AVG(monthly_revenue) as avg_value
         FROM reseller_customers
         WHERE reseller_id = $1`,
        [resellerId]
      );

      const metrics = metricsResult.rows[0];
      const total = parseInt(metrics.total) || 0;
      const active = parseInt(metrics.active) || 0;

      // Get top industries
      const industriesResult = await query(
        `SELECT industry, COUNT(*) as count, COALESCE(SUM(monthly_revenue), 0) as revenue
         FROM reseller_customers
         WHERE reseller_id = $1 AND industry IS NOT NULL
         GROUP BY industry
         ORDER BY revenue DESC
         LIMIT 5`,
        [resellerId]
      );

      const topIndustries = industriesResult.rows.map((row: any) => ({
        industry: row.industry,
        count: parseInt(row.count),
        revenue: parseFloat(row.revenue) || 0,
      }));

      const churnRate = total > active ? ((total - active) / total) * 100 : 0;

      return {
        totalCustomers: total,
        activeCustomers: active,
        monthlyRecurringRevenue: parseFloat(metrics.mrr) || 0,
        totalRevenue: parseFloat(metrics.total_rev) || 0,
        averageCustomerValue: parseFloat(metrics.avg_value) || 0,
        churnRate: parseFloat(churnRate.toFixed(2)),
        customerAcquisitionCost: 0, // Would need additional data
        topIndustries,
      };
    } catch (error) {
      throw new Error(`Failed to get customer metrics: ${error}`);
    }
  }

  /**
   * Suspend customer
   */
  async suspendCustomer(customerId: string, reason?: string): Promise<ResellerCustomer> {
    try {
      const result = await query(
        `UPDATE reseller_customers
         SET status = 'suspended', notes = $2, updated_at = NOW()
         WHERE customer_id = $1
         RETURNING *`,
        [customerId, reason || null]
      );

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      return this.mapRowToResellerCustomer(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to suspend customer: ${error}`);
    }
  }

  /**
   * Remove customer from reseller
   */
  async removeCustomer(customerId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM reseller_customers WHERE customer_id = $1`,
        [customerId]
      );
    } catch (error) {
      throw new Error(`Failed to remove customer: ${error}`);
    }
  }

  /**
   * Search reseller customers
   */
  async searchCustomers(resellerId: string, searchTerm: string): Promise<ResellerCustomer[]> {
    try {
      const result = await query(
        `SELECT * FROM reseller_customers
         WHERE reseller_id = $1 AND (
           customer_name ILIKE $2
           OR customer_email ILIKE $2
           OR industry ILIKE $2
         )
         ORDER BY customer_name ASC`,
        [resellerId, `%${searchTerm}%`]
      );

      return result.rows.map((row: any) => this.mapRowToResellerCustomer(row));
    } catch (error) {
      throw new Error(`Failed to search customers: ${error}`);
    }
  }

  /**
   * Update onboarding status
   */
  async updateOnboardingStatus(
    customerId: string,
    status: 'pending' | 'in_progress' | 'completed'
  ): Promise<ResellerCustomer> {
    try {
      const result = await query(
        `UPDATE reseller_customers
         SET onboarding_status = $2, updated_at = NOW()
         WHERE customer_id = $1
         RETURNING *`,
        [customerId, status]
      );

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      return this.mapRowToResellerCustomer(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update onboarding status: ${error}`);
    }
  }

  /**
   * Private helper to map database row to ResellerCustomer
   */
  private mapRowToResellerCustomer(row: any): ResellerCustomer {
    return {
      customerId: row.customer_id,
      resellerId: row.reseller_id,
      userId: row.user_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      industry: row.industry,
      website: row.website,
      status: row.status,
      planId: row.plan_id,
      subscriptionId: row.subscription_id,
      monthlyRevenue: parseFloat(row.monthly_revenue) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      usagePercentage: parseFloat(row.usage_percentage) || 0,
      onboardingStatus: row.onboarding_status,
      supportLevel: row.support_level,
      lastActivityDate: row.last_activity_date ? new Date(row.last_activity_date) : undefined,
      contractStartDate: new Date(row.contract_start_date),
      contractEndDate: row.contract_end_date ? new Date(row.contract_end_date) : undefined,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const customerManagement = new CustomerManagement();
