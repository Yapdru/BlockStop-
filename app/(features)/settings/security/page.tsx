'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { FormField } from '@/components/settings/FormField';
import { ConfirmationDialog } from '@/components/settings/ConfirmationDialog';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
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
    setIsDisabling(true);
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
      await fetchTwoFactorStatus();
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/settings" className="text-primary-600 hover:text-primary-700">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">🔒 Security Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              {success}
            </motion.div>
          )}

          {/* Two-Factor Authentication */}
          {!loading && (
            <SettingsSection
              title="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              icon="🔐"
            >
              <div className="flex items-center justify-between p-4 bg-light-surface rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">
                    {twoFactorStatus?.enabled ? '✓ Enabled' : 'Not Enabled'}
                  </p>
                  {twoFactorStatus?.enabled && (
                    <p className="text-xs text-gray-600 mt-1">
                      {twoFactorStatus.backupCodesCount} backup codes remaining
                    </p>
                  )}
                </div>

                {!twoFactorStatus?.enabled ? (
                  <button
                    onClick={handleSetup2FA}
                    className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
                  >
                    Enable 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => setIsDisabling(true)}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    Disable 2FA
                  </button>
                )}
              </div>
            </SettingsSection>
          )}

          {/* 2FA Setup Dialog */}
          {isSetupOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-4">Setup Two-Factor Authentication</h3>

              {qrCode && (
                <div className="mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mx-auto" />
                </div>
              )}

              <FormField
                label="Verification Code"
                description="Enter the 6-digit code from your authenticator app"
                error={error}
              >
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-light-border rounded-lg text-center text-lg font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </FormField>

              <button
                onClick={handleVerify2FA}
                disabled={isVerifying || verificationToken.length !== 6}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
            </motion.div>
          )}

          {/* Backup Codes Display */}
          {backupCodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-6"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-4">
                ⚠️ Save Your Backup Codes
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Keep these codes safe. You can use one to sign in if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="bg-white p-2 rounded border border-amber-200 text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = backupCodes.join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="w-full px-4 py-2 bg-white border border-amber-300 text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition"
              >
                Copy Codes
              </button>
            </motion.div>
          )}

          {/* Disable 2FA Dialog */}
          <ConfirmationDialog
            isOpen={Boolean(isDisabling && twoFactorStatus?.enabled)}
            title="Disable Two-Factor Authentication?"
            description="This will remove the extra security from your account. You'll need to confirm with your password."
            confirmText="Disable"
            cancelText="Cancel"
            isDangerous
            onConfirm={() => handleDisable2FA()}
            onCancel={() => setIsDisabling(false)}
          />
        </motion.div>
      </div>
    </main>
  );
}
