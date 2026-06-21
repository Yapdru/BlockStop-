// Phase 28.1 - Threat Prediction Dashboard
'use client';

import { useEffect, useState } from 'react';
import { threatPredictor, ThreatPrediction, SecurityRecommendation, TimeSeriesForecast } from '@/lib/ai/threat-predictor';
import { Card } from '@/components/Card';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<ThreatPrediction[]>([]);
  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('demo-user');

  useEffect(() => {
    // Simulate loading user threat profile and predictions
    setTimeout(() => {
      // Mock data for demonstration
      const mockPredictions: ThreatPrediction[] = [
        {
          predictedType: 'phishing',
          probability: 85,
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          severity: 'high',
          confidence: 82,
          reasoning: [
            'Historical patterns show increased phishing activity',
            'Similar campaigns detected in past 30 days',
            'Industry threat intelligence indicates rise in phishing',
          ],
          similarHistoricalEvents: [],
        },
        {
          predictedType: 'ransomware',
          probability: 45,
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          severity: 'critical',
          confidence: 68,
          reasoning: [
            'Moderate ransomware activity in your sector',
            'Vulnerability patches pending in your environment',
          ],
          similarHistoricalEvents: [],
        },
        {
          predictedType: 'credential-theft',
          probability: 62,
          timeWindow: {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          severity: 'high',
          confidence: 75,
          reasoning: [
            'Credential theft attempts detected in logs',
            'Similar patterns to previous incidents',
          ],
          similarHistoricalEvents: [],
        },
      ];

      setPredictions(mockPredictions);

      const mockRecommendations: SecurityRecommendation[] = [
        {
          id: 'rec-1',
          title: 'Strengthen Email Security',
          description: 'Based on high phishing prediction, increase email filtering sensitivity and enable advanced threat protection.',
          priority: 'critical',
          category: 'detection',
          affectedThreats: ['phishing'],
          estimatedImpact: 85,
          implementationEffort: 'low',
          resources: ['Email gateway', 'Anti-phishing rules', 'User training'],
        },
        {
          id: 'rec-2',
          title: 'Patch Vulnerable Systems',
          description: 'Critical security patches are available for systems that could be exploited for ransomware attacks.',
          priority: 'critical',
          category: 'prevention',
          affectedThreats: ['ransomware'],
          estimatedImpact: 90,
          implementationEffort: 'medium',
          resources: ['Patch management system', 'Change control', 'Testing'],
        },
        {
          id: 'rec-3',
          title: 'Implement MFA Everywhere',
          description: 'Deploy multi-factor authentication to prevent credential theft attacks.',
          priority: 'high',
          category: 'prevention',
          affectedThreats: ['credential-theft'],
          estimatedImpact: 88,
          implementationEffort: 'high',
          resources: ['MFA solution', 'User enrollment', 'Support resources'],
        },
      ];

      setRecommendations(mockRecommendations);
      setLoading(false);
    }, 1000);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Threat Predictions</h1>
        <p className="text-gray-600">
          ML-based predictions of upcoming threats based on historical patterns and industry trends
        </p>
      </div>

      {/* Risk Level Card */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-red-600">High Risk Level</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your organization has a 74% average threat prediction probability in the next 7 days
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-red-600">74%</div>
            <p className="text-sm text-gray-600">Average Probability</p>
          </div>
        </div>
      </Card>

      {/* Predictions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Next 7-Day Threat Predictions</h2>

        {predictions.map((prediction) => (
          <Card key={prediction.predictedType} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold capitalize">{prediction.predictedType.replace('-', ' ')}</h3>
                <p className="text-sm text-gray-600">
                  {prediction.timeWindow.start.toLocaleDateString()} -{' '}
                  {prediction.timeWindow.end.toLocaleDateString()}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(prediction.severity)}`}>
                {prediction.severity.toUpperCase()}
              </div>
            </div>

            {/* Probability Visualization */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Probability</span>
                <span className="text-lg font-bold">{Math.round(prediction.probability)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    prediction.probability >= 80
                      ? 'bg-red-600'
                      : prediction.probability >= 60
                        ? 'bg-orange-600'
                        : 'bg-yellow-600'
                  }`}
                  style={{ width: `${prediction.probability}%` }}
                />
              </div>
            </div>

            {/* Confidence */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Confidence</span>
                <span className="text-lg font-bold">{Math.round(prediction.confidence)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Why this prediction:</p>
              <ul className="space-y-1">
                {prediction.reasoning.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Security Recommendations</h2>

        {recommendations.map((rec) => (
          <Card key={rec.id} className="p-6 border-l-4 border-l-orange-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{rec.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(rec.priority)}`}>
                {rec.priority.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Estimated Impact</p>
                <p className="text-2xl font-bold mt-1">{rec.estimatedImpact}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Implementation</p>
                <p className="text-lg font-semibold mt-1 capitalize">{rec.implementationEffort}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Resources</p>
                <p className="text-sm font-semibold mt-1">{rec.resources.length} items needed</p>
              </div>
            </div>

            {rec.resources.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Resources Required:</p>
                <div className="flex flex-wrap gap-2">
                  {rec.resources.map((resource) => (
                    <span key={resource} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold">
              Implement Recommendation
            </button>
          </Card>
        ))}
      </div>

      {/* Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-900">About Threat Predictions</h3>
          <p className="text-sm text-blue-800">
            This module uses machine learning to predict upcoming threats based on:
          </p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1 mt-2">
            <li>Your organization's historical threat patterns</li>
            <li>Seasonal and temporal threat trends</li>
            <li>Industry-specific threat intelligence</li>
            <li>Global threat landscape trends</li>
            <li>Your current security posture and vulnerabilities</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
