/**
 * BlockStop Content Script
 * Injects security UI into Gmail and monitors for threats
 */

// Initialize content script
function init() {
  console.log('BlockStop content script loaded');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleContentMessage(request, sendResponse);
    return true;
  });

  // Setup Gmail integration
  setupGmailIntegration();

  // Monitor for DOM changes (new emails loaded)
  observeGmailUpdates();
}

/**
 * Handle messages from background script
 */
function handleContentMessage(request: any, sendResponse: Function) {
  switch (request.action) {
    case 'quickScan':
      performQuickScan();
      sendResponse({ success: true });
      break;

    case 'scanEmail':
      scanCurrentEmail();
      sendResponse({ success: true });
      break;

    case 'getEmails':
      {
        const emails = extractEmailsFromDOM();
        sendResponse({ emails });
      }
      break;

    case 'highlightThreats':
      {
        const threats = request.threats;
        highlightThreatsInUI(threats);
        sendResponse({ success: true });
      }
      break;

    default:
      sendResponse({ success: false });
  }
}

/**
 * Setup Gmail-specific integration
 */
function setupGmailIntegration() {
  // Add scan button to Gmail toolbar
  addScanButton();

  // Monitor emails as they load
  observeEmailContent();
}

/**
 * Add scan button to Gmail toolbar
 */
function addScanButton() {
  // Wait for Gmail UI to load
  const observer = new MutationObserver(() => {
    const toolbar = document.querySelector('[role="toolbar"]');
    if (toolbar && !document.querySelector('[data-blockstop-scan-btn]')) {
      const scanBtn = document.createElement('button');
      scanBtn.setAttribute('data-blockstop-scan-btn', 'true');
      scanBtn.className =
        'T-I J-J5-Ji ar7 T-I-ax7 L3 T-I-JO ar8 gmail-scan-btn';
      scanBtn.title = 'BlockStop Security Scan (Ctrl+Shift+E)';
      scanBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22C6.477 22 2 17.523 2 12s4.477-10 10-10 10 4.477 10 10-4.477 10-10 10z"></path>
          <path d="M12 6v6m0 4v-2"></path>
        </svg>
      `;

      scanBtn.addEventListener('click', () => {
        scanCurrentEmail();
      });

      toolbar.appendChild(scanBtn);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Observe email content and highlight threats
 */
function observeEmailContent() {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check for new email threads
        const emailContainers = document.querySelectorAll('[data-message-id]');
        emailContainers.forEach(async (container) => {
          if (!container.hasAttribute('data-blockstop-scanned')) {
            const email = extractEmailFromElement(container as HTMLElement);
            if (email) {
              container.setAttribute('data-blockstop-scanned', 'true');
              await scanEmailContent(email);
            }
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Extract email data from DOM element
 */
function extractEmailFromElement(element: HTMLElement) {
  const headerRow = element.querySelector('[data-message-id]');
  if (!headerRow) return null;

  const from =
    element.querySelector('[data-email]')?.getAttribute('data-email') ||
    element.textContent?.match(/from:\s*(.+)/i)?.[1] ||
    '';
  const subject = element.querySelector('[data-subject]')?.textContent || '';
  const body = element.querySelector('.aHl')?.textContent || '';

  return { from, subject, body, element };
}

/**
 * Extract all visible emails from current view
 */
function extractEmailsFromDOM() {
  const emails = [];
  const emailElements = document.querySelectorAll('[role="main"] tr');

  emailElements.forEach((el) => {
    const from = el.querySelector('span[email]')?.textContent || '';
    const subject = el.querySelector('.bog')?.textContent || '';

    if (from && subject) {
      emails.push({
        id: Math.random().toString(36).substr(2, 9),
        from,
        subject,
        timestamp: Date.now(),
        preview: subject.substring(0, 50),
      });
    }
  });

  return emails;
}

/**
 * Scan current email
 */
async function scanCurrentEmail() {
  const emailElement = document.querySelector('[data-message-id]');
  if (!emailElement) {
    showNotification('No email open to scan');
    return;
  }

  const email = extractEmailFromElement(emailElement as HTMLElement);
  if (!email) {
    showNotification('Could not extract email data');
    return;
  }

  await scanEmailContent(email);
}

/**
 * Scan email content
 */
async function scanEmailContent(email: any) {
  try {
    // Send to background script for scanning
    chrome.runtime.sendMessage(
      { action: 'scanEmail', email },
      (response) => {
        if (response.success) {
          const { result } = response;

          // Add threat badge if threats found
          if (result.threatLevel !== 'safe') {
            addThreatBadge(
              email.element,
              result.threatLevel,
              result.threats.length,
            );
          }

          // Show notification
          if (result.threats.length > 0) {
            showNotification(
              `${result.threats.length} threat(s) detected`,
              result.threatLevel,
            );
          }

          // Highlight dangerous links
          highlightDangerousLinks(email.body, email.element);
        }
      },
    );
  } catch (error) {
    console.error('Error scanning email:', error);
  }
}

/**
 * Perform quick scan on selected content
 */
function performQuickScan() {
  const selectedText = window.getSelection()?.toString();
  if (!selectedText) {
    showNotification('Please select text to scan');
    return;
  }

  chrome.runtime.sendMessage({
    action: 'scanUrl',
    url: selectedText,
  });
}

/**
 * Add threat badge to email element
 */
function addThreatBadge(
  element: HTMLElement,
  threatLevel: string,
  threatCount: number,
) {
  if (element.querySelector('[data-blockstop-badge]')) return;

  const colors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#eab308',
    low: '#2563eb',
  };

  const badge = document.createElement('div');
  badge.setAttribute('data-blockstop-badge', 'true');
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${colors[threatLevel] || '#2563eb'};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-left: 8px;
  `;
  badge.innerHTML = `⚠️ ${threatCount} threat${threatCount > 1 ? 's' : ''}`;
  badge.title = `Threat level: ${threatLevel}`;

  element.appendChild(badge);
}

/**
 * Highlight dangerous links
 */
function highlightDangerousLinks(body: string, element: HTMLElement) {
  const links = element.querySelectorAll('a');

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';

    // Check for suspicious patterns
    if (isSuspiciousLink(href)) {
      link.style.backgroundColor = '#fee2e2';
      link.style.border = '2px solid #dc2626';
      link.style.borderRadius = '2px';
      link.style.padding = '2px 4px';
      link.title = 'This link may be suspicious';

      link.addEventListener('click', (e) => {
        if (
          !confirm(
            'This link has been flagged as suspicious. Continue anyway?',
          )
        ) {
          e.preventDefault();
          return false;
        }
      });
    }
  });
}

/**
 * Check if link is suspicious
 */
function isSuspiciousLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP address
      /^file:/, // File protocol
      /javascript:/, // JavaScript protocol
      /data:text/, // Data URI
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Show notification in Gmail
 */
function showNotification(message: string, level: string = 'info') {
  const colors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    warning: '#eab308',
    info: '#2563eb',
  };

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[level] || '#2563eb'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Monitor for Gmail updates
 */
function observeGmailUpdates() {
  // Re-scan when new emails are loaded
  const observer = new MutationObserver(() => {
    // Check for new unscanned emails
    const unscannedEmails = document.querySelectorAll(
      '[data-message-id]:not([data-blockstop-scanned])',
    );
    unscannedEmails.forEach((el) => {
      const email = extractEmailFromElement(el as HTMLElement);
      if (email) {
        scanEmailContent(email);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });
}

/**
 * Highlight threats in UI
 */
function highlightThreatsInUI(threats: any[]) {
  threats.forEach((threat) => {
    const elements = document.querySelectorAll(
      `[data-threat-id="${threat.id}"]`,
    );
    elements.forEach((el) => {
      el.classList.add('blockstop-threat-highlight');
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .blockstop-threat-highlight {
    background-color: #fee2e2 !important;
    border: 2px solid #dc2626 !important;
  }

  .gmail-scan-btn {
    cursor: pointer;
  }

  .gmail-scan-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;
document.head.appendChild(style);
