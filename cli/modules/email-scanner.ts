/**
 * BlockStop Email Scanner
 * Comprehensive email security analysis
 */

import * as EmailUtils from './email-utils.js';
import * as EmailThreats from './email-threats.js';

export interface EmailScanResult {
  sender: EmailUtils.EmailAddress | null;
  recipients: EmailUtils.EmailAddress[];
  subject: string;
  mimeStructure: EmailUtils.EmailPart | null;
  attachments: EmailUtils.EmailAttachment[];
  urls: string[];
  headers: EmailUtils.EmailHeader;
  analysis: EmailThreats.EmailThreatAnalysis;
  timestamp: string;
}

export class EmailScannerError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EmailScannerError';
  }
}

export class EmailScanner {
  /**
   * Scan raw email for threats
   */
  static async scanEmail(rawEmail: string): Promise<EmailScanResult> {
    try {
      // Validate input
      if (!rawEmail || typeof rawEmail !== 'string') {
        throw new EmailScannerError('INVALID_INPUT', 'Email content must be a non-empty string');
      }

      // Extract basic headers
      const headers = EmailUtils.extractEmailHeaders(rawEmail);

      // Parse sender
      const fromHeader = EmailUtils.getHeaderValue(headers, 'from') || '';
      const sender = EmailUtils.parseEmailAddress(fromHeader);

      if (!sender) {
        throw new EmailScannerError('INVALID_SENDER', 'Unable to parse sender email address');
      }

      // Parse recipients
      const recipients: EmailUtils.EmailAddress[] = [];
      const toHeader = EmailUtils.getHeaderValue(headers, 'to') || '';
      const ccHeader = EmailUtils.getHeaderValue(headers, 'cc') || '';
      const bccHeader = EmailUtils.getHeaderValue(headers, 'bcc') || '';

      [toHeader, ccHeader, bccHeader]
        .filter(h => h)
        .join(',')
        .split(',')
        .forEach(addr => {
          const parsed = EmailUtils.parseEmailAddress(addr);
          if (parsed) {
            recipients.push(parsed);
          }
        });

      // Get subject
      const subject = EmailUtils.getHeaderValue(headers, 'subject') || '(no subject)';

      // Extract MIME structure
      const mimeStructure = EmailUtils.extractMIMEParts(rawEmail);

      // Get attachments
      const attachments = mimeStructure ? EmailUtils.detectAttachments(mimeStructure) : [];

      // Extract URLs
      const urls = EmailUtils.extractURLs(rawEmail);

      // Analyze threats
      const analysis = EmailThreats.analyzeEmailThreats(rawEmail, headers, attachments);

      return {
        sender,
        recipients,
        subject,
        mimeStructure,
        attachments,
        urls,
        headers,
        analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof EmailScannerError) {
        throw error;
      }

      throw new EmailScannerError('SCAN_FAILED', `Failed to scan email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format scan result for display
   */
  static formatResult(result: EmailScanResult): string {
    let output = '';

    output += '📧 Email Security Analysis\n';
    output += '='.repeat(50) + '\n\n';

    // Basic info
    output += 'FROM:     ' + (result.sender?.email || '(unknown)') + '\n';
    if (result.sender?.name) {
      output += 'NAME:     ' + result.sender.name + '\n';
    }
    output += 'TO:       ' + result.recipients.map(r => r.email).join(', ') + '\n';
    output += 'SUBJECT:  ' + result.subject + '\n';
    output += 'DATE:     ' + result.timestamp + '\n\n';

    // Authentication results
    const spf = EmailUtils.analyzeSPF(result.headers);
    const dkim = EmailUtils.analyzeDKIM(result.headers);
    const dmarc = EmailUtils.analyzeDMARC(result.headers);

    output += 'Authentication Status:\n';
    output += '  SPF:   ' + (spf.valid ? '✅ PASS' : '❌ FAIL') + '\n';
    output += '  DKIM:  ' + (dkim.valid ? '✅ PASS' : '❌ FAIL') + '\n';
    output += '  DMARC: ' + (dmarc.valid ? '✅ PASS' : '❌ FAIL') + '\n\n';

    // Attachments
    if (result.attachments.length > 0) {
      output += 'Attachments:\n';
      result.attachments.forEach(att => {
        output += `  • ${att.filename}`;
        if (att.threat) {
          output += ` [${att.threat.severity}] ${att.threat.reason}`;
        }
        output += '\n';
      });
      output += '\n';
    }

    // URLs
    if (result.urls.length > 0) {
      output += 'URLs Found:\n';
      result.urls.forEach(url => {
        const isShortener = EmailUtils.checkShorteners(url) ? ' ⚠️ ' : '  ';
        output += isShortener + url + '\n';
      });
      output += '\n';
    }

    // Threats
    if (result.analysis.threats.length > 0) {
      output += 'Detected Threats:\n';
      result.analysis.threats.forEach(threat => {
        const severityColor = {
          CRITICAL: '🔴',
          HIGH: '🟠',
          MEDIUM: '🟡',
          LOW: '🔵',
        }[threat.severity];

        output += `${severityColor} [${threat.severity}] ${threat.type}\n`;
        output += `   ${threat.description}\n`;
        threat.evidence.forEach(ev => {
          output += `   • ${ev}\n`;
        });
      });
      output += '\n';
    }

    // Risk assessment
    output += 'Risk Assessment:\n';
    output += '  Score:      ' + result.analysis.riskScore + '/100\n';
    output += '  Level:      ' + result.analysis.riskLevel + '\n';
    output += '  Summary:    ' + result.analysis.summary + '\n\n';

    // Recommendation
    const recommendation = EmailScanner.getRecommendation(result.analysis.riskLevel);
    output += 'Recommendation:\n';
    output += '  ' + recommendation + '\n';

    return output;
  }

  /**
   * Get security recommendation based on risk level
   */
  static getRecommendation(riskLevel: string): string {
    switch (riskLevel) {
      case 'SAFE':
        return 'This email appears safe. No action required.';
      case 'LOW':
        return 'Low risk detected. Review content carefully.';
      case 'MEDIUM':
        return 'Medium risk detected. Do not click links or download attachments.';
      case 'HIGH':
        return 'High risk detected. This appears to be phishing. Delete immediately.';
      case 'CRITICAL':
        return 'Critical threat detected. Do not interact. Report to security team.';
      default:
        return 'Unable to determine risk level.';
    }
  }

  /**
   * Format result as JSON
   */
  static toJSON(result: EmailScanResult): object {
    return {
      sender: result.sender,
      recipients: result.recipients,
      subject: result.subject,
      attachments: result.attachments.map(a => ({
        filename: a.filename,
        mimeType: a.mimeType,
        threat: a.threat || null,
      })),
      urls: result.urls,
      analysis: {
        threats: result.analysis.threats,
        riskScore: result.analysis.riskScore,
        riskLevel: result.analysis.riskLevel,
        summary: result.analysis.summary,
      },
      timestamp: result.timestamp,
    };
  }

  /**
   * Get risk severity indicator
   */
  static getRiskIndicator(riskLevel: string): string {
    switch (riskLevel) {
      case 'SAFE':
        return '✅';
      case 'LOW':
        return '🔵';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🟠';
      case 'CRITICAL':
        return '🔴';
      default:
        return '❓';
    }
  }
}

export default EmailScanner;
