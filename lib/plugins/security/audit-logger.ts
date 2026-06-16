/**
 * Audit Logger
 * Comprehensive logging for plugin activities and security events
 */

export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SECURITY = 'security',
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  level: AuditLevel;
  pluginId: string;
  action: string;
  resource?: string;
  details?: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  result: 'success' | 'failure';
  error?: string;
}

export interface AuditFilter {
  pluginId?: string;
  action?: string;
  level?: AuditLevel;
  result?: 'success' | 'failure';
  from?: Date;
  to?: Date;
  limit?: number;
}

export class AuditLogger {
  private logs: AuditEntry[] = [];
  private maxLogs = 10000;
  private listeners: Array<(entry: AuditEntry) => void> = [];

  public log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): string {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const auditEntry: AuditEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };

    this.logs.push(auditEntry);

    // Keep logs size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(auditEntry);
      } catch (error) {
        console.error('Error in audit log listener:', error);
      }
    });

    return id;
  }

  public logPluginLoad(
    pluginId: string,
    result: 'success' | 'failure',
    error?: string
  ): string {
    return this.log({
      level: result === 'success' ? AuditLevel.INFO : AuditLevel.ERROR,
      pluginId,
      action: 'plugin_load',
      result,
      error,
      details: {
        event: 'plugin_load',
        result,
      },
    });
  }

  public logPluginEnable(
    pluginId: string,
    userId?: string,
    result: 'success' | 'failure' = 'success'
  ): string {
    return this.log({
      level: AuditLevel.INFO,
      pluginId,
      action: 'plugin_enable',
      userId,
      result,
      details: {
        event: 'plugin_enable',
      },
    });
  }

  public logPluginDisable(
    pluginId: string,
    userId?: string,
    result: 'success' | 'failure' = 'success'
  ): string {
    return this.log({
      level: AuditLevel.INFO,
      pluginId,
      action: 'plugin_disable',
      userId,
      result,
      details: {
        event: 'plugin_disable',
      },
    });
  }

  public logPluginUninstall(
    pluginId: string,
    userId?: string,
    result: 'success' | 'failure' = 'success'
  ): string {
    return this.log({
      level: AuditLevel.WARNING,
      pluginId,
      action: 'plugin_uninstall',
      userId,
      result,
      details: {
        event: 'plugin_uninstall',
      },
    });
  }

  public logPermissionRequest(
    pluginId: string,
    permissions: string[],
    approved: boolean,
    userId?: string
  ): string {
    return this.log({
      level: AuditLevel.SECURITY,
      pluginId,
      action: 'permission_request',
      userId,
      result: approved ? 'success' : 'failure',
      details: {
        permissions,
        approved,
      },
    });
  }

  public logPermissionDenied(
    pluginId: string,
    resource: string,
    action: string,
    reason?: string
  ): string {
    return this.log({
      level: AuditLevel.SECURITY,
      pluginId,
      action: 'permission_denied',
      resource,
      result: 'failure',
      details: {
        resource,
        action,
        reason,
      },
      error: reason,
    });
  }

  public logDataAccess(
    pluginId: string,
    dataType: string,
    operation: 'read' | 'write' | 'delete',
    result: 'success' | 'failure' = 'success'
  ): string {
    return this.log({
      level: AuditLevel.INFO,
      pluginId,
      action: `data_${operation}`,
      resource: dataType,
      result,
      details: {
        dataType,
        operation,
      },
    });
  }

  public logSecurityEvent(
    pluginId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, unknown>
  ): string {
    return this.log({
      level: AuditLevel.SECURITY,
      pluginId,
      action: eventType,
      result: 'failure',
      details: {
        severity,
        ...details,
      },
    });
  }

  public logError(
    pluginId: string,
    error: Error | string,
    context?: Record<string, unknown>
  ): string {
    return this.log({
      level: AuditLevel.ERROR,
      pluginId,
      action: 'error',
      result: 'failure',
      error: error instanceof Error ? error.message : error,
      details: context,
    });
  }

  public query(filter: AuditFilter): AuditEntry[] {
    let results = this.logs;

    if (filter.pluginId) {
      results = results.filter(log => log.pluginId === filter.pluginId);
    }

    if (filter.action) {
      results = results.filter(log => log.action === filter.action);
    }

    if (filter.level) {
      results = results.filter(log => log.level === filter.level);
    }

    if (filter.result) {
      results = results.filter(log => log.result === filter.result);
    }

    if (filter.from) {
      results = results.filter(log => log.timestamp >= filter.from!);
    }

    if (filter.to) {
      results = results.filter(log => log.timestamp <= filter.to!);
    }

    const limit = filter.limit || 100;
    return results.slice(-limit);
  }

  public getPluginHistory(pluginId: string, limit: number = 50): AuditEntry[] {
    return this.logs
      .filter(log => log.pluginId === pluginId)
      .slice(-limit);
  }

  public getSecurityEvents(limit: number = 100): AuditEntry[] {
    return this.logs
      .filter(log => log.level === AuditLevel.SECURITY)
      .slice(-limit);
  }

  public getErrors(pluginId?: string, limit: number = 50): AuditEntry[] {
    let results = this.logs.filter(
      log => log.level === AuditLevel.ERROR || log.result === 'failure'
    );

    if (pluginId) {
      results = results.filter(log => log.pluginId === pluginId);
    }

    return results.slice(-limit);
  }

  public getStatistics(): {
    totalLogs: number;
    byLevel: Record<string, number>;
    byResult: Record<string, number>;
    byAction: Record<string, number>;
    securityEvents: number;
    errors: number;
  } {
    const stats = {
      totalLogs: this.logs.length,
      byLevel: {} as Record<string, number>,
      byResult: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
      securityEvents: 0,
      errors: 0,
    };

    for (const log of this.logs) {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      if (log.level === AuditLevel.SECURITY) {
        stats.securityEvents++;
      }

      if (log.result === 'failure') {
        stats.errors++;
      }
    }

    return stats;
  }

  public export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Timestamp',
      'Level',
      'Plugin ID',
      'Action',
      'Resource',
      'Result',
      'Error',
    ];
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.level,
      log.pluginId,
      log.action,
      log.resource || '',
      log.result,
      log.error || '',
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  public clear(): void {
    this.logs = [];
  }

  public subscribe(listener: (entry: AuditEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getLogs(): AuditEntry[] {
    return [...this.logs];
  }
}

export class AuditLoggerBuilder {
  private maxLogs = 10000;

  public setMaxLogs(max: number): this {
    this.maxLogs = max;
    return this;
  }

  public build(): AuditLogger {
    const logger = new AuditLogger();
    // Note: maxLogs is set during construction, would need to be exposed if needed
    return logger;
  }
}
