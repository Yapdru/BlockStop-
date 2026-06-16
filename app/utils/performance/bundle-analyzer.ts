/**
 * Bundle Analyzer Utilities
 * Analyzes bundle size, identifies large dependencies, and tracks performance metrics
 */

export interface BundleMetrics {
  totalSize: number;
  gzipSize: number;
  modules: ModuleInfo[];
  warnings: string[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  gzipSize: number;
  percentage: number;
  isLarge: boolean;
}

export interface BundleBudget {
  total: number; // in bytes
  js: number;
  css: number;
  warnAt?: number; // warn if exceeds this percentage
}

/**
 * Performance budget configuration
 */
export const DEFAULT_BUDGET: BundleBudget = {
  total: 500 * 1024, // 500 KB
  js: 300 * 1024, // 300 KB
  css: 50 * 1024, // 50 KB
  warnAt: 80, // Warn at 80% of budget
};

/**
 * Analyze bundle size from webpack stats
 */
export const analyzeBundleStats = (stats: any): BundleMetrics => {
  const modules: ModuleInfo[] = [];
  let totalSize = 0;
  let gzipSize = 0;
  const warnings: string[] = [];

  if (!stats || !stats.modules) {
    return { totalSize, gzipSize, modules, warnings };
  }

  stats.modules.forEach((module: any) => {
    const size = module.size || 0;
    const parsedSize = module.parsedSize || size;
    totalSize += parsedSize;

    modules.push({
      name: module.name,
      size: parsedSize,
      gzipSize: Math.ceil((parsedSize * 0.35) / 1024) * 1024, // Rough estimate
      percentage: 0, // Will be calculated below
      isLarge: parsedSize > 50 * 1024, // Flag modules > 50KB
    });
  });

  // Calculate percentages
  modules.forEach((mod) => {
    mod.percentage = (mod.size / totalSize) * 100;
  });

  // Sort by size
  modules.sort((a, b) => b.size - a.size);

  // Identify large modules
  const largeModules = modules.filter((m) => m.isLarge);
  if (largeModules.length > 0) {
    warnings.push(`Found ${largeModules.length} large modules (>50KB)`);
  }

  // Estimate gzip
  gzipSize = modules.reduce((sum, m) => sum + m.gzipSize, 0);

  return {
    totalSize,
    gzipSize,
    modules,
    warnings,
  };
};

/**
 * Check bundle against performance budget
 */
export const checkBundleBudget = (
  metrics: BundleMetrics,
  budget: BundleBudget = DEFAULT_BUDGET
): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check total size
  if (metrics.totalSize > budget.total) {
    issues.push(
      `Total bundle size (${formatBytes(metrics.totalSize)}) exceeds budget (${formatBytes(budget.total)})`
    );
  } else if (budget.warnAt && metrics.totalSize > (budget.total * budget.warnAt) / 100) {
    issues.push(
      `Total bundle size (${formatBytes(metrics.totalSize)}) approaching budget (${formatBytes(budget.total)})`
    );
  }

  // Check JS size
  const jsSize = metrics.modules
    .filter((m) => m.name.endsWith('.js'))
    .reduce((sum, m) => sum + m.size, 0);

  if (jsSize > budget.js) {
    issues.push(
      `JavaScript bundle (${formatBytes(jsSize)}) exceeds budget (${formatBytes(budget.js)})`
    );
  }

  // Check CSS size
  const cssSize = metrics.modules
    .filter((m) => m.name.endsWith('.css'))
    .reduce((sum, m) => sum + m.size, 0);

  if (cssSize > budget.css) {
    issues.push(
      `CSS bundle (${formatBytes(cssSize)}) exceeds budget (${formatBytes(budget.css)})`
    );
  }

  return {
    passed: issues.length === 0,
    issues,
  };
};

/**
 * Identify code splitting opportunities
 */
export const identifyCodeSplittingOpportunities = (
  modules: ModuleInfo[]
): { module: ModuleInfo; recommendation: string }[] => {
  const opportunities: { module: ModuleInfo; recommendation: string }[] = [];

  modules.forEach((module) => {
    if (module.size > 100 * 1024) {
      opportunities.push({
        module,
        recommendation: `Consider code splitting: ${module.name} is ${formatBytes(module.size)}`,
      });
    }
  });

  return opportunities;
};

/**
 * Find duplicate dependencies
 */
export const findDuplicateDependencies = (modules: ModuleInfo[]): string[] => {
  const packages: Record<string, number> = {};
  const duplicates: string[] = [];

  modules.forEach((module) => {
    // Extract package name from module path
    const match = module.name.match(/node_modules\/(@?[^/]+)/);
    if (match) {
      const packageName = match[1];
      packages[packageName] = (packages[packageName] || 0) + 1;
    }
  });

  Object.entries(packages).forEach(([pkg, count]) => {
    if (count > 1) {
      duplicates.push(`${pkg} appears ${count} times`);
    }
  });

  return duplicates;
};

/**
 * Get unused JavaScript estimation
 */
export const estimateUnusedJS = (
  metrics: BundleMetrics,
  coverage?: { url: string; ranges: Array<{ start: number; end: number }> }[]
): { percentage: number; bytes: number; recommendation: string } => {
  // This is a rough estimation without actual coverage data
  // In real scenarios, use Chrome DevTools Coverage API
  const estimatedUnused = metrics.totalSize * 0.3; // Assume ~30% unused
  const percentage = 30;

  return {
    percentage,
    bytes: Math.floor(estimatedUnused),
    recommendation: 'Use Code Coverage in DevTools to analyze unused JavaScript',
  };
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
};

/**
 * Generate bundle analysis report
 */
export const generateBundleReport = (
  metrics: BundleMetrics,
  budget: BundleBudget = DEFAULT_BUDGET
): string => {
  const budgetCheck = checkBundleBudget(metrics, budget);
  const opportunities = identifyCodeSplittingOpportunities(metrics.modules);
  const duplicates = findDuplicateDependencies(metrics.modules);
  const unused = estimateUnusedJS(metrics);

  let report = `
Bundle Analysis Report
======================

Total Bundle Size: ${formatBytes(metrics.totalSize)} (gzip: ${formatBytes(metrics.gzipSize)})
Budget Status: ${budgetCheck.passed ? '✓ PASSED' : '✗ FAILED'}

Top 10 Largest Modules:
${metrics.modules
  .slice(0, 10)
  .map((m, i) => `${i + 1}. ${m.name} - ${formatBytes(m.size)} (${m.percentage.toFixed(2)}%)`)
  .join('\n')}

Performance Issues:
${budgetCheck.issues.length > 0 ? budgetCheck.issues.map((i) => `- ${i}`).join('\n') : '- No issues found'}

Code Splitting Opportunities:
${opportunities.length > 0 ? opportunities.map((o) => `- ${o.recommendation}`).join('\n') : '- No opportunities found'}

Duplicate Dependencies:
${duplicates.length > 0 ? duplicates.map((d) => `- ${d}`).join('\n') : '- No duplicates found'}

Unused JavaScript:
Estimated ${unused.percentage}% (${formatBytes(unused.bytes)}) may be unused
${unused.recommendation}

Warnings:
${metrics.warnings.length > 0 ? metrics.warnings.map((w) => `- ${w}`).join('\n') : '- No warnings'}
  `.trim();

  return report;
};

/**
 * Track bundle metrics over time
 */
export class BundleMetricsTracker {
  private history: Array<{ timestamp: number; metrics: BundleMetrics }> = [];
  private maxHistory: number = 100;

  /**
   * Record metrics
   */
  record(metrics: BundleMetrics): void {
    this.history.push({
      timestamp: Date.now(),
      metrics,
    });

    // Keep only recent history
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get trend
   */
  getTrend(metric: 'totalSize' | 'gzipSize', days: number = 7): number | null {
    if (this.history.length < 2) return null;

    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentRecords = this.history.filter((r) => r.timestamp > cutoffTime);

    if (recentRecords.length < 2) return null;

    const first = recentRecords[0].metrics[metric];
    const last = recentRecords[recentRecords.length - 1].metrics[metric];

    return ((last - first) / first) * 100; // Percentage change
  }

  /**
   * Get average metrics
   */
  getAverage(metric: 'totalSize' | 'gzipSize'): number {
    if (this.history.length === 0) return 0;

    const sum = this.history.reduce((acc, r) => acc + r.metrics[metric], 0);
    return sum / this.history.length;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
  }
}

/**
 * Estimate metrics reduction from optimization
 */
export const estimateOptimizationImpact = (
  metrics: BundleMetrics,
  optimizations: {
    removeUnused?: number; // percentage
    minify?: number; // percentage
    compression?: number; // percentage
  }
): BundleMetrics => {
  let reduction = 1;

  if (optimizations.removeUnused) {
    reduction *= 1 - optimizations.removeUnused / 100;
  }
  if (optimizations.minify) {
    reduction *= 1 - optimizations.minify / 100;
  }
  if (optimizations.compression) {
    reduction *= 1 - optimizations.compression / 100;
  }

  return {
    ...metrics,
    totalSize: Math.floor(metrics.totalSize * reduction),
    gzipSize: Math.floor(metrics.gzipSize * reduction),
  };
};
