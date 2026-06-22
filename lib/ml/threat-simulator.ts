/**
 * BlockStop Phase 29.5 - Threat Simulator & Purple Team
 * Generate synthetic threats and test defense capabilities
 * Production-ready implementation
 */

import { EventEmitter } from 'events';

export type ThreatScenarioType =
  | 'ransomware-attack'
  | 'phishing-campaign'
  | 'data-exfiltration'
  | 'lateral-movement'
  | 'privilege-escalation'
  | 'ddos-attack'
  | 'supply-chain'
  | 'insider-threat'
  | 'zero-day-exploit'
  | 'apt-simulation';

export type ExerciseStatus = 'planned' | 'in-progress' | 'completed' | 'failed' | 'paused';
export type SimulationSpeed = 'slow' | 'normal' | 'fast' | 'hyperfast';

export interface SimulatedThreat {
  threatId: string;
  scenarioType: ThreatScenarioType;
  createdAt: Date;
  startTime: Date;
  endTime?: Date;
  status: ExerciseStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  stages: AttackStage[];
  currentStageIndex: number;
  targetedAssets: string[];
  detectionChain: DetectionEvent[];
  responseChain: ResponseAction[];
  metrics: SimulationMetrics;
  speed: SimulationSpeed;
  paused: boolean;
}

export interface AttackStage {
  stageId: string;
  stageNumber: number;
  name: string;
  duration: number; // milliseconds
  techniques: ATTACKTechnique[];
  objectives: string[];
  isCompleted: boolean;
  startTime?: Date;
  endTime?: Date;
  detectionOpportunities: DetectionOpportunity[];
}

export interface ATTACKTechnique {
  techniqueId: string;
  tacticName: string; // MITRE ATT&CK tactic
  technique: string; // MITRE ATT&CK technique
  description: string;
  duration: number;
  successRate: number; // 0-100
  detectable: boolean;
  indicators: string[];
}

export interface DetectionOpportunity {
  opportunityId: string;
  stage: number;
  technique: string;
  detectionMethod: string;
  timeWindow: { start: number; end: number }; // Relative to stage start
  severity: 'low' | 'medium' | 'high' | 'critical';
  baselineEvent: BaselineEvent;
}

export interface BaselineEvent {
  eventType: string;
  eventDetails: Record<string, any>;
  expectedValues: Record<string, any>;
}

export interface DetectionEvent {
  eventId: string;
  timestamp: Date;
  stage: number;
  technique: string;
  eventType: string;
  severity: string;
  source: string; // Detection tool/sensor
  rawData: Record<string, any>;
  isAccurate: boolean;
  detectionDelay: number; // milliseconds from actual occurrence
}

export interface ResponseAction {
  actionId: string;
  timestamp: Date;
  stage: number;
  actionType: 'alert' | 'block' | 'isolate' | 'terminate' | 'containment' | 'investigation';
  target: string;
  severity: string;
  effectiveness: number; // 0-100, how much it slowed attacker
  timeToAction: number; // milliseconds from detection
  performedBy: string; // User/system that took action
  result: 'effective' | 'partial' | 'ineffective' | 'counterproductive';
}

export interface PurpleTeamExercise {
  exerciseId: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
  status: ExerciseStatus;
  threatScenarios: SimulatedThreat[];
  participants: ExerciseParticipant[];
  objectives: ExerciseObjective[];
  scope: ExerciseScope;
  rules: ExerciseRules;
  metrics: ExerciseMetrics;
  findings: ExerciseFinding[];
  recommendations: string[];
}

export interface ExerciseParticipant {
  participantId: string;
  name: string;
  role: 'defender' | 'attacker' | 'observer' | 'controller';
  organization?: string;
  department?: string;
  startTime: Date;
  endTime?: Date;
  actions: number;
  effectiveness: number; // 0-100
}

export interface ExerciseObjective {
  objectiveId: string;
  description: string;
  type: 'detection' | 'response' | 'containment' | 'recovery' | 'learning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  achieved: boolean;
  metrics: Record<string, number>;
}

export interface ExerciseScope {
  affectedSystems: string[];
  affectedUsers: number;
  affectedData: string[];
  businessUnitsCovered: string[];
  geographicScope: string[];
  inScope: string[];
  outOfScope: string[];
}

export interface ExerciseRules {
  pauseOnSevere: boolean;
  allowNetworkSegmentation: boolean;
  allowSystemShutdown: boolean;
  allowDataDestruction: boolean;
  escalationRequired: boolean;
  timeLimit?: number; // minutes
  stoppingConditions: string[];
}

export interface SimulationMetrics {
  totalDuration: number; // milliseconds
  stagesCompleted: number;
  detectionAccuracy: number; // 0-100
  falsePositiveRate: number; // 0-100
  responseTime: number; // avg ms to respond
  containmentSuccess: number; // 0-100
  dataCompromised: number; // bytes
  systemsCompromised: number;
  assetsRecovered: number;
  timeToDetection: number;
  timeToContainment: number;
  timeToRecovery: number;
}

export interface ExerciseMetrics {
  totalThreats: number;
  threatsDetected: number;
  detectionRate: number; // %
  falsePositiveRate: number; // %
  averageDetectionTime: number; // ms
  averageResponseTime: number; // ms
  adversarySuccessRate: number; // %
  defenseEffectiveness: number; // 0-100
  vulnerabilitiesDiscovered: number;
  lessonsLearned: number;
}

export interface ExerciseFinding {
  findingId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'process' | 'technical' | 'procedural' | 'training';
  relatedStage?: number;
  evidence: string[];
  recommendation: string;
  responsible: string[];
  targetDate?: Date;
  status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
}

export interface DefenseMetrics {
  overallScore: number; // 0-100
  detectionCapability: number;
  responseCapability: number;
  containmentCapability: number;
  recoveryCapability: number;
  awarenessLevel: number;
  toolingGaps: string[];
  processGaps: string[];
  trainingNeeds: string[];
}

export class ThreatSimulator extends EventEmitter {
  private threats: Map<string, SimulatedThreat> = new Map();
  private exercises: Map<string, PurpleTeamExercise> = new Map();
  private attackStages: Map<string, AttackStage[]> = new Map();
  private threatLibrary: Map<ThreatScenarioType, SimulatedThreat> = new Map();

  constructor() {
    super();
    this.initializeThreatLibrary();
  }

  private initializeThreatLibrary(): void {
    // Pre-defined threat scenarios
    const scenarios: Record<ThreatScenarioType, Partial<SimulatedThreat>> = {
      'ransomware-attack': {
        scenarioType: 'ransomware-attack',
        severity: 'critical',
        description: 'Ransomware deployment targeting file systems and backups'
      },
      'phishing-campaign': {
        scenarioType: 'phishing-campaign',
        severity: 'high',
        description: 'Targeted phishing emails with malware attachments'
      },
      'data-exfiltration': {
        scenarioType: 'data-exfiltration',
        severity: 'critical',
        description: 'Large-scale data theft and exfiltration to external server'
      },
      'lateral-movement': {
        scenarioType: 'lateral-movement',
        severity: 'high',
        description: 'Attacker moving through network to reach critical systems'
      },
      'privilege-escalation': {
        scenarioType: 'privilege-escalation',
        severity: 'high',
        description: 'Elevation of privileges to gain admin access'
      },
      'ddos-attack': {
        scenarioType: 'ddos-attack',
        severity: 'high',
        description: 'Distributed denial of service attack on network infrastructure'
      },
      'supply-chain': {
        scenarioType: 'supply-chain',
        severity: 'critical',
        description: 'Compromised third-party software or service'
      },
      'insider-threat': {
        scenarioType: 'insider-threat',
        severity: 'high',
        description: 'Malicious insider stealing sensitive information'
      },
      'zero-day-exploit': {
        scenarioType: 'zero-day-exploit',
        severity: 'critical',
        description: 'Exploitation of unpatched zero-day vulnerability'
      },
      'apt-simulation': {
        scenarioType: 'apt-simulation',
        severity: 'critical',
        description: 'Advanced persistent threat multi-stage attack simulation'
      }
    };

    for (const [type, scenario] of Object.entries(scenarios)) {
      const threat: SimulatedThreat = {
        threatId: `threat-template-${type}`,
        createdAt: new Date(),
        startTime: new Date(),
        status: 'planned',
        stages: this.generateAttackStages(type as ThreatScenarioType),
        currentStageIndex: 0,
        targetedAssets: [],
        detectionChain: [],
        responseChain: [],
        metrics: this.createEmptyMetrics(),
        speed: 'normal',
        paused: false,
        ...scenario
      };

      this.threatLibrary.set(type as ThreatScenarioType, threat);
    }
  }

  // Create simulated threat
  createSimulatedThreat(
    scenarioType: ThreatScenarioType,
    organizationId: string,
    speed: SimulationSpeed = 'normal'
  ): SimulatedThreat {
    const template = this.threatLibrary.get(scenarioType);
    if (!template) {
      throw new Error(`Unknown threat scenario type: ${scenarioType}`);
    }

    const threat: SimulatedThreat = {
      threatId: `threat-${Date.now()}-${Math.random()}`,
      scenarioType,
      createdAt: new Date(),
      startTime: new Date(),
      status: 'planned',
      severity: template.severity,
      description: template.description,
      stages: JSON.parse(JSON.stringify(template.stages)), // Deep copy
      currentStageIndex: 0,
      targetedAssets: [],
      detectionChain: [],
      responseChain: [],
      metrics: this.createEmptyMetrics(),
      speed,
      paused: false
    };

    this.threats.set(threat.threatId, threat);
    this.emit('threat-created', { threat, organizationId });

    return threat;
  }

  private generateAttackStages(scenarioType: ThreatScenarioType): AttackStage[] {
    const stages: AttackStage[] = [];

    switch (scenarioType) {
      case 'ransomware-attack':
        stages.push(
          this.createStage(1, 'Initial Access', 60000, [
            { tacticName: 'Initial Access', technique: 'Phishing', description: 'Malicious email delivery' },
            { tacticName: 'Execution', technique: 'Malicious File', description: 'Execute payload' }
          ]),
          this.createStage(2, 'Persistence', 120000, [
            { tacticName: 'Persistence', technique: 'Registry Run Keys', description: 'Establish persistence' }
          ]),
          this.createStage(3, 'Encryption', 180000, [
            { tacticName: 'Impact', technique: 'Data Encrypted', description: 'Encrypt files' }
          ]),
          this.createStage(4, 'Extortion', 240000, [
            { tacticName: 'Impact', technique: 'Extortion', description: 'Demand ransom' }
          ])
        );
        break;

      case 'data-exfiltration':
        stages.push(
          this.createStage(1, 'Reconnaissance', 30000, [
            { tacticName: 'Reconnaissance', technique: 'Network Service Scanning', description: 'Scan network' }
          ]),
          this.createStage(2, 'Lateral Movement', 90000, [
            { tacticName: 'Lateral Movement', technique: 'Remote Services', description: 'Move laterally' }
          ]),
          this.createStage(3, 'Data Collection', 120000, [
            { tacticName: 'Collection', technique: 'Data Staged', description: 'Collect sensitive data' }
          ]),
          this.createStage(4, 'Exfiltration', 180000, [
            { tacticName: 'Exfiltration', technique: 'Exfil Over HTTPS', description: 'Transfer data' }
          ])
        );
        break;

      case 'privilege-escalation':
        stages.push(
          this.createStage(1, 'Initial Access', 30000, [
            { tacticName: 'Initial Access', technique: 'Valid Accounts', description: 'Gain user access' }
          ]),
          this.createStage(2, 'Exploitation', 90000, [
            { tacticName: 'Privilege Escalation', technique: 'CVE Exploitation', description: 'Exploit vulnerability' }
          ]),
          this.createStage(3, 'Admin Access', 120000, [
            { tacticName: 'Privilege Escalation', technique: 'Token Impersonation', description: 'Become admin' }
          ])
        );
        break;

      case 'apt-simulation':
        stages.push(
          this.createStage(1, 'Reconnaissance', 45000, [
            { tacticName: 'Reconnaissance', technique: 'Passive Scanning', description: 'Passive intelligence gathering' }
          ]),
          this.createStage(2, 'Weaponization & Delivery', 60000, [
            { tacticName: 'Initial Access', technique: 'Supply Chain Compromise', description: 'Compromise supply chain' }
          ]),
          this.createStage(3, 'Installation', 120000, [
            { tacticName: 'Persistence', technique: 'Scheduled Task', description: 'Install backdoor' }
          ]),
          this.createStage(4, 'Command & Control', 90000, [
            { tacticName: 'Command and Control', technique: 'HTTPS C2', description: 'Establish C2 channel' }
          ]),
          this.createStage(5, 'Lateral Movement', 180000, [
            { tacticName: 'Lateral Movement', technique: 'Pass the Hash', description: 'Move across network' }
          ]),
          this.createStage(6, 'Actions on Objectives', 240000, [
            { tacticName: 'Impact', technique: 'Data Exfiltration', description: 'Achieve objectives' }
          ])
        );
        break;

      default:
        stages.push(
          this.createStage(1, 'Attack Stage 1', 60000, [
            { tacticName: 'Initial Access', technique: 'Unknown', description: 'First attack stage' }
          ])
        );
    }

    return stages;
  }

  private createStage(
    stageNumber: number,
    name: string,
    duration: number,
    techniques: Partial<ATTACKTechnique>[]
  ): AttackStage {
    return {
      stageId: `stage-${stageNumber}`,
      stageNumber,
      name,
      duration,
      techniques: techniques.map((t, idx) => ({
        techniqueId: `technique-${stageNumber}-${idx}`,
        tacticName: t.tacticName || 'Unknown',
        technique: t.technique || 'Unknown',
        description: t.description || '',
        duration: 0,
        successRate: Math.random() * 30 + 60,
        detectable: Math.random() > 0.3,
        indicators: this.generateIndicators(t.technique || 'Unknown')
      })),
      objectives: [`Complete ${name}`],
      isCompleted: false,
      detectionOpportunities: []
    };
  }

  private generateIndicators(technique: string): string[] {
    const baseIndicators: Record<string, string[]> = {
      'Phishing': ['Suspicious email sender', 'Malicious attachment', 'URL redirect'],
      'Process Injection': ['Unusual process creation', 'Memory write detected', 'API call hook'],
      'Registry Run Keys': ['Registry modification', 'Startup key change', 'HKLM persistence'],
      'Data Encrypted': ['File extension change', 'Encryption activity', 'File access pattern'],
      'Lateral Movement': ['Credential access', 'Network service probe', 'Administrative share access'],
      'Exfiltration': ['Large data transfer', 'Unexpected egress traffic', 'Cloud upload activity'],
      'Default': ['Suspicious process', 'Network anomaly', 'System modification']
    };

    return baseIndicators[technique] || baseIndicators['Default'];
  }

  // Execute threat simulation
  executeThreat(threatId: string, speed: SimulationSpeed = 'normal'): void {
    const threat = this.threats.get(threatId);
    if (!threat) {
      throw new Error(`Threat not found: ${threatId}`);
    }

    threat.status = 'in-progress';
    threat.speed = speed;
    threat.startTime = new Date();

    this.emit('threat-started', { threatId, speed });

    this.simulateAttackProgression(threatId, speed);
  }

  private simulateAttackProgression(threatId: string, speed: SimulationSpeed): void {
    const threat = this.threats.get(threatId);
    if (!threat) return;

    const speedMultiplier = this.getSpeedMultiplier(speed);

    const processNextStage = () => {
      if (threat.currentStageIndex >= threat.stages.length || threat.status === 'failed' || threat.status === 'completed') {
        if (threat.status !== 'failed') {
          threat.status = 'completed';
          threat.endTime = new Date();
          this.emit('threat-completed', { threatId, metrics: threat.metrics });
        }
        return;
      }

      if (threat.paused) {
        setTimeout(processNextStage, 1000);
        return;
      }

      const stage = threat.stages[threat.currentStageIndex];
      stage.startTime = new Date();

      // Emit detections during stage
      this.emitStageDetections(threatId, stage);

      // Process stage completion
      const stageDuration = stage.duration / speedMultiplier;
      setTimeout(() => {
        stage.isCompleted = true;
        stage.endTime = new Date();
        threat.currentStageIndex++;

        this.emit('stage-completed', {
          threatId,
          stage: threat.currentStageIndex,
          stageName: stage.name
        });

        processNextStage();
      }, stageDuration);
    };

    processNextStage();
  }

  private emitStageDetections(threatId: string, stage: AttackStage): void {
    const threat = this.threats.get(threatId);
    if (!threat) return;

    stage.techniques.forEach(technique => {
      if (!technique.detectable) return;

      const detectionDelay = Math.random() * 10000 + 1000;

      setTimeout(() => {
        const detection: DetectionEvent = {
          eventId: `det-${threatId}-${Date.now()}`,
          timestamp: new Date(),
          stage: stage.stageNumber,
          technique: technique.technique,
          eventType: `${technique.technique} Detected`,
          severity: 'high',
          source: 'EDR/SIEM',
          rawData: {
            processName: 'unknown.exe',
            commandLine: 'suspicious command',
            indicators: technique.indicators
          },
          isAccurate: Math.random() > 0.1,
          detectionDelay
        };

        threat.detectionChain.push(detection);
        this.emit('detection-event', { threatId, detection });

        // Simulate response
        setTimeout(() => {
          const response: ResponseAction = {
            actionId: `resp-${threatId}-${Date.now()}`,
            timestamp: new Date(),
            stage: stage.stageNumber,
            actionType: 'alert',
            target: 'unknown.exe',
            severity: 'high',
            effectiveness: Math.random() * 40 + 20,
            timeToAction: Math.random() * 5000 + 1000,
            performedBy: 'SOC Team',
            result: Math.random() > 0.4 ? 'effective' : 'partial'
          };

          threat.responseChain.push(response);
          this.emit('response-action', { threatId, response });

          // Update containment if response was effective
          if (response.result === 'effective') {
            threat.metrics.containmentSuccess += 10;
          }
        }, Math.random() * 3000 + 500);
      }, detectionDelay);
    });
  }

  private getSpeedMultiplier(speed: SimulationSpeed): number {
    switch (speed) {
      case 'slow': return 0.1;
      case 'normal': return 1;
      case 'fast': return 10;
      case 'hyperfast': return 100;
      default: return 1;
    }
  }

  // Purple Team Exercise Management
  createExercise(
    organizationId: string,
    name: string,
    scenarioTypes: ThreatScenarioType[]
  ): PurpleTeamExercise {
    const exercise: PurpleTeamExercise = {
      exerciseId: `exercise-${Date.now()}-${Math.random()}`,
      organizationId,
      name,
      description: `Purple team exercise with ${scenarioTypes.length} scenarios`,
      createdAt: new Date(),
      startDate: new Date(),
      status: 'planned',
      threatScenarios: [],
      participants: [],
      objectives: [],
      scope: {
        affectedSystems: [],
        affectedUsers: 0,
        affectedData: [],
        businessUnitsCovered: [],
        geographicScope: ['Global'],
        inScope: [],
        outOfScope: ['Production Critical Systems']
      },
      rules: {
        pauseOnSevere: true,
        allowNetworkSegmentation: true,
        allowSystemShutdown: false,
        allowDataDestruction: false,
        escalationRequired: true,
        stoppingConditions: ['Ransomware encryption detected', 'Data exfiltration > 1GB']
      },
      metrics: this.createEmptyExerciseMetrics(),
      findings: [],
      recommendations: []
    };

    // Create threat scenarios
    scenarioTypes.forEach(type => {
      const threat = this.createSimulatedThreat(type, organizationId, 'normal');
      exercise.threatScenarios.push(threat);
    });

    this.exercises.set(exercise.exerciseId, exercise);
    this.emit('exercise-created', exercise);

    return exercise;
  }

  startExercise(exerciseId: string): void {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise) {
      throw new Error(`Exercise not found: ${exerciseId}`);
    }

    exercise.status = 'in-progress';
    exercise.startDate = new Date();

    exercise.threatScenarios.forEach(threat => {
      this.executeThreat(threat.threatId, 'normal');
    });

    this.emit('exercise-started', exerciseId);
  }

  pauseThreat(threatId: string): void {
    const threat = this.threats.get(threatId);
    if (threat) {
      threat.paused = true;
      this.emit('threat-paused', threatId);
    }
  }

  resumeThreat(threatId: string): void {
    const threat = this.threats.get(threatId);
    if (threat) {
      threat.paused = false;
      this.emit('threat-resumed', threatId);
    }
  }

  stopThreat(threatId: string): void {
    const threat = this.threats.get(threatId);
    if (threat) {
      threat.status = 'failed';
      threat.endTime = new Date();
      this.emit('threat-stopped', threatId);
    }
  }

  // Scoring and Evaluation
  evaluateDefenseMetrics(threatId: string): DefenseMetrics {
    const threat = this.threats.get(threatId);
    if (!threat) {
      throw new Error(`Threat not found: ${threatId}`);
    }

    const detectionRate = threat.detectionChain.length / (threat.stages.length * 2);
    const avgResponseTime = threat.responseChain.length > 0
      ? threat.responseChain.reduce((sum, r) => sum + r.timeToAction, 0) / threat.responseChain.length
      : 999999;

    const detectionCapability = Math.min(100, detectionRate * 100);
    const responseCapability = Math.min(100, 100 - (avgResponseTime / 10000) * 100);
    const containmentCapability = threat.metrics.containmentSuccess;

    const overallScore = (detectionCapability + responseCapability + containmentCapability) / 3;

    return {
      overallScore: Math.round(overallScore),
      detectionCapability: Math.round(detectionCapability),
      responseCapability: Math.round(responseCapability),
      containmentCapability: Math.round(containmentCapability),
      recoveryCapability: 60,
      awarenessLevel: 70,
      toolingGaps: ['Advanced EDR', 'Behavioral Analytics'],
      processGaps: ['Incident Response Procedures', 'Threat Hunting Program'],
      trainingNeeds: ['Malware Analysis', 'DFIR Techniques']
    };
  }

  // Query Methods
  getThreat(threatId: string): SimulatedThreat | undefined {
    return this.threats.get(threatId);
  }

  getExercise(exerciseId: string): PurpleTeamExercise | undefined {
    return this.exercises.get(exerciseId);
  }

  getAllThreats(): SimulatedThreat[] {
    return Array.from(this.threats.values());
  }

  getAllExercises(): PurpleTeamExercise[] {
    return Array.from(this.exercises.values());
  }

  // Utility methods
  private createEmptyMetrics(): SimulationMetrics {
    return {
      totalDuration: 0,
      stagesCompleted: 0,
      detectionAccuracy: 0,
      falsePositiveRate: 0,
      responseTime: 0,
      containmentSuccess: 0,
      dataCompromised: 0,
      systemsCompromised: 0,
      assetsRecovered: 0,
      timeToDetection: 0,
      timeToContainment: 0,
      timeToRecovery: 0
    };
  }

  private createEmptyExerciseMetrics(): ExerciseMetrics {
    return {
      totalThreats: 0,
      threatsDetected: 0,
      detectionRate: 0,
      falsePositiveRate: 0,
      averageDetectionTime: 0,
      averageResponseTime: 0,
      adversarySuccessRate: 0,
      defenseEffectiveness: 0,
      vulnerabilitiesDiscovered: 0,
      lessonsLearned: 0
    };
  }
}

export default ThreatSimulator;
