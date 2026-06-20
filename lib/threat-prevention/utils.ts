import { Threat, ThreatSeverity, MonitoringEvent } from './types';
import { THREAT_SEVERITY_SCORES } from './constants';

export function generateThreatId(): string {
  return `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateThreatScore(
  severity: ThreatSeverity,
  indicators: number,
  confidence: number
): number {
  const severityScore = THREAT_SEVERITY_SCORES[severity] || 0;
  const indicatorBonus = Math.min(indicators * 5, 30);
  const confidenceMultiplier = confidence;
  return (severityScore + indicatorBonus) * confidenceMultiplier;
}

export function calculateConfidence(
  matchedRules: number,
  totalRules: number
): number {
  if (totalRules === 0) return 0;
  return Math.min((matchedRules / totalRules) * 1.2, 1.0);
}

export function shouldEscalate(
  previousThreat: Threat | null,
  currentThreat: Threat
): boolean {
  if (!previousThreat) return false;

  const previousScore = calculateThreatScore(
    previousThreat.severity,
    previousThreat.behaviorIndicators.length,
    0.8
  );
  const currentScore = calculateThreatScore(
    currentThreat.severity,
    currentThreat.behaviorIndicators.length,
    0.8
  );

  const timeDiff = currentThreat.timestamp - previousThreat.timestamp;
  const escalationWindow = 5 * 60 * 1000; // 5 minutes

  return (
    currentScore > previousScore &&
    timeDiff < escalationWindow &&
    previousThreat.type === currentThreat.type
  );
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase();
}

export function extractProcessName(path: string): string {
  const parts = path.split(/[\/\\]/);
  return parts[parts.length - 1] || '';
}

export function isKnownSuspiciousProcess(processName: string): boolean {
  const suspicious = [
    'cmd.exe',
    'powershell.exe',
    'psexec.exe',
    'whoami.exe',
    'net.exe',
    'tasklist.exe',
    'systeminfo.exe',
    'ipconfig.exe',
  ];
  return suspicious.some((p) => processName.toLowerCase().includes(p));
}

export function isReservedPort(port: number): boolean {
  return port < 1024;
}

export function calculateEntropy(data: string): number {
  const len = data.length;
  const frequencies: Record<string, number> = {};

  for (const char of data) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  for (const freq of Object.values(frequencies)) {
    const p = freq / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

export function detectAnomalies(
  baseline: number[],
  current: number,
  threshold: number = 2.0
): boolean {
  if (baseline.length === 0) return false;

  const mean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
  const variance =
    baseline.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    baseline.length;
  const stdDev = Math.sqrt(variance);

  const zScore = Math.abs((current - mean) / stdDev);
  return zScore > threshold;
}

export function sanitizePath(path: string): string {
  return path.replace(/[^\w\-./:\\]/g, '');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export function throttleEvent(
  lastEvent: number,
  throttleMs: number = 1000
): boolean {
  return Date.now() - lastEvent > throttleMs;
}

export function groupEventsByType(
  events: MonitoringEvent[]
): Map<string, MonitoringEvent[]> {
  const grouped = new Map<string, MonitoringEvent[]>();
  for (const event of events) {
    if (!grouped.has(event.type)) {
      grouped.set(event.type, []);
    }
    grouped.get(event.type)!.push(event);
  }
  return grouped;
}

export function calculateEventFrequency(
  events: MonitoringEvent[],
  windowMs: number
): number {
  const now = Date.now();
  const recent = events.filter((e) => now - e.timestamp < windowMs);
  return recent.length / (windowMs / 1000); // events per second
}
