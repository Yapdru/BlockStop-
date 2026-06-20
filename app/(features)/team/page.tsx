'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Input } from '@/components';

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
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading teams...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">👥 Team Management</h1>
          </div>
          <p className="text-sm text-neutral-600">Manage your team members and collaborators</p>
        </div>
      </header>

      <div className="container-max py-8 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg animate-slideDown">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg animate-slideDown">
            ✅ {success}
          </div>
        )}

        {/* Create Team */}
        <Card padding="lg">
          <div className="mb-6">
            <h2 className="text-h4 font-bold text-neutral-900">🚀 Create a New Team</h2>
            <p className="text-sm text-neutral-600 mt-1">Collaborate with your team members</p>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <Input
              type="text"
              label="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="My Security Team"
            />

            <Button variant="primary" className="w-full" disabled={isCreating}>
              {isCreating ? '⏳ Creating...' : '🚀 Create Team'}
            </Button>
          </form>
        </Card>

        {/* Teams List */}
        {teams.length > 0 && (
          <Card padding="lg">
            <div className="mb-6">
              <h2 className="text-h4 font-bold text-neutral-900">📋 Your Teams</h2>
              <p className="text-sm text-neutral-600 mt-1">{teams.length} team(s)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`relative p-4 rounded-lg border-2 text-left transition ${
                    selectedTeam?.id === team.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 bg-neutral-50 hover:border-primary-300'
                  }`}
                >
                  {selectedTeam?.id === team.id && (
                    <Badge variant="primary" className="absolute top-2 right-2">
                      Selected
                    </Badge>
                  )}
                  <p className="text-h6 font-bold text-neutral-900">{team.name}</p>
                  <p className="text-xs text-neutral-600 mt-2">
                    👥 Max {team.maxUsers} members
                  </p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Team Members Section */}
        {selectedTeam && (
          <>
            {/* Invite Members */}
            <Card padding="lg">
              <div className="mb-6">
                <h2 className="text-h4 font-bold text-neutral-900">➕ Invite to {selectedTeam.name}</h2>
                <p className="text-sm text-neutral-600 mt-1">Add new team members</p>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="email"
                    label="Email Address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                      className="input w-full"
                    >
                      <option value="member">👤 Member</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                  </div>
                </div>

                <Button variant="primary" className="w-full" disabled={isInviting}>
                  {isInviting ? '⏳ Sending...' : '📧 Send Invitation'}
                </Button>
              </form>
            </Card>

            {/* Team Members List */}
            {members.length > 0 && (
              <Card padding="lg">
                <div className="mb-6">
                  <h2 className="text-h4 font-bold text-neutral-900">👥 Team Members</h2>
                  <p className="text-sm text-neutral-600 mt-1">{members.length} member(s)</p>
                </div>

                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{member.userName || member.userEmail}</p>
                        <p className="text-xs text-neutral-600">{member.userEmail}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={member.role === 'admin' ? 'primary' : 'info'}>
                          {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                        </Badge>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {teams.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-neutral-600 mb-4">No teams yet. Create your first team to start collaborating.</p>
            <Button variant="primary" onClick={() => document.querySelector('input[placeholder="My Security Team"]')?.focus()}>
              Create Team
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}
