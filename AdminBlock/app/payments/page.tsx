'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/AdminLayout';
import { PaymentCard } from '@/components/PaymentCard';
import { getNetAdmin, PaymentRecord } from '@/lib/NetAdmin';

type PaymentTier = 'all' | 'free' | 'pro' | 'enterprise';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [selectedTier, setSelectedTier] = useState<PaymentTier>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const netAdmin = getNetAdmin();

      try {
        const data = await netAdmin.getPayments(100);
        setPayments(data);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = payments;

    // Filter by tier
    if (selectedTier !== 'all') {
      filtered = filtered.filter(p => p.tier === selectedTier);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        p =>
          p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [payments, selectedTier, searchTerm]);

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    totalAmount: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    successRate:
      payments.length > 0
        ? (payments.filter(p => p.status === 'completed').length / payments.length) * 100
        : 0,
    refunded: payments.filter(p => p.status === 'refunded').length,
  };

  const handleExportCSV = async () => {
    const netAdmin = getNetAdmin();
    const csv = await netAdmin.exportPaymentsCSV();

    if (csv) {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', `payments_${new Date().getTime()}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-admin-text">Payments</h1>
            <button
              onClick={handleExportCSV}
              className="bg-admin-accent hover:bg-blue-600 text-white px-4 py-2 rounded-admin text-sm font-medium transition-colors"
            >
              📥 Export CSV
            </button>
          </div>
          <p className="text-admin-text-muted">
            Real-time payment tracking and analytics
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Payments', value: stats.total, icon: '💳' },
            { label: 'Completed', value: stats.completed, icon: '✓' },
            { label: 'Total Revenue', value: `$${stats.totalAmount.toFixed(2)}`, icon: '💰' },
            { label: 'Success Rate', value: `${stats.successRate.toFixed(1)}%`, icon: '📈' },
            { label: 'Refunded', value: stats.refunded, icon: '↩️' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-admin-card border border-admin-border rounded-admin p-4"
            >
              <p className="text-admin-text-muted text-sm mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-admin-text">{stat.value}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user name or payment ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-admin-card border border-admin-border rounded-admin px-4 py-2 text-admin-text placeholder-admin-text-muted focus:outline-none focus:border-admin-accent"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'free', 'pro', 'enterprise'] as PaymentTier[]).map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-admin text-sm font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-admin-accent text-white'
                    : 'bg-admin-card border border-admin-border text-admin-text hover:border-admin-accent/50'
                }`}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Payments List */}
        {!loading && (
          <motion.div variants={itemVariants} className="space-y-3">
            {filteredPayments.length > 0 ? (
              <div>
                <p className="text-sm text-admin-text-muted mb-4">
                  Showing {filteredPayments.length} of {payments.length} payments
                </p>
                <div className="grid grid-cols-1 gap-3 max-h-[800px] overflow-y-auto">
                  {filteredPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <PaymentCard payment={payment} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-admin-text-muted py-8">
                {searchTerm || selectedTier !== 'all'
                  ? 'No payments match your filters'
                  : 'No payments found'}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            variants={itemVariants}
            className="bg-admin-card border border-admin-border rounded-admin p-8 text-center"
          >
            <div className="inline-block animate-spin text-3xl mb-4">⚙️</div>
            <p className="text-admin-text-muted">Loading payments...</p>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
