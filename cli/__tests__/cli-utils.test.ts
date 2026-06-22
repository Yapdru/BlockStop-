/**
 * Tests for CLI Utilities
 */

import * as CLIUtils from '../modules/cli-utils.js';

describe('CLI Utils', () => {
  describe('formatRiskScore', () => {
    it('should format safe risk score', () => {
      const result = CLIUtils.formatRiskScore(5);
      expect(result.label).toBe('SAFE');
      expect(result.severity).toBe('SAFE');
      expect(result.colored).toContain('5/100');
    });

    it('should format critical risk score', () => {
      const result = CLIUtils.formatRiskScore(95);
      expect(result.label).toBe('CRITICAL');
      expect(result.severity).toBe('CRITICAL');
    });

    it('should format medium risk score', () => {
      const result = CLIUtils.formatRiskScore(50);
      expect(result.label).toBe('MEDIUM');
      expect(result.severity).toBe('MEDIUM');
    });
  });

  describe('formatTable', () => {
    it('should format data as table', () => {
      const data = [
        { name: 'Test1', status: 'Pass' },
        { name: 'Test2', status: 'Fail' },
      ];

      const result = CLIUtils.formatTable(data);
      expect(result).toContain('Test1');
      expect(result).toContain('Pass');
      expect(result).toContain('Fail');
    });

    it('should handle empty data', () => {
      const result = CLIUtils.formatTable([]);
      expect(result).toBe('No data to display');
    });
  });

  describe('formatJSON', () => {
    it('should format as JSON', () => {
      const data = { test: 'value', nested: { key: 123 } };
      const result = CLIUtils.formatJSON(data);
      expect(result).toContain('test');
      expect(result).toContain('value');
    });

    it('should pretty-print by default', () => {
      const data = { a: 1, b: 2 };
      const result = CLIUtils.formatJSON(data, true);
      expect(result).toContain('\n');
    });
  });

  describe('formatCSV', () => {
    it('should format as CSV', () => {
      const data = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '28' },
      ];

      const result = CLIUtils.formatCSV(data);
      expect(result).toContain('name,age');
      expect(result).toContain('John');
      expect(result).toContain('Jane');
    });

    it('should escape quotes in values', () => {
      const data = [{ name: 'Test "quoted"' }];
      const result = CLIUtils.formatCSV(data);
      expect(result).toContain('""');
    });
  });

  describe('progressBar', () => {
    it('should generate progress bar', () => {
      const bar = CLIUtils.progressBar(50, 100);
      expect(bar).toContain('%');
      expect(bar).toContain('█');
      expect(bar).toContain('50%');
    });

    it('should show complete progress', () => {
      const bar = CLIUtils.progressBar(100, 100);
      expect(bar).toContain('100%');
    });
  });

  describe('parseArgs', () => {
    it('should parse long flags', () => {
      const result = CLIUtils.parseArgs(['--verbose', '--format', 'json']);
      expect(result.verbose).toBe(true);
      expect(result.format).toBe('json');
    });

    it('should parse short flags', () => {
      const result = CLIUtils.parseArgs(['-v', '-f']);
      expect(result.v).toBe(true);
      expect(result.f).toBe(true);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const result = CLIUtils.truncate('This is a very long string', 10);
      expect(result).toBe('This is...');
    });

    it('should not truncate short strings', () => {
      const result = CLIUtils.truncate('Short', 10);
      expect(result).toBe('Short');
    });
  });
});
