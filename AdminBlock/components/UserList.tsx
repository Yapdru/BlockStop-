'use client';

import { motion } from 'framer-motion';
import { ActiveUser } from '@/lib/NetAdmin';
import { useState } from 'react';

interface UserListProps {
  users: ActiveUser[];
  onKickUser?: (userId: string) => Promise<void>;
}

const tierConfig = {
  free: 'bg-slate-500/10 text-slate-400',
  pro: 'bg-blue-500/10 text-blue-400',
  enterprise: 'bg-purple-500/10 text-purple-400',
};

export function UserList({ users, onKickUser }: UserListProps) {
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKick = async (userId: string) => {
    if (!onKickUser) return;

    setKickingUserId(userId);
    try {
      await onKickUser(userId);
    } catch (error) {
      console.error('Failed to kick user:', error);
    } finally {
      setKickingUserId(null);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-admin-card border border-admin-border rounded-admin px-4 py-2 text-admin-text placeholder-admin-text-muted focus:outline-none focus:border-admin-accent"
        />
      </div>

      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-admin-text-muted py-8">
            {searchTerm ? 'No users found matching your search' : 'No active users'}
          </div>
        ) : (
          filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-admin-card border border-admin-border rounded-admin p-4 hover:border-admin-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="text-admin-text font-semibold">{user.name}</p>
                      <p className="text-admin-text-muted text-sm">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded ${tierConfig[user.tier]}`}>
                      {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                    </span>

                    <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                      Logged in: {getTimeAgo(user.loginTime)}
                    </span>

                    {user.currentAction && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400">
                        {user.currentAction}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-admin-text-muted">
                    <span>Last activity: {getTimeAgo(user.lastActivity)}</span>
                    {user.ipAddress && <span className="opacity-60">IP: {user.ipAddress}</span>}
                  </div>
                </div>

                {onKickUser && (
                  <button
                    onClick={() => handleKick(user.id)}
                    disabled={kickingUserId === user.id}
                    className="ml-4 px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {kickingUserId === user.id ? 'Kicking...' : 'Kick'}
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
