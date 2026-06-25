/**
 * BlockAdmin Phase 31.1 Type Definitions
 * User Verification & Payment Confirmation System
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type LoginMethod = 'google' | 'apple' | 'facebook' | 'yahoo' | 'email';

export type VerificationStatus = 'verified' | 'pending' | 'flagged' | 'unverified';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export interface User {
  id: string;
  email: string;
  realName: string | null;
  phone: string | null;
  address: string | null;
  location: string | null;
  dateOfBirth: string | null;
  loginMethods: LoginMethod[];
  primaryLoginMethod: LoginMethod;
  verificationStatus: VerificationStatus;
  verificationDate: string | null;
  verificationCode: string | null;
  verificationCodeExpiry: string | null;
  isAdmin: boolean;
  adminRole: AdminRole;
  isActive: boolean;
  isPaymentVerified: boolean;
  paymentVerificationDate: string | null;
  privacySettings: PrivacySettings;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  flagReason: string | null;
}

export interface PrivacySettings {
  hidePhone: boolean;
  hideAddress: boolean;
  hideLocation: boolean;
  hideEmail: boolean;
  allowPublicProfile: boolean;
}

export interface PaymentConfirmation {
  id: string;
  userId: string;
  netlinkTransactionId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'confirmed' | 'pending' | 'failed' | 'refunded';
  confirmationCode: string;
  verificationDetails: {
    realName: string;
    email: string;
    timestamp: string;
  };
  externalVerificationId: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface VerificationEmail {
  id: string;
  userId: string;
  email: string;
  code: string;
  codeExpiry: string;
  attempts: number;
  maxAttempts: number;
  sentAt: string;
  verifiedAt: string | null;
  status: 'pending' | 'verified' | 'expired' | 'failed';
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminUser {
  id: string;
  userId: string;
  role: AdminRole;
  permissions: string[];
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AdminActionType;
  targetUserId: string | null;
  targetUserEmail: string | null;
  details: Record<string, any>;
  status: 'success' | 'failed' | 'pending';
  errorMessage: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export type AdminActionType =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_deactivated'
  | 'user_activated'
  | 'user_verified'
  | 'user_flagged'
  | 'user_unflagged'
  | 'admin_role_assigned'
  | 'admin_role_removed'
  | 'verification_email_sent'
  | 'verification_email_verified'
  | 'payment_verified'
  | 'payment_failed'
  | 'privacy_settings_updated'
  | 'oauth_method_added'
  | 'oauth_method_removed'
  | 'admin_password_changed'
  | 'login_method_tracked'
  | 'audit_log_accessed';

// ============================================================================
// OAuth & Login Tracking
// ============================================================================

export interface OAuthMethod {
  id: string;
  userId: string;
  method: Exclude<LoginMethod, 'email'>;
  oauthId: string;
  email: string;
  verifiedAt: string;
  linkedAt: string;
  lastUsedAt: string;
  displayName: string | null;
}

export interface LoginSession {
  id: string;
  userId: string;
  method: LoginMethod;
  oauthMethod?: OAuthMethod | null;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  logoutAt: string | null;
  isActive: boolean;
}

// ============================================================================
// NetLink Integration Types
// ============================================================================

export interface NetLinkPayment {
  id: string;
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  paymentMethod: string;
  netlinkMetadata: Record<string, any>;
  verificationTimestamp: string | null;
  externalVerificationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NetLinkVerificationResponse {
  success: boolean;
  transactionId: string;
  verificationId: string;
  status: 'confirmed' | 'pending' | 'failed';
  amount: number;
  currency: string;
  verifiedRealName: string | null;
  verifiedEmail: string | null;
  verificationTimestamp: string;
  message: string;
}

export interface NetLinkCheckStatusRequest {
  transactionId: string;
  userId: string;
}

export interface NetLinkCheckStatusResponse {
  transactionId: string;
  status: 'confirmed' | 'pending' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  lastCheckTime: string;
  isVerified: boolean;
}

// ============================================================================
// Dashboard & UI Types
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  flaggedUsers: number;
  paymentVerifiedUsers: number;
  adminUsers: number;
  recentSignups: number;
}

export interface UserManagementFilters {
  search?: string;
  verificationStatus?: VerificationStatus | 'all';
  adminRole?: AdminRole | 'all';
  isActive?: boolean | 'all';
  paymentVerified?: boolean | 'all';
  loginMethod?: LoginMethod | 'all';
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================================================
// Verification Workflow Types
// ============================================================================

export interface VerificationRequest {
  userId: string;
  realName: string;
  email: string;
  phone?: string;
  address?: string;
  location?: string;
}

export interface VerificationResponse {
  success: boolean;
  verificationId: string;
  status: VerificationStatus;
  message: string;
  nextSteps?: string[];
}

// ============================================================================
// Compliance & Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  action: AdminActionType;
  adminId: string;
  adminEmail: string;
  targetUserId: string | null;
  targetUserEmail: string | null;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface ComplianceReport {
  id: string;
  reportDate: string;
  generatedBy: string;
  verifiedUsersCount: number;
  paymentVerifiedCount: number;
  flaggedUsersCount: number;
  adminActionsCount: number;
  loginMethodsBreakdown: Record<LoginMethod, number>;
  privacySettingsBreakdown: Record<string, number>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateUserRequest {
  email: string;
  realName: string;
  loginMethod: LoginMethod;
  phone?: string;
  address?: string;
  location?: string;
}

export interface UpdateUserRequest {
  realName?: string;
  phone?: string;
  address?: string;
  location?: string;
  privacySettings?: Partial<PrivacySettings>;
  verificationStatus?: VerificationStatus;
}

export interface AssignAdminRequest {
  userId: string;
  role: AdminRole;
  expiresAt?: string;
}

export interface VerifyPaymentRequest {
  userId: string;
  netlinkTransactionId: string;
  amount: number;
  currency: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export class AdminException extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(code);
    this.name = 'AdminException';
  }
}
