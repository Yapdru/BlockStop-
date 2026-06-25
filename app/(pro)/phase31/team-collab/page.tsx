// PRO Phase 31.1 - Enhanced Team Collaboration
// Production-ready React component for incident management and team features

'use client';

import React, { useState, useEffect } from 'react';
import {
  teamCollaboration,
  getCollaborationMetrics,
} from '@/lib/pro/phase31/team-collaboration-v2';
import { TeamIncident, IncidentComment, TeamMember } from '@/types/pro-phase31';

// ============================================================================
// TEAM COLLABORATION PAGE
// ============================================================================

export default function TeamCollaborationPage() {
  const [incidents, setIncidents] = useState<TeamIncident[]>(
    teamCollaboration.getAllIncidents()
  );
  const [teamMembers] = useState<TeamMember[]>(teamCollaboration.getTeamMembers());
  const [selectedIncident, setSelectedIncident] = useState<TeamIncident | null>(null);
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState(getCollaborationMetrics(incidents));

  useEffect(() => {
    setMetrics(getCollaborationMetrics(incidents));
  }, [incidents]);

  const handleCreateIncident = (data: {
    title: string;
    description: string;
    severity: string;
    threatId: string;
  }) => {
    const incident = teamCollaboration.createIncident(
      data.threatId,
      data.title,
      data.description,
      data.severity as any,
      'user_001'
    );

    setIncidents(teamCollaboration.getAllIncidents());
    setShowNewIncidentForm(false);
  };

  const handleAddComment = () => {
    if (!selectedIncident || !commentText.trim()) return;

    const mentions = extractMentions(commentText);
    const comment = teamCollaboration.addComment(
      selectedIncident.id,
      'user_001',
      commentText,
      mentions
    );

    if (comment) {
      setCommentText('');
      const updated = teamCollaboration.getIncident(selectedIncident.id);
      if (updated) {
        setSelectedIncident(updated);
        setIncidents(teamCollaboration.getAllIncidents());
      }
    }
  };

  const handleStatusChange = (newStatus: any) => {
    if (!selectedIncident) return;

    const updated = teamCollaboration.updateIncidentStatus(
      selectedIncident.id,
      newStatus,
      'user_001'
    );

    if (updated) {
      setSelectedIncident(updated);
      setIncidents(teamCollaboration.getAllIncidents());
    }
  };

  const handleAssignIncident = (userIds: string[]) => {
    if (!selectedIncident) return;

    const updated = teamCollaboration.assignIncident(selectedIncident.id, userIds, 'user_001');

    if (updated) {
      setSelectedIncident(updated);
      setIncidents(teamCollaboration.getAllIncidents());
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex) || [];
    return matches
      .map((m) => m.slice(1))
      .filter((mention) =>
        teamMembers.some((member) => member.name.includes(mention))
      );
  };

  const filteredIncidents =
    statusFilter === 'all'
      ? incidents
      : incidents.filter((i) => i.status === statusFilter);

  const incidentStats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status === 'open').length,
    investigating: incidents.filter((i) => i.status === 'investigating').length,
    mitigating: incidents.filter((i) => i.status === 'mitigating').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Team Collaboration</h1>
          <p className="text-slate-400">Manage incidents and collaborate with your team</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <MetricBadge label="Total Incidents" value={incidentStats.total} color="blue" />
          <MetricBadge label="Open" value={incidentStats.open} color="red" />
          <MetricBadge label="Investigating" value={incidentStats.investigating} color="yellow" />
          <MetricBadge label="Mitigating" value={incidentStats.mitigating} color="orange" />
          <MetricBadge label="Resolved" value={incidentStats.resolved} color="green" />
        </div>

        {/* Collaboration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Comments" value={metrics.totalComments} />
          <StatCard label="Total Attachments" value={metrics.totalAttachments} />
          <StatCard label="Avg Response Time" value={`${Math.round(metrics.averageTimeToFirstComment / 60000)}m`} />
          <StatCard label="Collaboration Score" value={`${metrics.collaborationScore}/100`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Incidents</h2>
                <button
                  onClick={() => setShowNewIncidentForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  + New Incident
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['all', 'open', 'investigating', 'mitigating', 'resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Incidents */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredIncidents.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No incidents in this category
                  </p>
                ) : (
                  filteredIncidents.map((incident) => (
                    <IncidentListItem
                      key={incident.id}
                      incident={incident}
                      selected={selectedIncident?.id === incident.id}
                      onSelect={() => setSelectedIncident(incident)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Incident Details */}
          {selectedIncident && (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 lg:col-span-1 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">{selectedIncident.title}</h3>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {/* Status */}
                <div>
                  <label className="text-slate-500 block mb-1">Status</label>
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="mitigating">Mitigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="text-slate-500 block mb-1">Severity</label>
                  <div
                    className="px-3 py-2 rounded font-semibold text-white text-center"
                    style={{
                      backgroundColor:
                        selectedIncident.severity === 'critical'
                          ? '#ef4444'
                          : selectedIncident.severity === 'high'
                            ? '#f97316'
                            : selectedIncident.severity === 'medium'
                              ? '#eab308'
                              : '#84cc16',
                    }}
                  >
                    {selectedIncident.severity.toUpperCase()}
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="text-slate-500 block mb-1">Assigned To</label>
                  <div className="space-y-1">
                    {selectedIncident.assignedTo.length === 0 ? (
                      <p className="text-slate-400 text-xs">Not assigned</p>
                    ) : (
                      selectedIncident.assignedTo.map((userId) => {
                        const member = teamMembers.find((m) => m.id === userId);
                        return (
                          <div
                            key={userId}
                            className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300"
                          >
                            {member?.name}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const userIds = teamMembers.slice(0, 2).map((m) => m.id);
                      handleAssignIncident(userIds);
                    }}
                    className="mt-2 w-full px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs transition-colors"
                  >
                    Assign Team Members
                  </button>
                </div>

                {/* Comments Count */}
                <div>
                  <p className="text-slate-500">
                    {selectedIncident.comments.length} Comments
                  </p>
                </div>

                {/* Activity Timeline */}
                <div className="max-h-24 overflow-y-auto">
                  <p className="text-slate-500 text-xs mb-2">Recent Activity:</p>
                  <div className="space-y-1">
                    {selectedIncident.activityTimeline.slice(-3).map((entry) => (
                      <div key={entry.id} className="text-xs text-slate-400">
                        <span className="font-medium">{entry.actorName}</span>
                        {' '}
                        {entry.action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {selectedIncident && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>

            {/* Comment List */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {selectedIncident.comments.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No comments yet</p>
              ) : (
                selectedIncident.comments.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} />
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="border-t border-slate-700 pt-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment... (use @name to mention team members)"
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Comment
              </button>
            </div>
          </div>
        )}

        {/* New Incident Form */}
        {showNewIncidentForm && (
          <NewIncidentModal
            onSubmit={handleCreateIncident}
            onCancel={() => setShowNewIncidentForm(false)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface MetricBadgeProps {
  label: string;
  value: number;
  color: string;
}

function MetricBadge({ label, value, color }: MetricBadgeProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-900/30 text-blue-400',
    red: 'bg-red-900/30 text-red-400',
    yellow: 'bg-yellow-900/30 text-yellow-400',
    orange: 'bg-orange-900/30 text-orange-400',
    green: 'bg-green-900/30 text-green-400',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-3 border border-slate-700 text-center`}>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

interface IncidentListItemProps {
  incident: TeamIncident;
  selected: boolean;
  onSelect: () => void;
}

function IncidentListItem({ incident, selected, onSelect }: IncidentListItemProps) {
  const statusColors: Record<string, string> = {
    open: 'bg-red-500/20 text-red-400',
    investigating: 'bg-yellow-500/20 text-yellow-400',
    mitigating: 'bg-orange-500/20 text-orange-400',
    resolved: 'bg-green-500/20 text-green-400',
    archived: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? 'bg-blue-600/20 border-blue-500'
          : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{incident.title}</h4>
        <div className="flex gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[incident.status]}`}
          >
            {incident.status}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-2">{incident.description.substring(0, 60)}...</p>
      <div className="flex gap-3 text-xs text-slate-500">
        <span>💬 {incident.comments.length}</span>
        <span>👥 {incident.assignedTo.length}</span>
        <span>📎 {incident.attachments.length}</span>
      </div>
    </div>
  );
}

interface CommentCardProps {
  comment: IncidentComment;
}

function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-white text-sm">{comment.authorName}</p>
          <p className="text-xs text-slate-400">
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
        {comment.pinned && <span className="text-xs text-yellow-400">📌 Pinned</span>}
      </div>
      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
      {Object.keys(comment.reactions).length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {Object.entries(comment.reactions).map(([emoji, users]) => (
            <span
              key={emoji}
              className="text-xs bg-slate-600/50 px-2 py-1 rounded"
            >
              {emoji} {users.length}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface NewIncidentModalProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function NewIncidentModal({ onSubmit, onCancel }: NewIncidentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'high',
    threatId: `threat_${Date.now()}`,
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Create New Incident</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Incident title"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the incident..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
          >
            Create Incident
          </button>
        </div>
      </div>
    </div>
  );
}
