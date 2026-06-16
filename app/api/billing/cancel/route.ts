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
    const { reason, feedback } = body;

    // Cancel subscription
    await billingService.cancelSubscription(user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled. You will be downgraded to the free plan at the end of your billing period.',
      data: {
        cancelled: true,
        reason,
        feedback,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
