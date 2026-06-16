// Threat Intelligence Indicators API Route
// GET: Search and lookup IOCs
// POST: Analyze and classify indicators

import { NextRequest, NextResponse } from 'next/server';
import { feedManager } from '@/lib/threat-intel/feed-manager';
import { iocMatcher } from '@/lib/threat-intel/ioc-matcher';
import { threatPredictor } from '@/lib/threat-intel/ml/threat-predictor';
import { anomalyDetector } from '@/lib/threat-intel/ml/anomaly-detector';
import { threatClassifier } from '@/lib/threat-intel/classifier';
import { correlationEngine } from '@/lib/threat-intel/correlation-engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const indicator = searchParams.get('indicator');
    const type = searchParams.get('type');
    const includeAnalysis = searchParams.get('analysis') === 'true';

    if (!indicator) {
      return NextResponse.json(
        { error: 'Indicator parameter required' },
        { status: 400 }
      );
    }

    // Search for matching indicators
    const iocs = await feedManager.searchIndicators(indicator, type || undefined);

    let response: Record<string, unknown> = {
      indicator,
      found: iocs.length > 0,
      indicators: iocs,
    };

    if (includeAnalysis && iocs.length > 0) {
      // Run ML analysis on first result
      const primaryIOC = iocs[0];

      // Initialize models if needed
      await threatPredictor.initialize();
      await anomalyDetector.initialize();

      const [prediction, anomaly, classification, related] = await Promise.all([
        threatPredictor.predictThreat(primaryIOC),
        anomalyDetector.detectAnomaly(primaryIOC),
        threatClassifier.classify(primaryIOC),
        correlationEngine.findRelatedIOCs(primaryIOC, 5),
      ]);

      response.analysis = {
        prediction,
        anomaly,
        classification,
        related,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ThreatIntel/Indicators] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to search indicators' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, indicator, text } = body;

    switch (action) {
      case 'match-text':
        if (!text) {
          return NextResponse.json(
            { error: 'Text parameter required' },
            { status: 400 }
          );
        }

        const matches = iocMatcher.matchIndicators(text);
        const threats = iocMatcher.detectThreatPatterns(text);

        return NextResponse.json({
          success: true,
          matches,
          threatPatterns: threats,
          matchCount: matches.length,
        });

      case 'analyze-indicator':
        if (!indicator) {
          return NextResponse.json(
            { error: 'Indicator parameter required' },
            { status: 400 }
          );
        }

        const iocs = await feedManager.searchIndicators(indicator);

        if (iocs.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Indicator not found in threat feeds',
          });
        }

        const primaryIOC = iocs[0];

        // Initialize models
        await threatPredictor.initialize();
        await anomalyDetector.initialize();

        const [prediction, anomaly, classification] = await Promise.all([
          threatPredictor.predictThreat(primaryIOC),
          anomalyDetector.detectAnomaly(primaryIOC),
          threatClassifier.classify(primaryIOC),
        ]);

        return NextResponse.json({
          success: true,
          indicator: primaryIOC,
          analysis: {
            prediction,
            anomaly,
            classification,
          },
        });

      case 'batch-analyze':
        if (!Array.isArray(body.indicators)) {
          return NextResponse.json(
            { error: 'Indicators array required' },
            { status: 400 }
          );
        }

        const allIOCs = await Promise.all(
          body.indicators.map((ind: string) => feedManager.searchIndicators(ind))
        );

        const flatIOCs = allIOCs.flat();

        // Initialize models
        await threatPredictor.initialize();

        const predictions = await threatPredictor.batchPredict(flatIOCs);

        return NextResponse.json({
          success: true,
          analyzed: predictions.length,
          predictions,
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ThreatIntel/Indicators] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze indicators' },
      { status: 500 }
    );
  }
}
