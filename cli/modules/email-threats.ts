/**
 * BlockStop Email Threat Detection
 * Pattern matching and threat scoring for email analysis
 */

import * as EmailUtils from './email-utils.js';

export interface EmailThreat {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: string[];
}

export interface EmailThreatAnalysis {
  threats: EmailThreat[];
  riskScore: number;
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
}

const PHISHING_KEYWORDS = [
  'urgent.*action',
  'verify.*account',
  'confirm.*identity',
  'click.*here',
  'act.*now',
  'update.*information',
  'confirm.*password',
  'suspicious.*activity',
  'unusual.*activity',
  'limited.*time',
  'expire',
  're-activate',
  'unlock.*account',
  'resolve.*issue',
];

const FINANCIAL_KEYWORDS = [
  'paypal',
  'amazon.*pay',
  'apple.*pay',
  'google.*pay',
  'bank.*account',
  'credit.*card',
  'wire.*transfer',
  'swift',
  'payment.*failed',
  'billing.*issue',
];

const CREDENTIAL_HARVEST_KEYWORDS = [
  'confirm.*login',
  'sign.*in',
  'authenticate',
  'log.*in',
  'reenter.*password',
  'update.*login',
];

const DATA_EXFIL_DOMAINS = [
  'pastebin.com',
  'github.com/gist',
  'dropbox.com',
  'drive.google.com',
  'onedrive.com',
  'mega.nz',
  'mediafire.com',
  'wetransfer.com',
];

/**
 * Detect phishing keywords in email content
 */
export function detectPhishingKeywords(content: string): { found: boolean; keywords: string[] } {
  const lowerContent = content.toLowerCase();
  const found: string[] = [];

  PHISHING_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerContent)) {
      found.push(keyword);
    }
  });

  return { found: found.length > 0, keywords: found };
}

/**
 * Detect financial institution spoofing
 */
export function detectFinancialPhishing(content: string, headers: EmailUtils.EmailHeader): EmailThreat | null {
  const lowerContent = content.toLowerCase();
  const foundKeywords: string[] = [];

  FINANCIAL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerContent)) {
      foundKeywords.push(keyword);
    }
  });

  if (foundKeywords.length === 0) {
    return null;
  }

  const evidence = [...foundKeywords];
  const fromHeader = EmailUtils.getHeaderValue(headers, 'from') || '';
  const from = EmailUtils.parseEmailAddress(fromHeader);

  // Check if from domain matches known financial institution
  if (from) {
    const domain = from.email.split('@')[1].toLowerCase();
    const suspiciousDomains = [
      'paypa1.com',
      'paypa-l.com',
      'amaz0n.com',
      'apple-id.com',
      'bankofamerica.com',
    ]; // Examples - adjust as needed

    if (suspiciousDomains.some(d => domain.includes(d.replace(/[0-9]/g, '')))) {
      evidence.push(`Suspicious domain: ${domain}`);
    }
  }

  return {
    type: 'FINANCIAL_PHISHING',
    severity: 'CRITICAL',
    description: 'Email impersonates financial institution requesting action',
    evidence,
  };
}

/**
 * Detect credential harvesting attempts
 */
export function detectCredentialHarvest(content: string): EmailThreat | null {
  const lowerContent = content.toLowerCase();
  const foundKeywords: string[] = [];

  CREDENTIAL_HARVEST_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerContent)) {
      foundKeywords.push(keyword);
    }
  });

  if (foundKeywords.length === 0) {
    return null;
  }

  // Look for forms or links requesting credentials
  const hasForm = /(<form|action=|method=|input type.*password)/i.test(content);
  const hasLink = /(click here|login|sign in|verify|confirm)/i.test(content);

  if (hasForm || (hasLink && foundKeywords.length > 1)) {
    return {
      type: 'CREDENTIAL_HARVEST',
      severity: 'HIGH',
      description: 'Email attempts to harvest user credentials',
      evidence: foundKeywords,
    };
  }

  return null;
}

/**
 * Detect malware distribution patterns
 */
export function detectMalwarePatterns(
  attachments: EmailUtils.EmailAttachment[],
  content: string
): EmailThreat | null {
  const threats: string[] = [];

  // Check for dangerous attachments
  attachments.forEach(att => {
    if (att.threat) {
      threats.push(`Dangerous file: ${att.filename}`);
    }

    // Check for double extensions
    if (/\.\w+\.\w+$/.test(att.filename)) {
      threats.push(`Double extension file: ${att.filename}`);
    }
  });

  // Check for common malware distribution keywords
  const malwareKeywords = [
    'attached.*invoice',
    'attached.*document',
    'download.*file',
    'enable.*macros',
    'update.*required',
  ];

  const lowerContent = content.toLowerCase();
  malwareKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(lowerContent)) {
      threats.push(`Malware distribution keyword: ${keyword}`);
    }
  });

  if (threats.length > 0) {
    return {
      type: 'MALWARE_DISTRIBUTION',
      severity: threats.some(t => t.includes('Dangerous file')) ? 'HIGH' : 'MEDIUM',
      description: 'Email may be distributing malware',
      evidence: threats,
    };
  }

  return null;
}

/**
 * Detect suspicious URLs
 */
export function detectSuspiciousURLs(content: string): EmailThreat | null {
  const urls = EmailUtils.extractURLs(content);
  const suspicious: string[] = [];

  urls.forEach(url => {
    try {
      const urlObj = new URL(url);

      // Check for shorteners
      if (EmailUtils.checkShorteners(url)) {
        suspicious.push(`Shortened URL: ${url}`);
      }

      // Check for suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf'];
      if (suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
        suspicious.push(`Suspicious TLD: ${urlObj.hostname}`);
      }

      // Check for numeric IPs (often used in phishing)
      if (/^\d+\.\d+\.\d+\.\d+/.test(urlObj.hostname)) {
        suspicious.push(`IP-based URL: ${urlObj.hostname}`);
      }

      // Check for data exfiltration domains
      if (DATA_EXFIL_DOMAINS.some(domain => urlObj.hostname.includes(domain))) {
        suspicious.push(`Data exfiltration domain: ${url}`);
      }

      // Check for homograph attacks
      if (/[а-яёiсӕ]/i.test(urlObj.hostname)) {
        suspicious.push(`Possible homograph attack: ${urlObj.hostname}`);
      }
    } catch (e) {
      suspicious.push(`Malformed URL: ${url}`);
    }
  });

  if (suspicious.length > 0) {
    return {
      type: 'SUSPICIOUS_URLS',
      severity: suspicious.some(s => s.includes('Shortened')) ? 'MEDIUM' : 'HIGH',
      description: 'Email contains suspicious URLs',
      evidence: suspicious,
    };
  }

  return null;
}

/**
 * Detect header spoofing and injection
 */
export function detectHeaderSpoofing(headers: EmailUtils.EmailHeader): EmailThreat | null {
  const issues = EmailUtils.analyzeSuspiciousHeaders(headers);

  if (issues.length > 0) {
    return {
      type: 'HEADER_SPOOFING',
      severity: 'HIGH',
      description: 'Email headers show signs of spoofing or injection',
      evidence: issues,
    };
  }

  return null;
}

/**
 * Detect authentication failures
 */
export function detectAuthenticationFailure(headers: EmailUtils.EmailHeader): EmailThreat | null {
  const spf = EmailUtils.analyzeSPF(headers);
  const dkim = EmailUtils.analyzeDKIM(headers);
  const dmarc = EmailUtils.analyzeDMARC(headers);

  const failures: string[] = [];

  if (!spf.valid) {
    failures.push('SPF verification failed');
  }

  if (!dkim.valid) {
    failures.push('DKIM verification failed');
  }

  if (!dmarc.compliant) {
    failures.push('DMARC verification failed');
  }

  if (failures.length >= 2) {
    return {
      type: 'AUTHENTICATION_FAILURE',
      severity: 'HIGH',
      description: 'Email failed multiple authentication checks',
      evidence: failures,
    };
  }

  return null;
}

/**
 * Calculate risk score based on threats
 */
export function calculateRiskScore(threats: EmailThreat[]): number {
  let score = 0;

  threats.forEach(threat => {
    switch (threat.severity) {
      case 'CRITICAL':
        score += 30;
        break;
      case 'HIGH':
        score += 20;
        break;
      case 'MEDIUM':
        score += 10;
        break;
      case 'LOW':
        score += 3;
        break;
    }
  });

  return Math.min(score, 100);
}

/**
 * Comprehensive email threat analysis
 */
export function analyzeEmailThreats(
  content: string,
  headers: EmailUtils.EmailHeader,
  attachments: EmailUtils.EmailAttachment[]
): EmailThreatAnalysis {
  const threats: EmailThreat[] = [];

  // Run all threat detections
  const headerSpoofing = detectHeaderSpoofing(headers);
  if (headerSpoofing) threats.push(headerSpoofing);

  const authFailure = detectAuthenticationFailure(headers);
  if (authFailure) threats.push(authFailure);

  const financialPhishing = detectFinancialPhishing(content, headers);
  if (financialPhishing) threats.push(financialPhishing);

  const credentialHarvest = detectCredentialHarvest(content);
  if (credentialHarvest) threats.push(credentialHarvest);

  const malware = detectMalwarePatterns(attachments, content);
  if (malware) threats.push(malware);

  const suspiciousUrls = detectSuspiciousURLs(content);
  if (suspiciousUrls) threats.push(suspiciousUrls);

  // Check for phishing keywords (only flag if no other threats)
  if (threats.length === 0) {
    const phishing = detectPhishingKeywords(content);
    if (phishing.found && phishing.keywords.length >= 2) {
      threats.push({
        type: 'PHISHING_KEYWORDS',
        severity: 'MEDIUM',
        description: 'Email contains multiple phishing keywords',
        evidence: phishing.keywords,
      });
    }
  }

  // Calculate risk score
  const riskScore = calculateRiskScore(threats);
  let riskLevel: EmailThreatAnalysis['riskLevel'] = 'SAFE';

  if (riskScore <= 10) riskLevel = 'SAFE';
  else if (riskScore <= 30) riskLevel = 'LOW';
  else if (riskScore <= 60) riskLevel = 'MEDIUM';
  else if (riskScore <= 85) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  const summary =
    threats.length === 0
      ? 'Email appears safe'
      : `Detected ${threats.length} threat(s): ${threats.map(t => t.type).join(', ')}`;

  return {
    threats,
    riskScore,
    riskLevel,
    summary,
  };
}

export const EMAIL_THREATS = {
  detectPhishingKeywords,
  detectFinancialPhishing,
  detectCredentialHarvest,
  detectMalwarePatterns,
  detectSuspiciousURLs,
  detectHeaderSpoofing,
  detectAuthenticationFailure,
  calculateRiskScore,
  analyzeEmailThreats,
};
