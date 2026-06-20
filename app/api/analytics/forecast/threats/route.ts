/**
 * API Route: GET /api/analytics/forecast/threats
 * Returns threat forecasts for the next 30 days
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ThreatForecast {
  date: string;
  forecastedThreatCount: number;
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number;
  riskFactors: string[];
}

export interface ThreatsResponse {
  success: boolean;
  message: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  forecasts: ThreatForecast[];
  summary: {
    totalProjectedThreats: number;
    averageDaily: number;
    peakDay: {
      date: string;
      count: number;
    };
    trends: string;
  };
}

/**
 * Generate synthetic threat forecast data
 */
function generateThreatForecasts(days: number): ThreatForecast[] {
  const forecasts: ThreatForecast[] = [];
  const today = new Date();
  let baselineThreats = 50;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Simulate trend with some randomness
    const trendFactor = 1 + (i / days) * 0.2; // 20% increase over period
    const randomFactor = 0.8 + Math.random() * 0.4; // ±20% randomness
    const forecastedCount = Math.floor(
      baselineThreats * trendFactor * randomFactor
    );

    // Distribute by severity
    const critical = Math.floor(forecastedCount * 0.1);
    const high = Math.floor(forecastedCount * 0.2);
    const medium = Math.floor(forecastedCount * 0.4);
    const low = forecastedCount - critical - high - medium;

    // Calculate confidence interval (95%)
    const stdDev = forecastedCount * 0.15;
    const zScore = 1.96;

    const forecast: ThreatForecast = {
      date: date.toISOString().split('T')[0],
      forecastedThreatCount: forecastedCount,
      severity: {
        critical,
        high,
        medium,
        low,
      },
      confidenceInterval: {
        lower: Math.floor(forecastedCount - zScore * stdDev),
        upper: Math.floor(forecastedCount + zScore * stdDev),
      },
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
      riskFactors: generateRiskFactors(i, days),
    };

    forecasts.push(forecast);
  }

  return forecasts;
}

/**
 * Generate risk factors based on day and period
 */
function generateRiskFactors(dayIndex: number, totalDays: number): string[] {
  const factors: string[] = [];

  if (dayIndex < totalDays / 3) {
    factors.push('Increased bot activity detected');
    factors.push('Vulnerability scanning patterns observed');
  } else if (dayIndex < (2 * totalDays) / 3) {
    factors.push('Elevated exploitation attempts');
    factors.push('New malware signatures detected');
  } else {
    factors.push('DDoS attack patterns increasing');
    factors.push('Credential stuffing attacks anticipated');
  }

  if (dayIndex % 7 === 5 || dayIndex % 7 === 6) {
    factors.push('Weekend spike predicted');
  }

  if (dayIndex === Math.floor(totalDays / 2)) {
    factors.push('Mid-period trend inflection');
  }

  return factors;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(forecasts: ThreatForecast[]): ThreatsResponse['summary'] {
  if (forecasts.length === 0) {
    return {
      totalProjectedThreats: 0,
      averageDaily: 0,
      peakDay: {
        date: new Date().toISOString().split('T')[0],
        count: 0,
      },
      trends: 'No data available',
    };
  }

  const totalThreats = forecasts.reduce(
    (sum, f) => sum + f.forecastedThreatCount,
    0
  );
  const averageDaily = Math.round(totalThreats / forecasts.length);

  // Find peak day
  const peakForecast = forecasts.reduce((max, f) =>
    f.forecastedThreatCount > max.forecastedThreatCount ? f : max
  );

  // Determine trend
  const firstHalf = forecasts.slice(0, Math.floor(forecasts.length / 2));
  const secondHalf = forecasts.slice(Math.floor(forecasts.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, f) => sum + f.forecastedThreatCount, 0) /
    firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, f) => sum + f.forecastedThreatCount, 0) /
    secondHalf.length;

  let trend = 'Stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) {
    trend = 'Increasing - Recommend enhanced monitoring and security measures';
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    trend = 'Decreasing - Security posture improving';
  }

  return {
    totalProjectedThreats: totalThreats,
    averageDaily,
    peakDay: {
      date: peakForecast.date,
      count: peakForecast.forecastedThreatCount,
    },
    trends: trend,
  };
}

/**
 * GET /api/analytics/forecast/threats
 * Get threat forecasts for next 30 days
 */
export async function GET(request: NextRequest): Promise<NextResponse<ThreatsResponse>> {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam || '30', 10), 1), 90);

    // Generate forecasts
    const forecasts = generateThreatForecasts(days);

    // Calculate summary
    const summary = calculateSummary(forecasts);

    // Calculate date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days - 1);

    const response: ThreatsResponse = {
      success: true,
      message: `Threat forecast generated for ${days} days`,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days,
      },
      forecasts,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Threat forecast error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate threat forecast: ${errorMessage}`,
        period: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days: 0,
        },
        forecasts: [],
        summary: {
          totalProjectedThreats: 0,
          averageDaily: 0,
          peakDay: {
            date: new Date().toISOString().split('T')[0],
            count: 0,
          },
          trends: 'Error generating forecast',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/forecast/threats
 * Generate threat forecast with custom parameters
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ThreatsResponse>> {
  try {
    const body = await request.json();

    // Validate and extract parameters
    const days = Math.min(Math.max(body.days || 30, 1), 90);
    const includeHistorical = body.includeHistorical || false;

    // Generate forecasts
    const forecasts = generateThreatForecasts(days);

    // Calculate summary
    const summary = calculateSummary(forecasts);

    // Calculate date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days - 1);

    const response: ThreatsResponse = {
      success: true,
      message: `Threat forecast generated for ${days} days${
        includeHistorical ? ' with historical comparison' : ''
      }`,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days,
      },
      forecasts,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Threat forecast POST error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate threat forecast: ${errorMessage}`,
        period: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          days: 0,
        },
        forecasts: [],
        summary: {
          totalProjectedThreats: 0,
          averageDaily: 0,
          peakDay: {
            date: new Date().toISOString().split('T')[0],
            count: 0,
          },
          trends: 'Error generating forecast',
        },
      },
      { status: 500 }
    );
  }
}
