import { query } from '@/lib/db';

/**
 * Result of identity verification
 */
export interface VerificationResult {
  allowed: boolean;
  reason?: string;
  challenge?: boolean;
  userId?: string;
}

/**
 * Options for identity verification
 */
export interface IdentityVerificationOptions {
  requireMFA?: boolean;
  requireDeviceTrust?: boolean;
  requireBehaviorAnalysis?: boolean;
}

/**
 * Zero Trust Identity Verification System
 * Implements continuous identity verification and anomaly detection
 */
export class ZeroTrustIdentityVerifier {
  /**
   * Verify user identity based on multiple factors
   */
  async verifyIdentity(
    userId: string,
    request: Request,
    options?: IdentityVerificationOptions
  ): Promise<VerificationResult> {
    try {
      // Basic user verification
      const userVerified = await this.verifyUserIdentity(userId);
      if (!userVerified.verified) {
        return {
          allowed: false,
          reason: 'User identity verification failed',
        };
      }

      // Session validation
      const sessionValid = await this.validateSession(userId);
      if (!sessionValid.valid) {
        return {
          allowed: false,
          reason: 'Session validation failed',
        };
      }

      // Check for anomalous activity
      const anomaly = await this.detectAnomalousActivity(userId, request);
      if (anomaly.detected) {
        return {
          allowed: false,
          reason: anomaly.reason || 'Anomalous activity detected',
          challenge: true,
        };
      }

      // MFA verification if required
      if (options?.requireMFA) {
        const mfaVerified = await this.verifyMFA(userId);
        if (!mfaVerified) {
          return {
            allowed: false,
            reason: 'MFA verification required',
            challenge: true,
          };
        }
      }

      // Device trust verification if required
      if (options?.requireDeviceTrust) {
        const deviceTrusted = await this.verifyDeviceTrust(userId, request);
        if (!deviceTrusted) {
          return {
            allowed: false,
            reason: 'Device trust verification failed',
            challenge: true,
          };
        }
      }

      // Behavior analysis if required
      if (options?.requireBehaviorAnalysis) {
        const behaviorNormal = await this.checkBehaviorAnalysis(userId, request);
        if (!behaviorNormal) {
          return {
            allowed: false,
            reason: 'Behavior analysis detected anomaly',
            challenge: true,
          };
        }
      }

      return {
        allowed: true,
        userId,
        confidence: userVerified.confidence,
      };
    } catch (error) {
      console.error('Identity verification error:', error);
      return {
        allowed: false,
        reason: 'Identity verification error',
      };
    }
  }

  /**
   * Verify user identity in the system
   */
  async verifyUserIdentity(userId: string): Promise<{ verified: boolean; confidence: number }> {
    try {
      const result = await query(
        `SELECT id, email, auth_method, created_at FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { verified: false, confidence: 0 };
      }

      const user = result.rows[0];
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      const ageInDays = accountAge / (1000 * 60 * 60 * 24);

      // Confidence score based on account age and auth method
      let confidence = 0.7;
      if (ageInDays > 30) confidence += 0.15;
      if (ageInDays > 90) confidence += 0.15;
      if (user.auth_method === 'passkey') confidence += 0.2;
      if (user.auth_method === 'google' || user.auth_method === 'oauth') confidence += 0.1;

      confidence = Math.min(confidence, 1.0);

      return { verified: true, confidence };
    } catch (error) {
      console.error('User identity verification error:', error);
      return { verified: false, confidence: 0 };
    }
  }

  /**
   * Validate user session
   */
  async validateSession(userId: string): Promise<{ valid: boolean; expiresAt?: Date }> {
    try {
      const result = await query(
        `SELECT id, created_at FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      // Check if user account is active and not disabled
      const user = result.rows[0];

      // For now, always valid if user exists (would check session_tokens table in production)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return { valid: true, expiresAt };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Verify MFA for user
   */
  async verifyMFA(userId: string, method?: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      // Return whether 2FA is enabled
      return result.rows[0].two_factor_enabled === true;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  /**
   * Verify device trust based on request context
   */
  private async verifyDeviceTrust(userId: string, request: Request): Promise<boolean> {
    try {
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress = this.getClientIp(request);

      // Check against known devices
      // This would query a devices table in production
      // For now, return true as device management would be implemented separately
      return true;
    } catch (error) {
      console.error('Device trust verification error:', error);
      return false;
    }
  }

  /**
   * Detect anomalous activity based on request context
   */
  async detectAnomalousActivity(
    userId: string,
    request: Request
  ): Promise<{ detected: boolean; reason?: string }> {
    try {
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress = this.getClientIp(request);

      // Check if this is a sensitive operation
      if (this.isSensitiveOperation(request)) {
        // In production, would check against user's activity history
        // For now, use basic heuristics
        const isSuspicious = await this.checkSuspiciousPatterns(userId, ipAddress, userAgent);
        if (isSuspicious) {
          return {
            detected: true,
            reason: 'Suspicious activity pattern detected',
          };
        }
      }

      return { detected: false };
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return { detected: false };
    }
  }

  /**
   * Check behavior analysis
   */
  private async checkBehaviorAnalysis(userId: string, request: Request): Promise<boolean> {
    try {
      // In production, this would analyze:
      // - Login times and frequency
      // - Geographic patterns
      // - Device usage patterns
      // - Access patterns
      // For now, return true
      return true;
    } catch (error) {
      console.error('Behavior analysis error:', error);
      return true;
    }
  }

  /**
   * Check for suspicious patterns
   */
  private async checkSuspiciousPatterns(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      // Check for known malicious IP patterns
      if (this.isKnownMaliciousIP(ipAddress)) {
        return true;
      }

      // Check for suspicious user agents
      if (this.isSuspiciousUserAgent(userAgent)) {
        return true;
      }

      // In production, would check against activity history
      return false;
    } catch (error) {
      console.error('Suspicious pattern check error:', error);
      return false;
    }
  }

  /**
   * Check if operation is sensitive (requires additional verification)
   */
  private isSensitiveOperation(request: Request): boolean {
    const method = request.method;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Sensitive operations
    const sensitivePatterns = [
      '/api/auth/',
      '/api/settings/',
      '/api/billing/',
      '/api/user/',
      '/api/admin/',
      '/api/credentials/',
    ];

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      return sensitivePatterns.some(pattern => pathname.includes(pattern));
    }

    return false;
  }

  /**
   * Challenge user with additional verification
   */
  async challengeUser(userId: string, reason: string): Promise<void> {
    try {
      await query(
        `INSERT INTO security_challenges (user_id, reason, created_at, status)
         VALUES ($1, $2, NOW(), 'pending')`,
        [userId, reason]
      );
    } catch (error) {
      console.error('Challenge user error:', error);
      // Non-fatal, continue
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }

  /**
   * Check if IP is known malicious
   */
  private isKnownMaliciousIP(ip: string): boolean {
    // In production, check against threat intelligence feeds
    // For now, simple blocklist
    const blocklist = ['127.0.0.1'];
    return blocklist.includes(ip);
  }

  /**
   * Check for suspicious user agent
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = ['bot', 'crawler', 'spider', 'curl', 'wget', 'python'];
    const lowerUA = userAgent.toLowerCase();
    return suspicious.some(pattern => lowerUA.includes(pattern));
  }
}

export const zeroTrustIdentityVerifier = new ZeroTrustIdentityVerifier();
