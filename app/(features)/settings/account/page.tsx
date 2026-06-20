'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Input, Badge } from '@/components';
import { a11y } from '@/lib/a11y';

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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
      setIsDeleteOpen(false);
      setDeletePassword('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setErrors({ delete: 'Failed to request account deletion' });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center" id="main-content" tabIndex={-1}>
        <div className="text-neutral-600" role="status">Loading account settings...</div>
      </main>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded"
        onClick={(e) => {
          e.preventDefault();
          const main = document.querySelector('#main-content');
          if (main instanceof HTMLElement) {
            main.focus();
          }
        }}
      >
        Skip to main content
      </a>

      <main id="main-content" className="min-h-screen bg-neutral-50 pb-24 md:pb-0" tabIndex={-1}>
        {/* Header */}
        <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
          <div className="container-max py-4 flex items-center gap-4">
            <Link href="/settings" className="text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium rounded">
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">
              <span aria-hidden="true">👤</span>
              {' '}Account Settings
            </h1>
          </div>
        </header>

        <div className="container-max py-8 space-y-6">
          {/* Messages */}
          {errors.form && (
            <div role="alert" className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg">
              <span aria-hidden="true">❌</span>
              {' '}{errors.form}
            </div>
          )}

          {success && (
            <div role="status" aria-live="polite" aria-atomic="true" className="bg-success/10 border border-success/20 text-success p-4 rounded-lg">
              <span aria-hidden="true">✅</span>
              {' '}{success}
            </div>
          )}

        {/* Account Information */}
        {profile && (
          <Card padding="lg">
            <div className="mb-4">
              <h2 className="text-h4 font-bold text-neutral-900">Account Information</h2>
              <p className="text-sm text-neutral-600 mt-1">Your account details</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-xs text-neutral-600">Email Address</p>
                  <p className="font-medium text-neutral-900">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-xs text-neutral-600">Account Created</p>
                  <p className="font-medium text-neutral-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {profile.lastLogin && (
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="text-xs text-neutral-600">Last Login</p>
                    <p className="font-medium text-neutral-900">{new Date(profile.lastLogin).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Change Email */}
        <Card padding="lg">
          <div className="mb-4">
            <h2 className="text-h4 font-bold text-neutral-900">Change Email</h2>
            <p className="text-sm text-neutral-600 mt-1">Update your email address</p>
          </div>

          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label htmlFor="new-email" className="block text-sm font-medium text-neutral-900 mb-2">
                New Email Address
              </label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                error={errors.email}
                placeholder="your@email.com"
                aria-describedby={errors.email ? "email-error" : undefined}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              />
              {errors.email && <div id="email-error" className="text-sm text-danger mt-1">{errors.email}</div>}
            </div>

            <Button variant="primary" className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" aria-label="Update email address">
              Update Email
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card padding="lg">
          <div className="mb-4">
            <h2 className="text-h4 font-bold text-neutral-900">Change Password</h2>
            <p className="text-sm text-neutral-600 mt-1">Update your account password</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-neutral-900 mb-2">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={errors.currentPassword}
                placeholder="Enter current password"
                aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              />
              {errors.currentPassword && <div id="current-password-error" className="text-sm text-danger mt-1">{errors.currentPassword}</div>}
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-neutral-900 mb-2">
                New Password <span id="password-hint" className="text-xs text-neutral-600">(min 8 characters)</span>
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
                placeholder="Enter new password"
                aria-describedby={errors.newPassword ? "new-password-error" : "password-hint"}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              />
              {errors.newPassword && <div id="new-password-error" className="text-sm text-danger mt-1">{errors.newPassword}</div>}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-900 mb-2">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="Confirm new password"
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              />
              {errors.confirmPassword && <div id="confirm-password-error" className="text-sm text-danger mt-1">{errors.confirmPassword}</div>}
            </div>

            <Button variant="primary" className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" aria-label="Change password">
              Change Password
            </Button>
          </form>
        </Card>

        {/* Delete Account */}
        <Card padding="lg" className="border-danger/20 bg-danger/5">
          <div className="mb-4">
            <h2 className="text-h4 font-bold text-danger">Delete Account</h2>
            <p className="text-sm text-neutral-600 mt-1">Permanently delete your account and all associated data</p>
          </div>

          <div className="bg-white border border-danger/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-neutral-700">
              <span aria-hidden="true">⚠️</span>
              {' '}This action cannot be undone. You will have a 30-day grace period to cancel the deletion before it becomes permanent.
            </p>
          </div>

          <Button
            variant="danger"
            className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger"
            onClick={() => setIsDeleteOpen(true)}
            aria-label="Request account deletion"
          >
            Request Account Deletion
          </Button>
        </Card>

        {/* Delete Confirmation Modal */}
        {isDeleteOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card padding="lg" className="max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
              <h3 id="delete-dialog-title" className="text-h4 font-bold text-danger mb-2">Delete Account?</h3>
              <p className="text-sm text-neutral-600 mb-6">
                Enter your password to confirm. This cannot be undone.
              </p>

              <div className="mb-6">
                <label htmlFor="delete-password" className="block text-sm font-medium text-neutral-900 mb-2">
                  Confirm Password
                </label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  error={errors.delete}
                  placeholder="Enter your password"
                  aria-describedby={errors.delete ? "delete-error" : undefined}
                  className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                />
                {errors.delete && <div id="delete-error" className="text-sm text-danger mt-1">{errors.delete}</div>}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={() => setIsDeleteOpen(false)}
                  aria-label="Cancel account deletion"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger"
                  onClick={handleDeleteAccount}
                  aria-label="Confirm account deletion"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
