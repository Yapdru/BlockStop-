/**
 * BlockStop Service Worker - Background Script
 * Handles threat detection, scanning, and API communication
 */

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();

    // Initialize default settings
    chrome.storage.sync.set({
      enableAutoScan: true,
      enableNotifications: true,
      scanAttachments: true,
      checkLinks: true,
      blockSuspiciousSenders: false,
      highlightPhishingIndicators: true,
      enableKeyboardShortcuts: true,
      threatLevel: 'balanced',
      autoReportThreats: false,
      dataRetentionDays: 30,
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'quick-scan':
      handleQuickScan();
      break;
    case 'scan-email':
      handleEmailScan();
      break;
    case 'toggle-sidebar':
      handleToggleSidebar();
      break;
  }
});

async function handleQuickScan() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  // Send message to content script to perform scan
  chrome.tabs.sendMessage(tab.id, { action: 'quickScan' });
}

async function handleEmailScan() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  // Send message to content script to scan current email
  chrome.tabs.sendMessage(tab.id, { action: 'scanEmail' });
}

async function handleToggleSidebar() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;

  // Toggle sidebar panel
  chrome.sidePanel.open({ tabId: tab.id });
}

// Listen for messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
  switch (request.action) {
    case 'scanEmail':
      {
        const result = await scanEmail(request.email);
        sendResponse({ success: true, result });
      }
      break;

    case 'scanUrl':
      {
        const result = await scanUrl(request.url);
        sendResponse({ success: true, result });
      }
      break;

    case 'scanAttachment':
      {
        const result = await scanAttachment(request.file);
        sendResponse({ success: true, result });
      }
      break;

    case 'reportThreat':
      {
        await reportThreat(request.threat, sender);
        sendResponse({ success: true });
      }
      break;

    case 'getScanHistory':
      {
        const history = await getScanHistory(request.limit || 50);
        sendResponse({ success: true, history });
      }
      break;

    case 'clearScanHistory':
      {
        await clearScanHistory();
        sendResponse({ success: true });
      }
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
}

/**
 * Scan email for threats
 */
async function scanEmail(email: any) {
  try {
    const settings = await chrome.storage.sync.get();
    const threats: any[] = [];

    // Check sender reputation
    const senderRep = await checkSenderReputation(email.from);
    if (senderRep.score < 30) {
      threats.push({
        type: 'Untrusted Sender',
        severity: 'high',
        description: `Sender ${email.from} has low reputation score`,
      });
    }

    // Check for phishing indicators
    if (detectPhishingIndicators(email.body || '')) {
      threats.push({
        type: 'Phishing Indicators',
        severity: 'critical',
        description: 'Email contains common phishing patterns',
      });
    }

    // Check attachments if enabled
    if (settings.scanAttachments && email.attachments?.length) {
      for (const attachment of email.attachments) {
        const attachmentThreat = await scanAttachment(attachment);
        if (attachmentThreat.isMalicious) {
          threats.push({
            type: 'Malicious Attachment',
            severity: 'critical',
            description: `File ${attachment.name} flagged as malicious`,
          });
        }
      }
    }

    // Check links if enabled
    if (settings.checkLinks && email.links?.length) {
      for (const link of email.links) {
        const linkThreat = await scanUrl(link);
        if (linkThreat.isSuspicious) {
          threats.push({
            type: 'Suspicious Link',
            severity: 'high',
            description: `Link redirects to suspicious domain`,
          });
        }
      }
    }

    // Calculate overall threat level
    const threatLevel = calculateThreatLevel(threats);
    const overallScore = calculateSecurityScore(threats);

    // Save scan result
    await saveScanResult({
      type: 'email',
      sender: email.from,
      subject: email.subject,
      threatLevel,
      threatCount: threats.length,
      timestamp: Date.now(),
    });

    return {
      threatLevel,
      overallScore,
      threats,
      senderReputation: senderRep,
    };
  } catch (error) {
    console.error('Error scanning email:', error);
    throw error;
  }
}

/**
 * Scan URL for threats
 */
async function scanUrl(url: string) {
  try {
    // Call threat intelligence API
    const response = await fetch('https://api.blockstop.io/scan/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error scanning URL:', error);
    return { isSuspicious: false, score: 0 };
  }
}

/**
 * Scan attachment for malware
 */
async function scanAttachment(file: any) {
  try {
    // Check file extension against known dangerous types
    const dangerousExtensions = [
      'exe',
      'bat',
      'cmd',
      'scr',
      'vbs',
      'js',
      'jar',
      'zip',
      'rar',
    ];
    const ext = file.name?.split('.').pop()?.toLowerCase();

    if (dangerousExtensions.includes(ext)) {
      return {
        isMalicious: true,
        reason: `${ext.toUpperCase()} files are potentially dangerous`,
      };
    }

    // Call malware scanning API
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.blockstop.io/scan/file', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error scanning attachment:', error);
    return { isMalicious: false };
  }
}

/**
 * Check sender reputation
 */
async function checkSenderReputation(email: string) {
  try {
    const response = await fetch('https://api.blockstop.io/reputation/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking sender reputation:', error);
    return { score: 50, verified: false };
  }
}

/**
 * Detect phishing indicators in email body
 */
function detectPhishingIndicators(body: string): boolean {
  const phishingPatterns = [
    /verify.*account/i,
    /confirm.*password/i,
    /update.*payment/i,
    /unusual activity/i,
    /click.*urgent/i,
    /act.*now/i,
  ];

  return phishingPatterns.some((pattern) => pattern.test(body));
}

/**
 * Calculate threat level based on detected threats
 */
function calculateThreatLevel(threats: any[]): 'critical' | 'high' | 'medium' | 'low' | 'safe' {
  const hasCritical = threats.some((t) => t.severity === 'critical');
  const hasHigh = threats.some((t) => t.severity === 'high');
  const hasMedium = threats.some((t) => t.severity === 'medium');

  if (hasCritical) return 'critical';
  if (hasHigh) return 'high';
  if (hasMedium) return 'medium';
  if (threats.length > 0) return 'low';
  return 'safe';
}

/**
 * Calculate security score (0-100)
 */
function calculateSecurityScore(threats: any[]): number {
  if (threats.length === 0) return 100;

  let deductions = 0;
  for (const threat of threats) {
    switch (threat.severity) {
      case 'critical':
        deductions += 30;
        break;
      case 'high':
        deductions += 20;
        break;
      case 'medium':
        deductions += 10;
        break;
      case 'low':
        deductions += 5;
        break;
    }
  }

  return Math.max(0, 100 - deductions);
}

/**
 * Save scan result to local storage
 */
async function saveScanResult(result: any) {
  const history = (await chrome.storage.local.get('scanHistory'))?.scanHistory || [];
  history.unshift({ ...result, id: crypto.randomUUID() });

  // Keep only recent scans (limited by data retention setting)
  const settings = await chrome.storage.sync.get('dataRetentionDays');
  const cutoffTime = Date.now() - settings.dataRetentionDays * 24 * 60 * 60 * 1000;
  const filtered = history.filter((h) => h.timestamp > cutoffTime);

  await chrome.storage.local.set({ scanHistory: filtered.slice(0, 1000) });
}

/**
 * Get scan history
 */
async function getScanHistory(limit: number) {
  const { scanHistory } = await chrome.storage.local.get('scanHistory');
  return (scanHistory || []).slice(0, limit);
}

/**
 * Clear scan history
 */
async function clearScanHistory() {
  await chrome.storage.local.set({ scanHistory: [] });
}

/**
 * Report threat to BlockStop servers
 */
async function reportThreat(threat: any, sender: chrome.runtime.MessageSender) {
  try {
    await fetch('https://api.blockstop.io/threats/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...threat,
        source: sender.url,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    console.error('Error reporting threat:', error);
  }
}
