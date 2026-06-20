import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { AnalyticsDashboardData } from '@/types/analytics';

export async function GET(request: NextRequest) {
  // Authenticate request
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const severity = searchParams.get('severity');
    const userId = auth.context.userId;

    // Verify tier-based access
    if (!['PRO', 'MAX'].includes(auth.context.scopes?.tier || 'free')) {
      return NextResponse.json(
        { error: 'Analytics dashboard requires PRO tier or higher' },
        { status: 403 }
      );
    }

    // Parse time range
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const days = daysMap[timeRange] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Mock data generation (replace with real database queries)
    const mockData: AnalyticsDashboardData = {
      threatTrends: generateMockThreatTrends(startDate, days),
      topThreats: generateMockTopThreats(),
      geographicThreats: generateMockGeographicThreats(),
      confidenceScores: generateMockConfidenceScores(30),
      timeRange: {
        startDate,
        endDate: new Date(),
      },
    };

    // Filter by severity if provided
    if (severity && severity !== 'all') {
      mockData.threatTrends = mockData.threatTrends.filter((t) => t.severity === severity);
    }

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics dashboard' },
      { status: 500 }
    );
  }
}

function generateMockThreatTrends(startDate: Date, days: number) {
  const trends = [];
  const threatTypes = ['Malware', 'Phishing', 'Ransomware', 'Suspicious'];

  for (let i = 0; i < days; i += 7) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    for (const threatType of threatTypes) {
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 5,
        severity: (['low', 'medium', 'high', 'critical'] as const)[
          Math.floor(Math.random() * 4)
        ],
        type: threatType,
      });
    }
  }

  return trends;
}

function generateMockTopThreats() {
  return [
    {
      threatType: 'Malware',
      count: 243,
      percentage: 35,
      severity: 'high' as const,
      trend: 'up' as const,
      lastDetected: new Date(),
    },
    {
      threatType: 'Phishing',
      count: 187,
      percentage: 27,
      severity: 'medium' as const,
      trend: 'down' as const,
      lastDetected: new Date(),
    },
    {
      threatType: 'Ransomware',
      count: 156,
      percentage: 22,
      severity: 'critical' as const,
      trend: 'stable' as const,
      lastDetected: new Date(),
    },
    {
      threatType: 'Suspicious',
      count: 108,
      percentage: 16,
      severity: 'low' as const,
      trend: 'up' as const,
      lastDetected: new Date(),
    },
  ];
}

function generateMockGeographicThreats() {
  const countries = [
    { name: 'United States', code: 'US', lat: 37.09, lng: -95.71 },
    { name: 'China', code: 'CN', lat: 35.86, lng: 104.2 },
    { name: 'Russia', code: 'RU', lat: 61.52, lng: 105.32 },
    { name: 'India', code: 'IN', lat: 20.59, lng: 78.96 },
    { name: 'United Kingdom', code: 'GB', lat: 55.38, lng: -3.44 },
  ];

  return countries.map((country) => ({
    country: country.name,
    countryCode: country.code,
    threatCount: Math.floor(Math.random() * 300) + 50,
    severity: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)],
    latitude: country.lat,
    longitude: country.lng,
    cities: [
      {
        name: 'Major City',
        threatCount: Math.floor(Math.random() * 100) + 10,
      },
    ],
  }));
}

function generateMockConfidenceScores(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    threatId: `threat-${i}`,
    confidenceScore: Math.random() * 100,
    factors: [
      { name: 'Pattern Match', weight: 0.4, value: Math.random() },
      { name: 'Behavioral', weight: 0.3, value: Math.random() },
      { name: 'Intelligence', weight: 0.3, value: Math.random() },
    ],
    timestamp: new Date(),
  }));
}
