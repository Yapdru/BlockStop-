// Threat Controller - Business Logic for Threat Endpoints
import { APIContext, PaginatedResponse, PaginationParams, APIErrorCode } from '../../types';
import { NotFoundError, ConflictError, ValidationError } from '../../error-handler';

export interface Threat {
  id: string;
  orgId: string;
  name: string;
  type: 'malware' | 'phishing' | 'exploit' | 'ransomware' | 'trojan' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  indicators?: string[];
  detectionsCount: number;
  lastSeen?: Date;
  firstSeen: Date;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ThreatDetection {
  id: string;
  threatId: string;
  orgId: string;
  timestamp: Date;
  severity: string;
  source: string;
  details: Record<string, any>;
}

export interface CreateThreatRequest {
  name: string;
  type: string;
  severity: string;
  description?: string;
  indicators?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateThreatRequest {
  name?: string;
  severity?: string;
  description?: string;
  indicators?: string[];
  active?: boolean;
  metadata?: Record<string, any>;
}

// In-memory storage for demo purposes (would use database in production)
const threatStore = new Map<string, Threat>();
const detectionStore = new Map<string, ThreatDetection>();

export class ThreatController {
  /**
   * List threats with pagination and filtering
   */
  static async listThreats(
    context: APIContext,
    params: PaginationParams & {
      type?: string;
      severity?: string;
      active?: boolean;
      search?: string;
    }
  ): Promise<PaginatedResponse<Threat>> {
    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    let threats = Array.from(threatStore.values()).filter(
      t => t.orgId === context.orgId
    );

    // Apply filters
    if (params.type) {
      threats = threats.filter(t => t.type === params.type);
    }
    if (params.severity) {
      threats = threats.filter(t => t.severity === params.severity);
    }
    if (params.active !== undefined) {
      threats = threats.filter(t => t.active === params.active);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      threats = threats.filter(
        t =>
          t.name.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    const sortField = (params.sort || 'createdAt') as keyof Threat;
    const order = (params.order || 'desc') === 'asc' ? 1 : -1;
    threats.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return -order;
      if (aVal > bVal) return order;
      return 0;
    });

    // Apply pagination
    const total = threats.length;
    const items = threats.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Generate cursor for next page
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64')
      : '';

    return {
      items,
      cursor: nextCursor,
      hasMore,
      total,
      pageSize: items.length,
    };
  }

  /**
   * Get threat by ID
   */
  static async getThreatById(threatId: string, context: APIContext): Promise<Threat> {
    const threat = threatStore.get(threatId);

    if (!threat) {
      throw new NotFoundError(`Threat not found: ${threatId}`);
    }

    if (threat.orgId !== context.orgId) {
      throw new NotFoundError('Threat not found');
    }

    return threat;
  }

  /**
   * Create new threat
   */
  static async createThreat(
    data: CreateThreatRequest,
    context: APIContext
  ): Promise<Threat> {
    // Validate required fields
    if (!data.name || !data.type || !data.severity) {
      throw new ValidationError('Missing required fields', {
        required: ['name', 'type', 'severity'],
      });
    }

    // Validate enum values
    const validTypes = ['malware', 'phishing', 'exploit', 'ransomware', 'trojan', 'other'];
    if (!validTypes.includes(data.type)) {
      throw new ValidationError('Invalid threat type', {
        received: data.type,
        valid: validTypes,
      });
    }

    const validSeverities = ['critical', 'high', 'medium', 'low'];
    if (!validSeverities.includes(data.severity)) {
      throw new ValidationError('Invalid severity level', {
        received: data.severity,
        valid: validSeverities,
      });
    }

    // Check for duplicate threat name within organization
    const existingThreat = Array.from(threatStore.values()).find(
      t => t.orgId === context.orgId && t.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingThreat) {
      throw new ConflictError(
        `Threat with name "${data.name}" already exists in organization`,
        { threatId: existingThreat.id }
      );
    }

    const now = new Date();
    const threat: Threat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orgId: context.orgId,
      name: data.name,
      type: data.type as Threat['type'],
      severity: data.severity as Threat['severity'],
      description: data.description,
      indicators: data.indicators || [],
      detectionsCount: 0,
      firstSeen: now,
      active: true,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId,
    };

    threatStore.set(threat.id, threat);
    return threat;
  }

  /**
   * Update threat
   */
  static async updateThreat(
    threatId: string,
    data: UpdateThreatRequest,
    context: APIContext
  ): Promise<Threat> {
    const threat = await this.getThreatById(threatId, context);

    const updates: Partial<Threat> = {};

    if (data.name !== undefined) {
      // Check for duplicate name
      const existing = Array.from(threatStore.values()).find(
        t =>
          t.orgId === context.orgId &&
          t.id !== threatId &&
          t.name.toLowerCase() === data.name.toLowerCase()
      );
      if (existing) {
        throw new ConflictError(`Threat name already exists: ${data.name}`);
      }
      updates.name = data.name;
    }

    if (data.severity !== undefined) {
      const validSeverities = ['critical', 'high', 'medium', 'low'];
      if (!validSeverities.includes(data.severity)) {
        throw new ValidationError('Invalid severity level');
      }
      updates.severity = data.severity as Threat['severity'];
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    if (data.indicators !== undefined) {
      updates.indicators = data.indicators;
    }

    if (data.active !== undefined) {
      updates.active = data.active;
    }

    if (data.metadata !== undefined) {
      updates.metadata = data.metadata;
    }

    updates.updatedAt = new Date();

    const updated = { ...threat, ...updates };
    threatStore.set(threatId, updated);
    return updated;
  }

  /**
   * Delete threat
   */
  static async deleteThreat(threatId: string, context: APIContext): Promise<void> {
    const threat = await this.getThreatById(threatId, context);

    // Delete associated detections
    for (const [key, detection] of detectionStore.entries()) {
      if (detection.threatId === threatId) {
        detectionStore.delete(key);
      }
    }

    threatStore.delete(threatId);
  }

  /**
   * Get threat detections
   */
  static async getThreatDetections(
    threatId: string,
    context: APIContext,
    params: PaginationParams
  ): Promise<PaginatedResponse<ThreatDetection>> {
    // Verify threat exists
    await this.getThreatById(threatId, context);

    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;

    let detections = Array.from(detectionStore.values()).filter(
      d => d.threatId === threatId && d.orgId === context.orgId
    );

    // Sort by timestamp descending
    detections.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = detections.length;
    const items = detections.slice(offset, offset + limit);
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
   * Record threat detection
   */
  static async recordDetection(
    threatId: string,
    detection: Omit<ThreatDetection, 'id' | 'threatId' | 'orgId'>,
    context: APIContext
  ): Promise<ThreatDetection> {
    // Verify threat exists
    const threat = await this.getThreatById(threatId, context);

    const det: ThreatDetection = {
      id: `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threatId,
      orgId: context.orgId,
      ...detection,
    };

    detectionStore.set(det.id, det);

    // Update detection count
    threat.detectionsCount++;
    threat.lastSeen = new Date();
    threatStore.set(threatId, threat);

    return det;
  }

  /**
   * Get threat intelligence indicators
   */
  static async getIndicators(
    threatId: string,
    context: APIContext
  ): Promise<{ indicators: string[] }> {
    const threat = await this.getThreatById(threatId, context);
    return {
      indicators: threat.indicators || [],
    };
  }

  /**
   * Add threat indicator
   */
  static async addIndicator(
    threatId: string,
    indicator: string,
    context: APIContext
  ): Promise<Threat> {
    const threat = await this.getThreatById(threatId, context);

    if (!threat.indicators) {
      threat.indicators = [];
    }

    if (threat.indicators.includes(indicator)) {
      throw new ConflictError('Indicator already exists for this threat');
    }

    threat.indicators.push(indicator);
    threat.updatedAt = new Date();
    threatStore.set(threatId, threat);

    return threat;
  }

  /**
   * Remove threat indicator
   */
  static async removeIndicator(
    threatId: string,
    indicator: string,
    context: APIContext
  ): Promise<Threat> {
    const threat = await this.getThreatById(threatId, context);

    if (!threat.indicators) {
      throw new NotFoundError('Indicator not found');
    }

    const index = threat.indicators.indexOf(indicator);
    if (index === -1) {
      throw new NotFoundError('Indicator not found');
    }

    threat.indicators.splice(index, 1);
    threat.updatedAt = new Date();
    threatStore.set(threatId, threat);

    return threat;
  }

  /**
   * Get threat statistics
   */
  static async getStats(context: APIContext): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    active: number;
    totalDetections: number;
  }> {
    const threats = Array.from(threatStore.values()).filter(
      t => t.orgId === context.orgId
    );

    const stats = {
      total: threats.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byType: {} as Record<string, number>,
      active: 0,
      totalDetections: 0,
    };

    for (const threat of threats) {
      if (threat.active) stats.active++;
      stats.bySeverity[threat.severity]++;
      stats.byType[threat.type] = (stats.byType[threat.type] || 0) + 1;
      stats.totalDetections += threat.detectionsCount;
    }

    return stats;
  }
}
