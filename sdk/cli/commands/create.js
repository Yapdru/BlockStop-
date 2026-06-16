/**
 * Create Command
 * Creates a new plugin from a template
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES = {
  'hello-world': {
    name: 'Hello World',
    description: 'Basic plugin template',
  },
  'threat-enrichment': {
    name: 'Threat Enrichment',
    description: 'Enrich threats with additional data',
  },
  'integration': {
    name: 'Integration',
    description: 'Integrate with external services',
  },
  'ui-extension': {
    name: 'UI Extension',
    description: 'Extend BlockStop UI',
  },
  'scanner': {
    name: 'Custom Scanner',
    description: 'Implement custom scanning logic',
  },
};

function createManifest(name, options) {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    version: '0.1.0',
    author: options.author || 'Your Name',
    description: `A ${TEMPLATES[options.template]?.name || 'BlockStop'} plugin`,
    type: options.type || 'integration',
    license: options.license || 'MIT',
    main: 'index.ts',
    repository: '',
    keywords: ['blockstop', 'plugin'],
    permissions: [
      {
        resource: 'threats',
        action: 'read',
        description: 'Read threat information',
      },
    ],
  };
}

function createIndexFile(template) {
  const templates = {
    'hello-world': `import { Plugin, createPluginContext } from '@blockstop/plugin-sdk';

export class HelloWorldPlugin extends Plugin {
  async initialize() {
    super.initialize();
    this.context.logger.info('Hello World plugin initialized');
  }

  async execute(action, params) {
    this.context.logger.info('Action executed:', action);
    return { success: true };
  }
}
`,
    'threat-enrichment': `import { Plugin, createPluginContext, HookType } from '@blockstop/plugin-sdk';

export class ThreatEnrichmentPlugin extends Plugin {
  async initialize() {
    super.initialize();

    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        this.context.logger.info('Enriching threat:', threat);
        // Add enrichment logic here
      }
    );
  }
}
`,
    'integration': `import { Plugin, createPluginContext } from '@blockstop/plugin-sdk';

export class IntegrationPlugin extends Plugin {
  async initialize() {
    super.initialize();
    this.context.logger.info('Integration plugin ready');
  }

  async send(integrationId, data) {
    return await this.context.api.sendIntegration(integrationId, data);
  }
}
`,
    'ui-extension': `import { Plugin, createPluginContext } from '@blockstop/plugin-sdk';

export class UIExtensionPlugin extends Plugin {
  async initialize() {
    super.initialize();

    this.context.api.ui.registerPanel('my-panel', {
      title: 'My Plugin Panel',
      position: 'sidebar',
      component: {
        render: async () => {
          return '<div>My custom UI</div>';
        }
      }
    });
  }
}
`,
    'scanner': `import { Plugin, createPluginContext } from '@blockstop/plugin-sdk';

export class ScannerPlugin extends Plugin {
  async initialize() {
    super.initialize();
    this.context.logger.info('Scanner plugin initialized');
  }

  async scan(target) {
    this.context.logger.info('Scanning target:', target);
    return {
      threats: [],
      riskScore: 0,
    };
  }
}
`,
  };

  return templates[template] || templates['hello-world'];
}

function createTestFile() {
  return `import { describe, it, expect } from '@jest/globals';
import { Plugin, createPluginContext } from '@blockstop/plugin-sdk';

describe('Plugin Tests', () => {
  it('should initialize successfully', async () => {
    const context = createPluginContext({
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '0.1.0',
      apiBaseUrl: 'http://localhost:3000',
    });

    expect(context).toBeDefined();
    expect(context.id).toBe('test-plugin');
  });

  it('should have working storage', async () => {
    const context = createPluginContext({
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '0.1.0',
      apiBaseUrl: 'http://localhost:3000',
    });

    await context.storage.set('test-key', 'test-value');
    const value = await context.storage.get('test-key');
    expect(value).toBe('test-value');
  });
});
`;
}

async function execute(args, options) {
  const pluginName = args[0];

  if (!pluginName) {
    console.error('Plugin name is required');
    console.error('Usage: blockstop-plugin create <name> [options]');
    process.exit(1);
  }

  const template = options.template || 'hello-world';
  const outputDir = options.output || path.join(process.cwd(), pluginName);

  if (!TEMPLATES[template]) {
    console.error(
      `Unknown template: ${template}\nAvailable templates: ${Object.keys(TEMPLATES).join(', ')}`
    );
    process.exit(1);
  }

  // Create directory structure
  const dirs = [
    outputDir,
    path.join(outputDir, 'src'),
    path.join(outputDir, 'dist'),
    path.join(outputDir, '__tests__'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Create manifest
  const manifest = createManifest(pluginName, {
    author: options.author,
    type: options.type,
    license: options.license,
    template,
  });

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Create index file
  const indexContent = createIndexFile(template);
  fs.writeFileSync(path.join(outputDir, 'src', 'index.ts'), indexContent);

  // Create test file
  const testContent = createTestFile();
  fs.writeFileSync(
    path.join(outputDir, '__tests__', 'plugin.test.ts'),
    testContent
  );

  // Create package.json
  const packageJson = {
    name: `blockstop-plugin-${manifest.id}`,
    version: manifest.version,
    description: manifest.description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
      test: 'jest',
      validate: 'blockstop-plugin validate .',
    },
    dependencies: {
      '@blockstop/plugin-sdk': '^1.0.0',
    },
    devDependencies: {
      typescript: '^5.0.0',
      jest: '^29.0.0',
      '@types/jest': '^29.0.0',
      '@types/node': '^18.0.0',
    },
  };

  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      declaration: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '__tests__'],
  };

  fs.writeFileSync(
    path.join(outputDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create README
  const readme = `# ${manifest.name}

${manifest.description}

## Installation

\`\`\`bash
npm install
npm run build
blockstop-plugin validate .
\`\`\`

## Development

\`\`\`bash
npm run test
npm run build
\`\`\`

## Publishing

\`\`\`bash
blockstop-plugin submit . --token YOUR_API_TOKEN
\`\`\`

## License

${manifest.license}
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);

  console.log(`
✓ Plugin created successfully!

Location: ${outputDir}
Template: ${TEMPLATES[template].name}
Type: ${manifest.type}

Next steps:
  1. cd ${pluginName}
  2. npm install
  3. npm run build
  4. blockstop-plugin validate .
  5. npm test

Documentation: https://docs.blockstop.io/plugin-dev
  `);
}

module.exports = { execute };
