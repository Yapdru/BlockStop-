import { EventEmitter } from 'events';

export interface InstanceSizeConfig {
  name: string;
  cpu: number;
  memory: number;
  bandwidth: number;
  costPerHour: number;
}

export interface ScalingResult {
  success: boolean;
  instanceId: string;
  oldSize: string;
  newSize: string;
  reason: string;
  timestamp: Date;
}

export class VerticalScaler extends EventEmitter {
  private availableSizes: Map<string, InstanceSizeConfig> = new Map();
  private instanceSizes: Map<string, string> = new Map();
  private scalingHistory: ScalingResult[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor() {
    super();
    this.initializeDefaultSizes();
  }

  private initializeDefaultSizes(): void {
    const sizes: InstanceSizeConfig[] = [
      {
        name: 'small',
        cpu: 1,
        memory: 512,
        bandwidth: 125,
        costPerHour: 0.0116,
      },
      {
        name: 'medium',
        cpu: 2,
        memory: 1024,
        bandwidth: 500,
        costPerHour: 0.0233,
      },
      {
        name: 'large',
        cpu: 4,
        memory: 2048,
        bandwidth: 1000,
        costPerHour: 0.0465,
      },
      {
        name: 'xlarge',
        cpu: 8,
        memory: 4096,
        bandwidth: 2000,
        costPerHour: 0.0930,
      },
      {
        name: '2xlarge',
        cpu: 16,
        memory: 8192,
        bandwidth: 4000,
        costPerHour: 0.1860,
      },
    ];

    for (const size of sizes) {
      this.availableSizes.set(size.name, size);
    }
  }

  async upgradeInstance(instanceId: string, newSize: string): Promise<{ success: boolean; newSize: string }> {
    try {
      const oldSize = this.instanceSizes.get(instanceId) || 'unknown';
      const newConfig = this.availableSizes.get(newSize);

      if (!newConfig) {
        throw new Error(`Unknown instance size: ${newSize}`);
      }

      const oldConfig = oldSize !== 'unknown' ? this.availableSizes.get(oldSize) : null;

      // Check if upgrade is valid
      if (oldConfig && oldConfig.cpu >= newConfig.cpu) {
        throw new Error(`Cannot upgrade: ${newSize} is not larger than ${oldSize}`);
      }

      // Simulate upgrade process
      const upgraded = await this.performUpgrade(instanceId, newSize);

      if (upgraded) {
        this.instanceSizes.set(instanceId, newSize);

        const result: ScalingResult = {
          success: true,
          instanceId,
          oldSize,
          newSize,
          reason: `Upgraded instance from ${oldSize} to ${newSize}`,
          timestamp: new Date(),
        };

        this.scalingHistory.push(result);
        if (this.scalingHistory.length > this.MAX_HISTORY) {
          this.scalingHistory.shift();
        }

        this.emit('instance-upgraded', result);

        return { success: true, newSize };
      }

      throw new Error('Upgrade process failed');
    } catch (error) {
      this.emit('error', { type: 'upgrade-failed', instanceId, newSize, error });
      throw error;
    }
  }

  async downgradeInstance(
    instanceId: string,
    newSize: string
  ): Promise<{ success: boolean; newSize: string }> {
    try {
      const oldSize = this.instanceSizes.get(instanceId) || 'unknown';
      const newConfig = this.availableSizes.get(newSize);

      if (!newConfig) {
        throw new Error(`Unknown instance size: ${newSize}`);
      }

      const oldConfig = oldSize !== 'unknown' ? this.availableSizes.get(oldSize) : null;

      // Check if downgrade is valid
      if (oldConfig && oldConfig.cpu <= newConfig.cpu) {
        throw new Error(`Cannot downgrade: ${newSize} is not smaller than ${oldSize}`);
      }

      // Simulate downgrade process
      const downgraded = await this.performDowngrade(instanceId, newSize);

      if (downgraded) {
        this.instanceSizes.set(instanceId, newSize);

        const result: ScalingResult = {
          success: true,
          instanceId,
          oldSize,
          newSize,
          reason: `Downgraded instance from ${oldSize} to ${newSize}`,
          timestamp: new Date(),
        };

        this.scalingHistory.push(result);
        if (this.scalingHistory.length > this.MAX_HISTORY) {
          this.scalingHistory.shift();
        }

        this.emit('instance-downgraded', result);

        return { success: true, newSize };
      }

      throw new Error('Downgrade process failed');
    } catch (error) {
      this.emit('error', { type: 'downgrade-failed', instanceId, newSize, error });
      throw error;
    }
  }

  async getAvailableSizes(): Promise<string[]> {
    return Array.from(this.availableSizes.keys());
  }

  async getSizeDetails(sizeName: string): Promise<InstanceSizeConfig | null> {
    return this.availableSizes.get(sizeName) || null;
  }

  async getAllSizeDetails(): Promise<InstanceSizeConfig[]> {
    return Array.from(this.availableSizes.values());
  }

  async getInstanceSize(instanceId: string): Promise<string> {
    return this.instanceSizes.get(instanceId) || 'unknown';
  }

  async registerInstance(instanceId: string, size: string): Promise<void> {
    try {
      if (!this.availableSizes.has(size)) {
        throw new Error(`Unknown instance size: ${size}`);
      }

      this.instanceSizes.set(instanceId, size);
      this.emit('instance-registered', { instanceId, size });
    } catch (error) {
      this.emit('error', { type: 'registration-failed', instanceId, size, error });
      throw error;
    }
  }

  async deregisterInstance(instanceId: string): Promise<void> {
    try {
      const size = this.instanceSizes.get(instanceId);
      this.instanceSizes.delete(instanceId);

      if (size) {
        this.emit('instance-deregistered', { instanceId, size });
      }
    } catch (error) {
      this.emit('error', { type: 'deregistration-failed', instanceId, error });
      throw error;
    }
  }

  private async performUpgrade(instanceId: string, newSize: string): Promise<boolean> {
    // Simulate upgrade process
    this.emit('upgrade-started', { instanceId, newSize });

    // Simulate preparation phase
    await this.delay(100);
    this.emit('upgrade-progress', { stage: 'prepare', instanceId });

    // Simulate migration phase
    await this.delay(200);
    this.emit('upgrade-progress', { stage: 'migrate', instanceId });

    // Simulate finalization phase
    await this.delay(100);
    this.emit('upgrade-progress', { stage: 'finalize', instanceId });

    this.emit('upgrade-completed', { instanceId, newSize });

    return true;
  }

  private async performDowngrade(instanceId: string, newSize: string): Promise<boolean> {
    // Simulate downgrade process
    this.emit('downgrade-started', { instanceId, newSize });

    // Simulate preparation phase
    await this.delay(100);
    this.emit('downgrade-progress', { stage: 'prepare', instanceId });

    // Simulate migration phase
    await this.delay(200);
    this.emit('downgrade-progress', { stage: 'migrate', instanceId });

    // Simulate finalization phase
    await this.delay(100);
    this.emit('downgrade-progress', { stage: 'finalize', instanceId });

    this.emit('downgrade-completed', { instanceId, newSize });

    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getScalingHistory(limit: number = 100): Promise<ScalingResult[]> {
    return this.scalingHistory.slice(-limit);
  }

  async getInstanceScalingHistory(
    instanceId: string,
    limit: number = 100
  ): Promise<ScalingResult[]> {
    return this.scalingHistory
      .filter((r) => r.instanceId === instanceId)
      .slice(-limit);
  }

  async getStatus(): Promise<{
    registeredInstances: number;
    availableSizes: number;
    scalingHistory: ScalingResult[];
    instanceSizeDistribution: Record<string, number>;
  }> {
    const distribution: Record<string, number> = {};

    for (const size of this.availableSizes.keys()) {
      distribution[size] = 0;
    }

    for (const size of this.instanceSizes.values()) {
      if (distribution[size] !== undefined) {
        distribution[size]++;
      }
    }

    return {
      registeredInstances: this.instanceSizes.size,
      availableSizes: this.availableSizes.size,
      scalingHistory: this.scalingHistory.slice(-10),
      instanceSizeDistribution: distribution,
    };
  }

  async estimateCostSavings(currentSize: string, newSize: string): Promise<number> {
    const currentConfig = this.availableSizes.get(currentSize);
    const newConfig = this.availableSizes.get(newSize);

    if (!currentConfig || !newConfig) {
      return 0;
    }

    return currentConfig.costPerHour - newConfig.costPerHour;
  }

  async validateSizeChange(
    currentSize: string,
    newSize: string,
    direction: 'upgrade' | 'downgrade'
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const currentConfig = this.availableSizes.get(currentSize);
    const newConfig = this.availableSizes.get(newSize);

    if (!currentConfig) {
      errors.push(`Current size not found: ${currentSize}`);
    }

    if (!newConfig) {
      errors.push(`New size not found: ${newSize}`);
    }

    if (currentConfig && newConfig) {
      if (direction === 'upgrade' && newConfig.cpu <= currentConfig.cpu) {
        errors.push(`Cannot upgrade to ${newSize}: CPU not increased`);
      }

      if (direction === 'downgrade' && newConfig.cpu >= currentConfig.cpu) {
        errors.push(`Cannot downgrade to ${newSize}: CPU not decreased`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  addCustomSize(sizeConfig: InstanceSizeConfig): void {
    this.availableSizes.set(sizeConfig.name, sizeConfig);
    this.emit('custom-size-added', { sizeName: sizeConfig.name });
  }

  removeCustomSize(sizeName: string): boolean {
    const removed = this.availableSizes.delete(sizeName);
    if (removed) {
      this.emit('custom-size-removed', { sizeName });
    }
    return removed;
  }

  clearHistory(): void {
    this.scalingHistory = [];
    this.emit('history-cleared');
  }
}
