'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      {description && (
        <p className="text-xs text-gray-600 mb-2">{description}</p>
      )}

      {children}

      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
