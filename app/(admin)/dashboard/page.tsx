/**
 * BlockAdmin Phase 31.1 - Admin Dashboard
 * Main dashboard with statistics and user management interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UserManager } from '@/lib/admin/user-manager';
import { VerificationService } from '@/lib/admin/verification-service';
import { NetLinkIntegration } from '@/lib/admin/netlink-integration';
import { AdminRolesManager } from '@/lib/admin/admin-roles';
import { DashboardStats } from '@/types/admin';

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userEmail?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [verificationStats, setVerificationStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user stats
      const userStats = await UserManager.getDashboardStats();
      setStats(userStats);

      // Load payment stats
      const payments = await NetLinkIntegration.getPaymentStats();
      setPaymentStats(payments);

      // Load admin stats
      const admins = await AdminRolesManager.getAdminStats();
      setAdminStats(admins);

      // Load verification stats
      const verifications = await VerificationService.getVerificationStats();
      setVerificationStats(verifications);

      // Generate recent activity (mock data for now)
      generateRecentActivity();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = () => {
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'user_verified',
        description: 'User successfully verified',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        userEmail: 'user@example.com',
      },
      {
        id: '2',
        type: 'payment_confirmed',
        description: 'Payment verification completed',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'user_flagged',
        description: 'User flagged for manual review',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'admin_assigned',
        description: 'Admin role assigned',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ];

    setRecentActivity(activities);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">BlockAdmin Phase 31.1 - User Verification & Payment System</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Verified Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Verified Users</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.verifiedUsers || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Payment Verified */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Payment Verified</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats?.paymentVerifiedUsers || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Flagged Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Flagged Users</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats?.flaggedUsers || 0}
              </p>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0 0v2m0-2h2m-2 0h-2m-4-4a9 9 0 1118 0 9 9 0 01-18 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Verifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Pending Verifications</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {stats?.pendingVerifications || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Awaiting user action
          </p>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Active Users</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {stats?.activeUsers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Currently active accounts
          </p>
        </div>

        {/* Admin Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Admin Users</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {adminStats?.totalAdmins || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Total admin accounts
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Statistics
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Payments</span>
              <span className="font-bold text-gray-900">
                {paymentStats?.totalPayments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmed</span>
              <span className="font-bold text-green-600">
                {paymentStats?.confirmedPayments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-bold text-yellow-600">
                {paymentStats?.pendingPayments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Failed</span>
              <span className="font-bold text-red-600">
                {paymentStats?.failedPayments || 0}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="font-bold text-gray-900">
                  ${paymentStats?.totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Verification Statistics
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Attempts</span>
              <span className="font-bold text-gray-900">
                {verificationStats?.totalAttempts || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Successful</span>
              <span className="font-bold text-green-600">
                {verificationStats?.successfulVerifications || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-bold text-yellow-600">
                {verificationStats?.pendingVerifications || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Failed</span>
              <span className="font-bold text-red-600">
                {verificationStats?.failedVerifications || 0}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Avg Attempts</span>
                <span className="font-bold text-gray-900">
                  {verificationStats?.averageAttemptsPerVerification?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <p className="text-gray-900 font-medium">
                  {activity.type === 'user_verified' && 'User Verified'}
                  {activity.type === 'payment_confirmed' && 'Payment Confirmed'}
                  {activity.type === 'user_flagged' && 'User Flagged'}
                  {activity.type === 'admin_assigned' && 'Admin Role Assigned'}
                </p>
                {activity.userEmail && (
                  <p className="text-sm text-gray-600">{activity.userEmail}</p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href="/admin/users"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          Manage Users
        </a>
        <a
          href="/admin/verification"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          Verify Users
        </a>
        <a
          href="/admin/payments"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          Payment Status
        </a>
        <a
          href="/admin/settings"
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          Settings
        </a>
      </div>
    </div>
  );
}
