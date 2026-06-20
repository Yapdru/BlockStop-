import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class CollaborationUtils {
  static generateId(prefix?: string): string {
    const id = uuidv4();
    return prefix ? `${prefix}_${id}` : id;
  }

  static generateParticipantId(): string {
    return this.generateId('participant');
  }

  static generateMessageId(): string {
    return this.generateId('msg');
  }

  static generateEvidenceId(): string {
    return this.generateId('evidence');
  }

  static generateAnnotationId(): string {
    return this.generateId('annot');
  }

  static generateActivityId(): string {
    return this.generateId('activity');
  }

  static generateAuditLogId(): string {
    return this.generateId('audit');
  }

  static getTimestamp(): number {
    return Date.now();
  }

  static formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  static calculateHash(data: any): string {
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  static createVersionedValue(value: any, version: number): { value: any; version: number; hash: string } {
    return {
      value,
      version,
      hash: this.calculateHash(value),
    };
  }

  static compareVersions(v1: number, v2: number): number {
    if (v1 > v2) return 1;
    if (v1 < v2) return -1;
    return 0;
  }

  static mergeObjects(base: any, incoming: any): any {
    const merged = { ...base };
    Object.keys(incoming).forEach((key) => {
      if (typeof incoming[key] === 'object' && incoming[key] !== null && !Array.isArray(incoming[key])) {
        merged[key] = this.mergeObjects(merged[key] || {}, incoming[key]);
      } else {
        merged[key] = incoming[key];
      }
    });
    return merged;
  }

  static extractMentions(text: string): string[] {
    const regex = /@(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map((m) => m.substring(1)) : [];
  }

  static sanitizeHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static parseMarkdown(markdown: string): string {
    let html = markdown
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
    return html;
  }

  static calculateLatency(startTime: number, endTime: number): number {
    return endTime - startTime;
  }

  static isWithinLatencyThreshold(latency: number, threshold: number = 500): boolean {
    return latency <= threshold;
  }

  static getPriority(action: string): number {
    const priorityMap: Record<string, number> = {
      'evidence:added': 10,
      'annotation:added': 8,
      'message:sent': 5,
      'presence:update': 1,
      'activity:recorded': 3,
    };
    return priorityMap[action] || 5;
  }

  static getConflictSeverity(conflictCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (conflictCount >= 10) return 'critical';
    if (conflictCount >= 5) return 'high';
    if (conflictCount >= 2) return 'medium';
    return 'low';
  }

  static calculateChecksum(data: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  static cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  static getRelativeTime(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  static batchOperations<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
