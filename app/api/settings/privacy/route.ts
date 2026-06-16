import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { accountService } from '@/lib/account/account-service';
import { authService } from '@/lib/auth/auth-service';
import { PrivacySettings } from '@/types/settings';

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

    // Get privacy settings
    const settings = await accountService.getPrivacySettings(user.id);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
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

    const body = await req.json();
    const updates: Partial<PrivacySettings> = {};

    // Validate and extract updates
    if (body.dataRetentionDays !== undefined) {
      const days = parseInt(body.dataRetentionDays);
      if (isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
          { error: 'Data retention days must be between 1 and 365' },
          { status: 400 }
        );
      }
      updates.dataRetentionDays = days;
    }

    if (body.analyticsEnabled !== undefined) {
      updates.analyticsEnabled = Boolean(body.analyticsEnabled);
    }

    if (body.emailNotificationsEnabled !== undefined) {
      updates.emailNotificationsEnabled = Boolean(body.emailNotificationsEnabled);
    }

    // Update settings
    const updated = await accountService.updatePrivacySettings(user.id, updates);

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated',
      data: updated,
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update privacy settings';

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
