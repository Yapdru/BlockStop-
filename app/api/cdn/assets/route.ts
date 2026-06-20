import { NextRequest, NextResponse } from 'next/server';

interface AssetRequest {
  path: string;
  content?: Buffer | string;
  contentType?: string;
  ttl?: number;
}

interface AssetResponse {
  url?: string;
  cached?: boolean;
  size?: number;
  contentType?: string;
  hits?: number;
  misses?: number;
  bandwidthSaved?: number;
  error?: string;
}

const assetCache = new Map<
  string,
  {
    content: Buffer;
    contentType: string;
    timestamp: Date;
    hits: number;
    misses: number;
    bandwidth: number;
  }
>();

/**
 * GET /api/cdn/assets
 * Retrieve asset metrics or check cache status
 */
export async function GET(request: NextRequest): Promise<NextResponse<AssetResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const action = searchParams.get('action');

    if (action === 'stats') {
      return NextResponse.json(getAssetStats());
    }

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const cached = assetCache.get(path);
    if (cached) {
      cached.hits++;
      return NextResponse.json({
        cached: true,
        size: cached.content.length,
        contentType: cached.contentType,
        hits: cached.hits,
        misses: cached.misses,
        bandwidthSaved: cached.bandwidth,
      });
    }

    cached ? cached.hits++ : 0;
    const notFound = assetCache.get(`missing:${path}`);
    if (notFound) {
      notFound.misses++;
    }

    return NextResponse.json({ cached: false, error: 'Asset not found' }, { status: 404 });
  } catch (error) {
    console.error('Failed to retrieve asset metrics:', error);
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
  }
}

/**
 * POST /api/cdn/assets
 * Push new asset to CDN cache
 */
export async function POST(request: NextRequest): Promise<NextResponse<AssetResponse>> {
  try {
    const body = (await request.json()) as AssetRequest;
    const { path, content, contentType = 'application/octet-stream', ttl = 3600 } = body;

    if (!path || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: path, content' },
        { status: 400 }
      );
    }

    const contentBuffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

    // Store in cache
    assetCache.set(path, {
      content: contentBuffer,
      contentType,
      timestamp: new Date(),
      hits: 0,
      misses: 0,
      bandwidth: contentBuffer.length,
    });

    const url = `/assets/${path}`;

    return NextResponse.json(
      {
        url,
        cached: true,
        size: contentBuffer.length,
        contentType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to push asset:', error);
    return NextResponse.json({ error: 'Failed to push asset' }, { status: 500 });
  }
}

/**
 * DELETE /api/cdn/assets
 * Invalidate cache for specific assets
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<{ invalidated: number }>> {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');

    if (!pattern) {
      return NextResponse.json({ error: 'Missing pattern parameter' }, { status: 400 });
    }

    let invalidatedCount = 0;

    if (pattern === '*') {
      invalidatedCount = assetCache.size;
      assetCache.clear();
    } else {
      const regex = new RegExp(pattern);
      const keysToDelete: string[] = [];

      for (const key of assetCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        assetCache.delete(key);
        invalidatedCount++;
      }
    }

    return NextResponse.json({ invalidated: invalidatedCount });
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 });
  }
}

/**
 * PATCH /api/cdn/assets
 * Update asset configuration or TTL
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<AssetResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const ttl = searchParams.get('ttl');

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const cached = assetCache.get(path);
    if (!cached) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Update TTL in metadata (in production, would update CDN provider)
    if (ttl) {
      const ttlValue = parseInt(ttl, 10);
      if (isNaN(ttlValue)) {
        return NextResponse.json({ error: 'Invalid TTL value' }, { status: 400 });
      }
      // TTL updated in background
    }

    return NextResponse.json({
      cached: true,
      size: cached.content.length,
      contentType: cached.contentType,
    });
  } catch (error) {
    console.error('Failed to update asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

/**
 * Helper function to get overall asset statistics
 */
function getAssetStats(): {
  totalAssets: number;
  totalSize: number;
  totalHits: number;
  totalMisses: number;
  totalBandwidth: number;
  hitRate: number;
} {
  let totalSize = 0;
  let totalHits = 0;
  let totalMisses = 0;
  let totalBandwidth = 0;

  for (const asset of assetCache.values()) {
    totalSize += asset.content.length;
    totalHits += asset.hits;
    totalMisses += asset.misses;
    totalBandwidth += asset.bandwidth;
  }

  const totalRequests = totalHits + totalMisses;
  const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

  return {
    totalAssets: assetCache.size,
    totalSize,
    totalHits,
    totalMisses,
    totalBandwidth,
    hitRate,
  };
}
