import { getDb } from '@/lib/db';
import { canAddTeamMembers, getTierByLevel } from './tier-definitions';
import crypto from 'crypto';

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  planId: string;
  maxUsers: number;
  memberCount: number;
  subscriptionStatus: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: Date;
}

export async function createTeam(
  userId: string,
  teamName: string,
  planId: string
): Promise<Team> {
  const db = getDb();
  const teamId = `team_${crypto.randomBytes(16).toString('hex')}`;
  const tierDef = getTierByLevel('pro');

  const result = await db.query(
    `INSERT INTO teams (id, name, created_by, plan_id, max_users, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, name, created_by, plan_id, max_users, subscription_status, created_at`,
    [teamId, teamName, userId, planId, tierDef.maxUsers]
  );

  const team = result.rows[0];

  // Add creator as team member
  await addTeamMember(userId, teamId, 'admin');

  return {
    id: team.id,
    name: team.name,
    createdBy: team.created_by,
    planId: team.plan_id,
    maxUsers: team.max_users,
    memberCount: 1,
    subscriptionStatus: team.subscription_status,
    createdAt: new Date(team.created_at)
  };
}

export async function addTeamMember(
  userId: string,
  teamId: string,
  role: string = 'member'
): Promise<TeamMember> {
  const db = getDb();
  const memberId = `tmember_${crypto.randomBytes(16).toString('hex')}`;

  // Check team capacity
  const teamResult = await db.query(
    `SELECT plan_id, max_users FROM teams WHERE id = $1`,
    [teamId]
  );

  const team = teamResult.rows[0];
  const memberCountResult = await db.query(
    `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
    [teamId]
  );

  const currentCount = parseInt(memberCountResult.rows[0].count);
  const tier = team.plan_id.includes('pro') ? 'pro' : 'free';

  if (!canAddTeamMembers(tier as any, currentCount)) {
    throw new Error(`Team has reached maximum members (${team.max_users})`);
  }

  const result = await db.query(
    `INSERT INTO team_members (id, team_id, user_id, role, joined_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, team_id, user_id, role, joined_at`,
    [memberId, teamId, userId, role]
  );

  const member = result.rows[0];
  return {
    id: member.id,
    userId: member.user_id,
    teamId: member.team_id,
    role: member.role,
    joinedAt: new Date(member.joined_at)
  };
}

export async function removeTeamMember(userId: string, teamId: string): Promise<void> {
  const db = getDb();
  await db.query(
    `DELETE FROM team_members WHERE user_id = $1 AND team_id = $2`,
    [userId, teamId]
  );
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT id, team_id, user_id, role, joined_at FROM team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
    [teamId]
  );

  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    role: row.role,
    joinedAt: new Date(row.joined_at)
  }));
}

export async function getTeamsByUser(userId: string): Promise<Team[]> {
  const db = getDb();
  const result = await db.query(
    `SELECT t.id, t.name, t.created_by, t.plan_id, t.max_users, t.subscription_status, t.created_at,
            COUNT(DISTINCT tm.user_id) as member_count
     FROM teams t
     LEFT JOIN team_members tm ON t.id = tm.team_id
     WHERE t.created_by = $1 OR t.id IN (
       SELECT team_id FROM team_members WHERE user_id = $1
     )
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    planId: row.plan_id,
    maxUsers: row.max_users,
    memberCount: parseInt(row.member_count) || 0,
    subscriptionStatus: row.subscription_status,
    createdAt: new Date(row.created_at)
  }));
}

export async function getTeamById(teamId: string): Promise<Team> {
  const db = getDb();
  const result = await db.query(
    `SELECT t.id, t.name, t.created_by, t.plan_id, t.max_users, t.subscription_status, t.created_at,
            COUNT(DISTINCT tm.user_id) as member_count
     FROM teams t
     LEFT JOIN team_members tm ON t.id = tm.team_id
     WHERE t.id = $1
     GROUP BY t.id`,
    [teamId]
  );

  if (result.rows.length === 0) {
    throw new Error('Team not found');
  }

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    planId: row.plan_id,
    maxUsers: row.max_users,
    memberCount: parseInt(row.member_count) || 0,
    subscriptionStatus: row.subscription_status,
    createdAt: new Date(row.created_at)
  };
}
