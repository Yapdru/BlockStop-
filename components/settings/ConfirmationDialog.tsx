'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 max-w-md z-50"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>

            <p className="text-gray-600 mb-6">
              {description}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 font-semibold rounded-lg transition disabled:opacity-50 ${
                  isDangerous
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isLoading ? 'Processing...' : confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
