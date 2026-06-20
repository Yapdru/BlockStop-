// Organization Controller - Business Logic for Organization Endpoints
import { APIContext, PaginatedResponse, PaginationParams } from '../../types';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../../error-handler';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  ownerId: string;
  status: 'active' | 'suspended' | 'deleted';
  tier: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  teamCount: number;
  threatCount: number;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  settings?: OrgSettings;
}

export interface OrgSettings {
  dataRetention: number; // days
  enableWebhooks: boolean;
  enableIntegrations: boolean;
  enforceSSO: boolean;
  ipWhitelist?: string[];
  defaultScanPriority: string;
  notificationPreferences?: Record<string, any>;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
  joinedAt: Date;
  invitedAt?: Date;
  invitedBy?: string;
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface CreateOrgRequest {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrgRequest {
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  tier?: string;
  status?: string;
  settings?: Partial<OrgSettings>;
  metadata?: Record<string, any>;
}

// In-memory storage
const orgStore = new Map<string, Organization>();
const memberStore = new Map<string, OrgMember>();
const inviteStore = new Map<string, OrgInvite>();

export class OrgController {
  /**
   * List organizations
   */
  static async listOrgs(
    context: APIContext,
    params: PaginationParams & {
      tier?: string;
      status?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<Organization>> {
    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    // Users can only see orgs they're members of
    const userMembers = Array.from(memberStore.values()).filter(
      m => m.userId === context.userId && m.status === 'active'
    );
    const orgIds = new Set(userMembers.map(m => m.orgId));

    let orgs = Array.from(orgStore.values()).filter(o => orgIds.has(o.id));

    // Apply filters
    if (params.tier) {
      orgs = orgs.filter(o => o.tier === params.tier);
    }
    if (params.status) {
      orgs = orgs.filter(o => o.status === params.status);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      orgs = orgs.filter(
        o =>
          o.name.toLowerCase().includes(search) ||
          o.description?.toLowerCase().includes(search)
      );
    }

    // Sort by name
    orgs.sort((a, b) => a.name.localeCompare(b.name));

    const total = orgs.length;
    const items = orgs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items,
      cursor: '',
      hasMore,
      total,
      pageSize: items.length,
    };
  }

  /**
   * Get organization by ID
   */
  static async getOrgById(orgId: string, context: APIContext): Promise<Organization> {
    // Verify user has access to this org
    const member = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.userId === context.userId && m.status === 'active'
    );

    if (!member && orgId !== context.orgId) {
      throw new ForbiddenError('Access denied to this organization');
    }

    const org = orgStore.get(orgId);
    if (!org) {
      throw new NotFoundError(`Organization not found: ${orgId}`);
    }

    return org;
  }

  /**
   * Create new organization
   */
  static async createOrg(
    data: CreateOrgRequest,
    context: APIContext
  ): Promise<Organization> {
    if (!data.name) {
      throw new ValidationError('Organization name is required');
    }

    // Check for duplicate name
    const existing = Array.from(orgStore.values()).find(
      o => o.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existing) {
      throw new ConflictError('Organization name already exists');
    }

    const now = new Date();
    const org: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      website: data.website,
      industry: data.industry,
      ownerId: context.userId,
      status: 'active',
      tier: 'free',
      memberCount: 1,
      teamCount: 0,
      threatCount: 0,
      scanCount: 0,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata,
      settings: {
        dataRetention: 90,
        enableWebhooks: true,
        enableIntegrations: true,
        enforceSSO: false,
        defaultScanPriority: 'medium',
      },
    };

    orgStore.set(org.id, org);

    // Add creator as owner member
    const member: OrgMember = {
      id: `member_${Date.now()}`,
      orgId: org.id,
      userId: context.userId,
      email: 'owner@example.com', // Would get from auth context in real app
      role: 'owner',
      status: 'active',
      joinedAt: now,
    };
    memberStore.set(member.id, member);

    return org;
  }

  /**
   * Update organization
   */
  static async updateOrg(
    orgId: string,
    data: UpdateOrgRequest,
    context: APIContext
  ): Promise<Organization> {
    const org = await this.getOrgById(orgId, context);

    // Only owner/admin can update
    const member = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.userId === context.userId
    );
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions to update organization');
    }

    const updates: Partial<Organization> = {};

    if (data.name !== undefined) {
      // Check for duplicate name
      const existing = Array.from(orgStore.values()).find(
        o => o.id !== orgId && o.name.toLowerCase() === data.name.toLowerCase()
      );
      if (existing) {
        throw new ConflictError('Organization name already exists');
      }
      updates.name = data.name;
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    if (data.website !== undefined) {
      updates.website = data.website;
    }

    if (data.industry !== undefined) {
      updates.industry = data.industry;
    }

    if (data.status !== undefined) {
      const validStatuses = ['active', 'suspended', 'deleted'];
      if (!validStatuses.includes(data.status)) {
        throw new ValidationError('Invalid status');
      }
      updates.status = data.status as Organization['status'];
    }

    if (data.settings !== undefined) {
      updates.settings = { ...org.settings, ...data.settings };
    }

    if (data.metadata !== undefined) {
      updates.metadata = data.metadata;
    }

    updates.updatedAt = new Date();

    const updated = { ...org, ...updates };
    orgStore.set(orgId, updated);
    return updated;
  }

  /**
   * Delete organization
   */
  static async deleteOrg(orgId: string, context: APIContext): Promise<void> {
    const org = await this.getOrgById(orgId, context);

    // Only owner can delete
    if (org.ownerId !== context.userId) {
      throw new ForbiddenError('Only organization owner can delete');
    }

    // Delete members
    for (const [key, member] of memberStore.entries()) {
      if (member.orgId === orgId) {
        memberStore.delete(key);
      }
    }

    // Delete invites
    for (const [key, invite] of inviteStore.entries()) {
      if (invite.orgId === orgId) {
        inviteStore.delete(key);
      }
    }

    orgStore.delete(orgId);
  }

  /**
   * Get organization members
   */
  static async getMembers(
    orgId: string,
    context: APIContext,
    params: PaginationParams
  ): Promise<PaginatedResponse<OrgMember>> {
    await this.getOrgById(orgId, context);

    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    let members = Array.from(memberStore.values()).filter(m => m.orgId === orgId);

    // Sort by joined date descending
    members.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());

    const total = members.length;
    const items = members.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items,
      cursor: '',
      hasMore,
      total,
      pageSize: items.length,
    };
  }

  /**
   * Invite member to organization
   */
  static async inviteMember(
    orgId: string,
    email: string,
    role: string,
    context: APIContext
  ): Promise<OrgInvite> {
    const org = await this.getOrgById(orgId, context);

    // Check permissions
    const member = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.userId === context.userId
    );
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions to invite members');
    }

    // Check for duplicate email
    const existing = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      throw new ConflictError('Email already member of organization');
    }

    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(role)) {
      throw new ValidationError('Invalid role');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite: OrgInvite = {
      id: `invite_${Date.now()}`,
      orgId,
      email,
      role: role as 'admin' | 'member',
      status: 'pending',
      invitedBy: context.userId,
      createdAt: now,
      expiresAt,
    };

    inviteStore.set(invite.id, invite);
    return invite;
  }

  /**
   * Remove member from organization
   */
  static async removeMember(
    orgId: string,
    memberId: string,
    context: APIContext
  ): Promise<void> {
    const org = await this.getOrgById(orgId, context);

    // Check permissions
    const requester = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.userId === context.userId
    );
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      throw new ForbiddenError('Insufficient permissions to remove members');
    }

    const member = Array.from(memberStore.values()).find(
      m => m.id === memberId && m.orgId === orgId
    );
    if (!member) {
      throw new NotFoundError('Member not found');
    }

    // Can't remove owner
    if (member.role === 'owner') {
      throw new ForbiddenError('Cannot remove organization owner');
    }

    memberStore.delete(memberId);
    org.memberCount--;
    org.updatedAt = new Date();
    orgStore.set(orgId, org);
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    orgId: string,
    memberId: string,
    newRole: string,
    context: APIContext
  ): Promise<OrgMember> {
    const org = await this.getOrgById(orgId, context);

    // Check permissions
    const requester = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.userId === context.userId
    );
    if (!requester || requester.role !== 'owner') {
      throw new ForbiddenError('Only owner can change member roles');
    }

    const member = Array.from(memberStore.values()).find(
      m => m.id === memberId && m.orgId === orgId
    );
    if (!member) {
      throw new NotFoundError('Member not found');
    }

    const validRoles = ['owner', 'admin', 'member'];
    if (!validRoles.includes(newRole)) {
      throw new ValidationError('Invalid role');
    }

    member.role = newRole as OrgMember['role'];
    memberStore.set(memberId, member);

    org.updatedAt = new Date();
    orgStore.set(orgId, org);

    return member;
  }

  /**
   * Get organization settings
   */
  static async getSettings(
    orgId: string,
    context: APIContext
  ): Promise<OrgSettings> {
    const org = await this.getOrgById(orgId, context);
    return org.settings || {};
  }

  /**
   * Update organization settings
   */
  static async updateSettings(
    orgId: string,
    settings: Partial<OrgSettings>,
    context: APIContext
  ): Promise<OrgSettings> {
    const org = await this.getOrgById(orgId, context);

    // Check permissions
    const member = Array.from(memberStore.values()).find(
      m => m.orgId === orgId && m.userId === context.userId
    );
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions to update settings');
    }

    org.settings = { ...org.settings, ...settings };
    org.updatedAt = new Date();
    orgStore.set(orgId, org);

    return org.settings;
  }

  /**
   * Get organization statistics
   */
  static async getStats(orgId: string, context: APIContext): Promise<{
    members: number;
    teams: number;
    threats: number;
    scans: number;
    activeUsers: number;
  }> {
    const org = await this.getOrgById(orgId, context);

    const members = Array.from(memberStore.values()).filter(
      m => m.orgId === orgId && m.status === 'active'
    );

    return {
      members: members.length,
      teams: org.teamCount,
      threats: org.threatCount,
      scans: org.scanCount,
      activeUsers: members.length,
    };
  }
}
