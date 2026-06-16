'use client';

import React, { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export const BillingForm: React.FC<{ onSubmit?: (data: any) => Promise<void> }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    cardName: 'John Doe',
    cardNumber: '4532 •••• •••• 1234',
    expiryMonth: '12',
    expiryYear: '2026',
    cvc: '•••',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
        setSuccess(true);
        setEditMode(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update billing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">Billing information updated!</p>
        </div>
      )}

      {/* Payment Method Card */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg">
        <div className="flex items-start justify-between mb-8">
          <CreditCard className="w-8 h-8" />
          <span className="text-sm font-semibold">VISA</span>
        </div>
        <p className="text-lg tracking-widest mb-8">{formData.cardNumber}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs opacity-75">Card Holder</p>
            <p className="text-sm font-semibold">{formData.cardName}</p>
          </div>
          <div>
            <p className="text-xs opacity-75">Expires</p>
            <p className="text-sm font-semibold">{formData.expiryMonth}/{formData.expiryYear}</p>
          </div>
        </div>
      </div>

      {editMode ? (
        <>
          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Cardholder Name
            </label>
            <input
              type="text"
              value={formData.cardName}
              onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              aria-label="Cardholder name"
            />
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              placeholder="4532 •••• •••• 1234"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              aria-label="Card number"
            />
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Expiry Date
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.expiryMonth}
                  onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                  placeholder="MM"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  aria-label="Expiry month"
                />
                <span className="flex items-center text-gray-700 dark:text-gray-300">/</span>
                <input
                  type="text"
                  value={formData.expiryYear}
                  onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                  placeholder="YY"
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  aria-label="Expiry year"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                CVC
              </label>
              <input
                type="text"
                value={formData.cvc}
                onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                placeholder="•••"
                maxLength={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                aria-label="CVC"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Card'
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setEditMode(true)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          Edit Payment Method
        </button>
      )}

      {/* Billing Address */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Billing Address</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">123 Main Street, Anytown, ST 12345</p>
        <button
          type="button"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Edit Address
        </button>
      </div>
    </form>
  );
};
