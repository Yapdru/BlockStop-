import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { accountService } from '@/lib/account/account-service';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { password } = body;

    // Validate password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await authService.validatePassword(user.email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // Request account deletion
    await accountService.requestAccountDeletion(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account deletion requested. Your account will be deleted in 30 days.',
      data: {
        deletionScheduled: true,
        gracePeriodDays: 30,
      },
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to request account deletion' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    // Cancel deletion
    await accountService.cancelAccountDeletion(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled',
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel account deletion' },
      { status: 500 }
    );
  }
}

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

    // Get deletion schedule
    const schedule = await accountService.getDeletionSchedule(user.id);

    return NextResponse.json({
      success: true,
      data: {
        isScheduled: schedule !== null,
        schedule,
      },
    });
  } catch (error) {
    console.error('Get deletion status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deletion status' },
      { status: 500 }
    );
  }
}
