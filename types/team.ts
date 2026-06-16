export type TeamRole = 'admin' | 'member';

export interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  maxMembers: number;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  userEmail: string;
  userName?: string;
  role: TeamRole;
  joinedAt: Date;
  status: 'active' | 'invited' | 'pending';
}

export interface TeamInvite {
  id: number;
  teamId: number;
  invitedEmail: string;
  role: TeamRole;
  invitedBy: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: TeamRole;
}

export interface UpdateMemberRoleRequest {
  role: TeamRole;
}

export interface TeamActivityLog {
  id: number;
  teamId: number;
  userId: number;
  action: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TeamResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}
