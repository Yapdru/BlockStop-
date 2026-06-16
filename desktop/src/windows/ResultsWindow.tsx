/**
 * Results Window Component
 * Detailed scan results display and management
 */

import React, { useState, useCallback, useEffect } from 'react';

interface ScanResult {
  file: string;
  threat: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  details: string;
  timestamp: number;
  quarantined: boolean;
}

type SortBy = 'severity' | 'filename' | 'timestamp';
type FilterSeverity = 'all' | 'critical' | 'high' | 'medium' | 'low' | 'info';

const ResultsWindow: React.FC = () => {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>('severity');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    // Load results from previous scan (would come from main window via IPC)
    const stored = sessionStorage.getItem('scanResults');
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  const handleSelectResult = useCallback((file: string) => {
    setSelectedResults((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedResults.size === filteredResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(filteredResults.map((r) => r.file)));
    }
  }, []);

  const handleQuarantineSelected = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      for (const file of selectedResults) {
        await ipcRenderer.invoke('scan:quarantine', file);
      }

      setResults((prev) =>
        prev.map((r) =>
          selectedResults.has(r.file) ? { ...r, quarantined: true } : r
        )
      );

      setSelectedResults(new Set());
    } catch (error) {
      console.error('Failed to quarantine files:', error);
    }
  }, [selectedResults]);

  const handleDeleteSelected = useCallback(async () => {
    if (!confirm(`Delete ${selectedResults.size} files permanently?`)) return;

    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      for (const file of selectedResults) {
        await ipcRenderer.invoke('file:delete', file);
      }

      setResults((prev) => prev.filter((r) => !selectedResults.has(r.file)));
      setSelectedResults(new Set());
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  }, [selectedResults]);

  const handleOpenFile = useCallback(async (file: string) => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      await ipcRenderer.invoke('system:open-path', file);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, []);

  const handleExportResults = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('file:save-dialog', {
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'CSV', extensions: ['csv'] },
          { name: 'Text', extensions: ['txt'] },
        ],
      });

      if (!result.canceled) {
        let content: string;

        if (result.filePath.endsWith('.json')) {
          content = JSON.stringify(results, null, 2);
        } else if (result.filePath.endsWith('.csv')) {
          const headers = ['File', 'Threat', 'Severity', 'Details', 'Timestamp'];
          const rows = results.map((r) => [
            `"${r.file}"`,
            `"${r.threat}"`,
            r.severity,
            `"${r.details}"`,
            new Date(r.timestamp).toISOString(),
          ]);
          content = [headers, ...rows].map((r) => r.join(',')).join('\n');
        } else {
          content = results
            .map(
              (r) =>
                `${r.file}\nThreat: ${r.threat}\nSeverity: ${r.severity}\nDetails: ${r.details}\n`
            )
            .join('\n---\n');
        }

        await ipcRenderer.invoke('file:write', result.filePath, content);
      }
    } catch (error) {
      console.error('Failed to export results:', error);
    }
  }, [results]);

  const filteredResults = results
    .filter((r) => filterSeverity === 'all' || r.severity === filterSeverity)
    .filter((r) =>
      searchQuery === ''
        ? true
        : r.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.threat.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity': {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        case 'filename':
          return a.file.localeCompare(b.file);
        case 'timestamp':
          return b.timestamp - a.timestamp;
        default:
          return 0;
      }
    });

  const severityCounts = {
    critical: results.filter((r) => r.severity === 'critical').length,
    high: results.filter((r) => r.severity === 'high').length,
    medium: results.filter((r) => r.severity === 'medium').length,
    low: results.filter((r) => r.severity === 'low').length,
    info: results.filter((r) => r.severity === 'info').length,
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#7cb342',
      info: '#1976d2',
    };
    return colors[severity] || '#666';
  };

  return (
    <div className="results-window">
      <div className="window-content">
        <header className="window-header">
          <h1>Scan Results</h1>
          <p>Review and manage detected threats</p>
        </header>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat" style={{ color: '#d32f2f' }}>
            <span className="stat-number">{severityCounts.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat" style={{ color: '#f57c00' }}>
            <span className="stat-number">{severityCounts.high}</span>
            <span className="stat-label">High</span>
          </div>
          <div className="stat" style={{ color: '#fbc02d' }}>
            <span className="stat-number">{severityCounts.medium}</span>
            <span className="stat-label">Medium</span>
          </div>
          <div className="stat" style={{ color: '#7cb342' }}>
            <span className="stat-number">{severityCounts.low}</span>
            <span className="stat-label">Low</span>
          </div>
          <div className="stat">
            <span className="stat-number">{results.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Controls */}
        <div className="results-controls">
          <div className="search-group">
            <input
              type="text"
              className="search-input"
              placeholder="Search files or threats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="severity">Sort by Severity</option>
              <option value="filename">Sort by Filename</option>
              <option value="timestamp">Sort by Time</option>
            </select>

            <div className="view-buttons">
              <button
                className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                ☰
              </button>
              <button
                className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                ⊞
              </button>
            </div>
          </div>

          <div className="action-buttons">
            {selectedResults.size > 0 && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleQuarantineSelected}
                >
                  Quarantine ({selectedResults.size})
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteSelected}
                >
                  Delete ({selectedResults.size})
                </button>
              </>
            )}
            <button className="btn btn-primary" onClick={handleExportResults}>
              Export Results
            </button>
          </div>
        </div>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h2>No threats found</h2>
            <p>All scanned files appear to be safe</p>
          </div>
        ) : (
          <div className={`results-container ${viewMode}`}>
            {viewMode === 'list' ? (
              <div className="results-table">
                <div className="table-header">
                  <label className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedResults.size === filteredResults.length}
                      onChange={handleSelectAll}
                    />
                  </label>
                  <div className="severity-cell">Severity</div>
                  <div className="threat-cell">Threat</div>
                  <div className="file-cell">File</div>
                  <div className="details-cell">Details</div>
                  <div className="actions-cell">Actions</div>
                </div>
                {filteredResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="table-row"
                    style={{
                      backgroundColor: selectedResults.has(result.file)
                        ? 'rgba(25, 118, 210, 0.08)'
                        : 'transparent',
                    }}
                  >
                    <label className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedResults.has(result.file)}
                        onChange={() => handleSelectResult(result.file)}
                      />
                    </label>
                    <div
                      className="severity-cell"
                      style={{ color: getSeverityColor(result.severity) }}
                    >
                      <span className="severity-badge">
                        {result.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="threat-cell">
                      <strong>{result.threat}</strong>
                    </div>
                    <div className="file-cell" title={result.file}>
                      {result.file.split('\\').pop()}
                    </div>
                    <div className="details-cell">{result.details}</div>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenFile(result.file)}
                        title="Open file location"
                      >
                        📁
                      </button>
                      {!result.quarantined && (
                        <button
                          className="btn-icon"
                          onClick={() => handleSelectResult(result.file)}
                          title="Select for quarantine"
                        >
                          ☑
                        </button>
                      )}
                      {result.quarantined && (
                        <span className="quarantine-badge">Q</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="results-grid">
                {filteredResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="grid-card"
                    style={{
                      borderTopColor: getSeverityColor(result.severity),
                      backgroundColor: selectedResults.has(result.file)
                        ? 'rgba(25, 118, 210, 0.08)'
                        : 'transparent',
                    }}
                  >
                    <div className="card-header">
                      <div
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(result.severity) }}
                      >
                        {result.severity.toUpperCase()}
                      </div>
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedResults.has(result.file)}
                          onChange={() => handleSelectResult(result.file)}
                        />
                      </label>
                    </div>
                    <div className="card-content">
                      <h3>{result.threat}</h3>
                      <p className="card-file">{result.file.split('\\').pop()}</p>
                      <p className="card-details">{result.details}</p>
                      <div className="card-time">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-small"
                        onClick={() => handleOpenFile(result.file)}
                      >
                        Open Location
                      </button>
                      {!result.quarantined && (
                        <button
                          className="btn-small btn-danger"
                          onClick={() => handleSelectResult(result.file)}
                        >
                          Quarantine
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsWindow;
