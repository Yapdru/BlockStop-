'use client';

import React, { useState, useEffect } from 'react';
import WebhookTester from '@/components/integrations/webhook-tester';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    isActive: true,
  });

  const availableEvents = [
    'scan.started',
    'scan.completed',
    'threat.detected',
    'file.quarantined',
    'file.deleted',
    'ticket.created',
    'ticket.updated',
    'alert.triggered',
    'integration.connected',
    'integration.disconnected',
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks');
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.url.trim() || formData.events.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setFormData({ name: '', url: '', events: [], isActive: true });
        setShowForm(false);
        loadWebhooks();
      } else {
        alert('Failed to create webhook: ' + data.error);
      }
    } catch (error) {
      alert('Error creating webhook: ' + error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const response = await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (data.success) {
        loadWebhooks();
      } else {
        alert('Failed to delete webhook: ' + data.error);
      }
    } catch (error) {
      alert('Error deleting webhook: ' + error);
    }
  };

  const toggleEventSelection = (event: string) => {
    if (formData.events.includes(event)) {
      setFormData({
        ...formData,
        events: formData.events.filter((e) => e !== event),
      });
    } else {
      setFormData({
        ...formData,
        events: [...formData.events, event],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Webhooks Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Create Webhook'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateWebhook} className="mb-6 p-4 bg-gray-50 rounded">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Slack Notifications"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscribe to Events
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((event) => (
                    <label
                      key={event}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={() => toggleEventSelection(event)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Webhook
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Webhook
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-gray-500">Loading webhooks...</p>
        ) : webhooks.length === 0 ? (
          <p className="text-gray-500">No webhooks configured</p>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{webhook.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          webhook.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{webhook.url}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">
                        Events:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(webhook.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WebhookTester />
    </div>
  );
}
