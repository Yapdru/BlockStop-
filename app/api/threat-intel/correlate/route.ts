// Threat Correlation API Route
// POST: Correlate indicators and analyze relationships

import { NextRequest, NextResponse } from 'next/server';
import { correlationEngine } from '@/lib/threat-intel/correlation-engine';
import { feedManager } from '@/lib/threat-intel/feed-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, indicator, depth } = body;

    switch (action) {
      case 'graph':
        if (!indicator) {
          return NextResponse.json(
            { error: 'Indicator ID required' },
            { status: 400 }
          );
        }

        const graphDepth = depth || 2;
        const graph = await correlationEngine.getIOCGraph(indicator, graphDepth);

        return NextResponse.json({
          success: true,
          graph,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
        });

      case 'related':
        if (!indicator) {
          return NextResponse.json(
            { error: 'Indicator ID required' },
            { status: 400 }
          );
        }

        const iocs = await feedManager.searchIndicators(indicator);

        if (iocs.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Indicator not found',
          });
        }

        const related = await correlationEngine.findRelatedIOCs(iocs[0], 20);

        return NextResponse.json({
          success: true,
          source: iocs[0],
          related,
          relatedCount: related.length,
        });

      case 'correlate-batch':
        if (!Array.isArray(body.indicators)) {
          return NextResponse.json(
            { error: 'Indicators array required' },
            { status: 400 }
          );
        }

        // Fetch all IOCs
        const allIOCs = await Promise.all(
          body.indicators.map((ind: string) => feedManager.searchIndicators(ind))
        );

        const flatIOCs = allIOCs.flat();

        // Correlate
        const correlations = await correlationEngine.correlateIOCs(flatIOCs);

        return NextResponse.json({
          success: true,
          indicatorCount: flatIOCs.length,
          correlationCount: correlations.length,
          correlations,
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ThreatIntel/Correlate] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to correlate indicators' },
      { status: 500 }
    );
  }
}
