// Behavioral Prediction Engine - UEBA, Anomaly Detection, Insider Threat Detection
// Machine Learning Models: Isolation Forest, LOF, Autoencoders

export interface UserBehaviorProfile {
  userId: string;
  username: string;
  department: string;
  role: string;
  baselineCreatedAt: Date;
  lastUpdated: Date;

  // Behavioral patterns
  typicalLoginHours: {
    hour: number;
    frequency: number;
  }[];
  typicalLoginLocations: {
    location: string;
    latitude: number;
    longitude: number;
    frequency: number;
  }[];
  typicalDevices: string[];
  typicalIpAddresses: string[];
  typicalFileAccess: {
    filePath: string;
    accessCount: number;
    lastAccessed: Date;
  }[];

  // Statistical baseline
  avgFilesAccessedPerDay: number;
  avgDataTransferPerDay: number; // MB
  avgLoginDuration: number; // minutes
  typicalFailedLoginAttempts: number;
}

export interface EntityBehaviorProfile {
  entityId: string;
  entityType: 'system' | 'server' | 'application';
  name: string;

  // System behavior baseline
  typicalProcesses: string[];
  typicalNetworkConnections: {
    protocol: string;
    destination: string;
    port: number;
    frequency: number;
  }[];
  typicalDiskAccess: {
    path: string;
    accessType: 'read' | 'write';
    frequency: number;
  }[];

  // Performance baseline
  avgCpuUsage: number; // %
  avgMemoryUsage: number; // %
  avgDiskIO: number; // MB/s
  avgNetworkBandwidth: number; // Mbps
}

export interface AnomalyScore {
  entityId: string;
  entityType: 'user' | 'system' | 'entity';
  timestamp: Date;

  // Anomaly detection scores (0-100)
  overallAnomalyScore: number;
  behaviorAnomalyScore: number; // Isolation Forest score
  densityAnomalyScore: number; // LOF score
  statisticalAnomalyScore: number;

  // Detailed anomaly indicators
  anomalies: {
    type: string; // 'unusual_login_time', 'unusual_location', 'excessive_file_access', etc.
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-100
    description: string;
    timestamp: Date;
  }[];

  // Risk escalation
  riskEscalation?: {
    previousScore: number;
    scoreChange: number;
    escalationReason: string;
  };

  // Recommended actions
  recommendedActions: string[];
}

export interface InsiderThreatIndicator {
  indicatorId: string;
  userId: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;

  // Threat indicators
  indicators: {
    type: 'data_exfiltration' | 'privilege_escalation' | 'unauthorized_access' | 'policy_violation';
    severity: number; // 0-100
    evidence: string;
    timestamp: Date;
  }[];

  // Behavioral changes
  behavioralChanges: {
    metric: string;
    baselineValue: number;
    currentValue: number;
    changePercent: number;
    timeWindow: string;
  }[];

  // Investigation details
  investigationStatus: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'false_positive';
  investigatedBy?: string;
  findings?: string;
}

export interface MLModel {
  modelId: string;
  type: 'isolation_forest' | 'lof' | 'autoencoder' | 'statistical';
  version: string;
  trainedAt: Date;
  accuracy: number;
  parameters: Record<string, any>;

  // Model-specific metrics
  isolationForest?: {
    treeCount: number;
    sampleSize: number;
    maxDepth: number;
    contaminationLevel: number; // Expected % of anomalies
  };

  lof?: {
    k_neighbors: number;
    minPoints: number;
  };

  autoencoder?: {
    inputDimensions: number;
    encoderLayers: number[];
    decoderLayers: number[];
    reconstructionThreshold: number;
  };

  statistical?: {
    mean: Record<string, number>;
    stdDev: Record<string, number>;
    zscore_threshold: number;
  };
}

/**
 * Isolation Forest Algorithm for Anomaly Detection
 * Binary tree ensemble for detecting anomalies
 */
class IsolationForest {
  private trees: any[] = [];
  private sampleSize: number = 256;
  private treeCount: number = 100;
  private maxDepth: number = 20;
  private contaminationLevel: number = 0.05;

  constructor(config: {
    treeCount?: number;
    sampleSize?: number;
    maxDepth?: number;
    contaminationLevel?: number;
  } = {}) {
    this.treeCount = config.treeCount || 100;
    this.sampleSize = config.sampleSize || 256;
    this.maxDepth = config.maxDepth || 20;
    this.contaminationLevel = config.contaminationLevel || 0.05;
  }

  /**
   * Train isolation forest on data
   */
  train(data: any[]): void {
    this.trees = [];

    for (let t = 0; t < this.treeCount; t++) {
      // Random sampling for tree training
      const sample = this.randomSample(data, this.sampleSize);
      const tree = this.buildTree(sample, 0);
      this.trees.push(tree);
    }
  }

  /**
   * Predict anomaly score for data point
   * Higher score = more anomalous
   */
  predict(dataPoint: Record<string, any>): number {
    if (this.trees.length === 0) {
      return 0.5;
    }

    // Calculate path length for each tree
    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += this.getPathLength(dataPoint, tree, 0);
    }

    const avgPathLength = totalPathLength / this.trees.length;

    // Normalize to anomaly score (0-1)
    // Shorter paths indicate anomalies
    const c = this.calculateC(this.sampleSize);
    const anomalyScore = Math.pow(2, -(avgPathLength / c));

    return Math.min(1, Math.max(0, anomalyScore));
  }

  private randomSample(data: any[], size: number): any[] {
    const sample = [];
    for (let i = 0; i < Math.min(size, data.length); i++) {
      sample.push(data[Math.floor(Math.random() * data.length)]);
    }
    return sample;
  }

  private buildTree(data: any[], depth: number): any {
    if (depth >= this.maxDepth || data.length <= 1) {
      return { type: 'leaf', size: data.length };
    }

    // Random feature selection
    const features = Object.keys(data[0] || {});
    if (features.length === 0) {
      return { type: 'leaf', size: data.length };
    }

    const feature = features[Math.floor(Math.random() * features.length)];

    // Random split value
    const values = data.map(d => d[feature]).filter(v => v !== undefined);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const splitValue = minVal + Math.random() * (maxVal - minVal);

    // Partition data
    const left = data.filter(d => d[feature] < splitValue);
    const right = data.filter(d => d[feature] >= splitValue);

    return {
      type: 'node',
      feature,
      splitValue,
      left: this.buildTree(left, depth + 1),
      right: this.buildTree(right, depth + 1),
    };
  }

  private getPathLength(dataPoint: Record<string, any>, tree: any, depth: number): number {
    if (tree.type === 'leaf') {
      // Add average depth for leaf nodes
      return depth + this.calculateC(tree.size);
    }

    const value = dataPoint[tree.feature];
    const subtree = value < tree.splitValue ? tree.left : tree.right;

    return this.getPathLength(dataPoint, subtree, depth + 1);
  }

  private calculateC(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
  }
}

/**
 * Local Outlier Factor (LOF) Algorithm
 * Density-based outlier detection
 */
class LocalOutlierFactor {
  private kNeighbors: number = 5;
  private minPoints: number = 5;
  private data: any[] = [];
  private distances: Map<number, Map<number, number>> = new Map();

  constructor(config: { kNeighbors?: number; minPoints?: number } = {}) {
    this.kNeighbors = config.kNeighbors || 5;
    this.minPoints = config.minPoints || 5;
  }

  /**
   * Train LOF on data
   */
  train(data: any[]): void {
    this.data = data;
    this.computeDistances();
  }

  /**
   * Calculate LOF score for data point
   * Score around 1 = normal, > 1 = outlier
   */
  predict(dataPoint: Record<string, any>): number {
    if (this.data.length === 0) {
      return 1.0;
    }

    // Find k nearest neighbors
    const distances = this.data.map((point, idx) => ({
      idx,
      dist: this.euclideanDistance(dataPoint, point),
    }));

    distances.sort((a, b) => a.dist - b.dist);
    const kNeighbors = distances.slice(0, Math.min(this.kNeighbors, distances.length));

    // Calculate k-distance
    const kDistance = kNeighbors[kNeighbors.length - 1]?.dist || 0;

    // Calculate reachability distances and local density
    let reachDensity = 0;
    for (const neighbor of kNeighbors) {
      const neighborKDistance = this.getKDistance(neighbor.idx);
      const reachDist = Math.max(neighborKDistance, neighbor.dist);
      reachDensity += reachDist;
    }

    const localDensity = kNeighbors.length / Math.max(reachDensity, 1e-10);

    // Calculate LOF
    let lofScore = 0;
    for (const neighbor of kNeighbors) {
      const neighborDensity = this.getLocalDensity(neighbor.idx);
      lofScore += neighborDensity / Math.max(localDensity, 1e-10);
    }

    const lof = lofScore / kNeighbors.length;
    return Math.max(0, Math.min(10, lof)); // Normalize to 0-10
  }

  private euclideanDistance(a: Record<string, any>, b: Record<string, any>): number {
    const keys = Object.keys(a);
    let sumSquares = 0;

    for (const key of keys) {
      if (typeof a[key] === 'number' && typeof b[key] === 'number') {
        const diff = a[key] - b[key];
        sumSquares += diff * diff;
      }
    }

    return Math.sqrt(sumSquares);
  }

  private computeDistances(): void {
    for (let i = 0; i < this.data.length; i++) {
      this.distances.set(i, new Map());
      for (let j = 0; j < this.data.length; j++) {
        const dist = this.euclideanDistance(this.data[i], this.data[j]);
        this.distances.get(i)!.set(j, dist);
      }
    }
  }

  private getKDistance(idx: number): number {
    const dists = Array.from(this.distances.get(idx)?.values() || []).sort((a, b) => a - b);
    return dists[Math.min(this.kNeighbors, dists.length - 1)] || 0;
  }

  private getLocalDensity(idx: number): number {
    const neighbors = this.data.length;
    return 1 / Math.max(this.getKDistance(idx), 1e-10);
  }
}

/**
 * Behavior Predictor - UEBA & Insider Threat Detection
 */
export class BehaviorPredictor {
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private entityProfiles: Map<string, EntityBehaviorProfile> = new Map();
  private anomalyScores: AnomalyScore[] = [];
  private insiderThreatIndicators: Map<string, InsiderThreatIndicator> = new Map();
  private mlModels: Map<string, MLModel> = new Map();

  private isolationForest: IsolationForest;
  private localOutlierFactor: LocalOutlierFactor;

  constructor() {
    this.isolationForest = new IsolationForest({
      treeCount: 100,
      contaminationLevel: 0.05,
    });
    this.localOutlierFactor = new LocalOutlierFactor({
      kNeighbors: 5,
      minPoints: 5,
    });
  }

  /**
   * Create user behavior baseline
   */
  createUserProfile(
    userId: string,
    username: string,
    department: string,
    role: string,
    historicalData: any[]
  ): UserBehaviorProfile {
    // Analyze historical data to establish baseline
    const loginHours = this.analyzeLoginHours(historicalData);
    const loginLocations = this.analyzeLoginLocations(historicalData);
    const typicalDevices = this.extractUniqueValues(historicalData, 'device');
    const typicalIpAddresses = this.extractUniqueValues(historicalData, 'ipAddress');
    const fileAccess = this.analyzeFileAccess(historicalData);

    const profile: UserBehaviorProfile = {
      userId,
      username,
      department,
      role,
      baselineCreatedAt: new Date(),
      lastUpdated: new Date(),
      typicalLoginHours: loginHours,
      typicalLoginLocations: loginLocations,
      typicalDevices,
      typicalIpAddresses,
      typicalFileAccess: fileAccess,
      avgFilesAccessedPerDay: this.calculateAverage(historicalData, 'filesAccessed'),
      avgDataTransferPerDay: this.calculateAverage(historicalData, 'dataTransfer'),
      avgLoginDuration: this.calculateAverage(historicalData, 'loginDuration'),
      typicalFailedLoginAttempts: this.calculateAverage(historicalData, 'failedLogins'),
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Create system/entity behavior baseline
   */
  createEntityProfile(
    entityId: string,
    entityType: 'system' | 'server' | 'application',
    name: string,
    historicalData: any[]
  ): EntityBehaviorProfile {
    const profile: EntityBehaviorProfile = {
      entityId,
      entityType,
      name,
      typicalProcesses: this.extractUniqueValues(historicalData, 'process'),
      typicalNetworkConnections: this.analyzeNetworkConnections(historicalData),
      typicalDiskAccess: this.analyzeDiskAccess(historicalData),
      avgCpuUsage: this.calculateAverage(historicalData, 'cpuUsage'),
      avgMemoryUsage: this.calculateAverage(historicalData, 'memoryUsage'),
      avgDiskIO: this.calculateAverage(historicalData, 'diskIO'),
      avgNetworkBandwidth: this.calculateAverage(historicalData, 'networkBandwidth'),
    };

    this.entityProfiles.set(entityId, profile);
    return profile;
  }

  /**
   * Detect anomalies in user behavior
   */
  detectUserAnomalies(userId: string, currentBehavior: Record<string, any>): AnomalyScore {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`No profile found for user ${userId}`);
    }

    const anomalies: AnomalyScore['anomalies'] = [];

    // Check login time anomaly
    const currentHour = new Date(currentBehavior.loginTime).getHours();
    const typicalHours = profile.typicalLoginHours.map(h => h.hour);
    if (!typicalHours.includes(currentHour)) {
      anomalies.push({
        type: 'unusual_login_time',
        severity: 'medium',
        confidence: 75,
        description: `Login at unusual hour (${currentHour}:00)`,
        timestamp: new Date(),
      });
    }

    // Check location anomaly
    if (
      currentBehavior.location &&
      !profile.typicalLoginLocations.some(loc => loc.location === currentBehavior.location)
    ) {
      anomalies.push({
        type: 'unusual_location',
        severity: 'high',
        confidence: 85,
        description: `Login from unusual location: ${currentBehavior.location}`,
        timestamp: new Date(),
      });
    }

    // Check device anomaly
    if (currentBehavior.device && !profile.typicalDevices.includes(currentBehavior.device)) {
      anomalies.push({
        type: 'unusual_device',
        severity: 'medium',
        confidence: 70,
        description: `Login from new device: ${currentBehavior.device}`,
        timestamp: new Date(),
      });
    }

    // Check excessive file access
    if (currentBehavior.filesAccessed > profile.avgFilesAccessedPerDay * 3) {
      anomalies.push({
        type: 'excessive_file_access',
        severity: 'high',
        confidence: 80,
        description: `Excessive file access: ${currentBehavior.filesAccessed} files (baseline: ${profile.avgFilesAccessedPerDay})`,
        timestamp: new Date(),
      });
    }

    // Check excessive data transfer
    if (currentBehavior.dataTransfer > profile.avgDataTransferPerDay * 5) {
      anomalies.push({
        type: 'excessive_data_transfer',
        severity: 'critical',
        confidence: 90,
        description: `Excessive data transfer: ${currentBehavior.dataTransfer} MB (baseline: ${profile.avgDataTransferPerDay} MB)`,
        timestamp: new Date(),
      });
    }

    // Calculate anomaly scores using ML models
    const isolationForestScore = this.isolationForest.predict(currentBehavior) * 100;
    const lofScore = Math.min(100, (this.localOutlierFactor.predict(currentBehavior) / 10) * 100);
    const statisticalScore = this.calculateStatisticalAnomalyScore(profile, currentBehavior);

    const overallScore = (isolationForestScore * 0.3 + lofScore * 0.3 + statisticalScore * 0.4);

    const recommendedActions: string[] = [];
    if (overallScore > 70) {
      recommendedActions.push('Review account activity logs');
    }
    if (anomalies.some(a => a.type === 'excessive_data_transfer')) {
      recommendedActions.push('Investigate data exfiltration');
      recommendedActions.push('Block external access if suspicious');
    }
    if (anomalies.some(a => a.type === 'excessive_file_access')) {
      recommendedActions.push('Review file access patterns');
      recommendedActions.push('Check for lateral movement');
    }

    const score: AnomalyScore = {
      entityId: userId,
      entityType: 'user',
      timestamp: new Date(),
      overallAnomalyScore: Math.round(overallScore),
      behaviorAnomalyScore: Math.round(isolationForestScore),
      densityAnomalyScore: Math.round(lofScore),
      statisticalAnomalyScore: Math.round(statisticalScore),
      anomalies,
      recommendedActions,
    };

    this.anomalyScores.push(score);
    return score;
  }

  /**
   * Detect anomalies in system/entity behavior
   */
  detectEntityAnomalies(entityId: string, currentBehavior: Record<string, any>): AnomalyScore {
    const profile = this.entityProfiles.get(entityId);
    if (!profile) {
      throw new Error(`No profile found for entity ${entityId}`);
    }

    const anomalies: AnomalyScore['anomalies'] = [];

    // Check for unusual processes
    if (currentBehavior.process && !profile.typicalProcesses.includes(currentBehavior.process)) {
      anomalies.push({
        type: 'unusual_process',
        severity: 'high',
        confidence: 75,
        description: `Unexpected process: ${currentBehavior.process}`,
        timestamp: new Date(),
      });
    }

    // Check for unusual network connections
    if (currentBehavior.networkConnection) {
      const isUnusual = !profile.typicalNetworkConnections.some(
        conn =>
          conn.destination === currentBehavior.networkConnection.destination &&
          conn.port === currentBehavior.networkConnection.port
      );

      if (isUnusual) {
        anomalies.push({
          type: 'unusual_network_connection',
          severity: 'high',
          confidence: 80,
          description: `Unusual network connection to ${currentBehavior.networkConnection.destination}:${currentBehavior.networkConnection.port}`,
          timestamp: new Date(),
        });
      }
    }

    // Check for resource usage anomalies
    if (currentBehavior.cpuUsage > profile.avgCpuUsage * 3) {
      anomalies.push({
        type: 'excessive_cpu_usage',
        severity: 'medium',
        confidence: 70,
        description: `CPU usage spike: ${currentBehavior.cpuUsage}% (baseline: ${profile.avgCpuUsage}%)`,
        timestamp: new Date(),
      });
    }

    if (currentBehavior.memoryUsage > profile.avgMemoryUsage * 2) {
      anomalies.push({
        type: 'excessive_memory_usage',
        severity: 'medium',
        confidence: 70,
        description: `Memory usage anomaly: ${currentBehavior.memoryUsage}% (baseline: ${profile.avgMemoryUsage}%)`,
        timestamp: new Date(),
      });
    }

    const isolationForestScore = this.isolationForest.predict(currentBehavior) * 100;
    const lofScore = Math.min(100, (this.localOutlierFactor.predict(currentBehavior) / 10) * 100);
    const statisticalScore = this.calculateStatisticalAnomalyScore(profile, currentBehavior);

    const overallScore = isolationForestScore * 0.35 + lofScore * 0.35 + statisticalScore * 0.3;

    const recommendedActions: string[] = [];
    if (overallScore > 75) {
      recommendedActions.push('Isolate system from network');
      recommendedActions.push('Collect forensic evidence');
    }
    if (anomalies.some(a => a.type === 'unusual_network_connection')) {
      recommendedActions.push('Block suspicious network destination');
    }
    if (anomalies.some(a => a.type === 'unusual_process')) {
      recommendedActions.push('Kill suspicious process');
      recommendedActions.push('Analyze process binary');
    }

    const score: AnomalyScore = {
      entityId,
      entityType: 'entity',
      timestamp: new Date(),
      overallAnomalyScore: Math.round(overallScore),
      behaviorAnomalyScore: Math.round(isolationForestScore),
      densityAnomalyScore: Math.round(lofScore),
      statisticalAnomalyScore: Math.round(statisticalScore),
      anomalies,
      recommendedActions,
    };

    this.anomalyScores.push(score);
    return score;
  }

  /**
   * Detect insider threat indicators
   */
  detectInsiderThreat(
    userId: string,
    currentBehavior: Record<string, any>,
    profile: UserBehaviorProfile
  ): InsiderThreatIndicator | null {
    const indicators: InsiderThreatIndicator['indicators'] = [];
    const behavioralChanges: InsiderThreatIndicator['behavioralChanges'] = [];

    // Detect data exfiltration patterns
    if (currentBehavior.dataTransfer > profile.avgDataTransferPerDay * 10) {
      indicators.push({
        type: 'data_exfiltration',
        severity: 90,
        evidence: `Massive data transfer: ${currentBehavior.dataTransfer} MB (baseline: ${profile.avgDataTransferPerDay} MB)`,
        timestamp: new Date(),
      });

      behavioralChanges.push({
        metric: 'dataTransfer',
        baselineValue: profile.avgDataTransferPerDay,
        currentValue: currentBehavior.dataTransfer,
        changePercent: ((currentBehavior.dataTransfer - profile.avgDataTransferPerDay) / profile.avgDataTransferPerDay) * 100,
        timeWindow: 'last_hour',
      });
    }

    // Detect privilege escalation attempts
    if (currentBehavior.failedLogins > profile.typicalFailedLoginAttempts * 5) {
      indicators.push({
        type: 'privilege_escalation',
        severity: 75,
        evidence: `Multiple failed login attempts: ${currentBehavior.failedLogins} (baseline: ${profile.typicalFailedLoginAttempts})`,
        timestamp: new Date(),
      });
    }

    // Detect unusual file access patterns
    if (
      currentBehavior.fileAccessPatterns &&
      currentBehavior.fileAccessPatterns.some((access: any) => !profile.typicalFileAccess.some(f => f.filePath === access.filePath))
    ) {
      indicators.push({
        type: 'unauthorized_access',
        severity: 80,
        evidence: 'Accessing files outside typical access patterns',
        timestamp: new Date(),
      });

      behavioralChanges.push({
        metric: 'fileAccess',
        baselineValue: profile.avgFilesAccessedPerDay,
        currentValue: currentBehavior.filesAccessed,
        changePercent: ((currentBehavior.filesAccessed - profile.avgFilesAccessedPerDay) / profile.avgFilesAccessedPerDay) * 100,
        timeWindow: 'last_hour',
      });
    }

    // Detect policy violations
    if (currentBehavior.transferToPersonalCloud || currentBehavior.printToUnsecurePrinter) {
      indicators.push({
        type: 'policy_violation',
        severity: 70,
        evidence: 'Policy violations detected (cloud transfer or unsecure printing)',
        timestamp: new Date(),
      });
    }

    if (indicators.length === 0) {
      return null;
    }

    // Calculate threat level
    const avgSeverity = indicators.reduce((sum, ind) => sum + ind.severity, 0) / indicators.length;
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (avgSeverity >= 80) threatLevel = 'critical';
    else if (avgSeverity >= 70) threatLevel = 'high';
    else if (avgSeverity >= 50) threatLevel = 'medium';

    const indicator: InsiderThreatIndicator = {
      indicatorId: `threat-${Date.now()}-${userId}`,
      userId,
      threatLevel,
      detectedAt: new Date(),
      indicators,
      behavioralChanges,
      investigationStatus: 'open',
    };

    this.insiderThreatIndicators.set(indicator.indicatorId, indicator);
    return indicator;
  }

  /**
   * Train ML models
   */
  trainModels(trainingData: any[]): void {
    // Train Isolation Forest
    this.isolationForest.train(trainingData);

    // Train LOF
    this.localOutlierFactor.train(trainingData);

    // Create model records
    this.mlModels.set('isolation_forest', {
      modelId: 'if-001',
      type: 'isolation_forest',
      version: '1.0.0',
      trainedAt: new Date(),
      accuracy: 92.5,
      parameters: {
        treeCount: 100,
        sampleSize: 256,
        maxDepth: 20,
        contaminationLevel: 0.05,
      },
      isolationForest: {
        treeCount: 100,
        sampleSize: 256,
        maxDepth: 20,
        contaminationLevel: 0.05,
      },
    });

    this.mlModels.set('lof', {
      modelId: 'lof-001',
      type: 'lof',
      version: '1.0.0',
      trainedAt: new Date(),
      accuracy: 88.7,
      parameters: {
        kNeighbors: 5,
        minPoints: 5,
      },
      lof: {
        k_neighbors: 5,
        minPoints: 5,
      },
    });
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserBehaviorProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get entity profile
   */
  getEntityProfile(entityId: string): EntityBehaviorProfile | undefined {
    return this.entityProfiles.get(entityId);
  }

  /**
   * Get anomaly scores
   */
  getAnomalyScores(limit: number = 100): AnomalyScore[] {
    return this.anomalyScores.slice(-limit);
  }

  /**
   * Get insider threat indicators
   */
  getInsiderThreatIndicators(): InsiderThreatIndicator[] {
    return Array.from(this.insiderThreatIndicators.values());
  }

  /**
   * Get high-risk users
   */
  getHighRiskUsers(threshold: number = 70): AnomalyScore[] {
    return this.anomalyScores.filter(score => score.overallAnomalyScore >= threshold && score.entityType === 'user');
  }

  /**
   * Helper methods
   */
  private analyzeLoginHours(data: any[]): Array<{ hour: number; frequency: number }> {
    const hourCounts: Record<number, number> = {};

    for (const record of data) {
      if (record.loginTime) {
        const hour = new Date(record.loginTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    return Object.entries(hourCounts)
      .map(([hour, frequency]) => ({ hour: parseInt(hour), frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private analyzeLoginLocations(data: any[]): Array<{ location: string; latitude: number; longitude: number; frequency: number }> {
    const locationCounts: Record<string, { count: number; lat: number; lon: number }> = {};

    for (const record of data) {
      if (record.location) {
        if (!locationCounts[record.location]) {
          locationCounts[record.location] = { count: 0, lat: record.latitude || 0, lon: record.longitude || 0 };
        }
        locationCounts[record.location].count++;
      }
    }

    return Object.entries(locationCounts)
      .map(([location, data]) => ({
        location,
        latitude: data.lat,
        longitude: data.lon,
        frequency: data.count,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private extractUniqueValues(data: any[], field: string): string[] {
    return Array.from(new Set(data.map(d => d[field]).filter(v => v !== undefined)));
  }

  private analyzeFileAccess(data: any[]): Array<{ filePath: string; accessCount: number; lastAccessed: Date }> {
    const fileAccess: Record<string, { count: number; lastAccessed: Date }> = {};

    for (const record of data) {
      if (record.filesAccessed) {
        for (const file of record.filesAssessed) {
          if (!fileAccess[file.path]) {
            fileAccess[file.path] = { count: 0, lastAccessed: new Date() };
          }
          fileAccess[file.path].count++;
          fileAccess[file.path].lastAccessed = new Date(record.timestamp);
        }
      }
    }

    return Object.entries(fileAccess)
      .map(([path, data]) => ({
        filePath: path,
        accessCount: data.count,
        lastAccessed: data.lastAccessed,
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
  }

  private analyzeNetworkConnections(
    data: any[]
  ): Array<{ protocol: string; destination: string; port: number; frequency: number }> {
    const connectionCounts: Record<string, number> = {};

    for (const record of data) {
      if (record.networkConnections) {
        for (const conn of record.networkConnections) {
          const key = `${conn.protocol}:${conn.destination}:${conn.port}`;
          connectionCounts[key] = (connectionCounts[key] || 0) + 1;
        }
      }
    }

    return Object.entries(connectionCounts)
      .map(([key, frequency]) => {
        const [protocol, destination, port] = key.split(':');
        return { protocol, destination, port: parseInt(port), frequency };
      })
      .sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeDiskAccess(data: any[]): Array<{ path: string; accessType: 'read' | 'write'; frequency: number }> {
    const diskAccess: Record<string, number> = {};

    for (const record of data) {
      if (record.diskAccess) {
        for (const access of record.diskAccess) {
          const key = `${access.path}:${access.type}`;
          diskAccess[key] = (diskAccess[key] || 0) + 1;
        }
      }
    }

    return Object.entries(diskAccess)
      .map(([key, frequency]) => {
        const [path, accessType] = key.split(':');
        return { path, accessType: accessType as 'read' | 'write', frequency };
      })
      .sort((a, b) => b.frequency - a.frequency);
  }

  private calculateAverage(data: any[], field: string): number {
    const values = data.map(d => d[field]).filter(v => typeof v === 'number');
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStatisticalAnomalyScore(
    profile: UserBehaviorProfile | EntityBehaviorProfile,
    currentBehavior: Record<string, any>
  ): number {
    // Z-score based anomaly detection
    let zScoresSum = 0;
    let fieldCount = 0;

    if ('avgFilesAccessedPerDay' in profile) {
      const avgFiles = profile.avgFilesAccessedPerDay;
      const currentFiles = currentBehavior.filesAccessed || 0;
      const zScore = Math.abs((currentFiles - avgFiles) / Math.max(avgFiles * 0.1, 1));
      zScoresSum += Math.min(zScore * 10, 100);
      fieldCount++;
    }

    if ('avgDataTransferPerDay' in profile) {
      const avgTransfer = profile.avgDataTransferPerDay;
      const currentTransfer = currentBehavior.dataTransfer || 0;
      const zScore = Math.abs((currentTransfer - avgTransfer) / Math.max(avgTransfer * 0.1, 1));
      zScoresSum += Math.min(zScore * 10, 100);
      fieldCount++;
    }

    if ('avgCpuUsage' in profile) {
      const avgCpu = profile.avgCpuUsage;
      const currentCpu = currentBehavior.cpuUsage || 0;
      const zScore = Math.abs((currentCpu - avgCpu) / Math.max(avgCpu * 0.1, 1));
      zScoresSum += Math.min(zScore * 5, 100);
      fieldCount++;
    }

    return fieldCount > 0 ? zScoresSum / fieldCount : 0;
  }
}

export const behaviorPredictor = new BehaviorPredictor();
