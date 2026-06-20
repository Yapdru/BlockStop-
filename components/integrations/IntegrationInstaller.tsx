'use client';

import React, { useState } from 'react';
import { Integration } from '@/types/integrations';
import { useIntegrations } from './hooks/useIntegrations';
import { useIntegrationConfig } from './hooks/useIntegrationConfig';
import { ConfirmationDialog } from '@/components/settings/ConfirmationDialog';

interface IntegrationInstallerProps {
  integration: Integration;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
}

export function IntegrationInstaller({
  integration,
  onSuccess,
  onCancel,
}: IntegrationInstallerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { installIntegration } = useIntegrations();

  const steps: Step[] = [
    {
      id: 1,
      title: 'Review Integration',
      description: 'Review the integration details and permissions',
    },
    {
      id: 2,
      title: 'Configure Settings',
      description: 'Configure required settings for the integration',
    },
    {
      id: 3,
      title: 'Confirm Installation',
      description: 'Review and confirm your installation',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInstall = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await installIntegration(integration.id, config);
      setShowConfirm(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    currentStep >= step.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-light-surface text-gray-500'
                  }`}
                >
                  {step.id}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 mb-4 rounded-full ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-light-surface'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-light-border rounded-lg p-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Review Integration</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{integration.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900">{integration.name}</h4>
                    <p className="text-gray-600">{integration.description}</p>
                  </div>
                </div>

                <div className="bg-light-surface p-4 rounded-lg space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Author</span>
                    <span className="font-medium">{integration.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version</span>
                    <span className="font-medium">{integration.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">{integration.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  This integration will have access to your integration settings and webhook configuration.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Configure Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Endpoint
                </label>
                <input
                  type="url"
                  placeholder="https://api.example.com"
                  value={config.apiEndpoint || ''}
                  onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  placeholder="30"
                  value={config.timeout || ''}
                  onChange={(e) => setConfig({ ...config, timeout: e.target.value })}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enableRetry || false}
                    onChange={(e) => setConfig({ ...config, enableRetry: e.target.checked })}
                    className="w-4 h-4 rounded border-light-border"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable automatic retries</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Confirm Installation</h3>
            <div className="bg-light-surface p-6 rounded-lg space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Integration Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{integration.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">{integration.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Endpoint</span>
                    <span className="font-medium text-xs">{config.apiEndpoint || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                <p className="font-medium mb-1">Important</p>
                <p>This integration will be enabled immediately upon installation. You can manage it from the integrations dashboard.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onCancel || handlePrevious}
          disabled={isLoading}
          className="px-6 py-2 border border-light-border text-gray-700 font-semibold rounded-lg hover:bg-light-surface transition disabled:opacity-50"
        >
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={currentStep === steps.length ? () => setShowConfirm(true) : handleNext}
          disabled={isLoading}
          className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {isLoading ? 'Installing...' : currentStep === steps.length ? 'Install' : 'Next'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirm}
        title="Install Integration"
        description={`Are you sure you want to install ${integration.name}? You can manage it from the integrations dashboard.`}
        confirmText="Install"
        cancelText="Cancel"
        isLoading={isLoading}
        onConfirm={handleInstall}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
