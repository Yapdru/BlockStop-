/**
 * BlockStop Phase 29.2 - Static Application Security Testing (SAST)
 * Production-ready SAST scanner for code vulnerability detection
 * - SQL injection patterns
 * - XSS/CSRF vulnerability detection
 * - Secret detection
 * - Dependency vulnerability checking
 * - Configuration security review
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type VulnerabilityType = 'sql-injection' | 'xss' | 'csrf' | 'secret' | 'insecure-config' | 'dependency' | 'hardcoded-credential';

export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  suggestion: string;
  cve?: string;
  cvss?: number;
  detectedAt: Date;
}

export interface DependencyVulnerability {
  packageName: string;
  currentVersion: string;
  vulnerableVersions: string[];
  severity: Severity;
  cve: string;
  description: string;
  patchedVersions: string[];
  references: string[];
}

export interface SASTReport {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalFiles: number;
  vulnerabilityCount: number;
  vulnerabilities: Vulnerability[];
  dependencyVulnerabilities: DependencyVulnerability[];
  secretsFound: number;
  severityCounts: Record<Severity, number>;
}

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /query\s*\(\s*[`"'].*\$\{.*\}.*[`"']/gi,
  /execute\s*\(\s*[`"'].*\+.*[`"']/gi,
  /sql\s*=\s*[`"'].*\+.*[`"']/gi,
  /db\.raw\s*\(\s*[`"'].*\+/gi,
  /sequelize\.literal\s*\(\s*[`"'].*\+/gi,
];

// XSS patterns
const XSS_PATTERNS = [
  /innerHTML\s*=\s*(?!.*escapeHtml|.*sanitize)/gi,
  /dangerouslySetInnerHTML/gi,
  /v-html/gi,
  /\[innerHTML\]/gi,
  /<div\s+v-html=/gi,
];

// CSRF patterns
const CSRF_PATTERNS = [
  /fetch\s*\([`"']\/api\/.*[`"']\s*,\s*\{[^}]*method\s*:\s*[`"'](POST|PUT|DELETE|PATCH)[`"'][^}]*\}[^}]*(?!.*csrf|.*X-CSRF|.*token)/gi,
  /axios\.(post|put|delete|patch)\s*\([^,]*,\s*[^,]*,\s*\{[^}]*(?!.*csrf|.*headers)[^}]*\}/gi,
];

// Secret patterns
const SECRET_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*[`"']?([a-zA-Z0-9\-_.]{20,})[`"']?/gi, type: 'api-key' },
  { pattern: /(?:password|passwd)\s*[:=]\s*[`"']([^`"']{8,})[`"']/gi, type: 'password' },
  { pattern: /(?:secret|private[_-]?key)\s*[:=]\s*[`"']?([a-zA-Z0-9\/\+\-_.=]{20,})[`"']?/gi, type: 'secret' },
  { pattern: /(?:aws[_-]?secret|aws[_-]?access[_-]?key)\s*[:=]\s*[`"']([a-zA-Z0-9\-+/=]{40})[`"']/gi, type: 'aws-key' },
  { pattern: /(?:github[_-]?token|github[_-]?pat)\s*[:=]\s*[`"']?ghp_[a-zA-Z0-9_]{36}[`"']?/gi, type: 'github-token' },
  { pattern: /(?:database[_-]?url|db[_-]?url)\s*[:=]\s*[`"']([^`"']*(?:password|passwd)[^`"']*)[`"']/gi, type: 'db-url' },
];

// Insecure configurations
const INSECURE_CONFIG_PATTERNS = [
  /ssl:\s*false/gi,
  /https?:\s*false/gi,
  /rejectUnauthorized\s*[:=]\s*false/gi,
  /NODE_ENV\s*[:=]\s*[`"']production[`"']/gi,
];

export class SASTScanner {
  private vulnerabilities: Vulnerability[] = [];
  private dependencyVulnerabilities: DependencyVulnerability[] = [];
  private secretsFound: number = 0;

  /**
   * Scan source code for vulnerabilities
   */
  public async scanSourceCode(sourceDir: string): Promise<SASTReport> {
    const startTime = new Date();
    this.vulnerabilities = [];
    this.dependencyVulnerabilities = [];
    this.secretsFound = 0;

    const files = this.getAllSourceFiles(sourceDir);

    for (const file of files) {
      await this.scanFile(file);
    }

    const endTime = new Date();
    const report: SASTReport = {
      id: crypto.randomUUID(),
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalFiles: files.length,
      vulnerabilityCount: this.vulnerabilities.length,
      vulnerabilities: this.vulnerabilities,
      dependencyVulnerabilities: this.dependencyVulnerabilities,
      secretsFound: this.secretsFound,
      severityCounts: this.calculateSeverityCounts(),
    };

    return report;
  }

  /**
   * Scan a single file for vulnerabilities
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Scan for SQL injection
      this.scanSQLInjection(filePath, content, lines);

      // Scan for XSS vulnerabilities
      this.scanXSS(filePath, content, lines);

      // Scan for CSRF vulnerabilities
      this.scanCSRF(filePath, content, lines);

      // Scan for secrets
      this.scanSecrets(filePath, content, lines);

      // Scan for insecure configurations
      this.scanInsecureConfig(filePath, content, lines);
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }

  /**
   * Scan for SQL injection vulnerabilities
   */
  private scanSQLInjection(filePath: string, content: string, lines: string[]): void {
    SQL_INJECTION_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1];
        const column = match.index - content.lastIndexOf('\n', match.index);

        this.vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'sql-injection',
          severity: 'critical',
          file: filePath,
          line: lineNumber,
          column,
          message: 'Potential SQL injection vulnerability detected',
          code: lineContent.trim(),
          suggestion: 'Use parameterized queries or prepared statements. Example: db.query("SELECT * FROM users WHERE id = $1", [userId])',
          detectedAt: new Date(),
        });
      }
    });
  }

  /**
   * Scan for XSS vulnerabilities
   */
  private scanXSS(filePath: string, content: string, lines: string[]): void {
    XSS_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1];
        const column = match.index - content.lastIndexOf('\n', match.index);

        this.vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'xss',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          column,
          message: 'Potential XSS vulnerability - direct HTML injection',
          code: lineContent.trim(),
          suggestion: 'Use textContent instead of innerHTML, or sanitize user input with DOMPurify or similar library',
          detectedAt: new Date(),
        });
      }
    });
  }

  /**
   * Scan for CSRF vulnerabilities
   */
  private scanCSRF(filePath: string, content: string, lines: string[]): void {
    CSRF_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1];
        const column = match.index - content.lastIndexOf('\n', match.index);

        this.vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'csrf',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          column,
          message: 'Potential CSRF vulnerability - missing CSRF token',
          code: lineContent.trim(),
          suggestion: 'Add CSRF token to request headers. Include X-CSRF-Token header with synchronized token value',
          detectedAt: new Date(),
        });
      }
    });
  }

  /**
   * Scan for hardcoded secrets and credentials
   */
  private scanSecrets(filePath: string, content: string, lines: string[]): void {
    SECRET_PATTERNS.forEach(({ pattern, type }) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1];
        const column = match.index - content.lastIndexOf('\n', match.index);

        this.secretsFound++;
        this.vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'secret',
          severity: 'critical',
          file: filePath,
          line: lineNumber,
          column,
          message: `Hardcoded ${type} detected in source code`,
          code: this.maskSecret(lineContent),
          suggestion: 'Move secrets to environment variables (.env file or secrets manager like HashiCorp Vault)',
          detectedAt: new Date(),
        });
      }
    });
  }

  /**
   * Scan for insecure configurations
   */
  private scanInsecureConfig(filePath: string, content: string, lines: string[]): void {
    INSECURE_CONFIG_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1];
        const column = match.index - content.lastIndexOf('\n', match.index);

        this.vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'insecure-config',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          column,
          message: 'Insecure configuration detected',
          code: lineContent.trim(),
          suggestion: 'Enable SSL/TLS and proper certificate validation in production environments',
          detectedAt: new Date(),
        });
      }
    });
  }

  /**
   * Check dependencies for known vulnerabilities
   */
  public async checkDependencies(packageJsonPath: string): Promise<DependencyVulnerability[]> {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const vulnerabilities: DependencyVulnerability[] = [];

      // Known vulnerability database (simplified)
      const knownVulnerabilities: Record<string, any> = {
        'express': {
          '< 4.18.0': {
            cve: 'CVE-2022-24999',
            description: 'Denial of Service attack through query parser',
            severity: 'high',
            patchedVersions: ['4.18.0'],
          },
        },
        'lodash': {
          '< 4.17.21': {
            cve: 'CVE-2021-23337',
            description: 'Regular Expression DoS vulnerability',
            severity: 'high',
            patchedVersions: ['4.17.21'],
          },
        },
      };

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      for (const [pkg, version] of Object.entries(allDeps)) {
        if (knownVulnerabilities[pkg]) {
          const vulnInfo = knownVulnerabilities[pkg];
          vulnerabilities.push({
            packageName: pkg,
            currentVersion: version as string,
            vulnerableVersions: Object.keys(vulnInfo),
            severity: vulnInfo[Object.keys(vulnInfo)[0]].severity,
            cve: vulnInfo[Object.keys(vulnInfo)[0]].cve,
            description: vulnInfo[Object.keys(vulnInfo)[0]].description,
            patchedVersions: vulnInfo[Object.keys(vulnInfo)[0]].patchedVersions,
            references: [
              `https://nvd.nist.gov/vuln/detail/${vulnInfo[Object.keys(vulnInfo)[0]].cve}`,
            ],
          });
        }
      }

      this.dependencyVulnerabilities = vulnerabilities;
      return vulnerabilities;
    } catch (error) {
      console.error('Error checking dependencies:', error);
      return [];
    }
  }

  /**
   * Get all source files from directory
   */
  private getAllSourceFiles(sourceDir: string): string[] {
    const files: string[] = [];
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (!entry.startsWith('.') && entry !== 'node_modules') {
              walk(fullPath);
            }
          } else if (supportedExtensions.some(ext => fullPath.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    };

    walk(sourceDir);
    return files;
  }

  /**
   * Mask sensitive information in error messages
   */
  private maskSecret(line: string): string {
    return line
      .replace(/(['\"`])([a-zA-Z0-9\-_+/=.]{20,})(['\"`])/g, '$1***REDACTED***$3')
      .substring(0, 100);
  }

  /**
   * Calculate severity counts
   */
  private calculateSeverityCounts(): Record<Severity, number> {
    const counts: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    this.vulnerabilities.forEach(vuln => {
      counts[vuln.severity]++;
    });

    return counts;
  }
}

export default SASTScanner;
