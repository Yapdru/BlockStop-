"use client";

import { useEffect, useState } from "react";
import { Incident, ChatMessage } from "@/types/collaboration";
import WarRoomHeader from "@/components/collaboration/war-room-header";
import IncidentChat from "@/components/collaboration/incident-chat";
import SearchComponent from "@/components/collaboration/search-component";
import { TeamMember } from "@/types/collaboration";

export default function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState("current_user");
  const [currentUserName] = useState("You");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, chatRes, teamRes] = await Promise.all([
          fetch(`/api/incidents/${params.id}`),
          fetch(`/api/incidents/${params.id}/chat`),
          fetch(`/api/incidents/${params.id}/team`),
        ]);

        if (!incidentRes.ok) throw new Error("Failed to fetch incident");

        const incidentData = await incidentRes.json();
        const chatData = await chatRes.json();
        const teamData = await teamRes.json();

        setIncident(incidentData.incident);
        setMessages(chatData.messages || []);
        setTeamMembers(teamData.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      incidentId: params.id,
      userId: currentUserId,
      userName: currentUserName,
      content,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);

    try {
      const res = await fetch(`/api/incidents/${params.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-gray-600">Loading chat...</p>
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
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex flex-col">
      <WarRoomHeader incident={incident} teamMembers={teamMembers} />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <SearchComponent incidentId={params.id} />
        </div>

        <div className="h-[600px] flex">
          <IncidentChat
            incidentId={params.id}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </main>
  );
}
