/**
 * Validate Command
 * Validates plugin manifest and structure
 */

const fs = require('fs');
const path = require('path');

async function execute(args, options) {
  const pluginPath = args[0] || '.';
  const manifestPath = path.join(pluginPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: manifest.json not found at ${manifestPath}`);
    process.exit(1);
  }

  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const errors = [];
    const warnings = [];

    // Validate required fields
    const requiredFields = ['id', 'name', 'version', 'author', 'type', 'main'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field formats
    if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
      errors.push('Invalid plugin ID format. Use lowercase letters, numbers, and hyphens.');
    }

    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Invalid version format. Use semantic versioning (e.g., 1.0.0)');
    }

    // Validate main file exists
    if (manifest.main) {
      const mainPath = path.join(pluginPath, manifest.main);
      if (!fs.existsSync(mainPath) && !fs.existsSync(mainPath.replace(/\.ts$/, '.js'))) {
        warnings.push(`Main file not found: ${manifest.main}`);
      }
    }

    // Validate permissions
    if (manifest.permissions && Array.isArray(manifest.permissions)) {
      for (const perm of manifest.permissions) {
        if (!perm.resource || !perm.action) {
          errors.push('Invalid permission: must have resource and action');
        }
      }
    } else if (!manifest.permissions) {
      warnings.push('No permissions declared');
    }

    // Check for common issues
    if (!manifest.license) {
      warnings.push('No license specified');
    }

    if (!manifest.repository) {
      warnings.push('No repository URL provided');
    }

    if (!manifest.description || manifest.description.length < 20) {
      warnings.push('Description is missing or too short (minimum 20 characters)');
    }

    // Report results
    console.log('\n📋 Plugin Validation Report');
    console.log('═'.repeat(50));
    console.log(`Plugin: ${manifest.name || 'Unknown'}`);
    console.log(`ID: ${manifest.id || 'Unknown'}`);
    console.log(`Version: ${manifest.version || 'Unknown'}`);
    console.log('═'.repeat(50));

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✓ Plugin validation passed!');
      console.log('\nPlugin Details:');
      console.log(`  ID: ${manifest.id}`);
      console.log(`  Name: ${manifest.name}`);
      console.log(`  Type: ${manifest.type}`);
      console.log(`  Author: ${manifest.author}`);
      console.log(`  Permissions: ${(manifest.permissions || []).length}`);
    } else if (errors.length === 0) {
      console.log('\n✓ Plugin validation passed with warnings!');
    } else {
      console.log('\n✗ Plugin validation failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: Failed to validate plugin: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { execute };
