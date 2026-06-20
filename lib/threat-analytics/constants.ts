export const THREAT_CATEGORIES = {
  MALWARE: 'malware',
  EXPLOIT: 'exploit',
  C2: 'c2',
  PERSISTENCE: 'persistence',
  EXFILTRATION: 'exfiltration',
  DEFENSE_EVASION: 'defense-evasion',
} as const;

export const ATTACK_PHASES = {
  RECONNAISSANCE: 'reconnaissance',
  EXPLOITATION: 'exploitation',
  LATERAL_MOVEMENT: 'lateral-movement',
  EXFILTRATION: 'exfiltration',
  IMPACT: 'impact',
} as const;

export const IOC_TYPES = {
  IP: 'ip',
  DOMAIN: 'domain',
  HASH: 'hash',
  URL: 'url',
  EMAIL: 'email',
  CERT: 'cert',
} as const;

export const SEVERITY_THRESHOLDS = {
  CRITICAL: 90,
  HIGH: 70,
  MEDIUM: 50,
  LOW: 30,
  INFO: 0,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  CERTAIN: 0.95,
  HIGH: 0.8,
  MODERATE: 0.6,
  LOW: 0.4,
  UNKNOWN: 0,
} as const;

export const LIFECYCLE_STAGES = {
  EMERGING: 'emerging',
  GROWING: 'growing',
  PEAK: 'peak',
  DECLINING: 'declining',
  DORMANT: 'dormant',
} as const;

export const MITRE_TACTICS = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-control',
  'exfiltration',
  'impact',
];

export const CORRELATION_WEIGHTS = {
  ACTOR_MATCH: 0.35,
  INDICATOR_MATCH: 0.3,
  TACTIC_MATCH: 0.2,
  TARGET_MATCH: 0.15,
} as const;

export const ATTRIBUTION_EVIDENCE_TYPES = {
  CAPABILITY: 'capability',
  INFRASTRUCTURE: 'infrastructure',
  MOTIVE: 'motive',
  ATTRIBUTION: 'attribution',
} as const;

export const ANOMALY_TYPES = {
  SPIKE: 'spike',
  DROP: 'drop',
  DEVIATION: 'deviation',
  PATTERN_BREAK: 'pattern-break',
  OUTLIER: 'outlier',
} as const;

export const DEFAULT_LOOK_BACK_DAYS = 30;
export const DEFAULT_FORECAST_DAYS = 7;
export const MIN_PATTERN_CONFIDENCE = 0.7;
export const MIN_CORRELATION_SCORE = 0.6;
export const ANOMALY_THRESHOLD_MULTIPLIER = 2.5;
