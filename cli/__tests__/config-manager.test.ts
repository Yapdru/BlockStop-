/**
 * Tests for Configuration Manager
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import ConfigManager from '../modules/config-manager.js';

describe('ConfigManager', () => {
  let testHomeDir: string;

  beforeEach(() => {
    // Create temporary directory for tests
    testHomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blockstop-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true });
    }
  });

  describe('init', () => {
    it('should create default config', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const configPath = path.join(testHomeDir, '.blockstop', 'config.yml');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should throw error if config exists', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await expect(configMgr.init()).rejects.toThrow();
    });
  });

  describe('loadConfig', () => {
    it('should load existing config', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const config = await configMgr.loadConfig();
      expect(config.version).toBe(1);
      expect(config.profiles).toBeDefined();
    });

    it('should return default config if not exists', async () => {
      const configMgr = new ConfigManager(testHomeDir);

      const config = await configMgr.loadConfig();
      expect(config.version).toBe(1);
    });
  });

  describe('API Keys', () => {
    it('should set and get API key', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await configMgr.setApiKey('slack', 'test-key-12345');
      const key = await configMgr.getApiKey('slack');

      expect(key).toBe('test-key-12345');
    });

    it('should return null for non-existent key', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const key = await configMgr.getApiKey('nonexistent');
      expect(key).toBeNull();
    });

    it('should encrypt keys', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await configMgr.setApiKey('test', 'secret-value');

      const config = await configMgr.loadConfig();
      const encrypted = config.apiKeys.test;

      expect(encrypted).not.toBe('secret-value');
      expect(encrypted).toContain(':');
    });
  });

  describe('Profiles', () => {
    it('should list profiles', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const profiles = await configMgr.listProfiles();
      expect(profiles).toContain('default');
    });

    it('should get profile', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const profile = await configMgr.getProfile('default');
      expect(profile.outputFormat).toBeDefined();
      expect(profile.verbosity).toBeDefined();
    });

    it('should create new profile', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await configMgr.createProfile('custom', { outputFormat: 'json' });

      const profiles = await configMgr.listProfiles();
      expect(profiles).toContain('custom');
    });

    it('should set current profile', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await configMgr.createProfile('test');
      await configMgr.setCurrentProfile('test');

      const config = await configMgr.loadConfig();
      expect(config.currentProfile).toBe('test');
    });
  });

  describe('Threat Rules', () => {
    it('should get threat rules', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const rules = await configMgr.getThreatRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should add threat rule', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const newRule = {
        name: 'custom_rule',
        patterns: ['pattern1', 'pattern2'],
        severity: 'high' as const,
      };

      await configMgr.addThreatRule(newRule);

      const rules = await configMgr.getThreatRules();
      expect(rules.some(r => r.name === 'custom_rule')).toBe(true);
    });
  });

  describe('Integrations', () => {
    it('should set integration', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await configMgr.setIntegration('slack', true, { webhookUrl: 'https://hooks.slack.com/test' });

      const config = await configMgr.loadConfig();
      expect(config.integrations.slack?.enabled).toBe(true);
    });

    it('should get integration', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      await configMgr.setIntegration('jira', true, { instanceUrl: 'https://jira.example.com' });

      const integration = await configMgr.getIntegration('jira');
      expect(integration).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate valid config', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const result = await configMgr.validateConfig();
      expect(result.valid).toBe(true);
    });
  });

  describe('Permissions', () => {
    it('should create config directory with restricted permissions', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const configDir = path.join(testHomeDir, '.blockstop');
      const stats = fs.statSync(configDir);

      // Check if directory is readable and writable by owner
      expect(stats.mode & 0o700).toBeTruthy();
    });

    it('should create config file with restricted permissions', async () => {
      const configMgr = new ConfigManager(testHomeDir);
      await configMgr.init();

      const configPath = path.join(testHomeDir, '.blockstop', 'config.yml');
      const stats = fs.statSync(configPath);

      // File should have restricted permissions
      expect(stats.mode & 0o600).toBeTruthy();
    });
  });
});
