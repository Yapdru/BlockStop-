/**
 * Chaos Engineering Tester - Simulate failures and measure resilience
 * Runs chaos tests to verify system resilience and gather metrics
 */

export type FailureType =
  | 'server-down'
  | 'network-latency'
  | 'disk-full'
  | 'memory-pressure'
  | 'cpu-spike'
  | 'database-connection-limit'
  | 'api-rate-limit'
  | 'service-degradation'
  | 'network-partition'
  | 'disk-io-error';

export interface ChaosScenario {
  id: string;
  name: string;
  description?: string;
  failureType: FailureType;
  target: string; // service or component name
  duration: number; // milliseconds
  intensity: 'low' | 'medium' | 'high'; // severity
  parameters?: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChaosTest {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'rolled-back';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  observations: ChaosObservation[];
  metrics: ResilienceMetrics;
  findings: string[];
  recommendations: string[];
}

export interface ChaosObservation {
  timestamp: Date;
  metric: string;
  value: number;
  threshold?: number;
  status: 'normal' | 'warning' | 'critical';
  impact?: string;
}

export interface ResilienceMetrics {
  availability: number; // percentage
  latency: {
    p50: number; // ms
    p95: number; // ms
    p99: number; // ms
    max: number; // ms
  };
  errorRate: number; // percentage
  throughput: number; // requests/sec
  recovery: {
    timeToRecovery: number; // ms
    dataLoss: number; // records
    affectedUsers: number;
  };
  healthCheck: {
    succeeded: number;
    failed: number;
    total: number;
  };
}

export interface ResilienceReport {
  id: string;
  testResults: ChaosTest[];
  generatedAt: Date;
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  risksIdentified: string[];
  actionItems: ActionItem[];
  metrics: ResilienceMetrics;
}

export interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedEffort: string; // effort estimate
  owner?: string;
  dueDate?: Date;
}

export class ChaosTester {
  private scenarios: Map<string, ChaosScenario> = new Map();
  private tests: Map<string, ChaosTest> = new Map();
  private reports: Map<string, ResilienceReport> = new Map();
  private activeTests: Map<string, NodeJS.Timer> = new Map();

  /**
   * Create chaos scenario
   */
  createScenario(scenario: Omit<ChaosScenario, 'id' | 'createdAt' | 'updatedAt'>): ChaosScenario {
    const id = this.generateId();
    const now = new Date();

    const newScenario: ChaosScenario = {
      ...scenario,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.scenarios.set(id, newScenario);
    return newScenario;
  }

  /**
   * Update scenario
   */
  updateScenario(scenarioId: string, updates: Partial<ChaosScenario>): ChaosScenario | null {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return null;

    const updated: ChaosScenario = {
      ...scenario,
      ...updates,
      updatedAt: new Date(),
    };

    this.scenarios.set(scenarioId, updated);
    return updated;
  }

  /**
   * Get scenario
   */
  getScenario(scenarioId: string): ChaosScenario | null {
    return this.scenarios.get(scenarioId) || null;
  }

  /**
   * List scenarios
   */
  listScenarios(filters?: { enabled?: boolean; target?: string }): ChaosScenario[] {
    let scenarios = Array.from(this.scenarios.values());

    if (filters?.enabled !== undefined) {
      scenarios = scenarios.filter((s) => s.enabled === filters.enabled);
    }

    if (filters?.target) {
      scenarios = scenarios.filter((s) => s.target === filters.target);
    }

    return scenarios;
  }

  /**
   * Run chaos test
   */
  async runChaosTest(scenarioId: string): Promise<ChaosTest> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || !scenario.enabled) {
      throw new Error('Scenario not found or disabled');
    }

    const testId = this.generateId();
    const startTime = Date.now();

    const test: ChaosTest = {
      id: testId,
      scenarioId,
      scenarioName: scenario.name,
      status: 'running',
      startedAt: new Date(),
      observations: [],
      metrics: this.createInitialMetrics(),
      findings: [],
      recommendations: [],
    };

    this.tests.set(testId, test);

    try {
      // Inject chaos
      await this.injectChaos(scenario, test);

      // Monitor system during chaos
      await this.monitorDuringChaos(scenario, test);

      // Verify recovery
      await this.verifyRecovery(scenario, test);

      test.status = 'completed';
      test.completedAt = new Date();
      test.duration = test.completedAt.getTime() - startTime;

      // Generate findings and recommendations
      this.generateFindings(test);
    } catch (error: any) {
      test.status = 'failed';
      test.error = error.message;
      test.completedAt = new Date();
      test.duration = test.completedAt.getTime() - startTime;

      // Attempt rollback
      await this.rollbackChaos(scenario, test);
      test.status = 'rolled-back';
    }

    return test;
  }

  /**
   * Inject chaos into system
   */
  private async injectChaos(scenario: ChaosScenario, test: ChaosTest): Promise<void> {
    console.log(`Injecting chaos: ${scenario.failureType} on ${scenario.target}`);

    // Simulate injecting the failure
    const intensityFactor =
      scenario.intensity === 'low' ? 0.1 : scenario.intensity === 'medium' ? 0.5 : 0.9;

    switch (scenario.failureType) {
      case 'server-down':
        test.observations.push({
          timestamp: new Date(),
          metric: 'server_availability',
          value: 0,
          threshold: 95,
          status: 'critical',
          impact: 'Service unavailable',
        });
        break;
      case 'network-latency':
        test.observations.push({
          timestamp: new Date(),
          metric: 'network_latency_ms',
          value: 500 * intensityFactor,
          threshold: 100,
          status: 'critical',
          impact: 'Increased response times',
        });
        break;
      case 'disk-full':
        test.observations.push({
          timestamp: new Date(),
          metric: 'disk_usage_percent',
          value: 95,
          threshold: 90,
          status: 'critical',
          impact: 'Low disk space',
        });
        break;
      case 'memory-pressure':
        test.observations.push({
          timestamp: new Date(),
          metric: 'memory_usage_percent',
          value: 85 * intensityFactor,
          threshold: 80,
          status: 'warning',
          impact: 'Memory pressure detected',
        });
        break;
      case 'cpu-spike':
        test.observations.push({
          timestamp: new Date(),
          metric: 'cpu_usage_percent',
          value: 90 * intensityFactor,
          threshold: 80,
          status: 'critical',
          impact: 'High CPU utilization',
        });
        break;
      case 'database-connection-limit':
        test.observations.push({
          timestamp: new Date(),
          metric: 'db_connections_active',
          value: 1000 * intensityFactor,
          threshold: 500,
          status: 'critical',
          impact: 'Database connection exhaustion',
        });
        break;
    }

    // Simulate chaos duration
    await new Promise((resolve) => setTimeout(resolve, scenario.duration));
  }

  /**
   * Monitor system during chaos
   */
  private async monitorDuringChaos(scenario: ChaosScenario, test: ChaosTest): Promise<void> {
    // Collect metrics during chaos injection
    const iterations = 5;
    const interval = scenario.duration / iterations;

    for (let i = 0; i < iterations; i++) {
      const metrics = await this.collectMetrics();

      test.observations.push({
        timestamp: new Date(),
        metric: 'system_health',
        value: 100 - i * 15,
        threshold: 80,
        status: i > 1 ? 'critical' : 'warning',
      });

      test.metrics = { ...test.metrics, ...metrics };

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  /**
   * Verify recovery
   */
  private async verifyRecovery(scenario: ChaosScenario, test: ChaosTest): Promise<void> {
    console.log('Verifying system recovery');

    // Give system time to recover
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify all systems are operational
    const recovered = await this.checkSystemHealth();

    if (!recovered) {
      throw new Error('System failed to recover from chaos injection');
    }

    test.observations.push({
      timestamp: new Date(),
      metric: 'system_recovered',
      value: 1,
      status: 'normal',
      impact: 'System returned to normal operation',
    });

    test.metrics.recovery.timeToRecovery = 5000;
  }

  /**
   * Rollback chaos
   */
  private async rollbackChaos(scenario: ChaosScenario, test: ChaosTest): Promise<void> {
    console.log(`Rolling back chaos injection for ${scenario.name}`);

    // In production, actually rollback the injected chaos
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  /**
   * Collect metrics
   */
  private async collectMetrics(): Promise<Partial<ResilienceMetrics>> {
    return {
      availability: 95 + Math.random() * 5,
      latency: {
        p50: 50 + Math.random() * 100,
        p95: 200 + Math.random() * 300,
        p99: 500 + Math.random() * 500,
        max: 1000 + Math.random() * 1000,
      },
      errorRate: Math.random() * 5,
      throughput: 1000 + Math.random() * 500,
    };
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<boolean> {
    // In production, perform actual health checks
    return Math.random() > 0.1; // 90% success rate
  }

  /**
   * Generate findings and recommendations
   */
  private generateFindings(test: ChaosTest): void {
    const criticalObservations = test.observations.filter((o) => o.status === 'critical');
    const warningObservations = test.observations.filter((o) => o.status === 'warning');

    if (criticalObservations.length > 0) {
      test.findings.push('System experienced critical failures during chaos injection');
      test.recommendations.push(
        'Implement circuit breakers for dependent services',
        'Improve error handling and recovery mechanisms',
        'Increase system capacity or redundancy'
      );
    }

    if (warningObservations.length > 0) {
      test.findings.push('System exhibited degradation under stress');
      test.recommendations.push(
        'Monitor and optimize resource utilization',
        'Review and improve performance'
      );
    }

    if (test.metrics.recovery.timeToRecovery > 30000) {
      test.findings.push('Slow recovery from failure detected');
      test.recommendations.push('Improve automated recovery procedures', 'Increase failover speed');
    }

    if (test.metrics.errorRate > 1) {
      test.findings.push('High error rate during chaos test');
      test.recommendations.push('Improve error handling', 'Add retry logic with exponential backoff');
    }
  }

  /**
   * Generate resilience report
   */
  generateResilienceReport(testIds: string[]): ResilienceReport {
    const reportId = this.generateId();
    const testResults = testIds
      .map((id) => this.tests.get(id))
      .filter((t) => t !== undefined) as ChaosTest[];

    const report: ResilienceReport = {
      id: reportId,
      testResults,
      generatedAt: new Date(),
      overallScore: this.calculateOverallScore(testResults),
      strengths: this.identifyStrengths(testResults),
      weaknesses: this.identifyWeaknesses(testResults),
      risksIdentified: this.identifyRisks(testResults),
      actionItems: this.generateActionItems(testResults),
      metrics: this.aggregateMetrics(testResults),
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Calculate overall resilience score
   */
  private calculateOverallScore(tests: ChaosTest[]): number {
    if (tests.length === 0) return 0;

    const completedTests = tests.filter((t) => t.status === 'completed');
    if (completedTests.length === 0) return 0;

    const avgAvailability = completedTests.reduce((sum, t) => sum + t.metrics.availability, 0) / completedTests.length;
    const avgErrorRate = completedTests.reduce((sum, t) => sum + t.metrics.errorRate, 0) / completedTests.length;
    const avgRecoveryTime = completedTests.reduce((sum, t) => sum + t.metrics.recovery.timeToRecovery, 0) / completedTests.length;

    // Score based on metrics
    let score = 0;
    score += avgAvailability * 0.5; // 50% weight on availability
    score += (100 - Math.min(avgErrorRate * 10, 100)) * 0.3; // 30% weight on low error rate
    score += (Math.max(100 - avgRecoveryTime / 100, 0)) * 0.2; // 20% weight on fast recovery

    return Math.round(score);
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(tests: ChaosTest[]): string[] {
    const strengths: string[] = [];

    for (const test of tests) {
      if (test.metrics.availability > 99) {
        strengths.push(`${test.scenarioName}: Excellent availability`);
      }
      if (test.metrics.errorRate < 0.1) {
        strengths.push(`${test.scenarioName}: Very low error rate`);
      }
      if (test.metrics.recovery.timeToRecovery < 5000) {
        strengths.push(`${test.scenarioName}: Fast recovery time`);
      }
    }

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  private identifyWeaknesses(tests: ChaosTest[]): string[] {
    const weaknesses: string[] = [];

    for (const test of tests) {
      if (test.metrics.availability < 95) {
        weaknesses.push(`${test.scenarioName}: Low availability during chaos`);
      }
      if (test.metrics.errorRate > 1) {
        weaknesses.push(`${test.scenarioName}: High error rate`);
      }
      if (test.metrics.recovery.timeToRecovery > 30000) {
        weaknesses.push(`${test.scenarioName}: Slow recovery`);
      }
    }

    return weaknesses;
  }

  /**
   * Identify risks
   */
  private identifyRisks(tests: ChaosTest[]): string[] {
    const risks: string[] = [];

    for (const test of tests) {
      if (test.metrics.recovery.dataLoss > 0) {
        risks.push(`${test.scenarioName}: Potential data loss during failure`);
      }
      if (test.metrics.recovery.affectedUsers > 100) {
        risks.push(`${test.scenarioName}: Large number of affected users`);
      }
    }

    return risks;
  }

  /**
   * Generate action items
   */
  private generateActionItems(tests: ChaosTest[]): ActionItem[] {
    const items: ActionItem[] = [];

    for (const test of tests) {
      test.recommendations.forEach((rec, index) => {
        items.push({
          priority: index === 0 ? 'high' : 'medium',
          title: rec,
          description: `Action item from ${test.scenarioName} chaos test`,
          estimatedEffort: index === 0 ? '2-3 days' : '1-2 days',
        });
      });
    }

    return items.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Aggregate metrics
   */
  private aggregateMetrics(tests: ChaosTest[]): ResilienceMetrics {
    if (tests.length === 0) return this.createInitialMetrics();

    const metrics = this.createInitialMetrics();

    for (const test of tests) {
      metrics.availability += test.metrics.availability;
      metrics.errorRate += test.metrics.errorRate;
      metrics.throughput += test.metrics.throughput;
      metrics.recovery.timeToRecovery += test.metrics.recovery.timeToRecovery;
      metrics.recovery.dataLoss += test.metrics.recovery.dataLoss;
      metrics.recovery.affectedUsers += test.metrics.recovery.affectedUsers;
    }

    metrics.availability /= tests.length;
    metrics.errorRate /= tests.length;
    metrics.throughput /= tests.length;
    metrics.recovery.timeToRecovery /= tests.length;

    return metrics;
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): ResilienceMetrics {
    return {
      availability: 0,
      latency: { p50: 0, p95: 0, p99: 0, max: 0 },
      errorRate: 0,
      throughput: 0,
      recovery: { timeToRecovery: 0, dataLoss: 0, affectedUsers: 0 },
      healthCheck: { succeeded: 0, failed: 0, total: 0 },
    };
  }

  /**
   * Get test
   */
  getTest(testId: string): ChaosTest | null {
    return this.tests.get(testId) || null;
  }

  /**
   * List tests
   */
  listTests(scenarioId?: string, limit: number = 50): ChaosTest[] {
    let tests = Array.from(this.tests.values());

    if (scenarioId) {
      tests = tests.filter((t) => t.scenarioId === scenarioId);
    }

    return tests.sort((a, b) => b.startedAt?.getTime() || 0 - (a.startedAt?.getTime() || 0)).slice(0, limit);
  }

  /**
   * Get report
   */
  getReport(reportId: string): ResilienceReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ChaosTester;
