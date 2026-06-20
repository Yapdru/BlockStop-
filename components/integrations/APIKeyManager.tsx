'use client';

import React, { useState, useEffect } from 'react';
import { APIKey } from '@/types/integrations';
import { useAPIKeys } from './hooks/useAPIKeys';
import { ConfirmationDialog } from '@/components/settings/ConfirmationDialog';

interface APIKeyManagerProps {
  integrationId: string;
}

export function APIKeyManager({ integrationId }: APIKeyManagerProps) {
  const { apiKeys, loading, error, generateAPIKey, revokeAPIKey, fetchAPIKeys, copyToClipboard } = useAPIKeys();
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAPIKeys(integrationId);
  }, [integrationId, fetchAPIKeys]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      setIsGenerating(true);
      await generateAPIKey(integrationId, newKeyName);
      setNewKeyName('');
    } catch (err) {
      console.error('Error generating API key:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeClick = (keyId: string) => {
    setSelectedKeyId(keyId);
    setShowRevokeConfirm(true);
  };

  const handleRevokeConfirm = async () => {
    if (selectedKeyId) {
      try {
        await revokeAPIKey(selectedKeyId);
        setShowRevokeConfirm(false);
        setSelectedKeyId(null);
      } catch (err) {
        console.error('Error revoking API key:', err);
      }
    }
  };

  const handleCopyKey = async (key: string, keyId: string) => {
    try {
      await copyToClipboard(key);
      setCopiedId(keyId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">API Keys</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
            {error}
          </div>
        )}

        {/* Generate New Key Form */}
        <form onSubmit={handleGenerateKey} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Key name (e.g., Production, Testing)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!newKeyName.trim() || isGenerating}
              className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Key'}
            </button>
          </div>
        </form>

        {/* Keys List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="bg-light-surface rounded-lg p-6 text-center">
              <p className="text-gray-600">No API keys generated yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first API key to get started</p>
            </div>
          ) : (
            apiKeys.map(key => (
              <div key={key.id} className="bg-white border border-light-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{key.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Created on {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!key.revokedAt && (
                    <button
                      onClick={() => handleRevokeClick(key.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
                    >
                      Revoke
                    </button>
                  )}
                </div>

                {key.revokedAt && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                    <p className="text-xs text-gray-600">
                      Revoked on {new Date(key.revokedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {!key.revokedAt && (
                  <div className="space-y-3">
                    <div className="bg-light-surface p-3 rounded font-mono text-sm break-all">
                      {key.prefix}****
                    </div>
                    <button
                      onClick={() => handleCopyKey(key.key, key.id)}
                      className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition"
                    >
                      {copiedId === key.id ? 'Copied!' : 'Copy Full Key'}
                    </button>
                  </div>
                )}

                {key.lastUsed && (
                  <p className="text-xs text-gray-500 mt-3">
                    Last used: {new Date(key.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Revoke Confirmation */}
      <ConfirmationDialog
        isOpen={showRevokeConfirm}
        title="Revoke API Key"
        description="This action cannot be undone. Any integrations using this key will stop working."
        confirmText="Revoke"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleRevokeConfirm}
        onCancel={() => {
          setShowRevokeConfirm(false);
          setSelectedKeyId(null);
        }}
      />
    </div>
  );
}
