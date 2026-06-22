/**
 * Tests for Email Scanner
 */

import EmailScanner from '../modules/email-scanner.js';
import * as EmailUtils from '../modules/email-utils.js';

describe('Email Scanner', () => {
  const sampleEmail = `From: attacker@evil.com
To: victim@example.com
Subject: Urgent Action Required
MIME-Version: 1.0
Content-Type: text/plain

Click here to verify your account immediately!
This is urgent action required.`;

  describe('scanEmail', () => {
    it('should scan valid email', async () => {
      const result = await EmailScanner.scanEmail(sampleEmail);

      expect(result.sender).toBeDefined();
      expect(result.sender?.email).toBe('attacker@evil.com');
      expect(result.subject).toBe('Urgent Action Required');
      expect(result.recipients).toBeDefined();
    });

    it('should detect phishing keywords', async () => {
      const result = await EmailScanner.scanEmail(sampleEmail);

      expect(result.analysis.threats.length).toBeGreaterThan(0);
      expect(result.analysis.riskLevel).not.toBe('SAFE');
    });

    it('should throw error for invalid email', async () => {
      await expect(EmailScanner.scanEmail('')).rejects.toThrow();
    });

    it('should handle email with attachments', async () => {
      const emailWithAttachment = `From: sender@example.com
To: recipient@example.com
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="boundary123"

--boundary123
Content-Type: text/plain

Email body

--boundary123
Content-Type: application/x-msdownload; name="malware.exe"
Content-Disposition: attachment; filename="malware.exe"

--boundary123--`;

      const result = await EmailScanner.scanEmail(emailWithAttachment);
      expect(result.attachments.length).toBeGreaterThan(0);
    });
  });

  describe('formatResult', () => {
    it('should format scan result', async () => {
      const result = await EmailScanner.scanEmail(sampleEmail);
      const formatted = EmailScanner.formatResult(result);

      expect(formatted).toContain('Email Security Analysis');
      expect(formatted).toContain('attacker@evil.com');
      expect(formatted).toContain('Risk Assessment');
    });
  });

  describe('getRecommendation', () => {
    it('should recommend safe emails', () => {
      const rec = EmailScanner.getRecommendation('SAFE');
      expect(rec).toContain('safe');
    });

    it('should warn about critical emails', () => {
      const rec = EmailScanner.getRecommendation('CRITICAL');
      expect(rec).toContain('Critical');
    });
  });

  describe('getRiskIndicator', () => {
    it('should return correct emoji for risk level', () => {
      expect(EmailScanner.getRiskIndicator('SAFE')).toBe('✅');
      expect(EmailScanner.getRiskIndicator('CRITICAL')).toBe('🔴');
      expect(EmailScanner.getRiskIndicator('MEDIUM')).toBe('🟡');
    });
  });
});

describe('Email Utils', () => {
  describe('validateEmailAddress', () => {
    it('should validate correct email', () => {
      expect(EmailUtils.validateEmailAddress('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(EmailUtils.validateEmailAddress('invalid@')).toBe(false);
      expect(EmailUtils.validateEmailAddress('no-at-sign')).toBe(false);
    });
  });

  describe('parseEmailAddress', () => {
    it('should parse simple email', () => {
      const result = EmailUtils.parseEmailAddress('test@example.com');
      expect(result?.email).toBe('test@example.com');
    });

    it('should parse email with name', () => {
      const result = EmailUtils.parseEmailAddress('John Doe <john@example.com>');
      expect(result?.email).toBe('john@example.com');
      expect(result?.name).toBe('John Doe');
    });
  });

  describe('extractURLs', () => {
    it('should extract URLs from text', () => {
      const text = 'Visit https://example.com and http://test.com';
      const urls = EmailUtils.extractURLs(text);

      expect(urls.length).toBe(2);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('http://test.com');
    });
  });

  describe('checkShorteners', () => {
    it('should detect shortener URLs', () => {
      expect(EmailUtils.checkShorteners('https://bit.ly/test')).toBe(true);
      expect(EmailUtils.checkShorteners('https://tinyurl.com/test')).toBe(true);
    });

    it('should not flag normal URLs', () => {
      expect(EmailUtils.checkShorteners('https://example.com')).toBe(false);
    });
  });

  describe('extractEmailHeaders', () => {
    it('should extract headers from email', () => {
      const email = `From: sender@example.com
To: recipient@example.com
Subject: Test

Body`;

      const headers = EmailUtils.extractEmailHeaders(email);
      expect(headers.from).toBe('sender@example.com');
      expect(headers.to).toBe('recipient@example.com');
      expect(headers.subject).toBe('Test');
    });
  });

  describe('analyzeSPF', () => {
    it('should analyze SPF', () => {
      const headers: EmailUtils.EmailHeader = {
        'authentication-results': 'spf=pass',
      };

      const result = EmailUtils.analyzeSPF(headers);
      expect(result.valid).toBe(true);
    });
  });

  describe('analyzeDKIM', () => {
    it('should analyze DKIM', () => {
      const headers: EmailUtils.EmailHeader = {
        'authentication-results': 'dkim=pass',
      };

      const result = EmailUtils.analyzeDKIM(headers);
      expect(result.valid).toBe(true);
    });
  });

  describe('analyzeDMARC', () => {
    it('should analyze DMARC', () => {
      const headers: EmailUtils.EmailHeader = {
        'authentication-results': 'dmarc=pass',
      };

      const result = EmailUtils.analyzeDMARC(headers);
      expect(result.compliant).toBe(true);
    });
  });
});
