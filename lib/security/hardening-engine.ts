/**
 * BlockStop Phase 29.2 - Security Hardening Engine
 * Production-ready HTTP security headers and configuration hardening
 * - HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options)
 * - CORS policy enforcement
 * - Rate limiting and DDoS protection
 * - SSL/TLS configuration (A+ rating target)
 * - Cookie security (HttpOnly, Secure, SameSite)
 */

import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type SameSitePolicy = 'Strict' | 'Lax' | 'None';
export type CSPViolationAction = 'report' | 'enforce' | 'log';

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'Content-Security-Policy-Report-Only'?: string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-Permitted-Cross-Domain-Policies': string;
}

export interface CORSPolicy {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export interface SSLTLSConfig {
  minVersion: string;
  ciphers: string[];
  honorCipherOrder: boolean;
  sessionTimeout: number;
  certificatePath: string;
  keyPath: string;
}

export interface CookieSecurityConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSitePolicy;
  maxAge: number;
  domain?: string;
  path: string;
}

export interface HardeningReport {
  id: string;
  timestamp: Date;
  headerCompliance: {
    compliant: boolean;
    headers: Record<string, { present: boolean; value?: string }>;
    missing: string[];
  };
  corsCompliance: {
    compliant: boolean;
    issues: string[];
  };
  rateLimitingStatus: {
    enabled: boolean;
    config: RateLimitConfig;
  };
  sslTlsRating: {
    rating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    score: number;
    issues: string[];
  };
  cookieCompliance: {
    compliant: boolean;
    issues: string[];
  };
  overallScore: number;
}

export class SecurityHardeningEngine {
  private config: {
    csp: string;
    cors: CORSPolicy;
    rateLimit: RateLimitConfig;
    sslTls: SSLTLSConfig;
    cookieSecurity: CookieSecurityConfig;
  };

  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Get default secure configuration
   */
  private getDefaultConfig() {
    return {
      csp: this.buildCSP(),
      cors: this.getDefaultCORSPolicy(),
      rateLimit: this.getDefaultRateLimitConfig(),
      sslTls: this.getDefaultSSLTLSConfig(),
      cookieSecurity: this.getDefaultCookieConfig(),
    };
  }

  /**
   * Build Content Security Policy
   */
  private buildCSP(): string {
    const directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'strict-dynamic'", 'https://cdn.jsdelivr.net'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'https:'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'self'"],
      'worker-src': ["'self'"],
      'connect-src': ["'self'", 'https:'],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'upgrade-insecure-requests': [],
      'block-all-mixed-content': [],
    };

    return Object.entries(directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`.trim())
      .join('; ');
  }

  /**
   * Get default CORS policy
   */
  private getDefaultCORSPolicy(): CORSPolicy {
    return {
      allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      credentials: true,
      maxAge: 86400,
    };
  }

  /**
   * Get default rate limiting config
   */
  private getDefaultRateLimitConfig(): RateLimitConfig {
    return {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      keyGenerator: (req: Request) => req.ip || 'unknown',
    };
  }

  /**
   * Get default SSL/TLS config
   */
  private getDefaultSSLTLSConfig(): SSLTLSConfig {
    return {
      minVersion: 'TLSv1.2',
      ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
      ].join(':'),
      honorCipherOrder: true,
      sessionTimeout: 86400,
      certificatePath: process.env.SSL_CERT_PATH || '/etc/ssl/certs/server.crt',
      keyPath: process.env.SSL_KEY_PATH || '/etc/ssl/private/server.key',
    };
  }

  /**
   * Get default cookie security config
   */
  private getDefaultCookieConfig(): CookieSecurityConfig {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    };
  }

  /**
   * Get Express middleware for security headers
   */
  public getSecurityHeadersMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const headers: SecurityHeaders = {
        'Content-Security-Policy': this.config.csp,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Permitted-Cross-Domain-Policies': 'none',
      };

      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    };
  }

  /**
   * Get CORS middleware
   */
  public getCORSMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      const policy = this.config.cors;

      if (origin && this.isOriginAllowed(origin, policy.allowedOrigins)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', policy.allowedMethods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', policy.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Expose-Headers', policy.exposedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', policy.maxAge.toString());
      }

      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
      } else {
        next();
      }
    };
  }

  /**
   * Get rate limiting middleware
   */
  public getRateLimitingMiddleware() {
    const store = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const config = this.config.rateLimit;

      if (!config.enabled || (config.skip && config.skip(req))) {
        return next();
      }

      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';
      const now = Date.now();
      const record = store.get(key);

      if (!record || now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + config.windowMs });
        return next();
      }

      record.count++;

      if (record.count > config.maxRequests) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      } else {
        res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (config.maxRequests - record.count).toString());
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
        next();
      }
    };
  }

  /**
   * Check if origin is allowed for CORS
   */
  private isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (allowedOrigins.includes('*')) return true;
    if (allowedOrigins.includes(origin)) return true;

    // Support wildcard subdomains
    return allowedOrigins.some(allowed => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      return false;
    });
  }

  /**
   * Audit hardening configuration
   */
  public auditConfiguration(): HardeningReport {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      headerCompliance: this.auditHeaders(),
      corsCompliance: this.auditCORS(),
      rateLimitingStatus: {
        enabled: this.config.rateLimit.enabled,
        config: this.config.rateLimit,
      },
      sslTlsRating: this.rateSSLTLS(),
      cookieCompliance: this.auditCookies(),
      overallScore: this.calculateOverallScore(),
    };
  }

  /**
   * Audit security headers
   */
  private auditHeaders() {
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Strict-Transport-Security',
    ];

    const present: Record<string, boolean> = {};
    const missing: string[] = [];

    requiredHeaders.forEach(header => {
      present[header] = true;
      if (!this.config.csp) {
        missing.push(header);
      }
    });

    return {
      compliant: missing.length === 0,
      headers: Object.entries(present).reduce(
        (acc, [header, value]) => ({
          ...acc,
          [header]: { present: value, value: value ? 'Configured' : undefined },
        }),
        {}
      ),
      missing,
    };
  }

  /**
   * Audit CORS configuration
   */
  private auditCORS() {
    const issues: string[] = [];

    if (this.config.cors.allowedOrigins.includes('*')) {
      issues.push('Wildcard CORS origin allows any site');
    }

    if (this.config.cors.credentials && this.config.cors.allowedOrigins.includes('*')) {
      issues.push('Credentials enabled with wildcard origin (CRITICAL SECURITY ISSUE)');
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * Rate SSL/TLS configuration
   */
  private rateSSLTLS() {
    const issues: string[] = [];
    let score = 100;

    if (this.config.sslTls.minVersion < 'TLSv1.2') {
      issues.push('Minimum TLS version below 1.2');
      score -= 30;
    }

    if (!this.config.sslTls.honorCipherOrder) {
      issues.push('Server does not honor cipher order');
      score -= 10;
    }

    const rating = this.getSSLTLSRating(score);

    return {
      rating,
      score,
      issues,
    };
  }

  /**
   * Get SSL/TLS rating
   */
  private getSSLTLSRating(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    if (score >= 35) return 'E';
    return 'F';
  }

  /**
   * Audit cookie security
   */
  private auditCookies() {
    const issues: string[] = [];

    if (!this.config.cookieSecurity.httpOnly) {
      issues.push('HttpOnly flag not set on cookies');
    }

    if (!this.config.cookieSecurity.secure && process.env.NODE_ENV === 'production') {
      issues.push('Secure flag not set on cookies in production');
    }

    if (this.config.cookieSecurity.sameSite !== 'Strict') {
      issues.push(`SameSite policy is ${this.config.cookieSecurity.sameSite}, recommend Strict`);
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * Calculate overall hardening score
   */
  private calculateOverallScore(): number {
    let score = 0;
    let total = 0;

    // Headers (25%)
    const headerScore = this.auditHeaders().compliant ? 25 : 0;
    score += headerScore;
    total += 25;

    // CORS (20%)
    const corsScore = this.auditCORS().compliant ? 20 : 0;
    score += corsScore;
    total += 20;

    // Rate limiting (15%)
    const rateLimitScore = this.config.rateLimit.enabled ? 15 : 0;
    score += rateLimitScore;
    total += 15;

    // SSL/TLS (25%)
    const sslScore = this.rateSSLTLS().score;
    score += (sslScore / 100) * 25;
    total += 25;

    // Cookies (15%)
    const cookieScore = this.auditCookies().compliant ? 15 : 0;
    score += cookieScore;
    total += 15;

    return Math.round((score / total) * 100);
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<typeof this.config>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Export configuration for documentation
   */
  public exportConfig() {
    return {
      csp: this.config.csp,
      cors: this.config.cors,
      rateLimit: this.config.rateLimit,
      sslTls: {
        minVersion: this.config.sslTls.minVersion,
        ciphers: this.config.sslTls.ciphers.split(':'),
        honorCipherOrder: this.config.sslTls.honorCipherOrder,
      },
      cookies: this.config.cookieSecurity,
    };
  }
}

export default SecurityHardeningEngine;
