"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Policy {
  id: string;
  name: string;
  description: string;
  rules: number;
  status: "active" | "inactive";
  created: string;
  modified: string;
}

interface PolicyBuilderProps {
  onPolicySave?: (policy: Policy) => void;
  policies?: Policy[];
}

export default function PolicyBuilder({
  onPolicySave,
  policies = [],
}: PolicyBuilderProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: "",
  });
  const [savedPolicies, setSavedPolicies] = useState<Policy[]>(policies);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePolicy = () => {
    if (!formData.name.trim()) return;

    const newPolicy: Policy = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      rules: parseInt(formData.rules) || 0,
      status: "active",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    setSavedPolicies([...savedPolicies, newPolicy]);
    onPolicySave?.(newPolicy);
    setFormData({ name: "", description: "", rules: "" });
    setShowForm(false);
  };

  const togglePolicyStatus = (id: string) => {
    setSavedPolicies(
      savedPolicies.map((p) =>
        p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p
      )
    );
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4 border-b border-light-border bg-light-surface flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Policy Builder</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          {showForm ? "Cancel" : "+ New Policy"}
        </button>
      </div>

      {showForm && (
        <div className="px-6 py-6 border-b border-light-border bg-light-surface">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Policy Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Enterprise Standard"
                className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the policy goals and rules"
                rows={3}
                className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Rules
              </label>
              <input
                type="number"
                name="rules"
                value={formData.rules}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSavePolicy}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-light-border">
        {savedPolicies.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600">
            No policies created yet
          </div>
        ) : (
          savedPolicies.map((policy) => (
            <motion.div
              key={policy.id}
              className="px-6 py-4 hover:bg-light-surface transition"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {policy.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>{policy.rules} rules</span>
                    <span>Created: {new Date(policy.created).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePolicyStatus(policy.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      policy.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {policy.status.toUpperCase()}
                  </button>
                  <button className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 font-semibold">
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
