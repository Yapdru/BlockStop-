"use client";

import { useEffect, useState } from "react";
import { Incident, TimelineEvent } from "@/types/collaboration";
import WarRoomHeader from "@/components/collaboration/war-room-header";
import TimelineView from "@/components/collaboration/timeline-view";
import SearchComponent from "@/components/collaboration/search-component";
import { TeamMember } from "@/types/collaboration";

export default function TimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "note" as TimelineEvent["type"],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, timelineRes, teamRes] = await Promise.all([
          fetch(`/api/incidents/${params.id}`),
          fetch(`/api/incidents/${params.id}/timeline`),
          fetch(`/api/incidents/${params.id}/team`),
        ]);

        if (!incidentRes.ok) throw new Error("Failed to fetch incident");

        const incidentData = await incidentRes.json();
        const timelineData = await timelineRes.json();
        const teamData = await teamRes.json();

        setIncident(incidentData.incident);
        setEvents(timelineData.events || []);
        setTeamMembers(teamData.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newEvent: TimelineEvent = {
      id: `event_${Date.now()}`,
      incidentId: params.id,
      timestamp: new Date(),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      author: "current_user",
    };

    setEvents([newEvent, ...events]);

    try {
      await fetch(`/api/incidents/${params.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
    } catch (err) {
      console.error("Error adding event:", err);
    }

    setFormData({ title: "", description: "", type: "note" });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-lg font-bold text-red-800">Error</h1>
            <p className="text-red-700">{error || "Incident not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <WarRoomHeader incident={incident} teamMembers={teamMembers} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <SearchComponent incidentId={params.id} />
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm"
          >
            + Add Timeline Event
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-light-border">
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as TimelineEvent["type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="detection">Detection</option>
                  <option value="investigation">Investigation</option>
                  <option value="action">Action</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-light-border rounded-lg hover:bg-light-surface text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        )}

        <TimelineView events={events} incidentId={params.id} />
      </div>
    </main>
  );
}
