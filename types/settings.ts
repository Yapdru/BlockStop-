export interface SecuritySettings {
  twoFactorEnabled: boolean;
  backupCodesCount: number;
  lastPasswordChange?: Date;
}

export interface PrivacySettings {
  dataRetentionDays: number;
  analyticsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export interface AccountProfile {
  id: number;
  email: string;
  name?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
  currentPassword: string;
}

export interface VPNPreference {
  id?: number;
  userId: number;
  vpnProvider: string;
  isPreferred: boolean;
  protocol?: string;
}
