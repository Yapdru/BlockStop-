'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/AdminLayout';
import { UserList } from '@/components/UserList';
import { getNetAdmin, ActiveUser } from '@/lib/NetAdmin';

type UserFilter = 'all' | 'free' | 'pro' | 'enterprise';

export default function UsersPage() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ActiveUser[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<UserFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const netAdmin = getNetAdmin();

      try {
        const data = await netAdmin.getActiveUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch active users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Refresh every 5 seconds
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = users;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(u => u.tier === selectedFilter);
    }

    setFilteredUsers(filtered);
  }, [users, selectedFilter]);

  const handleKickUser = async (userId: string) => {
    const netAdmin = getNetAdmin();
    const success = await netAdmin.kickUser(userId);

    if (success) {
      setUsers(users.filter(u => u.id !== userId));
    } else {
      alert('Failed to kick user');
    }
  };

  const stats = {
    total: users.length,
    free: users.filter(u => u.tier === 'free').length,
    pro: users.filter(u => u.tier === 'pro').length,
    enterprise: users.filter(u => u.tier === 'enterprise').length,
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
          <h1 className="text-3xl font-bold text-admin-text mb-2">Active Users</h1>
          <p className="text-admin-text-muted">
            Monitor and manage currently logged-in users
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total, icon: '👥', color: 'from-blue-500/20' },
            { label: 'Free Tier', value: stats.free, icon: '🆓', color: 'from-slate-500/20' },
            { label: 'Pro Tier', value: stats.pro, icon: '⭐', color: 'from-purple-500/20' },
            { label: 'Enterprise', value: stats.enterprise, icon: '👑', color: 'from-yellow-500/20' },
          ].map(stat => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} border border-admin-border rounded-admin p-4`}
            >
              <p className="text-admin-text-muted text-sm mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-admin-text">{stat.value}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex gap-2">
          {(['all', 'free', 'pro', 'enterprise'] as UserFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-admin text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-admin-accent text-white'
                  : 'bg-admin-card border border-admin-border text-admin-text hover:border-admin-accent/50'
              }`}
            >
              {filter === 'all' ? 'All Users' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Users List */}
        {!loading && (
          <motion.div variants={itemVariants}>
            <UserList users={filteredUsers} onKickUser={handleKickUser} />
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            variants={itemVariants}
            className="bg-admin-card border border-admin-border rounded-admin p-8 text-center"
          >
            <div className="inline-block animate-spin text-3xl mb-4">⚙️</div>
            <p className="text-admin-text-muted">Loading users...</p>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
