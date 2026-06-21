'use client';

import { motion } from 'framer-motion';
import { PaymentRecord } from '@/lib/NetAdmin';

interface PaymentCardProps {
  payment: PaymentRecord;
}

const statusConfig = {
  completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  refunded: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
};

const tierConfig = {
  free: 'bg-slate-500/10 text-slate-400',
  pro: 'bg-blue-500/10 text-blue-400',
  enterprise: 'bg-purple-500/10 text-purple-400',
};

export function PaymentCard({ payment }: PaymentCardProps) {
  const statusStyle = statusConfig[payment.status];
  const tierStyle = tierConfig[payment.tier];

  const date = new Date(payment.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-admin-card border border-admin-border rounded-admin p-4 hover:border-admin-accent/50 transition-colors ${statusStyle.bg} ${statusStyle.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-admin-text font-semibold text-sm">{payment.userName}</p>
          <p className="text-admin-text-muted text-xs mt-1">ID: {payment.id.slice(0, 8)}</p>
        </div>
        <div className="text-right">
          <p className="text-admin-text font-bold text-lg">
            {payment.currency === 'USD' ? '$' : ''}{payment.amount.toFixed(2)}
          </p>
          <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${statusStyle.text}`}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-admin-border/50">
        <span className={`text-xs px-2 py-1 rounded ${tierStyle}`}>
          {payment.tier.charAt(0).toUpperCase() + payment.tier.slice(1)}
        </span>
        <span className="text-admin-text-muted text-xs">{date}</span>
      </div>

      {payment.refundedAt && (
        <div className="mt-2 text-xs text-blue-400">
          Refunded: {new Date(payment.refundedAt).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
}
