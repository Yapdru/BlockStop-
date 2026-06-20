import { MonitoringEvent } from './types';
import { generateEventId, normalizePath } from './utils';

interface FileAccessEvent {
  filePath: string;
  processId: number;
  operation: 'read' | 'write' | 'delete' | 'rename' | 'execute';
  timestamp: number;
  success: boolean;
  bytesTransferred?: number;
}

interface FileSystemSnapshot {
  totalEvents: number;
  readOperations: number;
  writeOperations: number;
  deleteOperations: number;
  renameOperations: number;
  executeOperations: number;
  timestamp: number;
}

export class FileAccessMonitor {
  private accessLog: Map<number, FileAccessEvent[]> = new Map();
  private fileHistory: Map<string, FileAccessEvent[]> = new Map();
  private snapshots: FileSystemSnapshot[] = [];
  private maxLogSize = 10000;

  recordFileAccess(event: FileAccessEvent): MonitoringEvent {
    const normalizedPath = normalizePath(event.filePath);

    // Record by process
    if (!this.accessLog.has(event.processId)) {
      this.accessLog.set(event.processId, []);
    }
    this.accessLog.get(event.processId)!.push(event);

    // Limit log size per process
    const procLog = this.accessLog.get(event.processId)!;
    if (procLog.length > this.maxLogSize) {
      procLog.shift();
    }

    // Record by file
    if (!this.fileHistory.has(normalizedPath)) {
      this.fileHistory.set(normalizedPath, []);
    }
    this.fileHistory.get(normalizedPath)!.push(event);

    // Limit history per file
    const fileLog = this.fileHistory.get(normalizedPath)!;
    if (fileLog.length > 1000) {
      fileLog.shift();
    }

    // Create monitoring event
    return {
      eventId: generateEventId(),
      type: `file_${event.operation}`,
      timestamp: event.timestamp,
      processId: event.processId,
      filePath: event.filePath,
      severity: 'INFO',
      indicators: [event.operation],
    };
  }

  getProcessFileAccess(processId: number): FileAccessEvent[] {
    return this.accessLog.get(processId) || [];
  }

  getFileAccessHistory(filePath: string): FileAccessEvent[] {
    const normalized = normalizePath(filePath);
    return this.fileHistory.get(normalized) || [];
  }

  detectSuspiciousActivity(
    processId: number,
    windowMs: number = 60000
  ): string[] {
    const events = this.getProcessFileAccess(processId);
    if (events.length === 0) return [];

    const now = Date.now();
    const recentEvents = events.filter((e) => now - e.timestamp < windowMs);

    const indicators: string[] = [];

    // Detect rapid file writes
    const writeOps = recentEvents.filter((e) => e.operation === 'write');
    if (writeOps.length > 50) {
      indicators.push('rapid_file_writes');
    }

    // Detect file deletion pattern
    const deleteOps = recentEvents.filter((e) => e.operation === 'delete');
    if (deleteOps.length > 20) {
      indicators.push('mass_file_deletion');
    }

    // Detect suspicious file extensions
    const suspiciousExts = ['.exe', '.dll', '.sys', '.bat', '.cmd', '.vbs', '.ps1'];
    const suspiciousWrites = writeOps.filter((e) =>
      suspiciousExts.some((ext) => e.filePath.toLowerCase().endsWith(ext))
    );
    if (suspiciousWrites.length > 3) {
      indicators.push('suspicious_file_execution');
    }

    // Detect access to system directories
    const systemDirs = [
      '/windows/system32',
      '/system32',
      '/etc',
      '/sys',
      '/proc',
    ];
    const systemAccess = recentEvents.filter((e) =>
      systemDirs.some((dir) =>
        normalizePath(e.filePath).includes(normalizePath(dir))
      )
    );
    if (systemAccess.length > 5) {
      indicators.push('system_directory_access');
    }

    // Detect large file transfers
    const largeWrites = writeOps.filter(
      (e) => (e.bytesTransferred || 0) > 10 * 1024 * 1024
    ); // 10MB
    if (largeWrites.length > 0) {
      indicators.push('large_file_write');
    }

    // Detect file renaming with suspicious extensions
    const renameOps = recentEvents.filter((e) => e.operation === 'rename');
    const suspiciousRenames = renameOps.filter((e) =>
      suspiciousExts.some((ext) => e.filePath.toLowerCase().endsWith(ext))
    );
    if (suspiciousRenames.length > 2) {
      indicators.push('suspicious_rename_operations');
    }

    return [...new Set(indicators)];
  }

  recordSnapshot(): FileSystemSnapshot {
    const events = Array.from(this.accessLog.values()).flat();
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const recentEvents = events.filter((e) => now - e.timestamp < windowMs);

    const snapshot: FileSystemSnapshot = {
      totalEvents: recentEvents.length,
      readOperations: recentEvents.filter((e) => e.operation === 'read').length,
      writeOperations: recentEvents.filter((e) => e.operation === 'write').length,
      deleteOperations: recentEvents.filter((e) => e.operation === 'delete').length,
      renameOperations: recentEvents.filter((e) => e.operation === 'rename').length,
      executeOperations: recentEvents.filter((e) => e.operation === 'execute').length,
      timestamp: now,
    };

    this.snapshots.push(snapshot);

    // Keep last 1000 snapshots
    if (this.snapshots.length > 1000) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshots(
    windowMs: number = 3600000
  ): FileSystemSnapshot[] {
    const cutoff = Date.now() - windowMs;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  getFailedAccesses(processId?: number): FileAccessEvent[] {
    const events = processId
      ? this.getProcessFileAccess(processId)
      : Array.from(this.accessLog.values()).flat();

    return events.filter((e) => !e.success);
  }

  getAllProcesses(): number[] {
    return Array.from(this.accessLog.keys());
  }

  clear(processId?: number): void {
    if (processId) {
      this.accessLog.delete(processId);
    } else {
      this.accessLog.clear();
      this.fileHistory.clear();
      this.snapshots = [];
    }
  }

  getStatistics(): {
    trackedProcesses: number;
    trackedFiles: number;
    totalEvents: number;
  } {
    return {
      trackedProcesses: this.accessLog.size,
      trackedFiles: this.fileHistory.size,
      totalEvents: Array.from(this.accessLog.values()).reduce(
        (sum, events) => sum + events.length,
        0
      ),
    };
  }
}

export default FileAccessMonitor;
