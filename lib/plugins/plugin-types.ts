/**
 * Plugin System Type Definitions
 * Defines all TypeScript interfaces and types for the BlockStop plugin ecosystem
 */

export enum PluginType {
  THREAT_ENRICHMENT = 'threat_enrichment',
  SCANNER = 'scanner',
  INTEGRATION = 'integration',
  UI_EXTENSION = 'ui_extension',
  AUTOMATION = 'automation',
  REPORTING = 'reporting',
  DATA_PROCESSOR = 'data_processor',
}

export enum PluginStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  ERROR = 'error',
  LOADING = 'loading',
  FAILED = 'failed',
}

export enum HookType {
  // Threat detection hooks
  ON_THREAT_DETECTED = 'on_threat_detected',
  BEFORE_THREAT_SCAN = 'before_threat_scan',
  AFTER_THREAT_SCAN = 'after_threat_scan',

  // Data processing hooks
  BEFORE_DATA_PROCESS = 'before_data_process',
  AFTER_DATA_PROCESS = 'after_data_process',

  // Integration hooks
  ON_INTEGRATION_EVENT = 'on_integration_event',

  // Lifecycle hooks
  ON_PLUGIN_INSTALL = 'on_plugin_install',
  ON_PLUGIN_UNINSTALL = 'on_plugin_uninstall',
  ON_PLUGIN_UPDATE = 'on_plugin_update',
  ON_PLUGIN_ENABLED = 'on_plugin_enabled',
  ON_PLUGIN_DISABLED = 'on_plugin_disabled',

  // UI hooks
  ON_UI_RENDER = 'on_ui_render',
  ON_DASHBOARD_LOAD = 'on_dashboard_load',

  // Custom hooks
  CUSTOM = 'custom',
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  type: PluginType;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  icon?: string;
  screenshots?: string[];
  minVersion?: string;
  maxVersion?: string;
  publishedAt?: Date;
  updatedAt?: Date;
}

export interface PluginPermission {
  resource: string;
  action: string;
  scope?: string;
  description?: string;
}

export interface PluginManifest extends PluginMetadata {
  main: string;
  permissions: PluginPermission[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  config?: PluginConfig;
  hooks?: HookType[];
}

export interface PluginConfig {
  [key: string]: unknown;
}

export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  enabled: boolean;
  config: PluginConfig;
  installedAt: Date;
  lastUpdated?: Date;
  error?: PluginError;
}

export interface PluginError {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export interface PluginAPI {
  // Core utilities
  logger: PluginLogger;
  storage: PluginStorage;
  config: PluginConfigManager;

  // Data access
  threats: ThreatAPI;
  scans: ScanAPI;
  files: FileAPI;

  // Integration
  integrations: IntegrationAPI;
  webhooks: WebhookAPI;

  // UI
  ui: PluginUIAPI;

  // Events
  events: EventAPI;

  // Permissions
  permissions: PermissionsAPI;

  // Network
  http: HttpAPI;
}

export interface PluginLogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error | unknown): void;
}

export interface PluginStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export interface PluginConfigManager {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set<T = unknown>(key: string, value: T): void;
  getAll(): PluginConfig;
}

export interface ThreatAPI {
  getThreatDetails(threatId: string): Promise<ThreatDetails | null>;
  enrichThreat(threatId: string, data: ThreatEnrichment): Promise<void>;
  reportThreat(data: ThreatReport): Promise<string>;
  queryThreats(filter: ThreatFilter): Promise<Threat[]>;
}

export interface ThreatDetails {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detectedAt: Date;
  source: string;
  indicators?: string[];
  metadata?: Record<string, unknown>;
}

export interface ThreatEnrichment {
  additionalData?: Record<string, unknown>;
  riskScore?: number;
  confidence?: number;
  tags?: string[];
  relatedThreatIds?: string[];
}

export interface ThreatReport {
  threatId: string;
  reason: string;
  evidence?: string[];
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface ThreatFilter {
  type?: string;
  severity?: string;
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface Threat {
  id: string;
  type: string;
  severity: string;
  description: string;
  detectedAt: Date;
  source: string;
}

export interface ScanAPI {
  getScanResults(scanId: string): Promise<ScanResult | null>;
  createScan(config: ScanConfig): Promise<string>;
  queryScanResults(filter: ScanFilter): Promise<ScanResult[]>;
}

export interface ScanResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  threats: Threat[];
  metadata?: Record<string, unknown>;
}

export interface ScanConfig {
  type: string;
  target: string;
  options?: Record<string, unknown>;
}

export interface ScanFilter {
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

export interface FileAPI {
  getFileInfo(fileId: string): Promise<FileInfo | null>;
  analyzeFile(fileId: string): Promise<FileAnalysis>;
  queryFiles(filter: FileFilter): Promise<FileInfo[]>;
}

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  lastModified: Date;
}

export interface FileAnalysis {
  fileId: string;
  threats: Threat[];
  riskScore: number;
  timestamp: Date;
}

export interface FileFilter {
  name?: string;
  type?: string;
  uploadedFrom?: Date;
  uploadedTo?: Date;
  limit?: number;
}

export interface IntegrationAPI {
  send(integrationId: string, data: unknown): Promise<unknown>;
  query(integrationId: string, params?: Record<string, unknown>): Promise<unknown>;
  on(integrationId: string, event: string, handler: (data: unknown) => void): void;
  off(integrationId: string, event: string, handler?: (data: unknown) => void): void;
}

export interface WebhookAPI {
  register(event: string, url: string): Promise<string>;
  unregister(webhookId: string): Promise<void>;
  list(): Promise<Webhook[]>;
  test(webhookId: string): Promise<boolean>;
}

export interface Webhook {
  id: string;
  event: string;
  url: string;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface PluginUIAPI {
  registerPanel(panelId: string, config: PanelConfig): void;
  registerWidget(widgetId: string, config: WidgetConfig): void;
  notify(message: string, type: 'info' | 'success' | 'warning' | 'error'): void;
  openModal(title: string, content: PluginUIComponent): Promise<unknown>;
}

export interface PanelConfig {
  title: string;
  position: string;
  component: PluginUIComponent;
  icon?: string;
  order?: number;
}

export interface WidgetConfig {
  title: string;
  component: PluginUIComponent;
  size?: 'small' | 'medium' | 'large';
  refreshInterval?: number;
}

export interface PluginUIComponent {
  render(): Promise<unknown>;
  cleanup?(): void;
}

export interface EventAPI {
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  once(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler?: (data: unknown) => void): void;
}

export interface PermissionsAPI {
  request(permissions: PluginPermission[]): Promise<boolean>;
  hasPermission(resource: string, action: string): boolean;
  listPermissions(): PluginPermission[];
}

export interface HttpAPI {
  get<T = unknown>(url: string, options?: HttpOptions): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<T>;
  delete<T = unknown>(url: string, options?: HttpOptions): Promise<T>;
}

export interface HttpOptions {
  headers?: Record<string, string>;
  timeout?: number;
  validateCertificate?: boolean;
}

export interface Hook {
  id: string;
  type: HookType;
  handler: (data: unknown) => Promise<void>;
  priority?: number;
}

export interface PluginLoadOptions {
  sandbox?: boolean;
  timeout?: number;
  validatePermissions?: boolean;
}

export interface ValidationRule {
  name: string;
  validate(manifest: PluginManifest): Promise<{ valid: boolean; errors: string[] }>;
}
