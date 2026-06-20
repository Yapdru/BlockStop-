'use client';

import React, { useState, useEffect } from 'react';
import { LineChart } from '@/app/components/charts/LineChart';
import { BarChart } from '@/app/components/charts/BarChart';
import { GaugeChart } from '@/app/components/charts/GaugeChart';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button } from '@/components';
import { PredictionResponse } from '@/types/analytics';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';

export default function AnalyticsPredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError('');
      const userId = localStorage.getItem('userId');

      const response = await fetch('/api/analytics/predictions', {
        headers: { 'x-user-id': userId || '' },
      });

      if (!response.ok) throw new Error('Failed to fetch predictions');
      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPredictions();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-danger/10 text-danger p-4 rounded-lg">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  const riskData = [
    {
      period: '7 Days',
      risk: predictions?.riskForecasts.sevenDay.riskScore || 0,
      confidence: predictions?.riskForecasts.sevenDay.confidence || 0,
    },
    {
      period: '30 Days',
      risk: predictions?.riskForecasts.thirtyDay.riskScore || 0,
      confidence: predictions?.riskForecasts.thirtyDay.confidence || 0,
    },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Threat Predictions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                AI-powered threat forecasting and risk recommendations
              </p>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} size="lg">
              {refreshing ? 'Refreshing...' : 'Refresh Predictions'}
            </Button>
          </div>

          {/* Next Threat Type Prediction */}
          <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border border-primary-200 dark:border-primary-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Next Most Likely Threat
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Threat Type</div>
                <div className="text-3xl font-bold text-primary-600">
                  {predictions?.nextThreatType.threatType || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Probability</div>
                <div className="text-3xl font-bold text-accent-500">
                  {((predictions?.nextThreatType.probability || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Confidence</div>
                <div className="text-3xl font-bold text-success">
                  {((predictions?.nextThreatType.confidence || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Analysis</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {predictions?.nextThreatType.reasoning || 'No analysis available'}
              </p>
            </div>
          </Card>

          {/* Risk Forecasts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Forecast */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                7-Day Risk Forecast
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm font-bold text-primary-600">
                      {predictions?.riskForecasts.sevenDay.riskScore.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        (predictions?.riskForecasts.sevenDay.riskScore || 0) > 70
                          ? 'bg-danger'
                          : (predictions?.riskForecasts.sevenDay.riskScore || 0) > 40
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                      style={{
                        width: `${predictions?.riskForecasts.sevenDay.riskScore || 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Trend
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        predictions?.riskForecasts.sevenDay.trend === 'increasing'
                          ? 'bg-danger/20 text-danger'
                          : predictions?.riskForecasts.sevenDay.trend === 'decreasing'
                          ? 'bg-success/20 text-success'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {predictions?.riskForecasts.sevenDay.trend || 'stable'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Confidence
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                      {((predictions?.riskForecasts.sevenDay.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 30-Day Forecast */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                30-Day Risk Forecast
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm font-bold text-primary-600">
                      {predictions?.riskForecasts.thirtyDay.riskScore.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        (predictions?.riskForecasts.thirtyDay.riskScore || 0) > 70
                          ? 'bg-danger'
                          : (predictions?.riskForecasts.thirtyDay.riskScore || 0) > 40
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                      style={{
                        width: `${predictions?.riskForecasts.thirtyDay.riskScore || 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Trend
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        predictions?.riskForecasts.thirtyDay.trend === 'increasing'
                          ? 'bg-danger/20 text-danger'
                          : predictions?.riskForecasts.thirtyDay.trend === 'decreasing'
                          ? 'bg-success/20 text-success'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {predictions?.riskForecasts.thirtyDay.trend || 'stable'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Confidence
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                      {((predictions?.riskForecasts.thirtyDay.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Predicted Threats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Predicted Threats (7-Day Window)
            </h2>
            <div className="space-y-3">
              {predictions?.riskForecasts.sevenDay.predictedThreats.map((threat, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {threat.threatType}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {threat.reasoning}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {(threat.probability * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">probability</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      Timeframe: {threat.timeframe}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        threat.confidence > 0.8
                          ? 'bg-success/20 text-success'
                          : threat.confidence > 0.5
                          ? 'bg-warning/20 text-warning'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      Confidence: {(threat.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Attack Vector Recommendations */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Attack Vector Recommendations
            </h2>
            <div className="space-y-3">
              {predictions?.attackVectorRecommendations.map((vector, idx) => (
                <div
                  key={idx}
                  className="p-4 border-l-4 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {vector.vector}
                    </h4>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          vector.impact === 'critical'
                            ? 'bg-danger/20 text-danger'
                            : vector.impact === 'high'
                            ? 'bg-warning/20 text-warning'
                            : vector.impact === 'medium'
                            ? 'bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            : 'bg-success/20 text-success'
                        }`}
                      >
                        {vector.impact.toUpperCase()}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {(vector.likelihood * 100).toFixed(0)}% likelihood
                      </span>
                      <span className="text-xs bg-accent-100/50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 px-2 py-1 rounded">
                        Priority {vector.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Mitigation:</strong> {vector.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6 bg-success/10 dark:bg-success/5 border border-success/30">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recommended Actions
            </h2>
            <ul className="space-y-2">
              {predictions?.riskForecasts.sevenDay.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-success font-bold mt-0.5">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
