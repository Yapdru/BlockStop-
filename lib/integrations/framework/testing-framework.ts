/**
 * Integration Testing Framework
 * Tools for testing integration implementations
 */

import {
  IntegrationConfig,
  WebhookPayload,
  TransformedEvent,
  IntegrationTestResult,
  ValidationResult,
} from '../types';
import { IntegrationBase } from './integration-base';
import crypto from 'crypto';

export interface TestSuite {
  name: string;
  description?: string;
  tests: IntegrationTest[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface IntegrationTest {
  name: string;
  run(context: TestContext): Promise<void>;
}

export interface TestContext {
  integration: IntegrationBase;
  config: IntegrationConfig;
  assert: AssertionLibrary;
  skipTest?: (reason?: string) => void;
  timeout?: number;
}

export class AssertionLibrary {
  private failures: string[] = [];

  assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      this.fail(`Expected ${expected} but got ${actual}. ${message || ''}`);
    }
  }

  assertTrue(value: boolean, message?: string): void {
    if (!value) {
      this.fail(`Expected true but got ${value}. ${message || ''}`);
    }
  }

  assertFalse(value: boolean, message?: string): void {
    if (value) {
      this.fail(`Expected false but got ${value}. ${message || ''}`);
    }
  }

  assertNull(value: any, message?: string): void {
    if (value !== null) {
      this.fail(`Expected null but got ${value}. ${message || ''}`);
    }
  }

  assertNotNull(value: any, message?: string): void {
    if (value === null || value === undefined) {
      this.fail(`Expected non-null value. ${message || ''}`);
    }
  }

  assertThrows(fn: () => void, expectedError?: string, message?: string): void {
    try {
      fn();
      this.fail(`Expected function to throw. ${message || ''}`);
    } catch (error) {
      if (expectedError && !String(error).includes(expectedError)) {
        this.fail(`Expected error containing "${expectedError}" but got "${error}". ${message || ''}`);
      }
    }
  }

  async assertThrowsAsync(fn: () => Promise<void>, expectedError?: string, message?: string): Promise<void> {
    try {
      await fn();
      this.fail(`Expected async function to throw. ${message || ''}`);
    } catch (error) {
      if (expectedError && !String(error).includes(expectedError)) {
        this.fail(`Expected error containing "${expectedError}" but got "${error}". ${message || ''}`);
      }
    }
  }

  assertIncludes(array: any[], value: any, message?: string): void {
    if (!array.includes(value)) {
      this.fail(`Expected array to include ${value}. ${message || ''}`);
    }
  }

  assertMatches(text: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(text)) {
      this.fail(`Expected text to match ${pattern}. ${message || ''}`);
    }
  }

  fail(message: string): void {
    this.failures.push(message);
  }

  getFailures(): string[] {
    return [...this.failures];
  }

  hasFailures(): boolean {
    return this.failures.length > 0;
  }

  reset(): void {
    this.failures = [];
  }
}

export class IntegrationTestRunner {
  private suites: Map<string, TestSuite> = new Map();
  private results: IntegrationTestResult[] = [];

  /**
   * Register test suite
   */
  registerSuite(suite: TestSuite): void {
    this.suites.set(suite.name, suite);
  }

  /**
   * Run all tests
   */
  async runAll(integration: IntegrationBase, config: IntegrationConfig): Promise<IntegrationTestResult[]> {
    this.results = [];

    for (const suite of this.suites.values()) {
      await this.runSuite(suite, integration, config);
    }

    return this.results;
  }

  /**
   * Run specific test suite
   */
  async runSuite(
    suite: TestSuite,
    integration: IntegrationBase,
    config: IntegrationConfig
  ): Promise<IntegrationTestResult[]> {
    if (suite.setup) {
      await suite.setup();
    }

    const suiteResults: IntegrationTestResult[] = [];

    for (const test of suite.tests) {
      const result = await this.runTest(test, integration, config);
      suiteResults.push(result);
      this.results.push(result);
    }

    if (suite.teardown) {
      await suite.teardown();
    }

    return suiteResults;
  }

  /**
   * Run single test
   */
  async runTest(
    test: IntegrationTest,
    integration: IntegrationBase,
    config: IntegrationConfig
  ): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    const assert = new AssertionLibrary();
    let status: 'pass' | 'fail' | 'skip' = 'pass';
    let message = '';

    const context: TestContext = {
      integration,
      config,
      assert,
      skipTest: (reason?: string) => {
        status = 'skip';
        message = reason || 'Test skipped';
      },
    };

    try {
      await test.run(context);

      if (assert.hasFailures()) {
        status = 'fail';
        message = assert.getFailures().join('\n');
      }
    } catch (error) {
      status = 'fail';
      message = error instanceof Error ? error.message : String(error);
    }

    return {
      integrationId: integration.getId(),
      testName: test.name,
      status,
      duration: Date.now() - startTime,
      message: message || undefined,
    };
  }

  /**
   * Get test results
   */
  getResults(): IntegrationTestResult[] {
    return [...this.results];
  }

  /**
   * Get results summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  } {
    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === 'pass').length,
      failed: this.results.filter((r) => r.status === 'fail').length,
      skipped: this.results.filter((r) => r.status === 'skip').length,
      duration: this.results.reduce((sum, r) => sum + r.duration, 0),
    };

    return summary;
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }
}

/**
 * Common test builders
 */
export class CommonIntegrationTests {
  /**
   * Create authentication test
   */
  static createAuthenticationTest(): IntegrationTest {
    return {
      name: 'Authentication should succeed',
      async run(context: TestContext): Promise<void> {
        const healthCheck = await context.integration.healthCheck();
        context.assert.assertTrue(healthCheck.details.authentication, 'Authentication check failed');
      },
    };
  }

  /**
   * Create connectivity test
   */
  static createConnectivityTest(): IntegrationTest {
    return {
      name: 'Connectivity should be established',
      async run(context: TestContext): Promise<void> {
        const healthCheck = await context.integration.healthCheck();
        context.assert.assertTrue(healthCheck.details.connectivity, 'Connectivity check failed');
      },
    };
  }

  /**
   * Create webhook transformation test
   */
  static createWebhookTransformationTest(payload: WebhookPayload, validator: (event: TransformedEvent) => void): IntegrationTest {
    return {
      name: 'Webhook transformation should produce valid event',
      async run(context: TestContext): Promise<void> {
        try {
          const event = await context.integration.handleWebhook(payload);
          context.assert.assertNotNull(event.id, 'Event ID should not be null');
          context.assert.assertNotNull(event.timestamp, 'Event timestamp should not be null');
          validator(event);
        } catch (error) {
          context.assert.fail(`Webhook transformation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    };
  }

  /**
   * Create health check test
   */
  static createHealthCheckTest(): IntegrationTest {
    return {
      name: 'Health check should return valid result',
      async run(context: TestContext): Promise<void> {
        const healthCheck = await context.integration.healthCheck();
        context.assert.assertNotNull(healthCheck.status, 'Health status should not be null');
        context.assert.assertNotNull(healthCheck.timestamp, 'Health check timestamp should not be null');
        context.assert.assertTrue(healthCheck.responseTime >= 0, 'Response time should be non-negative');
      },
    };
  }

  /**
   * Create configuration validation test
   */
  static createConfigValidationTest(validator: (config: IntegrationConfig) => ValidationResult): IntegrationTest {
    return {
      name: 'Configuration should be valid',
      async run(context: TestContext): Promise<void> {
        const result = validator(context.config);
        context.assert.assertTrue(result.valid, `Configuration validation failed: ${result.errors.map((e) => e.message).join(', ')}`);
      },
    };
  }
}

/**
 * Mock integration for testing
 */
export class MockIntegration extends IntegrationBase {
  private responses: Map<string, any> = new Map();
  private requestLog: Array<{ method: string; endpoint: string; data?: any }> = [];

  async executeRequest<T>(method: string, endpoint: string, data?: Record<string, any>): Promise<T> {
    this.requestLog.push({ method, endpoint, data });
    const key = `${method}:${endpoint}`;
    return this.responses.get(key) || ({} as T);
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: payload.source,
      category: 'test',
      severity: 'medium',
      title: 'Test Event',
      description: payload.data.description || 'Test event from mock integration',
      data: payload.data,
    };
  }

  async onTeardown(): Promise<void> {
    this.responses.clear();
    this.requestLog = [];
  }

  async onConfigUpdate(): Promise<void> {
    // Mock implementation
  }

  setMockResponse(method: string, endpoint: string, response: any): void {
    const key = `${method}:${endpoint}`;
    this.responses.set(key, response);
  }

  getRequestLog(): Array<{ method: string; endpoint: string; data?: any }> {
    return [...this.requestLog];
  }

  clearRequestLog(): void {
    this.requestLog = [];
  }
}
