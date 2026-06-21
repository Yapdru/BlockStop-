import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Production: This should be hashed and loaded from environment
const ADMIN_PASSCODE_HASH = process.env.ADMIN_PASSCODE_HASH ||
  '$2a$10$PqY0Y0Y0Y0Y0Y0Y0Y0Y0Y'; // Placeholder, replace with actual hash

const SESSION_TOKEN_SECRET = new TextEncoder().encode(
  process.env.SESSION_TOKEN_SECRET || 'your-super-secret-key-change-in-production'
);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface SessionData {
  timestamp: number;
  expiresAt: number;
  ipAddress?: string;
}

interface RateLimitData {
  attempts: number;
  lockedUntil?: number;
  ips: Map<string, { attempts: number; lockedUntil?: number }>;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitData>();

/**
 * Hash a passcode using bcrypt
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passcode, salt);
}

/**
 * Verify passcode against hash
 */
export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(passcode, hash);
  } catch (error) {
    console.error('Passcode verification error:', error);
    return false;
  }
}

/**
 * Check if IP is rate limited
 */
export function checkRateLimit(ipAddress: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let limitData = rateLimitStore.get(ipAddress);

  if (!limitData) {
    limitData = { attempts: 0, ips: new Map() };
    rateLimitStore.set(ipAddress, limitData);
  }

  // Check if account is locked
  if (limitData.lockedUntil && now < limitData.lockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((limitData.lockedUntil - now) / 1000),
    };
  }

  // Clear lock if expired
  if (limitData.lockedUntil && now >= limitData.lockedUntil) {
    limitData.lockedUntil = undefined;
    limitData.attempts = 0;
  }

  return { allowed: true };
}

/**
 * Record failed authentication attempt
 */
export function recordFailedAttempt(ipAddress: string): void {
  const now = Date.now();
  let limitData = rateLimitStore.get(ipAddress);

  if (!limitData) {
    limitData = { attempts: 0, ips: new Map() };
    rateLimitStore.set(ipAddress, limitData);
  }

  limitData.attempts++;

  if (limitData.attempts >= MAX_FAILED_ATTEMPTS) {
    limitData.lockedUntil = now + LOCKOUT_DURATION;
  }
}

/**
 * Clear failed attempts for IP
 */
export function clearFailedAttempts(ipAddress: string): void {
  const limitData = rateLimitStore.get(ipAddress);
  if (limitData) {
    limitData.attempts = 0;
    limitData.lockedUntil = undefined;
  }
}

/**
 * Create admin session token
 */
export async function createSessionToken(ipAddress?: string): Promise<string> {
  const now = Date.now();
  const sessionData: SessionData = {
    timestamp: now,
    expiresAt: now + SESSION_TIMEOUT,
    ipAddress,
  };

  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor((now + SESSION_TIMEOUT) / 1000))
    .sign(SESSION_TOKEN_SECRET);

  return token;
}

/**
 * Verify session token
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, SESSION_TOKEN_SECRET);
    return verified.payload as unknown as SessionData;
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
}

/**
 * Set secure session cookie
 */
export async function setSessionCookie(ipAddress?: string): Promise<string> {
  const token = await createSessionToken(ipAddress);
  const cookieJar = await cookies();

  cookieJar.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TIMEOUT / 1000,
    path: '/',
  });

  return token;
}

/**
 * Get session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieJar = await cookies();
  const token = cookieJar.get('admin_session')?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieJar = await cookies();
  cookieJar.delete('admin_session');
}

/**
 * Check if session is valid and not expired
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  const now = Date.now();
  if (session.expiresAt && now > session.expiresAt) {
    await clearSession();
    return false;
  }

  return true;
}

/**
 * Get admin passcode hash from environment (for setup)
 */
export function getPasscodeHash(): string {
  return ADMIN_PASSCODE_HASH;
}

/**
 * Verify admin access - check both passcode and session
 */
export async function verifyAdminAccess(passcode?: string): Promise<{
  authenticated: boolean;
  error?: string;
}> {
  // If passcode provided, verify it
  if (passcode) {
    const isValid = await verifyPasscode(passcode, ADMIN_PASSCODE_HASH);
    if (!isValid) {
      return { authenticated: false, error: 'Invalid passcode' };
    }
  } else {
    // Check session
    const isValid = await isSessionValid();
    if (!isValid) {
      return { authenticated: false, error: 'Session expired or invalid' };
    }
  }

  return { authenticated: true };
}

// Clean up expired rate limits periodically
export function startRateLimitCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    rateLimitStore.forEach((value, key) => {
      if (value.lockedUntil && now > value.lockedUntil + LOCKOUT_DURATION) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach(key => rateLimitStore.delete(key));
  }, 5 * 60 * 1000); // Clean every 5 minutes
}
