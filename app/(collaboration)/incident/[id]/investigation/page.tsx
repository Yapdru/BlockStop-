"use client";

import { useEffect, useState } from "react";
import { Incident, TimelineEvent, Evidence } from "@/types/collaboration";
import WarRoomHeader from "@/components/collaboration/war-room-header";
import TimelineView from "@/components/collaboration/timeline-view";
import EvidenceBoard from "@/components/collaboration/evidence-board";
import TeamPresence from "@/components/collaboration/team-presence";
import SearchComponent from "@/components/collaboration/search-component";
import { TeamMember } from "@/types/collaboration";

export default function InvestigationPage({
  params,
}: {
  params: { id: string };
}) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, timelineRes, evidenceRes, teamRes] = await Promise.all([
          fetch(`/api/incidents/${params.id}`),
          fetch(`/api/incidents/${params.id}/timeline`),
          fetch(`/api/incidents/${params.id}/evidence`),
          fetch(`/api/incidents/${params.id}/team`),
        ]);

        if (!incidentRes.ok) throw new Error("Failed to fetch incident");

        const incidentData = await incidentRes.json();
        const timelineData = await timelineRes.json();
        const evidenceData = await evidenceRes.json();
        const teamData = await teamRes.json();

        setIncident(incidentData.incident);
        setTimeline(timelineData.events || []);
        setEvidence(evidenceData.evidence || []);
        setTeamMembers(teamData.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-600">Loading investigation...</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <TimelineView events={timeline} incidentId={params.id} />
            <EvidenceBoard evidence={evidence} incidentId={params.id} />
          </div>

          <div className="lg:col-span-1">
            <TeamPresence members={teamMembers} />
          </div>
        </div>
      </div>
    </main>
  );
}
