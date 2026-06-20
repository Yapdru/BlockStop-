// Integration Management UI
'use client';

import { useState, useEffect } from 'react';

interface Integration {
  id: string;
  name: string;
  type: string;
  category: string;
  enabled: boolean;
  createdAt: string;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  requiredFields: any[];
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchTemplates();
  }, []);

  async function fetchIntegrations() {
    try {
      const response = await fetch('/api/v1/integrations');
      const data = await response.json();
      setIntegrations(data.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  }

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/v1/integrations/templates');
      const data = await response.json();
      setTemplates(data.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }

  async function handleCreateIntegration() {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || selectedTemplate.name,
          type: selectedTemplate.type,
          category: selectedTemplate.type,
          config: {
            parameters: formData,
            authentication: 'api_key',
            testable: true,
          },
        }),
      });

      if (response.ok) {
        setShowSetupWizard(false);
        setFormData({});
        setSelectedTemplate(null);
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleIntegration(id: string, enabled: boolean) {
    try {
      await fetch(`/api/v1/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      fetchIntegrations();
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  }

  async function testIntegration(id: string) {
    try {
      const response = await fetch(`/api/v1/integrations/${id}/test`, {
        method: 'POST',
      });
      alert(response.ok ? 'Integration test passed!' : 'Integration test failed');
    } catch (error) {
      console.error('Failed to test integration:', error);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-600">
          Connect BlockStop with your favorite tools and platforms
        </p>
      </div>

      {/* Active Integrations */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Active Integrations</h2>
        {integrations.length === 0 ? (
          <p className="text-gray-500">No integrations configured yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(integration => (
              <div
                key={integration.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <p className="text-sm text-gray-500">{integration.type}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => testIntegration(integration.id)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    Test
                  </button>
                  <button
                    onClick={() =>
                      toggleIntegration(integration.id, integration.enabled)
                    }
                    className={`px-3 py-1 text-sm rounded ${
                      integration.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {integration.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Integrations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition"
              onClick={() => {
                setSelectedTemplate(template);
                setShowSetupWizard(true);
              }}
            >
              <h3 className="font-semibold mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {template.description}
              </p>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Wizard */}
      {showSetupWizard && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Configure {selectedTemplate.name}
            </h2>

            <div className="space-y-4 mb-6">
              {selectedTemplate.requiredFields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          [field.name]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full border rounded px-3 py-2"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          [field.name]: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'password' ? 'password' : 'text'}
                      value={formData[field.name] || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          [field.name]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full border rounded px-3 py-2"
                    />
                  )}
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mt-1">
                      {field.helpText}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSetupWizard(false);
                  setFormData({});
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIntegration}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
