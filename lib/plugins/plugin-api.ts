/**
 * Plugin API
 * Provides the API surface that plugins can use to interact with BlockStop
 */

import {
  PluginAPI,
  PluginLogger,
  PluginStorage,
  PluginConfigManager,
  ThreatAPI,
  ScanAPI,
  FileAPI,
  IntegrationAPI,
  WebhookAPI,
  PluginUIAPI,
  EventAPI,
  PermissionsAPI,
  HttpAPI,
  PluginConfig,
  PluginPermission,
} from './plugin-types';

export class DefaultPluginLogger implements PluginLogger {
  private pluginId: string;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  debug(message: string, data?: unknown): void {
    console.debug(`[${this.pluginId}]`, message, data);
  }

  info(message: string, data?: unknown): void {
    console.info(`[${this.pluginId}]`, message, data);
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[${this.pluginId}]`, message, data);
  }

  error(message: string, error?: Error | unknown): void {
    if (error instanceof Error) {
      console.error(`[${this.pluginId}]`, message, error.message, error.stack);
    } else {
      console.error(`[${this.pluginId}]`, message, error);
    }
  }
}

export class DefaultPluginStorage implements PluginStorage {
  private data: Map<string, unknown> = new Map();

  async get<T = unknown>(key: string): Promise<T | null> {
    return (this.data.get(key) as T) || null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}

export class DefaultPluginConfig implements PluginConfigManager {
  private config: PluginConfig;

  constructor(config: PluginConfig = {}) {
    this.config = { ...config };
  }

  get<T = unknown>(key: string, defaultValue?: T): T {
    return (this.config[key] as T) || defaultValue || (null as any);
  }

  set<T = unknown>(key: string, value: T): void {
    this.config[key] = value;
  }

  getAll(): PluginConfig {
    return { ...this.config };
  }
}

export class DefaultThreatAPI implements ThreatAPI {
  private threats: Map<string, any> = new Map();

  async getThreatDetails(threatId: string): Promise<any | null> {
    return this.threats.get(threatId) || null;
  }

  async enrichThreat(threatId: string, data: any): Promise<void> {
    const threat = this.threats.get(threatId);
    if (threat) {
      this.threats.set(threatId, { ...threat, ...data });
    }
  }

  async reportThreat(data: any): Promise<string> {
    const id = `threat-report-${Date.now()}`;
    this.threats.set(id, data);
    return id;
  }

  async queryThreats(filter: any): Promise<any[]> {
    return Array.from(this.threats.values()).slice(0, filter.limit || 10);
  }
}

export class DefaultScanAPI implements ScanAPI {
  private scans: Map<string, any> = new Map();

  async getScanResults(scanId: string): Promise<any | null> {
    return this.scans.get(scanId) || null;
  }

  async createScan(config: any): Promise<string> {
    const id = `scan-${Date.now()}`;
    this.scans.set(id, {
      id,
      status: 'pending',
      startedAt: new Date(),
      threats: [],
      ...config,
    });
    return id;
  }

  async queryScanResults(filter: any): Promise<any[]> {
    return Array.from(this.scans.values()).slice(0, filter.limit || 10);
  }
}

export class DefaultFileAPI implements FileAPI {
  private files: Map<string, any> = new Map();

  async getFileInfo(fileId: string): Promise<any | null> {
    return this.files.get(fileId) || null;
  }

  async analyzeFile(fileId: string): Promise<any> {
    const file = this.files.get(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }
    return {
      fileId,
      threats: [],
      riskScore: 0,
      timestamp: new Date(),
    };
  }

  async queryFiles(filter: any): Promise<any[]> {
    return Array.from(this.files.values()).slice(0, filter.limit || 10);
  }
}

export class DefaultIntegrationAPI implements IntegrationAPI {
  private integrations: Map<string, any> = new Map();
  private handlers: Map<string, Set<Function>> = new Map();

  async send(integrationId: string, data: unknown): Promise<unknown> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }
    return { success: true, data };
  }

  async query(integrationId: string, params?: Record<string, unknown>): Promise<unknown> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }
    return { results: [] };
  }

  on(integrationId: string, event: string, handler: (data: unknown) => void): void {
    const key = `${integrationId}:${event}`;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    this.handlers.get(key)!.add(handler);
  }

  off(integrationId: string, event: string, handler?: (data: unknown) => void): void {
    const key = `${integrationId}:${event}`;
    if (handler) {
      this.handlers.get(key)?.delete(handler);
    } else {
      this.handlers.delete(key);
    }
  }
}

export class DefaultWebhookAPI implements WebhookAPI {
  private webhooks: Map<string, any> = new Map();
  private nextId = 0;

  async register(event: string, url: string): Promise<string> {
    const id = `webhook-${this.nextId++}`;
    this.webhooks.set(id, {
      id,
      event,
      url,
      active: true,
      createdAt: new Date(),
    });
    return id;
  }

  async unregister(webhookId: string): Promise<void> {
    this.webhooks.delete(webhookId);
  }

  async list(): Promise<any[]> {
    return Array.from(this.webhooks.values());
  }

  async test(webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    return !!webhook;
  }
}

export class DefaultPluginUIAPI implements PluginUIAPI {
  private panels: Map<string, any> = new Map();
  private widgets: Map<string, any> = new Map();

  registerPanel(panelId: string, config: any): void {
    this.panels.set(panelId, config);
  }

  registerWidget(widgetId: string, config: any): void {
    this.widgets.set(widgetId, config);
  }

  notify(message: string, type: string): void {
    console.log(`[${type}] ${message}`);
  }

  async openModal(title: string, content: any): Promise<unknown> {
    return { title, content };
  }
}

export class DefaultEventAPI implements EventAPI {
  private handlers: Map<string, Set<Function>> = new Map();

  emit(event: string, data?: unknown): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as Function)(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, handler: (data: unknown) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  once(event: string, handler: (data: unknown) => void): void {
    const wrappedHandler = (data: unknown) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  off(event: string, handler?: (data: unknown) => void): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
    }
  }
}

export class DefaultPermissionsAPI implements PermissionsAPI {
  private permissions: PluginPermission[] = [];

  async request(permissions: PluginPermission[]): Promise<boolean> {
    this.permissions = permissions;
    return true;
  }

  hasPermission(resource: string, action: string): boolean {
    return this.permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  listPermissions(): PluginPermission[] {
    return [...this.permissions];
  }
}

export class DefaultHttpAPI implements HttpAPI {
  async get<T = unknown>(url: string, options?: any): Promise<T> {
    try {
      const response = await fetch(url, { ...options, method: 'GET' });
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`HTTP GET failed: ${error}`);
    }
  }

  async post<T = unknown>(url: string, data?: unknown, options?: any): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      });
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`HTTP POST failed: ${error}`);
    }
  }

  async put<T = unknown>(url: string, data?: unknown, options?: any): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`HTTP PUT failed: ${error}`);
    }
  }

  async delete<T = unknown>(url: string, options?: any): Promise<T> {
    try {
      const response = await fetch(url, { ...options, method: 'DELETE' });
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`HTTP DELETE failed: ${error}`);
    }
  }
}

export function createPluginAPI(pluginId: string, config?: PluginConfig): PluginAPI {
  return {
    logger: new DefaultPluginLogger(pluginId),
    storage: new DefaultPluginStorage(),
    config: new DefaultPluginConfig(config),
    threats: new DefaultThreatAPI(),
    scans: new DefaultScanAPI(),
    files: new DefaultFileAPI(),
    integrations: new DefaultIntegrationAPI(),
    webhooks: new DefaultWebhookAPI(),
    ui: new DefaultPluginUIAPI(),
    events: new DefaultEventAPI(),
    permissions: new DefaultPermissionsAPI(),
    http: new DefaultHttpAPI(),
  };
}

export class PluginAPIBuilder {
  private pluginId: string;
  private config: PluginConfig = {};
  private logger?: PluginLogger;
  private storage?: PluginStorage;
  private threatAPI?: ThreatAPI;
  private scanAPI?: ScanAPI;
  private fileAPI?: FileAPI;

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  public setConfig(config: PluginConfig): this {
    this.config = config;
    return this;
  }

  public setLogger(logger: PluginLogger): this {
    this.logger = logger;
    return this;
  }

  public setStorage(storage: PluginStorage): this {
    this.storage = storage;
    return this;
  }

  public setThreatAPI(api: ThreatAPI): this {
    this.threatAPI = api;
    return this;
  }

  public setScanAPI(api: ScanAPI): this {
    this.scanAPI = api;
    return this;
  }

  public setFileAPI(api: FileAPI): this {
    this.fileAPI = api;
    return this;
  }

  public build(): PluginAPI {
    return {
      logger: this.logger || new DefaultPluginLogger(this.pluginId),
      storage: this.storage || new DefaultPluginStorage(),
      config: new DefaultPluginConfig(this.config),
      threats: this.threatAPI || new DefaultThreatAPI(),
      scans: this.scanAPI || new DefaultScanAPI(),
      files: this.fileAPI || new DefaultFileAPI(),
      integrations: new DefaultIntegrationAPI(),
      webhooks: new DefaultWebhookAPI(),
      ui: new DefaultPluginUIAPI(),
      events: new DefaultEventAPI(),
      permissions: new DefaultPermissionsAPI(),
      http: new DefaultHttpAPI(),
    };
  }
}
