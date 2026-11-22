export type Role = 'OWNER' | 'MANAGER' | 'WORKER' | 'VET' | 'ACCOUNTANT' | 'PLATFORM_ADMIN';

export interface MembershipInfo {
  tenantId: string;
  tenantName: string;
  role: Role;
  farmScope: string[];
}

export interface Me {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  locale: string;
  platformAdmin: boolean;
  memberships: MembershipInfo[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  locale?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  planCode: string;
  trialEndsAt?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: Me;
  tenant: Tenant | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MfaRequired {
  code: 'MFA_REQUIRED';
  challengeId: string;
}

export type LoginOutcome =
  | { kind: 'session'; session: AuthSession }
  | { kind: 'mfa'; challengeId: string };

export interface Member {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  farmScope: string[];
  status: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: 'PENDING' | 'ACCEPTED';
  expiresAt: string;
}

export interface Quota {
  quotaKey: string;
  used: number;
  limit: number | null;
}
