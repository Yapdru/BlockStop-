'use client';

import React, { useState, useRef } from 'react';

interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  message?: string;
}

export default function WebhookTester() {
  const [webhookId, setWebhookId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WebhookTestResult | null>(null);
  const [history, setHistory] = useState<WebhookTestResult[]>([]);

  const handleTest = async () => {
    if (!webhookId.trim()) {
      setResult({
        success: false,
        error: 'Please enter a webhook ID',
        responseTime: 0,
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookId }),
      });

      const data = await response.json();
      const testResult: WebhookTestResult = {
        success: data.success,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        error: data.error,
        message: data.message,
      };

      setResult(testResult);
      setHistory([testResult, ...history.slice(0, 9)]);
    } catch (error) {
      setResult({
        success: false,
        error: `Request failed: ${error}`,
        responseTime: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Webhook Tester</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookId}
                onChange={(e) => setWebhookId(e.target.value)}
                placeholder="Enter webhook ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTest();
                  }
                }}
              />
              <button
                onClick={handleTest}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <h3
                className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success ? 'Test Passed' : 'Test Failed'}
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                {result.message || result.error}
              </p>
              {result.statusCode && (
                <p className="mt-1 text-sm text-gray-700">
                  Status Code: {result.statusCode}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-700">
                Response Time: {result.responseTime}ms
              </p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Test History</h3>
          <div className="space-y-2">
            {history.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  test.success
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      className={`font-semibold ${
                        test.success
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {test.success ? 'Success' : 'Failed'}
                    </p>
                    {test.error && (
                      <p className="text-sm text-gray-600">
                        {test.error.substring(0, 100)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-500">
                      {test.responseTime}ms
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
