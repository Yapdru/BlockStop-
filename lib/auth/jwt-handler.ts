import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  userId: number;
  email: string;
  scopes: string[];
  clientId?: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class JWTHandler {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: number; // seconds
  private refreshTokenExpiry: number; // seconds

  constructor(
    accessTokenSecret?: string,
    refreshTokenSecret?: string,
    accessTokenExpiry: number = 3600, // 1 hour
    refreshTokenExpiry: number = 86400 * 7 // 7 days
  ) {
    this.accessTokenSecret =
      accessTokenSecret || process.env.JWT_ACCESS_SECRET || this.generateSecret();
    this.refreshTokenSecret =
      refreshTokenSecret || process.env.JWT_REFRESH_SECRET || this.generateSecret();
    this.accessTokenExpiry = accessTokenExpiry;
    this.refreshTokenExpiry = refreshTokenExpiry;
  }

  /**
   * Generate a random secret for JWT signing
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create an access token
   */
  createAccessToken(
    userId: number,
    email: string,
    scopes: string[],
    clientId?: string
  ): string {
    const payload: JWTPayload = {
      userId,
      email,
      scopes,
      clientId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.accessTokenExpiry,
    };

    return jwt.sign(payload, this.accessTokenSecret);
  }

  /**
   * Create a refresh token
   */
  createRefreshToken(userId: number, email: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      scopes: [],
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.refreshTokenExpiry,
    };

    return jwt.sign(payload, this.refreshTokenSecret);
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      if (decoded.type !== 'access') {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as JWTPayload;
      if (decoded.type !== 'refresh') {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload | null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded ? decoded.exp * 1000 : null; // Convert to milliseconds
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    return Date.now() >= expiry;
  }

  /**
   * Get time remaining until token expiry (in seconds)
   */
  getTimeToExpiry(token: string): number {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return 0;
    const remaining = Math.floor((expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }
}

export const jwtHandler = new JWTHandler();
