'use client';

import React, { useState, useEffect } from 'react';
import { useIntegrationConfig } from './hooks/useIntegrationConfig';

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

interface IntegrationConfigUIProps {
  integrationId: string;
  fields: ConfigField[];
  onSave?: (config: Record<string, any>) => void;
}

export function IntegrationConfigUI({
  integrationId,
  fields,
  onSave,
}: IntegrationConfigUIProps) {
  const { config, loading, error, validationErrors, fetchConfig, saveConfig, validateConfig } =
    useIntegrationConfig();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loaded = await fetchConfig(integrationId);
        setFormData(loaded.config || {});
      } catch (err) {
        console.error('Failed to fetch config:', err);
      }
    };

    loadConfig();
  }, [integrationId, fetchConfig]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    setIsDirty(true);

    // Clear error for this field
    if (localErrors[fieldName]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors = validateConfig(formData, fields);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      await saveConfig(integrationId, formData);
      setIsDirty(false);
      onSave?.(formData);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: ConfigField) => {
    const value = formData[field.name];
    const fieldError = localErrors[field.name] || validationErrors[field.name];

    switch (field.type) {
      case 'checkbox':
        return (
          <label key={field.name} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-light-border"
              disabled={isSaving}
            />
            <div>
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          </label>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}

            <select
              value={value || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                fieldError ? 'border-red-500' : 'border-light-border'
              }`}
              disabled={isSaving}
            >
              <option value="">Select an option</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {fieldError && (
              <p className="text-xs text-red-600 mt-1">{fieldError}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}

            <input
              type={field.type}
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                fieldError ? 'border-red-500' : 'border-light-border'
              }`}
              disabled={isSaving}
            />

            {fieldError && (
              <p className="text-xs text-red-600 mt-1">{fieldError}</p>
            )}
          </div>
        );
    }
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-6">
            {fields.map(field => renderField(field))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-light-border">
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>

            {isDirty && (
              <button
                type="button"
                onClick={() => {
                  if (config) {
                    setFormData(config.config || {});
                  }
                  setIsDirty(false);
                  setLocalErrors({});
                }}
                className="px-6 py-2 border border-light-border text-gray-700 font-semibold rounded-lg hover:bg-light-surface transition"
              >
                Discard Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
