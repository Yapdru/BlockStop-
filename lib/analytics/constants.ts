export const RISK_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const COMPLIANCE_FRAMEWORKS = {
  ISO27001: 'iso-27001',
  SOC2: 'soc2',
  PCI_DSS: 'pci-dss',
  HIPAA: 'hipaa',
  GDPR: 'gdpr',
  NIST: 'nist',
} as const;

export const INSIDER_THREAT_TYPES = {
  DATA_EXFILTRATION: 'data-exfiltration',
  PRIVILEGE_ABUSE: 'privilege-abuse',
  SABOTAGE: 'sabotage',
  ESPIONAGE: 'espionage',
} as const;

export const BEHAVIOR_ANOMALY_TYPES = {
  UNUSUAL_TIME: 'unusual-time',
  UNUSUAL_LOCATION: 'unusual-location',
  UNUSUAL_VOLUME: 'unusual-volume',
  UNUSUAL_ASSET: 'unusual-asset',
} as const;

export const ASSET_TYPES = {
  SERVER: 'server',
  DATABASE: 'database',
  APPLICATION: 'application',
  ENDPOINT: 'endpoint',
  NETWORK: 'network',
  STORAGE: 'storage',
} as const;

export const EXPOSURE_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const COMPLIANCE_STATUS = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non-compliant',
  IN_PROGRESS: 'in-progress',
} as const;

export const RISK_THRESHOLDS = {
  CRITICAL: 85,
  HIGH: 70,
  MEDIUM: 50,
  LOW: 30,
} as const;

export const SCORING_WEIGHTS = {
  VULNERABILITY: 0.3,
  EXPOSURE: 0.25,
  THREAT_ACTIVITY: 0.25,
  COMPLIANCE: 0.2,
} as const;

export const INSIDER_THREAT_THRESHOLDS = {
  CRITICAL: 0.9,
  HIGH: 0.7,
  MEDIUM: 0.5,
  LOW: 0.3,
} as const;

export const DEFAULT_RETENTION_DAYS = 90;
export const ANALYSIS_WINDOW_DAYS = 30;
export const BEHAVIOR_BASELINE_DAYS = 14;
