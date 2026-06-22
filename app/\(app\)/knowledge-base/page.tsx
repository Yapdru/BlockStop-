/**
 * BlockStop Phase 30.8 - Knowledge Base Search & Documentation Page
 * Searchable documentation with articles, videos, case studies, and best practices
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'case-study' | 'best-practice';
  category: string;
  difficulty: string;
  views: number;
  rating: number;
  author: string;
  createdAt: Date;
  tags: string[];
}

export default function KnowledgeBasePage() {
  const [tab, setTab] = useState<'search' | 'browse' | 'trending' | 'resources'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    'Threat Detection',
    'Incident Response',
    'Malware Analysis',
    'Compliance',
    'Cloud Security',
    'Endpoint Security',
    'Forensics',
    'Threat Intelligence',
  ];

  const types = [
    { value: 'article', label: 'Articles', icon: '📄' },
    { value: 'video', label: 'Videos', icon: '🎥' },
    { value: 'case-study', label: 'Case Studies', icon: '📊' },
    { value: 'best-practice', label: 'Best Practices', icon: '⭐' },
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    // Simulate loading documents
    setTimeout(() => {
      const mockDocuments: KnowledgeDocument[] = [
        {
          id: 'doc-1',
          title: 'Ransomware Detection Best Practices',
          description: 'Comprehensive guide to detecting and preventing ransomware attacks in enterprise environments',
          type: 'article',
          category: 'Threat Detection',
          difficulty: 'Intermediate',
          views: 3400,
          rating: 4.8,
          author: 'Security Team',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          tags: ['ransomware', 'detection', 'malware'],
        },
        {
          id: 'doc-2',
          title: 'APT Attack Chain Analysis',
          description: 'In-depth analysis of Advanced Persistent Threat attack chains and indicators',
          type: 'case-study',
          category: 'Threat Intelligence',
          difficulty: 'Advanced',
          views: 2100,
          rating: 4.9,
          author: 'Threat Research',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          tags: ['apt', 'threats', 'analysis'],
        },
        {
          id: 'doc-3',
          title: 'GDPR Compliance Framework',
          description: 'Implementation guide for GDPR compliance in security operations',
          type: 'best-practice',
          category: 'Compliance',
          difficulty: 'Intermediate',
          views: 5200,
          rating: 4.7,
          author: 'Compliance Team',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          tags: ['gdpr', 'compliance', 'governance'],
        },
        {
          id: 'doc-4',
          title: 'Cloud Security Posture Assessment',
          description: 'Video tutorial on assessing and improving cloud security posture',
          type: 'video',
          category: 'Cloud Security',
          difficulty: 'Intermediate',
          views: 1800,
          rating: 4.6,
          author: 'Cloud Team',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          tags: ['cloud', 'aws', 'security'],
        },
        {
          id: 'doc-5',
          title: 'Incident Response Playbook',
          description: 'Step-by-step guide for responding to security incidents',
          type: 'article',
          category: 'Incident Response',
          difficulty: 'Beginner',
          views: 6800,
          rating: 4.9,
          author: 'Incident Response',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          tags: ['incident', 'response', 'playbook'],
        },
        {
          id: 'doc-6',
          title: 'Malware Reverse Engineering 101',
          description: 'Beginner-friendly introduction to malware analysis and reverse engineering',
          type: 'video',
          category: 'Malware Analysis',
          difficulty: 'Beginner',
          views: 4300,
          rating: 4.8,
          author: 'Security Academy',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          tags: ['malware', 'reverse-engineering', 'analysis'],
        },
        {
          id: 'doc-7',
          title: 'Zero Trust Security Model',
          description: 'Implementation guide for zero trust architecture in enterprises',
          type: 'article',
          category: 'Cloud Security',
          difficulty: 'Advanced',
          views: 2900,
          rating: 4.7,
          author: 'Architecture Team',
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          tags: ['zero-trust', 'architecture', 'security'],
        },
        {
          id: 'doc-8',
          title: 'Phishing Campaign Analysis',
          description: 'Real-world case study of analyzing and stopping phishing campaigns',
          type: 'case-study',
          category: 'Threat Detection',
          difficulty: 'Intermediate',
          views: 3700,
          rating: 4.6,
          author: 'Threat Intel',
          createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
          tags: ['phishing', 'email', 'analysis'],
        },
      ];

      setDocuments(mockDocuments);
      setFilteredDocuments(mockDocuments);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Filter documents
    let filtered = documents;

    if (searchQuery) {
      filtered = filtered.filter(
        doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
               doc.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    if (selectedType) {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(doc => doc.difficulty === selectedDifficulty);
    }

    setFilteredDocuments(filtered);
  }, [searchQuery, selectedCategory, selectedType, selectedDifficulty, documents]);

  const getTrendingDocuments = () => {
    return documents
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const getTypeIcon = (type: string) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj?.icon || '📄';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-orange-100 text-orange-800';
      case 'Expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Knowledge Base</h1>
        <p className="text-xl text-gray-600">Search 1000+ articles, videos, case studies, and best practices</p>
      </div>

      {/* Main Navigation */}
      <div className="flex space-x-4 border-b overflow-x-auto">
        <button
          onClick={() => setTab('search')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'browse' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setTab('trending')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'trending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setTab('resources')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Resources
        </button>
      </div>

      {/* Tab Content */}
      {(tab === 'search' || tab === 'browse') && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Type Filter */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Document Type</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedType === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All Types
                </button>
                {types.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(selectedType === type.value ? null : type.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedType === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Difficulty Level</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDifficulty(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedDifficulty === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All Levels
                </button>
                {difficulties.map(difficulty => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDifficulty === difficulty
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              {filteredDocuments.length} {filteredDocuments.length === 1 ? 'result' : 'results'} found
            </h2>
            <div className="space-y-4">
              {filteredDocuments.map(doc => (
                <Card
                  key={doc.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getTypeIcon(doc.type)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{doc.title}</h3>
                      <p className="text-gray-700 text-sm mb-3">{doc.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(doc.difficulty)}`}>
                          {doc.difficulty}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {doc.category}
                        </span>
                        {doc.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>By {doc.author}</span>
                        <div className="flex gap-4">
                          <span>⭐ {doc.rating} ({doc.views} views)</span>
                          <span>📅 {doc.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No documents found matching your criteria. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'trending' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Trending Content</h2>
          <div className="space-y-4">
            {getTrendingDocuments().map((doc, idx) => (
              <Card key={doc.id} className="p-6 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="text-4xl font-bold text-gray-300 w-12 text-center">#{idx + 1}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{doc.title}</h3>
                    <p className="text-gray-700 text-sm mb-3">{doc.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3">
                        <span className="text-sm text-gray-600">👁️ {doc.views} views</span>
                        <span className="text-sm text-gray-600">⭐ {doc.rating}</span>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
                        Read
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Learning Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">📚 Security Runbooks</h3>
              <p className="text-gray-600 mb-4">Step-by-step guides for common security operations and incident response procedures.</p>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                Browse Runbooks
              </button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">🎓 Security Academy</h3>
              <p className="text-gray-600 mb-4">Comprehensive video courses, labs, and hands-on training materials for security professionals.</p>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                Access Academy
              </button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">🔍 Threat Intelligence</h3>
              <p className="text-gray-600 mb-4">Latest threat reports, IOCs, and security research on emerging threats and vulnerabilities.</p>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                View Threat Intel
              </button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">⚙️ Technical Documentation</h3>
              <p className="text-gray-600 mb-4">API documentation, deployment guides, and technical reference materials for integration.</p>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                View Documentation
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* Document Detail Modal (Simplified) */}
      {selectedDocument && (
        <Card className="mt-8 p-8 border-2 border-blue-400">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{selectedDocument.title}</h2>
              <p className="text-gray-600">By {selectedDocument.author} • {selectedDocument.createdAt.toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => setSelectedDocument(null)}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <p className="text-gray-700 text-lg mb-6">{selectedDocument.description}</p>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(selectedDocument.difficulty)}`}>
              {selectedDocument.difficulty}
            </span>
            <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {selectedDocument.category}
            </span>
            {selectedDocument.tags.map(tag => (
              <span key={tag} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
              Read Full Article
            </button>
            <button className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50">
              Share
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50">
              Save
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
