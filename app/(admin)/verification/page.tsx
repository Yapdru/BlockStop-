/**
 * BlockAdmin Phase 31.1 - Verification Workflow
 * User identity verification and approval
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UserManager } from '@/lib/admin/user-manager';
import { VerificationService } from '@/lib/admin/verification-service';
import { User, VerificationStatus } from '@/types/admin';

interface VerificationUser {
  id: string;
  email: string;
  realName: string | null;
  phone: string | null;
  verificationStatus: VerificationStatus;
  verificationDate: string | null;
  createdAt: string;
  actions?: string[];
}

export default function VerificationWorkflow() {
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('pending');
  const [selectedUser, setSelectedUser] = useState<VerificationUser | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');

  useEffect(() => {
    loadVerificationUsers();
  }, [filter]);

  const loadVerificationUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await UserManager.listUsers(
        { verificationStatus: filter },
        { page: 1, pageSize: 100 }
      );

      const verificationUsers: VerificationUser[] = result.data.map((user: User) => ({
        id: user.id,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        verificationStatus: user.verificationStatus,
        verificationDate: user.verificationDate,
        createdAt: user.createdAt,
      }));

      setUsers(verificationUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!selectedUser || !verificationCode) return;

    try {
      setError(null);

      const user = await UserManager.getUser(selectedUser.id);
      if (!user) {
        setError('User not found');
        return;
      }

      const result = await UserManager.verifyUserWithCode(
        selectedUser.id,
        verificationCode
      );

      if (result.success && result.user) {
        setVerifyMessage('User successfully verified!');
        setVerificationCode('');
        setShowVerifyModal(false);
        setSelectedUser(null);
        loadVerificationUsers();
      } else {
        setError('Invalid or expired verification code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleAdminApprove = async (userId: string) => {
    try {
      setError(null);

      await UserManager.updateUser(userId, {
        verificationStatus: 'verified',
      });

      setVerifyMessage('User verified by admin');
      loadVerificationUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  const handleFlagUser = async (userId: string) => {
    const reason = prompt('Enter reason for flagging:');
    if (!reason) return;

    try {
      setError(null);

      await UserManager.flagUser(userId, reason);
      setVerifyMessage('User flagged for review');
      loadVerificationUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag user');
    }
  };

  const handleResendCode = async (userId: string) => {
    try {
      setError(null);

      await UserManager.resendVerificationCode(userId);
      setVerifyMessage('Verification code resent to user');
      loadVerificationUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading verification queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Verification</h1>
        <p className="text-gray-600 mt-1">Manage user identity verification and approval</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {verifyMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{verifyMessage}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          {(['all', 'pending', 'verified', 'flagged'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                setVerifyMessage('');
              }}
              className={`px-6 py-4 font-medium transition ${
                filter === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'all'
                ? 'All Users'
                : tab === 'pending'
                ? 'Pending'
                : tab === 'verified'
                ? 'Verified'
                : 'Flagged'}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.realName || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      user.verificationStatus
                    )}`}
                  >
                    {user.verificationStatus.charAt(0).toUpperCase() +
                      user.verificationStatus.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.phone || 'Not provided'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {user.verificationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowVerifyModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleResendCode(user.id)}
                          className="text-green-600 hover:text-green-700 font-medium text-sm"
                        >
                          Resend Code
                        </button>
                        <button
                          onClick={() => handleFlagUser(user.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Flag
                        </button>
                      </>
                    )}
                    {user.verificationStatus === 'flagged' && (
                      <>
                        <button
                          onClick={() => handleAdminApprove(user.id)}
                          className="text-green-600 hover:text-green-700 font-medium text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleFlagUser(user.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Update Flag
                        </button>
                      </>
                    )}
                    {user.verificationStatus === 'verified' && (
                      <span className="text-green-600 font-medium text-sm">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No {filter !== 'all' ? `${filter} ` : ''}users found
            </p>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerifyModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verify User
            </h2>
            <p className="text-gray-600 mb-4">{selectedUser.email}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You can also:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Ask the user to provide their verification code</li>
                  <li>• Verify them manually using admin approval</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleVerifyUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Verify with Code
                </button>
                <button
                  onClick={() => {
                    handleAdminApprove(selectedUser.id);
                    setShowVerifyModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Admin Approve
                </button>
              </div>

              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerificationCode('');
                }}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
