import { getDb } from '@/lib/db';
import { TierLevel, getTierByLevel } from './tier-definitions';
import crypto from 'crypto';

export type AuthMethod = 'password' | 'google' | 'passkey';

export interface NeoUser {
  id: string;
  email: string;
  authMethod: AuthMethod;
  planId: string;
  tier: TierLevel;
  teamId?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthToken {
  sessionToken: string;
  expiresAt: Date;
}

export async function registerWithPassword(
  email: string,
  password: string
): Promise<{ user: NeoUser; token: AuthToken }> {
  const db = getDb();
  const userId = `user_${crypto.randomBytes(16).toString('hex')}`;
  const passwordHash = await hashPassword(password);
  const freeTPlan = getTierByLevel('free');

  const result = await db.query(
    `INSERT INTO users_neo (id, email, auth_method, password_hash, plan_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, email, auth_method, plan_id, email_verified, two_factor_enabled, created_at, last_login`,
    [userId, email, 'password', passwordHash, freeTPlan.id]
  );

  const user = mapRowToNeoUser(result.rows[0], 'free');
  const token = generateSessionToken(userId);

  return { user, token };
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ user: NeoUser; token: AuthToken }> {
  const db = getDb();
  const result = await db.query(
    `SELECT id, email, auth_method, password_hash, plan_id, email_verified, two_factor_enabled, created_at, last_login, team_id
     FROM users_neo WHERE email = $1 AND auth_method = 'password'`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const row = result.rows[0];
  const isValid = await verifyPassword(password, row.password_hash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  await db.query('UPDATE users_neo SET last_login = NOW() WHERE id = $1', [row.id]);

  const user = mapRowToNeoUser(row, getTierFromPlanId(row.plan_id));
  const token = generateSessionToken(row.id);

  return { user, token };
}

export async function registerWithGoogle(
  googleId: string,
  email: string,
  name: string
): Promise<{ user: NeoUser; token: AuthToken }> {
  const db = getDb();
  const userId = `user_${crypto.randomBytes(16).toString('hex')}`;
  const freeTPlan = getTierByLevel('free');

  const result = await db.query(
    `INSERT INTO users_neo (id, email, auth_method, google_id, plan_id, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING id, email, auth_method, plan_id, email_verified, two_factor_enabled, created_at, last_login`,
    [userId, email, 'google', googleId, freeTPlan.id]
  );

  const user = mapRowToNeoUser(result.rows[0], 'free');
  const token = generateSessionToken(userId);

  return { user, token };
}

export async function loginWithGoogle(
  googleId: string
): Promise<{ user: NeoUser; token: AuthToken }> {
  const db = getDb();
  const result = await db.query(
    `SELECT id, email, auth_method, plan_id, email_verified, two_factor_enabled, created_at, last_login, team_id
     FROM users_neo WHERE google_id = $1`,
    [googleId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const row = result.rows[0];
  await db.query('UPDATE users_neo SET last_login = NOW() WHERE id = $1', [row.id]);

  const user = mapRowToNeoUser(row, getTierFromPlanId(row.plan_id));
  const token = generateSessionToken(row.id);

  return { user, token };
}

export async function getUserTier(userId: string): Promise<TierLevel> {
  const db = getDb();
  const result = await db.query(
    `SELECT plan_id FROM users_neo WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return getTierFromPlanId(result.rows[0].plan_id);
}

export async function getUserById(userId: string): Promise<NeoUser> {
  const db = getDb();
  const result = await db.query(
    `SELECT id, email, auth_method, plan_id, email_verified, two_factor_enabled, created_at, last_login, team_id
     FROM users_neo WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return mapRowToNeoUser(result.rows[0], getTierFromPlanId(result.rows[0].plan_id));
}

function mapRowToNeoUser(row: any, tier: TierLevel): NeoUser {
  return {
    id: row.id,
    email: row.email,
    authMethod: row.auth_method,
    planId: row.plan_id,
    tier,
    teamId: row.team_id,
    twoFactorEnabled: row.two_factor_enabled || false,
    emailVerified: row.email_verified || false,
    createdAt: new Date(row.created_at),
    lastLogin: row.last_login ? new Date(row.last_login) : new Date()
  };
}

function getTierFromPlanId(planId: string): TierLevel {
  if (planId.includes('pro')) return 'pro';
  if (planId.includes('enterprise')) return 'enterprise';
  return 'free';
}

function generateSessionToken(userId: string): AuthToken {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return { sessionToken: token, expiresAt };
}

async function hashPassword(password: string): Promise<string> {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, hashPart] = hash.split(':');
  const crypto = require('crypto');
  const testHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return testHash === hashPart;
}
