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
    const type = searchParams.get('type') as 'email' | 'file' | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Get scan history
    const history = await statsAggregator.getScanHistory(user.id, type || undefined, limit, offset);

    return NextResponse.json({
      success: true,
      data: history,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Scan history fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan history' },
      { status: 500 }
    );
  }
}
