import { Threat } from './types';
import { generateThreatId, calculateConfidence } from './utils';

interface NetworkBehavior {
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  processId: number;
  timestamp: number;
  isSuspicious: boolean;
}

interface CredentialActivity {
  processId: number;
  credentialType: 'NTLM' | 'Kerberos' | 'Plain' | 'Hash';
  targetHost: string;
  timestamp: number;
  success: boolean;
}

interface ShareEnumeration {
  processId: number;
  targetHost: string;
  sharesEnumerated: string[];
  timestamp: number;
}

export class LateralMovementBlocker {
  private networkActivityLog: Map<number, NetworkBehavior[]> = new Map();
  private credentialActivityLog: Map<number, CredentialActivity[]> = new Map();
  private shareEnumerationLog: Map<number, ShareEnumeration[]> = new Map();
  private detectionThresholds = {
    minNetworkConnections: 5,
    minCredentialAttempts: 3,
    minShareEnumerations: 2,
  };

  async detectLateralMovement(
    processId: number,
    activities: {
      networks?: NetworkBehavior[];
      credentials?: CredentialActivity[];
      shares?: ShareEnumeration[];
    }
  ): Promise<Threat | null> {
    const indicators: string[] = [];

    // Analyze network behavior
    if (activities.networks) {
      const networkIndicators = this.analyzeNetworkBehavior(
        activities.networks
      );
      indicators.push(...networkIndicators);
      this.recordNetworkActivity(processId, activities.networks);
    }

    // Analyze credential activities
    if (activities.credentials) {
      const credentialIndicators = this.analyzeCredentialActivity(
        activities.credentials
      );
      indicators.push(...credentialIndicators);
      this.recordCredentialActivity(processId, activities.credentials);
    }

    // Analyze share enumeration
    if (activities.shares) {
      const shareIndicators = this.analyzeShareEnumeration(activities.shares);
      indicators.push(...shareIndicators);
      this.recordShareEnumeration(processId, activities.shares);
    }

    if (indicators.length === 0) {
      return null;
    }

    const confidence = calculateConfidence(
      indicators.length,
      10 // Normalize against typical indicator count
    );

    if (confidence < 0.6) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'LATERAL_MOVEMENT',
      severity: 'HIGH',
      timestamp: Date.now(),
      source: 'LateralMovementBlocker',
      description: `Lateral movement detected: ${indicators.join(', ')}`,
      processId,
      behaviorIndicators: indicators,
      metadata: {
        networkConnections: activities.networks?.length || 0,
        credentialAttempts: activities.credentials?.length || 0,
        shareEnumerations: activities.shares?.length || 0,
      },
    };

    return threat;
  }

  private analyzeNetworkBehavior(networks: NetworkBehavior[]): string[] {
    const indicators: string[] = [];

    // Detect SMB/RPC communications
    const smbConnections = networks.filter(
      (n) => n.destinationPort === 445 || n.destinationPort === 139
    );
    if (smbConnections.length > this.detectionThresholds.minNetworkConnections) {
      indicators.push('mass_smb_connections');
    }

    // Detect RPC communications
    const rpcConnections = networks.filter(
      (n) => n.destinationPort === 135 || n.destinationPort === 593
    );
    if (rpcConnections.length > 0) {
      indicators.push('rpc_communication');
    }

    // Detect WinRM connections
    const winrmConnections = networks.filter(
      (n) => n.destinationPort === 5985 || n.destinationPort === 5986
    );
    if (winrmConnections.length > 0) {
      indicators.push('winrm_communication');
    }

    // Detect pass-the-hash pattern (same source multiple destinations)
    const uniqueDests = new Set(networks.map((n) => n.destinationIp));
    if (uniqueDests.size > this.detectionThresholds.minNetworkConnections) {
      indicators.push('pass_the_hash_pattern');
    }

    // Detect network scanning
    const portCounts: Record<number, number> = {};
    for (const net of networks) {
      portCounts[net.destinationPort] =
        (portCounts[net.destinationPort] || 0) + 1;
    }
    const uniquePorts = Object.keys(portCounts).length;
    if (uniquePorts > 5) {
      indicators.push('network_scanning');
    }

    // Check for persistence mechanisms
    const persistenceConnections = networks.filter((n) =>
      [49152, 49153, 49154, 49155].includes(n.destinationPort)
    );
    if (persistenceConnections.length > 0) {
      indicators.push('dynamic_port_communication');
    }

    return indicators;
  }

  private analyzeCredentialActivity(
    credentials: CredentialActivity[]
  ): string[] {
    const indicators: string[] = [];

    // Detect credential theft
    if (credentials.length >= this.detectionThresholds.minCredentialAttempts) {
      indicators.push('credential_theft');
    }

    // Detect failed authentication attempts
    const failedAttempts = credentials.filter((c) => !c.success);
    if (failedAttempts.length > 0 && failedAttempts.length >= credentials.length * 0.5) {
      indicators.push('failed_authentication_attempts');
    }

    // Detect hash/ticket passing
    const hashCredentials = credentials.filter(
      (c) => c.credentialType === 'Hash' || c.credentialType === 'Kerberos'
    );
    if (hashCredentials.length > 0) {
      if (hashCredentials.some((c) => c.credentialType === 'Hash')) {
        indicators.push('pass_the_hash_detected');
      }
      if (hashCredentials.some((c) => c.credentialType === 'Kerberos')) {
        indicators.push('pass_the_ticket_detected');
      }
    }

    // Detect credential spraying
    const uniqueTargets = new Set(credentials.map((c) => c.targetHost)).size;
    if (uniqueTargets > 3) {
      indicators.push('credential_spraying');
    }

    // Detect privileged credential usage
    if (
      credentials.some(
        (c) =>
          c.credentialType === 'Plain' || c.credentialType === 'Hash'
      )
    ) {
      indicators.push('privileged_credential_usage');
    }

    return indicators;
  }

  private analyzeShareEnumeration(
    shares: ShareEnumeration[]
  ): string[] {
    const indicators: string[] = [];

    // Detect share enumeration
    if (shares.length >= this.detectionThresholds.minShareEnumerations) {
      indicators.push('share_enumeration');
    }

    // Detect access to sensitive shares
    const sensitiveShares = ['admin$', 'c$', 'ipc$', 'print$'];
    const suspiciousShares = shares.filter((s) =>
      s.sharesEnumerated.some((sh) =>
        sensitiveShares.includes(sh.toLowerCase())
      )
    );
    if (suspiciousShares.length > 0) {
      indicators.push('sensitive_share_access');
    }

    // Detect mass enumeration
    const totalShares = shares.reduce(
      (sum, s) => sum + s.sharesEnumerated.length,
      0
    );
    if (totalShares > 10) {
      indicators.push('mass_share_enumeration');
    }

    return indicators;
  }

  private recordNetworkActivity(
    processId: number,
    networks: NetworkBehavior[]
  ): void {
    if (!this.networkActivityLog.has(processId)) {
      this.networkActivityLog.set(processId, []);
    }
    this.networkActivityLog.get(processId)!.push(...networks);
  }

  private recordCredentialActivity(
    processId: number,
    credentials: CredentialActivity[]
  ): void {
    if (!this.credentialActivityLog.has(processId)) {
      this.credentialActivityLog.set(processId, []);
    }
    this.credentialActivityLog.get(processId)!.push(...credentials);
  }

  private recordShareEnumeration(
    processId: number,
    shares: ShareEnumeration[]
  ): void {
    if (!this.shareEnumerationLog.has(processId)) {
      this.shareEnumerationLog.set(processId, []);
    }
    this.shareEnumerationLog.get(processId)!.push(...shares);
  }

  getNetworkActivity(processId: number): NetworkBehavior[] {
    return this.networkActivityLog.get(processId) || [];
  }

  getCredentialActivity(processId: number): CredentialActivity[] {
    return this.credentialActivityLog.get(processId) || [];
  }

  getShareEnumeration(processId: number): ShareEnumeration[] {
    return this.shareEnumerationLog.get(processId) || [];
  }
}

export default LateralMovementBlocker;
