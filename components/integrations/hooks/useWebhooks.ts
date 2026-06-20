'use client';

import { useState, useCallback } from 'react';
import { Webhook, WebhookDelivery } from '@/types/integrations';
import axios from 'axios';

interface UseWebhooksReturn {
  webhooks: Webhook[];
  deliveries: WebhookDelivery[];
  loading: boolean;
  error: string | null;
  createWebhook: (integrationId: string, data: Partial<Webhook>) => Promise<Webhook>;
  updateWebhook: (webhookId: string, data: Partial<Webhook>) => Promise<Webhook>;
  deleteWebhook: (webhookId: string) => Promise<void>;
  testWebhook: (webhookId: string, payload: Record<string, any>) => Promise<void>;
  getDeliveries: (webhookId: string) => Promise<WebhookDelivery[]>;
  retryDelivery: (deliveryId: string) => Promise<void>;
}

export function useWebhooks(): UseWebhooksReturn {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWebhook = useCallback(async (integrationId: string, data: Partial<Webhook>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post<Webhook>(
        `/api/integrations/${integrationId}/webhooks`,
        data
      );

      const newWebhook = response.data;
      setWebhooks([...webhooks, newWebhook]);
      return newWebhook;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create webhook';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [webhooks]);

  const updateWebhook = useCallback(async (webhookId: string, data: Partial<Webhook>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.patch<Webhook>(
        `/api/webhooks/${webhookId}`,
        data
      );

      const updated = response.data;
      setWebhooks(webhooks.map(w => w.id === webhookId ? updated : w));
      return updated;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update webhook';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [webhooks]);

  const deleteWebhook = useCallback(async (webhookId: string) => {
    try {
      setLoading(true);
      setError(null);

      await axios.delete(`/api/webhooks/${webhookId}`);
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete webhook';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [webhooks]);

  const testWebhook = useCallback(async (webhookId: string, payload: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(`/api/webhooks/${webhookId}/test`, payload);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to test webhook';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeliveries = useCallback(async (webhookId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<WebhookDelivery[]>(
        `/api/webhooks/${webhookId}/deliveries`
      );

      setDeliveries(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch deliveries';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryDelivery = useCallback(async (deliveryId: string) => {
    try {
      setLoading(true);
      setError(null);

      await axios.post(`/api/deliveries/${deliveryId}/retry`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retry delivery';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    webhooks,
    deliveries,
    loading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    getDeliveries,
    retryDelivery,
  };
}
