/**
 * BlockAdmin Phase 31.1 - Payment Verification & History
 * Payment confirmation, status checking, and history
 */

'use client';

import React, { useState, useEffect } from 'react';
import { NetLinkIntegration } from '@/lib/admin/netlink-integration';
import { UserManager } from '@/lib/admin/user-manager';
import { NetLinkPayment, PaymentConfirmation } from '@/types/admin';

interface PaymentRecord {
  id: string;
  userId: string;
  email?: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
}

export default function PaymentVerification() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<PaymentRecord['status'] | 'all'>('all');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    transactionId: '',
    amount: '',
    currency: 'USD',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users and their payments
      const allUsers = await UserManager.listUsers({}, { page: 1, pageSize: 1000 });

      let allPayments: PaymentRecord[] = [];

      for (const user of allUsers.data) {
        const userPayments = await NetLinkIntegration.getPaymentHistory(user.id);
        const mapped = userPayments.map((p) => ({
          id: p.id,
          userId: p.userId,
          email: user.email,
          transactionId: p.transactionId,
          amount: p.amount,
          currency: p.currency,
          status: p.status as any,
          createdAt: p.createdAt,
        }));
        allPayments = [...allPayments, ...mapped];
      }

      if (filter !== 'all') {
        allPayments = allPayments.filter((p) => p.status === filter);
      }

      allPayments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPayments(allPayments);

      // Load stats
      const paymentStats = await NetLinkIntegration.getPaymentStats();
      setStats(paymentStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      const amount = parseFloat(formData.amount);
      if (!formData.userId || !formData.transactionId || !amount) {
        setError('All fields are required');
        return;
      }

      const result = await NetLinkIntegration.verifyPayment(
        formData.userId,
        formData.transactionId,
        amount,
        formData.currency
      );

      setSuccessMessage(
        `Payment verified successfully! Status: ${result.status}`
      );

      // Reset form
      setFormData({
        userId: '',
        transactionId: '',
        amount: '',
        currency: 'USD',
      });
      setShowVerifyModal(false);

      // Reload payments
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleCheckStatus = async (transactionId: string, userId: string) => {
    try {
      setError(null);

      const status = await NetLinkIntegration.checkPaymentStatus(
        transactionId,
        userId
      );

      setSuccessMessage(
        `Status: ${status.status} | Amount: ${status.currency} ${status.amount}`
      );

      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status check failed');
    }
  };

  const handleRefund = async (userId: string, transactionId: string) => {
    const reason = prompt('Enter refund reason:');
    if (!reason) return;

    try {
      setError(null);

      await NetLinkIntegration.refundPayment(userId, transactionId, reason);

      setSuccessMessage('Refund processed successfully');
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed');
    }
  };

  const getStatusColor = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payment Verification
          </h1>
          <p className="text-gray-600 mt-1">
            Manage payment confirmations and verification
          </p>
        </div>
        <button
          onClick={() => setShowVerifyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          + Verify Payment
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Payments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats?.totalPayments || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Confirmed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats?.confirmedPayments || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {stats?.pendingPayments || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ${stats?.totalAmount?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          {(['all', 'confirmed', 'pending', 'failed', 'refunded'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  setFilter(tab);
                  setSuccessMessage('');
                }}
                className={`px-6 py-4 font-medium transition ${
                  filter === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'confirmed'
                  ? 'Confirmed'
                  : tab === 'pending'
                  ? 'Pending'
                  : tab === 'failed'
                  ? 'Failed'
                  : 'Refunded'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-gray-900">{payment.email || 'Unknown'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                  {payment.transactionId}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {payment.currency} {payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      payment.status
                    )}`}
                  >
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            handleCheckStatus(
                              payment.transactionId,
                              payment.userId
                            )
                          }
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Check Status
                        </button>
                        <button
                          onClick={() =>
                            handleRefund(
                              payment.userId,
                              payment.transactionId
                            )
                          }
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Refund
                        </button>
                      </>
                    )}
                    {payment.status === 'confirmed' && (
                      <span className="text-green-600 font-medium text-sm">
                        ✓ Verified
                      </span>
                    )}
                    {payment.status !== 'confirmed' &&
                      payment.status !== 'pending' && (
                        <button
                          onClick={() =>
                            handleCheckStatus(
                              payment.transactionId,
                              payment.userId
                            )
                          }
                          className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No {filter !== 'all' ? `${filter} ` : ''}payments found
            </p>
          </div>
        )}
      </div>

      {/* Verify Payment Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verify Payment
            </h2>

            <form onSubmit={handleVerifyPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID *
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData({ ...formData, userId: e.target.value })
                  }
                  placeholder="Enter user ID"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionId: e.target.value })
                  }
                  placeholder="NetLink transaction ID"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
