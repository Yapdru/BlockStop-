'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * ML Threat Detection Interface
 * LSTM & CNN models for advanced threat detection
 */
export default function MLThreatDetectionPage() {
  const [selectedModel, setSelectedModel] = useState<'lstm' | 'cnn' | 'hybrid'>('hybrid');
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/max/ml-detection/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ML Threat Detection</h1>
        <p className="text-gray-600">LSTM & CNN models for threat prediction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Model Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'lstm', name: 'LSTM Model', desc: 'Sequential analysis' },
              { id: 'cnn', name: 'CNN Model', desc: 'Spatial patterns' },
              { id: 'hybrid', name: 'Hybrid Ensemble', desc: 'Combined approach' },
            ].map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id as any)}
                className={`w-full p-3 border rounded-lg text-left transition ${
                  selectedModel === model.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-sm">{model.name}</p>
                <p className="text-xs text-gray-600">{model.desc}</p>
              </button>
            ))}

            <Button onClick={runPrediction} disabled={loading} className="w-full">
              {loading ? 'Analyzing...' : 'Run Prediction'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>Real-time threat predictions</CardDescription>
          </CardHeader>
          <CardContent>
            {predictions ? (
              <div className="space-y-6">
                {/* Threat Level */}
                <div>
                  <label className="text-sm font-semibold block mb-2">Overall Threat Level</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            predictions.score > 0.7
                              ? 'bg-red-500'
                              : predictions.score > 0.4
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${(predictions.score || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-bold text-lg w-20 text-right">
                      {((predictions.score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Model Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                    <p className="text-lg font-bold">
                      {(predictions.accuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <p className="text-lg font-bold">
                      {(predictions.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Precision</p>
                    <p className="text-lg font-bold">
                      {(predictions.precision * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Recall</p>
                    <p className="text-lg font-bold">
                      {(predictions.recall * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Detected Patterns */}
                {predictions.patterns && predictions.patterns.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold block mb-2">Detected Patterns</label>
                    <div className="space-y-2">
                      {predictions.patterns.map((pattern: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-semibold text-sm">{pattern.name}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Confidence: {(pattern.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500">Run prediction to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Details */}
      <Card>
        <CardHeader>
          <CardTitle>Model Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">LSTM Model</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 3 LSTM layers (256, 128, 64 units)</li>
                <li>• Recurrent dropout: 0.2</li>
                <li>• Dense output: 5 threat classes</li>
                <li>• Trained on: Sequential threat data</li>
                <li>• Best for: Time-series analysis</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">CNN Model</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 4 Convolutional blocks</li>
                <li>• Filters: 32, 64, 128, 256</li>
                <li>• Batch normalization enabled</li>
                <li>• Dense layers: 512, 256</li>
                <li>• Best for: Spatial pattern detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
