"use client";

import { motion } from "framer-motion";

interface Capability {
  name: string;
  sophistication: "basic" | "intermediate" | "advanced";
}

interface ThreatActorProfileProps {
  name: string;
  aliases: string[];
  country: string;
  firstSeen: string;
  lastSeen: string;
  targetSectors: string[];
  capabilities: Capability[];
  attackCount: number;
  motivations: string[];
}

export default function ThreatActorProfile({
  name,
  aliases,
  country,
  firstSeen,
  lastSeen,
  targetSectors,
  capabilities,
  attackCount,
  motivations,
}: ThreatActorProfileProps) {
  const getSophisticationColor = (level: string) => {
    const colors: Record<string, string> = {
      basic: "bg-green-100 text-green-700",
      intermediate: "bg-yellow-100 text-yellow-700",
      advanced: "bg-red-100 text-red-700",
    };
    return colors[level] || colors.basic;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-6 border-b border-light-border bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
            {aliases.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Also known as: {aliases.join(", ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary-600">
              {attackCount}
            </div>
            <p className="text-sm text-gray-600">Confirmed Attacks</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs uppercase font-semibold text-gray-600 mb-2">
              Country
            </p>
            <p className="text-lg font-semibold text-gray-900">{country}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-gray-600 mb-2">
              Activity Range
            </p>
            <p className="text-sm text-gray-900">
              {new Date(firstSeen).getFullYear()} -{" "}
              {new Date(lastSeen).getFullYear()}
            </p>
          </div>
        </div>

        {/* Target Sectors */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Target Sectors</h3>
          <div className="flex flex-wrap gap-2">
            {targetSectors.map((sector, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>

        {/* Motivations */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Motivations</h3>
          <div className="flex flex-wrap gap-2">
            {motivations.map((motivation, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold"
              >
                {motivation}
              </span>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Capabilities</h3>
          <div className="space-y-2">
            {capabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-light-surface rounded-lg"
              >
                <span className="text-sm font-semibold text-gray-900">
                  {cap.name}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getSophisticationColor(
                    cap.sophistication
                  )}`}
                >
                  {cap.sophistication.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
