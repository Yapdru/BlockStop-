'use client';

import React, { useState } from 'react';
import { Integration } from '@/types/integrations';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  example?: {
    request: any;
    response: any;
  };
}

interface APIDocumentationProps {
  integration: Integration;
}

// Sample endpoints
const SAMPLE_ENDPOINTS: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/status',
    description: 'Get integration status',
    example: {
      request: { url: 'GET /api/v1/status' },
      response: {
        status: 'healthy',
        version: '1.0.0',
        uptime: 99.9,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/v1/scan',
    description: 'Initiate a scan',
    parameters: [
      { name: 'file', type: 'file', required: true, description: 'File to scan' },
      { name: 'priority', type: 'string', required: false, description: 'Scan priority (low, medium, high)' },
    ],
    example: {
      request: {
        url: 'POST /api/v1/scan',
        body: { priority: 'high' },
      },
      response: {
        scanId: 'scan_12345',
        status: 'in_progress',
      },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/scan/:scanId',
    description: 'Get scan results',
    parameters: [
      { name: 'scanId', type: 'string', required: true, description: 'Scan identifier' },
    ],
    example: {
      request: { url: 'GET /api/v1/scan/scan_12345' },
      response: {
        scanId: 'scan_12345',
        status: 'completed',
        threatsDetected: 2,
        threats: [],
      },
    },
  },
];

export function APIDocumentation({ integration }: APIDocumentationProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [copyText, setCopyText] = useState<string | null>(null);

  const endpoint = SAMPLE_ENDPOINTS[selectedEndpoint];

  const handleCopyExample = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyText(text);
    setTimeout(() => setCopyText(null), 2000);
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      PATCH: 'bg-purple-100 text-purple-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">API Documentation</h3>

      {/* Info */}
      <div className="bg-light-surface rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-2">{integration.name} API</h4>
        <p className="text-sm text-gray-600 mb-4">
          Complete API reference for {integration.name} integration
        </p>
        <a
          href={integration.documentation}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 font-medium hover:text-primary-700"
        >
          View Full Documentation →
        </a>
      </div>

      {/* Endpoint Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Endpoints</h4>
            <div className="space-y-2">
              {SAMPLE_ENDPOINTS.map((ep, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEndpoint(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedEndpoint === index
                      ? 'bg-primary-100 border border-primary-300'
                      : 'border border-light-border hover:bg-light-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getMethodColor(ep.method)}`}>
                      {ep.method}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{ep.path}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Endpoint Details */}
          <div className="bg-white border border-light-border rounded-lg p-6">
            {/* Header */}
            <div className="mb-6 pb-6 border-b border-light-border">
              <div className="flex items-start gap-3 mb-4">
                <span className={`px-3 py-1 text-sm font-bold rounded ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-gray-900 bg-light-surface px-3 py-1 rounded">
                  {endpoint.path}
                </code>
              </div>
              <p className="text-gray-600">{endpoint.description}</p>
            </div>

            {/* Parameters */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div className="mb-6 pb-6 border-b border-light-border">
                <h5 className="font-semibold text-gray-900 mb-3 text-sm">Parameters</h5>
                <div className="space-y-3">
                  {endpoint.parameters.map((param, index) => (
                    <div key={index} className="bg-light-surface rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-primary-600">{param.name}</code>
                        <span className="text-xs font-medium text-gray-600">{param.type}</span>
                        {param.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{param.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example */}
            {endpoint.example && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 text-sm">Example</h5>

                {/* Request */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Request</p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                    <pre>{JSON.stringify(endpoint.example.request, null, 2)}</pre>
                  </div>
                  <button
                    onClick={() => handleCopyExample(JSON.stringify(endpoint.example.request, null, 2))}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {copyText === JSON.stringify(endpoint.example.request, null, 2) ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Response */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Response</p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                    <pre>{JSON.stringify(endpoint.example.response, null, 2)}</pre>
                  </div>
                  <button
                    onClick={() => handleCopyExample(JSON.stringify(endpoint.example.response, null, 2))}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {copyText === JSON.stringify(endpoint.example.response, null, 2) ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
