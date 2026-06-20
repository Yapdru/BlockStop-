/**
 * Real-Time File Monitoring for Mobile Pro
 * Monitors file system changes and detects suspicious activity
 */

export interface FileMonitor {
  path: string;
  eventType: 'created' | 'modified' | 'deleted' | 'accessed' | 'renamed';
  timestamp: Date;
  fileSize: number;
  fileHash: string;
  ownerApp: string;
  suspicious: boolean;
  reason?: string;
}

export class FileMonitoringService {
  private monitoredPaths: Map<string, boolean> = new Map();
  private fileEventLog: FileMonitor[] = [];
  private maxLogSize = 10000;
  private suspiciousPatterns = ['.apk', '.dex', '.so', '.jar', '.exe', '.dll'];

  async startMonitoring(path: string): Promise<void> {
    this.monitoredPaths.set(path, true);
    console.log(`Monitoring started for: ${path}`);
  }

  async stopMonitoring(path: string): Promise<void> {
    this.monitoredPaths.delete(path);
    console.log(`Monitoring stopped for: ${path}`);
  }

  async onFileEvent(monitor: Omit<FileMonitor, 'suspicious' | 'reason'>): Promise<void> {
    const suspicious = this.detectSuspiciousActivity(monitor);

    const event: FileMonitor = {
      ...monitor,
      suspicious,
      reason: suspicious ? this.generateSuspicionReason(monitor) : undefined,
    };

    this.fileEventLog.push(event);

    // Maintain max log size
    if (this.fileEventLog.length > this.maxLogSize) {
      this.fileEventLog.shift();
    }

    if (suspicious) {
      await this.handleSuspiciousActivity(event);
    }
  }

  private detectSuspiciousActivity(monitor: Omit<FileMonitor, 'suspicious' | 'reason'>): boolean {
    // Check for suspicious file extensions
    if (this.suspiciousPatterns.some((pattern) => monitor.path.endsWith(pattern))) {
      return true;
    }

    // Detect unusual write activity by non-system apps
    if (monitor.eventType === 'created' || monitor.eventType === 'modified') {
      if (!monitor.ownerApp.startsWith('system.')) {
        if (monitor.fileSize > 10 * 1024 * 1024) {
          return true; // Large files created by user apps
        }
      }
    }

    // Detect rapid file operations (potential scanning/exfiltration)
    const recentEvents = this.fileEventLog.filter(
      (e) => new Date().getTime() - e.timestamp.getTime() < 1000
    );
    if (recentEvents.length > 10) {
      return true;
    }

    return false;
  }

  private generateSuspicionReason(monitor: Omit<FileMonitor, 'suspicious' | 'reason'>): string {
    if (this.suspiciousPatterns.some((pattern) => monitor.path.endsWith(pattern))) {
      return `Suspicious file extension detected: ${monitor.path}`;
    }

    if (monitor.fileSize > 10 * 1024 * 1024) {
      return `Large file created by non-system app: ${(monitor.fileSize / 1024 / 1024).toFixed(2)}MB`;
    }

    return 'Unusual file system activity detected';
  }

  private async handleSuspiciousActivity(monitor: FileMonitor): Promise<void> {
    // Log suspicious activity and alert user
    console.warn('Suspicious file activity detected:', monitor);

    // In production, trigger alert notification
    // In production, quarantine the file if necessary
  }

  async getFileEventLog(limit: number = 100): Promise<FileMonitor[]> {
    return this.fileEventLog.slice(-limit);
  }

  async getSuspiciousEvents(limit: number = 50): Promise<FileMonitor[]> {
    return this.fileEventLog.filter((e) => e.suspicious).slice(-limit);
  }

  async getStatistics(): Promise<{
    totalEvents: number;
    suspiciousEvents: number;
    monitoredPaths: number;
    topApps: Array<{ app: string; eventCount: number }>;
  }> {
    const suspicious = this.fileEventLog.filter((e) => e.suspicious).length;
    const appCounts: Record<string, number> = {};

    for (const event of this.fileEventLog) {
      appCounts[event.ownerApp] = (appCounts[event.ownerApp] || 0) + 1;
    }

    const topApps = Object.entries(appCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([app, count]) => ({ app, eventCount: count }));

    return {
      totalEvents: this.fileEventLog.length,
      suspiciousEvents: suspicious,
      monitoredPaths: this.monitoredPaths.size,
      topApps,
    };
  }

  async clearEventLog(): Promise<void> {
    this.fileEventLog = [];
  }
}

export const fileMonitoring = new FileMonitoringService();
