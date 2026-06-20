/**
 * Replication Monitor - Monitors database replication health and statistics
 * Tracks replication lag, synchronization status, and recovery
 */

export interface ReplicationStats {
  status: 'healthy' | 'warning' | 'critical';
  lag: number;
  lagBytes: number;
  transactionLog: string;
  lastSyncTime: Date;
  syncDuration: number;
  failoverCount: number;
}

export interface ReplicationEvent {
  eventType: 'sync' | 'lag_increase' | 'failover' | 'recovery' | 'error';
  timestamp: Date;
  message: string;
  severity: 'info' | 'warning' | 'error';
  details?: any;
}

export class ReplicationMonitor {
  private db: any;
  private logger: any;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private replicationEvents: ReplicationEvent[] = [];
  private lastStats: ReplicationStats | null = null;
  private lagThresholdWarning: number = 5; // seconds
  private lagThresholdCritical: number = 30; // seconds

  constructor(db: any, logger?: any) {
    this.db = db;
    this.logger = logger || console;
  }

  /**
   * Start monitoring replication
   */
  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    try {
      this.logger.info('Starting replication monitoring...');

      // Perform initial check
      await this.checkReplicationHealth();

      // Set up recurring checks
      this.monitoringInterval = setInterval(async () => {
        try {
          await this.checkReplicationHealth();
        } catch (error) {
          this.logger.error('Error in replication monitoring cycle:', error);
        }
      }, intervalMs);
    } catch (error) {
      this.logger.error('Error starting replication monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring replication
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('Replication monitoring stopped');
    }
  }

  /**
   * Get current replication statistics
   */
  async getReplicationStats(): Promise<ReplicationStats> {
    try {
      const result = await this.db.query(`
        SELECT
          pg_is_in_recovery() as is_replica,
          EXTRACT(EPOCH FROM (now() - pg_last_wal_receive_time())) as seconds_since_last_sync,
          pg_wal_lsn_diff(pg_last_wal_flush_lsn(), pg_last_wal_receive_lsn()) as lag_bytes,
          pg_walfile_name(pg_last_wal_receive_lsn()) as transaction_log
        FROM pg_stat_replication
      `);

      let lagSeconds = 0;
      let lagBytes = 0;
      let transactionLog = 'unknown';

      if (result.rows.length > 0) {
        const row = result.rows[0];
        lagSeconds = parseFloat(row.seconds_since_last_sync) || 0;
        lagBytes = parseInt(row.lag_bytes) || 0;
        transactionLog = row.transaction_log || 'unknown';
      }

      const status = this.determineStatus(lagSeconds);

      const stats: ReplicationStats = {
        status,
        lag: lagSeconds,
        lagBytes,
        transactionLog,
        lastSyncTime: new Date(Date.now() - lagSeconds * 1000),
        syncDuration: await this.calculateSyncDuration(),
        failoverCount: await this.getFailoverCount(),
      };

      this.lastStats = stats;

      return stats;
    } catch (error) {
      this.logger.error('Error getting replication stats:', error);
      return {
        status: 'critical',
        lag: Infinity,
        lagBytes: 0,
        transactionLog: 'unknown',
        lastSyncTime: new Date(),
        syncDuration: 0,
        failoverCount: 0,
      };
    }
  }

  /**
   * Get replication events
   */
  async getReplicationEvents(limit: number = 100): Promise<ReplicationEvent[]> {
    try {
      return this.replicationEvents.slice(-limit);
    } catch (error) {
      this.logger.error('Error getting replication events:', error);
      return [];
    }
  }

  /**
   * Check if replication is healthy
   */
  async isReplicationHealthy(): Promise<boolean> {
    try {
      const stats = await this.getReplicationStats();
      return stats.status === 'healthy';
    } catch (error) {
      this.logger.error('Error checking replication health:', error);
      return false;
    }
  }

  /**
   * Trigger manual sync with replica
   */
  async triggerSync(): Promise<void> {
    try {
      await this.db.query('SELECT pg_reload_conf()');

      const event: ReplicationEvent = {
        eventType: 'sync',
        timestamp: new Date(),
        message: 'Manual replication sync triggered',
        severity: 'info',
      };

      this.recordEvent(event);

      this.logger.info('Manual sync triggered');
    } catch (error) {
      this.logger.error('Error triggering sync:', error);
      throw error;
    }
  }

  /**
   * Get replica status
   */
  async getReplicaStatus(): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT
          pid,
          client_addr,
          state,
          sent_lsn,
          write_lsn,
          flush_lsn,
          replay_lsn,
          sync_state,
          backend_start
        FROM pg_stat_replication
      `);

      return result.rows.map((row: any) => ({
        pid: row.pid,
        clientAddr: row.client_addr,
        state: row.state,
        sentLsn: row.sent_lsn,
        writeLsn: row.write_lsn,
        flushLsn: row.flush_lsn,
        replayLsn: row.replay_lsn,
        syncState: row.sync_state,
        backendStart: new Date(row.backend_start),
      }));
    } catch (error) {
      this.logger.error('Error getting replica status:', error);
      return [];
    }
  }

  /**
   * Set lag thresholds
   */
  setLagThresholds(warning: number, critical: number): void {
    this.lagThresholdWarning = warning;
    this.lagThresholdCritical = critical;
    this.logger.info(
      `Lag thresholds updated: warning=${warning}s, critical=${critical}s`
    );
  }

  // Private helper methods

  private async checkReplicationHealth(): Promise<void> {
    try {
      const currentStats = await this.getReplicationStats();
      const previousStats = this.lastStats;

      // Check for lag increase
      if (
        previousStats &&
        currentStats.lag > previousStats.lag * 1.5
      ) {
        const event: ReplicationEvent = {
          eventType: 'lag_increase',
          timestamp: new Date(),
          message: `Replication lag increased from ${previousStats.lag.toFixed(2)}s to ${currentStats.lag.toFixed(2)}s`,
          severity: 'warning',
          details: {
            previousLag: previousStats.lag,
            currentLag: currentStats.lag,
          },
        };

        this.recordEvent(event);
      }

      // Check status change
      if (previousStats && currentStats.status !== previousStats.status) {
        const severity =
          currentStats.status === 'critical' ? 'error' : 'warning';

        const event: ReplicationEvent = {
          eventType: 'recovery',
          timestamp: new Date(),
          message: `Replication status changed: ${previousStats.status} -> ${currentStats.status}`,
          severity: severity as 'warning' | 'error',
          details: {
            previousStatus: previousStats.status,
            currentStatus: currentStats.status,
          },
        };

        this.recordEvent(event);
      }

      // Log status
      this.logger.debug(
        `Replication status: ${currentStats.status}, lag: ${currentStats.lag.toFixed(2)}s`
      );
    } catch (error) {
      const event: ReplicationEvent = {
        eventType: 'error',
        timestamp: new Date(),
        message: `Replication monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        details: { error: error instanceof Error ? error.message : error },
      };

      this.recordEvent(event);
    }
  }

  private determineStatus(lagSeconds: number): 'healthy' | 'warning' | 'critical' {
    if (lagSeconds >= this.lagThresholdCritical) {
      return 'critical';
    }
    if (lagSeconds >= this.lagThresholdWarning) {
      return 'warning';
    }
    return 'healthy';
  }

  private async calculateSyncDuration(): Promise<number> {
    try {
      const result = await this.db.query(`
        SELECT
          EXTRACT(EPOCH FROM (pg_last_wal_receive_time() - pg_postmaster_start_time())) as duration
      `);

      if (result.rows.length > 0) {
        return parseFloat(result.rows[0].duration) || 0;
      }

      return 0;
    } catch (error) {
      this.logger.warn('Error calculating sync duration:', error);
      return 0;
    }
  }

  private async getFailoverCount(): Promise<number> {
    try {
      const result = await this.db.query(`
        SELECT COUNT(*) as count FROM replication_events
        WHERE event_type = 'failover'
        AND timestamp > NOW() - INTERVAL '7 days'
      `);

      if (result.rows.length > 0) {
        return parseInt(result.rows[0].count) || 0;
      }

      return 0;
    } catch (error) {
      this.logger.warn('Error getting failover count:', error);
      return 0;
    }
  }

  private recordEvent(event: ReplicationEvent): void {
    this.replicationEvents.push(event);

    // Maintain history size
    if (this.replicationEvents.length > 1000) {
      this.replicationEvents = this.replicationEvents.slice(-1000);
    }

    // Log event
    const logLevel =
      event.severity === 'error'
        ? 'error'
        : event.severity === 'warning'
          ? 'warn'
          : 'info';
    this.logger[logLevel](
      `[${event.eventType}] ${event.message}`
    );
  }
}

export default ReplicationMonitor;
