export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { statsAggregator } from '@/lib/dashboard/stats-aggregator';
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    // Get recent threats
    const threats = await statsAggregator.getRecentThreats(user.id, limit);

    return NextResponse.json({
      success: true,
      data: threats,
    });
  } catch (error) {
    console.error('Threats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent threats' },
      { status: 500 }
    );
  }
}
