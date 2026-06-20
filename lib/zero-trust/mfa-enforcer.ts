import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { query } from '@/lib/db';

/**
 * MFA Method configuration
 */
export interface MFAMethod {
  type: 'totp' | 'sms' | 'email' | 'hardware' | 'biometric';
  verified: boolean;
  verifiedAt?: Date;
  nextVerificationRequired?: Date;
}

/**
 * MFA Enforcer for Zero Trust Architecture
 * Enforces multi-factor authentication requirements
 */
export class MFAEnforcer {
  /**
   * Check if MFA is required for user and return available methods
   */
  async requireMFA(
    userId: string,
    method?: string
  ): Promise<{ required: boolean; methods: MFAMethod[] }> {
    try {
      const result = await query(
        `SELECT two_factor_enabled, updated_at FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { required: false, methods: [] };
      }

      const user = result.rows[0];
      const isTwoFactorEnabled = user.two_factor_enabled === true;

      // Get available MFA methods for user
      const methods: MFAMethod[] = [];

      if (isTwoFactorEnabled) {
        methods.push({
          type: 'totp',
          verified: true,
          verifiedAt: new Date(user.updated_at),
        });
      }

      // Add other available methods (would come from user's configured methods table)
      const availableMethods = await this.getAvailableMethods(userId);
      methods.push(...availableMethods);

      return {
        required: isTwoFactorEnabled,
        methods: methods.length > 0 ? methods : this.getDefaultMethods(),
      };
    } catch (error) {
      console.error('MFA requirement check error:', error);
      return { required: false, methods: this.getDefaultMethods() };
    }
  }

  /**
   * Verify MFA code for user
   */
  async verifyMFACode(userId: string, code: string, method: string): Promise<boolean> {
    try {
      switch (method) {
        case 'totp':
          return await this.verifyTOTPCode(userId, code);
        case 'backup':
          return await this.verifyBackupCode(userId, code);
        case 'sms':
          return await this.verifySMSCode(userId, code);
        case 'email':
          return await this.verifyEmailCode(userId, code);
        default:
          return false;
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  /**
   * Verify TOTP code
   */
  private async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT two_factor_secret FROM users WHERE id = $1 AND two_factor_enabled = true`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const secret = result.rows[0].two_factor_secret;

      // Verify TOTP token
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (isValid) {
        // Update last MFA verification time
        await query(
          `UPDATE users SET mfa_last_verified = NOW() WHERE id = $1`,
          [userId]
        );
      }

      return isValid;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT two_factor_backup_codes FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const codes = result.rows[0].two_factor_backup_codes || [];

      if (!codes.includes(code)) {
        return false;
      }

      // Remove used code
      const updatedCodes = codes.filter((c: string) => c !== code);

      await query(
        `UPDATE users SET two_factor_backup_codes = $1, mfa_last_verified = NOW() WHERE id = $2`,
        [updatedCodes, userId]
      );

      return true;
    } catch (error) {
      console.error('Backup code verification error:', error);
      return false;
    }
  }

  /**
   * Verify SMS code (placeholder - would integrate with SMS service)
   */
  private async verifySMSCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT sms_code, sms_code_expires_at FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const user = result.rows[0];
      const now = new Date();

      if (user.sms_code !== code || new Date(user.sms_code_expires_at) < now) {
        return false;
      }

      // Clear code after successful verification
      await query(
        `UPDATE users SET sms_code = NULL, sms_code_expires_at = NULL, mfa_last_verified = NOW() WHERE id = $1`,
        [userId]
      );

      return true;
    } catch (error) {
      console.error('SMS code verification error:', error);
      return false;
    }
  }

  /**
   * Verify email code (placeholder - would check email verification table)
   */
  private async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT id FROM users WHERE id = $1 AND email_verification_code = $2 AND email_verification_expires_at > NOW()`,
        [userId, code]
      );

      if (result.rows.length === 0) {
        return false;
      }

      // Clear code after successful verification
      await query(
        `UPDATE users SET email_verification_code = NULL, email_verification_expires_at = NULL, mfa_last_verified = NOW() WHERE id = $1`,
        [userId]
      );

      return true;
    } catch (error) {
      console.error('Email code verification error:', error);
      return false;
    }
  }

  /**
   * Enroll new MFA method for user
   */
  async enrollMFAMethod(userId: string, methodType: string): Promise<{ secret?: string; qrCode?: string }> {
    try {
      if (methodType === 'totp') {
        return await this.enrollTOTP(userId);
      } else if (methodType === 'sms') {
        return { secret: 'sms_enrollment_initiated' };
      } else if (methodType === 'email') {
        return { secret: 'email_enrollment_initiated' };
      }

      return {};
    } catch (error) {
      console.error('MFA enrollment error:', error);
      throw error;
    }
  }

  /**
   * Enroll TOTP method
   */
  private async enrollTOTP(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      const result = await query(
        `SELECT email FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const email = result.rows[0].email;

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `BlockStop Zero Trust (${email})`,
        issuer: 'BlockStop',
        length: 32,
      });

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

      // Store temporary secret (not yet verified)
      await query(
        `UPDATE users SET totp_temp_secret = $2, totp_temp_secret_expires_at = NOW() + INTERVAL '10 minutes' WHERE id = $1`,
        [userId, secret.base32]
      );

      return {
        secret: secret.base32,
        qrCode,
      };
    } catch (error) {
      console.error('TOTP enrollment error:', error);
      throw error;
    }
  }

  /**
   * Revoke MFA method for user
   */
  async revokeMFAMethod(userId: string, method: string): Promise<void> {
    try {
      if (method === 'totp' || method === 'all') {
        await query(
          `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = $1`,
          [userId]
        );
      }

      if (method === 'sms' || method === 'all') {
        await query(
          `UPDATE users SET sms_enabled = false, phone_number = NULL WHERE id = $1`,
          [userId]
        );
      }

      if (method === 'email' || method === 'all') {
        await query(
          `UPDATE users SET email_mfa_enabled = false WHERE id = $1`,
          [userId]
        );
      }

      // Log revocation event
      await query(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'mfa_revoked', `Method: ${method}`]
      );
    } catch (error) {
      console.error('MFA revocation error:', error);
      throw error;
    }
  }

  /**
   * Check if MFA is enforced for user
   */
  async isMFAEnforced(userId: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      return result.rows[0].two_factor_enabled === true;
    } catch (error) {
      console.error('MFA enforcement check error:', error);
      return false;
    }
  }

  /**
   * Get available MFA methods for user
   */
  private async getAvailableMethods(userId: string): Promise<MFAMethod[]> {
    try {
      const methods: MFAMethod[] = [];

      // Check SMS
      const smsResult = await query(
        `SELECT sms_enabled, phone_number FROM users WHERE id = $1`,
        [userId]
      );

      if (smsResult.rows.length > 0 && smsResult.rows[0].sms_enabled) {
        methods.push({
          type: 'sms',
          verified: true,
        });
      }

      // Check Email
      const emailResult = await query(
        `SELECT email_mfa_enabled FROM users WHERE id = $1`,
        [userId]
      );

      if (emailResult.rows.length > 0 && emailResult.rows[0].email_mfa_enabled) {
        methods.push({
          type: 'email',
          verified: true,
        });
      }

      return methods;
    } catch (error) {
      console.error('Get available methods error:', error);
      return [];
    }
  }

  /**
   * Get default MFA methods
   */
  private getDefaultMethods(): MFAMethod[] {
    return [
      {
        type: 'totp',
        verified: false,
        nextVerificationRequired: new Date(),
      },
      {
        type: 'email',
        verified: false,
        nextVerificationRequired: new Date(),
      },
      {
        type: 'sms',
        verified: false,
        nextVerificationRequired: new Date(),
      },
    ];
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase();
      codes.push(`${code.substring(0, 4)}-${code.substring(4)}`);
    }
    return codes;
  }
}

export const mfaEnforcer = new MFAEnforcer();
