import axios, { AxiosInstance } from 'axios';

/**
 * Real-time server monitoring and admin data aggregation
 */

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  tier: 'free' | 'pro' | 'enterprise';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: number;
  refundedAt?: number;
}

export interface ActiveUser {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  loginTime: number;
  lastActivity: number;
  currentAction?: string;
  ipAddress?: string;
}

export interface ServerStatus {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
  latencyMs: number;
  dbConnections: number;
  cacheHitRate: number;
  uptime: number;
  lastUpdate: number;
}

export interface RevenueStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  paymentSuccessRate: number;
  totalRefunds: number;
  refundAmount: number;
  averageOrderValue: number;
}

export interface SystemHealth {
  allServersHealthy: boolean;
  activeServers: number;
  totalServers: number;
  dbConnections: number;
  cacheStatus: 'healthy' | 'warning' | 'critical';
  apiLatency: number;
  errorRate: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'user' | 'payment' | 'error' | 'security' | 'system';
  userId?: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
}

class NetAdmin {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private cacheExpiry = 5000; // 5 seconds default cache

  constructor() {
    this.baseURL = process.env.BLOCKSTOP_API_URL || 'http://localhost:3000/api';
    this.apiKey = process.env.BLOCKSTOP_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Get all active users in real-time
   */
  async getActiveUsers(): Promise<ActiveUser[]> {
    const cacheKey = 'active_users';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as ActiveUser[];

    try {
      const response = await this.client.get('/admin/users');
      const users = response.data.users || [];
      this.setCache(cacheKey, users);
      return users;
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      return [];
    }
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    const users = await this.getActiveUsers();
    return users.length;
  }

  /**
   * Get specific user details
   */
  async getUser(userId: string): Promise<ActiveUser | null> {
    try {
      const response = await this.client.get(`/admin/users/${userId}`);
      return response.data.user || null;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Kick/disconnect a user session
   */
  async kickUser(userId: string): Promise<boolean> {
    try {
      await this.client.post(`/admin/users/${userId}/kick`);
      this.clearCache('active_users');
      return true;
    } catch (error) {
      console.error(`Failed to kick user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get real-time payment data
   */
  async getPayments(limit: number = 100, offset: number = 0): Promise<PaymentRecord[]> {
    try {
      const response = await this.client.get('/admin/payments', {
        params: { limit, offset },
      });
      return response.data.payments || [];
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  }

  /**
   * Get payments for specific user
   */
  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      const response = await this.client.get(`/admin/users/${userId}/payments`);
      return response.data.payments || [];
    } catch (error) {
      console.error(`Failed to fetch payments for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(): Promise<RevenueStats> {
    const cacheKey = 'revenue_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as RevenueStats;

    try {
      const response = await this.client.get('/admin/revenue');
      const stats = response.data.stats || {};
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Failed to fetch revenue stats:', error);
      return {
        totalRevenue: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        paymentSuccessRate: 0,
        totalRefunds: 0,
        refundAmount: 0,
        averageOrderValue: 0,
      };
    }
  }

  /**
   * Get server statuses
   */
  async getServerStatus(): Promise<ServerStatus[]> {
    const cacheKey = 'server_status';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as ServerStatus[];

    try {
      const response = await this.client.get('/admin/servers');
      const servers = response.data.servers || [];
      this.setCache(cacheKey, servers);
      return servers;
    } catch (error) {
      console.error('Failed to fetch server status:', error);
      return [];
    }
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const cacheKey = 'system_health';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as SystemHealth;

    try {
      const response = await this.client.get('/admin/health');
      const health = response.data.health || {};
      this.setCache(cacheKey, health, 3000); // Cache for 3 seconds
      return health;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return {
        allServersHealthy: false,
        activeServers: 0,
        totalServers: 0,
        dbConnections: 0,
        cacheStatus: 'critical',
        apiLatency: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(limit: number = 100, offset: number = 0): Promise<ActivityLog[]> {
    try {
      const response = await this.client.get('/admin/logs', {
        params: { limit, offset },
      });
      return response.data.logs || [];
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      return [];
    }
  }

  /**
   * Get filtered logs
   */
  async getFilteredLogs(
    type?: string,
    severity?: string,
    userId?: string,
    startTime?: number,
    endTime?: number
  ): Promise<ActivityLog[]> {
    try {
      const response = await this.client.get('/admin/logs', {
        params: {
          type,
          severity,
          userId,
          startTime,
          endTime,
        },
      });
      return response.data.logs || [];
    } catch (error) {
      console.error('Failed to fetch filtered logs:', error);
      return [];
    }
  }

  /**
   * Get API health status
   */
  async getApiHealth(): Promise<{ healthy: boolean; latency: number; errorRate: number }> {
    const cacheKey = 'api_health';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as { healthy: boolean; latency: number; errorRate: number };

    try {
      const start = Date.now();
      const response = await this.client.get('/health');
      const latency = Date.now() - start;

      const health = {
        healthy: response.status === 200,
        latency,
        errorRate: 0,
      };

      this.setCache(cacheKey, health, 2000);
      return health;
    } catch (error) {
      console.error('API health check failed:', error);
      return { healthy: false, latency: 0, errorRate: 100 };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    connections: number;
    activeQueries: number;
    cacheHitRate: number;
  }> {
    try {
      const response = await this.client.get('/admin/database');
      return response.data.stats || { connections: 0, activeQueries: 0, cacheHitRate: 0 };
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
      return { connections: 0, activeQueries: 0, cacheHitRate: 0 };
    }
  }

  /**
   * Export payments to CSV format
   */
  async exportPaymentsCSV(startDate?: number, endDate?: number): Promise<string> {
    try {
      const response = await this.client.get('/admin/payments/export', {
        params: { startDate, endDate, format: 'csv' },
      });
      return response.data.csv || '';
    } catch (error) {
      console.error('Failed to export payments:', error);
      return '';
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: unknown, expiry?: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (expiry || this.cacheExpiry),
    });
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.clearCache();
  }
}

// Singleton instance
let netAdminInstance: NetAdmin | null = null;

export function getNetAdmin(): NetAdmin {
  if (!netAdminInstance) {
    netAdminInstance = new NetAdmin();
  }
  return netAdminInstance;
}

export default NetAdmin;
