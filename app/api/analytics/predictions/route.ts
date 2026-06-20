import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { PredictionResponse } from '@/types/analytics';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    // Verify tier access
    if (!['MAX'].includes(auth.context.scopes?.tier || 'free')) {
      return NextResponse.json(
        { error: 'Threat predictions require MAX tier' },
        { status: 403 }
      );
    }

    const predictions: PredictionResponse = {
      nextThreatType: {
        threatType: 'Ransomware',
        probability: 0.72,
        confidence: 0.85,
        timeframe: '7-14 days',
        reasoning:
          'Pattern analysis suggests increasing ransomware activity targeting similar infrastructure',
      },
      riskForecasts: {
        sevenDay: {
          period: '7day',
          riskScore: 72.5,
          trend: 'increasing',
          predictedThreats: [
            {
              threatType: 'Ransomware',
              probability: 0.72,
              confidence: 0.85,
              timeframe: 'Within 7 days',
              reasoning: 'Increased attacker activity detected',
            },
            {
              threatType: 'Phishing',
              probability: 0.58,
              confidence: 0.78,
              timeframe: 'Within 3-7 days',
              reasoning: 'Seasonal increase in phishing campaigns',
            },
          ],
          recommendations: [
            'Increase monitoring of email gateways and file transfers',
            'Update ransomware signatures and behavioral detection',
            'Conduct awareness training for end users',
            'Review and strengthen backup procedures',
            'Implement additional access controls for sensitive data',
          ],
          confidence: 0.83,
        },
        thirtyDay: {
          period: '30day',
          riskScore: 65.3,
          trend: 'stable',
          predictedThreats: [
            {
              threatType: 'Ransomware',
              probability: 0.65,
              confidence: 0.79,
              timeframe: 'Within 30 days',
              reasoning: 'Sustained threat landscape',
            },
            {
              threatType: 'Data Exfiltration',
              probability: 0.54,
              confidence: 0.71,
              timeframe: 'Within 15-30 days',
              reasoning: 'Emerging threat actor pattern',
            },
          ],
          recommendations: [
            'Implement DLP (Data Loss Prevention) solutions',
            'Review network segmentation strategy',
            'Audit user access permissions',
            'Increase security awareness training frequency',
          ],
          confidence: 0.76,
        },
      },
      attackVectorRecommendations: [
        {
          vector: 'Email-based Attacks',
          likelihood: 0.8,
          impact: 'high',
          mitigation:
            'Deploy advanced email filtering, implement DMARC/SPF/DKIM, enable sandboxing',
          priority: 1,
        },
        {
          vector: 'VPN/Remote Access Exploitation',
          likelihood: 0.65,
          impact: 'critical',
          mitigation: 'Enforce MFA on all remote access, update VPN firmware, monitor logs',
          priority: 2,
        },
        {
          vector: 'Supply Chain Attack',
          likelihood: 0.45,
          impact: 'high',
          mitigation:
            'Assess third-party security posture, implement vendor risk management program',
          priority: 3,
        },
        {
          vector: 'Insider Threat',
          likelihood: 0.35,
          impact: 'critical',
          mitigation:
            'Implement user behavior analytics, audit privileged access, enhance logging',
          priority: 4,
        },
      ],
      timestamp: new Date(),
    };

    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Predictions error:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}
