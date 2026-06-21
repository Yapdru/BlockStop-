// Phase 28.1 - Threat Analysis API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { threatIntelligenceEngine } from '@/lib/ai/threat-intelligence';

export async function POST(request: NextRequest) {
  try {
    const { indicator, type = 'ip' } = await request.json();

    if (!indicator) {
      return NextResponse.json(
        { error: 'Indicator is required' },
        { status: 400 }
      );
    }

    // Analyze threat
    const threatScore = threatIntelligenceEngine.analyzeThreat(
      indicator,
      type as any
    );

    return NextResponse.json({
      success: true,
      data: {
        indicator,
        type,
        threat: threatScore,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Threat analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze threat' },
      { status: 500 }
    );
  }
}
