import { query } from '@/lib/db';
import crypto from 'crypto';

export interface Team {
  id: number;
  name: string;
  createdBy: number;
  planId: number;
  maxUsers: number;
  createdAt: Date;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  userEmail: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export class TeamService {
  async createTeam(userId: number, teamName: string): Promise<Team> {
    // Check if user's plan allows team creation
    const userResult = await query(
      `SELECT p.name FROM users u
       JOIN plans p ON u.plan_id = p.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userPlan = userResult.rows[0].name;
    if (userPlan !== 'pro') {
      throw new Error('Team creation is only available for PRO users');
    }

    // Create team
    const result = await query(
      `INSERT INTO teams (name, created_by, plan_id, max_users)
       VALUES ($1, $2, (SELECT id FROM plans WHERE name = 'pro'), 6)
       RETURNING id, name, created_by as "createdBy", plan_id as "planId", max_users as "maxUsers", created_at as "createdAt"`,
      [teamName, userId]
    );

    const team = result.rows[0];

    // Add creator as admin
    await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [team.id, userId]
    );

    return team;
  }

  async inviteTeamMember(
    teamId: number,
    invitingUserId: number,
    inviteeEmail: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<{ invitationToken: string; inviteeEmail: string }> {
    // Check if user is team admin
    const adminCheck = await query(
      `SELECT role FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, invitingUserId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      throw new Error('Only team admins can invite members');
    }

    // Check team member count
    const memberCount = await query(
      `SELECT COUNT(*) as count FROM team_members
       WHERE team_id = $1`,
      [teamId]
    );

    if (memberCount.rows[0].count >= 6) {
      throw new Error('Team has reached maximum member limit');
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Store invitation
    await query(
      `INSERT INTO team_invitations (team_id, email, role, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [teamId, inviteeEmail, role, invitationToken]
    );

    return { invitationToken, inviteeEmail };
  }

  async acceptInvitation(invitationToken: string, userId: number): Promise<Team> {
    // Get invitation
    const result = await query(
      `SELECT team_id, role FROM team_invitations
       WHERE token = $1 AND expires_at > NOW() AND accepted = false`,
      [invitationToken]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired invitation');
    }

    const invitation = result.rows[0];

    // Add user to team
    await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [invitation.team_id, userId, invitation.role]
    );

    // Mark invitation as accepted
    await query(
      `UPDATE team_invitations
       SET accepted = true
       WHERE token = $1`,
      [invitationToken]
    );

    // Get team info
    const teamResult = await query(
      `SELECT id, name, created_by as "createdBy", plan_id as "planId",
              max_users as "maxUsers", created_at as "createdAt"
       FROM teams WHERE id = $1`,
      [invitation.team_id]
    );

    return teamResult.rows[0];
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const result = await query(
      `SELECT tm.id, tm.team_id as "teamId", tm.user_id as "userId",
              u.email as "userEmail", tm.role, tm.joined_at as "joinedAt"
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1`,
      [teamId]
    );

    return result.rows;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await query(
      `DELETE FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const result = await query(
      `SELECT DISTINCT t.id, t.name, t.created_by as "createdBy",
              t.plan_id as "planId", t.max_users as "maxUsers", t.created_at as "createdAt"
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  async getTeamScans(teamId: number, scanType: 'email' | 'file') {
    let query_text: string;

    if (scanType === 'email') {
      query_text = `
        SELECT es.id, es.email_content, es.risk_score, es.threats,
               es.created_at, u.email as "userEmail"
        FROM email_scans es
        JOIN team_members tm ON es.user_id = tm.user_id
        JOIN users u ON es.user_id = u.id
        WHERE tm.team_id = $1
        ORDER BY es.created_at DESC
      `;
    } else {
      query_text = `
        SELECT fs.id, fs.file_name, fs.threat_level, fs.threats,
               fs.created_at, u.email as "userEmail"
        FROM file_scans fs
        JOIN team_members tm ON fs.user_id = tm.user_id
        JOIN users u ON fs.user_id = u.id
        WHERE tm.team_id = $1
        ORDER BY fs.created_at DESC
      `;
    }

    const result = await query(query_text, [teamId]);
    return result.rows;
  }

  /**
   * Update team member role
   */
  async updateMemberRole(
    teamId: number,
    userId: number,
    requesterUserId: number,
    newRole: 'admin' | 'member'
  ): Promise<boolean> {
    // Check if requester is admin
    const adminCheck = await query(
      `SELECT role FROM team_members
       WHERE team_id = $1 AND user_id = $2`,
      [teamId, requesterUserId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      throw new Error('Only team admins can change member roles');
    }

    // Don't allow removing last admin
    if (newRole !== 'admin') {
      const adminCount = await query(
        `SELECT COUNT(*) as count FROM team_members
         WHERE team_id = $1 AND role = 'admin'`,
        [teamId]
      );

      if (adminCount.rows[0].count === 1) {
        throw new Error('Team must have at least one admin');
      }
    }

    await query(
      `UPDATE team_members SET role = $1
       WHERE team_id = $2 AND user_id = $3`,
      [newRole, teamId, userId]
    );

    return true;
  }

  /**
   * Get team activity log
   */
  async getTeamActivityLog(
    teamId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Array<{ id: number; userId: number; action: string; timestamp: Date }>> {
    const result = await query(
      `SELECT id, user_id as "userId", action, created_at as "timestamp"
       FROM team_activity_logs
       WHERE team_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [teamId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Log team activity
   */
  async logTeamActivity(
    teamId: number,
    userId: number,
    action: string
  ): Promise<void> {
    await query(
      `INSERT INTO team_activity_logs (team_id, user_id, action)
       VALUES ($1, $2, $3)`,
      [teamId, userId, action]
    );
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: number): Promise<Team | null> {
    const result = await query(
      `SELECT id, name, created_by as "createdBy", plan_id as "planId",
              max_users as "maxUsers", created_at as "createdAt"
       FROM teams WHERE id = $1`,
      [teamId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Update team subscription
   */
  async updateTeamSubscription(teamId: number, planId: number): Promise<boolean> {
    const result = await query(
      `UPDATE teams SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [planId, teamId]
    );

    return result.rowCount > 0;
  }

  /**
   * Get pending team invitations
   */
  async getPendingInvitations(teamId: number): Promise<Array<{
    id: number;
    email: string;
    role: string;
    createdAt: Date;
    expiresAt: Date;
  }>> {
    const result = await query(
      `SELECT id, email, role, created_at as "createdAt", expires_at as "expiresAt"
       FROM team_invitations
       WHERE team_id = $1 AND accepted = false AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [teamId]
    );

    return result.rows;
  }

  /**
   * Check if user is team admin
   */
  async isTeamAdmin(teamId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT role FROM team_members
       WHERE team_id = $1 AND user_id = $2 AND role = 'admin'`,
      [teamId, userId]
    );

    return result.rows.length > 0;
  }
}

export const teamService = new TeamService();
