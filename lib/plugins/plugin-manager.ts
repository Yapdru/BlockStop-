/**
 * Plugin Manager
 * Manages plugin lifecycle including installation, loading, execution, and removal
 */

import { PluginManifest, PluginInstance, PluginStatus, PluginAPI, HookType } from './plugin-types';
import { PluginLoader, PluginLoaderFactory } from './plugin-loader';
import { PluginStore } from './plugin-store';
import { HookSystem } from './plugin-hooks';
import { PermissionChecker, PermissionAuditor } from './security/permission-checker';
import { AuditLogger } from './security/audit-logger';
import { createPluginAPI } from './plugin-api';

export interface PluginManagerConfig {
  storageBackend?: any;
  sandboxEnabled?: boolean;
  strictPermissions?: boolean;
}

export class PluginManager {
  private loader: PluginLoader;
  private store: PluginStore;
  private hooks: HookSystem;
  private permissionChecker: PermissionChecker;
  private permissionAuditor: PermissionAuditor;
  private auditLogger: AuditLogger;
  private plugins: Map<string, PluginInstance> = new Map();
  private apis: Map<string, PluginAPI> = new Map();
  private config: PluginManagerConfig;
  private blockstopVersion: string = '1.0.0';
  private isInitialized = false;

  constructor(config?: PluginManagerConfig) {
    this.loader = PluginLoaderFactory.getInstance();
    this.store = new PluginStore(config?.storageBackend);
    this.hooks = new HookSystem();
    this.permissionChecker = new PermissionChecker();
    this.permissionAuditor = new PermissionAuditor();
    this.auditLogger = new AuditLogger();
    this.config = config || {};
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load all persisted plugins from storage
      const plugins = await this.store.listPlugins();
      for (const plugin of plugins) {
        this.plugins.set(plugin.manifest.id, plugin);
        this.permissionChecker.setPermissionsForPlugin(
          plugin.manifest.id,
          plugin.manifest.permissions
        );
      }

      this.isInitialized = true;
      this.auditLogger.log({
        level: 'info' as any,
        pluginId: 'system',
        action: 'manager_initialize',
        result: 'success',
      });
    } catch (error) {
      this.auditLogger.logError('system', error as Error);
      throw error;
    }
  }

  public async installPlugin(
    manifestPath: string,
    codePath?: string
  ): Promise<string> {
    try {
      const { manifest, code } = await this.loader.loadPlugin(manifestPath, codePath);

      // Check compatibility
      const compatibility = await this.loader.checkCompatibility(
        manifest,
        this.blockstopVersion
      );

      if (!compatibility.compatible) {
        throw new Error(compatibility.reason);
      }

      // Validate permissions
      const permissionValidation = this.permissionChecker.validatePermissions(manifest);
      if (!permissionValidation.valid) {
        throw new Error(`Invalid permissions: ${permissionValidation.errors.join(', ')}`);
      }

      // Create instance
      const instance = await this.loader.createPluginInstance(manifest);

      // Save to storage
      await this.store.savePlugin(instance);

      // Add to memory cache
      this.plugins.set(manifest.id, instance);

      // Register permissions
      this.permissionChecker.setPermissionsForPlugin(manifest.id, manifest.permissions);

      // Log
      this.auditLogger.logPluginLoad(manifest.id, 'success');

      return manifest.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.auditLogger.logPluginLoad('unknown', 'failure', errorMsg);
      throw error;
    }
  }

  public async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      // Disable if active
      if (plugin.enabled) {
        await this.disablePlugin(pluginId);
      }

      // Unregister hooks
      this.hooks.unregisterPluginHooks(pluginId);

      // Remove from storage
      await this.store.deletePlugin(pluginId);

      // Remove from memory
      this.plugins.delete(pluginId);
      this.apis.delete(pluginId);

      // Log
      this.auditLogger.logPluginUninstall(pluginId, undefined, 'success');
    } catch (error) {
      this.auditLogger.logPluginUninstall(pluginId, undefined, 'failure');
      throw error;
    }
  }

  public async enablePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      // Create API if not exists
      if (!this.apis.has(pluginId)) {
        this.apis.set(pluginId, createPluginAPI(pluginId, plugin.config));
      }

      // Update status
      await this.store.enablePlugin(pluginId);
      plugin.enabled = true;
      plugin.status = PluginStatus.ACTIVE;

      // Emit hook
      await this.hooks.executeHook(HookType.ON_PLUGIN_ENABLED, { pluginId });

      this.auditLogger.logPluginEnable(pluginId, undefined, 'success');
    } catch (error) {
      this.auditLogger.logPluginEnable(pluginId, undefined, 'failure');
      throw error;
    }
  }

  public async disablePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      // Update status
      await this.store.disablePlugin(pluginId);
      plugin.enabled = false;
      plugin.status = PluginStatus.INACTIVE;

      // Emit hook
      await this.hooks.executeHook(HookType.ON_PLUGIN_DISABLED, { pluginId });

      this.auditLogger.logPluginDisable(pluginId, undefined, 'success');
    } catch (error) {
      this.auditLogger.logPluginDisable(pluginId, undefined, 'failure');
      throw error;
    }
  }

  public async updatePluginConfig(
    pluginId: string,
    config: Record<string, unknown>
  ): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    await this.store.updatePluginConfig(pluginId, config);
    plugin.config = { ...plugin.config, ...config };

    // Update API config
    const api = this.apis.get(pluginId);
    if (api) {
      for (const [key, value] of Object.entries(config)) {
        api.config.set(key, value);
      }
    }
  }

  public getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  public getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  public getEnabledPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  public getPluginsByStatus(status: PluginStatus): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(p => p.status === status);
  }

  public getPluginAPI(pluginId: string): PluginAPI | undefined {
    return this.apis.get(pluginId);
  }

  public registerHook(
    pluginId: string,
    type: HookType,
    handler: (data: unknown) => Promise<void>,
    priority?: number
  ): string {
    // Verify plugin has permission
    if (!this.permissionChecker.hasPermission(pluginId, 'hooks', 'register')) {
      throw new Error(`Plugin ${pluginId} does not have permission to register hooks`);
    }

    return this.hooks.registerHook(pluginId, type, handler, priority);
  }

  public unregisterHook(hookId: string): boolean {
    return this.hooks.unregisterHook(hookId);
  }

  public async executeHook(type: HookType, data?: unknown): Promise<any> {
    return this.hooks.executeHook(type, data);
  }

  public async executeHookSequential(type: HookType, data?: unknown): Promise<any> {
    return this.hooks.executeHookSequential(type, data);
  }

  public getHooks(type?: HookType): any[] {
    if (type) {
      return this.hooks.getHooksForType(type);
    }
    const all = this.hooks.getAllHooks();
    const result = [];
    for (const hooks of all.values()) {
      result.push(...hooks);
    }
    return result;
  }

  public getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  public getPermissionChecker(): PermissionChecker {
    return this.permissionChecker;
  }

  public getHookSystem(): HookSystem {
    return this.hooks;
  }

  public async getStatistics(): Promise<any> {
    return {
      total: this.plugins.size,
      enabled: Array.from(this.plugins.values()).filter(p => p.enabled).length,
      hooks: this.hooks.getHookCount(),
      audit: this.auditLogger.getStatistics(),
    };
  }

  public setBlockstopVersion(version: string): void {
    this.blockstopVersion = version;
  }

  public getBlockstopVersion(): string {
    return this.blockstopVersion;
  }
}

export class PluginManagerFactory {
  private static instance: PluginManager;

  public static getInstance(config?: PluginManagerConfig): PluginManager {
    if (!this.instance) {
      this.instance = new PluginManager(config);
    }
    return this.instance;
  }

  public static createNew(config?: PluginManagerConfig): PluginManager {
    return new PluginManager(config);
  }

  public static reset(): void {
    this.instance = undefined as any;
  }
}
