export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { teamService } from '@/lib/teams/team-service';
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

    // Get user's teams
    const teams = await teamService.getUserTeams(user.id);

    return NextResponse.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
