import { NextRequest, NextResponse } from 'next/server';
import { accessRequestEvaluator } from '@/lib/zero-trust/access-request-evaluator';
import { permissionCache } from '@/lib/zero-trust/permission-cache';

/**
 * POST /api/zero-trust/access/evaluate
 *
 * Evaluate an access request and return an access decision.
 *
 * Request body:
 * {
 *   userId: string;           // The user requesting access
 *   resource: string;         // The resource being accessed
 *   action: string;           // The action to perform (read, write, delete, etc.)
 *   context?: any;            // Optional context for the request
 * }
 *
 * Response:
 * {
 *   allowed: boolean;         // Whether access is allowed
 *   accessToken?: string;     // Temporary access token if allowed
 *   expiresIn?: number;       // Token expiry in seconds
 *   restrictions?: string[];  // Any restrictions on access
 *   reason?: string;          // Explanation of the decision
 *   requiresChallenge?: boolean; // Whether additional challenge is required
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, resource, action, context } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!resource || typeof resource !== 'string') {
      return NextResponse.json(
        { error: 'resource is required and must be a string' },
        { status: 400 }
      );
    }

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'action is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate input format (alphanumeric with hyphens/underscores/colons)
    const validIdPattern = /^[a-zA-Z0-9_\-:.]+$/;
    if (!validIdPattern.test(userId)) {
      return NextResponse.json(
        { error: 'userId contains invalid characters' },
        { status: 400 }
      );
    }

    if (!validIdPattern.test(resource)) {
      return NextResponse.json(
        { error: 'resource contains invalid characters' },
        { status: 400 }
      );
    }

    if (!validIdPattern.test(action)) {
      return NextResponse.json(
        { error: 'action contains invalid characters' },
        { status: 400 }
      );
    }

    // Evaluate the access request
    const decision = await accessRequestEvaluator.evaluateAccessRequest(
      userId,
      resource,
      action
    );

    // Return the decision
    return NextResponse.json(decision, {
      status: decision.allowed ? 200 : 403,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Access evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate access request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zero-trust/access/evaluate
 *
 * Get cache statistics for monitoring purposes.
 * Can be called with ?stats=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('stats') === 'true') {
      const stats = await permissionCache.getCacheStats();
      return NextResponse.json({
        cacheStats: stats,
        timestamp: new Date().toISOString(),
      });
    }

    if (searchParams.get('clear-cache') === 'true') {
      // This should be protected in production!
      // Only allow from localhost or with specific authorization
      const host = request.headers.get('x-forwarded-for') || '';
      if (!host.includes('127.0.0.1') && !host.includes('localhost')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      await permissionCache.clearCache();
      return NextResponse.json({
        message: 'Cache cleared',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message: 'Access evaluation endpoint',
        usage: 'POST with userId, resource, and action',
        endpoints: {
          evaluate: 'POST /api/zero-trust/access/evaluate',
          stats: 'GET /api/zero-trust/access/evaluate?stats=true',
          clearCache: 'GET /api/zero-trust/access/evaluate?clear-cache=true (admin only)',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
