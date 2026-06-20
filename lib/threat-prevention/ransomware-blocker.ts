import { Threat } from './types';
import { RANSOMWARE_INDICATORS, SUSPICIOUS_FILE_EXTENSIONS } from './constants';
import { generateThreatId, calculateConfidence } from './utils';

interface FileActivityPattern {
  processId: number;
  filePath: string;
  operation: 'create' | 'modify' | 'delete' | 'encrypt';
  timestamp: number;
  fileSize?: number;
}

interface RansomwareActivity {
  fileEncryptionCount: number;
  extensionChanges: number;
  shadowCopyDeletions: number;
  fileAccessRate: number;
  encryptionPatterns: string[];
}

export class RansomwareBlocker {
  private fileActivityLog: Map<number, FileActivityPattern[]> = new Map();
  private detectionThresholds = {
    minEncryptedFiles: 5,
    minExtensionChanges: 3,
    minAccessRate: 50, // files per second
  };

  async detectRansomware(
    processId: number,
    activities: FileActivityPattern[]
  ): Promise<Threat | null> {
    const pattern = this.analyzeActivityPattern(activities);

    if (!this.isRansomwareLikeBehavior(pattern)) {
      return null;
    }

    const confidence = calculateConfidence(
      pattern.encryptionPatterns.length,
      RANSOMWARE_INDICATORS.length
    );

    if (confidence < 0.7) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'RANSOMWARE',
      severity: 'CRITICAL',
      timestamp: Date.now(),
      source: 'RansomwareBlocker',
      description: `Ransomware-like behavior detected: ${pattern.encryptionPatterns.join(', ')}`,
      processId,
      behaviorIndicators: pattern.encryptionPatterns,
      metadata: {
        fileEncryptionCount: pattern.fileEncryptionCount,
        extensionChanges: pattern.extensionChanges,
        shadowCopyDeletions: pattern.shadowCopyDeletions,
        fileAccessRate: pattern.fileAccessRate,
      },
    };

    this.recordActivity(processId, activities);
    return threat;
  }

  private analyzeActivityPattern(
    activities: FileActivityPattern[]
  ): RansomwareActivity {
    const pattern: RansomwareActivity = {
      fileEncryptionCount: 0,
      extensionChanges: 0,
      shadowCopyDeletions: 0,
      fileAccessRate: 0,
      encryptionPatterns: [],
    };

    const now = Date.now();
    const recentActivities = activities.filter(
      (a) => now - a.timestamp < 60000
    ); // Last 60 seconds

    for (const activity of recentActivities) {
      if (activity.operation === 'encrypt') {
        pattern.fileEncryptionCount++;
      }

      if (this.hasExtensionChange(activity)) {
        pattern.extensionChanges++;
      }

      if (activity.filePath.includes('shadow')) {
        pattern.shadowCopyDeletions++;
      }
    }

    if (recentActivities.length > 0) {
      const timeSpan = (now - recentActivities[0].timestamp) / 1000 || 1;
      pattern.fileAccessRate = recentActivities.length / timeSpan;
    }

    pattern.encryptionPatterns = this.detectEncryptionIndicators(
      activities
    );

    return pattern;
  }

  private hasExtensionChange(activity: FileActivityPattern): boolean {
    const originalExt = activity.filePath.split('.').pop()?.toLowerCase();
    const suspiciousExts = [
      'encrypted',
      'locked',
      'crypt',
      'ransom',
      'payload',
    ];
    return suspiciousExts.some((ext) => originalExt?.includes(ext)) || false;
  }

  private detectEncryptionIndicators(
    activities: FileActivityPattern[]
  ): string[] {
    const indicators: string[] = [];

    const encryptOperations = activities.filter(
      (a) => a.operation === 'encrypt'
    );
    if (encryptOperations.length >= this.detectionThresholds.minEncryptedFiles) {
      indicators.push('mass_file_encryption');
    }

    const deleteOperations = activities.filter(
      (a) => a.operation === 'delete'
    );
    if (deleteOperations.length > 0) {
      indicators.push('file_deletion');
    }

    const shadowCopies = activities.filter((a) =>
      a.filePath.toLowerCase().includes('shadow')
    );
    if (shadowCopies.length > 0) {
      indicators.push('shadow_copy_deletion');
    }

    // Check for boot sector modifications
    const bootSectorAccess = activities.filter(
      (a) =>
        a.filePath.toLowerCase().includes('mbr') ||
        a.filePath.toLowerCase().includes('boot')
    );
    if (bootSectorAccess.length > 0) {
      indicators.push('boot_record_modification');
    }

    // Check for rapid file modifications
    const now = Date.now();
    const lastMinute = activities.filter(
      (a) => now - a.timestamp < 60000
    ).length;
    if (lastMinute > this.detectionThresholds.minAccessRate) {
      indicators.push('rapid_file_modification');
    }

    return indicators;
  }

  private isRansomwareLikeBehavior(pattern: RansomwareActivity): boolean {
    const indicators = pattern.encryptionPatterns.length;

    if (
      pattern.fileEncryptionCount >=
      this.detectionThresholds.minEncryptedFiles
    ) {
      return true;
    }

    if (
      pattern.extensionChanges >= this.detectionThresholds.minExtensionChanges
    ) {
      return true;
    }

    if (pattern.shadowCopyDeletions > 0 && pattern.fileEncryptionCount >= 2) {
      return true;
    }

    if (indicators >= 2) {
      return true;
    }

    return false;
  }

  private recordActivity(
    processId: number,
    activities: FileActivityPattern[]
  ): void {
    if (!this.fileActivityLog.has(processId)) {
      this.fileActivityLog.set(processId, []);
    }

    const log = this.fileActivityLog.get(processId)!;
    log.push(...activities);

    // Keep last 1000 activities
    if (log.length > 1000) {
      log.splice(0, log.length - 1000);
    }
  }

  getActivityLog(processId: number): FileActivityPattern[] {
    return this.fileActivityLog.get(processId) || [];
  }

  clearLog(processId?: number): void {
    if (processId) {
      this.fileActivityLog.delete(processId);
    } else {
      this.fileActivityLog.clear();
    }
  }
}

export default RansomwareBlocker;
