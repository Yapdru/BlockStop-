/**
 * BlockAdmin Phase 31.1 - Verification Service
 * Real name verification, identity confirmation, and verification workflows
 */

import {
  VerificationRequest,
  VerificationResponse,
  User,
  VerificationStatus,
  AdminException,
} from '@/types/admin';
import { UserManager } from './user-manager';

// In-memory store for verification attempts
const verificationAttemptsStore: Map<string, VerificationAttempt> = new Map();

interface VerificationAttempt {
  id: string;
  userId: string;
  realName: string;
  email: string;
  timestamp: string;
  verificationCode: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  expiresAt: string;
}

/**
 * VerificationService - Handles user identity verification workflows
 */
export class VerificationService {
  private static readonly VERIFICATION_CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_HOURS = 24;
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly COOLDOWN_MINUTES = 15;

  /**
   * Initiate verification for a user
   */
  static async initiateVerification(
    request: VerificationRequest
  ): Promise<VerificationResponse> {
    // Validate request
    if (!request.userId || !request.realName || !request.email) {
      throw new AdminException(
        'VALIDATION_ERROR',
        400,
        { message: 'userId, realName, and email are required' }
      );
    }

    // Get user
    const user = await UserManager.getUser(request.userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Check if user is already verified
    if (user.verificationStatus === 'verified') {
      return {
        success: true,
        verificationId: `verified_${user.id}`,
        status: 'verified',
        message: 'User is already verified',
        nextSteps: [],
      };
    }

    // Check for recent verification attempts (cooldown)
    const recentAttempt = Array.from(verificationAttemptsStore.values()).find(
      (a) =>
        a.userId === request.userId &&
        new Date(a.timestamp) >
          new Date(Date.now() - this.COOLDOWN_MINUTES * 60 * 1000)
    );

    if (recentAttempt && recentAttempt.status === 'failed') {
      throw new AdminException(
        'VERIFICATION_COOLDOWN',
        429,
        {
          message: `Too many verification attempts. Please try again in ${this.COOLDOWN_MINUTES} minutes.`,
          retryAfter: new Date(
            Date.now() + this.COOLDOWN_MINUTES * 60 * 1000
          ).toISOString(),
        }
      );
    }

    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CODE_EXPIRY_HOURS * 60 * 60 * 1000);

    // Create verification attempt record
    const verificationId = this.generateId();
    const attempt: VerificationAttempt = {
      id: verificationId,
      userId: request.userId,
      realName: request.realName,
      email: request.email,
      timestamp: now.toISOString(),
      verificationCode,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    };

    verificationAttemptsStore.set(verificationId, attempt);

    // Update user with verification code
    await UserManager.updateUser(request.userId, {
      realName: request.realName,
      phone: request.phone,
      address: request.address,
      location: request.location,
    });

    return {
      success: true,
      verificationId,
      status: 'pending',
      message: 'Verification code has been sent to your email',
      nextSteps: [
        'Check your email for the verification code',
        'Enter the code to confirm your identity',
        'Complete payment verification if applicable',
      ],
    };
  }

  /**
   * Verify identity with code
   */
  static async verifyWithCode(
    verificationId: string,
    code: string
  ): Promise<VerificationResponse> {
    const attempt = verificationAttemptsStore.get(verificationId);

    if (!attempt) {
      throw new AdminException(
        'VERIFICATION_NOT_FOUND',
        404,
        { message: 'Verification request not found' }
      );
    }

    // Check if expired
    if (new Date(attempt.expiresAt) < new Date()) {
      attempt.status = 'expired';
      verificationAttemptsStore.set(verificationId, attempt);

      throw new AdminException(
        'VERIFICATION_EXPIRED',
        400,
        { message: 'Verification code has expired. Please request a new one.' }
      );
    }

    // Check max attempts
    if (attempt.attempts >= attempt.maxAttempts) {
      attempt.status = 'failed';
      verificationAttemptsStore.set(verificationId, attempt);

      throw new AdminException(
        'MAX_ATTEMPTS_EXCEEDED',
        400,
        { message: 'Maximum verification attempts exceeded. Please request a new verification.' }
      );
    }

    // Increment attempt counter
    attempt.attempts++;

    // Verify code
    if (attempt.verificationCode !== code) {
      verificationAttemptsStore.set(verificationId, attempt);

      throw new AdminException(
        'INVALID_CODE',
        400,
        {
          message: `Invalid verification code. ${attempt.maxAttempts - attempt.attempts} attempts remaining.`,
          attemptsRemaining: attempt.maxAttempts - attempt.attempts,
        }
      );
    }

    // Code is correct - mark as verified
    attempt.status = 'verified';
    verificationAttemptsStore.set(verificationId, attempt);

    // Update user verification status
    const user = await UserManager.getUser(attempt.userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser = await UserManager.updateUser(attempt.userId, {
      verificationStatus: 'verified',
    });

    return {
      success: true,
      verificationId,
      status: updatedUser.verificationStatus as VerificationStatus,
      message: 'Identity verified successfully!',
      nextSteps: ['Complete payment verification', 'Set up privacy preferences'],
    };
  }

  /**
   * Check verification status
   */
  static async checkVerificationStatus(
    verificationId: string
  ): Promise<{
    status: VerificationStatus;
    attempts: number;
    maxAttempts: number;
    expiresAt: string;
  }> {
    const attempt = verificationAttemptsStore.get(verificationId);

    if (!attempt) {
      throw new AdminException(
        'VERIFICATION_NOT_FOUND',
        404,
        { message: 'Verification request not found' }
      );
    }

    return {
      status: attempt.status as VerificationStatus,
      attempts: attempt.attempts,
      maxAttempts: attempt.maxAttempts,
      expiresAt: attempt.expiresAt,
    };
  }

  /**
   * Resend verification code
   */
  static async resendVerificationCode(
    verificationId: string
  ): Promise<VerificationResponse> {
    const attempt = verificationAttemptsStore.get(verificationId);

    if (!attempt) {
      throw new AdminException(
        'VERIFICATION_NOT_FOUND',
        404,
        { message: 'Verification request not found' }
      );
    }

    if (new Date(attempt.expiresAt) < new Date()) {
      attempt.status = 'expired';
      verificationAttemptsStore.set(verificationId, attempt);

      throw new AdminException(
        'VERIFICATION_EXPIRED',
        400,
        { message: 'Previous verification code expired. Please request a new verification.' }
      );
    }

    // Generate new code
    const newCode = this.generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CODE_EXPIRY_HOURS * 60 * 60 * 1000);

    attempt.verificationCode = newCode;
    attempt.attempts = 0;
    attempt.expiresAt = expiresAt.toISOString();
    attempt.timestamp = now.toISOString();

    verificationAttemptsStore.set(verificationId, attempt);

    return {
      success: true,
      verificationId,
      status: 'pending',
      message: 'New verification code has been sent to your email',
      nextSteps: ['Check your email', 'Enter the new code'],
    };
  }

  /**
   * Verify user identity as admin (batch verification)
   */
  static async adminVerifyUser(
    userId: string,
    realName: string,
    email: string
  ): Promise<VerificationResponse> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Verify the provided details match or update user record
    const updatedUser = await UserManager.updateUser(userId, {
      realName,
      verificationStatus: 'verified',
    });

    return {
      success: true,
      verificationId: `admin_verified_${userId}`,
      status: updatedUser.verificationStatus as VerificationStatus,
      message: `User ${realName} has been verified by admin`,
      nextSteps: [],
    };
  }

  /**
   * Flag user for manual review
   */
  static async flagForManualReview(
    userId: string,
    reason: string,
    details?: Record<string, any>
  ): Promise<VerificationResponse> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const flaggedUser = await UserManager.flagUser(userId, reason);

    return {
      success: true,
      verificationId: `flagged_${userId}`,
      status: flaggedUser.verificationStatus as VerificationStatus,
      message: `User ${flaggedUser.email} has been flagged for manual review`,
      nextSteps: ['Review user details', 'Contact user if needed', 'Approve or reject verification'],
    };
  }

  /**
   * Get verification history for user
   */
  static async getVerificationHistory(userId: string): Promise<VerificationAttempt[]> {
    return Array.from(verificationAttemptsStore.values()).filter(
      (a) => a.userId === userId
    );
  }

  /**
   * Get verification stats
   */
  static async getVerificationStats(): Promise<{
    totalAttempts: number;
    successfulVerifications: number;
    failedVerifications: number;
    pendingVerifications: number;
    expiredVerifications: number;
    averageAttemptsPerVerification: number;
  }> {
    const attempts = Array.from(verificationAttemptsStore.values());

    const successful = attempts.filter((a) => a.status === 'verified').length;
    const failed = attempts.filter((a) => a.status === 'failed').length;
    const pending = attempts.filter((a) => a.status === 'pending').length;
    const expired = attempts.filter((a) => a.status === 'expired').length;

    const totalAttempts = attempts.reduce((sum, a) => sum + a.attempts, 0);
    const avgAttempts =
      successful > 0 ? totalAttempts / successful : 0;

    return {
      totalAttempts: attempts.length,
      successfulVerifications: successful,
      failedVerifications: failed,
      pendingVerifications: pending,
      expiredVerifications: expired,
      averageAttemptsPerVerification: avgAttempts,
    };
  }

  /**
   * Clean up expired verification attempts
   */
  static async cleanupExpiredVerifications(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [id, attempt] of verificationAttemptsStore.entries()) {
      if (new Date(attempt.expiresAt) < now && attempt.status === 'expired') {
        verificationAttemptsStore.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private static generateVerificationCode(): string {
    let code = '';
    for (let i = 0; i < this.VERIFICATION_CODE_LENGTH; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  private static generateId(): string {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export store for testing
export { verificationAttemptsStore };
