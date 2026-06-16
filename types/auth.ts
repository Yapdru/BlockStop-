export type AuthMethod = 'password' | 'google' | 'passkey';
export type TierType = 'free' | 'pro';

export interface User {
  id: number;
  email: string;
  name?: string;
  planId: number;
  authMethod: AuthMethod;
  passwordHash?: string;
  googleId?: string;
  passkeyCredentialId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthResponse {
  user: User;
  sessionToken: string;
}

export interface TierDefinition {
  id: number;
  name: TierType;
  maxUsers: number;
  priceMonthly: number;
  features: Record<string, boolean>;
}
