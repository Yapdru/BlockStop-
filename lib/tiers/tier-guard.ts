import { query } from '@/lib/db';
import { getTierById } from './tier-definitions';

export async function checkUserTier(userId: number): Promise<string> {
  const result = await query(
    `SELECT p.name FROM users u
     JOIN plans p ON u.plan_id = p.id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0].name;
}

export async function requireTierFeature(
  userId: number,
  feature: string
): Promise<void> {
  const result = await query(
    `SELECT p.id, p.name FROM users u
     JOIN plans p ON u.plan_id = p.id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const tier = getTierById(result.rows[0].id);
  if (!tier || !(tier.features as Record<string, boolean>)[feature]) {
    throw new Error(`Feature "${feature}" is not available in your tier`);
  }
}

export async function getUserTierName(userId: number): Promise<'free' | 'pro'> {
  const tierName = await checkUserTier(userId);
  return tierName as 'free' | 'pro';
}
