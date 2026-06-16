/**
 * Log Parser - Multi-format log parsing engine
 */

export interface ParsedLog {
  timestamp: Date;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";
  source: string;
  message: string;
  fields: Record<string, unknown>;
  raw: string;
  hash?: string;
}

export class LogParser {
  private parsers: Map<string, (line: string) => ParsedLog | null> = new Map();

  constructor() {
    this.initializeParsers();
  }

  /**
   * Initialize format-specific parsers
   */
  private initializeParsers(): void {
    // JSON parser
    this.parsers.set("json", (line: string) => this.parseJSON(line));

    // Syslog parser
    this.parsers.set("syslog", (line: string) => this.parseSyslog(line));

    // Windows Event Log parser
    this.parsers.set("windows", (line: string) => this.parseWindowsEventLog(line));

    // Apache/Nginx parser
    this.parsers.set("httpd", (line: string) => this.parseHTTPLog(line));

    // CSV parser
    this.parsers.set("csv", (line: string) => this.parseCSV(line));
  }

  /**
   * Parse logs with format auto-detection
   */
  async parseLogs(content: string, format?: string): Promise<ParsedLog[]> {
    const lines = content.split("\n").filter((l) => l.trim());
    const logs: ParsedLog[] = [];

    for (const line of lines) {
      let parsed: ParsedLog | null = null;

      if (format && this.parsers.has(format)) {
        const parser = this.parsers.get(format);
        if (parser) {
          parsed = parser(line);
        }
      } else {
        // Try to auto-detect format
        parsed = this.autoDetectFormat(line);
      }

      if (parsed) {
        logs.push(parsed);
      }
    }

    return logs;
  }

  /**
   * Parse JSON logs
   */
  private parseJSON(line: string): ParsedLog | null {
    try {
      const obj = JSON.parse(line);

      return {
        timestamp: new Date(obj.timestamp || obj.time || new Date()),
        level: this.normalizeLevel(obj.level || obj.severity || "INFO"),
        source: obj.source || obj.logger || "unknown",
        message: obj.message || obj.msg || JSON.stringify(obj),
        fields: obj,
        raw: line,
        hash: this.hashLine(line),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse syslog format
   */
  private parseSyslog(line: string): ParsedLog | null {
    // Standard syslog format: <PRI>TIMESTAMP HOSTNAME TAG[PID]: MESSAGE
    const regex = /^([A-Za-z]+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+)(?:\[(\d+)\])?:\s*(.*)$/;
    const match = line.match(regex);

    if (!match) return null;

    const [, timestamp, hostname, tag, , message] = match;

    return {
      timestamp: new Date(timestamp),
      level: "INFO",
      source: `${hostname}:${tag}`,
      message,
      fields: { hostname, tag },
      raw: line,
      hash: this.hashLine(line),
    };
  }

  /**
   * Parse Windows Event Log
   */
  private parseWindowsEventLog(line: string): ParsedLog | null {
    // Windows Event Log XML format parsing
    try {
      if (!line.includes("<Event")) return null;

      const eventIdMatch = line.match(/<EventID>(\d+)<\/EventID>/);
      const levelMatch = line.match(/<Level>(\d+)<\/Level>/);
      const timestampMatch = line.match(/<TimeCreated SystemTime='([^']+)'/);
      const messageMatch = line.match(/<Data>([^<]+)<\/Data>/);

      const levelMap: Record<string, string> = {
        "1": "CRITICAL",
        "2": "ERROR",
        "3": "WARN",
        "4": "INFO",
        "5": "DEBUG",
      };

      return {
        timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(),
        level: levelMap[levelMatch?.[1] || "4"] as any,
        source: `Windows Event ${eventIdMatch?.[1] || "Unknown"}`,
        message: messageMatch?.[1] || "No message",
        fields: {
          eventId: eventIdMatch?.[1],
          level: levelMatch?.[1],
        },
        raw: line,
        hash: this.hashLine(line),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse HTTP access logs (Apache/Nginx)
   */
  private parseHTTPLog(line: string): ParsedLog | null {
    // Common log format: IP - - [TIMESTAMP] "METHOD PATH HTTP/VERSION" STATUS SIZE "REFERER" "USER-AGENT"
    const regex =
      /^(\S+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+(\S+)"\s+(\d+)\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"$/;
    const match = line.match(regex);

    if (!match) return null;

    const [, ip, timestamp, method, path, version, status, size, referer, ua] = match;

    return {
      timestamp: new Date(timestamp),
      level: parseInt(status) >= 400 ? "ERROR" : "INFO",
      source: `HTTP:${ip}`,
      message: `${method} ${path} ${status}`,
      fields: {
        ip,
        method,
        path,
        status: parseInt(status),
        size: parseInt(size) || 0,
        referer,
        userAgent: ua,
      },
      raw: line,
      hash: this.hashLine(line),
    };
  }

  /**
   * Parse CSV logs
   */
  private parseCSV(line: string): ParsedLog | null {
    const fields = this.parseCSVLine(line);
    if (fields.length === 0) return null;

    // Try to find timestamp and level fields
    let timestamp = new Date();
    let level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL" = "INFO";

    const fieldsObj: Record<string, unknown> = {};
    fields.forEach((field, index) => {
      fieldsObj[`field_${index}`] = field;
    });

    return {
      timestamp,
      level,
      source: "CSV",
      message: fields.join(" | "),
      fields: fieldsObj,
      raw: line,
      hash: this.hashLine(line),
    };
  }

  /**
   * Auto-detect log format
   */
  private autoDetectFormat(line: string): ParsedLog | null {
    // Try each parser
    for (const [, parser] of this.parsers) {
      const result = parser(line);
      if (result) return result;
    }

    return null;
  }

  /**
   * Normalize log level
   */
  private normalizeLevel(level: string): "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL" {
    const normalized = level.toUpperCase();
    if (
      normalized === "DEBUG" ||
      normalized === "INFO" ||
      normalized === "WARN" ||
      normalized === "ERROR" ||
      normalized === "CRITICAL"
    ) {
      return normalized;
    }

    if (normalized.includes("ERR") || normalized.includes("FATAL")) {
      return "ERROR";
    }
    if (normalized.includes("WARN")) {
      return "WARN";
    }

    return "INFO";
  }

  /**
   * Parse CSV line
   */
  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    if (current) {
      fields.push(current);
    }

    return fields;
  }

  /**
   * Hash a log line for deduplication
   */
  private hashLine(line: string): string {
    // Simple hash implementation
    let hash = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract fields from parsed logs
   */
  async extractFields(
    logs: ParsedLog[],
    fieldNames: string[]
  ): Promise<Array<Record<string, unknown>>> {
    return logs.map((log) => {
      const extracted: Record<string, unknown> = {
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
      };

      for (const fieldName of fieldNames) {
        extracted[fieldName] = log.fields[fieldName];
      }

      return extracted;
    });
  }
}

export default LogParser;
