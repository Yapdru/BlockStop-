'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { FormField } from '@/components/settings/FormField';

interface Team {
  id: number;
  name: string;
  createdBy: number;
  maxUsers: number;
}

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  userEmail: string;
  userName?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      setError('');
      const response = await fetch('/api/teams/list');
      const data = await response.json();

      if (data.success) {
        setTeams(data.data);
        if (data.data.length > 0) {
          setSelectedTeam(data.data[0]);
        }
      }
    } catch (err) {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (teamId: number) => {
    try {
      setError('');
      const response = await fetch(`/api/teams/${teamId}/members`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.data);
      }
    } catch (err) {
      setError('Failed to load team members');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    setIsCreating(true);
    try {
      setError('');
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSuccess('Team created successfully!');
      setTeamName('');
      await fetchTeams();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      setError('Email is required');
      return;
    }

    if (!selectedTeam) {
      setError('Select a team first');
      return;
    }

    setIsInviting(true);
    try {
      setError('');
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSuccess('Invitation sent successfully!');
      setInviteEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedTeam) return;

    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setError('');
      const response = await fetch(
        `/api/teams/${selectedTeam.id}/members/${memberId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSuccess('Member removed');
      await fetchMembers(selectedTeam.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove member');
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">👥 Team Management</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Alerts */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              ✓ {success}
            </motion.div>
          )}

          {/* Create Team */}
          <SettingsSection
            title="Create a New Team"
            description="Collaborate with your team members"
            icon="🚀"
          >
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <FormField label="Team Name">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="My Team"
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </FormField>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </SettingsSection>

          {/* Teams List */}
          {teams.length > 0 && (
            <SettingsSection title="Your Teams" icon="📋">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedTeam?.id === team.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-light-border bg-white hover:border-primary-400'
                    }`}
                  >
                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Max {team.maxUsers} members
                    </p>
                  </button>
                ))}
              </div>
            </SettingsSection>
          )}

          {/* Team Members */}
          {selectedTeam && (
            <>
              {/* Invite Members */}
              <SettingsSection
                title={`Invite to ${selectedTeam.name}`}
                description="Add new team members"
                icon="👤"
              >
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <FormField label="Email Address">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </FormField>

                  <FormField label="Role">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                      className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="member">Member (can scan)</option>
                      <option value="admin">Admin (manage team)</option>
                    </select>
                  </FormField>

                  <button
                    type="submit"
                    disabled={isInviting}
                    className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {isInviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </form>
              </SettingsSection>

              {/* Members List */}
              <SettingsSection
                title={`Team Members (${members.length})`}
                icon="👥"
              >
                {members.length === 0 ? (
                  <p className="text-gray-600">No members in this team yet</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-light-surface rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {member.userName || member.userEmail}
                          </p>
                          <p className="text-xs text-gray-600">
                            {member.role === 'admin' ? '👑 Admin' : 'Member'} •{' '}
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded hover:bg-red-200 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SettingsSection>
            </>
          )}

          {teams.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-600 mb-4">You haven't created any teams yet</p>
              <p className="text-sm text-gray-500">
                Create a team above to start collaborating with others
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
