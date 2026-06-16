import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { query } from '@/lib/db';

export class TwoFactorService {
  async generateSecret(
    email: string
  ): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `BlockStop NEO (${email})`,
      issuer: 'BlockStop',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verifyToken(secret: string, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  async enableTwoFactor(userId: number, secret: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes(10);

    await query(
      `UPDATE users
       SET two_factor_enabled = true, two_factor_secret = pgp_sym_encrypt($2, 'key'),
           two_factor_backup_codes = $3, updated_at = NOW()
       WHERE id = $1`,
      [userId, secret, backupCodes]
    );

    return backupCodes;
  }

  async disableTwoFactor(userId: number): Promise<void> {
    await query(
      `UPDATE users
       SET two_factor_enabled = false, two_factor_secret = NULL,
           two_factor_backup_codes = NULL, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  }

  async isTwoFactorEnabled(userId: number): Promise<boolean> {
    const result = await query(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].two_factor_enabled === true;
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

  /**
   * Verify and use backup code
   */
  async verifyAndUseBackupCode(userId: number, code: string): Promise<boolean> {
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

    // Remove the used code
    const updatedCodes = codes.filter((c: string) => c !== code);

    await query(
      `UPDATE users SET two_factor_backup_codes = $1, updated_at = NOW() WHERE id = $2`,
      [updatedCodes, userId]
    );

    return true;
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount(userId: number): Promise<number> {
    const result = await query(
      `SELECT array_length(two_factor_backup_codes, 1) as "codesCount" FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return 0;
    }

    return result.rows[0].codesCount || 0;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: number): Promise<string[]> {
    const newCodes = this.generateBackupCodes(10);

    await query(
      `UPDATE users SET two_factor_backup_codes = $1, updated_at = NOW() WHERE id = $2`,
      [newCodes, userId]
    );

    return newCodes;
  }
}

export const twoFactorService = new TwoFactorService();
