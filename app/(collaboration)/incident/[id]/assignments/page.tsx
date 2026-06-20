"use client";

import { useEffect, useState } from "react";
import { Incident, Assignment } from "@/types/collaboration";
import WarRoomHeader from "@/components/collaboration/war-room-header";
import AssignmentEditor from "@/components/collaboration/assignment-editor";
import SearchComponent from "@/components/collaboration/search-component";
import { TeamMember } from "@/types/collaboration";

export default function AssignmentsPage({
  params,
}: {
  params: { id: string };
}) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Assignment["status"] | "all">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, assignRes, teamRes] = await Promise.all([
          fetch(`/api/incidents/${params.id}`),
          fetch(`/api/incidents/${params.id}/assignments`),
          fetch(`/api/incidents/${params.id}/team`),
        ]);

        if (!incidentRes.ok) throw new Error("Failed to fetch incident");

        const incidentData = await incidentRes.json();
        const assignData = await assignRes.json();
        const teamData = await teamRes.json();

        setIncident(incidentData.incident);
        setAssignments(assignData.assignments || []);
        setTeamMembers(teamData.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleCreateAssignment = async (
    newAssignment: Omit<Assignment, "id">
  ) => {
    const assignmentWithId: Assignment = {
      ...newAssignment,
      id: `assign_${Date.now()}`,
    };

    setAssignments([...assignments, assignmentWithId]);

    try {
      await fetch(`/api/incidents/${params.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentWithId),
      });
    } catch (err) {
      console.error("Error creating assignment:", err);
    }
  };

  const filteredAssignments =
    filterStatus === "all"
      ? assignments
      : assignments.filter((a) => a.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-gray-600">Loading assignments...</p>
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

  const stats = {
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in-progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    blocked: assignments.filter((a) => a.status === "blocked").length,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <WarRoomHeader incident={incident} teamMembers={teamMembers} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <SearchComponent incidentId={params.id} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending", count: stats.pending, color: "bg-gray-100 text-gray-800" },
            { label: "In Progress", count: stats.inProgress, color: "bg-blue-100 text-blue-800" },
            { label: "Completed", count: stats.completed, color: "bg-green-100 text-green-800" },
            { label: "Blocked", count: stats.blocked, color: "bg-red-100 text-red-800" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg p-4 text-center ${stat.color}`}
            >
              <p className="text-3xl font-bold">{stat.count}</p>
              <p className="text-xs font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "pending", "in-progress", "completed", "blocked"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  filterStatus === status
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-light-border text-gray-700 hover:bg-light-surface"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        <AssignmentEditor
          assignments={filteredAssignments}
          teamMembers={teamMembers}
          incidentId={params.id}
          onCreateAssignment={handleCreateAssignment}
        />
      </div>
    </main>
  );
}
