/**
 * Pricing Override
 * Allows resellers to set custom pricing with minimum markup requirement
 */

import { query } from '@/lib/db';

export interface ResellerPricing {
  pricingId: string;
  resellerId: string;
  planId: number;
  basePriceMonthly: number;
  resellerPriceMonthly: number;
  markupPercentage: number;
  basePriceYearly?: number;
  resellerPriceYearly?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingValidation {
  isValid: boolean;
  errors: string[];
  markupPercentage: number;
  warnings: string[];
}

export class PricingOverride {
  private readonly MINIMUM_MARKUP = 20; // 20% minimum markup required
  private readonly MAXIMUM_MARKUP = 100; // 100% maximum markup allowed
  private readonly PRICE_PRECISION = 2; // 2 decimal places

  /**
   * Create custom pricing for reseller
   */
  async createResellerPricing(
    resellerId: string,
    planId: number,
    resellerPriceMonthly: number,
    resellerPriceYearly?: number
  ): Promise<ResellerPricing> {
    const pricingId = `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get base plan price
      const planResult = await query(
        `SELECT price_monthly, price_yearly FROM plans WHERE id = $1`,
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Plan not found');
      }

      const plan = planResult.rows[0];
      const basePriceMonthly = parseFloat(plan.price_monthly);
      const basePriceYearly = plan.price_yearly ? parseFloat(plan.price_yearly) : undefined;

      // Validate markup
      const monthlyMarkup = this.calculateMarkupPercentage(basePriceMonthly, resellerPriceMonthly);
      const validation = this.validatePricing(basePriceMonthly, resellerPriceMonthly, basePriceYearly, resellerPriceYearly);

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      await query(
        `INSERT INTO reseller_pricing (
          pricing_id, reseller_id, plan_id, base_price_monthly,
          reseller_price_monthly, markup_percentage, base_price_yearly,
          reseller_price_yearly, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          pricingId,
          resellerId,
          planId,
          basePriceMonthly,
          resellerPriceMonthly,
          monthlyMarkup,
          basePriceYearly || null,
          resellerPriceYearly || null,
          true,
          new Date(),
          new Date(),
        ]
      );

      return {
        pricingId,
        resellerId,
        planId,
        basePriceMonthly,
        resellerPriceMonthly,
        markupPercentage: monthlyMarkup,
        basePriceYearly,
        resellerPriceYearly,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create reseller pricing: ${error}`);
    }
  }

  /**
   * Update reseller pricing
   */
  async updateResellerPricing(
    pricingId: string,
    resellerPriceMonthly?: number,
    resellerPriceYearly?: number
  ): Promise<ResellerPricing> {
    try {
      // Get current pricing
      const currentResult = await query(
        `SELECT * FROM reseller_pricing WHERE pricing_id = $1`,
        [pricingId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Pricing not found');
      }

      const current = currentResult.rows[0];
      const newMonthlyPrice = resellerPriceMonthly || current.reseller_price_monthly;
      const newYearlyPrice = resellerPriceYearly || current.reseller_price_yearly;

      // Validate new pricing
      const validation = this.validatePricing(
        current.base_price_monthly,
        newMonthlyPrice,
        current.base_price_yearly,
        newYearlyPrice
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const newMarkupPercentage = this.calculateMarkupPercentage(
        current.base_price_monthly,
        newMonthlyPrice
      );

      const result = await query(
        `UPDATE reseller_pricing
         SET reseller_price_monthly = $2, reseller_price_yearly = $3,
             markup_percentage = $4, updated_at = NOW()
         WHERE pricing_id = $1
         RETURNING *`,
        [pricingId, newMonthlyPrice, newYearlyPrice || null, newMarkupPercentage]
      );

      return this.mapRowToResellerPricing(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update reseller pricing: ${error}`);
    }
  }

  /**
   * Get reseller pricing for plan
   */
  async getResellerPricing(resellerId: string, planId: number): Promise<ResellerPricing | null> {
    try {
      const result = await query(
        `SELECT * FROM reseller_pricing
         WHERE reseller_id = $1 AND plan_id = $2 AND is_active = true`,
        [resellerId, planId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToResellerPricing(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch reseller pricing: ${error}`);
    }
  }

  /**
   * Get all pricing for reseller
   */
  async getResellerAllPricing(resellerId: string): Promise<ResellerPricing[]> {
    try {
      const result = await query(
        `SELECT * FROM reseller_pricing
         WHERE reseller_id = $1 AND is_active = true
         ORDER BY plan_id ASC`,
        [resellerId]
      );

      return result.rows.map((row: any) => this.mapRowToResellerPricing(row));
    } catch (error) {
      throw new Error(`Failed to fetch reseller pricing: ${error}`);
    }
  }

  /**
   * Validate pricing meets minimum markup requirements
   */
  validatePricing(
    basePriceMonthly: number,
    resellerPriceMonthly: number,
    basePriceYearly?: number,
    resellerPriceYearly?: number
  ): PricingValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check monthly pricing
    const monthlyMarkup = this.calculateMarkupPercentage(basePriceMonthly, resellerPriceMonthly);

    if (monthlyMarkup < this.MINIMUM_MARKUP) {
      errors.push(`Monthly markup must be at least ${this.MINIMUM_MARKUP}% (current: ${monthlyMarkup}%)`);
    }

    if (monthlyMarkup > this.MAXIMUM_MARKUP) {
      errors.push(`Monthly markup cannot exceed ${this.MAXIMUM_MARKUP}% (current: ${monthlyMarkup}%)`);
    }

    // Check yearly pricing if provided
    if (basePriceYearly && resellerPriceYearly) {
      const yearlyMarkup = this.calculateMarkupPercentage(basePriceYearly, resellerPriceYearly);

      if (yearlyMarkup < this.MINIMUM_MARKUP) {
        errors.push(`Yearly markup must be at least ${this.MINIMUM_MARKUP}% (current: ${yearlyMarkup}%)`);
      }

      if (yearlyMarkup > this.MAXIMUM_MARKUP) {
        errors.push(`Yearly markup cannot exceed ${this.MAXIMUM_MARKUP}% (current: ${yearlyMarkup}%)`);
      }

      // Warn if yearly discount differs significantly from monthly
      const monthlyAnnualized = resellerPriceMonthly * 12;
      const discountDifference = Math.abs(monthlyAnnualized - resellerPriceYearly) / monthlyAnnualized * 100;

      if (discountDifference > 20) {
        warnings.push(`Yearly pricing discount differs significantly from monthly (${discountDifference.toFixed(1)}%)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      markupPercentage: monthlyMarkup,
      warnings,
    };
  }

  /**
   * Calculate markup percentage
   */
  calculateMarkupPercentage(basePrice: number, resellerPrice: number): number {
    if (basePrice === 0) return 0;
    const markup = ((resellerPrice - basePrice) / basePrice) * 100;
    return parseFloat(markup.toFixed(this.PRICE_PRECISION));
  }

  /**
   * Calculate reseller price from markup percentage
   */
  calculateResellerPrice(basePrice: number, markupPercentage: number): number {
    const price = basePrice * (1 + markupPercentage / 100);
    return parseFloat(price.toFixed(this.PRICE_PRECISION));
  }

  /**
   * Get profit breakdown
   */
  getProfitBreakdown(basePriceMonthly: number, resellerPriceMonthly: number): {
    baseCost: number;
    resellerPrice: number;
    profitPerUnit: number;
    profitMargin: number;
    markupPercentage: number;
  } {
    const profitPerUnit = resellerPriceMonthly - basePriceMonthly;
    const profitMargin = (profitPerUnit / resellerPriceMonthly) * 100;
    const markupPercentage = this.calculateMarkupPercentage(basePriceMonthly, resellerPriceMonthly);

    return {
      baseCost: parseFloat(basePriceMonthly.toFixed(this.PRICE_PRECISION)),
      resellerPrice: parseFloat(resellerPriceMonthly.toFixed(this.PRICE_PRECISION)),
      profitPerUnit: parseFloat(profitPerUnit.toFixed(this.PRICE_PRECISION)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      markupPercentage,
    };
  }

  /**
   * Get suggested pricing based on markup
   */
  getSuggestedPricing(basePriceMonthly: number, basePriceYearly?: number): {
    minimum: {
      monthly: number;
      yearly?: number;
    };
    recommended: {
      monthly: number;
      yearly?: number;
    };
    maximum: {
      monthly: number;
      yearly?: number;
    };
  } {
    const minimumMarkup = this.MINIMUM_MARKUP;
    const recommendedMarkup = 30; // 30% recommended default
    const maximumMarkup = this.MAXIMUM_MARKUP;

    return {
      minimum: {
        monthly: this.calculateResellerPrice(basePriceMonthly, minimumMarkup),
        yearly: basePriceYearly ? this.calculateResellerPrice(basePriceYearly, minimumMarkup) : undefined,
      },
      recommended: {
        monthly: this.calculateResellerPrice(basePriceMonthly, recommendedMarkup),
        yearly: basePriceYearly ? this.calculateResellerPrice(basePriceYearly, recommendedMarkup) : undefined,
      },
      maximum: {
        monthly: this.calculateResellerPrice(basePriceMonthly, maximumMarkup),
        yearly: basePriceYearly ? this.calculateResellerPrice(basePriceYearly, maximumMarkup) : undefined,
      },
    };
  }

  /**
   * Deactivate pricing
   */
  async deactivatePricing(pricingId: string): Promise<ResellerPricing> {
    try {
      const result = await query(
        `UPDATE reseller_pricing
         SET is_active = false, updated_at = NOW()
         WHERE pricing_id = $1
         RETURNING *`,
        [pricingId]
      );

      if (result.rows.length === 0) {
        throw new Error('Pricing not found');
      }

      return this.mapRowToResellerPricing(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to deactivate pricing: ${error}`);
    }
  }

  /**
   * Private helper to map database row to ResellerPricing
   */
  private mapRowToResellerPricing(row: any): ResellerPricing {
    return {
      pricingId: row.pricing_id,
      resellerId: row.reseller_id,
      planId: row.plan_id,
      basePriceMonthly: parseFloat(row.base_price_monthly) || 0,
      resellerPriceMonthly: parseFloat(row.reseller_price_monthly) || 0,
      markupPercentage: parseFloat(row.markup_percentage) || 0,
      basePriceYearly: row.base_price_yearly ? parseFloat(row.base_price_yearly) : undefined,
      resellerPriceYearly: row.reseller_price_yearly ? parseFloat(row.reseller_price_yearly) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const pricingOverride = new PricingOverride();
