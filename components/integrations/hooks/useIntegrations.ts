'use client';

import { useState, useEffect, useCallback } from 'react';
import { Integration, InstalledIntegration } from '@/types/integrations';
import axios from 'axios';

interface UseIntegrationsReturn {
  integrations: Integration[];
  installedIntegrations: InstalledIntegration[];
  loading: boolean;
  error: string | null;
  installIntegration: (integrationId: string, config: Record<string, any>) => Promise<void>;
  uninstallIntegration: (integrationId: string) => Promise<void>;
  updateIntegrationConfig: (integrationId: string, config: Record<string, any>) => Promise<void>;
  refreshIntegrations: () => Promise<void>;
}

export function useIntegrations(): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [installedIntegrations, setInstalledIntegrations] = useState<InstalledIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [allRes, installedRes] = await Promise.all([
        axios.get('/api/integrations'),
        axios.get('/api/integrations/installed'),
      ]);

      setIntegrations(allRes.data);
      setInstalledIntegrations(installedRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const installIntegration = useCallback(async (integrationId: string, config: Record<string, any>) => {
    try {
      await axios.post(`/api/integrations/${integrationId}/install`, { config });
      await fetchIntegrations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to install integration');
    }
  }, [fetchIntegrations]);

  const uninstallIntegration = useCallback(async (integrationId: string) => {
    try {
      await axios.post(`/api/integrations/${integrationId}/uninstall`);
      await fetchIntegrations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to uninstall integration');
    }
  }, [fetchIntegrations]);

  const updateIntegrationConfig = useCallback(async (integrationId: string, config: Record<string, any>) => {
    try {
      await axios.patch(`/api/integrations/${integrationId}/config`, { config });
      await fetchIntegrations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update integration config');
    }
  }, [fetchIntegrations]);

  return {
    integrations,
    installedIntegrations,
    loading,
    error,
    installIntegration,
    uninstallIntegration,
    updateIntegrationConfig,
    refreshIntegrations: fetchIntegrations,
  };
}
