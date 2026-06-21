// Phase 28.1 - Threat Prediction API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { threatPredictor, ThreatEvent } from '@/lib/ai/threat-predictor';

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId, threatHistory, daysAhead = 7 } = await request.json();

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: 'userId and organizationId are required' },
        { status: 400 }
      );
    }

    // Load user profile if threat history provided
    if (threatHistory && threatHistory.length > 0) {
      const events = threatHistory.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));

      threatPredictor.loadUserProfile(userId, events);
    }

    // Generate predictions
    const predictions = threatPredictor.predictThreats(userId, daysAhead);
    const recommendations = threatPredictor.generateRecommendations(userId);
    const summary = threatPredictor.getSummary(userId);

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        recommendations,
        summary,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
