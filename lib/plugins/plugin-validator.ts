/**
 * Plugin Validator
 * Validates plugin manifests and ensures compliance with BlockStop standards
 */

import { PluginManifest, ValidationRule } from './plugin-types';

export class PluginValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.registerRule({
      name: 'manifest-required-fields',
      validate: async (manifest: PluginManifest) => {
        const required = ['id', 'name', 'version', 'author', 'type', 'main'];
        const errors: string[] = [];

        for (const field of required) {
          if (!(field in manifest) || !manifest[field as keyof PluginManifest]) {
            errors.push(`Missing required field: ${field}`);
          }
        }

        return { valid: errors.length === 0, errors };
      },
    });

    this.registerRule({
      name: 'version-format',
      validate: async (manifest: PluginManifest) => {
        const semverRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;
        const valid = semverRegex.test(manifest.version);

        return {
          valid,
          errors: valid
            ? []
            : [`Invalid semantic version format: ${manifest.version}`],
        };
      },
    });

    this.registerRule({
      name: 'id-format',
      validate: async (manifest: PluginManifest) => {
        const idRegex = /^[a-z0-9-]+$/;
        const valid = idRegex.test(manifest.id);

        return {
          valid,
          errors: valid
            ? []
            : [
                `Invalid plugin ID format: ${manifest.id}. Must contain only lowercase letters, numbers, and hyphens.`,
              ],
        };
      },
    });

    this.registerRule({
      name: 'main-file-exists',
      validate: async (manifest: PluginManifest) => {
        const mainFile = manifest.main;
        const valid = mainFile && (mainFile.endsWith('.ts') || mainFile.endsWith('.js'));

        return {
          valid,
          errors: valid
            ? []
            : [`Invalid main file: ${mainFile}. Must be a .ts or .js file.`],
        };
      },
    });

    this.registerRule({
      name: 'permissions-format',
      validate: async (manifest: PluginManifest) => {
        const errors: string[] = [];

        if (manifest.permissions && Array.isArray(manifest.permissions)) {
          manifest.permissions.forEach((perm, index) => {
            if (!perm.resource || !perm.action) {
              errors.push(
                `Permission at index ${index} missing required fields: resource and action`
              );
            }
          });
        }

        return { valid: errors.length === 0, errors };
      },
    });

    this.registerRule({
      name: 'dependencies-format',
      validate: async (manifest: PluginManifest) => {
        const errors: string[] = [];

        if (manifest.dependencies && typeof manifest.dependencies === 'object') {
          const semverRegex = /^[\^~>=<*\d.]+$/;
          for (const [dep, version] of Object.entries(manifest.dependencies)) {
            if (!semverRegex.test(String(version))) {
              errors.push(
                `Invalid version specifier for dependency ${dep}: ${version}`
              );
            }
          }
        }

        return { valid: errors.length === 0, errors };
      },
    });

    this.registerRule({
      name: 'reserved-names',
      validate: async (manifest: PluginManifest) => {
        const reserved = ['blockstop', 'core', 'system', 'admin'];
        const valid = !reserved.includes(manifest.id.toLowerCase());

        return {
          valid,
          errors: valid
            ? []
            : [`Plugin ID "${manifest.id}" is reserved and cannot be used.`],
        };
      },
    });

    this.registerRule({
      name: 'max-size-limits',
      validate: async (manifest: PluginManifest) => {
        const errors: string[] = [];

        if (manifest.name && manifest.name.length > 100) {
          errors.push('Plugin name exceeds maximum length of 100 characters');
        }

        if (manifest.description && manifest.description.length > 500) {
          errors.push(
            'Plugin description exceeds maximum length of 500 characters'
          );
        }

        return { valid: errors.length === 0, errors };
      },
    });
  }

  public registerRule(rule: ValidationRule): void {
    if (this.rules.some(r => r.name === rule.name)) {
      throw new Error(`Validation rule "${rule.name}" already registered`);
    }
    this.rules.push(rule);
  }

  public async validateManifest(
    manifest: PluginManifest
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const allErrors: string[] = [];
    const warnings: string[] = [];

    // Validate against all rules
    for (const rule of this.rules) {
      try {
        const result = await rule.validate(manifest);
        if (!result.valid) {
          allErrors.push(`[${rule.name}] ${result.errors.join(', ')}`);
        }
      } catch (error) {
        allErrors.push(`[${rule.name}] Validation failed: ${error}`);
      }
    }

    // Additional warnings
    if (!manifest.license) {
      warnings.push('No license specified in manifest');
    }

    if (!manifest.repository) {
      warnings.push('No repository URL specified in manifest');
    }

    if (manifest.keywords && manifest.keywords.length === 0) {
      warnings.push('No keywords provided for better discoverability');
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings,
    };
  }

  public async validatePluginFile(
    filePath: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const fs = await import('fs').then(m => m.promises);
      const manifestContent = await fs.readFile(filePath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as PluginManifest;

      const result = await this.validateManifest(manifest);
      return {
        valid: result.valid,
        errors: result.errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate plugin file: ${error}`],
      };
    }
  }

  public validateSchemaCompliance(manifest: PluginManifest): boolean {
    // Ensure manifest conforms to TypeScript interface
    return (
      typeof manifest === 'object' &&
      'id' in manifest &&
      'name' in manifest &&
      'version' in manifest &&
      'type' in manifest &&
      'author' in manifest
    );
  }

  public getValidationRules(): string[] {
    return this.rules.map(r => r.name);
  }

  public async validatePermissions(
    permissions: Array<{ resource: string; action: string }>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const validResources = [
      'threats',
      'scans',
      'files',
      'integrations',
      'storage',
      'config',
      'ui',
      'http',
    ];
    const validActions = ['read', 'write', 'execute', 'delete', 'create'];

    for (const perm of permissions) {
      if (!validResources.includes(perm.resource)) {
        errors.push(`Invalid resource: ${perm.resource}`);
      }
      if (!validActions.includes(perm.action)) {
        errors.push(`Invalid action: ${perm.action}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export class ManifestBuilder {
  private manifest: Partial<PluginManifest> = {
    permissions: [],
  };

  public setId(id: string): this {
    this.manifest.id = id;
    return this;
  }

  public setName(name: string): this {
    this.manifest.name = name;
    return this;
  }

  public setVersion(version: string): this {
    this.manifest.version = version;
    return this;
  }

  public setAuthor(author: string): this {
    this.manifest.author = author;
    return this;
  }

  public setDescription(description: string): this {
    this.manifest.description = description;
    return this;
  }

  public setType(type: string): this {
    this.manifest.type = type as any;
    return this;
  }

  public setMain(main: string): this {
    this.manifest.main = main;
    return this;
  }

  public addPermission(
    resource: string,
    action: string,
    description?: string
  ): this {
    if (!this.manifest.permissions) {
      this.manifest.permissions = [];
    }
    this.manifest.permissions.push({ resource, action, description });
    return this;
  }

  public setLicense(license: string): this {
    this.manifest.license = license;
    return this;
  }

  public setRepository(repository: string): this {
    this.manifest.repository = repository;
    return this;
  }

  public addKeyword(keyword: string): this {
    if (!this.manifest.keywords) {
      this.manifest.keywords = [];
    }
    this.manifest.keywords.push(keyword);
    return this;
  }

  public addDependency(name: string, version: string): this {
    if (!this.manifest.dependencies) {
      this.manifest.dependencies = {};
    }
    this.manifest.dependencies[name] = version;
    return this;
  }

  public build(): PluginManifest {
    if (!this.manifest.id || !this.manifest.name || !this.manifest.version) {
      throw new Error('Missing required fields: id, name, version');
    }
    return this.manifest as PluginManifest;
  }
}
