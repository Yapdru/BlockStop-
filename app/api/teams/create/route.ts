import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { teamService } from '@/lib/teams/team-service';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { teamName } = await request.json();

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
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

    const team = await teamService.createTeam(userId, teamName);

    return NextResponse.json(
      { team },
      { status: 201 }
    );
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Team creation failed' },
      { status: 400 }
    );
  }
}
