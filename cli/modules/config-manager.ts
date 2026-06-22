/**
 * BlockStop Configuration Manager
 * Handles YAML config parsing, storage, and encryption
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import YAML from 'yaml';
import Joi from 'joi';

export interface ConfigProfile {
  outputFormat: 'json' | 'csv' | 'table';
  verbosity: 'silent' | 'normal' | 'verbose';
  customRules?: boolean;
}

export interface IntegrationConfig {
  slack?: {
    webhookUrl?: string;
    botToken?: string;
    enabled: boolean;
  };
  jira?: {
    instanceUrl?: string;
    email?: string;
    apiToken?: string;
    enabled: boolean;
  };
  webhook?: {
    url?: string;
    signingSecret?: string;
    enabled: boolean;
  };
}

export interface ThreatRule {
  name: string;
  patterns: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled?: boolean;
}

export interface BlockStopConfig {
  version: number;
  profiles: Record<string, ConfigProfile>;
  currentProfile: string;
  apiKeys: Record<string, string>;
  integrations: IntegrationConfig;
  threatRules: ThreatRule[];
}

const DEFAULT_CONFIG: BlockStopConfig = {
  version: 1,
  profiles: {
    default: {
      outputFormat: 'table',
      verbosity: 'normal',
    },
  },
  currentProfile: 'default',
  apiKeys: {},
  integrations: {
    slack: { enabled: false },
    jira: { enabled: false },
    webhook: { enabled: false },
  },
  threatRules: [
    {
      name: 'phishing_keywords',
      patterns: ['urgent.*action', 'verify.*account', 'confirm.*identity', 'click.*here', 'act.*now'],
      severity: 'high',
      enabled: true,
    },
    {
      name: 'financial_phishing',
      patterns: ['paypal', 'amazon.*pay', 'bank.*account', 'credit.*card'],
      severity: 'critical',
      enabled: true,
    },
  ],
};

const CONFIG_SCHEMA = Joi.object<BlockStopConfig>({
  version: Joi.number().required(),
  profiles: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        outputFormat: Joi.string().valid('json', 'csv', 'table').required(),
        verbosity: Joi.string().valid('silent', 'normal', 'verbose').required(),
        customRules: Joi.boolean().optional(),
      })
    )
    .required(),
  currentProfile: Joi.string().required(),
  apiKeys: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  integrations: Joi.object({
    slack: Joi.object({
      webhookUrl: Joi.string().uri().optional(),
      botToken: Joi.string().optional(),
      enabled: Joi.boolean().required(),
    }).optional(),
    jira: Joi.object({
      instanceUrl: Joi.string().uri().optional(),
      email: Joi.string().email().optional(),
      apiToken: Joi.string().optional(),
      enabled: Joi.boolean().required(),
    }).optional(),
    webhook: Joi.object({
      url: Joi.string().uri().optional(),
      signingSecret: Joi.string().optional(),
      enabled: Joi.boolean().required(),
    }).optional(),
  }).required(),
  threatRules: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        patterns: Joi.array().items(Joi.string()).required(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
        enabled: Joi.boolean().optional(),
      })
    )
    .required(),
});

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private config: BlockStopConfig | null = null;
  private encryptionKey: string;

  constructor(homeDir = process.env.HOME) {
    if (!homeDir) {
      throw new Error('HOME environment variable not set');
    }

    this.configDir = path.join(homeDir, '.blockstop');
    this.configPath = path.join(this.configDir, 'config.yml');
    this.encryptionKey = this.getEncryptionKey();

    // Ensure config directory exists with proper permissions
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Get or generate encryption key from system
   */
  private getEncryptionKey(): string {
    const keyPath = path.join(this.configDir, '.key');
    let key: string;

    if (fs.existsSync(keyPath)) {
      key = fs.readFileSync(keyPath, 'utf8').trim();
    } else {
      // Generate consistent key from hostname + uid
      const hostname = require('os').hostname();
      const uid = require('os').userInfo().uid;
      key = crypto
        .createHash('sha256')
        .update(`${hostname}:${uid}:blockstop`)
        .digest('hex');

      fs.writeFileSync(keyPath, key, { mode: 0o600 });
    }

    return key;
  }

  /**
   * Initialize default config if not exists
   */
  async init(): Promise<void> {
    if (fs.existsSync(this.configPath)) {
      throw new Error('Config already exists. Use config set to modify.');
    }

    const config = { ...DEFAULT_CONFIG };
    await this.saveConfig(config);
  }

  /**
   * Load configuration from YAML file
   */
  async loadConfig(): Promise<BlockStopConfig> {
    if (this.config) {
      return this.config;
    }

    if (!fs.existsSync(this.configPath)) {
      // Return default config if not initialized
      return DEFAULT_CONFIG;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf8');
      const parsed = YAML.parse(content) as unknown;

      // Validate against schema
      const { error, value } = CONFIG_SCHEMA.validate(parsed, { abortEarly: false });
      if (error) {
        throw new Error(`Invalid config: ${error.message}`);
      }

      this.config = value as BlockStopConfig;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save configuration to YAML file
   */
  async saveConfig(config: BlockStopConfig): Promise<void> {
    try {
      // Validate before saving
      const { error } = CONFIG_SCHEMA.validate(config, { abortEarly: false });
      if (error) {
        throw new Error(`Invalid config: ${error.message}`);
      }

      const yaml = YAML.stringify(config);
      fs.writeFileSync(this.configPath, yaml, { mode: 0o600 });
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt a value
   */
  private encryptValue(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a value
   */
  private decryptValue(encrypted: string): string {
    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Set API key
   */
  async setApiKey(service: string, key: string): Promise<void> {
    const config = await this.loadConfig();
    config.apiKeys[service] = this.encryptValue(key);
    await this.saveConfig(config);
  }

  /**
   * Get API key
   */
  async getApiKey(service: string): Promise<string | null> {
    const config = await this.loadConfig();
    const encrypted = config.apiKeys[service];

    if (!encrypted) {
      return null;
    }

    try {
      return this.decryptValue(encrypted);
    } catch (error) {
      throw new Error(`Failed to decrypt API key for ${service}`);
    }
  }

  /**
   * Get current profile
   */
  async getProfile(name?: string): Promise<ConfigProfile> {
    const config = await this.loadConfig();
    const profileName = name || config.currentProfile;

    if (!config.profiles[profileName]) {
      throw new Error(`Profile not found: ${profileName}`);
    }

    return config.profiles[profileName];
  }

  /**
   * Set profile as current
   */
  async setCurrentProfile(name: string): Promise<void> {
    const config = await this.loadConfig();

    if (!config.profiles[name]) {
      throw new Error(`Profile not found: ${name}`);
    }

    config.currentProfile = name;
    await this.saveConfig(config);
  }

  /**
   * Create new profile
   */
  async createProfile(name: string, profile: Partial<ConfigProfile> = {}): Promise<void> {
    const config = await this.loadConfig();

    if (config.profiles[name]) {
      throw new Error(`Profile already exists: ${name}`);
    }

    config.profiles[name] = {
      outputFormat: 'table',
      verbosity: 'normal',
      ...profile,
    };

    await this.saveConfig(config);
  }

  /**
   * Get all profiles
   */
  async listProfiles(): Promise<string[]> {
    const config = await this.loadConfig();
    return Object.keys(config.profiles);
  }

  /**
   * Get threat rules
   */
  async getThreatRules(): Promise<ThreatRule[]> {
    const config = await this.loadConfig();
    return config.threatRules.filter(rule => rule.enabled !== false);
  }

  /**
   * Add custom threat rule
   */
  async addThreatRule(rule: ThreatRule): Promise<void> {
    const config = await this.loadConfig();

    if (config.threatRules.some(r => r.name === rule.name)) {
      throw new Error(`Rule already exists: ${rule.name}`);
    }

    config.threatRules.push(rule);
    await this.saveConfig(config);
  }

  /**
   * Enable/disable integration
   */
  async setIntegration(name: 'slack' | 'jira' | 'webhook', enabled: boolean, config?: unknown): Promise<void> {
    const currentConfig = await this.loadConfig();

    if (!currentConfig.integrations[name]) {
      currentConfig.integrations[name] = { enabled };
    } else {
      currentConfig.integrations[name]!.enabled = enabled;
      if (config) {
        Object.assign(currentConfig.integrations[name], config);
      }
    }

    await this.saveConfig(currentConfig);
  }

  /**
   * Get integration config
   */
  async getIntegration(name: 'slack' | 'jira' | 'webhook'): Promise<unknown | null> {
    const config = await this.loadConfig();
    return config.integrations[name] || null;
  }

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const config = await this.loadConfig();
      const { error } = CONFIG_SCHEMA.validate(config, { abortEarly: false });

      if (error) {
        return {
          valid: false,
          errors: error.details.map(d => d.message),
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

export default ConfigManager;
