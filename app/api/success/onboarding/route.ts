/**
 * Onboarding API Routes
 */

import { onboardingEngine } from '@/lib/customer-success/onboarding-engine';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/success/onboarding
 * Get onboarding plan for customer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }

    const plan = onboardingEngine.getOnboardingPlan(customerId);

    if (!plan) {
      return NextResponse.json(
        { error: 'No active onboarding plan found' },
        { status: 404 }
      );
    }

    const metrics = onboardingEngine.getOnboardingMetrics(plan.planId);

    return NextResponse.json({
      success: true,
      data: {
        plan,
        metrics,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch onboarding plan' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/success/onboarding
 * Create new onboarding plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, dedicatedCSE } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }

    const plan = onboardingEngine.createOnboardingPlan(customerId, dedicatedCSE);

    return NextResponse.json(
      {
        success: true,
        data: plan,
        message: 'Onboarding plan created',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create onboarding plan' },
      { status: 500 }
    );
  }
}
