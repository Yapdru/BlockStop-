// Threat Campaigns API Route
// GET: Search campaigns and threat actors
// POST: Analyze IOCs for campaign attribution

import { NextRequest, NextResponse } from 'next/server';
import { campaignDetector } from '@/lib/threat-intel/campaign-detector';
import { attributionEngine } from '@/lib/threat-intel/attribution-engine';
import { feedManager } from '@/lib/threat-intel/feed-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'campaign' or 'actor'

    if (!query) {
      return NextResponse.json(
        { error: 'Search query required' },
        { status: 400 }
      );
    }

    if (type === 'actor') {
      // Initialize attribution engine
      await attributionEngine.initialize();

      const actors = await attributionEngine.searchActors(query);

      return NextResponse.json({
        success: true,
        type: 'actor',
        results: actors,
        count: actors.length,
      });
    } else {
      // Default to campaign search
      const campaigns = await campaignDetector.searchCampaigns(query);

      return NextResponse.json({
        success: true,
        type: 'campaign',
        results: campaigns,
        count: campaigns.length,
      });
    }
  } catch (error) {
    console.error('[ThreatIntel/Campaigns] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to search campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, indicators, actorName, actorData } = body;

    switch (action) {
      case 'detect-campaigns':
        if (!Array.isArray(indicators) || indicators.length === 0) {
          return NextResponse.json(
            { error: 'Indicators array required' },
            { status: 400 }
          );
        }

        // Fetch all IOCs
        const allIOCs = await Promise.all(
          indicators.map((ind: string) => feedManager.searchIndicators(ind))
        );

        const flatIOCs = allIOCs.flat();

        // Detect campaigns
        const campaigns = await campaignDetector.detectCampaigns(flatIOCs);

        return NextResponse.json({
          success: true,
          indicators: flatIOCs.length,
          campaignsDetected: campaigns.length,
          campaigns,
        });

      case 'attribute-iocs':
        if (!Array.isArray(indicators) || indicators.length === 0) {
          return NextResponse.json(
            { error: 'Indicators array required' },
            { status: 400 }
          );
        }

        // Initialize attribution engine
        await attributionEngine.initialize();

        // Fetch IOCs
        const iocsList = await Promise.all(
          indicators.map((ind: string) => feedManager.searchIndicators(ind))
        );

        const flatIOCsList = iocsList.flat();

        // Attribute to actors
        const attributions = await attributionEngine.attributeIOCs(flatIOCsList);

        const results = Array.from(attributions.entries()).map(([iocId, actors]) => ({
          iocId,
          attributedActors: actors.map((a) => ({
            id: a.actor.id,
            name: a.actor.name,
            confidence: Math.round(a.confidence * 100),
          })),
        }));

        return NextResponse.json({
          success: true,
          attributions: results,
        });

      case 'get-actor':
        if (!actorName) {
          return NextResponse.json(
            { error: 'Actor name required' },
            { status: 400 }
          );
        }

        // Initialize attribution engine
        await attributionEngine.initialize();

        const actors = await attributionEngine.searchActors(actorName);

        if (actors.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Actor not found',
          });
        }

        return NextResponse.json({
          success: true,
          actor: actors[0],
        });

      case 'create-actor':
        if (!actorData || !actorData.name) {
          return NextResponse.json(
            { error: 'Actor data required' },
            { status: 400 }
          );
        }

        // Initialize attribution engine
        await attributionEngine.initialize();

        await attributionEngine.createActor({
          id: `actor:${actorData.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: actorData.name,
          aliases: actorData.aliases || [],
          description: actorData.description || '',
          origin: actorData.origin || '',
          motivations: actorData.motivations || [],
          capabilities: actorData.capabilities || [],
          targetedSectors: actorData.targetedSectors || [],
          campaigns: actorData.campaigns || [],
          infrastructure: [],
          firstSeen: new Date(),
          lastSeen: new Date(),
          confidence: 0.7,
        });

        return NextResponse.json({
          success: true,
          message: 'Actor created successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ThreatIntel/Campaigns] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process campaign request' },
      { status: 500 }
    );
  }
}
