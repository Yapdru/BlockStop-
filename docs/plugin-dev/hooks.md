# Plugin Hooks System

Hooks allow your plugin to respond to events in BlockStop.

## Available Hooks

### Threat Detection Hooks

#### `ON_THREAT_DETECTED`
Fired when a new threat is detected.

```typescript
hooks.registerHook(HookType.ON_THREAT_DETECTED, async (threat) => {
  console.log('Threat detected:', threat);
  // Respond to threat
});
```

**Data**: Threat object with id, type, severity, description, etc.

#### `BEFORE_THREAT_SCAN`
Fired before a threat scan starts.

```typescript
hooks.registerHook(HookType.BEFORE_THREAT_SCAN, async (data) => {
  // Prepare for scan
});
```

#### `AFTER_THREAT_SCAN`
Fired after a threat scan completes.

```typescript
hooks.registerHook(HookType.AFTER_THREAT_SCAN, async (result) => {
  // Process scan results
});
```

### Data Processing Hooks

#### `BEFORE_DATA_PROCESS`
Fired before data processing.

```typescript
hooks.registerHook(HookType.BEFORE_DATA_PROCESS, async (data) => {
  // Filter or transform data
});
```

#### `AFTER_DATA_PROCESS`
Fired after data processing.

```typescript
hooks.registerHook(HookType.AFTER_DATA_PROCESS, async (result) => {
  // Handle processed data
});
```

### Plugin Lifecycle Hooks

#### `ON_PLUGIN_INSTALL`
Fired when plugin is installed.

```typescript
hooks.registerHook(HookType.ON_PLUGIN_INSTALL, async (data) => {
  // Initialize plugin data
});
```

#### `ON_PLUGIN_UNINSTALL`
Fired when plugin is uninstalled.

```typescript
hooks.registerHook(HookType.ON_PLUGIN_UNINSTALL, async (data) => {
  // Cleanup plugin data
});
```

#### `ON_PLUGIN_UPDATE`
Fired when plugin is updated.

```typescript
hooks.registerHook(HookType.ON_PLUGIN_UPDATE, async (data) => {
  // Handle migration
});
```

#### `ON_PLUGIN_ENABLED`
Fired when plugin is enabled.

#### `ON_PLUGIN_DISABLED`
Fired when plugin is disabled.

### UI Hooks

#### `ON_UI_RENDER`
Fired when UI component renders.

#### `ON_DASHBOARD_LOAD`
Fired when dashboard loads.

### Integration Hooks

#### `ON_INTEGRATION_EVENT`
Fired when integration event occurs.

## Hook Priority

Hooks are executed in priority order (higher first).

```typescript
hooks.registerHook(
  HookType.ON_THREAT_DETECTED,
  async (threat) => { /* ... */ },
  10  // Priority: higher = runs first
);
```

## Hook Execution Modes

### Parallel Execution
Multiple hooks run simultaneously.

```typescript
await context.executeHook(HookType.ON_THREAT_DETECTED, threat);
```

### Sequential Execution
Hooks run one after another.

```typescript
await context.executeHookSequential(HookType.ON_THREAT_DETECTED, threat);
```

## Best Practices

1. **Keep hooks fast** - Don't block other plugins
2. **Use appropriate priorities** - High priority for critical hooks
3. **Handle errors** - Don't let errors crash other hooks
4. **Log important events** - Help with debugging
5. **Don't modify shared data** - In parallel hooks
6. **Clean up in lifecycle hooks** - Unregister when done

## Error Handling

Errors in hooks are caught and logged:

```typescript
hooks.registerHook(HookType.ON_THREAT_DETECTED, async (threat) => {
  try {
    await riskyOperation(threat);
  } catch (error) {
    logger.error('Hook error:', error);
    // Continue execution
  }
});
```

## Example: Comprehensive Hook Setup

```typescript
export class MyPlugin extends Plugin {
  async initialize() {
    super.initialize();

    // High priority - run first
    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        await this.validateThreat(threat);
      },
      20
    );

    // Medium priority - run second
    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        await this.enrichThreat(threat);
      },
      10
    );

    // Low priority - run last
    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        await this.logThreat(threat);
      },
      5
    );

    // Cleanup hook
    this.context.hooks.registerHook(
      HookType.ON_PLUGIN_UNINSTALL,
      async () => {
        await this.cleanup();
      }
    );
  }

  private async validateThreat(threat) { /* ... */ }
  private async enrichThreat(threat) { /* ... */ }
  private async logThreat(threat) { /* ... */ }
  private async cleanup() { /* ... */ }
}
```

## Hook Execution Flow

1. Register hooks during `initialize()`
2. BlockStop fires hooks based on events
3. Hooks execute in priority order
4. Errors are caught and logged
5. Continue with next hook or event handler

## Testing Hooks

```typescript
describe('Plugin Hooks', () => {
  it('should handle threat detection', async () => {
    const plugin = new MyPlugin(context);
    await plugin.initialize();

    const threat = { id: 'test', type: 'malware' };
    await context.executeHook(HookType.ON_THREAT_DETECTED, threat);

    // Verify hook execution
  });
});
```

## Troubleshooting

- **Hook not firing?** Check it's registered during initialize()
- **Wrong execution order?** Adjust hook priority
- **Plugin crashed?** Add error handling in hooks
- **Performance issues?** Reduce hook complexity or use caching

For more details, see [API Reference - Hooks](api-reference.md#hook-system).
