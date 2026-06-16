'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getTierById } from '@/lib/tiers/tier-definitions';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TierGateProps {
  requiredTier: 'free' | 'pro';
  requiredFeature?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TierGate({
  requiredTier,
  requiredFeature,
  children,
  fallback,
}: TierGateProps) {
  const { data: session, status } = useSession();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (session?.user && (session.user as { id?: string }).id) {
      const fetchUserTier = async () => {
        try {
          const response = await fetch('/api/user/tier');
          if (response.ok) {
            const data = await response.json();
            const tier = data.tier as 'free' | 'pro';

            if (requiredFeature) {
              const tierDef = getTierById(tier === 'pro' ? 2 : 1);
              const hasFeature = tierDef?.features[requiredFeature] === true;
              setHasAccess(tier === requiredTier || (requiredTier === 'free' && tier === 'pro') || hasFeature);
            } else {
              setHasAccess(tier === requiredTier || (requiredTier === 'free' && tier === 'pro'));
            }
          }
        } catch (error) {
          console.error('Failed to fetch user tier:', error);
        }
      };

      fetchUserTier();
    }
  }, [session, requiredTier, requiredFeature]);

  if (status === 'loading') {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!session) {
    return (
      fallback || (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
        >
          <p className="text-gray-700 mb-3">
            Please sign in to access this feature.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Sign In
          </Link>
        </motion.div>
      )
    );
  }

  if (!hasAccess) {
    return (
      fallback || (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center"
        >
          <p className="text-gray-700 mb-3">
            {requiredFeature
              ? `Feature "${requiredFeature}" is available on PRO plan`
              : 'This feature is available on PRO plan'}
          </p>
          <Link
            href="/upgrade"
            className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Upgrade to PRO
          </Link>
        </motion.div>
      )
    );
  }

  return <>{children}</>;
}
