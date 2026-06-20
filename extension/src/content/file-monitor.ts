/**
 * BlockStop File Monitor
 * Monitors downloads and triggers file scanning
 */

/**
 * Initialize file monitor
 */
export function initFileMonitor(): void {
  console.log('[FileMonitor] Initializing');

  // Listen for messages from background worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FILE_DOWNLOADED') {
      handleFileDownloaded(request.payload);
    }
  });

  // Inject download notification styles
  injectStyles();
}

/**
 * Inject styles for notifications
 */
function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .blockstop-file-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border-left: 4px solid #2563eb;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 12px 16px;
      max-width: 400px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
    }

    .blockstop-file-notification.scanning {
      border-left-color: #3b82f6;
      background-color: #eff6ff;
    }

    .blockstop-file-notification.safe {
      border-left-color: #16a34a;
      background-color: #f0fdf4;
    }

    .blockstop-file-notification.warning {
      border-left-color: #ea580c;
      background-color: #fff7ed;
    }

    .blockstop-file-notification.danger {
      border-left-color: #dc2626;
      background-color: #fef2f2;
    }

    .blockstop-file-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .blockstop-file-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .blockstop-file-name {
      font-weight: 600;
      margin-bottom: 4px;
      word-break: break-word;
    }

    .blockstop-file-details {
      color: #6b7280;
      font-size: 12px;
      margin-top: 4px;
    }

    .blockstop-file-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .blockstop-file-action-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      background-color: #e5e7eb;
      color: #1f2937;
      transition: background-color 0.2s;
    }

    .blockstop-file-action-btn:hover {
      background-color: #d1d5db;
    }

    .blockstop-file-action-btn.danger {
      background-color: #fecaca;
      color: #7f1d1d;
    }

    .blockstop-file-action-btn.danger:hover {
      background-color: #fca5a5;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Handle downloaded file
 */
async function handleFileDownloaded(payload: {
  filename: string;
  url: string;
}): Promise<void> {
  const { filename, url } = payload;

  console.log('[FileMonitor] File downloaded:', filename);

  // Show scanning notification
  const notification = showNotification({
    filename,
    status: 'scanning',
    message: 'Scanning file...',
  });

  try {
    // Get file from download
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    const blob = await response.blob();
    const file = new File([blob], filename);

    // Send to background worker for scanning
    const result = await chrome.runtime.sendMessage({
      type: 'SCAN_FILE',
      payload: { file },
    });

    if (result.success) {
      const scanResult = result.data;
      updateNotification(notification, {
        status: scanResult.threatLevel,
        message: `Scan complete: ${scanResult.threats?.length || 0} threat${
          scanResult.threats?.length !== 1 ? 's' : ''
        } detected`,
        details: `Risk score: ${scanResult.riskScore}%`,
      });
    } else {
      updateNotification(notification, {
        status: 'warning',
        message: `Scan failed: ${result.error}`,
      });
    }
  } catch (error) {
    console.error('[FileMonitor] Error scanning file:', error);
    updateNotification(notification, {
      status: 'danger',
      message: 'Error scanning file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Show file notification
 */
function showNotification(options: {
  filename: string;
  status: 'scanning' | 'safe' | 'warning' | 'danger';
  message: string;
  details?: string;
}): HTMLElement {
  const notification = document.createElement('div');
  notification.className = `blockstop-file-notification ${options.status}`;

  const fileName = document.createElement('div');
  fileName.className = 'blockstop-file-name';
  fileName.textContent = options.filename;

  const statusEl = document.createElement('div');
  statusEl.className = 'blockstop-file-status';

  if (options.status === 'scanning') {
    const spinner = document.createElement('span');
    spinner.className = 'blockstop-file-spinner';
    statusEl.appendChild(spinner);
  } else {
    const emoji = getStatusEmoji(options.status);
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = emoji;
    statusEl.appendChild(emojiSpan);
  }

  const message = document.createElement('span');
  message.textContent = options.message;
  statusEl.appendChild(message);

  notification.appendChild(fileName);
  notification.appendChild(statusEl);

  if (options.details) {
    const details = document.createElement('div');
    details.className = 'blockstop-file-details';
    details.textContent = options.details;
    notification.appendChild(details);
  }

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 10000);

  return notification;
}

/**
 * Update notification
 */
function updateNotification(
  notification: HTMLElement,
  options: {
    status?: 'scanning' | 'safe' | 'warning' | 'danger';
    message: string;
    details?: string;
  }
): void {
  if (options.status) {
    notification.className = `blockstop-file-notification ${options.status}`;
  }

  const statusEl = notification.querySelector('.blockstop-file-status');
  if (statusEl) {
    statusEl.innerHTML = '';

    if (options.status === 'scanning') {
      const spinner = document.createElement('span');
      spinner.className = 'blockstop-file-spinner';
      statusEl.appendChild(spinner);
    } else {
      const emoji = document.createElement('span');
      emoji.textContent = getStatusEmoji(options.status || 'warning');
      statusEl.appendChild(emoji);
    }

    const message = document.createElement('span');
    message.textContent = options.message;
    statusEl.appendChild(message);
  }

  // Update or add details
  let detailsEl = notification.querySelector('.blockstop-file-details');
  if (options.details) {
    if (!detailsEl) {
      detailsEl = document.createElement('div');
      detailsEl.className = 'blockstop-file-details';
      notification.appendChild(detailsEl);
    }
    detailsEl.textContent = options.details;
  }
}

/**
 * Get emoji for status
 */
function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    scanning: '🔍',
    safe: '✓',
    warning: '⚠️',
    danger: '🛑',
  };
  return emojis[status] || '?';
}

// Initialize file monitor
initFileMonitor();

console.log('[FileMonitor] Loaded');
