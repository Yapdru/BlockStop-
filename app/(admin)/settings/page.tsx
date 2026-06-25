/**
 * BlockAdmin Phase 31.1 - Admin Settings
 * Configuration, admin roles, privacy settings, and system settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AdminRolesManager } from '@/lib/admin/admin-roles';
import { UserManager } from '@/lib/admin/user-manager';
import { PrivacySettingsManager } from '@/lib/admin/privacy-settings';
import { AuditLogger } from '@/lib/admin/audit-logging';
import { AdminUser, User } from '@/types/admin';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'admins' | 'privacy' | 'audit' | 'system'>('admins');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Admins tab
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('moderator');

  // Privacy tab
  const [privacyStats, setPrivacyStats] = useState<any>(null);

  // Audit tab
  const [auditStats, setAuditStats] = useState<any>(null);
  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load admins
      const adminsList = await AdminRolesManager.listAdmins();
      setAdmins(adminsList);

      const stats = await AdminRolesManager.getAdminStats();
      setAdminStats(stats);

      // Load users for assignment
      const usersResult = await UserManager.listUsers({}, { page: 1, pageSize: 1000 });
      setAllUsers(usersResult.data);

      // Load privacy stats
      const privStats = await PrivacySettingsManager.getPrivacyStats();
      setPrivacyStats(privStats);

      // Load audit stats
      const auditStats = await AuditLogger.getAuditStats();
      setAuditStats(auditStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    try {
      setError(null);

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

      await AdminRolesManager.assignAdminRole(
        {
          userId: selectedUserId,
          role: selectedRole as any,
          expiresAt: expiresAt.toISOString(),
        },
        'admin_system'
      );

      setSuccessMessage(`Admin role assigned successfully`);
      setShowAssignModal(false);
      setSelectedUserId('');
      setSelectedRole('moderator');

      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign admin');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Remove this admin?')) return;

    try {
      setError(null);

      await AdminRolesManager.removeAdminRole(userId, 'admin_system');

      setSuccessMessage('Admin role removed');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-1">Manage admins, privacy, audit logs, and system configuration</p>
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          {(['admins', 'privacy', 'audit', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSuccessMessage('');
              }}
              className={`px-6 py-4 font-medium transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'admins'
                ? 'Admin Management'
                : tab === 'privacy'
                ? 'Privacy Settings'
                : tab === 'audit'
                ? 'Audit Logs'
                : 'System'}
            </button>
          ))}
        </div>

        {/* Admin Management Tab */}
        {activeTab === 'admins' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Admin Users</h2>
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                + Assign Admin
              </button>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {adminStats?.totalAdmins || 0}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-purple-600 text-sm">Super Admins</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {adminStats?.superAdmins || 0}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-600 text-sm">Admins</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {adminStats?.admins || 0}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-indigo-600 text-sm">Moderators</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">
                  {adminStats?.moderators || 0}
                </p>
              </div>
            </div>

            {/* Admins Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {admin.userId}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {admin.role === 'super_admin'
                            ? 'Super Admin'
                            : admin.role.charAt(0).toUpperCase() +
                              admin.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(admin.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {admin.expiresAt
                          ? new Date(admin.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleRemoveAdmin(admin.userId)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Privacy Settings Tab */}
        {activeTab === 'privacy' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Privacy Settings Overview
            </h2>

            {privacyStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    User Privacy Preferences
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Users</span>
                      <span className="font-bold">
                        {privacyStats.totalUsers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Public Profiles
                      </span>
                      <span className="font-bold text-green-600">
                        {privacyStats.usersWithPublicProfiles}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Hiding Phone
                      </span>
                      <span className="font-bold text-yellow-600">
                        {privacyStats.usersHidingPhone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Hiding Address
                      </span>
                      <span className="font-bold text-yellow-600">
                        {privacyStats.usersHidingAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Hiding Location
                      </span>
                      <span className="font-bold text-yellow-600">
                        {privacyStats.usersHidingLocation}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Hiding Email
                      </span>
                      <span className="font-bold text-red-600">
                        {privacyStats.usersHidingEmail}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Compliance Notes
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      • Payment-verified users must keep email visible
                    </li>
                    <li>
                      • Users can hide phone, address, and location
                    </li>
                    <li>
                      • Privacy settings are enforced at display time
                    </li>
                    <li>
                      • Admin audit logs track all privacy changes
                    </li>
                    <li>
                      • Payment confirmation badge always visible
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Audit Log Statistics
            </h2>

            {auditStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Overall Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Logs</span>
                      <span className="font-bold">
                        {auditStats.totalLogs}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Total Actions
                      </span>
                      <span className="font-bold">
                        {auditStats.totalActions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Successful
                      </span>
                      <span className="font-bold text-green-600">
                        {auditStats.successfulActions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Failed</span>
                      <span className="font-bold text-red-600">
                        {auditStats.failedActions}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Most Active Admins
                  </h3>
                  <div className="space-y-2">
                    {auditStats.mostActiveAdmins?.slice(0, 5).map(
                      (admin: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {admin.adminId}
                          </span>
                          <span className="font-bold text-green-600">
                            {admin.actionCount} actions
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              System Configuration
            </h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  BlockAdmin Phase 31.1
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Version:</strong> 31.1.0
                  </p>
                  <p>
                    <strong>Status:</strong> Production
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{' '}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Features Enabled
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ User Management & CRUD</li>
                  <li>✓ Real Name Verification</li>
                  <li>✓ Payment Verification (NetLink)</li>
                  <li>✓ Privacy Settings Management</li>
                  <li>✓ OAuth Login Tracking</li>
                  <li>✓ Admin Role Management</li>
                  <li>✓ Comprehensive Audit Logging</li>
                  <li>✓ Compliance Reports</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  API Configuration
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">NetLink API:</span>
                    <span className="block font-mono text-xs text-gray-700 mt-1">
                      {process.env.NETLINK_API_URL || 'https://api.netlink.example.com'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Admin Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Assign Admin Role
            </h2>

            <form onSubmit={handleAssignAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.realName || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p>
                  Admins will be assigned for 1 year from now. You can extend
                  or remove their role anytime.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Assign
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
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
