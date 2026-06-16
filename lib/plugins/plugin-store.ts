/**
 * Plugin Store
 * Manages plugin storage and persistence
 */

import { PluginInstance, PluginManifest, PluginConfig, PluginStatus } from './plugin-types';

export interface StorageBackend {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(pattern?: string): Promise<string[]>;
  clear(): Promise<void>;
}

export class MemoryStorageBackend implements StorageBackend {
  private store: Map<string, unknown> = new Map();

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return (value as T) || null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.store.keys());
    if (pattern) {
      const regex = new RegExp(pattern);
      return keys.filter(k => regex.test(k));
    }
    return keys;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class PluginStore {
  private backend: StorageBackend;
  private pluginCache: Map<string, PluginInstance> = new Map();
  private cacheEnabled: boolean = true;

  constructor(backend?: StorageBackend) {
    this.backend = backend || new MemoryStorageBackend();
  }

  public async savePlugin(plugin: PluginInstance): Promise<void> {
    const key = `plugin:${plugin.manifest.id}`;
    await this.backend.set(key, plugin);

    // Update cache
    if (this.cacheEnabled) {
      this.pluginCache.set(plugin.manifest.id, plugin);
    }
  }

  public async getPlugin(pluginId: string): Promise<PluginInstance | null> {
    // Check cache first
    if (this.cacheEnabled && this.pluginCache.has(pluginId)) {
      return this.pluginCache.get(pluginId) || null;
    }

    const key = `plugin:${pluginId}`;
    const plugin = await this.backend.get<PluginInstance>(key);

    if (plugin && this.cacheEnabled) {
      this.pluginCache.set(pluginId, plugin);
    }

    return plugin;
  }

  public async deletePlugin(pluginId: string): Promise<void> {
    const key = `plugin:${pluginId}`;
    await this.backend.delete(key);
    this.pluginCache.delete(pluginId);
  }

  public async listPlugins(): Promise<PluginInstance[]> {
    const keys = await this.backend.list('plugin:');
    const plugins: PluginInstance[] = [];

    for (const key of keys) {
      const plugin = await this.backend.get<PluginInstance>(key);
      if (plugin) {
        plugins.push(plugin);
      }
    }

    return plugins;
  }

  public async listPluginsByStatus(status: PluginStatus): Promise<PluginInstance[]> {
    const plugins = await this.listPlugins();
    return plugins.filter(p => p.status === status);
  }

  public async updatePluginStatus(
    pluginId: string,
    status: PluginStatus,
    error?: { code: string; message: string }
  ): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.status = status;
    if (error) {
      plugin.error = error;
    }
    plugin.lastUpdated = new Date();

    await this.savePlugin(plugin);
  }

  public async updatePluginConfig(
    pluginId: string,
    config: Partial<PluginConfig>
  ): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.config = { ...plugin.config, ...config };
    plugin.lastUpdated = new Date();

    await this.savePlugin(plugin);
  }

  public async enablePlugin(pluginId: string): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = true;
    plugin.lastUpdated = new Date();

    await this.savePlugin(plugin);
  }

  public async disablePlugin(pluginId: string): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = false;
    plugin.lastUpdated = new Date();

    await this.savePlugin(plugin);
  }

  public async searchPlugins(query: string): Promise<PluginInstance[]> {
    const plugins = await this.listPlugins();
    const lowerQuery = query.toLowerCase();

    return plugins.filter(p => {
      const manifest = p.manifest;
      return (
        manifest.name.toLowerCase().includes(lowerQuery) ||
        manifest.description.toLowerCase().includes(lowerQuery) ||
        manifest.id.toLowerCase().includes(lowerQuery) ||
        (manifest.keywords?.some(k =>
          k.toLowerCase().includes(lowerQuery)
        ) ?? false)
      );
    });
  }

  public async getPluginsByType(type: string): Promise<PluginInstance[]> {
    const plugins = await this.listPlugins();
    return plugins.filter(p => p.manifest.type === type);
  }

  public async getEnabledPlugins(): Promise<PluginInstance[]> {
    const plugins = await this.listPlugins();
    return plugins.filter(p => p.enabled);
  }

  public async savePluginData(
    pluginId: string,
    dataKey: string,
    data: unknown
  ): Promise<void> {
    const key = `plugin-data:${pluginId}:${dataKey}`;
    await this.backend.set(key, data);
  }

  public async getPluginData<T = unknown>(
    pluginId: string,
    dataKey: string
  ): Promise<T | null> {
    const key = `plugin-data:${pluginId}:${dataKey}`;
    return await this.backend.get<T>(key);
  }

  public async deletePluginData(pluginId: string, dataKey: string): Promise<void> {
    const key = `plugin-data:${pluginId}:${dataKey}`;
    await this.backend.delete(key);
  }

  public async listPluginData(pluginId: string): Promise<string[]> {
    const pattern = `plugin-data:${pluginId}:.*`;
    const keys = await this.backend.list(pattern);
    return keys.map(k => k.replace(`plugin-data:${pluginId}:`, ''));
  }

  public async getStatistics(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    active: number;
    error: number;
  }> {
    const plugins = await this.listPlugins();

    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.enabled).length,
      disabled: plugins.filter(p => !p.enabled).length,
      active: plugins.filter(p => p.status === PluginStatus.ACTIVE).length,
      error: plugins.filter(p => p.status === PluginStatus.ERROR).length,
    };
  }

  public enableCache(): void {
    this.cacheEnabled = true;
  }

  public disableCache(): void {
    this.cacheEnabled = false;
    this.pluginCache.clear();
  }

  public clearCache(): void {
    this.pluginCache.clear();
  }

  public getCacheSize(): number {
    return this.pluginCache.size;
  }

  public async clear(): Promise<void> {
    await this.backend.clear();
    this.pluginCache.clear();
  }
}

export class PluginStorageBuilder {
  private backend?: StorageBackend;

  public setBackend(backend: StorageBackend): this {
    this.backend = backend;
    return this;
  }

  public build(): PluginStore {
    return new PluginStore(this.backend);
  }
}
