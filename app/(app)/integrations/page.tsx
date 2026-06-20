'use client';

import { useState, useEffect } from 'react';

interface Integration {
  name: string;
  category: string;
  auth: string;
  connected: boolean;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch('/api/integrations/enterprise', {
          headers: { 'x-user-id': userId || '' }
        });
        if (response.ok) {
          const data = await response.json();
          // Map to integration format
          const mapped = data.availableConnectors.map((c: any) => ({
            ...c,
            connected: false
          }));
          setIntegrations(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const categories = ['all', ...new Set(integrations.map(i => i.category))];
  const filtered = selectedCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === selectedCategory);

  const handleConnect = (name: string) => {
    alert(`Connect ${name} - Redirecting to authorization...`);
    // In production, would redirect to OAuth flow
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400">Loading integrations...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded capitalize transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(integration => (
          <div
            key={integration.name}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-600 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold">{integration.name}</h3>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded capitalize">
                {integration.category}
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-4 min-h-10">
              Connect your {integration.name} account for enhanced security scanning.
            </p>

            <div className="mb-4">
              <p className="text-xs text-gray-500">
                Auth: <span className="text-gray-300 capitalize">{integration.auth}</span>
              </p>
            </div>

            {integration.connected ? (
              <div className="flex items-center space-x-2 py-2 px-3 bg-green-900/20 border border-green-700 rounded text-green-400 text-sm font-medium">
                <span>✓</span>
                <span>Connected</span>
                <button
                  onClick={() => alert(`Disconnect ${integration.name}`)}
                  className="ml-auto text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect(integration.name)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition"
              >
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No integrations available for your plan in this category.
        </div>
      )}
    </div>
  );
}
