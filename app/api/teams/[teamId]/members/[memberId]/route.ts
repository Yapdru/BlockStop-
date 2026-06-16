import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { teamService } from '@/lib/teams/team-service';
import { authService } from '@/lib/auth/auth-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
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
    const memberId = parseInt(params.memberId);

    // Check if user is admin
    const isAdmin = await teamService.isTeamAdmin(teamId, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only team admins can remove members' },
        { status: 403 }
      );
    }

    // Remove member
    await teamService.removeTeamMember(teamId, memberId);

    // Log activity
    await teamService.logTeamActivity(teamId, user.id, `Removed member ${memberId}`);

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
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
    const memberId = parseInt(params.memberId);
    const body = await req.json();
    const { role } = body;

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      );
    }

    // Update member role
    await teamService.updateMemberRole(teamId, memberId, user.id, role);

    // Log activity
    await teamService.logTeamActivity(teamId, user.id, `Updated member ${memberId} role to ${role}`);

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      data: { role },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update member role';

    if (errorMessage.includes('admin')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
