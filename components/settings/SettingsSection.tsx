'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  className = '',
}: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-light-border ${className}`}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-gray-600 ml-11">{description}</p>
        )}
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
