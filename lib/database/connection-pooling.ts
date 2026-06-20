/**
 * Connection Pooling - Manages database connection pool
 * Handles connection lifecycle, pool sizing, and resource optimization
 */

export interface ConnectionPool {
  minConnections: number;
  maxConnections: number;
  idleTimeout: number;
  currentConnections: number;
  activeConnections: number;
}

export interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  totalConnections: number;
  maxConnections: number;
  utilizationPercent: number;
}

export class ConnectionPooling {
  private minConnections: number = 10;
  private maxConnections: number = 100;
  private idleTimeout: number = 30000; // 30 seconds
  private connections: any[] = [];
  private availableConnections: any[] = [];
  private waitingQueue: any[] = [];
  private db: any;
  private logger: any;

  constructor(db: any, logger?: any) {
    this.db = db;
    this.logger = logger || console;
  }

  /**
   * Initialize the connection pool with configuration
   */
  async initializePool(config: Partial<ConnectionPool>): Promise<void> {
    try {
      if (config.minConnections !== undefined) {
        this.minConnections = config.minConnections;
      }
      if (config.maxConnections !== undefined) {
        this.maxConnections = config.maxConnections;
      }
      if (config.idleTimeout !== undefined) {
        this.idleTimeout = config.idleTimeout;
      }

      // Validate configuration
      if (this.minConnections > this.maxConnections) {
        throw new Error(
          'minConnections cannot be greater than maxConnections'
        );
      }

      // Create minimum connections
      for (let i = 0; i < this.minConnections; i++) {
        const connection = await this.createConnection();
        this.connections.push(connection);
        this.availableConnections.push(connection);
      }

      // Start idle timeout monitor
      this.startIdleTimeoutMonitor();

      this.logger.info(
        `Connection pool initialized: min=${this.minConnections}, max=${this.maxConnections}`
      );
    } catch (error) {
      this.logger.error('Error initializing connection pool:', error);
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<any> {
    try {
      // If connections available, return immediately
      if (this.availableConnections.length > 0) {
        const connection = this.availableConnections.shift();
        this.markConnectionActive(connection);
        return connection;
      }

      // If we can create more connections
      if (this.connections.length < this.maxConnections) {
        const connection = await this.createConnection();
        this.connections.push(connection);
        this.markConnectionActive(connection);
        return connection;
      }

      // Queue the request and wait
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.waitingQueue = this.waitingQueue.filter(
            req => req.resolve !== resolve
          );
          reject(new Error('Connection pool timeout'));
        }, 30000);

        this.waitingQueue.push({
          resolve: (conn: any) => {
            clearTimeout(timeout);
            this.markConnectionActive(conn);
            resolve(conn);
          },
          reject: (error: Error) => {
            clearTimeout(timeout);
            reject(error);
          },
        });
      });
    } catch (error) {
      this.logger.error('Error getting connection from pool:', error);
      throw error;
    }
  }

  /**
   * Release a connection back to the pool
   */
  async releaseConnection(connection: any): Promise<void> {
    try {
      if (!connection) return;

      this.markConnectionIdle(connection);

      // If there's a waiting request, fulfill it
      if (this.waitingQueue.length > 0) {
        const request = this.waitingQueue.shift();
        request.resolve(connection);
        return;
      }

      // Return to available pool
      this.availableConnections.push(connection);
    } catch (error) {
      this.logger.error('Error releasing connection:', error);
      // Try to remove the bad connection
      this.connections = this.connections.filter(conn => conn !== connection);
    }
  }

  /**
   * Get current pool statistics
   */
  async getPoolStats(): Promise<PoolStats> {
    try {
      const active = this.connections.filter(conn =>
        conn.metadata?.isActive === true
      ).length;
      const idle = this.availableConnections.length;
      const waiting = this.waitingQueue.length;

      return {
        active,
        idle,
        waiting,
        totalConnections: this.connections.length,
        maxConnections: this.maxConnections,
        utilizationPercent: Math.round(
          (active / this.maxConnections) * 100
        ),
      };
    } catch (error) {
      this.logger.error('Error getting pool stats:', error);
      return {
        active: 0,
        idle: 0,
        waiting: 0,
        totalConnections: 0,
        maxConnections: this.maxConnections,
        utilizationPercent: 0,
      };
    }
  }

  /**
   * Resize the connection pool
   */
  async resizePool(minSize: number, maxSize: number): Promise<void> {
    try {
      if (minSize > maxSize) {
        throw new Error('minConnections cannot be greater than maxConnections');
      }

      this.minConnections = minSize;
      this.maxConnections = maxSize;

      // Remove excess connections if reducing max size
      while (this.connections.length > maxSize) {
        const connection = this.connections.pop();
        if (connection) {
          await this.closeConnection(connection);
        }
      }

      // Add new minimum connections if increasing
      while (this.connections.length < minSize) {
        const connection = await this.createConnection();
        this.connections.push(connection);
        this.availableConnections.push(connection);
      }

      this.logger.info(
        `Connection pool resized: min=${minSize}, max=${maxSize}`
      );
    } catch (error) {
      this.logger.error('Error resizing pool:', error);
      throw error;
    }
  }

  /**
   * Close all connections in the pool
   */
  async closePool(): Promise<void> {
    try {
      // Close all connections
      for (const connection of this.connections) {
        await this.closeConnection(connection);
      }

      this.connections = [];
      this.availableConnections = [];
      this.waitingQueue = [];

      this.logger.info('Connection pool closed');
    } catch (error) {
      this.logger.error('Error closing pool:', error);
      throw error;
    }
  }

  // Private helper methods

  private async createConnection(): Promise<any> {
    try {
      // Create a new database connection
      const connection = {
        id: `conn_${Date.now()}_${Math.random()}`,
        metadata: {
          createdAt: new Date(),
          isActive: false,
          lastUsed: new Date(),
        },
        query: this.db.query.bind(this.db),
        release: () => this.releaseConnection(connection),
      };

      return connection;
    } catch (error) {
      this.logger.error('Error creating connection:', error);
      throw error;
    }
  }

  private async closeConnection(connection: any): Promise<void> {
    try {
      if (connection && connection.end) {
        await connection.end();
      }
    } catch (error) {
      this.logger.warn('Error closing connection:', error);
    }
  }

  private markConnectionActive(connection: any): void {
    if (connection && connection.metadata) {
      connection.metadata.isActive = true;
      connection.metadata.lastUsed = new Date();
    }
  }

  private markConnectionIdle(connection: any): void {
    if (connection && connection.metadata) {
      connection.metadata.isActive = false;
      connection.metadata.lastUsed = new Date();
    }
  }

  private startIdleTimeoutMonitor(): void {
    setInterval(async () => {
      const now = new Date().getTime();
      const connectionsToClose: any[] = [];

      for (let i = this.availableConnections.length - 1; i >= 0; i--) {
        const connection = this.availableConnections[i];
        const lastUsed = connection.metadata?.lastUsed?.getTime() || 0;

        if (now - lastUsed > this.idleTimeout) {
          // Keep minimum connections
          if (this.connections.length > this.minConnections) {
            connectionsToClose.push(connection);
            this.availableConnections.splice(i, 1);
            this.connections = this.connections.filter(
              conn => conn !== connection
            );
          }
        }
      }

      // Close idle connections
      for (const connection of connectionsToClose) {
        await this.closeConnection(connection);
      }

      if (connectionsToClose.length > 0) {
        this.logger.debug(
          `Closed ${connectionsToClose.length} idle connections`
        );
      }
    }, 60000); // Check every minute
  }
}

export default ConnectionPooling;
