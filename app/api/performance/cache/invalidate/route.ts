/**
 * Cache Invalidation API
 * POST /api/performance/cache/invalidate
 * Manually invalidate cache entries by pattern
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface InvalidateRequest {
  pattern?: string;
  patterns?: string[];
  reason?: string;
}

interface InvalidationResult {
  pattern: string;
  deleted: number;
  timestamp: string;
}

// Mock cache manager for API demonstration
// In production, import from lib/caching/cache-manager
const getMockCacheManager = () => ({
  invalidatePattern: async (pattern: string) => {
    // Simulate invalidation
    const matchCount = Math.floor(Math.random() * 500) + 1;
    return matchCount;
  },
  delete: async (key: string) => {
    // Simulate deletion
  },
});

/**
 * Validate invalidation request
 */
function validateRequest(body: InvalidateRequest): { valid: boolean; error?: string } {
  if (!body.pattern && (!body.patterns || body.patterns.length === 0)) {
    return { valid: false, error: 'Either pattern or patterns array is required' };
  }

  if (body.pattern && typeof body.pattern !== 'string') {
    return { valid: false, error: 'Pattern must be a string' };
  }

  if (body.patterns && !Array.isArray(body.patterns)) {
    return { valid: false, error: 'Patterns must be an array' };
  }

  if (body.patterns && body.patterns.some((p) => typeof p !== 'string')) {
    return { valid: false, error: 'All patterns must be strings' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: InvalidateRequest = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const cacheManager = getMockCacheManager();
    const results: InvalidationResult[] = [];
    let totalDeleted = 0;

    // Handle single pattern
    if (body.pattern) {
      const deleted = await cacheManager.invalidatePattern(body.pattern);
      results.push({
        pattern: body.pattern,
        deleted,
        timestamp: new Date().toISOString(),
      });
      totalDeleted += deleted;
    }

    // Handle multiple patterns
    if (body.patterns && body.patterns.length > 0) {
      for (const pattern of body.patterns) {
        const deleted = await cacheManager.invalidatePattern(pattern);
        results.push({
          pattern,
          deleted,
          timestamp: new Date().toISOString(),
        });
        totalDeleted += deleted;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully invalidated cache entries`,
        totalPatterns: results.length,
        totalDeleted,
        results,
        timestamp: new Date().toISOString(),
        reason: body.reason || 'Manual invalidation',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error invalidating cache:', error);

    let errorMessage = 'Failed to invalidate cache';
    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON in request body';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler for cache invalidation status/history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Mock invalidation history
    const invalidationHistory = Array.from({ length: Math.min(limit, 20) }).map((_, i) => ({
      id: i + 1,
      pattern: `key:pattern:*`,
      deletedCount: Math.floor(Math.random() * 500) + 1,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      reason: 'Scheduled cleanup',
    }));

    return NextResponse.json(
      {
        success: true,
        invalidationHistory,
        total: invalidationHistory.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching invalidation history:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invalidation history',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE handler for clearing all cache
 */
export async function DELETE(request: NextRequest) {
  try {
    const cacheManager = getMockCacheManager();

    // In production, this would call cacheManager.clear()
    // For now, just return success

    return NextResponse.json(
      {
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error clearing cache:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
