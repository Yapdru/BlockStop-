/**
 * Revenue & Payout API Routes
 */

import { revenueEngine } from '@/lib/marketplace/revenue-engine';
import { payoutManager } from '@/lib/marketplace/payout-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/revenue
 * Get revenue data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const developerId = searchParams.get('developerId');
    const pluginId = searchParams.get('pluginId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (developerId) {
      // Get developer earnings
      const earnings = revenueEngine.getDeveloperEarnings(developerId);
      return NextResponse.json({
        success: true,
        data: {
          totalEarnings: earnings.totalEarnings,
          affiliateEarnings: earnings.affiliateEarnings,
          subscriptionEarnings: earnings.subscriptionEarnings,
          oneTimeEarnings: earnings.oneTimeEarnings,
          monthlyBreakdown: Object.fromEntries(earnings.monthlyBreakdown),
        },
      });
    }

    if (pluginId) {
      // Get plugin revenue
      const monthlyRevenue = revenueEngine.getPluginMonthlyRevenue(pluginId);
      return NextResponse.json({
        success: true,
        data: {
          pluginId,
          monthlyRevenue: Object.fromEntries(monthlyRevenue),
        },
      });
    }

    // Get report
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const report = revenueEngine.generateRevenueReport(start, end);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/revenue/payouts
 * Create payout request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { developerId, amount, paymentMethod, details } = body;

    if (!developerId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payout = payoutManager.createPayoutRequest(developerId, amount, paymentMethod, details);

    return NextResponse.json(
      {
        success: true,
        data: payout,
        message: 'Payout request created',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create payout' },
      { status: 400 }
    );
  }
}
