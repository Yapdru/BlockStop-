/**
 * SIEM Ingest Endpoint
 * Accepts scan events and forwards to configured SIEM platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import SplunkClient from '@/lib/integrations/splunk-client';
import ElasticsearchClient from '@/lib/integrations/elasticsearch-client';

interface ScanEvent {
  scanId: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  filePath: string;
  malwareDetected: boolean;
  threats: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  riskScore: number;
  metadata?: Record<string, any>;
}

// Initialize SIEM clients
const splunkClient = process.env.SPLUNK_URL
  ? new SplunkClient(
      process.env.SPLUNK_URL,
      process.env.SPLUNK_HEC_TOKEN || '',
      { verifySsl: process.env.SPLUNK_VERIFY_SSL !== 'false' }
    )
  : null;

const elasticsearchClient = process.env.ELASTICSEARCH_URL
  ? new ElasticsearchClient(process.env.ELASTICSEARCH_URL, {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
      indexPrefix: 'blockstop',
    })
  : null;

/**
 * POST /api/siem/ingest
 * Ingest scan events to SIEM platforms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.scanId || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: scanId, timestamp' },
        { status: 400 }
      );
    }

    const event: ScanEvent = {
      scanId: body.scanId,
      timestamp: body.timestamp,
      fileName: body.fileName || 'unknown',
      fileSize: body.fileSize || 0,
      filePath: body.filePath || '',
      malwareDetected: body.malwareDetected || false,
      threats: body.threats || [],
      riskScore: body.riskScore || 0,
      metadata: body.metadata,
    };

    const results: Record<string, any> = {
      scanId: event.scanId,
      platforms: {},
    };

    // Send to Splunk
    if (splunkClient) {
      try {
        await splunkClient.sendEvent({
          event: event,
          sourcetype: 'blockstop:scan',
          source: 'blockstop-api',
          host: request.headers.get('host') || 'blockstop-pro',
          index: process.env.SPLUNK_INDEX || 'main',
          time: Math.floor(event.timestamp / 1000),
        });

        results.platforms.splunk = {
          status: 'success',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        results.platforms.splunk = {
          status: 'failed',
          error: String(error),
        };

        console.error('[SIEM Ingest] Splunk error:', error);
      }
    }

    // Send to Elasticsearch
    if (elasticsearchClient) {
      try {
        await elasticsearchClient.indexDocument(
          {
            timestamp: new Date(event.timestamp).toISOString(),
            event_type: event.malwareDetected ? 'threat_detected' : 'scan_completed',
            source: 'blockstop-api',
            severity: event.riskScore > 70 ? 'high' : event.riskScore > 40 ? 'medium' : 'low',
            data: event,
          },
          'scan'
        );

        results.platforms.elasticsearch = {
          status: 'success',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        results.platforms.elasticsearch = {
          status: 'failed',
          error: String(error),
        };

        console.error('[SIEM Ingest] Elasticsearch error:', error);
      }
    }

    // Check if any platform succeeded
    const anySuccess = Object.values(results.platforms).some(
      (p: any) => p.status === 'success'
    );

    if (!anySuccess && Object.keys(results.platforms).length > 0) {
      return NextResponse.json(
        { error: 'Failed to ingest to all SIEM platforms', details: results },
        { status: 500 }
      );
    }

    // Audit log
    console.log('[SIEM Ingest]', {
      scanId: event.scanId,
      platforms: Object.keys(results.platforms),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        scanId: event.scanId,
        ingestedTo: results.platforms,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SIEM Ingest] Error:', error);

    return NextResponse.json(
      { error: 'Failed to ingest scan event', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/siem/ingest/health
 * Health check for SIEM connections
 */
export async function GET(request: NextRequest) {
  try {
    const health: Record<string, any> = {
      timestamp: new Date().toISOString(),
      platforms: {},
    };

    if (splunkClient) {
      const splunkHealthy = await splunkClient.healthCheck();
      health.platforms.splunk = {
        configured: true,
        healthy: splunkHealthy,
      };
    } else {
      health.platforms.splunk = { configured: false };
    }

    if (elasticsearchClient) {
      const esHealthy = await elasticsearchClient.healthCheck();
      health.platforms.elasticsearch = {
        configured: true,
        healthy: esHealthy,
      };
    } else {
      health.platforms.elasticsearch = { configured: false };
    }

    const allHealthy = Object.values(health.platforms).every(
      (p: any) => !p.configured || p.healthy
    );

    return NextResponse.json(
      {
        healthy: allHealthy,
        details: health,
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('[SIEM Health] Error:', error);

    return NextResponse.json(
      { healthy: false, error: String(error) },
      { status: 503 }
    );
  }
}
