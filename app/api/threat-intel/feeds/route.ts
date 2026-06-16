// Threat Intelligence Feeds API Route
// GET: List all feeds and their status
// POST: Manually trigger feed updates

import { NextRequest, NextResponse } from 'next/server';
import { feedManager } from '@/lib/threat-intel/feed-manager';
import { feedScheduler } from '@/lib/threat-intel/feed-scheduler';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check admin privileges (would integrate with auth)
    const stats = await feedManager.getIndicatorStats();

    const result = await query(
      `SELECT id, name, type, enabled, last_update, status, error FROM threat_feeds ORDER BY last_update DESC`
    );

    const feeds = result.rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name),
      type: String(row.type),
      enabled: Boolean(row.enabled),
      lastUpdate: row.last_update ? new Date(String(row.last_update)) : null,
      status: String(row.status || 'unknown'),
      error: row.error ? String(row.error) : null,
    }));

    return NextResponse.json({
      success: true,
      feeds,
      stats,
      schedulerStatus: feedScheduler.getStatus(),
    });
  } catch (error) {
    console.error('[ThreatIntel/Feeds] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, feedId } = body;

    switch (action) {
      case 'update-feed':
        if (!feedId) {
          return NextResponse.json(
            { error: 'Feed ID required' },
            { status: 400 }
          );
        }

        const result = await feedManager.updateFeed(feedId);
        return NextResponse.json({
          success: result.success,
          result,
        });

      case 'update-all':
        const results = await feedManager.updateAllFeeds();
        return NextResponse.json({
          success: true,
          results,
          totalSuccessful: results.filter((r) => r.success).length,
          totalFailed: results.filter((r) => !r.success).length,
        });

      case 'toggle-feed':
        if (!feedId) {
          return NextResponse.json(
            { error: 'Feed ID required' },
            { status: 400 }
          );
        }

        await query(
          `UPDATE threat_feeds SET enabled = NOT enabled WHERE id = $1`,
          [feedId]
        );

        // Refresh scheduler
        await feedScheduler.stop();
        await feedScheduler.start();

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ThreatIntel/Feeds] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process feed request' },
      { status: 500 }
    );
  }
}
