import { MonitoringEvent } from './types';
import { generateEventId } from './utils';

interface RegistryAccess {
  processId: number;
  hive: string;
  path: string;
  valueName?: string;
  operation: 'read' | 'write' | 'delete';
  valueType?: string;
  valueData?: string;
  timestamp: number;
  success: boolean;
}

interface RegistrySnapshot {
  totalAccesses: number;
  readOperations: number;
  writeOperations: number;
  deleteOperations: number;
  uniquePaths: number;
  timestamp: number;
}

export class RegistryMonitor {
  private accessLog: Map<number, RegistryAccess[]> = new Map();
  private pathHistory: Map<string, RegistryAccess[]> = new Map();
  private snapshots: RegistrySnapshot[] = [];
  private maxLogSize = 5000;

  private suspiciousPaths = [
    'HKLM\\Software\\Microsoft\\Windows\\Run',
    'HKCU\\Software\\Microsoft\\Windows\\Run',
    'HKLM\\Software\\Microsoft\\Windows\\RunOnce',
    'HKCU\\Software\\Microsoft\\Windows\\RunOnce',
    'HKLM\\System\\CurrentControlSet\\Services',
    'HKLM\\Software\\Classes\\CLSID',
    'HKCU\\Software\\Classes\\ms-settings',
    'HKLM\\Software\\Microsoft\\Active Setup',
  ];

  recordRegistryAccess(access: RegistryAccess): MonitoringEvent {
    const fullPath = `${access.hive}\\${access.path}`;

    if (!this.accessLog.has(access.processId)) {
      this.accessLog.set(access.processId, []);
    }

    const log = this.accessLog.get(access.processId)!;
    log.push(access);

    if (log.length > this.maxLogSize) {
      log.shift();
    }

    // Record by path
    if (!this.pathHistory.has(fullPath)) {
      this.pathHistory.set(fullPath, []);
    }

    const pathLog = this.pathHistory.get(fullPath)!;
    pathLog.push(access);

    if (pathLog.length > 500) {
      pathLog.shift();
    }

    return {
      eventId: generateEventId(),
      type: `registry_${access.operation}`,
      timestamp: access.timestamp,
      processId: access.processId,
      registryPath: fullPath,
      severity: this.determineSeverity(fullPath, access.operation),
      indicators: [access.operation, access.hive],
    };
  }

  private determineSeverity(
    path: string,
    operation: string
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
    if (operation === 'write' && this.isSuspiciousPath(path)) {
      return 'HIGH';
    }
    if (operation === 'delete' && path.includes('Security')) {
      return 'CRITICAL';
    }
    if (operation === 'read' && this.isSuspiciousPath(path)) {
      return 'MEDIUM';
    }
    return 'INFO';
  }

  private isSuspiciousPath(path: string): boolean {
    return this.suspiciousPaths.some((sp) =>
      path.toUpperCase().includes(sp.toUpperCase())
    );
  }

  getProcessAccess(processId: number): RegistryAccess[] {
    return this.accessLog.get(processId) || [];
  }

  getPathHistory(hive: string, path: string): RegistryAccess[] {
    const fullPath = `${hive}\\${path}`;
    return this.pathHistory.get(fullPath) || [];
  }

  detectSuspiciousActivity(processId: number): string[] {
    const accesses = this.getProcessAccess(processId);
    if (accesses.length === 0) return [];

    const indicators: string[] = [];

    // Detect persistence registry modifications
    const persistenceWrites = accesses.filter(
      (a) =>
        a.operation === 'write' &&
        this.suspiciousPaths.some((sp) =>
          `${a.hive}\\${a.path}`.toUpperCase().includes(sp.toUpperCase())
        )
    );
    if (persistenceWrites.length > 2) {
      indicators.push('persistence_registry_modification');
    }

    // Detect registry hive enumeration
    const reads = accesses.filter((a) => a.operation === 'read');
    const uniqueReadPaths = new Set(reads.map((a) => a.path)).size;
    if (uniqueReadPaths > 20) {
      indicators.push('registry_enumeration');
    }

    // Detect security descriptor modifications
    const securityAccess = accesses.filter(
      (a) =>
        a.path.includes('Security') || a.path.includes('Descriptor')
    );
    if (securityAccess.some((a) => a.operation === 'write')) {
      indicators.push('security_descriptor_modification');
    }

    // Detect UAC bypass registry modifications
    const uacBypassAccess = accesses.filter(
      (a) =>
        (a.path.includes('ms-settings') ||
          a.path.includes('App Paths') ||
          a.path.includes('CLSID')) &&
        a.operation === 'write'
    );
    if (uacBypassAccess.length > 0) {
      indicators.push('uac_bypass_attempt');
    }

    // Detect service installation registry modifications
    const serviceWrites = accesses.filter(
      (a) =>
        a.path.includes('CurrentControlSet\\Services') &&
        a.operation === 'write'
    );
    if (serviceWrites.length > 3) {
      indicators.push('service_installation');
    }

    // Detect access to sensitive hives
    const sensitiveHives = accesses.filter(
      (a) =>
        (a.hive === 'HKLM' || a.hive === 'HKU') &&
        accesses.length > 30
    );
    if (sensitiveHives.length > 0) {
      indicators.push('sensitive_hive_access');
    }

    // Detect registry quota exhaustion
    const writes = accesses.filter((a) => a.operation === 'write');
    if (writes.length > 100) {
      indicators.push('high_registry_write_rate');
    }

    // Detect deletion of registry entries
    const deletes = accesses.filter((a) => a.operation === 'delete');
    if (deletes.length > 5) {
      indicators.push('mass_registry_deletion');
    }

    return [...new Set(indicators)];
  }

  recordSnapshot(): RegistrySnapshot {
    const allAccess = Array.from(this.accessLog.values()).flat();
    const uniquePaths = new Set(
      allAccess.map((a) => `${a.hive}\\${a.path}`)
    ).size;

    const snapshot: RegistrySnapshot = {
      totalAccesses: allAccess.length,
      readOperations: allAccess.filter((a) => a.operation === 'read').length,
      writeOperations: allAccess.filter((a) => a.operation === 'write').length,
      deleteOperations: allAccess.filter((a) => a.operation === 'delete').length,
      uniquePaths,
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > 1000) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshots(windowMs: number = 3600000): RegistrySnapshot[] {
    const cutoff = Date.now() - windowMs;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  getFailedAccesses(processId?: number): RegistryAccess[] {
    const accesses = processId
      ? this.getProcessAccess(processId)
      : Array.from(this.accessLog.values()).flat();

    return accesses.filter((a) => !a.success);
  }

  getSuspiciousPathAccess(): RegistryAccess[] {
    return Array.from(this.pathHistory.values())
      .flat()
      .filter(
        (a) =>
          this.isSuspiciousPath(`${a.hive}\\${a.path}`) &&
          a.operation === 'write'
      );
  }

  getAllProcesses(): number[] {
    return Array.from(this.accessLog.keys());
  }

  clear(processId?: number): void {
    if (processId) {
      this.accessLog.delete(processId);
    } else {
      this.accessLog.clear();
      this.pathHistory.clear();
      this.snapshots = [];
    }
  }

  getStatistics(): {
    trackedProcesses: number;
    trackedPaths: number;
    totalAccesses: number;
  } {
    return {
      trackedProcesses: this.accessLog.size,
      trackedPaths: this.pathHistory.size,
      totalAccesses: Array.from(this.accessLog.values()).reduce(
        (sum, log) => sum + log.length,
        0
      ),
    };
  }
}

export default RegistryMonitor;
