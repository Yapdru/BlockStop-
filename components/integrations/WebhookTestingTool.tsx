'use client';

import React, { useState } from 'react';
import { Webhook, WebhookEvent } from '@/types/integrations';
import { useWebhooks } from './hooks/useWebhooks';

interface WebhookTestingToolProps {
  webhook: Webhook;
}

const SAMPLE_PAYLOADS: Record<WebhookEvent, Record<string, any>> = {
  scan_complete: {
    event: 'scan_complete',
    timestamp: new Date().toISOString(),
    data: {
      scanId: 'scan_12345',
      status: 'completed',
      filesScanned: 150,
      threatsDetected: 3,
      duration: 42,
    },
  },
  threat_detected: {
    event: 'threat_detected',
    timestamp: new Date().toISOString(),
    data: {
      threatId: 'threat_67890',
      type: 'malware',
      severity: 'high',
      file: 'suspicious.exe',
      action: 'quarantined',
    },
  },
  file_quarantined: {
    event: 'file_quarantined',
    timestamp: new Date().toISOString(),
    data: {
      fileId: 'file_abc123',
      fileName: 'document.pdf',
      reason: 'contains_malware',
      quarantineLocation: '/quarantine/file_abc123',
    },
  },
  user_action: {
    event: 'user_action',
    timestamp: new Date().toISOString(),
    data: {
      actionId: 'action_xyz789',
      action: 'whitelist_added',
      user: 'admin@company.com',
      resource: 'trusted.com',
    },
  },
};

export function WebhookTestingTool({ webhook }: WebhookTestingToolProps) {
  const { testWebhook, getDeliveries } = useWebhooks();
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent>('scan_complete');
  const [customPayload, setCustomPayload] = useState(JSON.stringify(SAMPLE_PAYLOADS.scan_complete, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    statusCode?: number;
    error?: string;
    duration?: number;
  } | null>(null);

  const handleEventChange = (event: WebhookEvent) => {
    setSelectedEvent(event);
    setCustomPayload(JSON.stringify(SAMPLE_PAYLOADS[event], null, 2));
    setResult(null);
  };

  const handleSendTest = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      const payload = JSON.parse(customPayload);
      const startTime = Date.now();

      await testWebhook(webhook.id, payload);

      const duration = Date.now() - startTime;
      setResult({
        success: true,
        statusCode: 200,
        duration,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send test webhook',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDeliveries = async () => {
    try {
      setIsLoading(true);
      await getDeliveries(webhook.id);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch deliveries',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Test Webhook</h3>

        {/* Event Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Event Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(SAMPLE_PAYLOADS).map(event => (
              <button
                key={event}
                onClick={() => handleEventChange(event as WebhookEvent)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedEvent === event
                    ? 'bg-primary-600 text-white'
                    : 'bg-light-surface text-gray-700 hover:bg-light-border'
                }`}
              >
                {event.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Payload Editor */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payload
          </label>
          <textarea
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            className="w-full h-64 px-4 py-2 border border-light-border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSendTest}
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Test Payload'}
          </button>
          <button
            onClick={handleViewDeliveries}
            disabled={isLoading}
            className="px-6 py-2 border border-light-border text-gray-700 font-semibold rounded-lg hover:bg-light-surface transition disabled:opacity-50"
          >
            View Delivery History
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">
                {result.success ? '✓' : '✗'}
              </span>
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.success ? 'Test Successful' : 'Test Failed'}
                </p>
                {result.statusCode && (
                  <p className={`text-sm mt-1 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Status Code: {result.statusCode}
                  </p>
                )}
                {result.duration && (
                  <p className={`text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Response Time: {result.duration}ms
                  </p>
                )}
                {result.error && (
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
