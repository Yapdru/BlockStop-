import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { billingService } from '@/lib/billing/billing-service';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user info
    const user = await authService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { newPlanId } = body;

    // Validate input
    if (!newPlanId || typeof newPlanId !== 'number') {
      return NextResponse.json(
        { error: 'Valid plan ID is required' },
        { status: 400 }
      );
    }

    // Upgrade subscription
    await billingService.upgradeSubscription(user.id, newPlanId);

    return NextResponse.json({
      success: true,
      message: 'Plan upgraded successfully',
      data: { planId: newPlanId },
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade plan';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
