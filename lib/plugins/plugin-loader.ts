/**
 * Plugin Loader
 * Loads and initializes plugins from manifest and source files
 */

import { PluginManifest, PluginInstance, PluginStatus, PluginLoadOptions } from './plugin-types';
import { PluginValidator } from './plugin-validator';
import { createPluginAPI } from './plugin-api';

export class PluginLoader {
  private validator: PluginValidator;

  constructor() {
    this.validator = new PluginValidator();
  }

  public async loadManifest(manifestPath: string): Promise<PluginManifest> {
    try {
      const fs = await import('fs').then(m => m.promises);
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as PluginManifest;

      const validation = await this.validator.validateManifest(manifest);
      if (!validation.valid) {
        throw new Error(`Invalid plugin manifest: ${validation.errors.join(', ')}`);
      }

      return manifest;
    } catch (error) {
      throw new Error(`Failed to load manifest from ${manifestPath}: ${error}`);
    }
  }

  public async loadPluginCode(codePath: string): Promise<string> {
    try {
      const fs = await import('fs').then(m => m.promises);
      const code = await fs.readFile(codePath, 'utf-8');
      return code;
    } catch (error) {
      throw new Error(`Failed to load plugin code from ${codePath}: ${error}`);
    }
  }

  public async createPluginInstance(
    manifest: PluginManifest,
    options?: PluginLoadOptions
  ): Promise<PluginInstance> {
    const validation = await this.validator.validateManifest(manifest);

    if (!validation.valid) {
      throw new Error(`Invalid plugin manifest: ${validation.errors.join(', ')}`);
    }

    const instance: PluginInstance = {
      manifest,
      status: PluginStatus.INACTIVE,
      enabled: false,
      config: manifest.config || {},
      installedAt: new Date(),
    };

    return instance;
  }

  public async loadPlugin(
    manifestPath: string,
    codePath?: string,
    options?: PluginLoadOptions
  ): Promise<{ manifest: PluginManifest; code?: string; instance: PluginInstance }> {
    const manifest = await this.loadManifest(manifestPath);
    let code: string | undefined;

    if (codePath) {
      code = await this.loadPluginCode(codePath);
    }

    const instance = await this.createPluginInstance(manifest, options);

    return { manifest, code, instance };
  }

  public async validatePlugin(manifestPath: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const manifest = await this.loadManifest(manifestPath);
      return await this.validator.validateManifest(manifest);
    } catch (error) {
      return {
        valid: false,
        errors: [String(error)],
        warnings: [],
      };
    }
  }

  public parseManifestString(manifestJson: string): PluginManifest {
    try {
      const manifest = JSON.parse(manifestJson) as PluginManifest;
      if (!this.validator.validateSchemaCompliance(manifest)) {
        throw new Error('Manifest does not comply with PluginManifest schema');
      }
      return manifest;
    } catch (error) {
      throw new Error(`Failed to parse manifest: ${error}`);
    }
  }

  public async resolvePluginDependencies(
    manifest: PluginManifest
  ): Promise<Map<string, string>> {
    const dependencies = new Map<string, string>();

    if (manifest.dependencies) {
      for (const [name, version] of Object.entries(manifest.dependencies)) {
        dependencies.set(name, version);
      }
    }

    return dependencies;
  }

  public async checkCompatibility(
    manifest: PluginManifest,
    blockstopVersion: string
  ): Promise<{ compatible: boolean; reason?: string }> {
    if (manifest.minVersion && this.compareVersions(blockstopVersion, manifest.minVersion) < 0) {
      return {
        compatible: false,
        reason: `BlockStop version ${blockstopVersion} is below minimum required version ${manifest.minVersion}`,
      };
    }

    if (manifest.maxVersion && this.compareVersions(blockstopVersion, manifest.maxVersion) > 0) {
      return {
        compatible: false,
        reason: `BlockStop version ${blockstopVersion} is above maximum supported version ${manifest.maxVersion}`,
      };
    }

    return { compatible: true };
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  public getValidator(): PluginValidator {
    return this.validator;
  }
}

export class PluginLoaderFactory {
  private static instance: PluginLoader;

  public static getInstance(): PluginLoader {
    if (!this.instance) {
      this.instance = new PluginLoader();
    }
    return this.instance;
  }

  public static createNew(): PluginLoader {
    return new PluginLoader();
  }
}
