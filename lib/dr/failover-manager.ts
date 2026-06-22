/**
 * Failover Manager - Active-Passive and Multi-Region Failover
 * Handles automatic failover with health checks and audit trails
 */

export type FailoverMode = 'active-passive' | 'active-active' | 'multi-region';

export interface FailoverNode {
  id: string;
  name: string;
  region: string;
  endpoint: string;
  isActive: boolean;
  isPrimary: boolean;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
    uptime: number;
  };
  capacity: {
    cpu: number; // 0-100
    memory: number; // 0-100
    storage: number; // 0-100
    connections: number;
  };
  createdAt: Date;
}

export interface FailoverPolicy {
  id: string;
  name: string;
  mode: FailoverMode;
  nodes: FailoverNode[];
  healthCheckInterval: number; // milliseconds
  healthCheckTimeout: number; // milliseconds
  failoverThreshold: number; // consecutive failures before failover
  gracefulShutdownTimeout: number; // milliseconds
  readinessProbeEndpoint: string;
  livenessProbeEndpoint: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FailoverTrigger {
  id: string;
  policyId: string;
  nodeId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FailoverEvent {
  id: string;
  policyId: string;
  sourceNodeId: string;
  targetNodeId: string;
  trigger: FailoverTrigger;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  status: 'initiated' | 'in-progress' | 'completed' | 'rolled-back' | 'failed';
  error?: string;
  dataLossAmount?: number; // in records or transactions
  affectedUsers: number;
  rollbackable: boolean;
}

export interface FailoverAuditLog {
  id: string;
  policyId: string;
  event: string;
  details: Record<string, any>;
  timestamp: Date;
  userId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export class FailoverManager {
  private policies: Map<string, FailoverPolicy> = new Map();
  private triggers: Map<string, FailoverTrigger> = new Map();
  private events: Map<string, FailoverEvent> = new Map();
  private auditLogs: Map<string, FailoverAuditLog> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timer> = new Map();
  private currentPrimary: Map<string, string> = new Map(); // policyId -> nodeId

  /**
   * Create failover policy
   */
  createPolicy(policy: Omit<FailoverPolicy, 'id' | 'createdAt' | 'updatedAt'>): FailoverPolicy {
    const id = this.generateId();
    const now = new Date();

    const newPolicy: FailoverPolicy = {
      ...policy,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(id, newPolicy);

    // Set initial primary
    const primaryNode = policy.nodes.find((n) => n.isPrimary);
    if (primaryNode) {
      this.currentPrimary.set(id, primaryNode.id);
    }

    // Start health checks if enabled
    if (newPolicy.enabled) {
      this.startHealthChecks(id);
    }

    this.logAuditEvent(id, 'policy_created', { policyId: id });

    return newPolicy;
  }

  /**
   * Update failover policy
   */
  updatePolicy(policyId: string, updates: Partial<FailoverPolicy>): FailoverPolicy | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updated: FailoverPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updated);

    // Update health checks if enabled status changed
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.startHealthChecks(policyId);
      } else {
        this.stopHealthChecks(policyId);
      }
    }

    this.logAuditEvent(policyId, 'policy_updated', { policyId, changes: updates });

    return updated;
  }

  /**
   * Delete failover policy
   */
  deletePolicy(policyId: string): boolean {
    this.stopHealthChecks(policyId);
    this.policies.delete(policyId);
    this.currentPrimary.delete(policyId);
    return true;
  }

  /**
   * Get policy
   */
  getPolicy(policyId: string): FailoverPolicy | null {
    return this.policies.get(policyId) || null;
  }

  /**
   * List policies
   */
  listPolicies(filters?: { enabled?: boolean }): FailoverPolicy[] {
    let policies = Array.from(this.policies.values());

    if (filters?.enabled !== undefined) {
      policies = policies.filter((p) => p.enabled === filters.enabled);
    }

    return policies;
  }

  /**
   * Start health checks for a policy
   */
  private startHealthChecks(policyId: string): void {
    const policy = this.policies.get(policyId);
    if (!policy) return;

    const timer = setInterval(() => {
      this.performHealthChecks(policyId);
    }, policy.healthCheckInterval);

    this.healthCheckTimers.set(policyId, timer);

    // Perform initial health check
    this.performHealthChecks(policyId);
  }

  /**
   * Stop health checks for a policy
   */
  private stopHealthChecks(policyId: string): void {
    const timer = this.healthCheckTimers.get(policyId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(policyId);
    }
  }

  /**
   * Perform health checks for all nodes in a policy
   */
  private async performHealthChecks(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy || !policy.enabled) return;

    for (const node of policy.nodes) {
      try {
        const health = await this.checkNodeHealth(node);

        // Update node health
        node.health = health;

        // Check if failover is needed
        if (health.status === 'unhealthy' && node.isPrimary) {
          this.triggerFailover(policyId, node.id, 'Node health check failed');
        }
      } catch (error: any) {
        console.error(`Health check failed for node ${node.id}:`, error);

        node.health.status = 'unhealthy';
        node.health.lastCheck = new Date();

        if (node.isPrimary) {
          this.triggerFailover(policyId, node.id, error.message);
        }
      }
    }
  }

  /**
   * Check individual node health
   */
  private async checkNodeHealth(node: FailoverNode): Promise<FailoverNode['health']> {
    const startTime = Date.now();

    try {
      // In production, actually call the health check endpoint
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime,
        uptime: 99.9,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        uptime: 0,
      };
    }
  }

  /**
   * Trigger failover
   */
  private async triggerFailover(policyId: string, failedNodeId: string, reason: string): Promise<FailoverEvent | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const triggerId = this.generateId();
    const trigger: FailoverTrigger = {
      id: triggerId,
      policyId,
      nodeId: failedNodeId,
      reason,
      severity: 'high',
      timestamp: new Date(),
    };

    this.triggers.set(triggerId, trigger);

    // Find a healthy standby node
    const standbyNode = policy.nodes.find(
      (n) => !n.isPrimary && n.health.status === 'healthy'
    );

    if (!standbyNode) {
      this.logAuditEvent(policyId, 'failover_failed', {
        nodeId: failedNodeId,
        reason: 'No healthy standby nodes available',
      });
      return null;
    }

    // Execute failover
    return this.executeFailover(policy, failedNodeId, standbyNode.id, trigger);
  }

  /**
   * Execute failover
   */
  private async executeFailover(
    policy: FailoverPolicy,
    sourceNodeId: string,
    targetNodeId: string,
    trigger: FailoverTrigger
  ): Promise<FailoverEvent> {
    const eventId = this.generateId();
    const startTime = Date.now();

    const event: FailoverEvent = {
      id: eventId,
      policyId: policy.id,
      sourceNodeId,
      targetNodeId,
      trigger,
      startedAt: new Date(),
      status: 'in-progress',
      affectedUsers: 0,
      rollbackable: true,
    };

    this.events.set(eventId, event);

    try {
      // Perform graceful shutdown of failed node
      const sourceNode = policy.nodes.find((n) => n.id === sourceNodeId);
      if (sourceNode) {
        await this.gracefulShutdown(sourceNode);
      }

      // Promote standby node to primary
      const targetNode = policy.nodes.find((n) => n.id === targetNodeId);
      if (targetNode) {
        targetNode.isPrimary = true;
        targetNode.isActive = true;
        this.currentPrimary.set(policy.id, targetNodeId);
      }

      // If source node exists, make it standby
      if (sourceNode) {
        sourceNode.isPrimary = false;
        sourceNode.isActive = false;
      }

      event.status = 'completed';
      event.completedAt = new Date();
      event.duration = event.completedAt.getTime() - startTime;

      this.logAuditEvent(policy.id, 'failover_completed', {
        eventId,
        sourceNodeId,
        targetNodeId,
        duration: event.duration,
      });
    } catch (error: any) {
      event.status = 'failed';
      event.error = error.message;
      event.completedAt = new Date();
      event.duration = event.completedAt.getTime() - startTime;

      this.logAuditEvent(policy.id, 'failover_failed', {
        eventId,
        sourceNodeId,
        targetNodeId,
        error: error.message,
      });
    }

    return event;
  }

  /**
   * Graceful shutdown of node
   */
  private async gracefulShutdown(node: FailoverNode): Promise<void> {
    console.log(`Performing graceful shutdown of node ${node.id}`);

    // In production, drain connections, stop accepting new requests, etc.
    // Wait for in-flight requests to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  /**
   * Rollback failover
   */
  async rollbackFailover(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event || !event.rollbackable || event.status !== 'completed') {
      return false;
    }

    const policy = this.policies.get(event.policyId);
    if (!policy) return false;

    try {
      const sourceNode = policy.nodes.find((n) => n.id === event.sourceNodeId);
      const targetNode = policy.nodes.find((n) => n.id === event.targetNodeId);

      if (!sourceNode || !targetNode) return false;

      // Restore original configuration
      sourceNode.isPrimary = true;
      sourceNode.isActive = true;
      targetNode.isPrimary = false;
      targetNode.isActive = false;

      this.currentPrimary.set(policy.id, sourceNode.id);

      event.status = 'rolled-back';

      this.logAuditEvent(policy.id, 'failover_rolled_back', {
        eventId,
        sourceNodeId: event.sourceNodeId,
        targetNodeId: event.targetNodeId,
      });

      return true;
    } catch (error: any) {
      this.logAuditEvent(policy.id, 'rollback_failed', {
        eventId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get current primary node
   */
  getPrimaryNode(policyId: string): FailoverNode | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const primaryNodeId = this.currentPrimary.get(policyId);
    return policy.nodes.find((n) => n.id === primaryNodeId) || null;
  }

  /**
   * Get failover event
   */
  getFailoverEvent(eventId: string): FailoverEvent | null {
    return this.events.get(eventId) || null;
  }

  /**
   * List failover events
   */
  listFailoverEvents(policyId: string, limit: number = 50): FailoverEvent[] {
    return Array.from(this.events.values())
      .filter((e) => e.policyId === policyId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(policyId: string, limit: number = 100): FailoverAuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter((l) => l.policyId === policyId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    policyId: string,
    event: string,
    details: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): void {
    const logId = this.generateId();

    const log: FailoverAuditLog = {
      id: logId,
      policyId,
      event,
      details,
      timestamp: new Date(),
      severity,
    };

    this.auditLogs.set(logId, log);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();
  }
}

export default FailoverManager;
