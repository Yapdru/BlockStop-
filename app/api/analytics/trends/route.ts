import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { AnalyticsTrendsResponse, TimeSeriesData } from '@/types/analytics';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    // Verify tier access
    if (!['PRO', 'MAX'].includes(auth.context.scopes?.tier || 'free')) {
      return NextResponse.json(
        { error: 'Analytics trends requires PRO tier or higher' },
        { status: 403 }
      );
    }

    // Generate time series data
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const data: TimeSeriesData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      data.push({
        timestamp: date,
        threatCount: Math.floor(Math.random() * 100) + 20,
        severityBreakdown: {
          low: Math.floor(Math.random() * 20),
          medium: Math.floor(Math.random() * 30),
          high: Math.floor(Math.random() * 25),
          critical: Math.floor(Math.random() * 15),
        },
        topThreatType: ['Malware', 'Phishing', 'Ransomware'][Math.floor(Math.random() * 3)],
        averageConfidence: 0.75 + Math.random() * 0.25,
      });
    }

    const response: AnalyticsTrendsResponse = {
      data,
      summary: {
        totalThreats: data.reduce((sum, d) => sum + d.threatCount, 0),
        averageSeverity:
          data.reduce((sum, d) => sum + d.severityBreakdown.critical, 0) > 0 ? 'High' : 'Medium',
        topThreats: [...new Set(data.map((d) => d.topThreatType))],
        timeRange: { startDate, endDate },
      },
      filters: {
        startDate,
        endDate,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics trends error:', error);
    return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const body = await request.json();

    // Validate request body
    if (!body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    // Process and return trends data
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
