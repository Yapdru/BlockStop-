'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Input, Badge } from '@/components';
import { a11y } from '@/lib/a11y';

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesCount: number;
}

export default function SecuritySettings() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisablingConfirm, setIsDisablingConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/settings/security/2fa/status');
      const data = await response.json();
      if (data.success) {
        setTwoFactorStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setError('');
      const response = await fetch('/api/settings/security/2fa/setup', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSecret(data.data.secret);
      setQrCode(data.data.qrCode);
      setIsSetupOpen(true);
    } catch (err) {
      setError('Failed to initialize 2FA setup');
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      setError('');
      const response = await fetch('/api/settings/security/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          token: verificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setBackupCodes(data.data.backupCodes);
      setSuccess('2FA enabled successfully! Save your backup codes.');
      setIsSetupOpen(false);
      await fetchTwoFactorStatus();
    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/settings/security/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSuccess('2FA disabled');
      setPassword('');
      setIsDisablingConfirm(false);
      await fetchTwoFactorStatus();
    } catch (err) {
      setError('Failed to disable 2FA');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading security settings...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0" id="main-content">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="absolute top-0 left-0 p-2 bg-primary-600 text-white rounded-b-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 -translate-y-full focus:translate-y-0 transition-transform"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4 flex items-center gap-4">
          <Link
            href="/settings"
            className="text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded font-medium"
            aria-label="Back to settings"
          >
            ← Back
          </Link>
          <h1 className="text-h3 font-bold text-neutral-900">
            <span aria-hidden="true">🔒</span> Security Settings
          </h1>
        </div>
      </header>

      <div className="container-max py-8 space-y-6">
        {/* Messages */}
        {error && (
          <div
            className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <span aria-hidden="true">❌</span> {error}
          </div>
        )}

        {success && (
          <div
            className="bg-success/10 border border-success/20 text-success p-4 rounded-lg"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <span aria-hidden="true">✅</span> {success}
          </div>
        )}

        {/* Two-Factor Authentication */}
        {!loading && twoFactorStatus && (
          <Card padding="lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-h4 font-bold text-neutral-900">Two-Factor Authentication</h2>
                <p className="text-sm text-neutral-600 mt-1">Add an extra layer of security</p>
              </div>
              <Badge variant={twoFactorStatus.enabled ? 'success' : 'info'}>
                {twoFactorStatus.enabled ? '✓ Enabled' : 'Disabled'}
              </Badge>
            </div>

            {twoFactorStatus.enabled && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-700">
                  {twoFactorStatus.backupCodesCount} backup codes remaining. Keep these safe in case you lose access to your authenticator.
                </p>
              </div>
            )}

            {!twoFactorStatus.enabled ? (
              <Button
                variant="primary"
                onClick={handleSetup2FA}
                className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
                aria-label="Enable two-factor authentication"
              >
                <span aria-hidden="true">🔐</span> Enable 2FA
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => setIsDisablingConfirm(true)}
                className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-600"
                aria-label="Disable two-factor authentication"
              >
                <span aria-hidden="true">⚠️</span> Disable 2FA
              </Button>
            )}
          </Card>
        )}

        {/* 2FA Setup Card */}
        {isSetupOpen && qrCode && (
          <Card padding="lg" className="border-primary-200 bg-primary-50">
            <h3 className="text-h5 font-bold text-neutral-900 mb-4">Setup Two-Factor Authentication</h3>

            <div className="mb-6">
              <p className="text-sm text-neutral-700 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.):
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="2FA QR Code"
                className="w-40 h-40 mx-auto border border-primary-200 rounded-lg"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="verification-code" className="block text-sm font-medium text-neutral-900 mb-2">
                Verification Code <span className="text-xs text-neutral-600">(6 digits)</span>
              </label>
              <Input
                id="verification-code"
                type="text"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg font-mono"
                aria-describedby="code-hint"
              />
              <p id="code-hint" className="text-xs text-neutral-600 mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>

            <Button
              variant="primary"
              onClick={handleVerify2FA}
              disabled={isVerifying || verificationToken.length !== 6}
              className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
              aria-busy={isVerifying}
              aria-label="Verify authentication code and enable two-factor authentication"
            >
              {isVerifying ? 'Verifying...' : <><span aria-hidden="true">✓</span> Verify & Enable 2FA</>}
            </Button>
          </Card>
        )}

        {/* Backup Codes Display */}
        {backupCodes.length > 0 && (
          <Card padding="lg" className="border-accent-200 bg-accent-50">
            <h3 className="text-h5 font-bold text-neutral-900 mb-3">
              ⚠️ Save Your Backup Codes
            </h3>
            <p className="text-sm text-neutral-700 mb-6">
              Keep these codes safe. You can use one to sign in if you lose access to your authenticator app. Each code can be used only once.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div
                  key={i}
                  className="bg-white border border-accent-200 rounded-lg p-3 text-center text-neutral-900"
                >
                  {code}
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join('\n'));
                setSuccess('Backup codes copied!');
                a11y.announce('Backup codes copied to clipboard');
              }}
              className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-600"
              aria-label="Copy all backup codes to clipboard"
            >
              <span aria-hidden="true">📋</span> Copy All Codes
            </Button>
          </Card>
        )}

        {/* Disable 2FA Confirmation */}
        {isDisablingConfirm && twoFactorStatus?.enabled && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card
              padding="lg"
              className="max-w-md w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="disable-2fa-title"
            >
              <h3 id="disable-2fa-title" className="text-h5 font-bold text-danger mb-3">Disable 2FA?</h3>
              <p className="text-sm text-neutral-600 mb-6">
                This will remove the extra security from your account. Confirm with your password.
              </p>

              <div className="mb-6">
                <label htmlFor="confirm-password-2fa" className="block text-sm font-medium text-neutral-900 mb-2">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password-2fa"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-600"
                  onClick={() => {
                    setIsDisablingConfirm(false);
                    setPassword('');
                  }}
                  aria-label="Cancel disable two-factor authentication"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-600"
                  onClick={handleDisable2FA}
                  aria-label="Confirm disable two-factor authentication"
                >
                  Disable
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
