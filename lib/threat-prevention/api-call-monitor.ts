import { MonitoringEvent } from './types';
import { generateEventId } from './utils';

interface ApiCall {
  processId: number;
  apiName: string;
  module: string;
  arguments?: Record<string, any>;
  returnValue?: any;
  timestamp: number;
  duration: number;
  success: boolean;
  errorCode?: number;
}

interface ApiCallSnapshot {
  totalCalls: number;
  uniqueApis: number;
  failureRate: number;
  averageCallDuration: number;
  timestamp: number;
}

export class ApiCallMonitor {
  private callLog: Map<number, ApiCall[]> = new Map();
  private apiFrequency: Map<string, number> = new Map();
  private snapshots: ApiCallSnapshot[] = [];
  private maxLogSize = 5000;

  private suspiciousApis = [
    // Process-related
    'CreateRemoteThread',
    'WriteProcessMemory',
    'VirtualAllocEx',
    'SetWindowsHookEx',
    'CreateProcess',
    'ShellExecute',
    // File-related
    'WriteFile',
    'DeleteFile',
    'ReplaceFile',
    'CopyFile',
    // Registry-related
    'RegSetValueEx',
    'RegDeleteKey',
    'RegLoadKey',
    // Network-related
    'InternetOpen',
    'WinHttpOpen',
    'URLDownloadToFile',
    'InternetOpenUrl',
    // System-related
    'CreateService',
    'StartService',
    'LoadDriver',
  ];

  recordApiCall(call: ApiCall): MonitoringEvent {
    if (!this.callLog.has(call.processId)) {
      this.callLog.set(call.processId, []);
    }

    const log = this.callLog.get(call.processId)!;
    log.push(call);

    if (log.length > this.maxLogSize) {
      log.shift();
    }

    // Track frequency
    this.apiFrequency.set(
      call.apiName,
      (this.apiFrequency.get(call.apiName) || 0) + 1
    );

    const severity = this.determineSeverity(call);

    return {
      eventId: generateEventId(),
      type: 'api_call',
      timestamp: call.timestamp,
      processId: call.processId,
      severity,
      indicators: [call.apiName, call.module],
    };
  }

  private determineSeverity(call: ApiCall): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
    if (this.suspiciousApis.includes(call.apiName)) {
      if (!call.success) return 'HIGH';
      return 'MEDIUM';
    }
    return 'INFO';
  }

  getProcessCalls(processId: number): ApiCall[] {
    return this.callLog.get(processId) || [];
  }

  detectAnomalousApiUsage(processId: number): string[] {
    const calls = this.getProcessCalls(processId);
    if (calls.length === 0) return [];

    const indicators: string[] = [];

    // Detect suspicious API calls
    const suspiciousCalls = calls.filter((c) =>
      this.suspiciousApis.includes(c.apiName)
    );
    if (suspiciousCalls.length > 5) {
      indicators.push('multiple_suspicious_api_calls');
    }

    // Detect memory manipulation
    const memoryApis = calls.filter((c) =>
      [
        'VirtualAllocEx',
        'WriteProcessMemory',
        'CreateRemoteThread',
        'SetWindowsHookEx',
      ].includes(c.apiName)
    );
    if (memoryApis.length > 2) {
      indicators.push('memory_manipulation_attempt');
    }

    // Detect process injection
    if (
      calls.some((c) => c.apiName === 'CreateRemoteThread') &&
      calls.some((c) => c.apiName === 'WriteProcessMemory')
    ) {
      indicators.push('process_injection_pattern');
    }

    // Detect network communication
    const netApis = calls.filter((c) =>
      [
        'InternetOpen',
        'InternetOpenUrl',
        'WinHttpOpen',
        'URLDownloadToFile',
      ].includes(c.apiName)
    );
    if (netApis.length > 3) {
      indicators.push('network_communication');
    }

    // Detect privilege escalation attempts
    const privApis = calls.filter((c) =>
      [
        'CreateService',
        'StartService',
        'LoadDriver',
        'AdjustTokenPrivileges',
      ].includes(c.apiName)
    );
    if (privApis.length > 1) {
      indicators.push('privilege_escalation_attempt');
    }

    // Detect high failure rate
    const failures = calls.filter((c) => !c.success).length;
    const failureRate = failures / calls.length;
    if (failureRate > 0.3) {
      indicators.push('high_api_failure_rate');
    }

    // Detect rapid API calls
    if (calls.length > 100) {
      const now = Date.now();
      const recentCalls = calls.filter((c) => now - c.timestamp < 10000); // 10 seconds
      if (recentCalls.length > 50) {
        indicators.push('rapid_api_calls');
      }
    }

    // Detect registry modification attempts
    const regApis = calls.filter((c) =>
      [
        'RegSetValueEx',
        'RegDeleteKey',
        'RegLoadKey',
        'RegUnLoadKey',
      ].includes(c.apiName)
    );
    if (regApis.length > 5) {
      indicators.push('registry_modification_attempt');
    }

    // Detect file system modification
    const fileApis = calls.filter((c) =>
      ['WriteFile', 'DeleteFile', 'CopyFile', 'ReplaceFile'].includes(
        c.apiName
      )
    );
    if (fileApis.length > 10) {
      indicators.push('file_system_modification');
    }

    return [...new Set(indicators)];
  }

  recordSnapshot(): ApiCallSnapshot {
    const allCalls = Array.from(this.callLog.values()).flat();
    const uniqueApis = new Set(allCalls.map((c) => c.apiName)).size;
    const failures = allCalls.filter((c) => !c.success).length;
    const failureRate = allCalls.length > 0 ? failures / allCalls.length : 0;
    const avgDuration =
      allCalls.length > 0
        ? allCalls.reduce((sum, c) => sum + c.duration, 0) / allCalls.length
        : 0;

    const snapshot: ApiCallSnapshot = {
      totalCalls: allCalls.length,
      uniqueApis,
      failureRate,
      averageCallDuration: avgDuration,
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > 1000) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshots(windowMs: number = 3600000): ApiCallSnapshot[] {
    const cutoff = Date.now() - windowMs;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  getMostFrequentApis(limit: number = 10): Array<[string, number]> {
    return Array.from(this.apiFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  getFailedApiCalls(processId?: number): ApiCall[] {
    const calls = processId
      ? this.getProcessCalls(processId)
      : Array.from(this.callLog.values()).flat();

    return calls.filter((c) => !c.success);
  }

  getAllProcesses(): number[] {
    return Array.from(this.callLog.keys());
  }

  clear(processId?: number): void {
    if (processId) {
      this.callLog.delete(processId);
    } else {
      this.callLog.clear();
      this.apiFrequency.clear();
      this.snapshots = [];
    }
  }

  getStatistics(): {
    trackedProcesses: number;
    uniqueApis: number;
    totalCalls: number;
  } {
    return {
      trackedProcesses: this.callLog.size,
      uniqueApis: this.apiFrequency.size,
      totalCalls: Array.from(this.callLog.values()).reduce(
        (sum, log) => sum + log.length,
        0
      ),
    };
  }
}

export default ApiCallMonitor;
