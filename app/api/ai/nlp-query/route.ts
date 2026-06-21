// Phase 28.1 - Natural Language Query API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { nlpAnalyzer } from '@/lib/ai/nlp-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { userId, organizationId, query } = await request.json();

    if (!userId || !organizationId || !query) {
      return NextResponse.json(
        { error: 'userId, organizationId, and query are required' },
        { status: 400 }
      );
    }

    // Process query
    const response = await nlpAnalyzer.processQuery(
      userId,
      organizationId,
      query
    );

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('NLP query error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
