/**
 * Plugin SDK Logger
 * Logging utilities for plugins
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  message: string;
  data?: unknown;
  error?: Error;
}

export interface LogHandler {
  (entry: LogEntry): void;
}

export class PluginLogger {
  private name: string;
  private level: LogLevel;
  private handlers: LogHandler[] = [];
  private history: LogEntry[] = [];
  private maxHistorySize: number = 1000;

  constructor(name: string, level: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.level = level;

    // Add default console handler
    this.addHandler(this.consoleHandler);
  }

  private consoleHandler = (entry: LogEntry): void => {
    const prefix = `[${this.name}]`;
    const timestamp = entry.timestamp.toISOString();

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, timestamp, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, timestamp, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, timestamp, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(
          prefix,
          timestamp,
          entry.message,
          entry.error || entry.data
        );
        break;
    }
  };

  private log(level: LogLevel, message: string, data?: unknown, error?: Error): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      message,
      data,
      error,
    };

    // Add to history
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    // Call handlers
    for (const handler of this.handlers) {
      try {
        handler(entry);
      } catch (error) {
        console.error('Error in log handler:', error);
      }
    }
  }

  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, error?: Error | unknown, data?: unknown): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, data, error);
    } else {
      this.log(LogLevel.ERROR, message, error || data);
    }
  }

  public addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  public removeHandler(handler: LogHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  public getHistory(limit?: number): LogEntry[] {
    return limit ? this.history.slice(-limit) : [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  public getHistoryByLevel(level: LogLevel): LogEntry[] {
    return this.history.filter(entry => entry.level === level);
  }

  public export(format: 'json' | 'csv' | 'text' = 'text'): string {
    if (format === 'json') {
      return JSON.stringify(this.history, null, 2);
    } else if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Message'];
      const rows = this.history.map(entry => [
        entry.timestamp.toISOString(),
        LogLevel[entry.level],
        entry.message,
      ]);
      return [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    } else {
      return this.history
        .map(entry => {
          const level = LogLevel[entry.level];
          const timestamp = entry.timestamp.toISOString();
          return `[${timestamp}] ${level}: ${entry.message}`;
        })
        .join('\n');
    }
  }

  public createChildLogger(name: string): PluginLogger {
    const childLogger = new PluginLogger(
      `${this.name}:${name}`,
      this.level
    );
    return childLogger;
  }

  public getStats(): {
    totalLogs: number;
    byLevel: Record<string, number>;
  } {
    const stats = {
      totalLogs: this.history.length,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
      },
    };

    for (const entry of this.history) {
      stats.byLevel[LogLevel[entry.level]]++;
    }

    return stats;
  }
}

export function createLogger(name: string, level?: LogLevel): PluginLogger {
  return new PluginLogger(name, level);
}

export function createChildLogger(parent: PluginLogger, name: string): PluginLogger {
  return parent.createChildLogger(name);
}
