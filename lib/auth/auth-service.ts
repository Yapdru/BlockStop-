import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { User } from '@/types/auth';

export class AuthService {
  // Password-based authentication
  async registerWithPassword(
    email: string,
    password: string,
    name?: string
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, name, auth_method, password_hash, plan_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM plans WHERE name = 'free'))
       RETURNING id, email, name, plan_id as "planId", auth_method as "authMethod", created_at as "createdAt", updated_at as "updatedAt"`,
      [email, name || email.split('@')[0], 'password', hashedPassword]
    );

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      planId: result.rows[0].planId,
      authMethod: result.rows[0].authMethod,
      createdAt: result.rows[0].createdAt,
      updatedAt: result.rows[0].updatedAt,
    };
  }

  async loginWithPassword(email: string, password: string): Promise<User> {
    const result = await query(
      `SELECT id, email, name, plan_id as "planId", auth_method as "authMethod",
              password_hash as "passwordHash", created_at as "createdAt",
              updated_at as "updatedAt", last_login as "lastLogin"
       FROM users WHERE email = $1 AND auth_method = 'password'`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      authMethod: user.authMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }

  async validatePassword(email: string, password: string): Promise<boolean> {
    const result = await query(
      `SELECT password_hash FROM users WHERE email = $1 AND auth_method = 'password'`,
      [email]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return bcrypt.compare(password, result.rows[0].password_hash);
  }

  // Google OAuth
  async handleGoogleCallback(googleId: string, email: string, name?: string): Promise<User> {
    // Check if user exists
    let result = await query(
      `SELECT id, email, name, plan_id as "planId", auth_method as "authMethod",
              created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin"
       FROM users WHERE google_id = $1 OR (email = $2 AND auth_method = 'google')`,
      [googleId, email]
    );

    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
      // Update last login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
    } else {
      // Create new user
      result = await query(
        `INSERT INTO users (email, name, auth_method, google_id, plan_id)
         VALUES ($1, $2, $3, $4, (SELECT id FROM plans WHERE name = 'free'))
         RETURNING id, email, name, plan_id as "planId", auth_method as "authMethod",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [email, name || email.split('@')[0], 'google', googleId]
      );
      user = result.rows[0];
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      authMethod: user.authMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }

  // Passkey support
  async registerPasskey(
    email: string,
    credentialId: string,
    name?: string
  ): Promise<User> {
    // Check if user exists with this email
    let result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Create new user with passkey
      result = await query(
        `INSERT INTO users (email, name, auth_method, passkey_credential_id, plan_id)
         VALUES ($1, $2, $3, $4, (SELECT id FROM plans WHERE name = 'free'))
         RETURNING id, email, name, plan_id as "planId", auth_method as "authMethod",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [email, name || email.split('@')[0], 'passkey', credentialId]
      );
    } else {
      // Update existing user with passkey
      result = await query(
        `UPDATE users
         SET auth_method = 'passkey', passkey_credential_id = $2
         WHERE email = $1
         RETURNING id, email, name, plan_id as "planId", auth_method as "authMethod",
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [email, credentialId]
      );
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      authMethod: user.authMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async authenticatePasskey(email: string): Promise<User> {
    const result = await query(
      `SELECT id, email, name, plan_id as "planId", auth_method as "authMethod",
              created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin",
              passkey_credential_id as "passkeyCredentialId"
       FROM users WHERE email = $1 AND auth_method = 'passkey'`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      authMethod: user.authMethod,
      passkeyCredentialId: user.passkeyCredentialId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }

  async getUserById(userId: number): Promise<User | null> {
    const result = await query(
      `SELECT id, email, name, plan_id as "planId", auth_method as "authMethod",
              created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin"
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      authMethod: user.authMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, name, plan_id as "planId", auth_method as "authMethod",
              created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin"
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      authMethod: user.authMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }
}

export const authService = new AuthService();
