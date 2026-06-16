/**
 * Plugin SDK Type Definitions
 * Exported types for plugin developers
 */

export interface PluginConfig {
  [key: string]: unknown;
}

export interface PluginPermission {
  resource: string;
  action: string;
  scope?: string;
  description?: string;
}

export enum PluginType {
  THREAT_ENRICHMENT = 'threat_enrichment',
  SCANNER = 'scanner',
  INTEGRATION = 'integration',
  UI_EXTENSION = 'ui_extension',
  AUTOMATION = 'automation',
  REPORTING = 'reporting',
  DATA_PROCESSOR = 'data_processor',
}

export enum HookType {
  ON_THREAT_DETECTED = 'on_threat_detected',
  BEFORE_THREAT_SCAN = 'before_threat_scan',
  AFTER_THREAT_SCAN = 'after_threat_scan',
  BEFORE_DATA_PROCESS = 'before_data_process',
  AFTER_DATA_PROCESS = 'after_data_process',
  ON_INTEGRATION_EVENT = 'on_integration_event',
  ON_PLUGIN_INSTALL = 'on_plugin_install',
  ON_PLUGIN_UNINSTALL = 'on_plugin_uninstall',
  ON_PLUGIN_UPDATE = 'on_plugin_update',
  ON_PLUGIN_ENABLED = 'on_plugin_enabled',
  ON_PLUGIN_DISABLED = 'on_plugin_disabled',
  ON_UI_RENDER = 'on_ui_render',
  ON_DASHBOARD_LOAD = 'on_dashboard_load',
  CUSTOM = 'custom',
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

export interface Threat {
  id: string;
  type: string;
  severity: string;
  description: string;
  detectedAt: Date;
  source: string;
}

export interface ScanResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  threats: Threat[];
  metadata?: Record<string, unknown>;
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

export interface Webhook {
  id: string;
  event: string;
  url: string;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface HttpOptions {
  headers?: Record<string, string>;
  timeout?: number;
  validateCertificate?: boolean;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: unknown;
}

export interface StorageItem {
  key: string;
  value: unknown;
  timestamp: Date;
}
