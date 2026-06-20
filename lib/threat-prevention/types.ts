export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type ThreatAction = 'BLOCK' | 'ISOLATE' | 'QUARANTINE' | 'ALERT_ONLY' | 'ALLOW';
export type ThreatType =
  | 'EXPLOIT'
  | 'RANSOMWARE'
  | 'MALWARE'
  | 'LATERAL_MOVEMENT'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_EXFILTRATION'
  | 'C2_COMMUNICATION'
  | 'DDOS'
  | 'BEHAVIOR_ANOMALY'
  | 'BUFFER_OVERFLOW'
  | 'MEMORY_CORRUPTION';

export interface Threat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  timestamp: number;
  source: string;
  description: string;
  processId?: number;
  filePath?: string;
  networkInfo?: {
    srcIp: string;
    dstIp: string;
    srcPort: number;
    dstPort: number;
    protocol: string;
  };
  registryPath?: string;
  behaviorIndicators: string[];
  metadata?: Record<string, any>;
}

export interface BlockingPolicy {
  id: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  action: ThreatAction;
  enabled: boolean;
  conditions?: Record<string, any>;
  exceptions?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PreventionAction {
  type: ThreatAction;
  threatId: string;
  timestamp: number;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface BehaviorPattern {
  processId: number;
  pattern: string;
  confidence: number;
  timestamp: number;
  indicators: string[];
}

export interface WhitelistEntry {
  id: string;
  type: 'PROCESS' | 'FILE' | 'NETWORK' | 'HASH';
  value: string;
  reason: string;
  expiresAt?: number;
  enabled: boolean;
}

export interface QuarantineItem {
  id: string;
  originalPath: string;
  quarantinePath: string;
  threat: Threat;
  quarantinedAt: number;
  released: boolean;
  releasedAt?: number;
}

export interface PreventionMetrics {
  threatsDetected: number;
  threatsBlocked: number;
  threatsQuarantined: number;
  falsePositives: number;
  averageDetectionTime: number;
  lastUpdate: number;
}

export interface MonitoringEvent {
  eventId: string;
  type: string;
  timestamp: number;
  processId?: number;
  filePath?: string;
  registryPath?: string;
  networkInfo?: any;
  severity: ThreatSeverity;
  indicators: string[];
}

export interface PolicyDecision {
  threatId: string;
  action: ThreatAction;
  policyId: string;
  confidence: number;
  reasoning: string[];
}

export interface ThreatContext {
  threat: Threat;
  historicalData?: Threat[];
  systemState?: SystemState;
  policyContext?: PolicyDecision;
}

export interface SystemState {
  processCount: number;
  memoryUsage: number;
  cpuUsage: number;
  networkConnections: number;
  fileSystemActivity: number;
}

export interface ThreatClassification {
  threatId: string;
  classifiedType: ThreatType;
  confidence: number;
  alternatives: Array<{ type: ThreatType; confidence: number }>;
}
