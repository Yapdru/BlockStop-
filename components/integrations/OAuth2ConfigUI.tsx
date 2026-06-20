'use client';

import React, { useState } from 'react';
import { OAuthProvider, OAuthCredentials } from '@/types/integrations';
import axios from 'axios';
import { ConfirmationDialog } from '@/components/settings/ConfirmationDialog';

interface OAuth2ConfigUIProps {
  integrationId: string;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

const OAUTH_PROVIDERS: Record<OAuthProvider, {
  name: string;
  icon: string;
  defaultScopes: string[];
}> = {
  google: {
    name: 'Google',
    icon: '🔍',
    defaultScopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    defaultScopes: ['user:email', 'read:user'],
  },
  slack: {
    name: 'Slack',
    icon: '💬',
    defaultScopes: ['users:read', 'chat:write'],
  },
  microsoft: {
    name: 'Microsoft',
    icon: '🪟',
    defaultScopes: ['user.read', 'mail.read'],
  },
};

export function OAuth2ConfigUI({ integrationId }: OAuth2ConfigUIProps) {
  const [credentials, setCredentials] = useState<OAuthCredentials | null>(null);
  const [config, setConfig] = useState<Partial<OAuthConfig>>({});
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider>('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const provider = OAUTH_PROVIDERS[selectedProvider];

  const handleGenerateAuthUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post<{ authUrl: string }>(
        `/api/integrations/${integrationId}/oauth/auth-url`,
        { provider: selectedProvider, scopes: provider.defaultScopes }
      );

      setAuthUrl(response.data.authUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate auth URL');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await axios.post(
        `/api/integrations/${integrationId}/oauth/config`,
        { provider: selectedProvider, config }
      );

      setConfig({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);

      await axios.delete(
        `/api/integrations/${integrationId}/oauth/${selectedProvider}`
      );

      setCredentials(null);
      setShowDisconnect(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">OAuth2 Configuration</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(OAUTH_PROVIDERS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedProvider(key as OAuthProvider);
                setAuthUrl(null);
              }}
              className={`p-4 rounded-lg border-2 transition ${
                selectedProvider === key
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-light-border hover:border-primary-300'
              }`}
            >
              <div className="text-2xl mb-2">{value.icon}</div>
              <p className="font-semibold text-gray-900">{value.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveConfig} className="bg-light-surface rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client ID
          </label>
          <input
            type="text"
            placeholder="Your OAuth2 Client ID"
            value={config.clientId || ''}
            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
            className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client Secret
          </label>
          <input
            type="password"
            placeholder="Your OAuth2 Client Secret"
            value={config.clientSecret || ''}
            onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
            className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Redirect URI
          </label>
          <input
            type="url"
            placeholder="https://your-app.com/oauth/callback"
            value={config.redirectUri || ''}
            onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
            className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Scopes: {provider.defaultScopes.join(', ')}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !config.clientId || !config.clientSecret || !config.redirectUri}
          className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      {/* Auth Flow */}
      {!credentials ? (
        <div className="bg-white border border-light-border rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Connect Account</h4>
          <p className="text-sm text-gray-600 mb-4">
            Click below to authorize this integration with {provider.name}
          </p>

          {authUrl ? (
            <div className="space-y-4">
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition text-center"
              >
                {provider.icon} Authorize with {provider.name}
              </a>
              <button
                onClick={() => setAuthUrl(null)}
                className="w-full px-4 py-2 border border-light-border text-gray-700 font-semibold rounded-lg hover:bg-light-surface transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateAuthUrl}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Auth URL'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-green-900 mb-1">✓ Connected</h4>
              <p className="text-sm text-green-700">
                Your {provider.name} account is connected
              </p>
              {credentials.expiresAt && (
                <p className="text-xs text-green-600 mt-2">
                  Expires: {new Date(credentials.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowDisconnect(true)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation */}
      <ConfirmationDialog
        isOpen={showDisconnect}
        title="Disconnect OAuth Account"
        description={`Disconnect your ${provider.name} account? You'll need to re-authenticate to use this integration.`}
        confirmText="Disconnect"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={loading}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnect(false)}
      />
    </div>
  );
}
