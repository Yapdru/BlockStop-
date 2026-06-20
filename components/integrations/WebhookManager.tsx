'use client';

import React, { useState, useEffect } from 'react';
import { Webhook, WebhookEvent } from '@/types/integrations';
import { useWebhooks } from './hooks/useWebhooks';
import { ConfirmationDialog } from '@/components/settings/ConfirmationDialog';

interface WebhookManagerProps {
  integrationId: string;
}

const AVAILABLE_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'scan_complete', label: 'Scan Complete' },
  { value: 'threat_detected', label: 'Threat Detected' },
  { value: 'file_quarantined', label: 'File Quarantined' },
  { value: 'user_action', label: 'User Action' },
];

export function WebhookManager({ integrationId }: WebhookManagerProps) {
  const { webhooks, createWebhook, updateWebhook, deleteWebhook } = useWebhooks();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || selectedEvents.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      await createWebhook(integrationId, {
        url,
        events: selectedEvents,
        isActive: true,
        secret: '',
        id: '',
        integrationId,
        createdAt: new Date(),
      });

      setUrl('');
      setSelectedEvents([]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (webhookId: string) => {
    setSelectedWebhookId(webhookId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedWebhookId) {
      try {
        await deleteWebhook(selectedWebhookId);
        setShowDeleteConfirm(false);
        setSelectedWebhookId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete webhook');
      }
    }
  };

  const handleToggleEvent = (event: WebhookEvent) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Webhooks</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Webhook'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Add Webhook Form */}
      {showForm && (
        <form onSubmit={handleAddWebhook} className="bg-light-surface rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-domain.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Subscribe to Events
            </label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map(event => (
                <label key={event.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.value)}
                    onChange={() => handleToggleEvent(event.value)}
                    className="w-4 h-4 rounded border-light-border"
                  />
                  <span className="text-sm text-gray-700">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!url.trim() || selectedEvents.length === 0 || isLoading}
            className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Webhook'}
          </button>
        </form>
      )}

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <div className="bg-light-surface rounded-lg p-6 text-center">
            <p className="text-gray-600">No webhooks configured</p>
            <p className="text-sm text-gray-500 mt-1">Add your first webhook to start receiving events</p>
          </div>
        ) : (
          webhooks.map(webhook => (
            <div key={webhook.id} className="bg-white border border-light-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{webhook.url}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        webhook.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {webhook.events.map(event => (
                      <span
                        key={event}
                        className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded"
                      >
                        {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                      </span>
                    ))}
                  </div>
                  {webhook.lastTriggered && (
                    <p className="text-xs text-gray-500">
                      Last triggered: {new Date(webhook.lastTriggered).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteClick(webhook.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-600 break-all">
                Delivery Rate: {(webhook.deliveryRate * 100).toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Webhook"
        description="This webhook will no longer receive events. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedWebhookId(null);
        }}
      />
    </div>
  );
}
