import { NextRequest, NextResponse } from 'next/server';
import { IntegrationManager } from '@/lib/integrations/user/integration-manager';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';
import { getSession } from '@/lib/auth/auth-service';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId } = await req.json();

    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
    }

    const factory = createIntegrationFactory();
    const manager = new IntegrationManager(factory);

    const startTime = Date.now();
    const scanResult = await manager.scanWithIntegration(session.user.id, integrationId);
    const scanDuration = Date.now() - startTime;

    const db = getDb();
    const logId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.query(
      `INSERT INTO integration_scan_logs
       (id, integration_id, user_id, provider, items_scanned, threats_detected, scan_duration_ms, status, scan_details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        logId,
        integrationId,
        session.user.id,
        scanResult.provider,
        scanResult.itemsScanned,
        scanResult.threatsDetected,
        scanDuration,
        'completed',
        JSON.stringify(scanResult.details)
      ]
    );

    return NextResponse.json({
      success: true,
      scanResult: {
        provider: scanResult.provider,
        timestamp: scanResult.timestamp,
        itemsScanned: scanResult.itemsScanned,
        threatsDetected: scanResult.threatsDetected,
        scanDuration
      }
    });
  } catch (error) {
    console.error('Scan integration error:', error);

    const { integrationId } = await req.json();
    const session = await getSession(req);

    if (session?.user?.id && integrationId) {
      const db = getDb();
      const logId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.query(
        `INSERT INTO integration_scan_logs
         (id, integration_id, user_id, provider, status, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          logId,
          integrationId,
          session.user.id,
          'unknown',
          'error',
          error instanceof Error ? error.message : 'Scan failed'
        ]
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}
