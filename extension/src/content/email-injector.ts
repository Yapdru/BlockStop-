/**
 * BlockStop Email Injector
 * Integrates with Gmail to inject threat detection UI
 */

interface ExtractedEmail {
  subject: string;
  from: string;
  body: string;
  links: string[];
  attachments: Array<{ name: string; size: number }>;
}

/**
 * Initialize email injector
 */
function init(): void {
  console.log('[EmailInjector] Initializing');

  // Inject styles
  injectStyles();

  // Monitor for new emails
  observeGmailUpdates();

  // Add scan button to toolbar
  addScanButton();
}

/**
 * Inject CSS styles for UI elements
 */
function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .blockstop-threat-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }

    .blockstop-threat-badge.critical {
      background-color: #fecaca;
      color: #7f1d1d;
      border: 1px solid #fca5a5;
    }

    .blockstop-threat-badge.high {
      background-color: #fed7aa;
      color: #7c2d12;
      border: 1px solid #fdba74;
    }

    .blockstop-threat-badge.medium {
      background-color: #fef3c7;
      color: #78350f;
      border: 1px solid #fcd34d;
    }

    .blockstop-threat-badge.low {
      background-color: #dbeafe;
      color: #0c2340;
      border: 1px solid #bfdbfe;
    }

    .blockstop-threat-badge.safe {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    .blockstop-scan-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background-color: #1f2937;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .blockstop-scan-btn:hover {
      background-color: #111827;
    }

    .blockstop-scan-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .blockstop-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      max-width: 400px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    }

    .blockstop-notification.critical {
      border-left-color: #dc2626;
    }

    .blockstop-notification.high {
      border-left-color: #ea580c;
    }

    @keyframes slideIn {
      from {
        transform: translateX(420px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .blockstop-link-unsafe {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .blockstop-threat-highlight {
      background-color: #fef3c7;
      border-radius: 2px;
      padding: 2px 4px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Add scan button to Gmail toolbar
 */
function addScanButton(): void {
  // Wait for toolbar to be ready
  const observer = new MutationObserver(() => {
    const toolbar = document.querySelector('[role="toolbar"]');
    if (toolbar && !toolbar.querySelector('.blockstop-scan-btn')) {
      const btn = document.createElement('button');
      btn.className = 'blockstop-scan-btn';
      btn.innerHTML = '🛡️ BlockStop Scan';
      btn.onclick = () => scanCurrentEmail();
      toolbar.appendChild(btn);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Observe Gmail for new emails and changes
 */
function observeGmailUpdates(): void {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check for new emails
        const emailElements = document.querySelectorAll('[role="listitem"]');
        for (const element of emailElements) {
          if (!element.querySelector('.blockstop-threat-badge')) {
            try {
              const email = extractEmailFromElement(element);
              if (email) {
                await scanEmailSilent(email, element);
              }
            } catch (error) {
              console.error('[EmailInjector] Error scanning email:', error);
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
 * Scan current email
 */
async function scanCurrentEmail(): Promise<void> {
  try {
    const emailElement = document.querySelector('[data-message-id]');
    if (!emailElement) {
      showNotification('No email selected', 'low');
      return;
    }

    const email = extractEmailFromDOM();
    if (!email) {
      showNotification('Could not extract email content', 'low');
      return;
    }

    showNotification('Scanning email...', 'low');

    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_EMAIL',
      payload: {
        emailSubject: email.subject,
        emailFrom: email.from,
        emailBody: email.body,
        links: email.links,
      },
    });

    if (response.success) {
      displayScanResults(response.data);
    } else {
      showNotification(`Scan failed: ${response.error}`, 'critical');
    }
  } catch (error) {
    console.error('[EmailInjector] Error scanning email:', error);
    showNotification('Error scanning email', 'critical');
  }
}

/**
 * Scan email silently (in background, show badge only)
 */
async function scanEmailSilent(
  email: ExtractedEmail,
  element: Element
): Promise<void> {
  try {
    // Debounce rapid scans
    if ((element as any).__blockstopScanning) {
      return;
    }
    (element as any).__blockstopScanning = true;

    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_EMAIL',
      payload: {
        emailSubject: email.subject,
        emailFrom: email.from,
        emailBody: email.body,
        links: email.links,
      },
    });

    if (response.success) {
      const result = response.data;
      addThreatBadge(element, result);
      highlightDangerousLinks(element, result.suspiciousLinks || []);
    }
  } catch (error) {
    console.error('[EmailInjector] Error in silent scan:', error);
  } finally {
    (element as any).__blockstopScanning = false;
  }
}

/**
 * Extract email from a list item element
 */
function extractEmailFromElement(element: Element): ExtractedEmail | null {
  try {
    // Gmail structure: email preview in list items
    const subjectEl = element.querySelector('[role="gridcell"] span');
    const subject = subjectEl?.textContent || '';

    const previewEl = element.querySelector('[role="gridcell"] [role="button"]');
    const preview = previewEl?.textContent || '';

    // For list view, we get limited info
    // Full email data requires clicking the email
    return {
      subject,
      from: 'unknown@example.com', // Would need full email view
      body: preview,
      links: extractLinks(preview),
      attachments: [],
    };
  } catch (error) {
    console.error('[EmailInjector] Error extracting email:', error);
    return null;
  }
}

/**
 * Extract full email from DOM (when email is opened)
 */
function extractEmailFromDOM(): ExtractedEmail | null {
  try {
    // Get email elements
    const subjectEl = document.querySelector('[data-subject-line]');
    const subject = subjectEl?.getAttribute('data-subject-line') || '';

    const fromEl = document.querySelector('[email]');
    const from = fromEl?.getAttribute('email') || '';

    // Get body content
    const bodyEl = document.querySelector('.gs_iI, [role="main"]');
    const body = bodyEl?.innerText || '';

    // Extract links
    const links = extractLinks(body);

    // Extract attachments
    const attachments = extractAttachments();

    return {
      subject,
      from,
      body,
      links,
      attachments,
    };
  } catch (error) {
    console.error('[EmailInjector] Error extracting email from DOM:', error);
    return null;
  }
}

/**
 * Extract all links from text
 */
function extractLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)];
}

/**
 * Extract attachment info
 */
function extractAttachments(): Array<{ name: string; size: number }> {
  const attachments: Array<{ name: string; size: number }> = [];
  const attachmentElements = document.querySelectorAll('[aria-label*="attachment"]');

  for (const el of attachmentElements) {
    const name = el.textContent || 'unknown';
    attachments.push({
      name: name.trim(),
      size: 0, // Would need to parse size from DOM
    });
  }

  return attachments;
}

/**
 * Add threat badge to email element
 */
function addThreatBadge(element: Element, result: any): void {
  const threatLevel = calculateThreatLevel(result);
  const badge = document.createElement('span');
  badge.className = `blockstop-threat-badge ${threatLevel}`;
  badge.title = `BlockStop: ${result.threats?.length || 0} threats detected`;

  const threatCount = result.threats?.length || 0;
  const emoji = getThreatEmoji(threatLevel);

  badge.innerHTML = `${emoji} ${threatCount} threat${threatCount !== 1 ? 's' : ''}`;

  const header = element.querySelector('[role="gridcell"]');
  if (header) {
    header.appendChild(badge);
  }
}

/**
 * Highlight dangerous links
 */
function highlightDangerousLinks(
  element: Element,
  suspiciousLinks: string[]
): void {
  const links = element.querySelectorAll('a');
  for (const link of links) {
    if (suspiciousLinks.includes(link.href)) {
      link.classList.add('blockstop-threat-highlight');
      link.addEventListener('click', (e) => {
        if (!confirm(`⚠️ This link may be dangerous. Continue anyway?`)) {
          e.preventDefault();
        }
      });
    }
  }
}

/**
 * Calculate threat level from scan result
 */
function calculateThreatLevel(result: any): 'critical' | 'high' | 'medium' | 'low' | 'safe' {
  const threatCount = result.threats?.length || 0;
  const riskScore = result.riskScore || 0;

  if (threatCount === 0) return 'safe';
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

/**
 * Get emoji for threat level
 */
function getThreatEmoji(level: string): string {
  const emojis: Record<string, string> = {
    safe: '✓',
    low: '⚠️',
    medium: '⚠️⚠️',
    high: '🛑',
    critical: '🚨',
  };
  return emojis[level] || '?';
}

/**
 * Display scan results in notification
 */
function displayScanResults(result: any): void {
  const threatLevel = calculateThreatLevel(result);
  const threatCount = result.threats?.length || 0;

  let message = `Scan complete: ${threatCount} threat${threatCount !== 1 ? 's' : ''} detected`;

  if (result.riskScore) {
    message += ` (Risk: ${result.riskScore}%)`;
  }

  showNotification(message, threatLevel);
}

/**
 * Show notification toast
 */
function showNotification(message: string, level: string = 'low'): void {
  const notification = document.createElement('div');
  notification.className = `blockstop-notification ${level}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('[EmailInjector] Loaded');
