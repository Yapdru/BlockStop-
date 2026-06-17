# BlockStop Phase 8: Marketplace & Plugin System

## Overview
Build a complete plugin ecosystem with app marketplace, enabling developers to create custom extensions and integrations for BlockStop.

---

## 1. Plugin Framework Architecture

### Core Plugin System
**Files to Create**:
- `lib/plugins/plugin-manager.ts` - Plugin lifecycle management
- `lib/plugins/plugin-loader.ts` - Plugin loader and validator
- `lib/plugins/plugin-types.ts` - Plugin type definitions
- `lib/plugins/plugin-api.ts` - Plugin API surface
- `lib/plugins/plugin-sandbox.ts` - Sandbox/security isolation
- `lib/plugins/plugin-hooks.ts` - Hook system
- `lib/plugins/plugin-store.ts` - Plugin storage and caching

**Plugin Type Definitions**:
```typescript
// lib/plugins/plugin-types.ts
export interface BlockStopPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  
  // Plugin capabilities
  permissions: PluginPermission[];
  
  // Entry points
  hooks?: PluginHooks;
  commands?: PluginCommand[];
  tabs?: PluginTab[];
  settings?: PluginSettings[];
  
  // Configuration
  config?: Record<string, any>;
  requirements?: string[];
  
  // Lifecycle
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
}

export interface PluginPermission {
  name: string; // 'scan:files', 'read:logs', 'write:config', etc.
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PluginHooks {
  'on:file-scanned'?: (result: ScanResult) => Promise<void>;
  'on:threat-detected'?: (threat: ThreatAlert) => Promise<void>;
  'on:user-action'?: (action: UserAction) => Promise<void>;
  'on:scan-complete'?: (scan: Scan) => Promise<void>;
}

export interface PluginCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<string>;
}

export interface PluginTab {
  title: string;
  component: React.ComponentType;
  icon?: string;
  order?: number;
}
```

**Plugin Manager**:
```typescript
// lib/plugins/plugin-manager.ts
export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  
  async loadPlugin(pluginPath: string): Promise<void> {
    const manifest = await this.loadManifest(pluginPath);
    
    // Validate plugin
    this.validatePlugin(manifest);
    
    // Check permissions
    if (!this.hasPermission(manifest.permissions)) {
      throw new Error('Plugin permissions not granted');
    }
    
    // Load in sandbox
    const instance = await this.loadInSandbox(pluginPath, manifest);
    
    this.plugins.set(manifest.id, instance);
    
    // Register hooks
    if (manifest.hooks) {
      for (const [event, handler] of Object.entries(manifest.hooks)) {
        this.registerHook(event, handler);
      }
    }
    
    // Call onLoad
    if (instance.plugin.onLoad) {
      await instance.plugin.onLoad();
    }
  }
  
  async emitHook(event: string, data: any): Promise<void> {
    const handlers = this.hooks.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Plugin hook error: ${error}`);
      }
    }
  }
  
  async executeCommand(pluginId: string, command: string, args: string[]): Promise<string> {
    const instance = this.plugins.get(pluginId);
    if (!instance) throw new Error('Plugin not found');
    
    const cmd = instance.plugin.commands?.find(c => c.name === command);
    if (!cmd) throw new Error('Command not found');
    
    return await cmd.handler(args);
  }
  
  private async loadInSandbox(pluginPath: string, manifest: PluginManifest) {
    // Use Web Workers or VM2 for sandboxing
    const worker = new Worker(`${pluginPath}/index.js`);
    
    return {
      plugin: await this.initializePlugin(manifest),
      worker,
      manifest
    };
  }
}
```

---

## 2. Plugin Marketplace Backend

### Marketplace Service
**Files to Create**:
- `lib/marketplace/marketplace-service.ts` - Core marketplace service
- `lib/marketplace/plugin-submission.ts` - Plugin submission handling
- `lib/marketplace/plugin-review.ts` - Code review workflow
- `lib/marketplace/plugin-versioning.ts` - Version management
- `lib/marketplace/plugin-distribution.ts` - Distribution system
- `app/api/marketplace/plugins/route.ts` - Plugin listing
- `app/api/marketplace/submit/route.ts` - Plugin submission
- `app/api/marketplace/reviews/route.ts` - Review management
- `app/api/marketplace/download/[pluginId]/route.ts` - Download endpoint

**Marketplace Database Schema**:
```sql
CREATE TABLE marketplace_plugins (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  author_id VARCHAR(255),
  version VARCHAR(50),
  category VARCHAR(100),
  tags JSON,
  icon_url TEXT,
  repository_url TEXT,
  documentation_url TEXT,
  
  -- Metrics
  downloads INT DEFAULT 0,
  rating FLOAT DEFAULT 0,
  review_count INT DEFAULT 0,
  
  -- Status
  status ENUM('draft', 'pending_review', 'approved', 'rejected', 'suspended'),
  review_status VARCHAR(50),
  
  -- Metadata
  permissions JSON,
  requirements JSON,
  dependencies JSON,
  
  -- Timestamps
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP
);

CREATE TABLE marketplace_plugin_versions (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(255),
  version VARCHAR(50),
  release_notes TEXT,
  download_url TEXT,
  checksum VARCHAR(255),
  file_size INT,
  created_at TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES marketplace_plugins(id)
);

CREATE TABLE marketplace_plugin_reviews (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(255),
  reviewer_id VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected'),
  comments TEXT,
  security_score INT,
  code_quality_score INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES marketplace_plugins(id)
);

CREATE TABLE marketplace_ratings (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(255),
  user_id VARCHAR(255),
  rating INT (1-5),
  review_text TEXT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES marketplace_plugins(id),
  UNIQUE KEY (plugin_id, user_id)
);
```

**Marketplace Service**:
```typescript
export class MarketplaceService {
  async submitPlugin(userId: string, submission: PluginSubmission): Promise<MarketplacePlugin> {
    // Validate plugin package
    const validation = await this.validatePluginPackage(submission.file);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Extract manifest
    const manifest = await this.extractManifest(submission.file);
    
    // Create marketplace entry
    const plugin = {
      id: generateId(),
      ...manifest,
      author_id: userId,
      status: 'pending_review',
      created_at: new Date()
    };
    
    // Store plugin
    await db.plugins.create(plugin);
    
    // Assign reviewer
    await this.assignReviewer(plugin.id);
    
    // Send notification
    await this.notifyReviewers(plugin);
    
    return plugin;
  }
  
  async reviewPlugin(reviewerId: string, pluginId: string, review: PluginReview): Promise<void> {
    // Run security scan
    const securityScore = await this.performSecurityScan(pluginId);
    
    // Run code quality analysis
    const codeQuality = await this.analyzeCodeQuality(pluginId);
    
    // Store review
    await db.reviews.create({
      plugin_id: pluginId,
      reviewer_id: reviewerId,
      status: review.approved ? 'approved' : 'rejected',
      comments: review.comments,
      security_score: securityScore,
      code_quality_score: codeQuality
    });
    
    // Update plugin status
    if (review.approved) {
      await db.plugins.update(pluginId, { status: 'approved', published_at: new Date() });
      await this.notifyAuthor(pluginId, 'approved');
    } else {
      await db.plugins.update(pluginId, { status: 'rejected' });
      await this.notifyAuthor(pluginId, 'rejected', review.comments);
    }
  }
  
  async downloadPlugin(pluginId: string, version?: string): Promise<Buffer> {
    const plugin = await db.plugins.findById(pluginId);
    
    if (plugin.status !== 'approved') {
      throw new Error('Plugin not approved');
    }
    
    const pluginVersion = version 
      ? await db.versions.findByVersion(pluginId, version)
      : await db.versions.findLatest(pluginId);
    
    // Increment download count
    await db.plugins.increment(pluginId, 'downloads');
    
    // Return plugin file
    return await this.downloadFile(pluginVersion.download_url);
  }
}
```

---

## 3. Plugin Marketplace Frontend

### Marketplace Pages & Components
**Files to Create**:
- `app/(marketplace)/plugins/page.tsx` - Plugin listing
- `app/(marketplace)/plugins/[pluginId]/page.tsx` - Plugin detail page
- `app/(marketplace)/submit/page.tsx` - Plugin submission form
- `app/(marketplace)/my-plugins/page.tsx` - Developer dashboard
- `app/(marketplace)/reviews/page.tsx` - Review management
- `components/marketplace/plugin-card.tsx` - Plugin card
- `components/marketplace/plugin-filter.tsx` - Filter sidebar
- `components/marketplace/plugin-installer.tsx` - Installation UI
- `components/marketplace/rating-widget.tsx` - Rating display
- `components/marketplace/search-bar.tsx` - Search component

**Plugin Listing Page**:
```typescript
// app/(marketplace)/plugins/page.tsx
export default function PluginsPage() {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [filters, setFilters] = useState<PluginFilters>({
    category: null,
    sort: 'rating',
    search: ''
  });
  
  useEffect(() => {
    fetchPlugins(filters).then(setPlugins);
  }, [filters]);
  
  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <h1>BlockStop Plugin Marketplace</h1>
        <p>Extend BlockStop with community-built plugins</p>
        <Link href="/submit" className="btn-primary">
          Submit Plugin
        </Link>
      </header>
      
      <div className="marketplace-layout">
        <aside className="filters">
          <PluginFilter onChange={setFilters} />
        </aside>
        
        <main className="plugins-grid">
          <SearchBar value={filters.search} onChange={(search) => setFilters({...filters, search})} />
          
          <div className="grid">
            {plugins.map(plugin => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Plugin Detail Page**:
```typescript
// app/(marketplace)/plugins/[pluginId]/page.tsx
export default function PluginDetailPage({ params }: { params: { pluginId: string } }) {
  const [plugin, setPlugin] = useState<MarketplacePlugin | null>(null);
  const [installed, setInstalled] = useState(false);
  
  useEffect(() => {
    fetchPlugin(params.pluginId).then(setPlugin);
  }, [params.pluginId]);
  
  const handleInstall = async () => {
    await installPlugin(plugin.id);
    setInstalled(true);
  };
  
  if (!plugin) return <Loading />;
  
  return (
    <div className="plugin-detail">
      <header className="detail-header">
        <img src={plugin.icon_url} alt={plugin.name} className="plugin-icon" />
        <div className="plugin-info">
          <h1>{plugin.name}</h1>
          <p className="author">by {plugin.author}</p>
          <RatingWidget rating={plugin.rating} reviewCount={plugin.review_count} />
        </div>
        <button 
          onClick={handleInstall}
          className={installed ? 'btn-installed' : 'btn-primary'}
          disabled={installed}
        >
          {installed ? 'Installed' : 'Install'}
        </button>
      </header>
      
      <div className="detail-content">
        <section className="description">
          <h2>About</h2>
          <p>{plugin.description}</p>
        </section>
        
        <section className="details">
          <h2>Details</h2>
          <div className="detail-grid">
            <div>
              <label>Version</label>
              <span>{plugin.version}</span>
            </div>
            <div>
              <label>Downloads</label>
              <span>{plugin.downloads.toLocaleString()}</span>
            </div>
            <div>
              <label>Category</label>
              <span>{plugin.category}</span>
            </div>
            <div>
              <label>Last Updated</label>
              <span>{new Date(plugin.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </section>
        
        <section className="permissions">
          <h2>Permissions Required</h2>
          <ul>
            {plugin.permissions.map(perm => (
              <li key={perm.name}>
                <span className={`risk-${perm.riskLevel}`}>{perm.name}</span>
                <p>{perm.description}</p>
              </li>
            ))}
          </ul>
        </section>
        
        <section className="reviews">
          <h2>Reviews</h2>
          {/* Reviews list */}
        </section>
      </div>
    </div>
  );
}
```

---

## 4. Plugin Development Kit (SDK)

### Developer Tools
**Files to Create**:
- `sdk/plugin-sdk/index.ts` - Main SDK export
- `sdk/plugin-sdk/types.ts` - Type definitions
- `sdk/plugin-sdk/api.ts` - API client
- `sdk/plugin-sdk/hooks.ts` - Hook helpers
- `sdk/plugin-sdk/storage.ts` - Local storage
- `sdk/plugin-sdk/ui.ts` - UI components
- `sdk/plugin-sdk/logger.ts` - Logging
- `sdk/templates/` - Starter templates
- `sdk/cli/blockstop-plugin-cli.js` - CLI tool
- `sdk/docs/` - SDK documentation

**Plugin SDK**:
```typescript
// sdk/plugin-sdk/index.ts
export class BlockStopSDK {
  private api: APIClient;
  private hooks: HookManager;
  private storage: StorageManager;
  
  constructor(pluginId: string, token: string) {
    this.api = new APIClient(pluginId, token);
    this.hooks = new HookManager();
    this.storage = new StorageManager(pluginId);
  }
  
  // File scanning
  async scanFile(file: File | Blob): Promise<ScanResult> {
    return await this.api.post('/scan/file', { file });
  }
  
  // Email checking
  async scanEmail(email: EmailData): Promise<EmailScanResult> {
    return await this.api.post('/scan/email', { email });
  }
  
  // Threat intelligence
  async checkIOC(indicator: string): Promise<IOCResult> {
    return await this.api.post('/threat-intel/check', { indicator });
  }
  
  // Hook registration
  onFileScan(handler: (result: ScanResult) => Promise<void>) {
    this.hooks.register('on:file-scanned', handler);
  }
  
  onThreatDetected(handler: (threat: ThreatAlert) => Promise<void>) {
    this.hooks.register('on:threat-detected', handler);
  }
  
  // Storage
  async setData(key: string, value: any): Promise<void> {
    await this.storage.set(key, value);
  }
  
  async getData(key: string): Promise<any> {
    return await this.storage.get(key);
  }
  
  // UI Components
  getUIComponents(): UIComponentLibrary {
    return {
      Alert: AlertComponent,
      Card: CardComponent,
      Button: ButtonComponent,
      Modal: ModalComponent,
      // ... more components
    };
  }
  
  // Logging
  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    this.getLogger().log(level, message, data);
  }
}
```

**CLI Tool**:
```bash
#!/usr/bin/env node
// sdk/cli/blockstop-plugin-cli.js

program
  .command('create <name>')
  .description('Create a new plugin')
  .action(async (name) => {
    // Generate plugin scaffold
    createPluginTemplate(name);
  });

program
  .command('validate')
  .description('Validate plugin manifest')
  .action(async () => {
    const manifest = await loadManifest();
    const result = validateManifest(manifest);
    if (result.valid) {
      console.log('✓ Plugin manifest is valid');
    } else {
      console.error('✗ Validation errors:', result.errors);
    }
  });

program
  .command('test')
  .description('Run plugin tests')
  .action(async () => {
    await runTests();
  });

program
  .command('submit')
  .description('Submit plugin to marketplace')
  .action(async () => {
    const plugin = await loadPlugin();
    await submitToMarketplace(plugin);
  });

program.parse();
```

---

## 5. Plugin Security & Sandboxing

### Security Layer
**Files to Create**:
- `lib/plugins/security/sandbox.ts` - Sandbox environment
- `lib/plugins/security/permission-checker.ts` - Permission validation
- `lib/plugins/security/code-scanner.ts` - Security scanning
- `lib/plugins/security/rate-limiter.ts` - Rate limiting
- `lib/plugins/security/audit-logger.ts` - Audit logging

**Sandbox Implementation**:
```typescript
// lib/plugins/security/sandbox.ts
export class PluginSandbox {
  private worker: Worker;
  private permissions: PluginPermission[];
  
  constructor(pluginId: string, permissions: PluginPermission[]) {
    this.permissions = permissions;
    this.worker = this.createWorker(pluginId);
  }
  
  private createWorker(pluginId: string): Worker {
    const workerCode = `
      const allowedAPIs = ${JSON.stringify(this.getAllowedAPIs())};
      const blockstopProxy = new Proxy({}, {
        get: (target, prop) => {
          if (prop in allowedAPIs) {
            return allowedAPIs[prop];
          }
          throw new Error(\`API \${String(prop)} not permitted\`);
        }
      });
      
      self.blockstop = blockstopProxy;
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    return new Worker(workerUrl);
  }
  
  private getAllowedAPIs(): Record<string, any> {
    const apis: Record<string, any> = {};
    
    if (this.hasPermission('scan:files')) {
      apis.scanFile = (...args) => this.callAPI('scanFile', args);
    }
    
    if (this.hasPermission('read:logs')) {
      apis.getLogs = (...args) => this.callAPI('getLogs', args);
    }
    
    // ... more APIs based on permissions
    
    return apis;
  }
  
  private hasPermission(permissionName: string): boolean {
    return this.permissions.some(p => p.name === permissionName);
  }
  
  async executePlugin(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.onerror = (e) => reject(e.error);
      this.worker.postMessage({ code });
      
      // Timeout protection
      setTimeout(() => reject(new Error('Plugin execution timeout')), 30000);
    });
  }
}
```

---

## 6. Developer Documentation & Examples

### Documentation Files
**Files to Create**:
- `docs/plugin-development/getting-started.md` - Getting started guide
- `docs/plugin-development/plugin-api.md` - API reference
- `docs/plugin-development/hooks.md` - Hook system documentation
- `docs/plugin-development/permissions.md` - Permission reference
- `docs/plugin-development/examples.md` - Example plugins
- `docs/plugin-development/faq.md` - FAQ
- `examples/plugin-hello-world/` - Hello World plugin
- `examples/plugin-threat-enrichment/` - Threat enrichment plugin
- `examples/plugin-slack-integration/` - Slack integration example
- `examples/plugin-custom-scanner/` - Custom scanner plugin

**Example Plugin**:
```typescript
// examples/plugin-threat-enrichment/index.ts
import { BlockStopSDK, BlockStopPlugin } from '@blockstop/sdk';

const plugin: BlockStopPlugin = {
  id: 'threat-enrichment',
  name: 'Threat Enrichment',
  version: '1.0.0',
  author: 'BlockStop Team',
  description: 'Enrich threats with additional intelligence from multiple sources',
  
  permissions: [
    { name: 'scan:files', description: 'Scan files for threats', riskLevel: 'low' },
    { name: 'read:logs', description: 'Read scan logs', riskLevel: 'low' }
  ],
  
  async onLoad() {
    console.log('Threat Enrichment plugin loaded');
  },
  
  hooks: {
    'on:threat-detected': async (threat) => {
      // Enrich threat with additional data
      const enriched = await enrichThreat(threat);
      
      // Send enriched data to external service
      await sendToExternalService(enriched);
    }
  }
};

async function enrichThreat(threat: ThreatAlert): Promise<EnrichedThreat> {
  const sdk = new BlockStopSDK(plugin.id, process.env.BLOCKSTOP_TOKEN);
  
  // Check multiple threat intelligence sources
  const iocResult = await sdk.checkIOC(threat.hash);
  const abuseChData = await checkAbuseCH(threat.hash);
  const malpediaData = await checkMalpedia(threat.hash);
  
  return {
    ...threat,
    enrichment: {
      iocResult,
      abuseChData,
      malpediaData,
      confidence: calculateConfidence(iocResult, abuseChData, malpediaData)
    }
  };
}

export default plugin;
```

---

## Phase 8 Technology Stack

### Marketplace Platform
- React, Next.js for marketplace frontend
- PostgreSQL for data storage
- Redis for caching

### Plugin System
- Web Workers for sandboxing
- VM2 or Deno for additional isolation
- WASM for performance-critical operations

### Package Management
- NPM-compatible registry
- Semantic versioning
- Dependency resolution

### Developer Tools
- TypeScript for type safety
- Jest for testing
- ESLint for code quality
- Webpack for bundling

---

## Phase 8 Deliverables

### New Directories & Files
- `lib/plugins/` - Plugin framework (10 files)
- `lib/marketplace/` - Marketplace service (8 files)
- `app/(marketplace)/` - Marketplace pages (6 pages)
- `sdk/plugin-sdk/` - SDK implementation (8 files)
- `sdk/cli/` - CLI tool (3 files)
- `sdk/templates/` - Starter templates (5 files)
- `examples/` - Example plugins (8 files)
- `docs/plugin-development/` - Developer docs (8 files)

### Total New Files: 80+
### Estimated LOC: 3,500+

---

## Phase 8 Success Criteria

- ✅ Plugin system fully functional
- ✅ Plugin manager loading and unloading working
- ✅ Sandbox execution isolated
- ✅ Marketplace UI fully functional
- ✅ Plugin submission and review workflow working
- ✅ SDK comprehensive and well-documented
- ✅ CLI tool working for plugin creation
- ✅ At least 3 example plugins created
- ✅ Developer documentation complete
- ✅ Security scanning integrated
- ✅ Rating and review system working

---

## Timeline
**Estimated Duration**: 22-28 hours
**Parallel Work**: Marketplace and SDK can be built in parallel with agents

---

## Business Impact

### Revenue Streams
1. **Premium Plugins**: BlockStop-developed premium plugins ($4.99-$19.99/month)
2. **Revenue Sharing**: 70/30 split for community plugins
3. **Featured Placement**: Paid listing on marketplace
4. **Enterprise Integration**: Custom plugin development service

### Growth Opportunities
1. **Developer Community**: Open ecosystem for third-party developers
2. **Partner Integrations**: Industry partnerships for official plugins
3. **Ecosystem Lock-in**: Customers invest in custom plugins
4. **Data Collection**: Better understanding of security needs

---

Generated: 2026-06-16 16:00 UTC
