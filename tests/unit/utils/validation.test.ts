/**
 * Validation Utilities Tests
 *
 * Tests for validation utility functions including:
 * - Email validation
 * - URL validation
 * - File validation
 * - Risk score validation
 * - Schema validation
 */

/**
 * Mock validation utilities
 */
const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate domain
   */
  isValidDomain: (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  },

  /**
   * Validate file size
   */
  isValidFileSize: (sizeInBytes: number, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  },

  /**
   * Validate file type
   */
  isValidFileType: (fileName: string, allowedTypes: string[]): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return allowedTypes.some((type) => {
      if (type.includes('*')) {
        const mimeType = type.split('/')[0];
        return extension === mimeType;
      }
      return extension === type.replace('.', '');
    });
  },

  /**
   * Validate risk score
   */
  isValidRiskScore: (score: number): boolean => {
    return score >= 0 && score <= 100;
  },

  /**
   * Validate IP address
   */
  isValidIP: (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^[0-9a-f]{0,4}(:[0-9a-f]{0,4}){7}$/i;

    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    return ipv6Regex.test(ip);
  },

  /**
   * Validate credit card number (Luhn algorithm)
   */
  isValidCreditCard: (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10;
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDate: (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Validate strong password
   */
  isStrongPassword: (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password)
    );
  },

  /**
   * Validate required fields
   */
  validateRequired: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  /**
   * Validate field length
   */
  validateLength: (
    value: string,
    minLength?: number,
    maxLength?: number
  ): boolean => {
    if (minLength && value.length < minLength) return false;
    if (maxLength && value.length > maxLength) return false;
    return true;
  },

  /**
   * Validate pattern match
   */
  validatePattern: (value: string, pattern: RegExp | string): boolean => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(value);
  },
};

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      expect(validationUtils.isValidEmail('user@example.com')).toBe(true);
      expect(validationUtils.isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(validationUtils.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validationUtils.isValidEmail('invalid')).toBe(false);
      expect(validationUtils.isValidEmail('user@')).toBe(false);
      expect(validationUtils.isValidEmail('@example.com')).toBe(false);
      expect(validationUtils.isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validationUtils.isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URL format', () => {
      expect(validationUtils.isValidUrl('https://example.com')).toBe(true);
      expect(validationUtils.isValidUrl('http://www.example.com')).toBe(true);
      expect(validationUtils.isValidUrl('https://example.com:8080/path')).toBe(true);
    });

    it('should reject invalid URL format', () => {
      expect(validationUtils.isValidUrl('not a url')).toBe(false);
      expect(validationUtils.isValidUrl('example.com')).toBe(false);
      expect(validationUtils.isValidUrl('ht!tp://example.com')).toBe(false);
    });
  });

  describe('Domain Validation', () => {
    it('should validate correct domain format', () => {
      expect(validationUtils.isValidDomain('example.com')).toBe(true);
      expect(validationUtils.isValidDomain('sub.example.com')).toBe(true);
      expect(validationUtils.isValidDomain('test-domain.co.uk')).toBe(true);
    });

    it('should reject invalid domain format', () => {
      expect(validationUtils.isValidDomain('-example.com')).toBe(false);
      expect(validationUtils.isValidDomain('example-.com')).toBe(false);
      expect(validationUtils.isValidDomain('.example.com')).toBe(false);
    });
  });

  describe('File Validation', () => {
    describe('File Size', () => {
      it('should validate file size within limit', () => {
        const maxSize = 10; // 10 MB
        expect(validationUtils.isValidFileSize(5 * 1024 * 1024, maxSize)).toBe(true);
        expect(validationUtils.isValidFileSize(10 * 1024 * 1024, maxSize)).toBe(true);
      });

      it('should reject file size exceeding limit', () => {
        const maxSize = 10; // 10 MB
        expect(validationUtils.isValidFileSize(11 * 1024 * 1024, maxSize)).toBe(false);
      });

      it('should handle zero size', () => {
        expect(validationUtils.isValidFileSize(0, 10)).toBe(true);
      });
    });

    describe('File Type', () => {
      it('should validate allowed file types', () => {
        const allowedTypes = ['pdf', 'doc', 'docx'];
        expect(validationUtils.isValidFileType('document.pdf', allowedTypes)).toBe(true);
        expect(validationUtils.isValidFileType('file.doc', allowedTypes)).toBe(true);
      });

      it('should reject disallowed file types', () => {
        const allowedTypes = ['pdf', 'doc'];
        expect(validationUtils.isValidFileType('script.exe', allowedTypes)).toBe(false);
        expect(validationUtils.isValidFileType('archive.zip', allowedTypes)).toBe(false);
      });

      it('should handle case-insensitive file types', () => {
        const allowedTypes = ['pdf'];
        expect(validationUtils.isValidFileType('document.PDF', allowedTypes)).toBe(true);
      });
    });
  });

  describe('Risk Score Validation', () => {
    it('should validate valid risk scores', () => {
      expect(validationUtils.isValidRiskScore(0)).toBe(true);
      expect(validationUtils.isValidRiskScore(50)).toBe(true);
      expect(validationUtils.isValidRiskScore(100)).toBe(true);
    });

    it('should reject invalid risk scores', () => {
      expect(validationUtils.isValidRiskScore(-1)).toBe(false);
      expect(validationUtils.isValidRiskScore(101)).toBe(false);
      expect(validationUtils.isValidRiskScore(-50)).toBe(false);
    });
  });

  describe('IP Address Validation', () => {
    it('should validate valid IPv4 addresses', () => {
      expect(validationUtils.isValidIP('192.168.1.1')).toBe(true);
      expect(validationUtils.isValidIP('10.0.0.1')).toBe(true);
      expect(validationUtils.isValidIP('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(validationUtils.isValidIP('256.1.1.1')).toBe(false);
      expect(validationUtils.isValidIP('192.168.1')).toBe(false);
      expect(validationUtils.isValidIP('not.an.ip.address')).toBe(false);
    });

    it('should validate valid IPv6 addresses', () => {
      expect(validationUtils.isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });
  });

  describe('Credit Card Validation', () => {
    it('should validate valid credit card number', () => {
      // Valid test card number
      expect(validationUtils.isValidCreditCard('4532015112830366')).toBe(true);
    });

    it('should reject invalid credit card number', () => {
      expect(validationUtils.isValidCreditCard('1234567890123456')).toBe(false);
      expect(validationUtils.isValidCreditCard('123')).toBe(false);
    });

    it('should handle different card formats', () => {
      expect(validationUtils.isValidCreditCard('4532-0151-1283-0366')).toBe(true);
      expect(validationUtils.isValidCreditCard('4532 0151 1283 0366')).toBe(true);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate valid phone numbers', () => {
      expect(validationUtils.isValidPhoneNumber('1234567890')).toBe(true);
      expect(validationUtils.isValidPhoneNumber('+1234567890')).toBe(true);
      expect(validationUtils.isValidPhoneNumber('(123) 456-7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validationUtils.isValidPhoneNumber('12345')).toBe(false);
      expect(validationUtils.isValidPhoneNumber('abcdefghij')).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should validate valid date format', () => {
      expect(validationUtils.isValidDate('2024-01-15')).toBe(true);
      expect(validationUtils.isValidDate('2024-12-31')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(validationUtils.isValidDate('01/15/2024')).toBe(false);
      expect(validationUtils.isValidDate('2024-13-01')).toBe(false);
      expect(validationUtils.isValidDate('2024-02-30')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(validationUtils.isValidDate('not-a-date')).toBe(false);
    });
  });

  describe('Password Strength', () => {
    it('should validate strong passwords', () => {
      expect(validationUtils.isStrongPassword('StrongPass123!')).toBe(true);
      expect(validationUtils.isStrongPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validationUtils.isStrongPassword('weak')).toBe(false);
      expect(validationUtils.isStrongPassword('password123')).toBe(false);
      expect(validationUtils.isStrongPassword('PASSWORD123!')).toBe(false);
      expect(validationUtils.isStrongPassword('Password!')).toBe(false);
    });
  });

  describe('Required Fields', () => {
    it('should validate required string fields', () => {
      expect(validationUtils.validateRequired('text')).toBe(true);
      expect(validationUtils.validateRequired('   text   ')).toBe(true);
    });

    it('should reject empty string fields', () => {
      expect(validationUtils.validateRequired('')).toBe(false);
      expect(validationUtils.validateRequired('   ')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validationUtils.validateRequired(null)).toBe(false);
      expect(validationUtils.validateRequired(undefined)).toBe(false);
    });

    it('should validate required array fields', () => {
      expect(validationUtils.validateRequired([1, 2, 3])).toBe(true);
      expect(validationUtils.validateRequired([])).toBe(false);
    });
  });

  describe('Field Length', () => {
    it('should validate minimum length', () => {
      expect(validationUtils.validateLength('hello', 3)).toBe(true);
      expect(validationUtils.validateLength('hi', 3)).toBe(false);
    });

    it('should validate maximum length', () => {
      expect(validationUtils.validateLength('hello', undefined, 10)).toBe(true);
      expect(validationUtils.validateLength('hello world', undefined, 5)).toBe(false);
    });

    it('should validate range', () => {
      expect(validationUtils.validateLength('hello', 3, 10)).toBe(true);
      expect(validationUtils.validateLength('hi', 3, 10)).toBe(false);
      expect(validationUtils.validateLength('hello world!!!', 3, 10)).toBe(false);
    });
  });

  describe('Pattern Matching', () => {
    it('should validate pattern with RegExp', () => {
      const alphanumericPattern = /^[a-zA-Z0-9]+$/;
      expect(validationUtils.validatePattern('abc123', alphanumericPattern)).toBe(true);
      expect(validationUtils.validatePattern('abc-123', alphanumericPattern)).toBe(false);
    });

    it('should validate pattern with string', () => {
      expect(validationUtils.validatePattern('abc123', '^[a-zA-Z0-9]+$')).toBe(true);
      expect(validationUtils.validatePattern('abc-123', '^[a-zA-Z0-9]+$')).toBe(false);
    });
  });
});
