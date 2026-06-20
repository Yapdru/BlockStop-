"use client";

import { useState } from "react";
import { Incident, TeamMember } from "@/types/collaboration";

interface WarRoomHeaderProps {
  incident: Incident;
  teamMembers: TeamMember[];
  onStatusChange?: (status: Incident["status"]) => void;
}

export default function WarRoomHeader({
  incident,
  teamMembers,
  onStatusChange,
}: WarRoomHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const severityColors = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  const statusColors = {
    open: "bg-blue-100 text-blue-800",
    "in-progress": "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const onlineMembers = teamMembers.filter((m) => m.status === "online");

  return (
    <header className="bg-white border-b border-light-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {incident.title}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColors[incident.severity]}`}>
                {incident.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{incident.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusColors[incident.status]}`}
                >
                  {incident.status.toUpperCase()}
                </button>
                {isDropdownOpen && onStatusChange && (
                  <div className="absolute top-full mt-2 bg-white border border-light-border rounded-lg shadow-lg z-50">
                    {["open", "in-progress", "resolved", "closed"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            onStatusChange(status as Incident["status"]);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-light-surface text-sm"
                        >
                          {status.toUpperCase()}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm font-medium">
                {new Date(incident.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Team Online</p>
            <div className="flex items-center gap-2">
              {onlineMembers.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-semibold"
                  title={member.name}
                >
                  {member.name.charAt(0)}
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 text-xs flex items-center justify-center font-semibold">
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
