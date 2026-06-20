import { NextRequest, NextResponse } from 'next/server';
import { createSettingsService } from '@/lib/neo/settings-service';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { passcode } = await req.json();

    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      );
    }

    const settingsService = createSettingsService();

    // Verify passcode
    const isValid = await settingsService.verifyAdminPasscode(passcode);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 403 }
      );
    }

    // Upgrade user to PRO
    const upgraded = await settingsService.upgradeUserToPro(userId);

    // Log admin access
    await settingsService.logAdminAccess(userId);

    return NextResponse.json({
      success: true,
      message: 'Upgraded to PRO tier',
      upgraded,
      tier: 'pro'
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Admin verification failed' },
      { status: 500 }
    );
  }
}
