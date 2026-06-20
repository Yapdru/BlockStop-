import { EventEmitter } from 'events';

export interface Instance {
  id: string;
  url: string;
  healthy: boolean;
  connections: number;
}

export interface LoadBalancerStats {
  totalInstances: number;
  healthyInstances: number;
  totalConnections: number;
  averageConnections: number;
  lastHealthCheck: Date;
}

export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'random';

export class LoadBalancer extends EventEmitter {
  private instances: Map<string, Instance> = new Map();
  private roundRobinIndex: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthChecking: boolean = false;
  private lastHealthCheck: Date = new Date();
  private connectionHistory: Map<string, number[]> = new Map();
  private strategy: LoadBalancingStrategy = 'least-connections';
  private readonly MAX_HEALTH_CHECK_HISTORY = 100;

  constructor(strategy: LoadBalancingStrategy = 'least-connections') {
    super();
    this.strategy = strategy;
  }

  async selectInstance(instances: Instance[]): Promise<Instance> {
    try {
      const healthy = instances.filter((i) => i.healthy);

      if (healthy.length === 0) {
        throw new Error('No healthy instances available');
      }

      let selected: Instance;

      switch (this.strategy) {
        case 'round-robin':
          selected = this.roundRobinSelect(healthy);
          break;
        case 'least-connections':
          selected = this.leastConnectionsSelect(healthy);
          break;
        case 'random':
          selected = this.randomSelect(healthy);
          break;
        default:
          selected = healthy[0];
      }

      this.emit('instance-selected', { instanceId: selected.id, strategy: this.strategy });
      return selected;
    } catch (error) {
      this.emit('error', { type: 'selection-failed', error });
      throw error;
    }
  }

  async registerInstance(instance: Instance): Promise<void> {
    try {
      if (!instance.id || !instance.url) {
        throw new Error('Instance must have id and url');
      }

      this.instances.set(instance.id, instance);
      this.connectionHistory.set(instance.id, []);

      this.emit('instance-registered', { instanceId: instance.id });
    } catch (error) {
      this.emit('error', { type: 'registration-failed', instance, error });
      throw error;
    }
  }

  async deregisterInstance(instanceId: string): Promise<void> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        throw new Error(`Instance not found: ${instanceId}`);
      }

      this.instances.delete(instanceId);
      this.connectionHistory.delete(instanceId);

      this.emit('instance-deregistered', { instanceId });
    } catch (error) {
      this.emit('error', { type: 'deregistration-failed', instanceId, error });
      throw error;
    }
  }

  async getLoadDistribution(): Promise<Map<string, number>> {
    const distribution = new Map<string, number>();

    for (const [id, instance] of this.instances) {
      distribution.set(id, instance.connections);
    }

    return distribution;
  }

  async performHealthCheck(instance: Instance): Promise<boolean> {
    try {
      // Simulate health check with 95% success rate
      const healthy = Math.random() > 0.05;

      instance.healthy = healthy;
      this.instances.set(instance.id, instance);

      if (!this.connectionHistory.has(instance.id)) {
        this.connectionHistory.set(instance.id, []);
      }

      const history = this.connectionHistory.get(instance.id)!;
      history.push(healthy ? 1 : 0);

      if (history.length > this.MAX_HEALTH_CHECK_HISTORY) {
        history.shift();
      }

      this.emit('health-check-completed', {
        instanceId: instance.id,
        healthy,
      });

      return healthy;
    } catch (error) {
      this.emit('error', { type: 'health-check-failed', instanceId: instance.id, error });
      throw error;
    }
  }

  async startHealthChecking(interval: number = 30000): Promise<void> {
    try {
      if (this.isHealthChecking) {
        throw new Error('Health checking already running');
      }

      this.isHealthChecking = true;

      // Initial health check
      await this.checkAllInstances();

      // Schedule periodic health checks
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.checkAllInstances();
        } catch (error) {
          this.emit('error', { type: 'periodic-health-check-failed', error });
        }
      }, interval);

      this.emit('health-checking-started', { interval });
    } catch (error) {
      this.emit('error', { type: 'health-check-start-failed', error });
      throw error;
    }
  }

  async stopHealthChecking(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      this.isHealthChecking = false;
      this.emit('health-checking-stopped');
    } catch (error) {
      this.emit('error', { type: 'health-check-stop-failed', error });
      throw error;
    }
  }

  private async checkAllInstances(): Promise<void> {
    for (const instance of this.instances.values()) {
      await this.performHealthCheck(instance);
    }

    this.lastHealthCheck = new Date();
  }

  private roundRobinSelect(instances: Instance[]): Instance {
    const selected = instances[this.roundRobinIndex % instances.length];
    this.roundRobinIndex++;
    return selected;
  }

  private leastConnectionsSelect(instances: Instance[]): Instance {
    let minConnections = Infinity;
    let selected = instances[0];

    for (const instance of instances) {
      if (instance.connections < minConnections) {
        minConnections = instance.connections;
        selected = instance;
      }
    }

    return selected;
  }

  private randomSelect(instances: Instance[]): Instance {
    return instances[Math.floor(Math.random() * instances.length)];
  }

  async recordConnection(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.connections++;
      this.emit('connection-recorded', { instanceId, connections: instance.connections });
    }
  }

  async recordDisconnection(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance && instance.connections > 0) {
      instance.connections--;
      this.emit('disconnection-recorded', { instanceId, connections: instance.connections });
    }
  }

  async getLoadBalancerStats(): Promise<LoadBalancerStats> {
    let totalConnections = 0;
    let healthyCount = 0;

    for (const instance of this.instances.values()) {
      totalConnections += instance.connections;
      if (instance.healthy) {
        healthyCount++;
      }
    }

    return {
      totalInstances: this.instances.size,
      healthyInstances: healthyCount,
      totalConnections,
      averageConnections:
        this.instances.size > 0 ? totalConnections / this.instances.size : 0,
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  getHealthCheckStatus(): {
    isHealthChecking: boolean;
    lastHealthCheck: Date;
    totalHealthyInstances: number;
    totalInstances: number;
  } {
    let healthyCount = 0;

    for (const instance of this.instances.values()) {
      if (instance.healthy) {
        healthyCount++;
      }
    }

    return {
      isHealthChecking: this.isHealthChecking,
      lastHealthCheck: this.lastHealthCheck,
      totalHealthyInstances: healthyCount,
      totalInstances: this.instances.size,
    };
  }

  setLoadBalancingStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
    this.roundRobinIndex = 0;
    this.emit('strategy-changed', { strategy });
  }

  async getInstanceDetails(instanceId: string): Promise<Instance | null> {
    return this.instances.get(instanceId) || null;
  }

  async getAllInstances(): Promise<Instance[]> {
    return Array.from(this.instances.values());
  }

  getInstanceCount(): number {
    return this.instances.size;
  }

  getHealthyInstanceCount(): number {
    let count = 0;
    for (const instance of this.instances.values()) {
      if (instance.healthy) {
        count++;
      }
    }
    return count;
  }
}
