# Plugin Permissions System

Permissions control what resources a plugin can access.

## Permission Model

Each permission consists of:
- **Resource**: What to access (threats, scans, files, etc.)
- **Action**: What to do (read, write, delete, execute)
- **Scope**: Optional fine-grained control

## Available Permissions

### Threat Permissions

```json
{
  "resource": "threats",
  "action": "read",
  "description": "Read threat information"
}
```

- `read` - View threat data
- `write` - Modify threat data
- `delete` - Delete threats (requires approval)

### Scan Permissions

```json
{
  "resource": "scans",
  "action": "read",
  "description": "View scan results"
}
```

- `read` - View scan data
- `create` - Create new scans
- `write` - Modify scan data

### File Permissions

```json
{
  "resource": "files",
  "action": "read",
  "description": "Access file information"
}
```

- `read` - View file data
- `write` - Modify file data
- `delete` - Delete files

### Storage Permissions

```json
{
  "resource": "storage",
  "action": "read",
  "description": "Read plugin storage"
}
```

- `read` - Read storage data
- `write` - Write to storage
- `delete` - Delete from storage

### HTTP Permissions

```json
{
  "resource": "http",
  "action": "execute",
  "description": "Make HTTP requests"
}
```

- `execute` - Make network requests

### Integration Permissions

```json
{
  "resource": "integrations",
  "action": "read",
  "description": "Access integrations"
}
```

- `read` - List integrations
- `write` - Modify integrations
- `execute` - Execute integrations

### UI Permissions

```json
{
  "resource": "ui",
  "action": "render",
  "description": "Render UI components"
}
```

- `render` - Display UI components
- `update` - Update UI dynamically

## Permission Levels

Permissions are categorized by security level:

### Critical (Requires Approval)
- `threats:delete`
- `storage:delete`
- `integrations:execute`

### High (Requires Review)
- `http:execute`
- `scans:create`
- `threats:write`

### Medium (Standard)
- `threats:read`
- `scans:read`
- `files:read`

### Low (Safe)
- `storage:read`
- `storage:write`
- `config:read`
- `ui:render`

## Declaring Permissions

In your `manifest.json`:

```json
{
  "permissions": [
    {
      "resource": "threats",
      "action": "read",
      "description": "Read threat information to analyze patterns"
    },
    {
      "resource": "http",
      "action": "execute",
      "description": "Query external threat intelligence APIs"
    },
    {
      "resource": "storage",
      "action": "write",
      "description": "Cache enrichment data locally"
    }
  ]
}
```

## Principle of Least Privilege

Only request permissions you actually need:

### ❌ Bad
```json
{
  "permissions": [
    { "resource": "threats", "action": "delete" },
    { "resource": "*", "action": "execute" },
    { "resource": "integrations", "action": "write" }
  ]
}
```

### ✓ Good
```json
{
  "permissions": [
    { "resource": "threats", "action": "read" },
    { "resource": "http", "action": "execute" },
    { "resource": "storage", "action": "write" }
  ]
}
```

## Checking Permissions at Runtime

```typescript
export class MyPlugin extends Plugin {
  async execute(action, params) {
    // Check if permission exists
    const hasPermission = this.context.api.permissions
      .hasPermission('threats', 'write');

    if (!hasPermission) {
      throw new Error('Permission denied: threats:write');
    }

    // Proceed with operation
    await this.context.api.enrichThreat(threatId, data);
  }
}
```

## Permission Request Flow

1. **Plugin declares** permissions in manifest.json
2. **User reviews** permissions during installation
3. **Admin approves** critical permissions
4. **Plugin receives** permission grant
5. **Runtime enforces** permission checks

## Scoped Permissions

Fine-grained control within a resource:

```json
{
  "resource": "threats",
  "action": "read",
  "scope": "my-team",
  "description": "Read threats from my team only"
}
```

## Common Permission Sets

### Minimal Plugin
```json
{
  "permissions": [
    { "resource": "threats", "action": "read" },
    { "resource": "storage", "action": "write" }
  ]
}
```

### Enrichment Plugin
```json
{
  "permissions": [
    { "resource": "threats", "action": "read" },
    { "resource": "threats", "action": "write" },
    { "resource": "http", "action": "execute" },
    { "resource": "storage", "action": "write" }
  ]
}
```

### Integration Plugin
```json
{
  "permissions": [
    { "resource": "threats", "action": "read" },
    { "resource": "integrations", "action": "execute" },
    { "resource": "http", "action": "execute" }
  ]
}
```

### Automation Plugin
```json
{
  "permissions": [
    { "resource": "threats", "action": "read" },
    { "resource": "threats", "action": "write" },
    { "resource": "integrations", "action": "execute" },
    { "resource": "http", "action": "execute" }
  ]
}
```

## Security Best Practices

1. **Request only needed permissions** - Users trust plugins less with more permissions
2. **Document why you need permissions** - Explain in description field
3. **Validate user input** - Before using any data
4. **Use HTTPS for external calls** - When available
5. **Don't store sensitive data** - In plugin storage
6. **Audit permission usage** - Log access to resources
7. **Update permissions carefully** - Major changes may require re-approval

## Permission Audit

BlockStop logs all permission usage:

```typescript
// View audit log
const logs = auditLogger.getAuditLog();

// Filter by plugin
const pluginLogs = auditLogger.getAuditLog('my-plugin');

// Get violations
const violations = auditLogger.getViolations();
```

## Troubleshooting

**Q: Permission denied error?**
A: Add permission to manifest.json and reinstall plugin

**Q: Can't modify threats?**
A: Add `threats:write` permission and get admin approval

**Q: External API unreachable?**
A: Add `http:execute` permission

**Q: Can't delete plugin data?**
A: Add `storage:delete` permission

## Related

- [Security Best Practices](security.md)
- [API Reference](api-reference.md)
- [Manifest Documentation](getting-started.md)
