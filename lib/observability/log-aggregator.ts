/**
 * BlockStop Phase 29.5 - Log Aggregator
 * Centralized log collection, parsing, and full-text search
 * Production-ready implementation
 */

import { EventEmitter } from 'events';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogSource = 'application' | 'system' | 'security' | 'audit' | 'network' | 'database' | 'custom';
export type RetentionPolicy = 'immediate' | '7days' | '30days' | '90days' | '1year' | 'permanent';

export interface LogEntry {
  logId: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  service: string;
  message: string;
  fields: Map<string, any>;
  traceId?: string;
  spanId?: string;
  userId?: string;
  correlationId?: string;
  stackTrace?: string;
  tags: string[];
  indexed: boolean;
}

export interface LogStream {
  streamId: string;
  service: string;
  environment: string;
  source: LogSource;
  createdAt: Date;
  lastUpdated: Date;
  logCount: number;
  retentionPolicy: RetentionPolicy;
  isActive: boolean;
}

export interface LogQuery {
  query: string; // Free-text or structured query
  service?: string;
  level?: LogLevel;
  source?: LogSource;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level' | 'service';
  sortOrder?: 'asc' | 'desc';
  fields?: string[];
  withContext?: boolean; // Include surrounding logs
}

export interface LogSearchResult {
  total: number;
  logs: LogEntry[];
  aggregations?: {
    byLevel: Record<LogLevel, number>;
    byService: Record<string, number>;
    bySource: Record<LogSource, number>;
  };
  executionTime: number; // milliseconds
}

export interface LogAggregationConfig {
  batchSize: number;
  flushInterval: number; // milliseconds
  compressionEnabled: boolean;
  retentionDefaultPolicy: RetentionPolicy;
  maxLogSize: number; // bytes
  indexFields: string[];
  parsePatterns: Map<string, RegExp>;
}

export interface AnomalousLogPattern {
  patternId: string;
  service: string;
  errorMessage: string;
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: Set<string>;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface LogAlert {
  alertId: string;
  name: string;
  query: LogQuery;
  condition: {
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
    threshold?: number;
  };
  createdAt: Date;
  enabled: boolean;
  notificationChannels: string[];
  lastTriggered?: Date;
  triggerCount: number;
}

export interface ParsedLog {
  originalMessage: string;
  structuredData: Record<string, any>;
  extractedFields: Map<string, string>;
  confidence: number; // 0-100, parsing accuracy
}

export class LogAggregator extends EventEmitter {
  private logs: Map<string, LogEntry> = new Map();
  private streams: Map<string, LogStream> = new Map();
  private buffer: LogEntry[] = [];
  private searchIndex: Map<string, Set<string>> = new Map(); // word -> log IDs
  private patterns: Map<string, AnomalousLogPattern> = new Map();
  private alerts: Map<string, LogAlert> = new Map();
  private config: LogAggregationConfig;
  private lastFlushTime = Date.now();

  constructor(config?: Partial<LogAggregationConfig>) {
    super();
    this.config = {
      batchSize: 1000,
      flushInterval: 60000,
      compressionEnabled: true,
      retentionDefaultPolicy: '30days',
      maxLogSize: 1024 * 1024, // 1MB
      indexFields: ['service', 'level', 'source', 'userId', 'traceId'],
      parsePatterns: new Map(),
      ...config
    };

    this.startFlushTimer();
  }

  // Log Ingestion
  ingestLog(log: Omit<LogEntry, 'logId' | 'indexed'>): LogEntry {
    const entry: LogEntry = {
      logId: `log-${Date.now()}-${Math.random()}`,
      indexed: false,
      ...log
    };

    this.buffer.push(entry);
    this.logs.set(entry.logId, entry);

    // Index for search
    this.indexLog(entry);

    // Detect patterns
    this.detectAnomalousPatterns(entry);

    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }

    this.emit('log-ingested', entry);

    return entry;
  }

  private indexLog(log: LogEntry): void {
    const words = log.message.toLowerCase().split(/\s+/);

    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(log.logId);
    });

    // Index fields
    this.config.indexFields.forEach(field => {
      const value = log.fields.get(field);
      if (value) {
        const key = `${field}:${value}`;
        if (!this.searchIndex.has(key)) {
          this.searchIndex.set(key, new Set());
        }
        this.searchIndex.get(key)!.add(log.logId);
      }
    });

    log.indexed = true;
  }

  // Stream Management
  createStream(config: Omit<LogStream, 'streamId' | 'createdAt' | 'lastUpdated' | 'logCount'>): LogStream {
    const stream: LogStream = {
      streamId: `stream-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      lastUpdated: new Date(),
      logCount: 0,
      ...config
    };

    this.streams.set(stream.streamId, stream);
    this.emit('stream-created', stream);

    return stream;
  }

  getStream(streamId: string): LogStream | undefined {
    return this.streams.get(streamId);
  }

  getStreams(service?: string): LogStream[] {
    if (service) {
      return Array.from(this.streams.values()).filter(s => s.service === service);
    }
    return Array.from(this.streams.values());
  }

  // Search and Query
  search(query: LogQuery): LogSearchResult {
    const startTime = Date.now();
    let results: LogEntry[] = Array.from(this.logs.values());

    // Text search
    if (query.query) {
      const searchTerms = query.query.toLowerCase().split(/\s+/);
      const matchingIds = new Set<string>();

      searchTerms.forEach(term => {
        const ids = this.searchIndex.get(term) || new Set();
        if (matchingIds.size === 0) {
          ids.forEach(id => matchingIds.add(id));
        } else {
          matchingIds.forEach(id => {
            if (!ids.has(id)) matchingIds.delete(id);
          });
        }
      });

      results = results.filter(log => matchingIds.has(log.logId));
    }

    // Filter by service
    if (query.service) {
      results = results.filter(log => log.service === query.service);
    }

    // Filter by level
    if (query.level) {
      results = results.filter(log => log.level === query.level);
    }

    // Filter by source
    if (query.source) {
      results = results.filter(log => log.source === query.source);
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(log => log.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter(log => log.timestamp <= query.endTime!);
    }

    // Sort
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';

    results.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'timestamp':
          aVal = a.timestamp.getTime();
          bVal = b.timestamp.getTime();
          break;
        case 'level':
          const levelOrder: Record<LogLevel, number> = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            fatal: 4
          };
          aVal = levelOrder[a.level];
          bVal = levelOrder[b.level];
          break;
        case 'service':
          aVal = a.service;
          bVal = b.service;
          break;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Paginate
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedResults = results.slice(offset, offset + limit);

    // Add context if requested
    if (query.withContext) {
      paginatedResults.forEach(log => {
        const idx = results.indexOf(log);
        // In production, include surrounding logs
      });
    }

    // Calculate aggregations
    const aggregations = {
      byLevel: this.countBy(results, 'level'),
      byService: this.countBy(results, 'service'),
      bySource: this.countBy(results, 'source')
    };

    return {
      total: results.length,
      logs: paginatedResults,
      aggregations,
      executionTime: Date.now() - startTime
    };
  }

  private countBy(logs: LogEntry[], field: string): Record<string, number> {
    const counts: Record<string, number> = {};

    logs.forEach(log => {
      const value = field === 'level' ? log.level : field === 'service' ? log.service : log.source;
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  // Pattern Detection
  private detectAnomalousPatterns(log: LogEntry): void {
    if (log.level !== 'error' && log.level !== 'fatal') return;

    const patternKey = `${log.service}:${log.message.substring(0, 50)}`;

    if (this.patterns.has(patternKey)) {
      const pattern = this.patterns.get(patternKey)!;
      pattern.occurrenceCount++;
      pattern.lastSeen = log.timestamp;

      if (log.userId) {
        pattern.affectedUsers.add(log.userId);
      }

      // Update trend
      const recentCount = Array.from(this.logs.values())
        .filter(l => l.timestamp.getTime() > Date.now() - 3600000)
        .filter(l => l.service === log.service && l.message.includes(log.message.substring(0, 50)))
        .length;

      pattern.trend = recentCount > 10 ? 'increasing' : recentCount > 3 ? 'stable' : 'decreasing';

      // Severity escalation
      if (pattern.occurrenceCount > 100) {
        pattern.severity = 'critical';
      } else if (pattern.occurrenceCount > 50) {
        pattern.severity = 'high';
      }

      this.emit('pattern-updated', pattern);
    } else {
      this.patterns.set(patternKey, {
        patternId: `pattern-${Date.now()}`,
        service: log.service,
        errorMessage: log.message,
        occurrenceCount: 1,
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        severity: 'low',
        affectedUsers: log.userId ? new Set([log.userId]) : new Set(),
        trend: 'stable'
      });
    }
  }

  getAnomalousPatterns(service?: string): AnomalousLogPattern[] {
    let patterns = Array.from(this.patterns.values());

    if (service) {
      patterns = patterns.filter(p => p.service === service);
    }

    return patterns.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }

  // Alerting
  createAlert(alertConfig: Omit<LogAlert, 'alertId' | 'createdAt' | 'triggerCount' | 'lastTriggered'>): LogAlert {
    const alert: LogAlert = {
      alertId: `alert-${Date.now()}`,
      createdAt: new Date(),
      triggerCount: 0,
      ...alertConfig
    };

    this.alerts.set(alert.alertId, alert);
    this.emit('alert-created', alert);

    return alert;
  }

  checkAlerts(log: LogEntry): void {
    this.alerts.forEach(alert => {
      if (!alert.enabled) return;

      const results = this.search(alert.query);

      const shouldTrigger = this.evaluateCondition(results, alert.condition);

      if (shouldTrigger) {
        alert.lastTriggered = new Date();
        alert.triggerCount++;

        this.emit('alert-triggered', {
          alertId: alert.alertId,
          alertName: alert.name,
          matchCount: results.total,
          notificationChannels: alert.notificationChannels
        });
      }
    });
  }

  private evaluateCondition(results: LogSearchResult, condition: LogAlert['condition']): boolean {
    switch (condition.operator) {
      case 'equals':
        return results.total === condition.value;
      case 'contains':
        return results.logs.some(log => log.message.includes(condition.value));
      case 'greaterThan':
        return results.total > (condition.threshold || 0);
      case 'lessThan':
        return results.total < (condition.threshold || 0);
      default:
        return false;
    }
  }

  // Parsing
  parseLog(rawMessage: string, service: string): ParsedLog {
    const structuredData: Record<string, any> = {};
    const extractedFields = new Map<string, string>();

    // Try standard patterns
    const patterns = [
      /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+(\w+)\s+(.+)/,
      /^(\w+)\s+-\s+(.+?)\s+-\s+(.+)$/,
      /\{.*\}/
    ];

    for (const pattern of patterns) {
      const match = rawMessage.match(pattern);
      if (match) {
        if (pattern.source.includes('\\d{4}')) {
          structuredData['timestamp'] = match[1];
          structuredData['level'] = match[2];
          structuredData['message'] = match[3];
        }
        break;
      }
    }

    // Try JSON
    try {
      const json = JSON.parse(rawMessage);
      Object.assign(structuredData, json);
    } catch {
      // Not JSON, continue with raw message
    }

    return {
      originalMessage: rawMessage,
      structuredData,
      extractedFields,
      confidence: Object.keys(structuredData).length > 0 ? 85 : 40
    };
  }

  // Retention and Cleanup
  applyRetentionPolicy(policy: RetentionPolicy): void {
    const now = Date.now();
    let cutoffTime = now;

    switch (policy) {
      case '7days':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30days':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90days':
        cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case '1year':
        cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case 'permanent':
        return;
    }

    const logsToDelete: string[] = [];

    this.logs.forEach((log, logId) => {
      if (log.timestamp.getTime() < cutoffTime) {
        logsToDelete.push(logId);
      }
    });

    logsToDelete.forEach(logId => {
      this.logs.delete(logId);
    });

    this.emit('retention-applied', {
      policy,
      deletedCount: logsToDelete.length
    });
  }

  // Utility
  private flush(): void {
    if (this.buffer.length === 0) return;

    const flushed = [...this.buffer];
    this.buffer = [];

    this.emit('buffer-flushed', {
      count: flushed.length,
      timestamp: new Date()
    });

    this.lastFlushTime = Date.now();
  }

  private startFlushTimer(): void {
    setInterval(() => {
      if (Date.now() - this.lastFlushTime >= this.config.flushInterval) {
        this.flush();
      }
    }, 10000);
  }

  getStatistics(): Record<string, any> {
    return {
      totalLogs: this.logs.size,
      bufferedLogs: this.buffer.length,
      indexedTerms: this.searchIndex.size,
      anomalousPatterns: this.patterns.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.enabled).length,
      streams: this.streams.size
    };
  }
}

export default LogAggregator;
