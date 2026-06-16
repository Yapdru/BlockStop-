'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { FormField } from '@/components/settings/FormField';
import { ConfirmationDialog } from '@/components/settings/ConfirmationDialog';

interface AccountProfile {
  id: number;
  email: string;
  name?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export default function AccountSettings() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/settings/account/profile');
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setName(data.data.name || '');
        setNewEmail(data.data.email);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!newPassword) newErrors.newPassword = 'New password is required';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await fetch('/api/settings/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error });
        return;
      }

      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setErrors({ form: 'Failed to change password' });
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newEmail) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await fetch('/api/settings/account/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error });
        return;
      }

      setSuccess('Email updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setErrors({ form: 'Failed to update email' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setErrors({ delete: 'Password is required' });
      return;
    }

    try {
      const response = await fetch('/api/settings/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ delete: data.error });
        return;
      }

      setSuccess('Account deletion scheduled. You have 30 days to change your mind.');
      setIsDeleteDialogOpen(false);
      setDeletePassword('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setErrors({ delete: 'Failed to request account deletion' });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex items-center justify-center">
        <div className="animate-spin text-primary-600">⏳</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/settings" className="text-primary-600 hover:text-primary-700">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">👤 Account Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Error */}
          {errors.form && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {errors.form}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              ✓ {success}
            </motion.div>
          )}

          {/* Profile Info */}
          {profile && (
            <SettingsSection title="Account Information" icon="ℹ️">
              <div className="space-y-4">
                <div className="p-3 bg-light-surface rounded-lg">
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{profile.email}</p>
                </div>
                <div className="p-3 bg-light-surface rounded-lg">
                  <p className="text-xs text-gray-600">Account Created</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {profile.lastLogin && (
                  <div className="p-3 bg-light-surface rounded-lg">
                    <p className="text-xs text-gray-600">Last Login</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(profile.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </SettingsSection>
          )}

          {/* Change Password */}
          <SettingsSection title="Change Password" icon="🔑">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <FormField
                label="Current Password"
                error={errors.currentPassword}
              >
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </FormField>

              <FormField
                label="New Password"
                description="At least 8 characters"
                error={errors.newPassword}
              >
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </FormField>

              <FormField
                label="Confirm Password"
                error={errors.confirmPassword}
              >
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </FormField>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
              >
                Change Password
              </button>
            </form>
          </SettingsSection>

          {/* Change Email */}
          <SettingsSection title="Change Email" icon="📧">
            <form onSubmit={handleEmailChange} className="space-y-4">
              <FormField
                label="New Email Address"
                error={errors.email}
              >
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </FormField>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
              >
                Update Email
              </button>
            </form>
          </SettingsSection>

          {/* Delete Account */}
          <SettingsSection
            title="Delete Account"
            description="Permanently delete your account and all associated data"
            icon="🗑️"
            className="border-red-200 bg-red-50"
          >
            <p className="text-sm text-red-700 mb-4">
              This action cannot be undone. You have a 30-day grace period to cancel the deletion.
            </p>

            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              Request Account Deletion
            </button>
          </SettingsSection>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Account?"
        description="Enter your password to confirm account deletion. You have 30 days to cancel this request."
        confirmText="Delete Account"
        cancelText="Cancel"
        isDangerous
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </main>
  );
}
