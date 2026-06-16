// Threat Intelligence Utilities

import { IOC } from './types';

/**
 * Validate IOC type and format
 */
export function validateIOC(ioc: IOC): boolean {
  if (!ioc.id || !ioc.type || !ioc.value || !ioc.source) {
    return false;
  }

  if (ioc.confidence < 0 || ioc.confidence > 100) {
    return false;
  }

  if (ioc.firstSeen > ioc.lastSeen) {
    return false;
  }

  return true;
}

/**
 * Detect IOC type from value
 */
export function detectIOCType(value: string): IOC['type'] {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    const parts = value.split('.');
    if (parts.every((p) => parseInt(p) <= 255)) {
      return 'ip';
    }
  }

  // IPv6
  if (/^([a-fA-F0-9]{0,4}:){1,7}[a-fA-F0-9]{0,4}$/.test(value)) {
    return 'ip';
  }

  // Hash (MD5, SHA1, SHA256)
  if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(value)) {
    return 'hash';
  }

  // URL
  if (/^https?:\/\//.test(value)) {
    return 'url';
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email';
  }

  // Domain (fallback)
  if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(value)) {
    return 'domain';
  }

  // Default
  return 'domain';
}

/**
 * Generate IOC ID from type and value
 */
export function generateIOCId(type: IOC['type'], value: string, source: string): string {
  const combined = `${type}:${value}:${source}`;
  const hash = Buffer.from(combined).toString('base64').substring(0, 16);
  return `ioc:${hash}:${Date.now()}`;
}

/**
 * Calculate risk score from multiple factors
 */
export function calculateRiskScore(
  confidence: number,
  sources: number,
  correlations: number,
  isRecent: boolean = false
): number {
  let score = confidence * 0.4; // 40% confidence

  // Source diversity bonus
  score += Math.min(sources * 10, 30); // Up to 30% for multiple sources

  // Correlation bonus
  score += Math.min(correlations * 5, 20); // Up to 20% for correlations

  // Recency bonus
  if (isRecent) {
    score += 10;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Determine threat level from risk score
 */
export function getThreatLevel(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Extract host from IOC
 */
export function extractHost(ioc: IOC): string | null {
  if (ioc.type === 'url') {
    return extractDomain(ioc.value);
  }

  if (ioc.type === 'domain') {
    return ioc.value;
  }

  return null;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleString();
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Normalize string for comparison
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if IOC is recent (within X days)
 */
export function isRecent(date: Date, days: number = 7): boolean {
  const dayMs = days * 24 * 60 * 60 * 1000;
  return Date.now() - date.getTime() < dayMs;
}

/**
 * Deduplicate IOCs
 */
export function deduplicateIOCs(iocs: IOC[]): IOC[] {
  const seen = new Set<string>();
  return iocs.filter((ioc) => {
    const key = `${ioc.type}:${ioc.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Merge IOC data
 */
export function mergeIOCs(ioc1: IOC, ioc2: IOC): IOC {
  return {
    id: ioc1.id,
    type: ioc1.type,
    value: ioc1.value,
    source: `${ioc1.source},${ioc2.source}`,
    confidence: Math.max(ioc1.confidence, ioc2.confidence),
    firstSeen: ioc1.firstSeen < ioc2.firstSeen ? ioc1.firstSeen : ioc2.firstSeen,
    lastSeen: ioc1.lastSeen > ioc2.lastSeen ? ioc1.lastSeen : ioc2.lastSeen,
    tags: Array.from(new Set([...ioc1.tags, ...ioc2.tags])),
    context: { ...ioc1.context, ...ioc2.context },
  };
}

/**
 * Format IOC for display
 */
export function formatIOC(ioc: IOC): string {
  return `[${ioc.type.toUpperCase()}] ${ioc.value} (${ioc.source}, ${ioc.confidence}%)`;
}

/**
 * Get IOC severity color
 */
export function getIOCColor(confidence: number): string {
  if (confidence >= 80) return '#dc2626'; // red
  if (confidence >= 60) return '#f59e0b'; // amber
  if (confidence >= 40) return '#eab308'; // yellow
  return '#22c55e'; // green
}
