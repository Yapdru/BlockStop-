import { Threat } from './types';
import { generateThreatId, calculateConfidence } from './utils';

interface ProcessToken {
  processId: number;
  username: string;
  isElevated: boolean;
  privileges: string[];
  timestamp: number;
}

interface TokenPrivilege {
  name: string;
  enabled: boolean;
  sensitive: boolean;
}

interface RegistryOperation {
  path: string;
  operation: 'read' | 'write' | 'delete';
  processId: number;
  timestamp: number;
}

export class PrivilegeEscalationBlocker {
  private tokenLog: Map<number, ProcessToken[]> = new Map();
  private registryLog: Map<number, RegistryOperation[]> = new Map();
  private sensitivePrivileges = [
    'SeTcbPrivilege',
    'SeCreateTokenPrivilege',
    'SeAssignPrimaryTokenPrivilege',
    'SeBackupPrivilege',
    'SeRestorePrivilege',
    'SeDebugPrivilege',
    'SeAuditPrivilege',
    'SeSystemEnvironmentPrivilege',
  ];

  async detectPrivilegeEscalation(
    processId: number,
    activities: {
      tokens?: ProcessToken[];
      registryOps?: RegistryOperation[];
    }
  ): Promise<Threat | null> {
    const indicators: string[] = [];

    // Analyze token-based escalation
    if (activities.tokens) {
      const tokenIndicators = this.analyzeTokenEscalation(activities.tokens);
      indicators.push(...tokenIndicators);
      this.recordTokenActivity(processId, activities.tokens);
    }

    // Analyze registry-based escalation
    if (activities.registryOps) {
      const regIndicators = this.analyzeRegistryEscalation(
        activities.registryOps
      );
      indicators.push(...regIndicators);
      this.recordRegistryActivity(processId, activities.registryOps);
    }

    if (indicators.length === 0) {
      return null;
    }

    const confidence = calculateConfidence(
      indicators.length,
      8 // Normalize against typical indicator count
    );

    if (confidence < 0.65) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'PRIVILEGE_ESCALATION',
      severity: 'HIGH',
      timestamp: Date.now(),
      source: 'PrivilegeEscalationBlocker',
      description: `Privilege escalation attempt detected: ${indicators.join(', ')}`,
      processId,
      behaviorIndicators: indicators,
      metadata: {
        tokenCount: activities.tokens?.length || 0,
        registryOperations: activities.registryOps?.length || 0,
      },
    };

    return threat;
  }

  private analyzeTokenEscalation(tokens: ProcessToken[]): string[] {
    const indicators: string[] = [];

    if (tokens.length === 0) return indicators;

    const lastToken = tokens[tokens.length - 1];
    const previousToken = tokens.length > 1 ? tokens[tokens.length - 2] : null;

    // Detect privilege escalation from non-admin to admin
    if (previousToken && !previousToken.isElevated && lastToken.isElevated) {
      indicators.push('privilege_escalation_detected');
    }

    // Detect sensitive privilege acquisition
    const sensitivePrivsAcquired = lastToken.privileges.filter((p) =>
      this.sensitivePrivileges.includes(p)
    );
    if (sensitivePrivsAcquired.length > 0) {
      indicators.push('sensitive_privilege_acquired');
      indicators.push(`privileges_${sensitivePrivsAcquired.length}`);
    }

    // Detect token impersonation pattern
    if (
      tokens.length > 2 &&
      tokens.some((t) => t.username !== lastToken.username)
    ) {
      indicators.push('token_impersonation_pattern');
    }

    // Detect elevation from system process
    if (lastToken.isElevated && lastToken.username === 'SYSTEM') {
      if (
        previousToken &&
        previousToken.username !== 'SYSTEM' &&
        previousToken.username !== 'LOCAL SERVICE'
      ) {
        indicators.push('system_token_acquisition');
      }
    }

    // Detect SYSTEM privilege escalation
    if (lastToken.privileges.includes('SeTcbPrivilege')) {
      indicators.push('tcb_privilege_escalation');
    }

    return indicators;
  }

  private analyzeRegistryEscalation(
    registryOps: RegistryOperation[]
  ): string[] {
    const indicators: string[] = [];

    const persistencePaths = [
      'HKLM\\Software\\Microsoft\\Windows\\Run',
      'HKCU\\Software\\Microsoft\\Windows\\Run',
      'HKLM\\Software\\Microsoft\\Windows\\RunOnce',
      'HKCU\\Software\\Microsoft\\Windows\\RunOnce',
      'HKLM\\System\\CurrentControlSet\\Services',
    ];

    const uacBypassPaths = [
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths',
      'HKLM\\Software\\Classes\\CLSID',
      'HKCU\\Software\\Classes\\ms-settings',
    ];

    for (const op of registryOps) {
      // Detect persistence mechanism setup
      if (
        op.operation === 'write' &&
        persistencePaths.some((p) => op.path.includes(p))
      ) {
        indicators.push('persistence_registry_modification');
      }

      // Detect UAC bypass attempts
      if (uacBypassPaths.some((p) => op.path.includes(p))) {
        if (op.operation === 'write') {
          indicators.push('uac_bypass_attempt');
        }
      }

      // Detect security descriptor modification
      if (op.path.includes('Security') || op.path.includes('Descriptor')) {
        if (op.operation === 'write') {
          indicators.push('security_descriptor_modification');
        }
      }
    }

    // Detect privilege escalation service installation
    const serviceWrites = registryOps.filter(
      (op) =>
        op.operation === 'write' &&
        op.path.includes('CurrentControlSet\\Services')
    );
    if (serviceWrites.length > 2) {
      indicators.push('multiple_service_installations');
    }

    // Detect SYSTEM registry access from low privilege
    const systemRegistryAccess = registryOps.filter(
      (op) => op.path.includes('HKLM\\System')
    );
    if (systemRegistryAccess.length > 3) {
      indicators.push('system_registry_escalation');
    }

    return indicators;
  }

  private recordTokenActivity(
    processId: number,
    tokens: ProcessToken[]
  ): void {
    if (!this.tokenLog.has(processId)) {
      this.tokenLog.set(processId, []);
    }
    this.tokenLog.get(processId)!.push(...tokens);

    // Keep last 100 entries
    const log = this.tokenLog.get(processId)!;
    if (log.length > 100) {
      log.shift();
    }
  }

  private recordRegistryActivity(
    processId: number,
    registryOps: RegistryOperation[]
  ): void {
    if (!this.registryLog.has(processId)) {
      this.registryLog.set(processId, []);
    }
    this.registryLog.get(processId)!.push(...registryOps);

    // Keep last 200 entries
    const log = this.registryLog.get(processId)!;
    if (log.length > 200) {
      log.splice(0, log.length - 200);
    }
  }

  getTokenHistory(processId: number): ProcessToken[] {
    return this.tokenLog.get(processId) || [];
  }

  getRegistryHistory(processId: number): RegistryOperation[] {
    return this.registryLog.get(processId) || [];
  }
}

export default PrivilegeEscalationBlocker;
