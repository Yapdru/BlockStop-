import { NextRequest, NextResponse } from 'next/server';
import { zeroTrustIdentityVerifier } from '@/lib/zero-trust/identity-verifier';
import { mfaEnforcer } from '@/lib/zero-trust/mfa-enforcer';

/**
 * POST /api/zero-trust/identity/verify
 * Verify user identity with Zero Trust verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      requireMFA = false,
      requireDeviceTrust = false,
      requireBehaviorAnalysis = false,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Perform identity verification
    const verificationResult = await zeroTrustIdentityVerifier.verifyIdentity(
      userId,
      request,
      {
        requireMFA,
        requireDeviceTrust,
        requireBehaviorAnalysis,
      }
    );

    // If verification is denied and challenge is required
    if (!verificationResult.allowed && verificationResult.challenge) {
      // Log challenge event
      console.log(`Identity challenge issued for user ${userId}: ${verificationResult.reason}`);

      // Optionally notify user of suspicious activity
      if (verificationResult.reason === 'Anomalous activity detected') {
        // In production, send security notification email
        console.log(`Sending security notification to user ${userId}`);
      }
    }

    // Return verification result
    return NextResponse.json({
      verified: verificationResult.allowed,
      reason: verificationResult.reason,
      challenge: verificationResult.challenge || false,
      userId: verificationResult.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Identity verification error:', error);
    return NextResponse.json(
      { error: 'Identity verification failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zero-trust/identity/verify
 * Check current identity verification status
 */
export async function GET(request: NextRequest) {
  try {
    // Extract userId from query params or session
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Check MFA status
    const mfaRequired = await mfaEnforcer.requireMFA(userId);

    // Get user identity verification status
    const userVerified = await zeroTrustIdentityVerifier.verifyUserIdentity(userId);
    const sessionValid = await zeroTrustIdentityVerifier.validateSession(userId);

    return NextResponse.json({
      userId,
      identity: {
        verified: userVerified.verified,
        confidence: userVerified.confidence,
      },
      session: {
        valid: sessionValid.valid,
        expiresAt: sessionValid.expiresAt?.toISOString(),
      },
      mfa: {
        required: mfaRequired.required,
        methods: mfaRequired.methods,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get identity verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status', details: String(error) },
      { status: 500 }
    );
  }
}
