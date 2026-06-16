import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { accountService } from '@/lib/account/account-service';
import { authService } from '@/lib/auth/auth-service';

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

    const body = await req.json();
    const { newEmail } = body;

    // Validate input
    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400 }
      );
    }

    // Update email
    await accountService.updateEmail(user.id, newEmail);

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully',
      data: { email: newEmail },
    });
  } catch (error) {
    console.error('Update email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update email';

    if (errorMessage.includes('Invalid email')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('already in use')) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
