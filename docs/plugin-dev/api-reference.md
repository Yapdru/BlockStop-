# Plugin API Reference

Complete reference for the BlockStop Plugin SDK API.

## Plugin Context

The plugin context provides access to all BlockStop APIs.

```typescript
import { createPluginContext } from '@blockstop/plugin-sdk';

const context = createPluginContext({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  apiBaseUrl: 'http://localhost:3000',
  apiToken: 'your-token',
  config: { /* your config */ }
});
```

## Logger API

Log messages at different severity levels.

```typescript
const logger = context.logger;

logger.debug('Debug message', data);
logger.info('Info message', data);
logger.warn('Warning message', data);
logger.error('Error message', error);
```

## Storage API

Persist plugin data.

```typescript
const storage = context.storage;

// Set data
await storage.set('key', { data: 'value' });

// Get data
const value = await storage.get('key');

// Delete data
await storage.delete('key');

// Check existence
const exists = await storage.exists('key');

// List all keys
const keys = await storage.keys();

// Clear all data
await storage.clear();

// JSON helpers
await storage.setJSON('myData', { foo: 'bar' });
const data = await storage.getJSON('myData');

// Increment counter
await storage.increment('counter');

// Append to array
await storage.append('items', newItem);
```

## Threat API

Access threat information.

```typescript
const api = context.api;

// Get threat details
const threat = await api.getThreatDetails(threatId);

// Enrich a threat
await api.enrichThreat(threatId, {
  additionalData: { /* ... */ },
  riskScore: 85,
  confidence: 0.95,
  tags: ['malware', 'trojan']
});

// Report a threat
const reportId = await api.reportThreat({
  threatId: 'threat-123',
  reason: 'Confirmed malware',
  evidence: ['evidence-1', 'evidence-2']
});

// Query threats
const threats = await api.queryThreats({
  severity: 'high',
  type: 'malware',
  limit: 10
});
```

## Scan API

Manage security scans.

```typescript
const api = context.api;

// Get scan results
const scan = await api.getScanResults(scanId);

// Create a scan
const newScanId = await api.createScan({
  type: 'file-scan',
  target: '/path/to/file'
});

// Query scan results
const scans = await api.queryScanResults({
  status: 'completed',
  limit: 10
});
```

## File API

Access file information.

```typescript
const api = context.api;

// Get file info
const fileInfo = await api.getFileInfo(fileId);

// Analyze a file
const analysis = await api.analyzeFile(fileId);

// Query files
const files = await api.queryFiles({
  type: 'executable',
  limit: 10
});
```

## HTTP API

Make HTTP requests.

```typescript
const api = context.api;

// GET request
const data = await api.get<DataType>('/api/endpoint');

// POST request
const response = await api.post<ResponseType>(
  '/api/endpoint',
  { key: 'value' },
  { headers: { 'X-Custom': 'header' } }
);

// PUT request
await api.put('/api/endpoint', { updated: 'data' });

// DELETE request
await api.delete('/api/endpoint');
```

## Hook System

Register and manage hooks.

```typescript
import { HookType } from '@blockstop/plugin-sdk';

const hooks = context.hooks;

// Register a hook
const hookId = hooks.registerHook(
  HookType.ON_THREAT_DETECTED,
  async (threat) => {
    logger.info('Threat detected:', threat);
  },
  10  // priority
);

// Execute a hook
await hooks.executeHook(HookType.ON_THREAT_DETECTED, threatData);

// Unregister a hook
hooks.unregisterHook(hookId);

// Get all hooks
const allHooks = hooks.getHooks();

// Get hooks by type
const threatHooks = hooks.getHooks(HookType.ON_THREAT_DETECTED);
```

## Validation API

Validate user input.

```typescript
import { Validator, createValidator } from '@blockstop/plugin-sdk';

// Quick validation
const emailError = Validator.email(userInput, 'email');

const lengthError = Validator.minLength(name, 3, 'name');

// Schema validator
const validator = createValidator();
validator
  .required('name')
  .string('name')
  .email('email')
  .minLength('password', 8);

const result = validator.validate(formData);
if (!result.valid) {
  console.log('Errors:', result.errors);
}
```

## Configuration API

Access plugin configuration.

```typescript
const config = context.config;

// Get config value
const apiKey = config.apiKey;

// Set config value (in-memory)
context.config.setting = 'value';
```

## Plugin Base Class

Extend the base Plugin class for your plugin.

```typescript
import { Plugin } from '@blockstop/plugin-sdk';

export class MyPlugin extends Plugin {
  async initialize() {
    super.initialize();
    // Setup code
  }

  async execute(action, params) {
    // Handle actions
  }

  async shutdown() {
    // Cleanup code
    super.shutdown();
  }
}
```

## Error Handling

```typescript
try {
  await api.getThreatDetails(threatId);
} catch (error) {
  if (error instanceof Error) {
    logger.error('API error:', error.message);
  }
}
```

## Type Definitions

All API methods are fully typed with TypeScript.

```typescript
import type {
  PluginConfig,
  PluginPermission,
  ThreatDetails,
  Threat,
  ScanResult,
  FileInfo,
  Webhook,
  HttpOptions,
  LogEntry,
  StorageItem
} from '@blockstop/plugin-sdk';
```

## Examples

See [Examples](examples.md) for practical usage patterns.

## Performance Tips

1. Cache frequently accessed data
2. Use async/await for I/O operations
3. Implement rate limiting for API calls
4. Clean up resources in shutdown()
5. Use appropriate log levels

## Troubleshooting

- **API calls failing?** Check permissions in manifest.json
- **Storage issues?** Ensure keys are unique per plugin
- **Hook not firing?** Verify hook type and registration
- **Performance slow?** Check for synchronous operations

For more help, see [Debugging Plugins](debugging.md).
