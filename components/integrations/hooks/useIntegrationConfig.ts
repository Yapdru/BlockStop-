'use client';

import { useState, useCallback } from 'react';
import { IntegrationConfig } from '@/types/integrations';
import axios from 'axios';

interface ConfigField {
  name: string;
  type: 'text' | 'password' | 'email' | 'url' | 'number' | 'checkbox' | 'select';
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

interface UseIntegrationConfigReturn {
  config: IntegrationConfig | null;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  fetchConfig: (integrationId: string) => Promise<IntegrationConfig>;
  saveConfig: (integrationId: string, config: Record<string, any>) => Promise<IntegrationConfig>;
  validateConfig: (config: Record<string, any>, fields: ConfigField[]) => Record<string, string>;
}

export function useIntegrationConfig(): UseIntegrationConfigReturn {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateConfig = useCallback((config: Record<string, any>, fields: ConfigField[]): Record<string, string> => {
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      const value = config[field.name];

      // Check required fields
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors[field.name] = `${field.label} is required`;
        return;
      }

      // Skip validation for empty optional fields
      if (!value && !field.required) {
        return;
      }

      // Validate based on type
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field.name] = 'Invalid email address';
          }
          break;

        case 'url':
          try {
            new URL(value);
          } catch {
            errors[field.name] = 'Invalid URL';
          }
          break;

        case 'number':
          if (isNaN(Number(value))) {
            errors[field.name] = 'Must be a number';
          }
          if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
            errors[field.name] = `Must be at least ${field.validation.min}`;
          }
          if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
            errors[field.name] = `Must be at most ${field.validation.max}`;
          }
          break;

        case 'text':
        case 'password':
          if (field.validation?.minLength && value.length < field.validation.minLength) {
            errors[field.name] = `Must be at least ${field.validation.minLength} characters`;
          }
          if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            errors[field.name] = `Must be at most ${field.validation.maxLength} characters`;
          }
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              errors[field.name] = 'Invalid format';
            }
          }
          break;
      }
    });

    return errors;
  }, []);

  const fetchConfig = useCallback(async (integrationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<IntegrationConfig>(
        `/api/integrations/${integrationId}/config`
      );

      setConfig(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch configuration';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (integrationId: string, newConfig: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.put<IntegrationConfig>(
        `/api/integrations/${integrationId}/config`,
        { config: newConfig }
      );

      setConfig(response.data);
      setValidationErrors({});
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    config,
    loading,
    error,
    validationErrors,
    fetchConfig,
    saveConfig,
    validateConfig,
  };
}
