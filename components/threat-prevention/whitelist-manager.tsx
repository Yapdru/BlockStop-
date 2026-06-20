"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface WhitelistEntry {
  id: string;
  value: string;
  type: "ip" | "domain" | "email" | "hash";
  reason: string;
  addedBy: string;
  addedAt: string;
}

interface WhitelistManagerProps {
  onEntryAdded?: (entry: WhitelistEntry) => void;
}

export default function WhitelistManager({
  onEntryAdded,
}: WhitelistManagerProps) {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    value: "",
    type: "ip" as const,
    reason: "",
  });

  const handleAddEntry = () => {
    if (!formData.value.trim()) return;

    const newEntry: WhitelistEntry = {
      id: Date.now().toString(),
      value: formData.value,
      type: formData.type,
      reason: formData.reason,
      addedBy: "Admin",
      addedAt: new Date().toISOString(),
    };

    setEntries([...entries, newEntry]);
    onEntryAdded?.(newEntry);
    setFormData({ value: "", type: "ip", reason: "" });
    setShowForm(false);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ip: "bg-blue-100 text-blue-700",
      domain: "bg-purple-100 text-purple-700",
      email: "bg-pink-100 text-pink-700",
      hash: "bg-indigo-100 text-indigo-700",
    };
    return colors[type] || colors.ip;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4 border-b border-light-border bg-light-surface flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Whitelist Manager</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          {showForm ? "Cancel" : "+ Add Entry"}
        </button>
      </div>

      {showForm && (
        <div className="px-6 py-6 border-b border-light-border bg-light-surface">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value="ip">IP Address</option>
                  <option value="domain">Domain</option>
                  <option value="email">Email</option>
                  <option value="hash">Hash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="Enter value"
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Why is this whitelisted?"
                rows={2}
                className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <button
              onClick={handleAddEntry}
              className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Add to Whitelist
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-light-border">
        {entries.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600">
            No whitelisted entries
          </div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              className="px-6 py-4 hover:bg-light-surface transition"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                        entry.type
                      )}`}
                    >
                      {entry.type.toUpperCase()}
                    </span>
                    <code className="text-sm font-mono text-gray-900">
                      {entry.value}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{entry.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added by {entry.addedBy} on{" "}
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
