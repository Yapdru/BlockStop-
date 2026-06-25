'use client';

/**
 * MAX Phase 31.1 - Threat Predictions Dashboard
 * Real-time threat forecasting for 7-day, 30-day, and 90-day horizons
 */

import React, { useState, useEffect, useCallback } from 'react';
import ThreatPredictionEngine from '@/lib/max/phase31/threat-prediction-v2';
import { ThreatPrediction, ForecastHorizon, SeverityLevel } from '@/types/max-phase31';

const ThreatPredictionsDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<ThreatPrediction[]>([]);
  const [horizon, setHorizon] = useState<ForecastHorizon>(ForecastHorizon.SEVEN_DAY);
  const [loading, setLoading] = useState(false);
  const [engine] = useState(() => new ThreatPredictionEngine());
  const [selectedPrediction, setSelectedPrediction] = useState<ThreatPrediction | null>(null);

  // Initialize engine
  useEffect(() => {
    const initialize = async () => {
      await engine.initialize();
    };
    initialize();
  }, [engine]);

  // Load predictions
  const loadPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await engine.predictThreats(horizon);
      setPredictions(result);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  }, [engine, horizon]);

  useEffect(() => {
    loadPredictions();
  }, [horizon, loadPredictions]);

  const getSeverityColor = (severity: SeverityLevel): string => {
    const colors: Record<SeverityLevel, string> = {
      [SeverityLevel.CRITICAL]: 'bg-red-100 text-red-800',
      [SeverityLevel.HIGH]: 'bg-orange-100 text-orange-800',
      [SeverityLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [SeverityLevel.LOW]: 'bg-blue-100 text-blue-800',
      [SeverityLevel.INFO]: 'bg-green-100 text-green-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getProbabilityBar = (probability: number): string => {
    if (probability >= 80) return 'w-full bg-red-500';
    if (probability >= 60) return 'w-3/4 bg-orange-500';
    if (probability >= 40) return 'w-1/2 bg-yellow-500';
    return 'w-1/4 bg-blue-500';
  };

  const getHorizonLabel = (h: ForecastHorizon): string => {
    switch (h) {
      case ForecastHorizon.SEVEN_DAY:
        return '7-Day';
      case ForecastHorizon.THIRTY_DAY:
        return '30-Day';
      case ForecastHorizon.NINETY_DAY:
        return '90-Day';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Threat Predictions Dashboard
          </h1>
          <p className="text-slate-400">
            Advanced AI-powered threat forecasting with 7-day, 30-day, and 90-day horizons
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Forecast Horizon</h2>
            <div className="flex gap-3">
              {Object.values(ForecastHorizon).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    horizon === h
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {getHorizonLabel(h)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Predictions Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                onClick={() => setSelectedPrediction(prediction)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Threat Type */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white capitalize">
                      {prediction.threatType.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Predicted: {prediction.predictedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(prediction.severity)}`}>
                    {prediction.severity.toUpperCase()}
                  </span>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  {/* Probability */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Probability</span>
                      <span className="text-sm font-bold text-white">{prediction.probability.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${getProbabilityBar(prediction.probability)}`}
                        style={{ width: `${prediction.probability}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Confidence</span>
                      <span className="text-sm font-bold text-white">{prediction.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${prediction.confidence}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Affected Assets */}
                  <div>
                    <span className="text-sm font-medium text-slate-300">
                      Affected Assets: {prediction.affectedAssets.length}
                    </span>
                    {prediction.affectedAssets.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prediction.affectedAssets.slice(0, 3).map((asset, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                          >
                            {asset}
                          </span>
                        ))}
                        {prediction.affectedAssets.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                            +{prediction.affectedAssets.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Indicators */}
                  <div>
                    <span className="text-sm font-medium text-slate-300">
                      Threat Indicators: {prediction.indicators.length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Panel */}
        {selectedPrediction && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize mb-2">
                  {selectedPrediction.threatType.replace(/_/g, ' ')} - Detailed Analysis
                </h2>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Prediction Metrics */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Prediction Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Probability:</span>
                      <span className="font-bold text-white">
                        {selectedPrediction.probability.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Confidence:</span>
                      <span className="font-bold text-white">
                        {selectedPrediction.confidence.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Severity:</span>
                      <span className={`font-bold ${getSeverityColor(selectedPrediction.severity)}`}>
                        {selectedPrediction.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Forecast Horizon:</span>
                      <span className="font-bold text-white">
                        {getHorizonLabel(selectedPrediction.forecastHorizon)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Threat Indicators */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Threat Indicators
                  </h3>
                  <div className="space-y-3">
                    {selectedPrediction.indicators.map((indicator, idx) => (
                      <div key={idx} className="p-3 bg-slate-600 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-300">
                            {indicator.type}
                          </span>
                          <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                            {indicator.confidence.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 font-mono break-all">
                          {indicator.value}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Source: {indicator.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Mitigation Steps */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Recommended Mitigations
                  </h3>
                  <ol className="space-y-2">
                    {selectedPrediction.mitigationSteps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Affected Assets */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Potentially Affected Assets
                  </h3>
                  <div className="space-y-2">
                    {selectedPrediction.affectedAssets.map((asset, idx) => (
                      <div key={idx} className="p-2 bg-slate-600 rounded text-slate-200 text-sm">
                        {asset}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Create Incident
                  </button>
                  <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Block Assets
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && predictions.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No predictions available for selected horizon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatPredictionsDashboard;
