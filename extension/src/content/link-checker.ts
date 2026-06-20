/**
 * BlockStop Link Checker
 * Provides hover preview for links with threat status
 */

interface LinkCheckCache {
  [url: string]: {
    isSafe: boolean;
    timestamp: number;
    riskScore: number;
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let linkCache: LinkCheckCache = {};

/**
 * Initialize link checker
 */
function init(): void {
  console.log('[LinkChecker] Initializing');

  // Inject styles
  injectStyles();

  // Load cache from storage
  loadCacheFromStorage();

  // Monitor all links
  observeAllLinks();
}

/**
 * Inject styles for link previews
 */
function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .blockstop-link-preview {
      position: absolute;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      display: none;
    }

    .blockstop-link-preview.show {
      display: block;
    }

    .blockstop-link-preview.safe {
      border-left: 3px solid #16a34a;
      background-color: #f0fdf4;
    }

    .blockstop-link-preview.suspicious {
      border-left: 3px solid #ea580c;
      background-color: #fff7ed;
    }

    .blockstop-link-preview.dangerous {
      border-left: 3px solid #dc2626;
      background-color: #fef2f2;
    }

    .blockstop-link-preview-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .blockstop-link-preview-url {
      color: #6b7280;
      word-break: break-all;
      margin-bottom: 4px;
    }

    .blockstop-link-preview-status {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .blockstop-link-preview-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }

    .blockstop-link-preview-badge.safe {
      background-color: #dcfce7;
      color: #15803d;
    }

    .blockstop-link-preview-badge.suspicious {
      background-color: #fed7aa;
      color: #7c2d12;
    }

    .blockstop-link-preview-badge.dangerous {
      background-color: #fecaca;
      color: #7f1d1d;
    }

    a[data-blockstop-status="safe"] {
      color: #16a34a;
    }

    a[data-blockstop-status="suspicious"] {
      color: #ea580c;
      text-decoration: underline wavy;
    }

    a[data-blockstop-status="dangerous"] {
      color: #dc2626;
      text-decoration: underline dashed;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Observe all links on page
 */
function observeAllLinks(): void {
  // Check existing links
  processAllLinks();

  // Watch for new links
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        for (const node of addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const links = element.querySelectorAll('a');
            links.forEach(setupLinkListener);

            // Check if the added node itself is a link
            if (element.tagName === 'A') {
              setupLinkListener(element as HTMLAnchorElement);
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Process all existing links on page
 */
function processAllLinks(): void {
  const links = document.querySelectorAll('a[href]');
  links.forEach(setupLinkListener);
}

/**
 * Setup hover listener for a link
 */
function setupLinkListener(link: HTMLAnchorElement): void {
  if ((link as any).__blockstopSetup) {
    return;
  }
  (link as any).__blockstopSetup = true;

  const url = link.href;
  if (!url || !url.startsWith('http')) {
    return;
  }

  // Check cache first
  const cached = linkCache[url];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    applyLinkStatus(link, cached.isSafe, cached.riskScore);
    return;
  }

  // On hover, show preview and check link
  let previewTimeout: number;
  let preview: HTMLElement | null = null;

  link.addEventListener('mouseenter', () => {
    previewTimeout = window.setTimeout(() => {
      preview = showLinkPreview(link);

      // Check link in background
      checkLink(url)
        .then((result) => {
          if (preview) {
            updateLinkPreview(preview, result);
          }
          applyLinkStatus(link, result.isSafe, result.riskScore);
        })
        .catch((error) => {
          console.error('[LinkChecker] Error checking link:', error);
        });
    }, 300);
  });

  link.addEventListener('mouseleave', () => {
    clearTimeout(previewTimeout);
    if (preview) {
      preview.remove();
      preview = null;
    }
  });
}

/**
 * Check link with background worker
 */
async function checkLink(
  url: string
): Promise<{ isSafe: boolean; riskScore: number; threats?: any[] }> {
  try {
    // Check cache first
    const cached = linkCache[url];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return {
        isSafe: cached.isSafe,
        riskScore: cached.riskScore,
      };
    }

    // Query background worker
    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_LINK',
      payload: { url },
    });

    if (response.success) {
      const result = response.data;

      // Cache result
      linkCache[url] = {
        isSafe: result.isSafe,
        timestamp: Date.now(),
        riskScore: result.riskScore,
      };

      // Save cache to storage
      saveCacheToStorage();

      return result;
    }

    return { isSafe: true, riskScore: 0 };
  } catch (error) {
    console.error('[LinkChecker] Error checking link:', error);
    return { isSafe: true, riskScore: 0 };
  }
}

/**
 * Show link preview popup
 */
function showLinkPreview(link: HTMLAnchorElement): HTMLElement {
  const preview = document.createElement('div');
  preview.className = 'blockstop-link-preview';

  const title = document.createElement('div');
  title.className = 'blockstop-link-preview-title';
  title.textContent = '🔍 Checking link...';

  const urlEl = document.createElement('div');
  urlEl.className = 'blockstop-link-preview-url';
  urlEl.textContent = link.href;

  preview.appendChild(title);
  preview.appendChild(urlEl);

  // Position preview near link
  document.body.appendChild(preview);

  const rect = link.getBoundingClientRect();
  preview.style.position = 'fixed';
  preview.style.top = `${rect.bottom + 8}px`;
  preview.style.left = `${Math.max(8, rect.left)}px`;

  preview.classList.add('show');
  return preview;
}

/**
 * Update link preview with check results
 */
function updateLinkPreview(preview: HTMLElement, result: any): void {
  preview.innerHTML = '';
  preview.classList.remove('safe', 'suspicious', 'dangerous');

  const status = result.isSafe ? 'safe' : result.riskScore > 60 ? 'dangerous' : 'suspicious';
  preview.classList.add(status);

  const title = document.createElement('div');
  title.className = 'blockstop-link-preview-title';
  title.innerHTML = `${getStatusEmoji(status)} Link Status`;

  const urlEl = document.createElement('div');
  urlEl.className = 'blockstop-link-preview-url';
  urlEl.textContent = result.url || 'Unknown URL';

  const statusEl = document.createElement('div');
  statusEl.className = 'blockstop-link-preview-status';

  const badge = document.createElement('span');
  badge.className = `blockstop-link-preview-badge ${status}`;
  badge.textContent = status.toUpperCase();

  const score = document.createElement('span');
  score.style.color = '#6b7280';
  score.style.fontSize = '11px';
  score.textContent = `Risk: ${result.riskScore || 0}%`;

  statusEl.appendChild(badge);
  statusEl.appendChild(score);

  if (result.threats && result.threats.length > 0) {
    const threatEl = document.createElement('div');
    threatEl.style.color = '#6b7280';
    threatEl.style.fontSize = '11px';
    threatEl.style.marginTop = '4px';
    threatEl.textContent = `${result.threats.length} threat${result.threats.length !== 1 ? 's' : ''} detected`;
    preview.appendChild(threatEl);
  }

  preview.appendChild(title);
  preview.appendChild(urlEl);
  preview.appendChild(statusEl);
}

/**
 * Apply visual status to link
 */
function applyLinkStatus(
  link: HTMLAnchorElement,
  isSafe: boolean,
  riskScore: number
): void {
  const status = isSafe ? 'safe' : riskScore > 60 ? 'dangerous' : 'suspicious';
  link.setAttribute('data-blockstop-status', status);
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    safe: '✓',
    suspicious: '⚠️',
    dangerous: '🛑',
  };
  return emojis[status] || '?';
}

/**
 * Load cache from Chrome storage
 */
async function loadCacheFromStorage(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('blockstop_link_cache');
    if (result.blockstop_link_cache) {
      linkCache = result.blockstop_link_cache;
    }
  } catch (error) {
    console.error('[LinkChecker] Error loading cache:', error);
  }
}

/**
 * Save cache to Chrome storage
 */
async function saveCacheToStorage(): Promise<void> {
  try {
    await chrome.storage.local.set({
      blockstop_link_cache: linkCache,
    });
  } catch (error) {
    console.error('[LinkChecker] Error saving cache:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[LinkChecker] Loaded');
