/**
 * BlockStop CLI Utilities
 * Shared formatting and helper functions for CLI output
 */

export interface RiskLevel {
  score: number;
  label: string;
  color: string;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TableRow {
  [key: string]: string | number | boolean;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Format risk score with color and label
 */
export function formatRiskScore(score: number): { colored: string; label: string; severity: RiskLevel['severity'] } {
  let label = '';
  let colorKey: keyof typeof colors = 'reset';
  let severity: RiskLevel['severity'] = 'SAFE';

  if (score <= 10) {
    label = 'SAFE';
    colorKey = 'green';
    severity = 'SAFE';
  } else if (score <= 30) {
    label = 'LOW';
    colorKey = 'blue';
    severity = 'LOW';
  } else if (score <= 60) {
    label = 'MEDIUM';
    colorKey = 'yellow';
    severity = 'MEDIUM';
  } else if (score <= 85) {
    label = 'HIGH';
    colorKey = 'red';
    severity = 'HIGH';
  } else {
    label = 'CRITICAL';
    colorKey = 'red';
    severity = 'CRITICAL';
  }

  const colored = `${colors[colorKey]}${score}/100 [${label}]${colors.reset}`;
  return { colored, label, severity };
}

/**
 * Format data as table
 */
export function formatTable(data: TableRow[], headers?: string[]): string {
  if (data.length === 0) {
    return 'No data to display';
  }

  const allHeaders = headers || Object.keys(data[0]);
  const columnWidths = allHeaders.map(h => Math.max(h.length, 10));

  // Calculate widths based on content
  data.forEach(row => {
    allHeaders.forEach((header, idx) => {
      const value = String(row[header] || '');
      columnWidths[idx] = Math.max(columnWidths[idx], value.length);
    });
  });

  let output = '';

  // Header row
  const headerRow = allHeaders
    .map((h, idx) => h.padEnd(columnWidths[idx]))
    .join(' | ');
  output += `${colors.bright}${headerRow}${colors.reset}\n`;

  // Separator
  output += columnWidths.map(w => '-'.repeat(w + 2)).join('-') + '\n';

  // Data rows
  data.forEach(row => {
    const dataRow = allHeaders
      .map((h, idx) => String(row[h] || '').padEnd(columnWidths[idx]))
      .join(' | ');
    output += dataRow + '\n';
  });

  return output;
}

/**
 * Format data as JSON
 */
export function formatJSON(data: unknown, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Format data as CSV
 */
export function formatCSV(data: TableRow[], headers?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  const allHeaders = headers || Object.keys(data[0]);
  const headerRow = allHeaders.map(h => `"${h}"`).join(',');

  const dataRows = data.map(row =>
    allHeaders
      .map(h => {
        const value = row[h];
        const strValue = String(value || '');
        return `"${strValue.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Log message with color
 */
export function log(msg: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * Log error message
 */
export function logError(msg: string): void {
  console.error(`${colors.red}❌ Error: ${msg}${colors.reset}`);
}

/**
 * Log success message
 */
export function logSuccess(msg: string): void {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

/**
 * Log warning message
 */
export function logWarning(msg: string): void {
  console.log(`${colors.yellow}⚠️  Warning: ${msg}${colors.reset}`);
}

/**
 * Log info message
 */
export function logInfo(msg: string): void {
  console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);
}

/**
 * Log debug message
 */
export function logDebug(msg: string, verbose = false): void {
  if (verbose) {
    console.log(`${colors.dim}🐛 ${msg}${colors.reset}`);
  }
}

/**
 * Simple progress bar
 */
export function progressBar(current: number, total: number, width = 30): string {
  const percentage = Math.round((current / total) * 100);
  const filledWidth = Math.round((width * percentage) / 100);
  const emptyWidth = width - filledWidth;

  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);

  return `${filled}${empty} ${percentage}%`;
}

/**
 * Format threat detection result
 */
export function formatThreatResult(
  threatType: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  description: string
): string {
  const severityColor =
    severity === 'CRITICAL' ? 'red' : severity === 'HIGH' ? 'yellow' : severity === 'MEDIUM' ? 'blue' : 'cyan';

  return `${colors[severityColor]}[${severity}]${colors.reset} ${threatType}: ${description}`;
}

/**
 * Format detection metadata
 */
export function formatMetadata(data: Record<string, string | number | boolean>): string {
  return Object.entries(data)
    .map(([key, value]) => `  ${colors.dim}${key}:${colors.reset} ${value}`)
    .join('\n');
}

/**
 * Validate and sanitize output format
 */
export function getOutputFormatter(format: string): (data: unknown, headers?: string[]) => string {
  switch (format.toLowerCase()) {
    case 'json':
      return data => formatJSON(data, true);
    case 'csv':
      return (data, headers) => {
        if (Array.isArray(data)) {
          return formatCSV(data as TableRow[], headers);
        }
        return formatJSON(data);
      };
    case 'table':
    default:
      return (data, headers) => {
        if (Array.isArray(data)) {
          return formatTable(data as TableRow[], headers);
        }
        return formatJSON(data, true);
      };
  }
}

/**
 * Parse command-line arguments
 */
export function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[++i];
      } else {
        parsed[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      parsed[key] = true;
    }
  }

  return parsed;
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
}

export const CLI_UTILS = {
  formatRiskScore,
  formatTable,
  formatJSON,
  formatCSV,
  log,
  logError,
  logSuccess,
  logWarning,
  logInfo,
  logDebug,
  progressBar,
  formatThreatResult,
  formatMetadata,
  getOutputFormatter,
  parseArgs,
  truncate,
};
