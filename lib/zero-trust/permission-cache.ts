import { query } from '@/lib/db';

export interface CachedPermission {
  userId: string;
  resource: string;
  action: string;
  allowed: boolean;
  expiresAt: Date;
  cachedAt: Date;
}

export class PermissionCache {
  private memoryCache: Map<string, CachedPermission> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get a cached permission (checks both memory and database)
   */
  async getPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean | null> {
    try {
      const key = this.getCacheKey(userId, resource, action);

      // Check memory cache first
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiresAt > new Date()) {
        this.stats.hits++;
        return cached.allowed;
      }

      // Check database cache
      const result = await query(
        `SELECT allowed, expires_at as "expiresAt"
         FROM permission_cache
         WHERE user_id = $1 AND resource_id = $2 AND action = $3
         AND expires_at > NOW()`,
        [userId, resource, action]
      );

      if (result.rows.length > 0) {
        this.stats.hits++;
        const row = result.rows[0];
        const cached: CachedPermission = {
          userId,
          resource,
          action,
          allowed: row.allowed,
          expiresAt: new Date(row.expiresAt),
          cachedAt: new Date(),
        };

        // Update memory cache
        this.memoryCache.set(key, cached);
        return row.allowed;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Error reading from permission cache:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set a cached permission
   */
  async setPermission(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    ttl: number = 3600
  ): Promise<void> {
    try {
      const key = this.getCacheKey(userId, resource, action);
      const expiresAt = new Date(Date.now() + ttl * 1000);

      // Update memory cache
      this.memoryCache.set(key, {
        userId,
        resource,
        action,
        allowed,
        expiresAt,
        cachedAt: new Date(),
      });

      // Update database cache
      await query(
        `INSERT INTO permission_cache (user_id, resource_id, action, allowed, expires_at, cached_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, resource_id, action) DO UPDATE
         SET allowed = EXCLUDED.allowed, expires_at = EXCLUDED.expires_at, cached_at = NOW()`,
        [userId, resource, action, allowed, expiresAt]
      );
    } catch (error) {
      console.error('Error writing to permission cache:', error);
      // Don't throw - cache failures should not block access
    }
  }

  /**
   * Invalidate all permissions for a user
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    try {
      // Clear from database
      await query(
        'DELETE FROM permission_cache WHERE user_id = $1',
        [userId]
      );

      // Clear from memory cache
      for (const [key] of this.memoryCache.entries()) {
        if (key.startsWith(`${userId}:`)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Error invalidating user permissions:', error);
      // Don't throw - cache operations should not block
    }
  }

  /**
   * Invalidate all permissions for a resource
   */
  async invalidateResourcePermissions(resource: string): Promise<void> {
    try {
      // Clear from database
      await query(
        'DELETE FROM permission_cache WHERE resource_id = $1',
        [resource]
      );

      // Clear from memory cache
      for (const [key] of this.memoryCache.entries()) {
        const parts = key.split(':');
        if (parts[1] === resource) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Error invalidating resource permissions:', error);
      // Don't throw - cache operations should not block
    }
  }

  /**
   * Invalidate all permissions for a role
   */
  async invalidateRolePermissions(roleId: string): Promise<void> {
    try {
      // Get all users with this role
      const result = await query(
        `SELECT DISTINCT user_id as "userId"
         FROM user_roles
         WHERE role_id = $1`,
        [roleId]
      );

      // Invalidate permissions for each user
      for (const row of result.rows) {
        await this.invalidateUserPermissions(row.userId);
      }
    } catch (error) {
      console.error('Error invalidating role permissions:', error);
      // Don't throw - cache operations should not block
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    try {
      // Clear database cache
      await query('DELETE FROM permission_cache');

      // Clear memory cache
      this.memoryCache.clear();

      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
      };
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Clear memory cache anyway
      this.memoryCache.clear();
      this.stats = {
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * Cleanup expired entries (can be called periodically)
   */
  async cleanupExpiredEntries(): Promise<void> {
    try {
      // Clean database
      await query('DELETE FROM permission_cache WHERE expires_at <= NOW()');

      // Clean memory cache
      const now = new Date();
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiresAt <= now) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired cache entries:', error);
      // Don't throw - cleanup should not block
    }
  }

  /**
   * Private helper to generate cache key
   */
  private getCacheKey(userId: string, resource: string, action: string): string {
    return `${userId}:${resource}:${action}`;
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache();

// Set up periodic cleanup (every 5 minutes)
if (typeof global !== 'undefined') {
  setInterval(() => {
    permissionCache.cleanupExpiredEntries().catch(err =>
      console.error('Periodic cache cleanup failed:', err)
    );
  }, 5 * 60 * 1000);
}
