/**
 * Main Application Window Component
 * Primary interface for BlockStop desktop application
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import SystemTrayMenu from '../components/SystemTrayMenu';
import QuickActionBar from '../components/QuickActionBar';
import '../styles/electron-theme.css';

interface ScanResult {
  file: string;
  threat: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  details: string;
  timestamp: number;
  quarantined: boolean;
}

const MainWindow: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize IPC listeners
  useEffect(() => {
    const ipcRenderer = window.electron?.ipcRenderer;
    if (!ipcRenderer) return;

    // Listen for scan progress updates
    ipcRenderer.on('scan:progress', (event: any, progress: any) => {
      setScanProgress(progress);
    });

    // Listen for file drop events
    ipcRenderer.on('files-dropped', (event: any, files: string[]) => {
      setSelectedFiles(files);
    });

    // Load recent scans
    loadRecentScans();

    return () => {
      ipcRenderer.removeAllListeners('scan:progress');
      ipcRenderer.removeAllListeners('files-dropped');
    };
  }, []);

  // Setup drag and drop
  useEffect(() => {
    if (!dropZoneRef.current) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZoneRef.current?.classList.add('drag-over');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZoneRef.current?.classList.remove('drag-over');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZoneRef.current?.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer?.files || []).map((f) => f.path);
      if (files.length > 0) {
        setSelectedFiles(files);
      }
    };

    const zone = dropZoneRef.current;
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);

    return () => {
      zone.removeEventListener('dragover', handleDragOver);
      zone.removeEventListener('dragleave', handleDragLeave);
      zone.removeEventListener('drop', handleDrop);
    };
  }, []);

  const loadRecentScans = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      // Load from local storage or IPC
      const stored = localStorage.getItem('recentScans');
      if (stored) {
        setRecentScans(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    }
  }, []);

  const handleFileSelect = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('file:open-dialog', {
        properties: ['openFile', 'multiSelections'],
      });

      if (!result.canceled) {
        setSelectedFiles(result.filePaths);
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error);
    }
  }, []);

  const handleFolderSelect = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('file:open-dialog', {
        properties: ['openDirectory'],
      });

      if (!result.canceled) {
        setSelectedFiles(result.filePaths);
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
    }
  }, []);

  const handleStartScan = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsScanning(true);
      setScanProgress({ current: 0, total: selectedFiles.length });

      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('scan:start', selectedFiles, {
        pattern: 'default',
        deep: false,
      });

      if (result.success) {
        setScanResults(result.results);

        // Save to recent scans
        const newScan = {
          timestamp: Date.now(),
          files: selectedFiles.length,
          threats: result.results.filter((r: ScanResult) => r.severity !== 'info').length,
          results: result.results,
        };

        const updated = [newScan, ...recentScans].slice(0, 10);
        setRecentScans(updated);
        localStorage.setItem('recentScans', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  }, [selectedFiles, recentScans]);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
    setScanResults([]);
  }, []);

  const handleQuarantineFile = useCallback(async (filePath: string) => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('scan:quarantine', filePath);
      if (result.success) {
        setScanResults((prev) =>
          prev.map((r) =>
            r.file === filePath ? { ...r, quarantined: true } : r
          )
        );
      }
    } catch (error) {
      console.error('Quarantine failed:', error);
    }
  }, []);

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

  const criticalCount = scanResults.filter((r) => r.severity === 'critical').length;
  const highCount = scanResults.filter((r) => r.severity === 'high').length;
  const threatCount = scanResults.filter((r) => r.severity !== 'info').length;

  return (
    <div className="main-window">
      <QuickActionBar onOpenScanner={handleFileSelect} onOpenSettings={() => {}} />

      <div className="window-content">
        <header className="app-header">
          <h1 className="app-title">BlockStop</h1>
          <p className="app-subtitle">File Security Scanner & Blocker</p>
        </header>

        <div className="dashboard-grid">
          {/* Stats Overview */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#d32f2f' }}>
                {criticalCount}
              </div>
              <div className="stat-label">Critical Threats</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#f57c00' }}>
                {highCount}
              </div>
              <div className="stat-label">High Risk</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#1976d2' }}>
                {selectedFiles.length}
              </div>
              <div className="stat-label">Files Selected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#7cb342' }}>
                {threatCount}
              </div>
              <div className="stat-label">Total Threats</div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            className="drop-zone"
            onClick={handleFileSelect}
          >
            <div className="drop-zone-content">
              <div className="drop-zone-icon">📁</div>
              <h2>Drag files here to scan</h2>
              <p>or click to browse</p>
              <div className="drop-zone-actions">
                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect();
                  }}
                >
                  Select Files
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFolderSelect();
                  }}
                >
                  Select Folder
                </button>
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <div className="section-header">
                <h3>Selected Files ({selectedFiles.length})</h3>
                <button className="btn-text" onClick={handleClearSelection}>
                  Clear
                </button>
              </div>
              <div className="files-list">
                {selectedFiles.slice(0, 5).map((file, idx) => (
                  <div key={idx} className="file-item">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name">{file.split('\\').pop()}</div>
                      <div className="file-path">{file}</div>
                    </div>
                  </div>
                ))}
                {selectedFiles.length > 5 && (
                  <div className="file-item more">
                    <div className="file-icon">+{selectedFiles.length - 5}</div>
                    <div className="file-info">
                      <div className="file-name">More files</div>
                    </div>
                  </div>
                )}
              </div>
              <button
                className={`btn btn-primary ${isScanning ? 'loading' : ''}`}
                onClick={handleStartScan}
                disabled={isScanning}
              >
                {isScanning
                  ? `Scanning ${scanProgress.current}/${scanProgress.total}`
                  : 'Start Scan'}
              </button>
            </div>
          )}

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <div className="results-section">
              <div className="section-header">
                <h3>Scan Results ({scanResults.length})</h3>
              </div>
              <div className="results-list">
                {scanResults.slice(0, 10).map((result, idx) => (
                  <div
                    key={idx}
                    className="result-item"
                    style={{
                      borderLeftColor: getSeverityColor(result.severity),
                    }}
                  >
                    <div className="result-header">
                      <div className="result-title">
                        <span className="threat-badge" style={{
                          backgroundColor: getSeverityColor(result.severity),
                        }}>
                          {result.severity.toUpperCase()}
                        </span>
                        <span className="threat-name">{result.threat}</span>
                      </div>
                      {!result.quarantined && (
                        <button
                          className="btn-icon"
                          onClick={() => handleQuarantineFile(result.file)}
                          title="Quarantine"
                        >
                          🔒
                        </button>
                      )}
                      {result.quarantined && (
                        <span className="quarantine-badge">Quarantined</span>
                      )}
                    </div>
                    <div className="result-file">{result.file}</div>
                    <div className="result-details">{result.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="recent-scans">
              <div className="section-header">
                <h3>Recent Scans</h3>
              </div>
              <div className="scans-list">
                {recentScans.slice(0, 5).map((scan, idx) => (
                  <div key={idx} className="scan-item">
                    <div className="scan-time">
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                    <div className="scan-stats">
                      <span className="scan-stat">
                        {scan.files} files
                      </span>
                      <span className="scan-stat">
                        {scan.threats} threats
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []).map((f) => f.path);
          setSelectedFiles(files);
        }}
      />
    </div>
  );
};

export default MainWindow;
