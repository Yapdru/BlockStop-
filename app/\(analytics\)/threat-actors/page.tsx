"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ThreatActorProfile from "@/components/analytics/threat-actor-profile";

interface ThreatActor {
  id: string;
  name: string;
  country: string;
  attackCount: number;
  lastSeen: string;
}

export default function ThreatActorsPage() {
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const response = await fetch("/api/analytics/threat-actors");
        const data = await response.json();
        setActors(data.actors || []);
        if (data.actors && data.actors.length > 0) {
          setSelectedActor(data.actors[0].id);
        }
      } catch (error) {
        console.error("Error fetching threat actors:", error);
        // Mock data
        const mockActors: ThreatActor[] = [
          {
            id: "1",
            name: "APT28",
            country: "Russia",
            attackCount: 234,
            lastSeen: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Lazarus Group",
            country: "North Korea",
            attackCount: 189,
            lastSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "3",
            name: "APT33",
            country: "Iran",
            attackCount: 156,
            lastSeen: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "4",
            name: "Wizard Spider",
            country: "Russia",
            attackCount: 342,
            lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setActors(mockActors);
        setSelectedActor(mockActors[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchActors();
  }, []);

  // Mock actor profile data
  const actorProfiles: Record<string, any> = {
    "1": {
      name: "APT28",
      aliases: ["Fancy Bear", "Forest Blizzard"],
      country: "Russia",
      firstSeen: "2007-01-01",
      lastSeen: new Date().toISOString(),
      targetSectors: ["Government", "Defense", "Diplomacy"],
      capabilities: [
        { name: "Custom Malware", sophistication: "advanced" },
        { name: "Phishing", sophistication: "advanced" },
        { name: "Exploit Development", sophistication: "advanced" },
        { name: "Infrastructure Reuse", sophistication: "advanced" },
      ],
      attackCount: 234,
      motivations: ["Espionage", "Intelligence gathering"],
    },
    "2": {
      name: "Lazarus Group",
      aliases: ["Hidden Cobra", "APT38"],
      country: "North Korea",
      firstSeen: "2009-01-01",
      lastSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetSectors: ["Financial", "Cryptocurrency", "Entertainment"],
      capabilities: [
        { name: "Ransomware", sophistication: "advanced" },
        { name: "DDoS", sophistication: "intermediate" },
        { name: "Wiper Malware", sophistication: "advanced" },
        { name: "Cryptography", sophistication: "advanced" },
      ],
      attackCount: 189,
      motivations: ["Financial gain", "Espionage"],
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            👥 Threat Actors
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Intelligence on known adversaries and threat groups
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: "Tracked Actors", value: actors.length, icon: "👥" },
            {
              label: "Active This Week",
              value: actors.filter(
                (a) =>
                  new Date(a.lastSeen).getTime() >
                  Date.now() - 7 * 24 * 60 * 60 * 1000
              ).length,
              icon: "🔴",
            },
            { label: "Total Attacks", value: actors.reduce((sum, a) => sum + a.attackCount, 0), icon: "⚔️" },
            { label: "Countries", value: new Set(actors.map(a => a.country)).size, icon: "🌍" },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg border border-light-border"
              whileHover={{ y: -5 }}
            >
              <p className="text-gray-600 text-sm mb-2">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-2xl mt-2">{card.icon}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Actors List */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="px-6 py-4 border-b border-light-border bg-light-surface">
              <h3 className="font-semibold text-gray-900">Known Actors</h3>
            </div>

            <div className="divide-y divide-light-border max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin text-primary-600">⏳</div>
                </div>
              ) : (
                actors.map((actor) => (
                  <motion.button
                    key={actor.id}
                    onClick={() => setSelectedActor(actor.id)}
                    className={`w-full text-left px-6 py-4 transition ${
                      selectedActor === actor.id
                        ? "bg-primary-50 border-l-4 border-primary-600"
                        : "hover:bg-light-surface"
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <h4 className="font-semibold text-gray-900">{actor.name}</h4>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <span>🌍 {actor.country}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {actor.attackCount} attacks | Last seen:{" "}
                      {new Date(actor.lastSeen).toLocaleDateString()}
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>

          {/* Profile Details */}
          <div className="lg:col-span-3">
            {selectedActor && actorProfiles[selectedActor] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ThreatActorProfile {...actorProfiles[selectedActor]} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Intelligence Notes */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Intelligence Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-light-surface rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Most Active Region
              </h4>
              <p className="text-4xl font-bold text-primary-600 mb-2">
                Eastern Europe
              </p>
              <p className="text-sm text-gray-600">
                43% of tracked threat activity originates from this region
              </p>
            </div>
            <div className="p-4 bg-light-surface rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Primary Motivation
              </h4>
              <p className="text-2xl font-bold text-orange-600 mb-2">
                Financial Gain
              </p>
              <p className="text-sm text-gray-600">
                Ransomware and cryptocurrency theft dominate attack patterns
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
