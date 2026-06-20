import { NextRequest, NextResponse } from 'next/server';
import { behaviorAnalyzer, AccessRequest } from '@/lib/zero-trust/behavior-analyzer';
import { anomalyDetector } from '@/lib/zero-trust/anomaly-detector-zt';
import { accessPatternAnalyzer } from '@/lib/zero-trust/access-pattern-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deviceId, location, resource, action, userAgent, ipAddress } = body;

    // Validate required parameters
    if (!userId || !deviceId) {
      return NextResponse.json(
        { error: 'userId and deviceId are required' },
        { status: 400 }
      );
    }

    // Create access request object
    const accessRequest: AccessRequest = {
      userId,
      deviceId,
      location: location || 'unknown',
      timestamp: new Date(),
      resource: resource || 'unknown',
      action: action || 'access',
    };

    // Detect behavioral anomalies
    const behaviorAnalysis = await behaviorAnalyzer.detectAnomalies(userId, accessRequest);

    // Real-time anomaly detection
    const accessContext = {
      location: location || 'unknown',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
    };

    const realtimeAnomaly = await anomalyDetector.detectAnomalies(userId, deviceId, accessContext);

    // Analyze access patterns
    const patternAnalysis = await accessPatternAnalyzer.analyzeAccessPatterns(userId);

    // Determine final access decision
    let finalDecision = 'approved';
    let finalReason = 'Access granted';

    if (behaviorAnalysis.severity === 'critical' || (realtimeAnomaly && realtimeAnomaly.severity === 'critical')) {
      finalDecision = 'denied';
      finalReason = 'Critical security anomalies detected - access denied';
    } else if (behaviorAnalysis.severity === 'high' || (realtimeAnomaly && realtimeAnomaly.severity === 'high')) {
      finalDecision = 'challenged';
      finalReason = 'Additional verification required';
    }

    return NextResponse.json({
      success: true,
      data: {
        decision: finalDecision,
        reason: finalReason,
        behaviorAnalysis: {
          anomalyScore: behaviorAnalysis.anomalyScore,
          severity: behaviorAnalysis.severity,
          anomalyCount: behaviorAnalysis.anomalies.length,
          anomalies: behaviorAnalysis.anomalies.map((a) => ({
            type: a.type,
            severity: a.severity,
            description: a.description,
          })),
          recommendation: behaviorAnalysis.recommendation,
        },
        realtimeAnomalies: realtimeAnomaly ? {
          anomalyScore: realtimeAnomaly.anomalyScore,
          severity: realtimeAnomaly.severity,
          type: realtimeAnomaly.anomalyType,
          description: realtimeAnomaly.description,
          requiresAction: realtimeAnomaly.requiresAction,
        } : null,
        accessPatterns: {
          totalPatterns: patternAnalysis.totalPatterns,
          suspiciousCount: patternAnalysis.suspiciousPatterns.length,
          riskLevel: patternAnalysis.riskLevel,
          recommendations: patternAnalysis.recommendations,
        },
        recommendations: [
          ...behaviorAnalysis.recommendation.split('. ').filter((r) => r),
          ...(realtimeAnomaly ? [realtimeAnomaly.description] : []),
          ...patternAnalysis.recommendations,
        ],
      },
    });
  } catch (error) {
    console.error('Behavior analysis error:', error);
    return NextResponse.json(
      { error: 'Behavior analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const analysisType = searchParams.get('type') || 'all';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const results: any = {
      userId,
      timestamp: new Date(),
    };

    // Get behavior baseline
    if (analysisType === 'all' || analysisType === 'baseline') {
      const baseline = await behaviorAnalyzer.buildUserBaseline(userId);
      results.baseline = {
        usualLocations: baseline.usualLocations,
        usualHours: baseline.usualHours,
        knownDevicesCount: baseline.knownDevices.length,
        averageDataVolume: baseline.avgDataVolume,
      };
    }

    // Get recent anomalies
    if (analysisType === 'all' || analysisType === 'anomalies') {
      const recentAnomalies = await anomalyDetector.getRecentAnomalies(userId, 24);
      results.recentAnomalies = recentAnomalies.map((a) => ({
        type: a.anomalyType,
        severity: a.severity,
        score: a.anomalyScore,
        location: a.location,
        time: a.detectedAt,
      }));
    }

    // Get access pattern analysis
    if (analysisType === 'all' || analysisType === 'patterns') {
      const patternAnalysis = await accessPatternAnalyzer.analyzeAccessPatterns(userId);
      results.patterns = {
        totalPatterns: patternAnalysis.totalPatterns,
        riskLevel: patternAnalysis.riskLevel,
        suspiciousCount: patternAnalysis.suspiciousPatterns.length,
        topAccess: patternAnalysis.normalPatterns.slice(0, 5).map((p) => ({
          resource: p.resourceId,
          frequency: p.frequency,
        })),
      };
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Behavior retrieval error:', error);
    return NextResponse.json(
      { error: 'Behavior analysis retrieval failed' },
      { status: 500 }
    );
  }
}
