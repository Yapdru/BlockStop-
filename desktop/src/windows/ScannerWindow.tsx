/**
 * Scanner Window Component
 * Advanced file scanning interface with detailed options
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ScanOptions {
  pattern: 'quick' | 'deep' | 'default' | 'custom';
  scanExecutables: boolean;
  scanScripts: boolean;
  scanArchives: boolean;
  checkSignatures: boolean;
  maxFileSize: number;
  includeSubfolders: boolean;
  excludePatterns: string[];
}

interface ScanFile {
  path: string;
  name: string;
  size: number;
  status: 'pending' | 'scanning' | 'complete' | 'error';
  result?: any;
}

const ScannerWindow: React.FC = () => {
  const [scanPath, setScanPath] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [scannedFiles, setScannedFiles] = useState<ScanFile[]>([]);
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    pattern: 'default',
    scanExecutables: true,
    scanScripts: true,
    scanArchives: false,
    checkSignatures: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    includeSubfolders: true,
    excludePatterns: ['node_modules', '.git', '__pycache__'],
  });
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ipcRenderer = window.electron?.ipcRenderer;
    if (!ipcRenderer) return;

    const handleScanProgress = (event: any, progress: any) => {
      setScanProgress({
        ...progress,
        percentage: Math.round((progress.current / progress.total) * 100),
      });
    };

    ipcRenderer.on('scan:progress', handleScanProgress);

    return () => {
      ipcRenderer.removeAllListeners('scan:progress');
    };
  }, []);

  // Setup drag and drop
  useEffect(() => {
    if (!dropZoneRef.current) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      dropZoneRef.current?.classList.add('drag-over');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dropZoneRef.current?.classList.remove('drag-over');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dropZoneRef.current?.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        const firstFile = files[0];
        setScanPath(firstFile.path);
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

  const handleBrowsePath = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('file:open-dialog', {
        properties: ['openDirectory'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setScanPath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Failed to browse path:', error);
    }
  }, []);

  const handleStartScan = useCallback(async () => {
    if (!scanPath) return;

    try {
      setIsScanning(true);
      setScanProgress({ current: 0, total: 0, percentage: 0 });
      setScannedFiles([]);

      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('scan:start', [scanPath], scanOptions);

      if (result.success) {
        setScannedFiles(
          result.results.map((r: any) => ({
            path: r.file,
            name: r.file.split('\\').pop() || r.file,
            size: 0,
            status: 'complete',
            result: r,
          }))
        );
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  }, [scanPath, scanOptions]);

  const handleCancelScan = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      await ipcRenderer.invoke('scan:cancel');
      setIsScanning(false);
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  }, []);

  const handlePatternChange = (pattern: ScanOptions['pattern']) => {
    setScanOptions((prev) => ({
      ...prev,
      pattern,
      // Auto-configure based on pattern
      scanExecutables: pattern !== 'quick',
      scanScripts: pattern !== 'quick',
      scanArchives: pattern === 'deep',
      checkSignatures: pattern === 'deep',
    }));
  };

  const handleOptionChange = (key: keyof ScanOptions, value: any) => {
    setScanOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const threatCount = scannedFiles.filter((f) => f.result?.severity !== 'info').length;
  const cleanCount = scannedFiles.length - threatCount;

  return (
    <div className="scanner-window">
      <div className="window-content">
        <header className="window-header">
          <h1>File Scanner</h1>
          <p>Advanced scanning with customizable options</p>
        </header>

        <div className="scanner-layout">
          {/* Path Selection */}
          <div className="scanner-section">
            <h2>Select Target</h2>
            <div
              ref={dropZoneRef}
              className="drop-zone-inline"
            >
              <div className="path-input-group">
                <input
                  type="text"
                  className="path-input"
                  value={scanPath}
                  onChange={(e) => setScanPath(e.target.value)}
                  placeholder="Drag folder here or click browse"
                  disabled={isScanning}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleBrowsePath}
                  disabled={isScanning}
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          {/* Scan Pattern Selection */}
          <div className="scanner-section">
            <h2>Scan Pattern</h2>
            <div className="pattern-buttons">
              {(['quick', 'default', 'deep'] as const).map((pattern) => (
                <button
                  key={pattern}
                  className={`btn btn-pattern ${scanOptions.pattern === pattern ? 'active' : ''}`}
                  onClick={() => handlePatternChange(pattern)}
                  disabled={isScanning}
                >
                  <div className="pattern-name">{pattern.toUpperCase()}</div>
                  <div className="pattern-desc">
                    {pattern === 'quick' && 'Fast surface scan'}
                    {pattern === 'default' && 'Standard scan'}
                    {pattern === 'deep' && 'Thorough analysis'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="scanner-section">
            <h2>Advanced Options</h2>
            <div className="options-grid">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scanOptions.scanExecutables}
                  onChange={(e) => handleOptionChange('scanExecutables', e.target.checked)}
                  disabled={isScanning}
                />
                <span>Scan Executables (.exe, .dll)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scanOptions.scanScripts}
                  onChange={(e) => handleOptionChange('scanScripts', e.target.checked)}
                  disabled={isScanning}
                />
                <span>Scan Scripts (.bat, .ps1, .py)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scanOptions.scanArchives}
                  onChange={(e) => handleOptionChange('scanArchives', e.target.checked)}
                  disabled={isScanning}
                />
                <span>Scan Archives (.zip, .rar)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scanOptions.checkSignatures}
                  onChange={(e) => handleOptionChange('checkSignatures', e.target.checked)}
                  disabled={isScanning}
                />
                <span>Check Digital Signatures</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scanOptions.includeSubfolders}
                  onChange={(e) => handleOptionChange('includeSubfolders', e.target.checked)}
                  disabled={isScanning}
                />
                <span>Include Subfolders</span>
              </label>

              <div className="option-item">
                <label htmlFor="maxFileSize">Max File Size (MB)</label>
                <input
                  id="maxFileSize"
                  type="number"
                  value={scanOptions.maxFileSize / (1024 * 1024)}
                  onChange={(e) =>
                    handleOptionChange('maxFileSize', parseInt(e.target.value) * 1024 * 1024)
                  }
                  disabled={isScanning}
                />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="scanner-controls">
            {isScanning ? (
              <>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${scanProgress.percentage}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    {scanProgress.current} of {scanProgress.total} files scanned
                    ({scanProgress.percentage}%)
                  </div>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={handleCancelScan}
                >
                  Cancel Scan
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary btn-large"
                onClick={handleStartScan}
                disabled={!scanPath}
              >
                Start Scan
              </button>
            )}
          </div>

          {/* Results Summary */}
          {scannedFiles.length > 0 && (
            <div className="scanner-section">
              <h2>Scan Results</h2>
              <div className="results-summary">
                <div className="summary-item">
                  <div className="summary-value" style={{ color: '#7cb342' }}>
                    {cleanCount}
                  </div>
                  <div className="summary-label">Clean Files</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value" style={{ color: '#d32f2f' }}>
                    {threatCount}
                  </div>
                  <div className="summary-label">Threats Found</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">{scannedFiles.length}</div>
                  <div className="summary-label">Total Scanned</div>
                </div>
              </div>

              <div className="results-list">
                {scannedFiles.slice(0, 10).map((file, idx) => (
                  <div
                    key={idx}
                    className="result-row"
                    style={{
                      backgroundColor:
                        file.result?.severity === 'info'
                          ? 'transparent'
                          : 'rgba(211, 47, 47, 0.05)',
                    }}
                  >
                    <div className="result-status">
                      {file.result?.severity === 'info' ? '✓' : '⚠'}
                    </div>
                    <div className="result-file-name">{file.name}</div>
                    {file.result && (
                      <div className="result-threat">{file.result.threat}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerWindow;
