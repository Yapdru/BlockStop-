'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge, Input } from '@/components';

interface ThreatTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  templateType: string;
  threatCategories: string[];
  difficulty: string;
  ratingScore: number;
  usageCount: number;
  downloadCount: number;
  verified: boolean;
  createdBy: string;
  testing: {
    detectionRate: number;
    falsePositiveRate: number;
  };
}

export default function MarketplaceTemplatesPage() {
  const [templates, setTemplates] = useState<ThreatTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          verified: 'true',
          ...(selectedCategory && { category: selectedCategory }),
          ...(selectedDifficulty && { difficulty: selectedDifficulty }),
          ...(searchQuery && { search: searchQuery }),
        });

        const response = await fetch(`/api/marketplace/templates?${params}`);
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data.templates);
          setTotalPages(data.data.pagination.pages);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [page, selectedCategory, selectedDifficulty, searchQuery]);

  const handleDeploy = async (templateId: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'user-123';
      const response = await fetch(`/api/marketplace/templates/${templateId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert('Template deployed successfully');
      }
    } catch (error) {
      console.error('Failed to deploy template:', error);
    }
  };

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Threat Templates</h1>
          <p className="text-lg text-slate-600">
            Use community-created detection rules and investigation templates
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>

          <div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value || null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
            >
              <option value="">All Categories</option>
              <option value="ransomware">Ransomware</option>
              <option value="phishing">Phishing</option>
              <option value="lateral-movement">Lateral Movement</option>
              <option value="apt">APT</option>
              <option value="privilege-escalation">Privilege Escalation</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDifficulty || ''}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value || null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div>
          {loading ? (
            <div className="text-center text-slate-600">Loading templates...</div>
          ) : templates.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
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
            <div className="text-center text-slate-600">No templates found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onDeploy,
}: {
  template: ThreatTemplate;
  onDeploy: (id: string) => void;
}) {
  const difficultyColor = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
  };

  return (
    <Card padding="lg" className="border border-slate-200 hover:border-blue-300 transition">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-slate-900 flex-1">{template.name}</h3>
          {template.verified && (
            <Badge variant="success" className="ml-2">✓ Verified</Badge>
          )}
        </div>
        <p className="text-sm text-slate-600">{template.description}</p>
      </div>

      <div className="mb-4">
        {template.threatCategories.slice(0, 3).map((cat) => (
          <Badge key={cat} variant="secondary" className="mr-2 mb-2">
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{template.detectionRate}%</p>
          <p className="text-xs">Detection Rate</p>
        </div>
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{template.falsePositiveRate}%</p>
          <p className="text-xs">False Positive</p>
        </div>
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{template.ratingScore.toFixed(1)}/5</p>
          <p className="text-xs">Rating</p>
        </div>
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{template.downloadCount}</p>
          <p className="text-xs">Downloads</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-600">
          By <span className="font-semibold">{template.createdBy}</span> • v{template.version}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Difficulty: <Badge variant={difficultyColor[template.difficulty as keyof typeof difficultyColor]}>
            {template.difficulty}
          </Badge>
        </p>
      </div>

      <Button
        onClick={() => onDeploy(template.id)}
        className="w-full"
      >
        Deploy Template
      </Button>
    </Card>
  );
}
