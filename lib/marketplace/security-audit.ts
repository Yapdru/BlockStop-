/**
 * Security Audit Module
 * Performs security scanning and vulnerability detection on plugins
 */

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedComponent: string;
  remediation: string;
  cveId?: string;
}

export interface SecurityAuditReport {
  pluginId: string;
  scanDate: Date;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  score: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  dependencyCheck: {
    totalDependencies: number;
    vulnerableDependencies: number;
    outdatedDependencies: number;
  };
  codeInjectionRisk: boolean;
  dataLeakageRisk: boolean;
  permissionScanning: {
    requestsFileAccess: boolean;
    requestsNetworkAccess: boolean;
    requestsUserData: boolean;
  };
}

export class SecurityAuditor {
  /**
   * Run comprehensive security audit
   */
  async auditPlugin(pluginCode: string, pluginMetadata: Record<string, any>): Promise<SecurityAuditReport> {
    const scanDate = new Date();

    // Scan for vulnerabilities
    const vulnerabilities = await this.scanForVulnerabilities(pluginCode);

    // Check dependencies
    const dependencyCheck = await this.checkDependencies(pluginMetadata);

    // Check for code injection risks
    const codeInjectionRisk = this.checkCodeInjectionRisks(pluginCode);

    // Check for data leakage
    const dataLeakageRisk = this.checkDataLeakageRisks(pluginCode);

    // Check permissions
    const permissionScanning = this.scanPermissions(pluginCode, pluginMetadata);

    // Calculate severity
    const maxSeverity = vulnerabilities.length > 0 ? vulnerabilities[0].severity : 'none';

    // Calculate score
    const score = this.calculateSecurityScore(vulnerabilities, dependencyCheck, codeInjectionRisk, dataLeakageRisk);

    return {
      pluginId: pluginMetadata.id || 'unknown',
      scanDate,
      severity: maxSeverity as any,
      score,
      vulnerabilities,
      dependencyCheck,
      codeInjectionRisk,
      dataLeakageRisk,
      permissionScanning,
    };
  }

  /**
   * Scan for known vulnerabilities
   */
  private async scanForVulnerabilities(pluginCode: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for dangerous functions/patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/g, title: 'eval() usage', severity: 'critical' as const },
      { pattern: /Function\s*\(/g, title: 'Function constructor usage', severity: 'high' as const },
      { pattern: /child_process\.exec\s*\(/g, title: 'Unescaped shell execution', severity: 'high' as const },
      { pattern: /require\s*\(\s*['"`].*variables.*['"`]\s*\)/g, title: 'Dynamic require', severity: 'medium' as const },
    ];

    for (const { pattern, title, severity } of dangerousPatterns) {
      if (pattern.test(pluginCode)) {
        vulnerabilities.push({
          id: `vuln-${Date.now()}`,
          severity,
          title,
          description: `Found potentially unsafe usage of ${title}`,
          affectedComponent: 'code',
          remediation: 'Avoid using eval or dynamic function construction. Use safe alternatives.',
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Check for dependency vulnerabilities
   */
  private async checkDependencies(metadata: Record<string, any>): Promise<SecurityAuditReport['dependencyCheck']> {
    const dependencies = metadata.dependencies || {};
    const devDependencies = metadata.devDependencies || {};

    const allDeps = { ...dependencies, ...devDependencies };
    const totalDependencies = Object.keys(allDeps).length;

    // Simulate checking known vulnerable versions
    // In production, would query a vulnerability database
    let vulnerableDependencies = 0;
    let outdatedDependencies = 0;

    for (const [pkg, version] of Object.entries(allDeps)) {
      // Simple heuristic - would use actual vulnerability DB in production
      if (typeof version === 'string' && version.includes('1.0.0')) {
        vulnerableDependencies++;
      }
    }

    outdatedDependencies = Math.floor(totalDependencies * 0.15); // Simulate ~15% outdated

    return {
      totalDependencies,
      vulnerableDependencies,
      outdatedDependencies,
    };
  }

  /**
   * Check for code injection risks
   */
  private checkCodeInjectionRisks(pluginCode: string): boolean {
    const injectionPatterns = [
      /innerHTML\s*=/, // DOM manipulation without sanitization
      /document\.write/, // Direct document writing
      /insertAdjacentHTML/, // Direct HTML insertion
    ];

    return injectionPatterns.some((pattern) => pattern.test(pluginCode));
  }

  /**
   * Check for data leakage risks
   */
  private checkDataLeakageRisks(pluginCode: string): boolean {
    const leakagePatterns = [
      /console\.log\s*\(\s*.*secret.*\)/i,
      /fetch\s*\(\s*['"`].*logging.*['"`]/i,
      /password|token|api[_-]?key|secret/i, // Pattern detection for sensitive data
    ];

    return leakagePatterns.some((pattern) => pattern.test(pluginCode));
  }

  /**
   * Scan plugin permissions
   */
  private scanPermissions(
    pluginCode: string,
    metadata: Record<string, any>
  ): SecurityAuditReport['permissionScanning'] {
    return {
      requestsFileAccess: /fs\.|readFile|writeFile|unlink/.test(pluginCode),
      requestsNetworkAccess: /http\.|fetch|XMLHttpRequest|websocket/.test(pluginCode),
      requestsUserData: /personal|email|phone|address|ssn|credit/i.test(pluginCode),
    };
  }

  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(
    vulnerabilities: SecurityVulnerability[],
    dependencyCheck: SecurityAuditReport['dependencyCheck'],
    codeInjectionRisk: boolean,
    dataLeakageRisk: boolean
  ): number {
    let score = 100;

    // Deduct for vulnerabilities
    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'critical') score -= 25;
      else if (vuln.severity === 'high') score -= 15;
      else if (vuln.severity === 'medium') score -= 8;
      else if (vuln.severity === 'low') score -= 3;
    }

    // Deduct for dependency issues
    score -= dependencyCheck.vulnerableDependencies * 5;
    score -= Math.floor(dependencyCheck.outdatedDependencies / 2);

    // Deduct for risks
    if (codeInjectionRisk) score -= 10;
    if (dataLeakageRisk) score -= 10;

    return Math.max(0, score);
  }
}

export const securityAuditor = new SecurityAuditor();
