/**
 * BlockStop Plugin SDK
 * Main SDK entry point for plugin developers
 */

// Type exports
export type { PluginConfig, PluginPermission, ThreatDetails, Threat, ScanResult, FileInfo, Webhook, HttpOptions, LogEntry, StorageItem } from './types';
export { PluginType, HookType } from './types';

// API Client
export { PluginAPIClient, createAPIClient } from './api';

// Hook Management
export { HookManager, createHookManager } from './hooks';
export { onThreatDetected, beforeThreatScan, afterThreatScan, beforeDataProcess, afterDataProcess, onPluginEnable, onPluginDisable } from './hooks';
export type { Hook, HookContext } from './hooks';

// Storage
export { PluginStorage, MemoryStorage, LocalStorageAdapter, createStorage, createLocalStorage } from './storage';
export type { StorageBackend } from './storage';

// Logging
export { PluginLogger, createLogger, createChildLogger } from './logger';
export { LogLevel } from './logger';
export type { LogHandler } from './logger';

// Validation
export { Validator, SchemaValidator, createValidator } from './validation';
export type { ValidationError, ValidationResult } from './validation';

// Main Plugin Context
export interface PluginContext {
  id: string;
  name: string;
  version: string;
  api: ReturnType<typeof createAPIClient>;
  hooks: ReturnType<typeof createHookManager>;
  storage: PluginStorage;
  logger: PluginLogger;
  config: Record<string, unknown>;
}

/**
 * Initialize a plugin context
 */
export function createPluginContext(options: {
  id: string;
  name: string;
  version: string;
  apiBaseUrl: string;
  apiToken?: string;
  logLevel?: any;
  storageBackend?: any;
  config?: Record<string, unknown>;
}): PluginContext {
  const { createAPIClient } = require('./api');
  const { createHookManager } = require('./hooks');
  const { createStorage } = require('./storage');
  const { createLogger, LogLevel } = require('./logger');

  return {
    id: options.id,
    name: options.name,
    version: options.version,
    api: createAPIClient(options.apiBaseUrl, options.id, options.apiToken),
    hooks: createHookManager(options.id),
    storage: createStorage(options.id, options.storageBackend),
    logger: createLogger(options.name, options.logLevel || 1),
    config: options.config || {},
  };
}

// Plugin class for easier inheritance
export class Plugin {
  protected id: string;
  protected name: string;
  protected version: string;
  protected context: PluginContext;

  constructor(context: PluginContext) {
    this.id = context.id;
    this.name = context.name;
    this.version = context.version;
    this.context = context;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getVersion(): string {
    return this.version;
  }

  public getContext(): PluginContext {
    return this.context;
  }

  public async initialize(): Promise<void> {
    this.context.logger.info(`Initializing plugin ${this.name} v${this.version}`);
  }

  public async shutdown(): Promise<void> {
    this.context.logger.info(`Shutting down plugin ${this.name}`);
  }

  public async execute(action: string, params?: Record<string, unknown>): Promise<unknown> {
    this.context.logger.info(`Executing action: ${action}`, params);
    throw new Error('Not implemented');
  }
}

// Helper functions
export async function registerPlugins(
  context: PluginContext,
  plugins: Plugin[]
): Promise<void> {
  for (const plugin of plugins) {
    await plugin.initialize();
  }
}

export async function shutdownPlugins(plugins: Plugin[]): Promise<void> {
  for (const plugin of plugins) {
    await plugin.shutdown();
  }
}

// Version info
export const SDK_VERSION = '1.0.0';
export const SDK_NAME = 'BlockStop Plugin SDK';
