'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface CustomIntegration {
  name: string;
  description: string;
  baseUrl: string;
  apiKey?: string;
  headers: Record<string, string>;
  authType: 'none' | 'api-key' | 'bearer' | 'basic';
  webhookEnabled: boolean;
}

interface APITest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export function IntegrationBuilder() {
  const [step, setStep] = useState<'design' | 'test' | 'configure' | 'deploy'>('design');
  const [integration, setIntegration] = useState<CustomIntegration>({
    name: '',
    description: '',
    baseUrl: '',
    headers: {},
    authType: 'none',
    webhookEnabled: false,
  });

  const [testRequest, setTestRequest] = useState<APITest>({
    method: 'GET',
    path: '',
  });

  const [testResult, setTestResult] = useState<{
    status: number;
    data: any;
    error?: string;
    duration: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIntegrationChange = (field: keyof CustomIntegration, value: any) => {
    setIntegration(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHeaderChange = (key: string, value: string) => {
    setIntegration(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        [key]: value,
      },
    }));
  };

  const handleAddHeader = () => {
    setIntegration(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        'X-Custom-Header': '',
      },
    }));
  };

  const handleRemoveHeader = (key: string) => {
    setIntegration(prev => ({
      ...prev,
      headers: Object.fromEntries(
        Object.entries(prev.headers).filter(([k]) => k !== key)
      ),
    }));
  };

  const handleTestAPI = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();
      const url = `${integration.baseUrl}${testRequest.path}`;

      const config: any = {
        method: testRequest.method,
        headers: { ...integration.headers, ...testRequest.headers },
      };

      if (integration.authType === 'api-key') {
        config.headers['X-API-Key'] = integration.apiKey;
      } else if (integration.authType === 'bearer') {
        config.headers['Authorization'] = `Bearer ${integration.apiKey}`;
      } else if (integration.authType === 'basic' && integration.apiKey) {
        config.headers['Authorization'] = `Basic ${btoa(integration.apiKey)}`;
      }

      if (testRequest.body) {
        config.data = testRequest.body;
      }

      const response = await axios(url, config);
      const duration = Date.now() - startTime;

      setTestResult({
        status: response.status,
        data: response.data,
        duration,
      });
    } catch (err: any) {
      const duration = Date.now() - (performance.now() - (err.response?.duration || 0));
      setTestResult({
        status: err.response?.status || 0,
        data: err.response?.data || null,
        error: err.message,
        duration: Math.round(duration),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!integration.name || !integration.baseUrl) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await axios.post('/api/integrations/custom', integration);

      alert('Integration deployed successfully!');
      setStep('deploy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy integration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Custom Integration Builder</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {['design', 'test', 'configure', 'deploy'].map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => setStep(s as any)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                step === s || (i < ['design', 'test', 'configure', 'deploy'].indexOf(step))
                  ? 'bg-primary-600 text-white'
                  : 'bg-light-surface text-gray-500'
              }`}
            >
              {i + 1}
            </button>
            {i < 3 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full ${
                  ['design', 'test', 'configure', 'deploy'].indexOf(step) > i
                    ? 'bg-primary-600'
                    : 'bg-light-surface'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-light-border rounded-lg p-8">
        {step === 'design' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Design Your Integration</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Integration Name *
                </label>
                <input
                  type="text"
                  placeholder="My Custom Integration"
                  value={integration.name}
                  onChange={(e) => handleIntegrationChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe what this integration does"
                  value={integration.description}
                  onChange={(e) => handleIntegrationChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Base URL *
                </label>
                <input
                  type="url"
                  placeholder="https://api.example.com"
                  value={integration.baseUrl}
                  onChange={(e) => handleIntegrationChange('baseUrl', e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Authentication Type
                </label>
                <select
                  value={integration.authType}
                  onChange={(e) => handleIntegrationChange('authType', e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="none">None</option>
                  <option value="api-key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>

              {integration.authType !== 'none' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    API Key / Token
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your API key or token"
                    value={integration.apiKey || ''}
                    onChange={(e) => handleIntegrationChange('apiKey', e.target.value)}
                    className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={integration.webhookEnabled}
                    onChange={(e) => handleIntegrationChange('webhookEnabled', e.target.checked)}
                    className="w-4 h-4 rounded border-light-border"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Webhook Support</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-light-border">
              <button
                onClick={() => setStep('test')}
                disabled={!integration.name || !integration.baseUrl}
                className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                Next: Test API
              </button>
            </div>
          </div>
        )}

        {step === 'test' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Test API Connection</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  HTTP Method
                </label>
                <select
                  value={testRequest.method}
                  onChange={(e) => setTestRequest(prev => ({ ...prev, method: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Path
                </label>
                <input
                  type="text"
                  placeholder="/v1/status"
                  value={testRequest.path}
                  onChange={(e) => setTestRequest(prev => ({ ...prev, path: e.target.value }))}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Headers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Headers
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHeader}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Header
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(integration.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Header name"
                        value={key}
                        readOnly
                        className="flex-1 px-3 py-2 border border-light-border rounded-lg text-xs bg-gray-50"
                      />
                      <input
                        type="text"
                        placeholder="Header value"
                        value={value}
                        onChange={(e) => handleHeaderChange(key, e.target.value)}
                        className="flex-1 px-3 py-2 border border-light-border rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeader(key)}
                        className="px-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {testResult && (
                <div className={`rounded-lg p-4 ${testResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold mb-2 ${testResult.error ? 'text-red-900' : 'text-green-900'}`}>
                    {testResult.error ? 'Request Failed' : `Status: ${testResult.status}`}
                  </p>
                  <pre className="text-xs overflow-auto max-h-40 bg-gray-900 text-gray-100 p-2 rounded">
                    {JSON.stringify(testResult.data || testResult.error, null, 2)}
                  </pre>
                  <p className={`text-xs mt-2 ${testResult.error ? 'text-red-700' : 'text-green-700'}`}>
                    Response Time: {testResult.duration}ms
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-light-border">
              <button
                onClick={() => setStep('design')}
                className="px-6 py-2 border border-light-border text-gray-700 font-semibold rounded-lg hover:bg-light-surface transition"
              >
                Back
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleTestAPI}
                  disabled={!testRequest.path || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Send Request'}
                </button>

                <button
                  onClick={() => setStep('configure')}
                  className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
                >
                  Next: Configure
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Configure & Deploy</h4>

            <div className="bg-light-surface p-6 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Name</span>
                <span className="text-gray-900">{integration.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Base URL</span>
                <span className="text-gray-900 text-sm">{integration.baseUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Auth Type</span>
                <span className="text-gray-900">{integration.authType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Webhooks</span>
                <span className="text-gray-900">{integration.webhookEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-light-border">
              <button
                onClick={() => setStep('test')}
                className="px-6 py-2 border border-light-border text-gray-700 font-semibold rounded-lg hover:bg-light-surface transition"
              >
                Back
              </button>

              <button
                onClick={handleDeploy}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Deploying...' : 'Deploy Integration'}
              </button>
            </div>
          </div>
        )}

        {step === 'deploy' && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✓</div>
            <h4 className="text-2xl font-bold text-green-600 mb-2">Successfully Deployed!</h4>
            <p className="text-gray-600">Your custom integration is now live and ready to use.</p>
          </div>
        )}
      </div>
    </div>
  );
}
