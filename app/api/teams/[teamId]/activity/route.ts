import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { teamService } from '@/lib/teams/team-service';
import { authService } from '@/lib/auth/auth-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
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

    const teamId = parseInt(params.teamId);
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Get team activity log
    const logs = await teamService.getTeamActivityLog(teamId, limit, offset);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get team activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity' },
      { status: 500 }
    );
  }
}
