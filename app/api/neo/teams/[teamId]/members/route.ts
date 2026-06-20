import { NextRequest, NextResponse } from 'next/server';
import { addTeamMember, removeTeamMember, getTeamMembers } from '@/lib/neo/team-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: newUserId, role } = await req.json();

    if (!newUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const member = await addTeamMember(newUserId, params.teamId, role || 'member');

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add member' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await getTeamMembers(params.teamId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('List team members error:', error);
    return NextResponse.json(
      { error: 'Failed to list members' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: removeUserId } = await req.json();

    if (!removeUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await removeTeamMember(removeUserId, params.teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
