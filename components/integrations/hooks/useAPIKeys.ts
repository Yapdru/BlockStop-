'use client';

import { useState, useCallback } from 'react';
import { APIKey } from '@/types/integrations';
import axios from 'axios';

interface UseAPIKeysReturn {
  apiKeys: APIKey[];
  loading: boolean;
  error: string | null;
  generateAPIKey: (integrationId: string, name: string) => Promise<APIKey>;
  revokeAPIKey: (apiKeyId: string) => Promise<void>;
  fetchAPIKeys: (integrationId: string) => Promise<APIKey[]>;
  copyToClipboard: (text: string) => Promise<void>;
}

export function useAPIKeys(): UseAPIKeysReturn {
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAPIKey = useCallback(async (integrationId: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post<APIKey>(
        `/api/integrations/${integrationId}/keys`,
        { name }
      );

      const newKey = response.data;
      setAPIKeys([...apiKeys, newKey]);
      return newKey;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate API key';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiKeys]);

  const revokeAPIKey = useCallback(async (apiKeyId: string) => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(`/api/keys/${apiKeyId}/revoke`);
      setAPIKeys(apiKeys.filter(k => k.id !== apiKeyId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to revoke API key';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [apiKeys]);

  const fetchAPIKeys = useCallback(async (integrationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<APIKey[]>(
        `/api/integrations/${integrationId}/keys`
      );

      setAPIKeys(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch API keys';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    apiKeys,
    loading,
    error,
    generateAPIKey,
    revokeAPIKey,
    fetchAPIKeys,
    copyToClipboard,
  };
}
