export const THREAT_SEVERITY_SCORES: Record<string, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
  INFO: 10,
};

export const DEFAULT_POLICIES = [
  {
    id: 'policy-exploit-default',
    threatType: 'EXPLOIT' as const,
    severity: 'CRITICAL' as const,
    action: 'BLOCK' as const,
    enabled: true,
  },
  {
    id: 'policy-ransomware-default',
    threatType: 'RANSOMWARE' as const,
    severity: 'CRITICAL' as const,
    action: 'ISOLATE' as const,
    enabled: true,
  },
  {
    id: 'policy-malware-default',
    threatType: 'MALWARE' as const,
    severity: 'CRITICAL' as const,
    action: 'QUARANTINE' as const,
    enabled: true,
  },
  {
    id: 'policy-lateral-movement-default',
    threatType: 'LATERAL_MOVEMENT' as const,
    severity: 'HIGH' as const,
    action: 'ISOLATE' as const,
    enabled: true,
  },
  {
    id: 'policy-privilege-escalation-default',
    threatType: 'PRIVILEGE_ESCALATION' as const,
    severity: 'HIGH' as const,
    action: 'BLOCK' as const,
    enabled: true,
  },
  {
    id: 'policy-data-exfiltration-default',
    threatType: 'DATA_EXFILTRATION' as const,
    severity: 'HIGH' as const,
    action: 'QUARANTINE' as const,
    enabled: true,
  },
  {
    id: 'policy-c2-default',
    threatType: 'C2_COMMUNICATION' as const,
    severity: 'HIGH' as const,
    action: 'BLOCK' as const,
    enabled: true,
  },
  {
    id: 'policy-ddos-default',
    threatType: 'DDOS' as const,
    severity: 'MEDIUM' as const,
    action: 'ALERT_ONLY' as const,
    enabled: true,
  },
];

export const SUSPICIOUS_PROCESSES = [
  'cmd.exe',
  'powershell.exe',
  'psexec.exe',
  'whoami.exe',
  'net.exe',
  'tasklist.exe',
];

export const DANGEROUS_REGISTRY_PATHS = [
  'HKLM\\Software\\Microsoft\\Windows\\Run',
  'HKCU\\Software\\Microsoft\\Windows\\Run',
  'HKLM\\System\\CurrentControlSet\\Services',
];

export const SUSPICIOUS_FILE_EXTENSIONS = [
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.scr',
  '.vbs',
  '.js',
  '.ps1',
];

export const RESERVED_PORTS = [
  22, 23, 25, 53, 69, 79, 110, 143, 161, 162, 389, 443, 445, 465, 514, 587,
  636, 993, 995, 3306, 5432, 6379, 27017, 27018, 27019, 28017,
];

export const QUARANTINE_ROOT = '/var/blockstop/quarantine';
export const LOG_ROOT = '/var/blockstop/logs';
export const WHITELIST_FILE = '/etc/blockstop/whitelist.json';
export const POLICY_FILE = '/etc/blockstop/policies.json';

export const BEHAVIOR_BASELINE_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days
export const BEHAVIOR_DETECTION_THRESHOLD = 0.75; // 75% confidence

export const MONITOR_UPDATE_INTERVAL = 1000; // 1 second
export const THREAT_RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

export const MAX_QUARANTINE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
export const MAX_LOG_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export const EXPLOIT_SIGNATURES = [
  'stack_overflow',
  'heap_overflow',
  'use_after_free',
  'integer_overflow',
  'format_string',
];

export const RANSOMWARE_INDICATORS = [
  'mass_file_encryption',
  'extension_change',
  'file_deletion',
  'shadow_copy_deletion',
  'boot_record_modification',
];

export const LATERAL_MOVEMENT_INDICATORS = [
  'credential_theft',
  'network_scanning',
  'remote_execution',
  'share_enumeration',
  'pass_the_hash',
];

export const DATA_EXFILTRATION_INDICATORS = [
  'large_volume_transfer',
  'unusual_destinations',
  'encrypted_connection',
  'external_device_access',
  'cloud_upload',
];
