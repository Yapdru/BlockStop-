/**
 * CEF (Common Event Format) Formatter for ArcSight
 * Converts BlockStop events to CEF format for SIEM integration
 */

interface BlockStopEvent {
  scanId: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  filePath: string;
  malwareDetected: boolean;
  riskScore: number;
  threats?: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  metadata?: Record<string, any>;
}

interface CEFEvent {
  version: string;
  deviceVendor: string;
  deviceProduct: string;
  deviceVersion: string;
  signatureId: string;
  name: string;
  severity: string;
  extensions: Record<string, any>;
}

export class CEFFormatter {
  private static readonly VENDOR = 'BlockStop';
  private static readonly PRODUCT = 'BlockStop PRO';
  private static readonly VERSION = '1.0.0';

  /**
   * Convert BlockStop event to CEF format
   */
  static formatEvent(event: BlockStopEvent): string {
    const cef = this.buildCEFEvent(event);
    return this.stringifyCEF(cef);
  }

  /**
   * Build CEF event object
   */
  private static buildCEFEvent(event: BlockStopEvent): CEFEvent {
    const signatureId = event.malwareDetected ? 'BLOCKSTOP_THREAT' : 'BLOCKSTOP_SCAN';
    const severity = this.mapRiskScoreToSeverity(event.riskScore);

    const extensions: Record<string, any> = {
      // Standard CEF extensions
      src: 'blockstop-pro',
      shost: 'blockstop-scanner',
      dst: 'localhost',
      dhost: 'enterprise',

      // BlockStop-specific extensions
      'blockstop_scanId': event.scanId,
      'blockstop_fileName': event.fileName,
      'blockstop_filePath': event.filePath,
      'blockstop_fileSize': event.fileSize,
      'blockstop_malwareDetected': event.malwareDetected ? 'true' : 'false',
      'blockstop_riskScore': event.riskScore,

      // Time fields
      'rt': Math.floor(event.timestamp),
      'deviceReceiptTime': this.formatCEFTimestamp(event.timestamp),

      // Action
      'act': event.malwareDetected ? 'detected' : 'scanned',
      'cn1': event.riskScore,
      'cn1Label': 'Risk Score',

      // Threat details
      'cs1': event.threats?.map((t) => t.type).join(',') || 'none',
      'cs1Label': 'Threat Types',
      'cs2': event.threats?.map((t) => t.severity).join(',') || 'none',
      'cs2Label': 'Threat Severity',

      // Message
      'msg': this.buildMessage(event),

      // Request
      'request': event.fileName,

      // Custom labels
      'flexString1': event.filePath,
      'flexString1Label': 'File Path',
      'flexString2': this.getEventType(event),
      'flexString2Label': 'Event Type',
    };

    return {
      version: '0',
      deviceVendor: this.VENDOR,
      deviceProduct: this.PRODUCT,
      deviceVersion: this.VERSION,
      signatureId,
      name: this.getEventName(event),
      severity,
      extensions,
    };
  }

  /**
   * Stringify CEF event to format: CEF:Version|Device Vendor|Device Product|Device Version|SignatureID|Name|Severity|Extension
   */
  private static stringifyCEF(event: CEFEvent): string {
    const header = `CEF:${event.version}|${this.escapeValue(event.deviceVendor)}|${this.escapeValue(
      event.deviceProduct
    )}|${this.escapeValue(event.deviceVersion)}|${this.escapeValue(event.signatureId)}|${this.escapeValue(
      event.name
    )}|${event.severity}`;

    const extensionPairs: string[] = [];
    for (const [key, value] of Object.entries(event.extensions)) {
      if (value !== null && value !== undefined) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        extensionPairs.push(`${key}=${this.escapeExtensionValue(stringValue)}`);
      }
    }

    return `${header}|${extensionPairs.join(' ')}`;
  }

  /**
   * Map risk score to CEF severity (0-10)
   */
  private static mapRiskScoreToSeverity(riskScore: number): string {
    if (riskScore >= 90) return '10'; // Critical
    if (riskScore >= 70) return '8'; // High
    if (riskScore >= 40) return '5'; // Medium
    if (riskScore >= 20) return '3'; // Low
    return '1'; // Informational
  }

  /**
   * Build human-readable event message
   */
  private static buildMessage(event: BlockStopEvent): string {
    if (event.malwareDetected) {
      const threatTypes = event.threats?.map((t) => t.type).join(', ') || 'Unknown';
      return `Malware detected in ${event.fileName}: ${threatTypes}`;
    }
    return `Scan completed for ${event.fileName} - Risk score: ${event.riskScore}`;
  }

  /**
   * Get event name/description
   */
  private static getEventName(event: BlockStopEvent): string {
    if (event.malwareDetected) {
      return 'Malware Detected';
    }
    return 'File Scanned';
  }

  /**
   * Get event type
   */
  private static getEventType(event: BlockStopEvent): string {
    return event.malwareDetected ? 'threat_detected' : 'scan_completed';
  }

  /**
   * Format timestamp in CEF format (Unix timestamp in milliseconds)
   */
  private static formatCEFTimestamp(timestamp: number): string {
    return new Date(timestamp).toUTCString();
  }

  /**
   * Escape pipe and equals in header values
   */
  private static escapeValue(value: string): string {
    return value.replace(/[\|=]/g, (match) => `\\${match}`);
  }

  /**
   * Escape equals and newlines in extension values
   */
  private static escapeExtensionValue(value: string): string {
    return value
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/=/g, '\\=')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Batch format multiple events
   */
  static formatEventBatch(events: BlockStopEvent[]): string[] {
    return events.map((event) => this.formatEvent(event));
  }

  /**
   * Parse CEF format (for validation/testing)
   */
  static parseEvent(cefString: string): CEFEvent | null {
    try {
      const match = cefString.match(
        /^CEF:(\d+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|(\d+)\|(.*)$/
      );

      if (!match) return null;

      const [, version, vendor, product, deviceVersion, signatureId, name, severity, extensionsStr] = match;

      const extensions: Record<string, any> = {};
      const extensionPairs = extensionsStr.split(/\s+(?=[a-zA-Z_]\w*=)/);

      for (const pair of extensionPairs) {
        const [key, ...valueParts] = pair.split('=');
        extensions[key] = this.unescapeExtensionValue(valueParts.join('='));
      }

      return {
        version,
        deviceVendor: vendor,
        deviceProduct: product,
        deviceVersion,
        signatureId,
        name,
        severity,
        extensions,
      };
    } catch (error) {
      console.error('Failed to parse CEF event:', error);
      return null;
    }
  }

  /**
   * Unescape extension values
   */
  private static unescapeExtensionValue(value: string): string {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\=/g, '=')
      .replace(/\\\\/g, '\\');
  }
}

export default CEFFormatter;
