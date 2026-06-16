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
    const daysBack = Math.min(parseInt(searchParams.get('daysBack') || '30'), 365);

    // Get threat statistics
    const stats = await statsAggregator.getThreatStatistics(user.id, daysBack);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Threat stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threat statistics' },
      { status: 500 }
    );
  }
}
