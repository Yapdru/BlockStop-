'use client';

import { useState } from 'react';

interface IOC {
  id: string;
  type: string;
  value: string;
  source: string;
  confidence: number;
  tags: string[];
  firstSeen: string;
  lastSeen: string;
}

interface Analysis {
  prediction?: {
    riskScore: number;
    threatLevel: string;
  };
  classification?: {
    primaryClass: string;
    confidence: number;
  };
  related?: IOC[];
}

export default function IndicatorSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<IOC[]>([]);
  const [selectedIOC, setSelectedIOC] = useState<IOC | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/threat-intel/indicators?indicator=${encodeURIComponent(searchQuery)}&analysis=false`
      );
      const data = await response.json();

      setResults(data.indicators || []);
      setSelectedIOC(null);
      setAnalysis(null);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }

  async function analyzeIOC(ioc: IOC) {
    setSelectedIOC(ioc);
    setAnalyzing(true);

    try {
      const response = await fetch('/api/threat-intel/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-indicator',
          indicator: ioc.value,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Indicator Search</h1>
          <p className="text-slate-400">Search and analyze threat indicators</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for IP, domain, URL, hash, or email..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-semibold transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-3 gap-8">
          {/* Results List */}
          <div className="col-span-1">
            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="font-bold">Results ({results.length})</h2>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="p-4 text-slate-400 text-sm">No results found</div>
                ) : (
                  results.map((ioc) => (
                    <button
                      key={ioc.id}
                      onClick={() => analyzeIOC(ioc)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${
                        selectedIOC?.id === ioc.id ? 'bg-slate-800' : ''
                      }`}
                    >
                      <div className="text-sm font-mono text-blue-400 truncate">
                        {ioc.value}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{ioc.type}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details and Analysis */}
          <div className="col-span-2">
            {selectedIOC ? (
              <div className="space-y-6">
                {/* IOC Details */}
                <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                  <h3 className="text-lg font-bold mb-4">Indicator Details</h3>

                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-400 text-sm">Value</span>
                      <div className="font-mono text-sm break-all bg-slate-800 p-2 rounded mt-1">
                        {selectedIOC.value}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 text-sm">Type</span>
                        <div className="font-semibold capitalize mt-1">
                          {selectedIOC.type}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-sm">Source</span>
                        <div className="font-semibold mt-1">{selectedIOC.source}</div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-sm">Confidence</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${selectedIOC.confidence}%` }}
                            />
                          </div>
                          <span className="font-semibold">{selectedIOC.confidence}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-sm">First Seen</span>
                        <div className="text-sm mt-1">
                          {new Date(selectedIOC.firstSeen).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {selectedIOC.tags.length > 0 && (
                      <div>
                        <span className="text-slate-400 text-sm">Tags</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedIOC.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-slate-800 rounded text-xs font-semibold text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ML Analysis */}
                {analyzing ? (
                  <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                    <div className="text-center text-slate-400">Analyzing...</div>
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    {analysis.prediction && (
                      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                        <h3 className="font-bold mb-4">Threat Prediction</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-slate-400 text-sm">Risk Score</span>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 h-2 bg-slate-700 rounded-full">
                                <div
                                  className={`h-full rounded-full ${
                                    analysis.prediction.riskScore > 70
                                      ? 'bg-red-600'
                                      : 'bg-yellow-600'
                                  }`}
                                  style={{ width: `${analysis.prediction.riskScore}%` }}
                                />
                              </div>
                              <span className="font-bold min-w-12">
                                {analysis.prediction.riskScore}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-sm">Threat Level</span>
                            <div className="font-semibold capitalize mt-1">
                              {analysis.prediction.threatLevel}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {analysis.classification && (
                      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                        <h3 className="font-bold mb-4">Classification</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-slate-400 text-sm">Primary Class</span>
                            <div className="font-semibold capitalize mt-1">
                              {analysis.classification.primaryClass}
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-sm">Confidence</span>
                            <div className="font-semibold mt-1">
                              {analysis.classification.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {analysis.related && analysis.related.length > 0 && (
                      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                        <h3 className="font-bold mb-4">
                          Related Indicators ({analysis.related.length})
                        </h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {analysis.related.map((rel) => (
                            <div
                              key={rel.id}
                              className="text-sm font-mono text-blue-400 truncate hover:text-blue-300"
                            >
                              {rel.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => analyzeIOC(selectedIOC)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                  >
                    Analyze with ML
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 text-center text-slate-400">
                Select an indicator to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
