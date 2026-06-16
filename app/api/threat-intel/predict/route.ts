// Threat Prediction API Route
// POST: Get ML-based threat predictions and risk scoring

import { NextRequest, NextResponse } from 'next/server';
import { threatPredictor } from '@/lib/threat-intel/ml/threat-predictor';
import { anomalyDetector } from '@/lib/threat-intel/ml/anomaly-detector';
import { zeroDayDetector } from '@/lib/threat-intel/ml/zero-day-detector';
import { feedManager } from '@/lib/threat-intel/feed-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, indicator, payload, batch } = body;

    // Initialize models
    await threatPredictor.initialize();
    await anomalyDetector.initialize();

    switch (action) {
      case 'predict-threat':
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
            error: 'Indicator not found',
          });
        }

        const prediction = await threatPredictor.predictThreat(iocs[0]);

        return NextResponse.json({
          success: true,
          prediction,
        });

      case 'detect-anomaly':
        if (!indicator) {
          return NextResponse.json(
            { error: 'Indicator parameter required' },
            { status: 400 }
          );
        }

        const anomalousIOCs = await feedManager.searchIndicators(indicator);

        if (anomalousIOCs.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Indicator not found',
          });
        }

        const anomaly = await anomalyDetector.detectAnomaly(anomalousIOCs[0]);

        return NextResponse.json({
          success: true,
          anomaly,
          isAnomalous: anomaly.isAnomaly,
        });

      case 'detect-zeroday':
        if (!payload) {
          return NextResponse.json(
            { error: 'Payload parameter required' },
            { status: 400 }
          );
        }

        const analysis = await zeroDayDetector.analyzePayload(payload);

        return NextResponse.json({
          success: true,
          analysis,
          isPotentialZeroDay: analysis.isZeroDay,
          riskScore: analysis.riskScore,
        });

      case 'batch-predict':
        if (!Array.isArray(batch) || batch.length === 0) {
          return NextResponse.json(
            { error: 'Batch array required' },
            { status: 400 }
          );
        }

        // Fetch all IOCs
        const batchIOCs = await Promise.all(
          batch.map((ind: string) => feedManager.searchIndicators(ind))
        );

        const flatBatchIOCs = batchIOCs.flat();

        // Run predictions
        const predictions = await threatPredictor.batchPredict(flatBatchIOCs);
        const anomalies = await anomalyDetector.detectAnomalies(flatBatchIOCs);

        // Aggregate risk
        const avgRisk = predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length;
        const anomalousCount = anomalies.filter((a) => a.isAnomaly).length;

        return NextResponse.json({
          success: true,
          indicatorCount: flatBatchIOCs.length,
          predictions,
          anomalies,
          aggregateRisk: Math.round(avgRisk),
          anomalousCount,
        });

      case 'model-stats':
        return NextResponse.json({
          success: true,
          threatPredictorMeta: threatPredictor.getMetadata(),
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ThreatIntel/Predict] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
