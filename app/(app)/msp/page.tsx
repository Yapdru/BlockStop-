/**
 * MSP Console
 * Managed Service Provider dashboard and management
 */

"use client";

import { useState, useEffect } from "react";

export default function MSPConsolePage() {
  const [selectedTab, setSelectedTab] = useState<"partners" | "customers" | "analytics">(
    "partners"
  );
  const [partners, setPartners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In production: fetch from API
        setPartners([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            MSP Console
          </h1>
          <p className="text-slate-400">
            Manage partners, customers, and track revenue
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {[
            { id: "partners", label: "Partners", icon: "🤝" },
            { id: "customers", label: "Customers", icon: "👥" },
            { id: "analytics", label: "Analytics", icon: "📊" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-xl p-8 shadow-2xl">
          {selectedTab === "partners" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  MSP Partners
                </h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                  + Add Partner
                </button>
              </div>

              {partners.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No partners registered yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Partner cards */}
                </div>
              )}
            </div>
          )}

          {selectedTab === "customers" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Customers
                </h2>
                <div className="flex gap-2">
                  <select className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                    <option>All Partners</option>
                  </select>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                    + Add Customer
                  </button>
                </div>
              </div>

              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No customers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-300">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 text-slate-300">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-slate-300">
                          Users
                        </th>
                        <th className="text-left py-3 px-4 text-slate-300">
                          Tier
                        </th>
                        <th className="text-left py-3 px-4 text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>{/* Customer rows */}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedTab === "analytics" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Analytics & Reports
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Customers", value: "0", icon: "👥" },
                  { label: "Active Users", value: "0", icon: "✓" },
                  { label: "Monthly Revenue", value: "$0", icon: "💰" },
                  { label: "Growth Rate", value: "0%", icon: "📈" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-700 rounded-lg p-6"
                  >
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <p className="text-slate-400 text-sm mb-2">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Revenue Trend
                  </h3>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Chart placeholder
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Customer Growth
                  </h3>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Chart placeholder
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
