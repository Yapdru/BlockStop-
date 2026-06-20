// Scan Controller - Business Logic for Scan Endpoints
import { APIContext, PaginatedResponse, PaginationParams } from '../../types';
import { NotFoundError, ConflictError, ValidationError } from '../../error-handler';

export interface Scan {
  id: string;
  orgId: string;
  type: 'email' | 'file' | 'domain' | 'ip' | 'url';
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  result?: ScanResult;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface ScanResult {
  id: string;
  scanId: string;
  threatLevel: 'safe' | 'suspicious' | 'malicious';
  riskScore: number; // 0-100
  detectedThreats: DetectedThreat[];
  summary: string;
  details?: Record<string, any>;
}

export interface DetectedThreat {
  threatId: string;
  threatName: string;
  type: string;
  severity: string;
  confidence: number; // 0-100
  details?: Record<string, any>;
}

export interface CreateScanRequest {
  type: string;
  target: string;
  priority?: string;
  options?: Record<string, any>;
}

export interface UpdateScanRequest {
  status?: string;
  progress?: number;
  result?: Partial<ScanResult>;
}

// In-memory storage
const scanStore = new Map<string, Scan>();
const resultStore = new Map<string, ScanResult>();

export class ScanController {
  /**
   * List scans with pagination and filtering
   */
  static async listScans(
    context: APIContext,
    params: PaginationParams & {
      type?: string;
      status?: string;
      priority?: string;
      threatLevel?: string;
    }
  ): Promise<PaginatedResponse<Scan>> {
    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    let scans = Array.from(scanStore.values()).filter(s => s.orgId === context.orgId);

    // Apply filters
    if (params.type) {
      scans = scans.filter(s => s.type === params.type);
    }
    if (params.status) {
      scans = scans.filter(s => s.status === params.status);
    }
    if (params.priority) {
      scans = scans.filter(s => s.priority === params.priority);
    }
    if (params.threatLevel && params.threatLevel !== 'all') {
      scans = scans.filter(s => s.result?.threatLevel === params.threatLevel);
    }

    // Sort by created date descending
    scans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = scans.length;
    const items = scans.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items,
      cursor: '',
      hasMore,
      total,
      pageSize: items.length,
    };
  }

  /**
   * Get scan by ID
   */
  static async getScanById(scanId: string, context: APIContext): Promise<Scan> {
    const scan = scanStore.get(scanId);

    if (!scan) {
      throw new NotFoundError(`Scan not found: ${scanId}`);
    }

    if (scan.orgId !== context.orgId) {
      throw new NotFoundError('Scan not found');
    }

    return scan;
  }

  /**
   * Create new scan
   */
  static async createScan(
    data: CreateScanRequest,
    context: APIContext
  ): Promise<Scan> {
    // Validate required fields
    if (!data.type || !data.target) {
      throw new ValidationError('Missing required fields', {
        required: ['type', 'target'],
      });
    }

    // Validate scan type
    const validTypes = ['email', 'file', 'domain', 'ip', 'url'];
    if (!validTypes.includes(data.type)) {
      throw new ValidationError('Invalid scan type', {
        received: data.type,
        valid: validTypes,
      });
    }

    // Validate target based on type
    this.validateTarget(data.type, data.target);

    const priority = (data.priority || 'medium') as Scan['priority'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      throw new ValidationError('Invalid priority level');
    }

    const now = new Date();
    const scan: Scan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId: context.orgId,
      type: data.type as Scan['type'],
      target: data.target,
      status: 'pending',
      priority,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
      metadata: data.options,
    };

    scanStore.set(scan.id, scan);
    return scan;
  }

  /**
   * Update scan status and progress
   */
  static async updateScan(
    scanId: string,
    data: UpdateScanRequest,
    context: APIContext
  ): Promise<Scan> {
    const scan = await this.getScanById(scanId, context);

    if (data.status) {
      const validStatuses = ['pending', 'running', 'completed', 'failed'];
      if (!validStatuses.includes(data.status)) {
        throw new ValidationError('Invalid scan status');
      }
      scan.status = data.status as Scan['status'];

      if (data.status === 'running' && !scan.startedAt) {
        scan.startedAt = new Date();
      } else if (data.status === 'completed' && !scan.completedAt) {
        scan.completedAt = new Date();
      }
    }

    if (data.progress !== undefined) {
      if (data.progress < 0 || data.progress > 100) {
        throw new ValidationError('Progress must be between 0 and 100');
      }
      scan.progress = data.progress;
    }

    if (data.result) {
      const result: ScanResult = {
        id: `result_${Date.now()}`,
        scanId,
        threatLevel: data.result.threatLevel || 'safe',
        riskScore: data.result.riskScore || 0,
        detectedThreats: data.result.detectedThreats || [],
        summary: data.result.summary || '',
        details: data.result.details,
      };
      resultStore.set(result.id, result);
      scan.result = result;
    }

    scan.updatedAt = new Date();
    scanStore.set(scanId, scan);
    return scan;
  }

  /**
   * Get scan results
   */
  static async getScanResult(
    scanId: string,
    context: APIContext
  ): Promise<ScanResult> {
    const scan = await this.getScanById(scanId, context);

    if (!scan.result) {
      throw new NotFoundError('Scan results not available');
    }

    const result = resultStore.get(scan.result.id);
    if (!result) {
      throw new NotFoundError('Scan results not found');
    }

    return result;
  }

  /**
   * Delete scan
   */
  static async deleteScan(scanId: string, context: APIContext): Promise<void> {
    const scan = await this.getScanById(scanId, context);

    if (scan.result) {
      resultStore.delete(scan.result.id);
    }

    scanStore.delete(scanId);
  }

  /**
   * Get scan history for target
   */
  static async getScanHistory(
    type: string,
    target: string,
    context: APIContext,
    params: PaginationParams
  ): Promise<PaginatedResponse<Scan>> {
    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    let scans = Array.from(scanStore.values()).filter(
      s =>
        s.orgId === context.orgId &&
        s.type === type &&
        s.target === target &&
        s.status === 'completed'
    );

    // Sort by completed date descending
    scans.sort((a, b) => {
      const aTime = a.completedAt?.getTime() || 0;
      const bTime = b.completedAt?.getTime() || 0;
      return bTime - aTime;
    });

    const total = scans.length;
    const items = scans.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items,
      cursor: '',
      hasMore,
      total,
      pageSize: items.length,
    };
  }

  /**
   * Get scan statistics
   */
  static async getStats(context: APIContext): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byThreatLevel: Record<string, number>;
    averageRiskScore: number;
    completionRate: number;
  }> {
    const scans = Array.from(scanStore.values()).filter(s => s.orgId === context.orgId);

    const stats = {
      total: scans.length,
      byStatus: { pending: 0, running: 0, completed: 0, failed: 0 },
      byType: {} as Record<string, number>,
      byThreatLevel: { safe: 0, suspicious: 0, malicious: 0 },
      averageRiskScore: 0,
      completionRate: 0,
    };

    let totalRiskScore = 0;
    let resultCount = 0;

    for (const scan of scans) {
      stats.byStatus[scan.status]++;
      stats.byType[scan.type] = (stats.byType[scan.type] || 0) + 1;

      if (scan.result) {
        stats.byThreatLevel[scan.result.threatLevel]++;
        totalRiskScore += scan.result.riskScore;
        resultCount++;
      }
    }

    if (resultCount > 0) {
      stats.averageRiskScore = Math.round(totalRiskScore / resultCount);
    }

    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.byStatus.completed / stats.total) * 100);
    }

    return stats;
  }

  /**
   * Bulk scan creation
   */
  static async bulkCreateScans(
    targets: Array<{ type: string; target: string; priority?: string }>,
    context: APIContext
  ): Promise<Scan[]> {
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new ValidationError('Targets must be a non-empty array');
    }

    if (targets.length > 100) {
      throw new ValidationError('Maximum 100 scans per bulk request');
    }

    const scans: Scan[] = [];

    for (const target of targets) {
      try {
        const scan = await this.createScan(target, context);
        scans.push(scan);
      } catch (error) {
        // Continue with other targets on error
        console.error(`Failed to create scan for ${target.target}:`, error);
      }
    }

    return scans;
  }

  /**
   * Get scan template suggestions
   */
  static async getTemplates(): Promise<Array<{
    name: string;
    type: string;
    description: string;
    options: Record<string, any>;
  }>> {
    return [
      {
        name: 'Quick Email Scan',
        type: 'email',
        description: 'Fast email security assessment',
        options: { depth: 'quick', checkPhishing: true, checkSpam: true },
      },
      {
        name: 'Deep Email Analysis',
        type: 'email',
        description: 'Comprehensive email security analysis',
        options: {
          depth: 'deep',
          checkPhishing: true,
          checkSpam: true,
          analyzeAttachments: true,
        },
      },
      {
        name: 'File Malware Scan',
        type: 'file',
        description: 'Check file for malware and viruses',
        options: {
          checkMalware: true,
          checkRansomware: true,
          checkExploits: true,
        },
      },
      {
        name: 'Domain Security Check',
        type: 'domain',
        description: 'Assess domain security and reputation',
        options: {
          checkReputation: true,
          checkDNS: true,
          checkSSL: true,
        },
      },
      {
        name: 'URL Analysis',
        type: 'url',
        description: 'Analyze URL for threats and redirects',
        options: {
          checkMalware: true,
          checkPhishing: true,
          followRedirects: true,
        },
      },
      {
        name: 'IP Reputation Check',
        type: 'ip',
        description: 'Check IP address reputation',
        options: {
          checkReputation: true,
          checkGeoLocation: true,
          checkBlacklists: true,
        },
      },
    ];
  }

  /**
   * Validate target based on type
   */
  private static validateTarget(type: string, target: string): void {
    switch (type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
          throw new ValidationError('Invalid email address');
        }
        break;

      case 'url':
        try {
          new URL(target);
        } catch {
          throw new ValidationError('Invalid URL');
        }
        break;

      case 'domain':
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(target)) {
          throw new ValidationError('Invalid domain name');
        }
        break;

      case 'ip':
        if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(target)) {
          throw new ValidationError('Invalid IP address');
        }
        const octets = target.split('.');
        if (octets.some(octet => parseInt(octet) > 255)) {
          throw new ValidationError('Invalid IP address');
        }
        break;

      case 'file':
        if (target.length === 0 || target.length > 500) {
          throw new ValidationError('Invalid file identifier');
        }
        break;
    }
  }
}
