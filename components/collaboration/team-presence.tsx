"use client";

import { useState, useEffect } from "react";
import { TeamMember } from "@/types/collaboration";

interface TeamPresenceProps {
  members: TeamMember[];
  onMemberClick?: (member: TeamMember) => void;
}

export default function TeamPresence({
  members,
  onMemberClick,
}: TeamPresenceProps) {
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  };

  const roleColors = {
    analyst: "bg-blue-100 text-blue-800",
    manager: "bg-purple-100 text-purple-800",
    viewer: "bg-gray-100 text-gray-800",
  };

  const onlineCount = members.filter((m) => m.status === "online").length;
  const awayCount = members.filter((m) => m.status === "away").length;

  return (
    <div className="bg-white rounded-lg border border-light-border p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Team Presence</h2>

      <div className="flex gap-8 mb-6 text-sm">
        <div>
          <p className="text-gray-600">Online</p>
          <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
        </div>
        <div>
          <p className="text-gray-600">Away</p>
          <p className="text-2xl font-bold text-yellow-600">{awayCount}</p>
        </div>
        <div>
          <p className="text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="relative">
            <button
              onClick={() => {
                setShowDetails(showDetails === member.id ? null : member.id);
                onMemberClick?.(member);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-light-surface rounded-lg transition text-left"
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center font-semibold">
                  {member.name.charAt(0)}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    statusColors[member.status]
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>

              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${roleColors[member.role]}`}
              >
                {member.role}
              </span>
            </button>

            {showDetails === member.id && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-light-border rounded-lg shadow-lg z-50 p-4">
                <p className="font-semibold text-gray-900 mb-2">{member.name}</p>
                <p className="text-sm text-gray-600 mb-3">{member.email}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium capitalize">{member.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role</span>
                    <span className="font-medium capitalize">{member.role}</span>
                  </div>
                  {member.lastSeen && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last seen</span>
                      <span className="font-medium">
                        {new Date(member.lastSeen).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <button className="w-full mt-3 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 font-semibold text-sm transition">
                  Send Message
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
