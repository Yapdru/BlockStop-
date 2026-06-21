/**
 * BlockStop Phase 28.2 - Zero-Trust Architecture
 * Verify every access request with continuous authentication
 * Micro-segmentation and device trust scoring
 */

import { v4 as uuidv4 } from 'uuid';

export type TrustLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
export type AccessDecision = 'allow' | 'deny' | 'challenge' | 'restrict';
export type AuthMethod = 'password' | 'mfa' | 'biometric' | 'certificate' | 'oauth' | 'oidc';

export interface DeviceProfile {
  deviceId: string;
  deviceName: string;
  osType: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
  osVersion: string;
  hardwareId: string;
  owner: string;
  registeredAt: Date;
  lastSeen: Date;
  isCompliant: boolean;
  hasEncryption: boolean;
  hasAntivirus: boolean;
  hasFirewall: boolean;
  metadata?: Record<string, any>;
}

export interface DeviceTrustScore {
  deviceId: string;
  score: number; // 0-100
  trustLevel: TrustLevel;
  factors: {
    osSecurityPatches: number;
    encryptionStatus: number;
    malwareProtection: number;
    firewallStatus: number;
    updateStatus: number;
    behaviorAnalysis: number;
  };
  lastCalculated: Date;
  risks: string[];
}

export interface AccessContext {
  userId: string;
  deviceId: string;
  ipAddress: string;
  timestamp: Date;
  resourceId: string;
  action: string;
  location?: {
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuthenticationChallenge {
  id: string;
  type: 'mfa' | 'biometric' | 'email_verification' | 'security_questions';
  userId: string;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  completed: boolean;
}

export interface AuthenticationEvent {
  id: string;
  userId: string;
  method: AuthMethod;
  success: boolean;
  ipAddress: string;
  timestamp: Date;
  deviceId?: string;
  location?: string;
  riskScore?: number;
  mfaUsed: boolean;
  newDeviceDetected: boolean;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  decision: AccessDecision;
  requiresMfa: boolean;
  minimumTrustLevel: TrustLevel;
  resourcePattern: string;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCondition {
  type: 'user_risk' | 'device_trust' | 'location' | 'time' | 'ip_reputation' | 'behavior';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'between' | 'match';
  value: any;
  description?: string;
}

export interface MicroSegment {
  id: string;
  name: string;
  description: string;
  resources: string[];
  allowedUserRoles: string[];
  allowedDeviceTrustLevels: TrustLevel[];
  requiredAuthMethods: AuthMethod[];
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  createdAt: Date;
}

export interface AccessLog {
  id: string;
  userId: string;
  deviceId: string;
  resourceId: string;
  action: string;
  decision: AccessDecision;
  trustScore: number;
  riskFactors: string[];
  timestamp: Date;
  details?: Record<string, any>;
}

export class ZeroTrustEngine {
  private devices: Map<string, DeviceProfile> = new Map();
  private trustScores: Map<string, DeviceTrustScore> = new Map();
  private authEvents: AuthenticationEvent[] = [];
  private policies: Map<string, AccessPolicy> = new Map();
  private segments: Map<string, MicroSegment> = new Map();
  private accessLogs: AccessLog[] = [];
  private activeChallenges: Map<string, AuthenticationChallenge> = new Map();
  private ipReputation: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default zero-trust policies
   */
  private initializeDefaultPolicies(): void {
    // Default deny policy
    this.createPolicy(
      'default-deny',
      'Default Deny All',
      'Default policy to deny all access',
      [],
      'deny',
      false,
      'unknown',
      '.*',
      1000
    );

    // Require MFA for admin access
    this.createPolicy(
      'admin-mfa-required',
      'Admin MFA Required',
      'All admin access requires MFA',
      [
        {
          type: 'user_risk',
          operator: 'equals',
          value: 'admin',
          description: 'User has admin role',
        },
      ],
      'challenge',
      true,
      'high',
      '/admin/.*',
      100
    );
  }

  /**
   * Register a device
   */
  public registerDevice(
    deviceName: string,
    osType: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown',
    osVersion: string,
    hardwareId: string,
    owner: string
  ): DeviceProfile {
    const deviceId = `device-${uuidv4()}`;
    const device: DeviceProfile = {
      deviceId,
      deviceName,
      osType,
      osVersion,
      hardwareId,
      owner,
      registeredAt: new Date(),
      lastSeen: new Date(),
      isCompliant: true,
      hasEncryption: false,
      hasAntivirus: false,
      hasFirewall: false,
    };

    this.devices.set(deviceId, device);
    this.calculateDeviceTrustScore(deviceId);
    return device;
  }

  /**
   * Update device compliance status
   */
  public updateDeviceCompliance(
    deviceId: string,
    isCompliant: boolean,
    encryptionEnabled?: boolean,
    antivirusEnabled?: boolean,
    firewallEnabled?: boolean
  ): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.isCompliant = isCompliant;
    if (encryptionEnabled !== undefined) device.hasEncryption = encryptionEnabled;
    if (antivirusEnabled !== undefined) device.hasAntivirus = antivirusEnabled;
    if (firewallEnabled !== undefined) device.hasFirewall = firewallEnabled;
    device.lastSeen = new Date();

    this.calculateDeviceTrustScore(deviceId);
    return true;
  }

  /**
   * Calculate device trust score
   */
  public calculateDeviceTrustScore(deviceId: string): DeviceTrustScore | null {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    let score = 50; // Base score
    const factors = {
      osSecurityPatches: 20,
      encryptionStatus: 20,
      malwareProtection: 20,
      firewallStatus: 20,
      updateStatus: 20,
      behaviorAnalysis: 20,
    };

    // OS security patches (assume up to date)
    if (['windows', 'macos', 'linux'].includes(device.osType)) {
      factors.osSecurityPatches = 20;
      score += 20;
    }

    // Encryption status
    if (device.hasEncryption) {
      factors.encryptionStatus = 20;
      score += 20;
    }

    // Malware protection
    if (device.hasAntivirus) {
      factors.malwareProtection = 20;
      score += 20;
    }

    // Firewall status
    if (device.hasFirewall) {
      factors.firewallStatus = 20;
      score += 20;
    }

    // Update status (based on OS freshness)
    const daysSinceLastSeen = Math.floor(
      (Date.now() - device.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastSeen < 7) {
      factors.updateStatus = 20;
      score += 20;
    }

    // Compliance status
    if (device.isCompliant) {
      factors.behaviorAnalysis = 20;
      score += 20;
    }

    const trustLevel = this.getTrustLevelFromScore(score);
    const risks: string[] = [];

    if (!device.hasEncryption) risks.push('Disk encryption not enabled');
    if (!device.hasAntivirus) risks.push('Antivirus not installed');
    if (!device.hasFirewall) risks.push('Firewall not enabled');
    if (!device.isCompliant) risks.push('Device not compliant with policy');
    if (daysSinceLastSeen > 14) risks.push('Device not seen for more than 14 days');

    const trustScore: DeviceTrustScore = {
      deviceId,
      score: Math.min(100, score),
      trustLevel,
      factors,
      lastCalculated: new Date(),
      risks,
    };

    this.trustScores.set(deviceId, trustScore);
    return trustScore;
  }

  /**
   * Get trust level from score
   */
  private getTrustLevelFromScore(score: number): TrustLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'unknown';
  }

  /**
   * Record authentication event
   */
  public recordAuthEvent(
    userId: string,
    method: AuthMethod,
    success: boolean,
    ipAddress: string,
    deviceId?: string,
    location?: string,
    mfaUsed?: boolean,
    newDeviceDetected?: boolean
  ): AuthenticationEvent {
    const event: AuthenticationEvent = {
      id: `auth-${uuidv4()}`,
      userId,
      method,
      success,
      ipAddress,
      deviceId,
      location,
      timestamp: new Date(),
      mfaUsed: mfaUsed || false,
      newDeviceDetected: newDeviceDetected || false,
    };

    this.authEvents.push(event);

    // Update IP reputation
    if (!success) {
      const currentRep = this.ipReputation.get(ipAddress) || 0;
      this.ipReputation.set(ipAddress, Math.max(0, currentRep - 10));
    }

    return event;
  }

  /**
   * Create an authentication challenge
   */
  public createChallenge(
    userId: string,
    sessionId: string,
    type: 'mfa' | 'biometric' | 'email_verification' | 'security_questions'
  ): AuthenticationChallenge {
    const challengeId = `challenge-${uuidv4()}`;
    const challenge: AuthenticationChallenge = {
      id: challengeId,
      type,
      userId,
      sessionId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      attempts: 0,
      maxAttempts: 3,
      completed: false,
    };

    this.activeChallenges.set(challengeId, challenge);
    return challenge;
  }

  /**
   * Verify challenge
   */
  public verifyChallenge(challengeId: string, verified: boolean): boolean {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) return false;

    if (challenge.expiresAt < new Date()) {
      this.activeChallenges.delete(challengeId);
      return false;
    }

    if (verified) {
      challenge.completed = true;
      return true;
    }

    challenge.attempts++;
    if (challenge.attempts >= challenge.maxAttempts) {
      this.activeChallenges.delete(challengeId);
      return false;
    }

    return false;
  }

  /**
   * Create access policy
   */
  public createPolicy(
    id: string,
    name: string,
    description: string,
    conditions: PolicyCondition[],
    decision: AccessDecision,
    requiresMfa: boolean,
    minimumTrustLevel: TrustLevel,
    resourcePattern: string,
    priority: number
  ): AccessPolicy {
    const policy: AccessPolicy = {
      id,
      name,
      description,
      conditions,
      decision,
      requiresMfa,
      minimumTrustLevel,
      resourcePattern,
      priority,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(id, policy);
    return policy;
  }

  /**
   * Create micro-segment
   */
  public createSegment(
    name: string,
    description: string,
    resources: string[],
    allowedUserRoles: string[],
    allowedDeviceTrustLevels: TrustLevel[],
    requiredAuthMethods: AuthMethod[],
    ipWhitelist?: string[],
    ipBlacklist?: string[]
  ): MicroSegment {
    const segmentId = `segment-${uuidv4()}`;
    const segment: MicroSegment = {
      id: segmentId,
      name,
      description,
      resources,
      allowedUserRoles,
      allowedDeviceTrustLevels,
      requiredAuthMethods,
      ipWhitelist,
      ipBlacklist,
      createdAt: new Date(),
    };

    this.segments.set(segmentId, segment);
    return segment;
  }

  /**
   * Evaluate access request (core zero-trust decision)
   */
  public evaluateAccess(context: AccessContext): {
    decision: AccessDecision;
    trustScore: number;
    riskFactors: string[];
    requiresMfa: boolean;
    details: Record<string, any>;
  } {
    const riskFactors: string[] = [];
    let trustScore = 100;
    let requiresMfa = false;

    // Get device trust score
    const device = this.devices.get(context.deviceId);
    const deviceTrust = this.trustScores.get(context.deviceId);

    if (!device) {
      riskFactors.push('Unknown device');
      trustScore -= 30;
    } else if (!deviceTrust) {
      riskFactors.push('Device trust not calculated');
      trustScore -= 20;
    } else {
      trustScore = deviceTrust.score;
      riskFactors.push(...deviceTrust.risks);
    }

    // Check IP reputation
    const ipReputation = this.ipReputation.get(context.ipAddress) || 100;
    if (ipReputation < 50) {
      riskFactors.push('IP address has poor reputation');
      trustScore -= 20;
    }

    // Evaluate policies in priority order
    const applicablePolicies = Array.from(this.policies.values())
      .filter(p => p.enabled && new RegExp(p.resourcePattern).test(context.resourceId))
      .sort((a, b) => a.priority - b.priority);

    let decision: AccessDecision = 'allow';
    for (const policy of applicablePolicies) {
      if (this.evaluatePolicyConditions(policy.conditions, context)) {
        decision = policy.decision;
        if (policy.requiresMfa) requiresMfa = true;
        break;
      }
    }

    // Final decision based on trust score
    const minTrustLevel = 'medium';
    const trustLevel = this.getTrustLevelFromScore(trustScore);
    const trustLevelHierarchy = { unknown: 0, low: 1, medium: 2, high: 3, critical: 4 };

    if (
      trustLevelHierarchy[trustLevel] <
      trustLevelHierarchy[minTrustLevel as TrustLevel]
    ) {
      decision = 'restrict';
      requiresMfa = true;
    }

    // Log access attempt
    const log: AccessLog = {
      id: `log-${uuidv4()}`,
      userId: context.userId,
      deviceId: context.deviceId,
      resourceId: context.resourceId,
      action: context.action,
      decision,
      trustScore,
      riskFactors,
      timestamp: new Date(),
      details: context.metadata,
    };

    this.accessLogs.push(log);

    return {
      decision,
      trustScore,
      riskFactors,
      requiresMfa,
      details: {
        deviceTrust: deviceTrust?.trustLevel,
        ipReputation,
        applicablePolicies: applicablePolicies.map(p => p.id),
        logId: log.id,
      },
    };
  }

  /**
   * Evaluate policy conditions
   */
  private evaluatePolicyConditions(conditions: PolicyCondition[], context: AccessContext): boolean {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: PolicyCondition, context: AccessContext): boolean {
    switch (condition.type) {
      case 'user_risk':
        return condition.operator === 'equals' && context.metadata?.risk === condition.value;
      case 'device_trust':
        const trustScore = this.trustScores.get(context.deviceId);
        if (!trustScore) return false;
        if (condition.operator === 'greaterThan') {
          return trustScore.score > condition.value;
        }
        if (condition.operator === 'lessThan') {
          return trustScore.score < condition.value;
        }
        return false;
      case 'location':
        return context.location === condition.value;
      case 'time':
        const hour = new Date().getHours();
        return condition.operator === 'between' &&
          hour >= condition.value.start &&
          hour <= condition.value.end;
      case 'ip_reputation':
        const reputation = this.ipReputation.get(context.ipAddress) || 100;
        return reputation >= condition.value;
      default:
        return true;
    }
  }

  /**
   * Get access logs with filters
   */
  public getAccessLogs(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    decision?: AccessDecision
  ): AccessLog[] {
    return this.accessLogs.filter(log => {
      if (userId && log.userId !== userId) return false;
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      if (decision && log.decision !== decision) return false;
      return true;
    });
  }

  /**
   * Get authentication history
   */
  public getAuthHistory(userId: string, limit: number = 100): AuthenticationEvent[] {
    return this.authEvents
      .filter(e => e.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Detect anomalies in authentication pattern
   */
  public detectAnomalies(userId: string): Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> {
    const anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    const recentEvents = this.authEvents
      .filter(e => e.userId === userId && e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Check for multiple failed attempts
    const failedAttempts = recentEvents.filter(e => !e.success).length;
    if (failedAttempts >= 3) {
      anomalies.push({
        type: 'multiple_failed_attempts',
        severity: 'high',
        description: `${failedAttempts} failed authentication attempts in the last 24 hours`,
      });
    }

    // Check for new device
    const devices = new Set(recentEvents.map(e => e.deviceId));
    if (devices.size > 3) {
      anomalies.push({
        type: 'multiple_devices',
        severity: 'medium',
        description: `User authenticated from ${devices.size} different devices in 24 hours`,
      });
    }

    // Check for unusual locations
    const locations = new Set(recentEvents.map(e => e.location));
    if (locations.size > 2) {
      anomalies.push({
        type: 'unusual_location',
        severity: 'medium',
        description: `User authenticated from ${locations.size} different locations`,
      });
    }

    return anomalies;
  }

  /**
   * Export zero-trust configuration
   */
  public exportConfiguration(): {
    devices: DeviceProfile[];
    policies: AccessPolicy[];
    segments: MicroSegment[];
    trustScores: DeviceTrustScore[];
  } {
    return {
      devices: Array.from(this.devices.values()),
      policies: Array.from(this.policies.values()),
      segments: Array.from(this.segments.values()),
      trustScores: Array.from(this.trustScores.values()),
    };
  }
}
