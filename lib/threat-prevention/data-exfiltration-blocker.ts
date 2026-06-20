import { Threat } from './types';
import { generateThreatId, calculateConfidence } from './utils';

interface DataTransfer {
  processId: number;
  sourceFile: string;
  destinationHost: string;
  protocol: string;
  bytesTransferred: number;
  timestamp: number;
  isEncrypted: boolean;
}

interface DeviceAccess {
  processId: number;
  deviceType: 'USB' | 'NETWORK' | 'CLOUD' | 'REMOVABLE';
  deviceName: string;
  accessType: 'read' | 'write';
  dataSize: number;
  timestamp: number;
}

interface SensitiveFileAccess {
  processId: number;
  filePath: string;
  fileName: string;
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET';
  accessTime: number;
}

export class DataExfiltractionBlocker {
  private transferLog: Map<number, DataTransfer[]> = new Map();
  private deviceAccessLog: Map<number, DeviceAccess[]> = new Map();
  private sensitiveFileLog: Map<number, SensitiveFileAccess[]> = new Map();

  private sensitiveFilePatterns = [
    /\.pfx|\.p12|\.key|\.pem/i, // Certificates and keys
    /password|secret|credential/i, // Credential files
    /\.sql|\.db|\.sqlite/i, // Databases
    /\.docx|\.xlsx|\.pdf/i, // Documents
  ];

  private suspiciousCloudServices = [
    'dropbox.com',
    'box.com',
    'mega.nz',
    'yandex.com',
    'torrent',
    'pastebin.com',
  ];

  async detectDataExfiltration(
    processId: number,
    activities: {
      transfers?: DataTransfer[];
      devices?: DeviceAccess[];
      sensitiveFiles?: SensitiveFileAccess[];
    }
  ): Promise<Threat | null> {
    const indicators: string[] = [];

    // Analyze network transfers
    if (activities.transfers) {
      const transferIndicators = this.analyzeDataTransfers(
        activities.transfers
      );
      indicators.push(...transferIndicators);
      this.recordTransfers(processId, activities.transfers);
    }

    // Analyze device access
    if (activities.devices) {
      const deviceIndicators = this.analyzeDeviceAccess(activities.devices);
      indicators.push(...deviceIndicators);
      this.recordDeviceAccess(processId, activities.devices);
    }

    // Analyze sensitive file access
    if (activities.sensitiveFiles) {
      const fileIndicators = this.analyzeSensitiveFileAccess(
        activities.sensitiveFiles
      );
      indicators.push(...fileIndicators);
      this.recordSensitiveFileAccess(processId, activities.sensitiveFiles);
    }

    if (indicators.length === 0) {
      return null;
    }

    const confidence = calculateConfidence(
      indicators.length,
      12 // Normalize against typical indicator count
    );

    if (confidence < 0.6) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'DATA_EXFILTRATION',
      severity: 'HIGH',
      timestamp: Date.now(),
      source: 'DataExfiltractionBlocker',
      description: `Data exfiltration detected: ${indicators.join(', ')}`,
      processId,
      behaviorIndicators: indicators,
      metadata: {
        transferCount: activities.transfers?.length || 0,
        deviceAccesses: activities.devices?.length || 0,
        sensitiveFileAccesses: activities.sensitiveFiles?.length || 0,
      },
    };

    return threat;
  }

  private analyzeDataTransfers(transfers: DataTransfer[]): string[] {
    const indicators: string[] = [];

    if (transfers.length === 0) return indicators;

    // Calculate total data transferred
    const totalBytes = transfers.reduce((sum, t) => sum + t.bytesTransferred, 0);
    if (totalBytes > 100 * 1024 * 1024) {
      // > 100MB
      indicators.push('large_volume_transfer');
    }

    // Detect transfers to unusual destinations
    const externalDests = transfers.filter((t) =>
      !this.isInternalDestination(t.destinationHost)
    );
    if (externalDests.length > 0) {
      indicators.push('external_host_transfer');
    }

    // Detect transfers to suspicious cloud services
    const suspiciousDests = transfers.filter((t) =>
      this.suspiciousCloudServices.some((service) =>
        t.destinationHost.includes(service)
      )
    );
    if (suspiciousDests.length > 0) {
      indicators.push('suspicious_cloud_upload');
    }

    // Detect encrypted connections (possible tunneling)
    const encryptedTransfers = transfers.filter((t) => t.isEncrypted);
    if (encryptedTransfers.length === transfers.length && transfers.length > 3) {
      indicators.push('all_transfers_encrypted');
    }

    // Detect high transfer frequency
    if (transfers.length > 10) {
      indicators.push('high_transfer_frequency');
    }

    // Detect unusual protocols
    const protocols = new Set(transfers.map((t) => t.protocol));
    if (
      protocols.has('HTTPS') ||
      protocols.has('SSH') ||
      protocols.has('SFTP')
    ) {
      if (transfers.length > 5) {
        indicators.push('tunneled_data_transfer');
      }
    }

    return indicators;
  }

  private analyzeDeviceAccess(devices: DeviceAccess[]): string[] {
    const indicators: string[] = [];

    // Detect USB access
    const usbAccess = devices.filter((d) => d.deviceType === 'USB');
    if (usbAccess.some((d) => d.accessType === 'write')) {
      indicators.push('usb_write_access');
    }
    if (usbAccess.length > 2) {
      indicators.push('multiple_usb_access');
    }

    // Detect removable media access
    const removableAccess = devices.filter(
      (d) => d.deviceType === 'REMOVABLE'
    );
    if (removableAccess.length > 0) {
      indicators.push('removable_media_access');
    }

    // Detect large volume device transfers
    const largeTransfers = devices.filter((d) => d.dataSize > 500 * 1024 * 1024); // 500MB
    if (largeTransfers.length > 0) {
      indicators.push('large_device_transfer');
    }

    // Detect cloud access
    const cloudAccess = devices.filter((d) => d.deviceType === 'CLOUD');
    if (cloudAccess.some((d) => d.accessType === 'write')) {
      indicators.push('cloud_write_access');
    }

    return indicators;
  }

  private analyzeSensitiveFileAccess(
    files: SensitiveFileAccess[]
  ): string[] {
    const indicators: string[] = [];

    // Count accesses by classification
    const byClassification: Record<string, number> = {};
    for (const file of files) {
      byClassification[file.dataClassification] =
        (byClassification[file.dataClassification] || 0) + 1;
    }

    // Detect access to confidential/secret files
    if (byClassification.CONFIDENTIAL && byClassification.CONFIDENTIAL >= 3) {
      indicators.push('confidential_data_access');
    }
    if (byClassification.SECRET) {
      indicators.push('secret_data_access');
    }

    // Detect access to sensitive file types
    const sensitiveCounts = files.filter((f) =>
      this.sensitiveFilePatterns.some((pattern) =>
        pattern.test(f.fileName)
      )
    ).length;

    if (sensitiveCounts > 2) {
      indicators.push('sensitive_file_access');
    }

    // Detect certificate/key access
    if (files.some((f) => /\.pfx|\.p12|\.key|\.pem/i.test(f.fileName))) {
      indicators.push('certificate_key_access');
    }

    // Detect database access
    if (files.some((f) => /\.sql|\.db|\.sqlite/i.test(f.fileName))) {
      indicators.push('database_access');
    }

    // Detect bulk file access
    if (files.length > 20) {
      indicators.push('bulk_sensitive_file_access');
    }

    return indicators;
  }

  private isInternalDestination(host: string): boolean {
    const internalPatterns = [
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /\.local$/i,
      /\.internal$/i,
      /localhost/i,
    ];

    return internalPatterns.some((pattern) => pattern.test(host));
  }

  private recordTransfers(processId: number, transfers: DataTransfer[]): void {
    if (!this.transferLog.has(processId)) {
      this.transferLog.set(processId, []);
    }
    this.transferLog.get(processId)!.push(...transfers);
  }

  private recordDeviceAccess(
    processId: number,
    devices: DeviceAccess[]
  ): void {
    if (!this.deviceAccessLog.has(processId)) {
      this.deviceAccessLog.set(processId, []);
    }
    this.deviceAccessLog.get(processId)!.push(...devices);
  }

  private recordSensitiveFileAccess(
    processId: number,
    files: SensitiveFileAccess[]
  ): void {
    if (!this.sensitiveFileLog.has(processId)) {
      this.sensitiveFileLog.set(processId, []);
    }
    this.sensitiveFileLog.get(processId)!.push(...files);
  }

  getTransferLog(processId: number): DataTransfer[] {
    return this.transferLog.get(processId) || [];
  }

  getDeviceAccessLog(processId: number): DeviceAccess[] {
    return this.deviceAccessLog.get(processId) || [];
  }

  getSensitiveFileLog(processId: number): SensitiveFileAccess[] {
    return this.sensitiveFileLog.get(processId) || [];
  }
}

export default DataExfiltractionBlocker;
