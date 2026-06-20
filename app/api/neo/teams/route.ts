import { NextRequest, NextResponse } from 'next/server';
import { createTeam, getTeamsByUser } from '@/lib/neo/team-service';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamName, planId } = await req.json();

    if (!teamName || !planId) {
      return NextResponse.json(
        { error: 'Team name and plan ID are required' },
        { status: 400 }
      );
    }

    const team = await createTeam(userId, teamName, planId);

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create team' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await getTeamsByUser(userId);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('List teams error:', error);
    return NextResponse.json(
      { error: 'Failed to list teams' },
      { status: 500 }
    );
  }
}
