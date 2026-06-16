import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { billingService } from '@/lib/billing/billing-service';
import { authService } from '@/lib/auth/auth-service';

export async function GET(req: NextRequest) {
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

    // Get billing info
    const billingInfo = await billingService.getUserBillingInfo(user.id);

    return NextResponse.json({
      success: true,
      data: billingInfo,
    });
  } catch (error) {
    console.error('Get billing plan error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}
