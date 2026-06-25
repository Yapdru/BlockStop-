/**
 * BlockAdmin Phase 31.1 - Admin Library Index
 * Central export for all admin functionality
 */

// User Management
export { UserManager } from './user-manager';
export { usersStore, verificationEmailsStore } from './user-manager';

// Verification Service
export { VerificationService } from './verification-service';
export { verificationAttemptsStore } from './verification-service';

// NetLink Integration
export { NetLinkIntegration } from './netlink-integration';
export { paymentsStore, confirmationsStore } from './netlink-integration';

// Privacy Settings
export { PrivacySettingsManager } from './privacy-settings';
export { privacyAuditLogsStore } from './privacy-settings';

// OAuth Tracker
export { OAuthTracker } from './oauth-tracker';
export { oauthMethodsStore, loginSessionsStore } from './oauth-tracker';

// Admin Roles
export { AdminRolesManager, ROLE_PERMISSIONS } from './admin-roles';
export { adminUsersStore } from './admin-roles';

// Audit Logging
export { AuditLogger } from './audit-logging';
export { auditLogsStore, adminActionsStore } from './audit-logging';

// Re-export types from main types file
export type * from '@/types/admin';
