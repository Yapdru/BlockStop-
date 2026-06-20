/**
 * Cache Statistics API
 * GET /api/performance/cache/stats
 * Returns comprehensive cache metrics and statistics
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mock cache manager for API demonstration
// In production, import from lib/caching/cache-manager
const getMockCacheManager = () => ({
  getCacheStats: async () => ({
    hits: 15234,
    misses: 3421,
    hitRate: 81.65,
    size: 285212160, // ~272 MB
    entries: 4521,
    layers: {
      l1: { size: 134217728, entries: 2341 }, // 128 MB
      l2: { size: 134217728, entries: 1852 }, // 128 MB
      l3: { size: 16777216, entries: 328 }, // 16 MB
    },
  }),
  getTopKeys: async (limit: number) => [
    { key: 'user:profile:*', hits: 8234, misses: 234, size: 1024576 },
    { key: 'post:feed:*', hits: 4521, misses: 821, size: 2048576 },
    { key: 'settings:global', hits: 2341, misses: 123, size: 512000 },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeTopKeys = searchParams.get('topKeys') === 'true';
    const topKeyLimit = parseInt(searchParams.get('limit') || '10', 10);

    const cacheManager = getMockCacheManager();

    // Get cache statistics
    const stats = await cacheManager.getCacheStats();

    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),
      cache: {
        statistics: {
          totalHits: stats.hits,
          totalMisses: stats.misses,
          hitRate: parseFloat(stats.hitRate.toFixed(2)),
          totalSize: stats.size,
          totalEntries: stats.entries,
          averageEntrySize: stats.size > 0 ? Math.round(stats.size / stats.entries) : 0,
        },
        layers: {
          l1: {
            name: 'In-Memory Cache (L1)',
            size: stats.layers.l1.size,
            entries: stats.layers.l1.entries,
            percentage: ((stats.layers.l1.size / stats.size) * 100).toFixed(2),
            ttl: 3600,
          },
          l2: {
            name: 'Secondary Cache (L2)',
            size: stats.layers.l2.size,
            entries: stats.layers.l2.entries,
            percentage: ((stats.layers.l2.size / stats.size) * 100).toFixed(2),
            ttl: 86400,
          },
          l3: {
            name: 'Redis Cache (L3)',
            size: stats.layers.l3.size,
            entries: stats.layers.l3.entries,
            percentage: ((stats.layers.l3.size / stats.size) * 100).toFixed(2),
            ttl: 604800,
          },
        },
      },
    };

    // Include top keys if requested
    if (includeTopKeys) {
      const topKeys = await cacheManager.getTopKeys(topKeyLimit);
      response.topKeys = topKeys.map((key: any) => ({
        key: key.key,
        hits: key.hits,
        misses: key.misses,
        size: key.size,
        hitRate: key.hits > 0 ? ((key.hits / (key.hits + key.misses)) * 100).toFixed(2) : '0.00',
      }));
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching cache statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cache statistics',
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
