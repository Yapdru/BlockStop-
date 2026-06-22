/**
 * Tests for URL Analyzer
 */

import * as URLAnalyzer from '../modules/url-analyzer.js';
import * as DomainAnalyzer from '../modules/domain-analyzer.js';

describe('URL Analyzer', () => {
  describe('parseURL', () => {
    it('should parse valid URL', () => {
      const result = URLAnalyzer.parseURL('https://example.com/path?param=value');

      expect(result.url).toBeDefined();
      expect(result.domain).toBe('example.com');
      expect(result.path).toBe('/path');
      expect(result.parameters.param).toBe('value');
    });

    it('should handle invalid URL', () => {
      const result = URLAnalyzer.parseURL('not a url');

      expect(result.url).toBeNull();
      expect(result.domain).toBeNull();
    });
  });

  describe('analyzeURLPath', () => {
    it('should detect phishing keywords in path', () => {
      const result = URLAnalyzer.analyzeURLPath('/login/verify', 'example.com');

      expect(result.suspiciousIndicators.length).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect encoded characters', () => {
      const result = URLAnalyzer.analyzeURLPath('/path%20with%20encoded', 'example.com');

      expect(result.suspiciousIndicators.some(i => i.includes('encoded'))).toBe(true);
    });
  });

  describe('analyzeScheme', () => {
    it('should identify HTTPS as secure', () => {
      const result = URLAnalyzer.analyzeScheme('https://example.com');

      expect(result.isSecure).toBe(true);
      expect(result.scheme).toBe('https');
    });

    it('should flag HTTP as insecure', () => {
      const result = URLAnalyzer.analyzeScheme('http://example.com');

      expect(result.isSecure).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeURL', () => {
    it('should analyze safe URL', () => {
      const result = URLAnalyzer.analyzeURL('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.domain).toBe('example.com');
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should detect suspicious URLs', () => {
      const result = URLAnalyzer.analyzeURL('http://192.168.1.1/login/verify');

      expect(result.riskLevel).not.toBe('SAFE');
      expect(result.threats.length).toBeGreaterThan(0);
    });

    it('should warn about shorteners', () => {
      const result = URLAnalyzer.analyzeURL('https://bit.ly/test123');

      expect(result.threats.some(t => t.type.includes('SUSPICIOUS'))).toBe(true);
    });
  });

  describe('formatAnalysis', () => {
    it('should format URL analysis', () => {
      const result = URLAnalyzer.analyzeURL('https://example.com');
      const formatted = URLAnalyzer.formatAnalysis(result);

      expect(formatted).toContain('URL Security Analysis');
      expect(formatted).toContain('https://example.com');
      expect(formatted).toContain('Recommendation');
    });
  });
});

describe('Domain Analyzer', () => {
  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      const result = DomainAnalyzer.extractDomain('https://subdomain.example.com/path');

      expect(result).toBe('subdomain.example.com');
    });

    it('should handle invalid URLs', () => {
      const result = DomainAnalyzer.extractDomain('not a url');

      expect(result).toBeNull();
    });
  });

  describe('isShortener', () => {
    it('should detect shortener domains', () => {
      expect(DomainAnalyzer.isShortener('bit.ly')).toBe(true);
      expect(DomainAnalyzer.isShortener('tinyurl.com')).toBe(true);
    });

    it('should not flag normal domains', () => {
      expect(DomainAnalyzer.isShortener('example.com')).toBe(false);
    });
  });

  describe('isIPAddress', () => {
    it('should detect IPv4 addresses', () => {
      expect(DomainAnalyzer.isIPAddress('192.168.1.1')).toBe(true);
      expect(DomainAnalyzer.isIPAddress('8.8.8.8')).toBe(true);
    });

    it('should reject domain names', () => {
      expect(DomainAnalyzer.isIPAddress('example.com')).toBe(false);
    });
  });

  describe('detectHomographAttack', () => {
    it('should detect Cyrillic characters', () => {
      expect(DomainAnalyzer.detectHomographAttack('аmazon.com')).toBe(true);
    });

    it('should not flag normal domains', () => {
      expect(DomainAnalyzer.detectHomographAttack('amazon.com')).toBe(false);
    });
  });

  describe('calculateEntropy', () => {
    it('should calculate domain entropy', () => {
      const random = DomainAnalyzer.calculateEntropy('xyzabc123');
      const common = DomainAnalyzer.calculateEntropy('aaaaaa');

      expect(random).toBeGreaterThan(common);
    });
  });

  describe('hasUnusualSubdomainDepth', () => {
    it('should detect excessive subdomain levels', () => {
      expect(DomainAnalyzer.hasUnusualSubdomainDepth('a.b.c.d.e.example.com')).toBe(true);
    });

    it('should allow normal subdomains', () => {
      expect(DomainAnalyzer.hasUnusualSubdomainDepth('sub.example.com')).toBe(false);
    });
  });

  describe('checkSuspiciousTLD', () => {
    it('should detect suspicious TLDs', () => {
      expect(DomainAnalyzer.checkSuspiciousTLD('example.tk')).toBe(true);
      expect(DomainAnalyzer.checkSuspiciousTLD('example.ml')).toBe(true);
    });

    it('should allow legitimate TLDs', () => {
      expect(DomainAnalyzer.checkSuspiciousTLD('example.com')).toBe(false);
    });
  });

  describe('analyzeDomain', () => {
    it('should analyze safe domain', () => {
      const result = DomainAnalyzer.analyzeDomain('example.com');

      expect(result.domain).toBe('example.com');
      expect(result.riskScore).toBeLessThan(30);
    });

    it('should flag IP-based domains', () => {
      const result = DomainAnalyzer.analyzeDomain('192.168.1.1');

      expect(result.indicators.isIP).toBe(true);
      expect(result.riskScore).toBeGreaterThan(20);
    });

    it('should flag shortener domains', () => {
      const result = DomainAnalyzer.analyzeDomain('bit.ly');

      expect(result.indicators.isShortener).toBe(true);
      expect(result.riskScore).toBeGreaterThan(10);
    });
  });
});
