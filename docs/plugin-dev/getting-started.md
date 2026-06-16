# Getting Started with BlockStop Plugin Development

Welcome to the BlockStop Plugin Development Guide. This guide will help you create your first plugin.

## Prerequisites

- Node.js 14+ and npm
- TypeScript knowledge
- BlockStop account (for publishing)

## Installation

### 1. Install the Plugin CLI

```bash
npm install -g @blockstop/plugin-cli
```

### 2. Create a New Plugin

```bash
blockstop-plugin create my-first-plugin
cd my-first-plugin
npm install
```

### 3. Build Your Plugin

```bash
npm run build
```

### 4. Validate Your Plugin

```bash
blockstop-plugin validate .
```

## Plugin Structure

```
my-first-plugin/
├── manifest.json          # Plugin metadata
├── src/
│   └── index.ts          # Main plugin code
├── __tests__/
│   └── plugin.test.ts    # Tests
├── package.json          # Node.js package config
├── tsconfig.json         # TypeScript config
└── README.md             # Documentation
```

## Your First Plugin

Here's a simple example that listens for threats and logs them:

```typescript
import { Plugin, createPluginContext, HookType } from '@blockstop/plugin-sdk';

export class MyFirstPlugin extends Plugin {
  async initialize() {
    super.initialize();
    
    // Register hook to listen for threats
    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        this.context.logger.info('New threat detected:', threat);
      }
    );
  }

  async execute(action, params) {
    this.context.logger.info('Action executed:', action);
    return { success: true };
  }
}
```

## Plugin Manifest

The `manifest.json` file describes your plugin:

```json
{
  "id": "my-first-plugin",
  "name": "My First Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A simple BlockStop plugin",
  "type": "integration",
  "main": "src/index.ts",
  "permissions": [
    {
      "resource": "threats",
      "action": "read",
      "description": "Read threat information"
    }
  ]
}
```

## Plugin Types

BlockStop supports several plugin types:

- **threat_enrichment**: Enhance threat data with additional intelligence
- **scanner**: Implement custom scanning logic
- **integration**: Connect with external services
- **ui_extension**: Extend the BlockStop user interface
- **automation**: Automate threat response actions
- **reporting**: Generate custom reports
- **data_processor**: Process and transform data

## Testing Your Plugin

```bash
npm test
```

## Development Workflow

1. **Create**: Use CLI to scaffold a new plugin
2. **Develop**: Write your plugin code in TypeScript
3. **Test**: Write and run tests
4. **Validate**: Check manifest and permissions
5. **Build**: Compile to JavaScript
6. **Submit**: Publish to the marketplace (optional)

## Next Steps

- Read the [API Reference](api-reference.md)
- Explore [Hooks](hooks.md)
- Learn about [Permissions](permissions.md)
- Check [Examples](examples.md)
- Review [Security Best Practices](security.md)

## Getting Help

- Documentation: https://docs.blockstop.io/plugin-dev
- Community Forum: https://community.blockstop.io
- GitHub Issues: https://github.com/blockstop/plugins/issues
- Email Support: plugins@blockstop.io

## What's Next?

Once you're comfortable with the basics:

1. Try the [threat enrichment example](examples.md#threat-enrichment)
2. Explore [advanced hooks](hooks.md)
3. Learn about [permissions and security](security.md)
4. Check out [testing strategies](testing.md)
5. Get ready to [publish your plugin](publishing.md)
