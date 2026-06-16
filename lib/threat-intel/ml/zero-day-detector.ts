// Zero-Day Detector - Heuristic-based detection of previously unknown threats

import { IOC, ZeroDayIndicator } from '../types';
import { cacheManager } from '../cache-manager';

export class ZeroDayDetector {
  private suspiciousPatterns: RegExp[] = [];
  private exploitPatterns: RegExp[] = [];

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Suspicious behavior patterns
    this.suspiciousPatterns = [
      // Shellcode indicators
      /\\x[0-9a-f]{2}[\s\\x]/gi,
      // Process injection
      /VirtualAllocEx|WriteProcessMemory|CreateRemoteThread/gi,
      // Registry persistence
      /HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run/gi,
      // DLL injection
      /LoadLibrary|GetProcAddress/gi,
      // Process hollowing
      /CreateProcess|NtUnmapViewOfSection|WriteMemory/gi,
    ];

    // Known exploit patterns
    this.exploitPatterns = [
      // CVE references
      /CVE-\d{4}-\d{4,}/gi,
      // 0-day indicators
      /zero.?day|0.?day/gi,
      // Exploit kit names
      /exploit.?kit|EK|malware.?kit/gi,
    ];
  }

  async detectZeroDays(iocs: IOC[]): Promise<ZeroDayIndicator[]> {
    const indicators: ZeroDayIndicator[] = [];

    for (const ioc of iocs) {
      const score = this.calculateZeroDayRisk(ioc);
      if (score > 0.6) {
        const indicator = this.createZeroDayIndicator(ioc, score);
        indicators.push(indicator);
      }
    }

    return indicators;
  }

  calculateZeroDayRisk(ioc: IOC): number {
    let riskScore = 0;

    // Check for novelty indicators
    const isNew = this.isNewIndicator(ioc);
    if (isNew) riskScore += 30;

    // Check for sophisticated indicators
    const isSophisticated = this.isSophisticated(ioc);
    if (isSophisticated) riskScore += 25;

    // Check for low detection
    if (ioc.confidence < 70) {
      riskScore += 20; // Low confidence may indicate new threat
    }

    // Check for behavioral indicators
    const behavioralRisk = this.analyzeBehavioralIndicators(ioc);
    riskScore += behavioralRisk;

    // Check for exploit patterns
    if (this.hasExploitPatterns(ioc)) {
      riskScore += 15;
    }

    return Math.min(100, riskScore) / 100;
  }

  private isNewIndicator(ioc: IOC): boolean {
    const ageDays = (Date.now() - ioc.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays < 14; // Less than 2 weeks old
  }

  private isSophisticated(ioc: IOC): boolean {
    const sophisticationMarkers = [
      'apt',
      'advanced',
      'evasion',
      'obfuscation',
      'encryption',
      'polymorphic',
      'metamorphic',
    ];

    return sophisticationMarkers.some((marker) =>
      ioc.tags.some((tag) => tag.toLowerCase().includes(marker))
    );
  }

  private analyzeBehavioralIndicators(ioc: IOC): number {
    const behavioralTags = [
      'credential-theft',
      'persistence',
      'lateral-movement',
      'data-exfiltration',
      'c2-communication',
      'anti-analysis',
      'anti-vm',
      'anti-debug',
    ];

    const matchCount = ioc.tags.filter((tag) =>
      behavioralTags.some((bt) => tag.includes(bt))
    ).length;

    return Math.min(matchCount * 10, 30);
  }

  private hasExploitPatterns(ioc: IOC): boolean {
    if (!ioc.context) return false;

    const contextStr = JSON.stringify(ioc.context).toLowerCase();

    for (const pattern of this.exploitPatterns) {
      if (pattern.test(contextStr)) {
        return true;
      }
    }

    return false;
  }

  private createZeroDayIndicator(ioc: IOC, riskScore: number): ZeroDayIndicator {
    return {
      id: `zeroday:${ioc.id}:${Date.now()}`,
      pattern: this.extractPattern(ioc),
      riskScore: Math.round(riskScore * 100),
      indicators: [ioc],
      firstDetected: ioc.firstSeen,
      lastObserved: ioc.lastSeen,
      affectedSystems: this.inferAffectedSystems(ioc),
      exploitCode: this.extractPotentialExploitCode(ioc),
    };
  }

  private extractPattern(ioc: IOC): string {
    // Create a regex-like pattern from the IOC value
    if (ioc.type === 'url') {
      try {
        const url = new URL(ioc.value);
        return `https?://${url.hostname}${url.pathname}.*`;
      } catch {
        return ioc.value;
      }
    }

    // For domains/IPs, use wildcard matching
    if (ioc.type === 'domain' || ioc.type === 'ip') {
      return `.*${ioc.value}.*`;
    }

    return ioc.value;
  }

  private inferAffectedSystems(ioc: IOC): string[] {
    const systems: string[] = [];

    const osIndicators: Record<string, string[]> = {
      Windows: ['winapi', 'registry', 'dll', 'exe', 'powershell', 'wmic'],
      Linux: ['elf', 'bash', 'shell', 'sudo', 'root'],
      macOS: ['mach-o', 'dylib', 'plist', 'xpc'],
      'All Systems': ['script', 'web', 'http', 'ssl', 'tls'],
    };

    const context = ioc.context ? JSON.stringify(ioc.context).toLowerCase() : '';
    const tags = ioc.tags.join(' ').toLowerCase();

    for (const [os, markers] of Object.entries(osIndicators)) {
      if (markers.some((m) => context.includes(m) || tags.includes(m))) {
        systems.push(os);
      }
    }

    return systems.length > 0 ? systems : ['Unknown'];
  }

  private extractPotentialExploitCode(ioc: IOC): string | undefined {
    if (!ioc.context || typeof ioc.context !== 'object') {
      return undefined;
    }

    const contextStr = JSON.stringify(ioc.context);

    // Look for shellcode or exploit indicators
    const shellcodeMatch = contextStr.match(/(?:\\x[0-9a-f]{2}){10,}/i);
    if (shellcodeMatch) {
      return shellcodeMatch[0];
    }

    // Look for base64 encoded content
    const base64Match = contextStr.match(/(?:[A-Za-z0-9+/]{76}\n)*[A-Za-z0-9+/]{4,}/);
    if (base64Match) {
      return `[Base64] ${base64Match[0].substring(0, 50)}...`;
    }

    return undefined;
  }

  async analyzePayload(payload: string): Promise<{
    isZeroDay: boolean;
    riskScore: number;
    patterns: string[];
  }> {
    const cacheKey = `zeroday-analysis:${Buffer.from(payload).toString('base64').substring(0, 32)}`;
    const cached = cacheManager.get<unknown>(cacheKey);

    if (cached) {
      return cached as {
        isZeroDay: boolean;
        riskScore: number;
        patterns: string[];
      };
    }

    const patterns: string[] = [];
    let riskScore = 0;

    // Check suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(payload)) {
        patterns.push(pattern.source);
        riskScore += 15;
      }
    }

    // Check for obfuscation
    const obfuscationLevel = this.detectObfuscation(payload);
    riskScore += obfuscationLevel * 20;

    // Check for known evasion techniques
    const evasionPatterns = [
      'anti-vm',
      'anti-debug',
      'anti-analysis',
      'process-hollowing',
      'dll-injection',
    ];

    for (const technique of evasionPatterns) {
      if (payload.toLowerCase().includes(technique)) {
        patterns.push(technique);
        riskScore += 10;
      }
    }

    const result = {
      isZeroDay: riskScore > 50,
      riskScore: Math.min(100, riskScore),
      patterns,
    };

    cacheManager.set(cacheKey, result, 3600000); // 1 hour cache

    return result;
  }

  private detectObfuscation(payload: string): number {
    let score = 0;

    // High entropy indicates obfuscation
    const entropy = this.calculateEntropy(payload);
    if (entropy > 6) score += 0.5;

    // Hex encoding
    if (/\\x[0-9a-f]{2}/gi.test(payload)) score += 0.3;

    // Base64
    if (/[A-Za-z0-9+/]{20,}/.test(payload)) score += 0.2;

    // Unicode escapes
    if (/\\u[0-9a-f]{4}/gi.test(payload)) score += 0.2;

    return Math.min(score, 1);
  }

  private calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies: Record<string, number> = {};

    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
      const p = freq / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }
}

export const zeroDayDetector = new ZeroDayDetector();
