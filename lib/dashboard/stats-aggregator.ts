import { query } from '@/lib/db';
import {
  DashboardStats,
  ThreatStatistic,
  RecentThreat,
  ScanHistoryItem,
  DashboardResponse,
} from '@/types/dashboard';

export class StatsAggregator {
  /**
   * Get comprehensive user dashboard statistics
   */
  async getUserDashboardStats(userId: number): Promise<DashboardStats> {
    // Get email scan statistics
    const emailStats = await query(
      `SELECT
        COUNT(*) as "totalCount",
        SUM(CASE WHEN risk_score > 50 THEN 1 ELSE 0 END) as "threatsCount"
       FROM email_scan_history WHERE user_id = $1`,
      [userId]
    );

    // Get file scan statistics
    const fileStats = await query(
      `SELECT
        COUNT(*) as "totalCount",
        SUM(CASE WHEN threat_level IN ('warning', 'dangerous') THEN 1 ELSE 0 END) as "threatsCount"
       FROM file_scan_results WHERE user_id = $1`,
      [userId]
    );

    // Get storage usage
    const storageStats = await query(
      `SELECT
        COALESCE(SUM(file_size_bytes), 0) as "usedBytes"
       FROM file_scan_results WHERE user_id = $1`,
      [userId]
    );

    // Get last scan timestamp
    const lastScan = await query(
      `SELECT MAX(created_at) as "lastScanAt"
       FROM (
         SELECT created_at FROM email_scan_history WHERE user_id = $1
         UNION ALL
         SELECT created_at FROM file_scan_results WHERE user_id = $1
       ) scans`,
      [userId]
    );

    const emailCount = parseInt(emailStats.rows[0]?.totalCount || 0);
    const fileCount = parseInt(fileStats.rows[0]?.totalCount || 0);
    const emailThreats = parseInt(emailStats.rows[0]?.threatsCount || 0);
    const fileThreats = parseInt(fileStats.rows[0]?.threatsCount || 0);
    const storageUsed = parseInt(storageStats.rows[0]?.usedBytes || 0);
    const storageQuota = 5 * 1024 * 1024 * 1024; // 5GB default

    return {
      totalScans: emailCount + fileCount,
      emailScans: emailCount,
      fileScans: fileCount,
      threatsDetected: emailThreats + fileThreats,
      storageUsedBytes: storageUsed,
      storageQuotaBytes: storageQuota,
      lastScanAt: lastScan.rows[0]?.lastScanAt,
    };
  }

  /**
   * Get recent threats detected
   */
  async getRecentThreats(userId: number, limit: number = 10): Promise<RecentThreat[]> {
    const result = await query(
      `SELECT
        id, 'email' as type, threat as "threatName", 'low' as severity,
        created_at as "detectedAt", 'quarantined' as status, email as "itemName"
       FROM email_scan_history
       WHERE user_id = $1 AND threat IS NOT NULL
       UNION ALL
       SELECT
        id, 'file' as type, threats[0] as "threatName",
        CASE WHEN threat_level = 'dangerous' THEN 'critical'
             WHEN threat_level = 'warning' THEN 'high'
             ELSE 'low' END as severity,
        created_at as "detectedAt", 'removed' as status, file_name as "itemName"
       FROM file_scan_results
       WHERE user_id = $1 AND threat_level IS NOT NULL
       ORDER BY "detectedAt" DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      threatName: row.threatName,
      severity: row.severity,
      detectedAt: row.detectedAt,
      status: row.status,
      itemName: row.itemName,
    }));
  }

  /**
   * Get threat statistics (trends)
   */
  async getThreatStatistics(
    userId: number,
    daysBack: number = 30
  ): Promise<ThreatStatistic[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    const result = await query(
      `SELECT
        threat as "type",
        COUNT(*) as "count"
       FROM email_scan_history
       WHERE user_id = $1 AND created_at > $2 AND risk_score > 50
       GROUP BY threat
       UNION ALL
       SELECT
        threats[0] as "type",
        COUNT(*) as "count"
       FROM file_scan_results
       WHERE user_id = $1 AND created_at > $2 AND threat_level IN ('warning', 'dangerous')
       GROUP BY threats[0]
       ORDER BY "count" DESC`,
      [userId, sinceDate]
    );

    const totalThreats = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    return result.rows.map(row => ({
      type: row.type || 'Unknown',
      count: parseInt(row.count),
      percentage: totalThreats > 0 ? Math.round((parseInt(row.count) / totalThreats) * 100) : 0,
      trend: 'stable' as const, // Could be enhanced with trend detection logic
    }));
  }

  /**
   * Get paginated scan history
   */
  async getScanHistory(
    userId: number,
    type?: 'email' | 'file',
    limit: number = 20,
    offset: number = 0
  ): Promise<ScanHistoryItem[]> {
    let query_text: string;
    const values: unknown[] = [userId, limit, offset];

    if (type === 'email') {
      query_text = `
        SELECT
          id, 'email' as type, email as "itemName", risk_score as "riskScore",
          NULL as "threatLevel", ARRAY[threat] as threats, created_at as "createdAt",
          CASE WHEN risk_score > 70 THEN 'dangerous'
               WHEN risk_score > 40 THEN 'warning'
               ELSE 'safe' END as status
        FROM email_scan_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
    } else if (type === 'file') {
      query_text = `
        SELECT
          id, 'file' as type, file_name as "itemName", NULL as "riskScore",
          threat_level as "threatLevel", threats, created_at as "createdAt",
          CASE WHEN threat_level = 'dangerous' THEN 'dangerous'
               WHEN threat_level = 'warning' THEN 'warning'
               ELSE 'safe' END as status
        FROM file_scan_results
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
    } else {
      query_text = `
        SELECT
          id, 'email' as type, email as "itemName", risk_score as "riskScore",
          NULL as "threatLevel", ARRAY[threat] as threats, created_at as "createdAt",
          CASE WHEN risk_score > 70 THEN 'dangerous'
               WHEN risk_score > 40 THEN 'warning'
               ELSE 'safe' END as status
        FROM email_scan_history
        WHERE user_id = $1
        UNION ALL
        SELECT
          id, 'file' as type, file_name as "itemName", NULL as "riskScore",
          threat_level as "threatLevel", threats, created_at as "createdAt",
          CASE WHEN threat_level = 'dangerous' THEN 'dangerous'
               WHEN threat_level = 'warning' THEN 'warning'
               ELSE 'safe' END as status
        FROM file_scan_results
        WHERE user_id = $1
        ORDER BY "createdAt" DESC
        LIMIT $2 OFFSET $3
      `;
    }

    const result = await query(query_text, values);

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      itemName: row.itemName,
      riskScore: row.riskScore,
      threatLevel: row.threatLevel,
      threats: row.threats || [],
      createdAt: row.createdAt,
      status: row.status,
    }));
  }

  /**
   * Get full dashboard response (all data at once)
   */
  async getFullDashboard(userId: number): Promise<DashboardResponse> {
    const [stats, recentThreats, threatStats, scanHistory] = await Promise.all([
      this.getUserDashboardStats(userId),
      this.getRecentThreats(userId, 5),
      this.getThreatStatistics(userId, 30),
      this.getScanHistory(userId, undefined, 10, 0),
    ]);

    return {
      stats,
      recentThreats,
      threatStatistics: threatStats,
      scanHistory,
    };
  }

  /**
   * Get team dashboard statistics
   */
  async getTeamDashboardStats(teamId: number): Promise<DashboardStats> {
    // Get email scan statistics for all team members
    const emailStats = await query(
      `SELECT
        COUNT(DISTINCT e.id) as "totalCount",
        COUNT(DISTINCT CASE WHEN e.risk_score > 50 THEN e.id END) as "threatsCount"
       FROM email_scan_history e
       JOIN team_members tm ON e.user_id = tm.user_id
       WHERE tm.team_id = $1`,
      [teamId]
    );

    // Get file scan statistics for all team members
    const fileStats = await query(
      `SELECT
        COUNT(DISTINCT f.id) as "totalCount",
        COUNT(DISTINCT CASE WHEN f.threat_level IN ('warning', 'dangerous') THEN f.id END) as "threatsCount"
       FROM file_scan_results f
       JOIN team_members tm ON f.user_id = tm.user_id
       WHERE tm.team_id = $1`,
      [teamId]
    );

    const emailCount = parseInt(emailStats.rows[0]?.totalCount || 0);
    const fileCount = parseInt(fileStats.rows[0]?.totalCount || 0);
    const emailThreats = parseInt(emailStats.rows[0]?.threatsCount || 0);
    const fileThreats = parseInt(fileStats.rows[0]?.threatsCount || 0);

    return {
      totalScans: emailCount + fileCount,
      emailScans: emailCount,
      fileScans: fileCount,
      threatsDetected: emailThreats + fileThreats,
      storageUsedBytes: 0,
      storageQuotaBytes: 5 * 1024 * 1024 * 1024,
    };
  }
}

export const statsAggregator = new StatsAggregator();
