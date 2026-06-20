"use client";

import { useEffect, useState } from "react";
import { Incident, Evidence } from "@/types/collaboration";
import WarRoomHeader from "@/components/collaboration/war-room-header";
import EvidenceBoard from "@/components/collaboration/evidence-board";
import AnnotationToolbar from "@/components/collaboration/annotation-toolbar";
import SearchComponent from "@/components/collaboration/search-component";
import { TeamMember } from "@/types/collaboration";

export default function EvidencePage({
  params,
}: {
  params: { id: string };
}) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, evidenceRes, teamRes] = await Promise.all([
          fetch(`/api/incidents/${params.id}`),
          fetch(`/api/incidents/${params.id}/evidence`),
          fetch(`/api/incidents/${params.id}/team`),
        ]);

        if (!incidentRes.ok) throw new Error("Failed to fetch incident");

        const incidentData = await incidentRes.json();
        const evidenceData = await evidenceRes.json();
        const teamData = await teamRes.json();

        setIncident(incidentData.incident);
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
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600">Loading evidence board...</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EvidenceBoard
              evidence={evidence}
              incidentId={params.id}
              onSelectEvidence={setSelectedEvidence}
            />
          </div>

          <div className="lg:col-span-1">
            {selectedEvidence ? (
              <AnnotationToolbar
                evidenceId={selectedEvidence.id}
                annotations={selectedEvidence.annotations || []}
                currentUserId="current_user"
                currentUserName="You"
              />
            ) : (
              <div className="bg-white rounded-lg border border-light-border p-6 text-center text-gray-500">
                <p className="text-sm">Select evidence to view annotations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
