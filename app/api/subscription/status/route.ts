import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { subscriptionManager } from '@/lib/billing/subscription-manager';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Get subscription status
    const status = await subscriptionManager.checkSubscriptionStatus(userId);
    const usage = await subscriptionManager.getUserUsage(userId);

    return NextResponse.json({
      subscription: status,
      usage,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
