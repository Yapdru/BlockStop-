import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
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

  async enableTwoFactor(userId: number, secret: string): Promise<void> {
    await query(
      `UPDATE users
       SET two_factor_enabled = true, two_factor_secret = pgp_sym_encrypt($2, 'key')
       WHERE id = $1`,
      [userId, secret]
    );
  }

  async disableTwoFactor(userId: number): Promise<void> {
    await query(
      `UPDATE users
       SET two_factor_enabled = false, two_factor_secret = NULL
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
}

export const twoFactorService = new TwoFactorService();
