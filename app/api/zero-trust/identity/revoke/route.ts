import { NextRequest, NextResponse } from 'next/server';
import { sessionValidator } from '@/lib/zero-trust/session-validator';
import { zeroTrustIdentityVerifier } from '@/lib/zero-trust/identity-verifier';

/**
 * POST /api/zero-trust/identity/revoke
 * Revoke user session(s)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      revokeAll = false,
      reason = 'Manual revocation',
    } = body;

    // Validate input
    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'Either sessionId or userId is required' },
        { status: 400 }
      );
    }

    let result: { success: boolean; revokedCount: number; message: string };

    // Revoke specific session
    if (sessionId && !revokeAll) {
      try {
        await sessionValidator.revokeSession(sessionId);
        result = {
          success: true,
          revokedCount: 1,
          message: `Session ${sessionId} revoked successfully`,
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to revoke session', details: String(error) },
          { status: 500 }
        );
      }
    }
    // Revoke all user sessions
    else if (userId && revokeAll) {
      try {
        const revokedCount = await sessionValidator.revokeAllUserSessions(userId);
        result = {
          success: true,
          revokedCount,
          message: `All ${revokedCount} sessions for user ${userId} revoked successfully`,
        };

        // Trigger security challenge for user
        await zeroTrustIdentityVerifier.challengeUser(
          userId,
          `All sessions revoked: ${reason}`
        );
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to revoke sessions', details: String(error) },
          { status: 500 }
        );
      }
    }
    // Revoke single session by userId
    else if (userId) {
      try {
        await sessionValidator.revokeSession(sessionId);
        result = {
          success: true,
          revokedCount: 1,
          message: `Session revoked successfully for user ${userId}`,
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to revoke session', details: String(error) },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Log successful revocation
    console.log(`Session revocation: ${result.message} - Reason: ${reason}`);

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session revocation error:', error);
    return NextResponse.json(
      { error: 'Session revocation failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zero-trust/identity/revoke
 * Get session revocation status and active sessions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Get all active sessions for user
    const activeSessions = await sessionValidator.getActiveSessions(userId);

    return NextResponse.json({
      userId,
      activeSessions: {
        count: activeSessions.length,
        sessions: activeSessions.map(session => ({
          sessionId: session.sessionId,
          createdAt: session.createdAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
          ipAddress: session.ipAddress,
          deviceId: session.deviceId,
          trustScore: session.trustScore,
          mfaVerified: session.mfaVerified,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get session status error:', error);
    return NextResponse.json(
      { error: 'Failed to get session status', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/zero-trust/identity/revoke
 * Delete/revoke specific session
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    // Revoke the session
    try {
      await sessionValidator.revokeSession(sessionId);

      return NextResponse.json({
        success: true,
        message: `Session ${sessionId} revoked successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to revoke session', details: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Session deletion failed', details: String(error) },
      { status: 500 }
    );
  }
}
