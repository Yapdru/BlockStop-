/**
 * Performance Audit Module
 * Tests plugin performance and resource usage
 */

export interface PerformanceMetrics {
  executionTime: {
    min: number; // milliseconds
    max: number;
    average: number;
    p95: number;
    p99: number;
  };
  memoryUsage: {
    min: number; // MB
    max: number;
    average: number;
  };
  cpuUsage: {
    average: number; // percentage
  };
  callbackTime: number; // Time from request to completion
}

export interface PerformanceAuditReport {
  pluginId: string;
  testDate: Date;
  passed: boolean;
  score: number; // 0-100
  metrics: PerformanceMetrics;
  benchmarks: {
    executionTimeBudget: number;
    memoryBudget: number;
    cpuBudget: number;
  };
  bottlenecks: string[];
  recommendations: string[];
}

export class PerformanceAuditor {
  private readonly DEFAULT_EXECUTION_BUDGET = 1000; // 1 second
  private readonly DEFAULT_MEMORY_BUDGET = 128; // 128 MB
  private readonly DEFAULT_CPU_BUDGET = 50; // 50%

  /**
   * Run performance audit on plugin
   */
  async auditPlugin(
    pluginCode: string,
    pluginMetadata: Record<string, any>,
    testData?: any
  ): Promise<PerformanceAuditReport> {
    const testDate = new Date();
    const pluginId = pluginMetadata.id || 'unknown';

    // Run performance tests
    const metrics = await this.runPerformanceTests(pluginCode, testData);

    // Check against benchmarks
    const benchmarks = this.getBenchmarks(pluginMetadata);
    const passed = this.checkBenchmarks(metrics, benchmarks);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(metrics, benchmarks);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, bottlenecks);

    // Calculate score
    const score = this.calculatePerformanceScore(metrics, benchmarks);

    return {
      pluginId,
      testDate,
      passed,
      score,
      metrics,
      benchmarks,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(pluginCode: string, testData?: any): Promise<PerformanceMetrics> {
    const measurements: number[] = [];
    const memoryMeasurements: number[] = [];
    const cpuMeasurements: number[] = [];

    // Run tests multiple times to get reliable metrics
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

      // Simulate plugin execution (in production, would actually execute the plugin)
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 300));

      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      measurements.push(executionTime);
      memoryMeasurements.push(Math.abs(endMemory - startMemory));
      cpuMeasurements.push(Math.random() * 60); // Simulated CPU usage
    }

    // Calculate percentiles
    const sorted = measurements.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      executionTime: {
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        average: measurements.reduce((a, b) => a + b) / measurements.length,
        p95: sorted[p95Index],
        p99: sorted[p99Index],
      },
      memoryUsage: {
        min: Math.min(...memoryMeasurements),
        max: Math.max(...memoryMeasurements),
        average: memoryMeasurements.reduce((a, b) => a + b) / memoryMeasurements.length,
      },
      cpuUsage: {
        average: cpuMeasurements.reduce((a, b) => a + b) / cpuMeasurements.length,
      },
      callbackTime: Math.max(...measurements) + 50, // Add some overhead
    };
  }

  /**
   * Get performance benchmarks for plugin
   */
  private getBenchmarks(metadata: Record<string, any>) {
    const tier = metadata.tier || 'standard';

    const budgets = {
      standard: {
        executionTimeBudget: this.DEFAULT_EXECUTION_BUDGET,
        memoryBudget: this.DEFAULT_MEMORY_BUDGET,
        cpuBudget: this.DEFAULT_CPU_BUDGET,
      },
      premium: {
        executionTimeBudget: 500,
        memoryBudget: 64,
        cpuBudget: 30,
      },
      enterprise: {
        executionTimeBudget: 250,
        memoryBudget: 32,
        cpuBudget: 20,
      },
    };

    return budgets[tier as keyof typeof budgets] || budgets.standard;
  }

  /**
   * Check if metrics pass benchmarks
   */
  private checkBenchmarks(metrics: PerformanceMetrics, benchmarks: PerformanceAuditReport['benchmarks']): boolean {
    return (
      metrics.executionTime.p99 <= benchmarks.executionTimeBudget &&
      metrics.memoryUsage.max <= benchmarks.memoryBudget &&
      metrics.cpuUsage.average <= benchmarks.cpuBudget
    );
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(
    metrics: PerformanceMetrics,
    benchmarks: PerformanceAuditReport['benchmarks']
  ): string[] {
    const bottlenecks: string[] = [];

    if (metrics.executionTime.p99 > benchmarks.executionTimeBudget) {
      bottlenecks.push(`Execution time exceeds budget: ${metrics.executionTime.p99.toFixed(2)}ms > ${benchmarks.executionTimeBudget}ms`);
    }

    if (metrics.memoryUsage.max > benchmarks.memoryBudget) {
      bottlenecks.push(
        `Memory usage exceeds budget: ${metrics.memoryUsage.max.toFixed(2)}MB > ${benchmarks.memoryBudget}MB`
      );
    }

    if (metrics.cpuUsage.average > benchmarks.cpuBudget) {
      bottlenecks.push(
        `CPU usage exceeds budget: ${metrics.cpuUsage.average.toFixed(1)}% > ${benchmarks.cpuBudget}%`
      );
    }

    if (metrics.executionTime.max - metrics.executionTime.min > 200) {
      bottlenecks.push('High variance in execution time - potential for optimization');
    }

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.some((b) => b.includes('Execution time'))) {
      recommendations.push('Profile plugin code to identify slow operations');
      recommendations.push('Consider caching frequently accessed data');
      recommendations.push('Optimize database queries or API calls');
    }

    if (bottlenecks.some((b) => b.includes('Memory usage'))) {
      recommendations.push('Review memory allocation patterns');
      recommendations.push('Implement proper garbage collection');
      recommendations.push('Consider using streaming for large datasets');
    }

    if (bottlenecks.some((b) => b.includes('CPU usage'))) {
      recommendations.push('Profile CPU-intensive operations');
      recommendations.push('Consider offloading to background workers');
      recommendations.push('Optimize algorithms for better efficiency');
    }

    if (bottlenecks.length === 0) {
      recommendations.push('Performance is excellent! Continue best practices.');
    }

    return recommendations;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics, benchmarks: PerformanceAuditReport['benchmarks']): number {
    let score = 100;

    // Deduct for execution time
    const executionRatio = metrics.executionTime.p99 / benchmarks.executionTimeBudget;
    if (executionRatio > 1) {
      score -= Math.min(30, (executionRatio - 1) * 30);
    }

    // Deduct for memory usage
    const memoryRatio = metrics.memoryUsage.max / benchmarks.memoryBudget;
    if (memoryRatio > 1) {
      score -= Math.min(25, (memoryRatio - 1) * 25);
    }

    // Deduct for CPU usage
    const cpuRatio = metrics.cpuUsage.average / benchmarks.cpuBudget;
    if (cpuRatio > 1) {
      score -= Math.min(20, (cpuRatio - 1) * 20);
    }

    return Math.max(0, score);
  }
}

export const performanceAuditor = new PerformanceAuditor();
