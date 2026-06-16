/**
 * Update Window Component
 * Notification and management for application updates
 */

import React, { useState, useCallback, useEffect } from 'react';

interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
  downloadUrl: string;
  fileSize: string;
  critical: boolean;
  features: string[];
  bugFixes: string[];
}

const UpdateWindow: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    version: '1.1.0',
    releaseNotes: 'Major improvements and bug fixes',
    releaseDate: new Date().toLocaleDateString(),
    downloadUrl: '',
    fileSize: '45.2 MB',
    critical: false,
    features: [
      'Improved scanning performance',
      'Enhanced threat detection engine',
      'Better quarantine management',
      'Dark mode support',
    ],
    bugFixes: [
      'Fixed memory leak in scanner',
      'Improved file dialog performance',
      'Better error handling',
    ],
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'downloading' | 'ready' | 'installing'>('checking');

  useEffect(() => {
    checkForUpdates();

    const ipcRenderer = window.electron?.ipcRenderer;
    if (!ipcRenderer) return;

    const handleDownloadProgress = (event: any, progress: any) => {
      setDownloadProgress(progress.percentage);
    };

    const handleUpdateReady = (event: any) => {
      setUpdateStatus('ready');
    };

    ipcRenderer.on('update:progress', handleDownloadProgress);
    ipcRenderer.on('update:ready', handleUpdateReady);

    return () => {
      ipcRenderer.removeAllListeners('update:progress');
      ipcRenderer.removeAllListeners('update:ready');
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      setUpdateStatus('checking');
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      // Simulated update check
      setTimeout(() => {
        setUpdateStatus('downloading');
      }, 1000);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, []);

  const handleDownloadUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      // Simulated download
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          setDownloadProgress(100);
          setUpdateStatus('ready');
          setIsDownloading(false);
        } else {
          setDownloadProgress(progress);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to download update:', error);
      setIsDownloading(false);
    }
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    try {
      setUpdateStatus('installing');
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      await ipcRenderer.invoke('app:install-update');
    } catch (error) {
      console.error('Failed to install update:', error);
    }
  }, []);

  const handleSkipUpdate = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      // Close window or mark as skipped
      window.close();
    } catch (error) {
      console.error('Failed to skip update:', error);
    }
  }, []);

  const handleReleaseNotes = useCallback(() => {
    // Open release notes in browser
    const ipcRenderer = window.electron?.ipcRenderer;
    if (!ipcRenderer) return;

    ipcRenderer.invoke('system:open-url', 'https://blockstop.digital/releases');
  }, []);

  return (
    <div className="update-window">
      <div className="window-content update-content">
        <div className="update-header">
          {updateInfo.critical ? (
            <>
              <div className="update-icon critical">⚠️</div>
              <h1>Critical Update Available</h1>
            </>
          ) : (
            <>
              <div className="update-icon">📦</div>
              <h1>Update Available</h1>
            </>
          )}
        </div>

        <div className="update-info">
          <div className="version-info">
            <div className="current-version">
              <label>Current Version</label>
              <span>1.0.0</span>
            </div>
            <div className="arrow">→</div>
            <div className="new-version">
              <label>New Version</label>
              <span>{updateInfo.version}</span>
            </div>
          </div>

          <div className="update-details">
            <div className="detail-item">
              <label>Release Date</label>
              <span>{updateInfo.releaseDate}</span>
            </div>
            <div className="detail-item">
              <label>File Size</label>
              <span>{updateInfo.fileSize}</span>
            </div>
            {updateInfo.critical && (
              <div className="detail-item critical-notice">
                <strong>⚠️ This is a critical security update</strong>
              </div>
            )}
          </div>
        </div>

        {/* Release Notes */}
        <div className="release-notes">
          <h2>What's New</h2>

          {updateInfo.features.length > 0 && (
            <div className="notes-section">
              <h3>New Features</h3>
              <ul>
                {updateInfo.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="feature-icon">✨</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {updateInfo.bugFixes.length > 0 && (
            <div className="notes-section">
              <h3>Bug Fixes</h3>
              <ul>
                {updateInfo.bugFixes.map((fix, idx) => (
                  <li key={idx}>
                    <span className="fix-icon">🐛</span>
                    {fix}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn-link" onClick={handleReleaseNotes}>
            View Full Release Notes
          </button>
        </div>

        {/* Download Progress */}
        {updateStatus === 'downloading' && (
          <div className="download-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div className="progress-text">
              {isDownloading ? `Downloading... ${Math.round(downloadProgress)}%` : 'Preparing download...'}
            </div>
          </div>
        )}

        {updateStatus === 'ready' && (
          <div className="update-status ready">
            <div className="status-icon">✓</div>
            <div className="status-message">
              Update ready to install. BlockStop will restart to complete the installation.
            </div>
          </div>
        )}

        {updateStatus === 'installing' && (
          <div className="update-status installing">
            <div className="status-spinner">⟳</div>
            <div className="status-message">Installing update...</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="update-actions">
          {updateStatus === 'checking' && (
            <button
              className="btn btn-secondary"
              onClick={handleSkipUpdate}
            >
              Later
            </button>
          )}

          {updateStatus === 'checking' && (
            <button
              className={`btn btn-primary ${isDownloading ? 'loading' : ''}`}
              onClick={handleDownloadUpdate}
              disabled={isDownloading}
            >
              Download & Install
            </button>
          )}

          {updateStatus === 'downloading' && (
            <button
              className="btn btn-secondary"
              onClick={handleSkipUpdate}
              disabled={isDownloading}
            >
              Cancel
            </button>
          )}

          {updateStatus === 'ready' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => window.close()}
              >
                Later
              </button>
              <button
                className="btn btn-primary"
                onClick={handleInstallUpdate}
              >
                Install Now
              </button>
            </>
          )}

          {updateStatus === 'installing' && (
            <div className="installing-message">
              Please wait while BlockStop installs the update...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="update-footer">
          <p>
            BlockStop will automatically check for updates periodically. You can disable this in Settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdateWindow;
