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

    // Get team members
    const members = await teamService.getTeamMembers(teamId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = await req.json();
    const { email, role = 'member' } = body;

    // Validate input
    if (!email || !['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid email and role are required' },
        { status: 400 }
      );
    }

    // Invite member
    const result = await teamService.inviteTeamMember(teamId, user.id, email, role);

    // Log activity
    await teamService.logTeamActivity(teamId, user.id, `Invited ${email} as ${role}`);

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Invite member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to invite member';

    if (errorMessage.includes('admin')) {
      return NextResponse.json(
        { error: 'Only team admins can invite members' },
        { status: 403 }
      );
    }

    if (errorMessage.includes('maximum')) {
      return NextResponse.json(
        { error: 'Team has reached maximum member limit' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
