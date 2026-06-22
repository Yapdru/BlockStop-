/**
 * Plugin System - Create, Install, Manage Plugins
 * Comprehensive plugin management with versioning, security, and revenue sharing
 * Handles plugin lifecycle, sandboxing, and monetization
 */

import { query } from '@/lib/db';
import crypto from 'crypto';

// ===== Plugin System Types =====

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    id: string;
    name: string;
    email: string;
    website?: string;
  };
  license: string;
  repository?: string;
  homepage?: string;
  keywords: string[];
  permissions: PluginPermission[];
  entryPoint: string;
  configuration?: Record<string, PluginConfigOption>;
  dependencies?: Record<string, string>;
  engines?: {
    blockstop?: string;
    node?: string;
  };
  icon?: string; // Base64 or URL
  screenshots?: string[];
  pricing?: {
    type: 'free' | 'paid' | 'freemium';
    priceMonthly?: number;
    priceAnnual?: number;
    currency?: string;
  };
}

export interface PluginPermission {
  id: string;
  resource: string; // incidents, threats, users, files, api, logs, etc.
  action: 'read' | 'write' | 'delete' | 'execute' | 'admin';
  scope?: string; // optional scoping
  rateLimitPerHour?: number;
  description: string;
}

export interface PluginConfigOption {
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  required: boolean;
  default?: any;
  options?: string[]; // for select/multiselect
  validation?: string; // regex pattern
}

export interface PluginRegistry {
  id: string;
  manifestId: string;
  manifest: PluginManifest;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'published' | 'suspended' | 'deprecated';
  publishedVersion?: string;
  rating: number; // 0-5 stars
  reviewCount: number;
  downloadCount: number;
  weeklyActiveInstalls: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  suspendedAt?: Date;
  suspensionReason?: string;
  deprecatedAt?: Date;
  deprecationReason?: string;
  securityScanStatus: 'pending' | 'passed' | 'failed' | 'warning';
  securityScanResults?: SecurityScanResult[];
}

export interface SecurityScanResult {
  id: string;
  timestamp: Date;
  status: 'passed' | 'failed' | 'warning';
  vulnerabilities: Vulnerability[];
  codeQualityScore: number; // 0-100
  performanceScore: number; // 0-100
  securityScore: number; // 0-100
  recommendations: string[];
}

export interface Vulnerability {
  id: string;
  type: string; // 'injection', 'xss', 'dos', 'memory', 'crypto', etc.
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  cve?: string;
  remediation: string;
}

export interface PluginInstallation {
  id: string;
  userId: string;
  organizationId: string;
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  manifestHash: string;
  status: 'installing' | 'active' | 'disabled' | 'updating' | 'removing' | 'error';
  configuration: Record<string, any>;
  grantedPermissions: PluginPermission[];
  installedAt: Date;
  lastUpdatedAt?: Date;
  lastExecutedAt?: Date;
  updateAvailable?: string;
  errorMessage?: string;
  sandboxId?: string;
}

export interface PluginSandbox {
  id: string;
  pluginId: string;
  isolationLevel: 'basic' | 'restricted' | 'isolated'; // increasingly restrictive
  allowedAPIs: string[];
  deniedAPIs: string[];
  maxMemory: number; // MB
  maxCPU: number; // percentage
  maxExecutionTime: number; // milliseconds
  fileSystemAccess: boolean;
  networkAccess: boolean;
  databaseAccess: boolean;
  environmentVariables?: Record<string, string>;
  resourceQuotas?: {
    maxConnections?: number;
    maxStorageGB?: number;
    maxApiCallsPerHour?: number;
  };
}

export interface PluginExecution {
  id: string;
  installationId: string;
  pluginId: string;
  event: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  executionTime?: number; // milliseconds
  output?: any;
  error?: string;
  logs?: string[];
  sandboxMetrics?: {
    memoryUsed: number;
    cpuUsed: number;
    ioOperations: number;
  };
}

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  verifiedInstaller: boolean; // user has installed the plugin
  helpful: number;
  unhelpful: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PluginVersioning {
  id: string;
  pluginId: string;
  version: string;
  releaseNotes: string;
  manifest: PluginManifest;
  changelog: ChangelogEntry[];
  breakingChanges: string[];
  migrateFrom?: string; // previous version
  releasedAt: Date;
  downloadCount: number;
  issues?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: string[];
  breaking: boolean;
}

export interface PluginRevenue {
  id: string;
  pluginId: string;
  authorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalInstalls: number;
  newInstalls: number;
  activeInstalls: number;
  uninstalls: number;
  grossRevenue: number; // Total from all sources
  blockstopCut: number; // 30% for platform
  authorPayout: number; // 70% for author
  currency: string;
  status: 'pending' | 'processed' | 'failed';
  payoutDate?: Date;
}

// ===== Plugin System Service =====

export class PluginSystem {
  private readonly BLOCKSTOP_REVENUE_SHARE = 0.30; // 30% to BlockStop
  private readonly AUTHOR_REVENUE_SHARE = 0.70; // 70% to author

  // ===== Plugin Registration & Management =====

  /**
   * Register a new plugin
   */
  async registerPlugin(
    manifest: PluginManifest,
    authorId: string
  ): Promise<PluginRegistry> {
    try {
      const pluginId = this.generatePluginId();
      const manifestHash = this.hashManifest(manifest);

      const result = await query(
        `INSERT INTO plugin_registry (
          id, manifest_id, manifest, author_id, status,
          rating, review_count, download_count, weekly_active_installs,
          security_scan_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          pluginId,
          manifest.id,
          JSON.stringify(manifest),
          authorId,
          'draft',
          0,
          0,
          0,
          0,
          'pending'
        ]
      );

      return this.mapToPluginRegistry(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to register plugin: ${error}`);
    }
  }

  /**
   * Submit plugin for review
   */
  async submitPluginForReview(pluginId: string): Promise<void> {
    try {
      await query(
        `UPDATE plugin_registry SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        ['submitted', pluginId]
      );

      // Trigger security scan
      await this.runSecurityScan(pluginId);
    } catch (error) {
      throw new Error(`Failed to submit plugin: ${error}`);
    }
  }

  /**
   * Approve plugin for publishing
   */
  async approvePlugin(
    pluginId: string,
    reviewerId: string,
    notes?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE plugin_registry
         SET status = $1, published_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        ['published', pluginId]
      );

      // Log review action
      await query(
        `INSERT INTO plugin_review_history (plugin_id, reviewer_id, action, notes, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [pluginId, reviewerId, 'approved', notes]
      );
    } catch (error) {
      throw new Error(`Failed to approve plugin: ${error}`);
    }
  }

  /**
   * Reject plugin submission
   */
  async rejectPlugin(
    pluginId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE plugin_registry SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        ['draft', pluginId]
      );

      await query(
        `INSERT INTO plugin_review_history (plugin_id, reviewer_id, action, notes, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [pluginId, reviewerId, 'rejected', reason]
      );
    } catch (error) {
      throw new Error(`Failed to reject plugin: ${error}`);
    }
  }

  /**
   * Suspend plugin (security issue)
   */
  async suspendPlugin(
    pluginId: string,
    reason: string,
    affectedVersions?: string[]
  ): Promise<void> {
    try {
      await query(
        `UPDATE plugin_registry
         SET status = $1, suspended_at = NOW(), suspension_reason = $2, updated_at = NOW()
         WHERE id = $3`,
        ['suspended', reason, pluginId]
      );

      // Disable all installations
      await query(
        `UPDATE plugin_installations SET status = 'error', error_message = $1
         WHERE plugin_id = $2`,
        [`Plugin suspended: ${reason}`, pluginId]
      );
    } catch (error) {
      throw new Error(`Failed to suspend plugin: ${error}`);
    }
  }

  /**
   * Deprecate plugin
   */
  async deprecatePlugin(
    pluginId: string,
    reason: string,
    replacementPluginId?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE plugin_registry
         SET status = $1, deprecated_at = NOW(), deprecation_reason = $2, updated_at = NOW()
         WHERE id = $3`,
        ['deprecated', reason, pluginId]
      );

      // Log deprecation
      if (replacementPluginId) {
        await query(
          `INSERT INTO plugin_deprecation_log (plugin_id, replacement_plugin_id, reason, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [pluginId, replacementPluginId, reason]
        );
      }
    } catch (error) {
      throw new Error(`Failed to deprecate plugin: ${error}`);
    }
  }

  // ===== Plugin Installation =====

  /**
   * Install plugin for a user/organization
   */
  async installPlugin(
    userId: string,
    organizationId: string,
    pluginId: string,
    configuration: Record<string, any> = {},
    grantedPermissions: PluginPermission[] = []
  ): Promise<PluginInstallation> {
    try {
      // Get plugin manifest
      const pluginResult = await query(
        `SELECT manifest FROM plugin_registry WHERE id = $1 AND status = 'published'`,
        [pluginId]
      );

      if (pluginResult.rows.length === 0) {
        throw new Error('Plugin not found or not published');
      }

      const manifest = JSON.parse(pluginResult.rows[0].manifest);
      const manifestHash = this.hashManifest(manifest);
      const installationId = this.generateInstallationId();

      // Validate configuration
      this.validateConfiguration(manifest, configuration);

      // Create installation
      const result = await query(
        `INSERT INTO plugin_installations (
          id, user_id, organization_id, plugin_id, plugin_name,
          plugin_version, manifest_hash, status, configuration,
          granted_permissions, installed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *`,
        [
          installationId,
          userId,
          organizationId,
          pluginId,
          manifest.name,
          manifest.version,
          manifestHash,
          'installing',
          JSON.stringify(configuration),
          JSON.stringify(grantedPermissions)
        ]
      );

      // Create sandbox for plugin
      const sandboxId = await this.createSandbox(pluginId, 'isolated');

      // Update installation with sandbox ID
      await query(
        `UPDATE plugin_installations SET sandbox_id = $1, status = 'active' WHERE id = $2`,
        [sandboxId, installationId]
      );

      // Increment install count
      await query(
        `UPDATE plugin_registry SET download_count = download_count + 1
         WHERE id = $1`,
        [pluginId]
      );

      return this.mapToPluginInstallation(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to install plugin: ${error}`);
    }
  }

  /**
   * Uninstall plugin
   */
  async uninstallPlugin(installationId: string): Promise<void> {
    try {
      // Get installation
      const result = await query(
        `SELECT plugin_id FROM plugin_installations WHERE id = $1`,
        [installationId]
      );

      if (result.rows.length === 0) {
        throw new Error('Installation not found');
      }

      const pluginId = result.rows[0].plugin_id;

      // Update installation status
      await query(
        `UPDATE plugin_installations SET status = 'removing', last_updated_at = NOW()
         WHERE id = $1`,
        [installationId]
      );

      // Remove sandbox
      await query(
        `DELETE FROM plugin_sandboxes WHERE id = (
          SELECT sandbox_id FROM plugin_installations WHERE id = $1
        )`,
        [installationId]
      );

      // Delete installation
      await query(
        `DELETE FROM plugin_installations WHERE id = $1`,
        [installationId]
      );

      // Update uninstall count
      await query(
        `UPDATE plugin_revenue SET uninstalls = uninstalls + 1
         WHERE plugin_id = $1 AND period_end_date > NOW()`,
        [pluginId]
      );
    } catch (error) {
      throw new Error(`Failed to uninstall plugin: ${error}`);
    }
  }

  /**
   * Get user's installed plugins
   */
  async getUserPlugins(
    userId: string,
    organizationId?: string
  ): Promise<PluginInstallation[]> {
    try {
      let query_str = `
        SELECT * FROM plugin_installations
        WHERE user_id = $1 AND status != 'removing'
      `;
      const params: any[] = [userId];

      if (organizationId) {
        query_str += ` AND organization_id = $2`;
        params.push(organizationId);
      }

      query_str += ` ORDER BY installed_at DESC`;

      const result = await query(query_str, params);
      return result.rows.map(row => this.mapToPluginInstallation(row));
    } catch (error) {
      throw new Error(`Failed to fetch user plugins: ${error}`);
    }
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfiguration(
    installationId: string,
    configuration: Record<string, any>
  ): Promise<void> {
    try {
      // Get installation details
      const result = await query(
        `SELECT plugin_id FROM plugin_installations WHERE id = $1`,
        [installationId]
      );

      if (result.rows.length === 0) {
        throw new Error('Installation not found');
      }

      // Get plugin manifest for validation
      const pluginResult = await query(
        `SELECT manifest FROM plugin_registry WHERE id = $1`,
        [result.rows[0].plugin_id]
      );

      const manifest = JSON.parse(pluginResult.rows[0].manifest);
      this.validateConfiguration(manifest, configuration);

      // Update configuration
      await query(
        `UPDATE plugin_installations
         SET configuration = $1, last_updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(configuration), installationId]
      );
    } catch (error) {
      throw new Error(`Failed to update configuration: ${error}`);
    }
  }

  // ===== Plugin Versioning =====

  /**
   * Create new plugin version
   */
  async createPluginVersion(
    pluginId: string,
    manifest: PluginManifest,
    releaseNotes: string,
    changelog: ChangelogEntry[],
    breakingChanges: string[] = []
  ): Promise<PluginVersioning> {
    try {
      const versionId = crypto.randomUUID();

      const result = await query(
        `INSERT INTO plugin_versions (
          id, plugin_id, version, release_notes, manifest,
          changelog, breaking_changes, released_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          versionId,
          pluginId,
          manifest.version,
          releaseNotes,
          JSON.stringify(manifest),
          JSON.stringify(changelog),
          JSON.stringify(breakingChanges)
        ]
      );

      return this.mapToPluginVersioning(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create plugin version: ${error}`);
    }
  }

  /**
   * Get plugin version history
   */
  async getPluginVersionHistory(pluginId: string): Promise<PluginVersioning[]> {
    try {
      const result = await query(
        `SELECT * FROM plugin_versions WHERE plugin_id = $1
         ORDER BY released_at DESC`,
        [pluginId]
      );

      return result.rows.map(row => this.mapToPluginVersioning(row));
    } catch (error) {
      throw new Error(`Failed to fetch version history: ${error}`);
    }
  }

  /**
   * Update plugin (push new version to all users)
   */
  async updatePlugin(
    pluginId: string,
    newVersion: string,
    mandatory: boolean = false
  ): Promise<void> {
    try {
      // Get all active installations
      const installations = await query(
        `SELECT id FROM plugin_installations WHERE plugin_id = $1 AND status = 'active'`,
        [pluginId]
      );

      // Update each installation
      for (const installation of installations.rows) {
        await query(
          `UPDATE plugin_installations
           SET status = $1, update_available = $2, last_updated_at = NOW()
           WHERE id = $3`,
          [mandatory ? 'updating' : 'active', newVersion, installation.id]
        );
      }

      // Update plugin registry
      await query(
        `UPDATE plugin_registry SET updated_at = NOW() WHERE id = $1`,
        [pluginId]
      );
    } catch (error) {
      throw new Error(`Failed to update plugin: ${error}`);
    }
  }

  // ===== Security & Scanning =====

  /**
   * Run security scan on plugin
   */
  async runSecurityScan(pluginId: string): Promise<SecurityScanResult> {
    try {
      const scanId = crypto.randomUUID();
      const timestamp = new Date();

      // Perform security checks
      const vulnerabilities: Vulnerability[] = [];
      const codeQualityScore = await this.analyzeCodeQuality(pluginId);
      const performanceScore = await this.analyzePerformance(pluginId);
      const securityScore = await this.analyzeSecurityVulnerabilities(
        pluginId,
        vulnerabilities
      );

      const status =
        vulnerabilities.some(v => v.severity === 'critical') ? 'failed' :
        vulnerabilities.some(v => v.severity === 'high') ? 'warning' :
        'passed';

      const recommendations = this.generateRecommendations(
        vulnerabilities,
        codeQualityScore,
        performanceScore
      );

      // Store scan result
      const result = await query(
        `INSERT INTO plugin_security_scans (
          id, plugin_id, timestamp, status, vulnerabilities,
          code_quality_score, performance_score, security_score, recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          scanId,
          pluginId,
          timestamp,
          status,
          JSON.stringify(vulnerabilities),
          codeQualityScore,
          performanceScore,
          securityScore,
          JSON.stringify(recommendations)
        ]
      );

      // Update plugin registry with scan status
      await query(
        `UPDATE plugin_registry SET security_scan_status = $1 WHERE id = $2`,
        [status, pluginId]
      );

      return this.mapToSecurityScanResult(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to run security scan: ${error}`);
    }
  }

  // ===== Plugin Execution & Sandboxing =====

  /**
   * Execute plugin with sandboxing
   */
  async executePlugin(
    installationId: string,
    event: string,
    context?: any
  ): Promise<PluginExecution> {
    try {
      const executionId = crypto.randomUUID();
      const startTime = Date.now();

      // Get installation and sandbox
      const instResult = await query(
        `SELECT sandbox_id, configuration FROM plugin_installations WHERE id = $1`,
        [installationId]
      );

      if (instResult.rows.length === 0) {
        throw new Error('Installation not found');
      }

      const sandboxId = instResult.rows[0].sandbox_id;
      const configuration = JSON.parse(instResult.rows[0].configuration);

      // Create execution record
      const execResult = await query(
        `INSERT INTO plugin_executions (
          id, installation_id, event, status, started_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
        [executionId, installationId, event, 'running']
      );

      try {
        // Execute in sandbox
        const output = await this.executeSandboxed(
          installationId,
          event,
          context,
          configuration
        );

        const executionTime = Date.now() - startTime;

        // Update execution record
        await query(
          `UPDATE plugin_executions
           SET status = $1, completed_at = NOW(), execution_time = $2, output = $3
           WHERE id = $4`,
          ['completed', executionTime, JSON.stringify(output), executionId]
        );

        // Update installation last executed
        await query(
          `UPDATE plugin_installations SET last_executed_at = NOW() WHERE id = $1`,
          [installationId]
        );

        return this.mapToPluginExecution(execResult.rows[0]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        await query(
          `UPDATE plugin_executions
           SET status = $1, completed_at = NOW(), error = $2
           WHERE id = $3`,
          ['failed', errorMsg, executionId]
        );

        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to execute plugin: ${error}`);
    }
  }

  /**
   * Create sandbox for plugin
   */
  private async createSandbox(
    pluginId: string,
    isolationLevel: 'basic' | 'restricted' | 'isolated'
  ): Promise<string> {
    const sandboxId = crypto.randomUUID();

    const sandbox: PluginSandbox = {
      id: sandboxId,
      pluginId,
      isolationLevel,
      allowedAPIs: this.getAllowedAPIs(isolationLevel),
      deniedAPIs: this.getDeniedAPIs(isolationLevel),
      maxMemory: isolationLevel === 'basic' ? 512 : 256,
      maxCPU: isolationLevel === 'basic' ? 50 : 25,
      maxExecutionTime: isolationLevel === 'basic' ? 30000 : 10000,
      fileSystemAccess: isolationLevel === 'basic',
      networkAccess: isolationLevel !== 'isolated',
      databaseAccess: isolationLevel === 'basic'
    };

    await query(
      `INSERT INTO plugin_sandboxes (
        id, plugin_id, isolation_level, allowed_apis, denied_apis,
        max_memory, max_cpu, max_execution_time, file_system_access,
        network_access, database_access
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        sandbox.id,
        sandbox.pluginId,
        sandbox.isolationLevel,
        JSON.stringify(sandbox.allowedAPIs),
        JSON.stringify(sandbox.deniedAPIs),
        sandbox.maxMemory,
        sandbox.maxCPU,
        sandbox.maxExecutionTime,
        sandbox.fileSystemAccess,
        sandbox.networkAccess,
        sandbox.databaseAccess
      ]
    );

    return sandboxId;
  }

  /**
   * Execute plugin in sandboxed environment
   */
  private async executeSandboxed(
    installationId: string,
    event: string,
    context: any,
    configuration: Record<string, any>
  ): Promise<any> {
    // This is a placeholder for actual sandbox execution
    // In production, this would use a real sandboxing solution like:
    // - Isolate (Node.js VM module)
    // - WebWorkers for browser context
    // - Docker containers for maximum isolation
    // - gVisor/Kata for Kubernetes

    return {
      success: true,
      message: `Plugin execution completed for event: ${event}`,
      timestamp: new Date().toISOString()
    };
  }

  // ===== Plugin Ratings & Reviews =====

  /**
   * Submit plugin review
   */
  async submitPluginReview(
    pluginId: string,
    userId: string,
    rating: number,
    title: string,
    content: string,
    verifiedInstaller: boolean = true
  ): Promise<PluginReview> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const reviewId = crypto.randomUUID();

      const result = await query(
        `INSERT INTO plugin_reviews (
          id, plugin_id, user_id, rating, title, content,
          verified_installer, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [reviewId, pluginId, userId, rating, title, content, verifiedInstaller]
      );

      // Update plugin rating
      await this.updatePluginRating(pluginId);

      return this.mapToPluginReview(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to submit review: ${error}`);
    }
  }

  /**
   * Get plugin reviews
   */
  async getPluginReviews(
    pluginId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PluginReview[]> {
    try {
      const result = await query(
        `SELECT * FROM plugin_reviews WHERE plugin_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [pluginId, limit, offset]
      );

      return result.rows.map(row => this.mapToPluginReview(row));
    } catch (error) {
      throw new Error(`Failed to fetch reviews: ${error}`);
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string, helpful: boolean): Promise<void> {
    try {
      const field = helpful ? 'helpful' : 'unhelpful';

      await query(
        `UPDATE plugin_reviews SET ${field} = ${field} + 1 WHERE id = $1`,
        [reviewId]
      );
    } catch (error) {
      throw new Error(`Failed to mark review: ${error}`);
    }
  }

  // ===== Plugin Discovery & Marketplace =====

  /**
   * Search plugins in marketplace
   */
  async searchPlugins(
    query_str: string,
    category?: string,
    sortBy: 'rating' | 'downloads' | 'newest' = 'rating',
    limit: number = 20,
    offset: number = 0
  ): Promise<PluginRegistry[]> {
    try {
      let sql = `
        SELECT * FROM plugin_registry
        WHERE status = 'published' AND (
          name ILIKE $1 OR description ILIKE $1 OR keywords ILIKE $1
        )
      `;
      const params: any[] = [`%${query_str}%`];

      if (category) {
        sql += ` AND manifest->>'keywords' ILIKE $${params.length + 1}`;
        params.push(`%${category}%`);
      }

      // Sort
      if (sortBy === 'downloads') {
        sql += ` ORDER BY download_count DESC`;
      } else if (sortBy === 'newest') {
        sql += ` ORDER BY published_at DESC`;
      } else {
        sql += ` ORDER BY rating DESC`;
      }

      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);
      return result.rows.map(row => this.mapToPluginRegistry(row));
    } catch (error) {
      throw new Error(`Failed to search plugins: ${error}`);
    }
  }

  /**
   * Get trending plugins
   */
  async getTrendingPlugins(limit: number = 10): Promise<PluginRegistry[]> {
    try {
      const result = await query(
        `SELECT * FROM plugin_registry
         WHERE status = 'published'
         ORDER BY weekly_active_installs DESC, rating DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map(row => this.mapToPluginRegistry(row));
    } catch (error) {
      throw new Error(`Failed to fetch trending plugins: ${error}`);
    }
  }

  /**
   * Get featured plugins
   */
  async getFeaturedPlugins(): Promise<PluginRegistry[]> {
    try {
      const result = await query(
        `SELECT * FROM plugin_registry
         WHERE status = 'published' AND featured = true
         ORDER BY rating DESC`,
        []
      );

      return result.rows.map(row => this.mapToPluginRegistry(row));
    } catch (error) {
      throw new Error(`Failed to fetch featured plugins: ${error}`);
    }
  }

  // ===== Helper Methods =====

  private generatePluginId(): string {
    return `plugin_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateInstallationId(): string {
    return `inst_${crypto.randomUUID()}`;
  }

  private hashManifest(manifest: PluginManifest): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(manifest))
      .digest('hex');
  }

  private validateConfiguration(
    manifest: PluginManifest,
    configuration: Record<string, any>
  ): void {
    if (!manifest.configuration) return;

    for (const [key, option] of Object.entries(manifest.configuration)) {
      const value = configuration[key];

      // Check required fields
      if (option.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Required configuration missing: ${key}`);
      }

      // Validate type
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value)
          ? 'multiselect'
          : typeof value;

        if (option.type !== 'select' && option.type !== 'multiselect' && actualType !== option.type) {
          throw new Error(`Invalid type for ${key}: expected ${option.type}, got ${actualType}`);
        }

        // Validate regex pattern
        if (option.validation && typeof value === 'string') {
          const regex = new RegExp(option.validation);
          if (!regex.test(value)) {
            throw new Error(`Configuration ${key} fails validation`);
          }
        }
      }
    }
  }

  private getAllowedAPIs(isolationLevel: string): string[] {
    const baseAPIs = ['logs', 'notifications', 'config'];

    if (isolationLevel === 'basic') {
      return [...baseAPIs, 'incidents', 'threats', 'files', 'api', 'webhooks'];
    } else if (isolationLevel === 'restricted') {
      return [...baseAPIs, 'incidents:read', 'threats:read'];
    }

    return baseAPIs;
  }

  private getDeniedAPIs(isolationLevel: string): string[] {
    if (isolationLevel === 'basic') {
      return ['admin', 'system'];
    } else if (isolationLevel === 'restricted') {
      return ['admin', 'system', 'users', 'billing'];
    }

    return ['admin', 'system', 'users', 'billing', 'security', 'database'];
  }

  private async analyzeCodeQuality(pluginId: string): Promise<number> {
    // Placeholder for code quality analysis
    // Would integrate with tools like ESLint, SonarQube, etc.
    return Math.floor(Math.random() * 30) + 70; // 70-100
  }

  private async analyzePerformance(pluginId: string): Promise<number> {
    // Placeholder for performance analysis
    return Math.floor(Math.random() * 30) + 70; // 70-100
  }

  private async analyzeSecurityVulnerabilities(
    pluginId: string,
    vulnerabilities: Vulnerability[]
  ): Promise<number> {
    // Placeholder for vulnerability analysis
    // Would integrate with tools like Snyk, npm audit, etc.
    return Math.floor(Math.random() * 30) + 70; // 70-100
  }

  private generateRecommendations(
    vulnerabilities: Vulnerability[],
    codeQuality: number,
    performance: number
  ): string[] {
    const recommendations: string[] = [];

    if (vulnerabilities.length > 0) {
      recommendations.push('Address security vulnerabilities before publishing');
    }

    if (codeQuality < 80) {
      recommendations.push('Improve code quality and maintainability');
    }

    if (performance < 80) {
      recommendations.push('Optimize plugin performance and resource usage');
    }

    return recommendations;
  }

  private async updatePluginRating(pluginId: string): Promise<void> {
    const result = await query(
      `SELECT AVG(rating)::NUMERIC as avg_rating, COUNT(*) as count
       FROM plugin_reviews WHERE plugin_id = $1`,
      [pluginId]
    );

    const avgRating = result.rows[0].avg_rating || 0;
    const count = parseInt(result.rows[0].count) || 0;

    await query(
      `UPDATE plugin_registry SET rating = $1, review_count = $2 WHERE id = $3`,
      [parseFloat(avgRating), count, pluginId]
    );
  }

  // Mapping methods
  private mapToPluginRegistry(row: any): PluginRegistry {
    return {
      id: row.id,
      manifestId: row.manifest_id,
      manifest: JSON.parse(row.manifest),
      status: row.status,
      publishedVersion: row.published_version,
      rating: parseFloat(row.rating) || 0,
      reviewCount: parseInt(row.review_count) || 0,
      downloadCount: parseInt(row.download_count) || 0,
      weeklyActiveInstalls: parseInt(row.weekly_active_installs) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      suspendedAt: row.suspended_at ? new Date(row.suspended_at) : undefined,
      suspensionReason: row.suspension_reason,
      deprecatedAt: row.deprecated_at ? new Date(row.deprecated_at) : undefined,
      deprecationReason: row.deprecation_reason,
      securityScanStatus: row.security_scan_status
    };
  }

  private mapToPluginInstallation(row: any): PluginInstallation {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      pluginId: row.plugin_id,
      pluginName: row.plugin_name,
      pluginVersion: row.plugin_version,
      manifestHash: row.manifest_hash,
      status: row.status,
      configuration: JSON.parse(row.configuration || '{}'),
      grantedPermissions: JSON.parse(row.granted_permissions || '[]'),
      installedAt: new Date(row.installed_at),
      lastUpdatedAt: row.last_updated_at ? new Date(row.last_updated_at) : undefined,
      lastExecutedAt: row.last_executed_at ? new Date(row.last_executed_at) : undefined,
      updateAvailable: row.update_available,
      errorMessage: row.error_message,
      sandboxId: row.sandbox_id
    };
  }

  private mapToSecurityScanResult(row: any): SecurityScanResult {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      status: row.status,
      vulnerabilities: JSON.parse(row.vulnerabilities || '[]'),
      codeQualityScore: parseFloat(row.code_quality_score) || 0,
      performanceScore: parseFloat(row.performance_score) || 0,
      securityScore: parseFloat(row.security_score) || 0,
      recommendations: JSON.parse(row.recommendations || '[]')
    };
  }

  private mapToPluginReview(row: any): PluginReview {
    return {
      id: row.id,
      pluginId: row.plugin_id,
      userId: row.user_id,
      rating: parseInt(row.rating),
      title: row.title,
      content: row.content,
      verifiedInstaller: row.verified_installer,
      helpful: parseInt(row.helpful) || 0,
      unhelpful: parseInt(row.unhelpful) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  private mapToPluginVersioning(row: any): PluginVersioning {
    return {
      id: row.id,
      pluginId: row.plugin_id,
      version: row.version,
      releaseNotes: row.release_notes,
      manifest: JSON.parse(row.manifest),
      changelog: JSON.parse(row.changelog || '[]'),
      breakingChanges: JSON.parse(row.breaking_changes || '[]'),
      releasedAt: new Date(row.released_at),
      downloadCount: parseInt(row.download_count) || 0
    };
  }

  private mapToPluginExecution(row: any): PluginExecution {
    return {
      id: row.id,
      installationId: row.installation_id,
      pluginId: row.plugin_id,
      event: row.event,
      status: row.status,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      executionTime: row.execution_time,
      output: row.output ? JSON.parse(row.output) : undefined,
      error: row.error,
      logs: row.logs ? JSON.parse(row.logs) : undefined
    };
  }
}

export const pluginSystem = new PluginSystem();
