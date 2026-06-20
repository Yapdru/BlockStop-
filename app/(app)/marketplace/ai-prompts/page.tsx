'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge, Input } from '@/components';

interface AIPrompt {
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;
  industry: string;
  role: string;
  ratingScore: number;
  usageCount: number;
  downloadCount: number;
  verificationStatus: string;
  modelCompatibility: string[];
  capabilities: string[];
  exampleUseCases: string[];
  createdBy: string;
}

export default function MarketplaceAIPromptsPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          verified: 'true',
          ...(selectedIndustry && { industry: selectedIndustry }),
          ...(selectedRole && { role: selectedRole }),
          ...(searchQuery && { search: searchQuery }),
        });

        const response = await fetch(`/api/marketplace/prompts?${params}`);
        const data = await response.json();

        if (data.success) {
          setPrompts(data.data.prompts);
          setTotalPages(data.data.pagination.pages);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [page, selectedIndustry, selectedRole, searchQuery]);

  const handleDeploy = async (promptId: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'user-123';
      const response = await fetch(`/api/marketplace/prompts/${promptId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert('Prompt deployed successfully');
      }
    } catch (error) {
      console.error('Failed to deploy prompt:', error);
    }
  };

  const industries = ['healthcare', 'finance', 'retail', 'manufacturing', 'government', 'education', 'general'];
  const roles = ['soc_analyst', 'threat_hunter', 'incident_commander', 'admin', 'malware_analyst'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">AI Prompts & Agents</h1>
          <p className="text-lg text-slate-600">
            Industry-specific and role-based BetterBot prompts for enhanced threat analysis
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-6 border border-slate-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="md:col-span-2"
            />
            <Button className="w-full">Search</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Industry
              </label>
              <select
                value={selectedIndustry || ''}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value || null);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
              >
                <option value="">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind.replace(/_/g, ' ').charAt(0).toUpperCase() + ind.replace(/_/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                value={selectedRole || ''}
                onChange={(e) => {
                  setSelectedRole(e.target.value || null);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ').charAt(0).toUpperCase() + r.replace(/_/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        <div>
          {loading ? (
            <div className="text-center text-slate-600">Loading prompts...</div>
          ) : prompts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onDeploy={handleDeploy}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-slate-600 py-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-600">No prompts found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  onDeploy,
}: {
  prompt: AIPrompt;
  onDeploy: (id: string) => void;
}) {
  return (
    <Card padding="lg" className="border border-slate-200 hover:border-blue-300 transition flex flex-col">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-slate-900 flex-1">{prompt.name}</h3>
          {prompt.verificationStatus === 'verified' && (
            <Badge variant="success" className="ml-2">✓</Badge>
          )}
        </div>
        <p className="text-sm text-slate-600">{prompt.description}</p>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 flex-wrap mb-2">
          <Badge variant="secondary">{prompt.role.replace(/_/g, ' ')}</Badge>
          <Badge variant="secondary" className="capitalize">{prompt.industry}</Badge>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <p className="text-slate-600 mb-2">
          <span className="font-semibold text-slate-900">{prompt.ratingScore.toFixed(1)}/5</span> rating
        </p>
        <div className="text-xs text-slate-600 space-y-1">
          <p>Uses: <span className="font-semibold">{prompt.usageCount}</span></p>
          <p>Downloads: <span className="font-semibold">{prompt.downloadCount}</span></p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Capabilities:</p>
        <div className="space-y-1">
          {prompt.capabilities.slice(0, 3).map((cap, idx) => (
            <p key={idx} className="text-xs text-slate-600">• {cap}</p>
          ))}
          {prompt.capabilities.length > 3 && (
            <p className="text-xs text-slate-600">• +{prompt.capabilities.length - 3} more</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Example Use Cases:</p>
        <div className="space-y-1">
          {prompt.exampleUseCases.slice(0, 2).map((useCase, idx) => (
            <p key={idx} className="text-xs text-slate-600">• {useCase}</p>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <p className="text-xs text-slate-600 mb-3">
          v{prompt.version} by {prompt.createdBy}
        </p>
        <Button
          onClick={() => onDeploy(prompt.id)}
          className="w-full"
        >
          Deploy Prompt
        </Button>
      </div>
    </Card>
  );
}
