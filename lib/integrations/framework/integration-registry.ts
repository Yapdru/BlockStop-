/**
 * Integration Registry
 * Manages discovery and registration of integrations
 */

import { IntegrationBase } from './integration-base';
import { IntegrationConfig, IntegrationCategory } from '../types';
import crypto from 'crypto';

export interface RegisteredIntegration {
  id: string;
  name: string;
  category: IntegrationCategory;
  instance: IntegrationBase;
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface IntegrationDefinition {
  name: string;
  category: IntegrationCategory;
  description: string;
  version: string;
  factory: (name: string, config: IntegrationConfig) => Promise<IntegrationBase>;
  requiredFields: string[];
  optionalFields?: string[];
  schema?: Record<string, any>;
}

class IntegrationRegistry {
  private integrations: Map<string, RegisteredIntegration> = new Map();
  private definitions: Map<string, IntegrationDefinition> = new Map();
  private initializationQueue: Map<string, Promise<void>> = new Map();
  private hooks = {
    beforeRegister: [] as Array<(def: IntegrationDefinition) => Promise<void>>,
    afterRegister: [] as Array<(integration: RegisteredIntegration) => Promise<void>>,
    beforeUnregister: [] as Array<(id: string) => Promise<void>>,
  };

  /**
   * Register an integration definition
   */
  registerDefinition(definition: IntegrationDefinition): void {
    const key = `${definition.category}:${definition.name}`;

    if (this.definitions.has(key)) {
      throw new Error(`Integration definition already registered: ${key}`);
    }

    this.definitions.set(key, definition);
  }

  /**
   * Create and register an integration instance
   */
  async registerIntegration(
    name: string,
    category: IntegrationCategory,
    config: IntegrationConfig
  ): Promise<RegisteredIntegration> {
    const key = `${category}:${name}`;
    const definition = this.definitions.get(key);

    if (!definition) {
      throw new Error(`Integration definition not found: ${key}`);
    }

    // Run before hooks
    for (const hook of this.hooks.beforeRegister) {
      await hook(definition);
    }

    try {
      // Create instance
      const instance = await definition.factory(name, config);
      await instance.initialize();

      // Create registration record
      const integration: RegisteredIntegration = {
        id: crypto.randomUUID(),
        name,
        category,
        instance,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
        metadata: {},
      };

      this.integrations.set(integration.id, integration);

      // Run after hooks
      for (const hook of this.hooks.afterRegister) {
        await hook(integration);
      }

      return integration;
    } catch (error) {
      throw new Error(`Failed to register integration ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unregister an integration
   */
  async unregisterIntegration(id: string): Promise<void> {
    const integration = this.integrations.get(id);

    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    // Run before hooks
    for (const hook of this.hooks.beforeUnregister) {
      await hook(id);
    }

    try {
      await integration.instance.onTeardown();
      this.integrations.delete(id);
    } catch (error) {
      throw new Error(`Failed to unregister integration ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get integration instance
   */
  getIntegration(id: string): RegisteredIntegration | null {
    return this.integrations.get(id) || null;
  }

  /**
   * Get integration by name and category
   */
  getIntegrationByName(name: string, category: IntegrationCategory): RegisteredIntegration | null {
    for (const integration of this.integrations.values()) {
      if (integration.name === name && integration.category === category) {
        return integration;
      }
    }
    return null;
  }

  /**
   * List all integrations
   */
  listIntegrations(category?: IntegrationCategory, enabledOnly: boolean = false): RegisteredIntegration[] {
    return Array.from(this.integrations.values()).filter((i) => {
      if (category && i.category !== category) return false;
      if (enabledOnly && !i.enabled) return false;
      return true;
    });
  }

  /**
   * List available integration definitions
   */
  listDefinitions(category?: IntegrationCategory): IntegrationDefinition[] {
    return Array.from(this.definitions.values()).filter((d) => {
      if (category && d.category !== category) return false;
      return true;
    });
  }

  /**
   * Get integration definition
   */
  getDefinition(name: string, category: IntegrationCategory): IntegrationDefinition | null {
    const key = `${category}:${name}`;
    return this.definitions.get(key) || null;
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfig(id: string, newConfig: IntegrationConfig): Promise<RegisteredIntegration> {
    const integration = this.integrations.get(id);

    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    try {
      await integration.instance.onConfigUpdate(newConfig);
      integration.updatedAt = new Date();
      return integration;
    } catch (error) {
      throw new Error(
        `Failed to update integration config ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Enable integration
   */
  enableIntegration(id: string): RegisteredIntegration {
    const integration = this.integrations.get(id);

    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    integration.instance.setEnabled(true);
    integration.enabled = true;
    integration.updatedAt = new Date();

    return integration;
  }

  /**
   * Disable integration
   */
  disableIntegration(id: string): RegisteredIntegration {
    const integration = this.integrations.get(id);

    if (!integration) {
      throw new Error(`Integration not found: ${id}`);
    }

    integration.instance.setEnabled(false);
    integration.enabled = false;
    integration.updatedAt = new Date();

    return integration;
  }

  /**
   * Register hook
   */
  onBeforeRegister(hook: (def: IntegrationDefinition) => Promise<void>): void {
    this.hooks.beforeRegister.push(hook);
  }

  onAfterRegister(hook: (integration: RegisteredIntegration) => Promise<void>): void {
    this.hooks.afterRegister.push(hook);
  }

  onBeforeUnregister(hook: (id: string) => Promise<void>): void {
    this.hooks.beforeUnregister.push(hook);
  }

  /**
   * Clear all integrations and definitions
   */
  clear(): void {
    this.integrations.clear();
    this.definitions.clear();
    this.initializationQueue.clear();
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const integrations = this.listIntegrations();
    const categories = new Map<IntegrationCategory, number>();

    for (const integration of integrations) {
      categories.set(integration.category, (categories.get(integration.category) || 0) + 1);
    }

    return {
      totalIntegrations: integrations.length,
      enabledIntegrations: integrations.filter((i) => i.enabled).length,
      disabledIntegrations: integrations.filter((i) => !i.enabled).length,
      totalDefinitions: this.definitions.size,
      byCategory: Object.fromEntries(categories),
    };
  }
}

export const integrationRegistry = new IntegrationRegistry();
