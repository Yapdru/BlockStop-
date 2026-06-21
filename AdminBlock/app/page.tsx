'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.verifyPasscode(passcode);

      if (response.success) {
        // Store session token
        if (response.data?.token) {
          localStorage.setItem('admin_session', response.data.token);
        }
        router.push('/dashboard');
      } else {
        setError(response.error || 'Invalid passcode');

        // Check if account is locked
        if (response.code === 'RATE_LIMITED') {
          setLocked(true);
          const lockoutTime = parseInt(response.error?.match(/\d+/)?.[0] || '900');
          setLockoutTimeRemaining(lockoutTime);

          // Countdown timer
          const interval = setInterval(() => {
            setLockoutTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                setLocked(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setPasscode('');
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-admin-bg via-admin-card to-admin-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-admin-accent/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Card */}
        <div className="relative bg-admin-card border border-admin-border rounded-admin p-8 shadow-lg">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotateZ: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-4xl mb-4"
            >
              🛡️
            </motion.div>
            <h1 className="text-2xl font-bold text-admin-text mb-2">AdminBlock</h1>
            <p className="text-admin-text-muted text-sm">
              Secure admin dashboard for BlockStop operations
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="block text-sm font-medium text-admin-text mb-2"
              >
                Admin Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                disabled={loading || locked}
                className="w-full bg-admin-bg border border-admin-border rounded-admin px-4 py-3 text-admin-text placeholder-admin-text-muted focus:outline-none focus:border-admin-accent transition-colors disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-admin p-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Lockout Message */}
            {locked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-admin p-3 text-yellow-400 text-sm"
              >
                <p className="font-semibold mb-2">Account temporarily locked</p>
                <p>
                  Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">{formatLockoutTime(lockoutTimeRemaining)}</span>
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || locked || !passcode}
              className="w-full bg-admin-accent hover:bg-blue-600 disabled:bg-admin-accent/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-admin transition-colors duration-200"
            >
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-admin">
            <p className="text-xs text-admin-text-muted leading-relaxed">
              🔒 <span className="font-semibold text-blue-400">Security Notice:</span> This is a
              restricted admin area. All access attempts are logged and monitored. Unauthorized
              access is prohibited.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-admin-text-muted text-xs mt-6">
          AdminBlock v1.0 • {new Date().getFullYear()} BlockStop
        </p>
      </motion.div>
    </div>
  );
}
