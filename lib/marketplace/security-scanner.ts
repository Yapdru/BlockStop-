/**
 * Security Scanner for Plugins
 * Scans plugins for security vulnerabilities before publication
 */

export enum SecurityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export interface SecurityIssue {
  id: string;
  level: SecurityLevel;
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  codeSnippet?: string;
  lineNumber?: number;
}

export interface SecurityScanResult {
  pluginId: string;
  timestamp: Date;
  passed: boolean;
  score: number; // 0-100
  issues: SecurityIssue[];
  warnings: string[];
  recommendations: string[];
}

export class PluginSecurityScanner {
  private scanResults: Map<string, SecurityScanResult> = new Map();
  private blacklistedPatterns: RegExp[] = [];
  private whitelistedPatterns: RegExp[] = [];

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Blacklisted patterns for dangerous operations
    this.blacklistedPatterns = [
      /eval\(/gi,
      /Function\(/gi,
      /require\s*\(\s*['"]?\.\.?['"]?\s*\)/gi,
      /child_process/gi,
      /fs\.writeFile\(/gi,
      /fs\.chmod\(/gi,
      /os\.system\(/gi,
    ];

    // Whitelisted safe patterns
    this.whitelistedPatterns = [
      /JSON\.parse\(/gi,
      /JSON\.stringify\(/gi,
      /fetch\(/gi,
      /console\.log\(/gi,
    ];
  }

  public async scanPlugin(pluginId: string, code: string, manifest: any): Promise<SecurityScanResult> {
    const issues: SecurityIssue[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Scan for dangerous patterns
    issues.push(...this.scanForDangerousPatterns(code));

    // Check manifest
    issues.push(...this.validateManifest(manifest));

    // Check permissions
    warnings.push(...this.checkPermissions(manifest));

    // Analyze dependencies
    if (manifest.dependencies) {
      warnings.push(...this.analyzeDependencies(manifest.dependencies));
    }

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues, manifest));

    // Calculate score
    const score = this.calculateSecurityScore(issues);

    const result: SecurityScanResult = {
      pluginId,
      timestamp: new Date(),
      passed: issues.filter(i => i.level === SecurityLevel.CRITICAL || i.level === SecurityLevel.HIGH).length === 0,
      score,
      issues,
      warnings,
      recommendations,
    };

    this.scanResults.set(pluginId, result);
    return result;
  }

  private scanForDangerousPatterns(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check blacklisted patterns
      for (const pattern of this.blacklistedPatterns) {
        if (pattern.test(line)) {
          const matched = line.match(pattern);
          issues.push({
            id: `issue-${Date.now()}-${Math.random()}`,
            level: SecurityLevel.CRITICAL,
            category: 'dangerous_function',
            title: `Dangerous function detected: ${matched?.[0]}`,
            description: `The plugin uses ${matched?.[0]} which is a dangerous function that could lead to code injection attacks.`,
            recommendation: 'Use safer alternatives or justify the need for this function.',
            codeSnippet: line.trim(),
            lineNumber: i + 1,
          });
        }
      }

      // Check for dynamic requires
      if (/require\s*\(\s*\[.*\]\s*\)/gi.test(line)) {
        issues.push({
          id: `issue-${Date.now()}-${Math.random()}`,
          level: SecurityLevel.HIGH,
          category: 'dynamic_require',
          title: 'Dynamic require detected',
          description: 'The plugin uses dynamic requires which could lead to arbitrary code execution.',
          recommendation: 'Use static requires instead.',
          codeSnippet: line.trim(),
          lineNumber: i + 1,
        });
      }

      // Check for SQL-like patterns
      if (/sql|query|sqlite|database/gi.test(line) && /\+\s*['"`]/gi.test(line)) {
        issues.push({
          id: `issue-${Date.now()}-${Math.random()}`,
          level: SecurityLevel.HIGH,
          category: 'sql_injection_risk',
          title: 'Potential SQL injection vulnerability',
          description: 'The plugin appears to concatenate strings in a database query.',
          recommendation: 'Use parameterized queries or prepared statements.',
          codeSnippet: line.trim(),
          lineNumber: i + 1,
        });
      }

      // Check for hardcoded secrets
      if (/(password|secret|token|key|api.?key)\s*[:=]/gi.test(line)) {
        if (!/\/\//gi.test(line) && !/['"`].*['"`]/gi.test(line)) {
          issues.push({
            id: `issue-${Date.now()}-${Math.random()}`,
            level: SecurityLevel.CRITICAL,
            category: 'hardcoded_secret',
            title: 'Hardcoded secret detected',
            description: 'The plugin contains hardcoded sensitive information like passwords or API keys.',
            recommendation: 'Move secrets to environment variables or configuration files.',
            codeSnippet: line.trim(),
            lineNumber: i + 1,
          });
        }
      }
    }

    return issues;
  }

  private validateManifest(manifest: any): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Check for suspicious permissions
    const dangerousPermissions = ['delete', 'execute'];
    if (manifest.permissions) {
      for (const perm of manifest.permissions) {
        if (dangerousPermissions.some(dp => perm.action.includes(dp))) {
          issues.push({
            id: `issue-${Date.now()}-${Math.random()}`,
            level: SecurityLevel.MEDIUM,
            category: 'dangerous_permission',
            title: `Dangerous permission requested: ${perm.action}`,
            description: `The plugin requests permission to ${perm.action} on ${perm.resource}.`,
            recommendation: 'Review if this permission is truly necessary.',
          });
        }
      }
    }

    // Check for missing manifest fields
    if (!manifest.license) {
      issues.push({
        id: `issue-${Date.now()}-${Math.random()}`,
        level: SecurityLevel.LOW,
        category: 'missing_license',
        title: 'License not specified',
        description: 'The plugin does not specify a license.',
        recommendation: 'Add a license field to the manifest.',
      });
    }

    return issues;
  }

  private checkPermissions(manifest: any): string[] {
    const warnings: string[] = [];

    if (!manifest.permissions || manifest.permissions.length === 0) {
      warnings.push('Plugin requests no permissions - verify this is intentional.');
    }

    const criticalPerms = manifest.permissions?.filter(
      (p: any) => p.resource === 'http' || p.resource === 'integrations'
    );

    if (criticalPerms && criticalPerms.length > 0) {
      warnings.push(
        `Plugin requests network access. Ensure this is necessary and review network activity.`
      );
    }

    return warnings;
  }

  private analyzeDependencies(dependencies: Record<string, string>): string[] {
    const warnings: string[] = [];

    // In production, check against known vulnerable packages
    for (const [name, version] of Object.entries(dependencies)) {
      // This is a placeholder - in production, query vulnerability databases
      if (name.includes('vulnerable') || name.includes('deprecated')) {
        warnings.push(`Dependency "${name}" may have known vulnerabilities.`);
      }
    }

    return warnings;
  }

  private generateRecommendations(issues: SecurityIssue[], manifest: any): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(i => i.level === SecurityLevel.CRITICAL);
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} critical security issues found. These must be addressed before publication.`);
    }

    const highIssues = issues.filter(i => i.level === SecurityLevel.HIGH);
    if (highIssues.length > 0) {
      recommendations.push(`${highIssues.length} high-severity issues detected. Review and resolve if possible.`);
    }

    if (manifest.permissions && manifest.permissions.length > 5) {
      recommendations.push('Plugin requests many permissions. Review if all are necessary and implement least-privilege principle.');
    }

    return recommendations;
  }

  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      switch (issue.level) {
        case SecurityLevel.CRITICAL:
          score -= 20;
          break;
        case SecurityLevel.HIGH:
          score -= 10;
          break;
        case SecurityLevel.MEDIUM:
          score -= 5;
          break;
        case SecurityLevel.LOW:
          score -= 2;
          break;
        case SecurityLevel.INFO:
          score -= 1;
          break;
      }
    }

    return Math.max(0, score);
  }

  public getScanResult(pluginId: string): SecurityScanResult | undefined {
    return this.scanResults.get(pluginId);
  }

  public getAllScanResults(): SecurityScanResult[] {
    return Array.from(this.scanResults.values());
  }

  public getScansByLevel(level: SecurityLevel): SecurityScanResult[] {
    return Array.from(this.scanResults.values()).filter(result =>
      result.issues.some(issue => issue.level === level)
    );
  }

  public getPluginsSafeToDeploy(): string[] {
    return Array.from(this.scanResults.values())
      .filter(result => result.passed && result.score >= 80)
      .map(result => result.pluginId);
  }
}
