/**
 * Purple Team Exercise Engine - Red Team Simulations
 * Security testing and attack simulation framework
 */

export interface PurpleTeamExercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  attackChain: AttackStep[];
  expectedDetections: DetectionExpectation[];
  prerequisites: string[];
  estimatedDuration: number; // minutes
  objectives: string[];
  restrictions: string[];
  createdAt: Date;
  lastModified: Date;
}

export interface AttackStep {
  id: string;
  sequence: number;
  name: string;
  description: string;
  technique: string;
  mitreTactic: string;
  mitreId: string;
  subtechniques: string[];
  commands: AttackCommand[];
  indicators: string[];
  detection: DetectionMethod[];
  estimatedDuration: number; // seconds
  rollback?: AttackStep;
}

export interface AttackCommand {
  tool: string;
  command: string;
  platform: 'windows' | 'linux' | 'macos' | 'network';
  args: Record<string, string>;
  expectedOutput: string;
  detectionSignals: string[];
}

export interface DetectionMethod {
  source: 'endpoint' | 'network' | 'cloud' | 'application';
  rule: string;
  signature: string;
  confidence: number;
  expectedTriggerTime: number; // seconds after attack
}

export interface DetectionExpectation {
  technique: string;
  expectedDetectionTime: number; // seconds
  sources: string[];
  confidence: number;
  alternativeDetections: string[];
}

export interface ExerciseExecution {
  id: string;
  exerciseId: string;
  startTime: Date;
  endTime?: Date;
  status: 'planning' | 'running' | 'completed' | 'failed' | 'aborted';
  teamMembers: string[];
  executedSteps: ExecutedStep[];
  detectionResults: DetectionResult[];
  overallScore: number;
  metrics: ExerciseMetrics;
  report: ExerciseReport;
  logs: ExerciseLog[];
}

export interface ExecutedStep {
  stepId: string;
  executionOrder: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  commandsExecuted: number;
  detectionTriggered: boolean;
  artifacts: string[];
  notes: string;
}

export interface DetectionResult {
  id: string;
  timestamp: Date;
  technique: string;
  detectionSource: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  falsePositive: boolean;
  responseTime: number; // milliseconds
  artifacts: string[];
  correlations: string[];
}

export interface ExerciseMetrics {
  totalTechniques: number;
  techniquesDetected: number;
  detectionRate: number;
  avgDetectionTime: number;
  falsePositiveRate: number;
  avgResponseTime: number;
  coverageScore: number;
  effectivenessScore: number;
}

export interface ExerciseReport {
  summary: string;
  findings: Finding[];
  gaps: DefenseGap[];
  recommendations: string[];
  metrics: ExerciseMetrics;
  detectionTimeline: TimelineEntry[];
  lessons: LessonLearned[];
  nextSteps: string[];
}

export interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  technique: string;
  detectionStatus: 'detected' | 'not_detected' | 'delayed';
  detectionTime?: number; // seconds
  recommendation: string;
  affectedControls: string[];
}

export interface DefenseGap {
  id: string;
  technique: string;
  tactic: string;
  gapType: 'coverage' | 'detection_time' | 'accuracy' | 'response';
  severity: 'critical' | 'high' | 'medium' | 'low';
  currentState: string;
  requiredState: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface TimelineEntry {
  timestamp: Date;
  event: string;
  source: string;
  severity: number;
}

export interface LessonLearned {
  title: string;
  description: string;
  actionItem: string;
  owner?: string;
  dueDate?: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Purple Team Exercise Engine
 */
export class PurpleTeamEngine {
  private exercises: Map<string, PurpleTeamExercise>;
  private executions: Map<string, ExerciseExecution>;
  private detectionMonitor: DetectionMonitor;
  private exerciseLibrary: PurpleTeamExercise[];

  constructor() {
    this.exercises = new Map();
    this.executions = new Map();
    this.detectionMonitor = new DetectionMonitor();
    this.exerciseLibrary = [];
    this.initializeDefaultExercises();
  }

  /**
   * Initialize default exercises
   */
  private initializeDefaultExercises(): void {
    const aptExercise: PurpleTeamExercise = {
      id: 'ex_apt_001',
      name: 'Advanced Persistent Threat Simulation',
      description: 'Full attack chain simulation including reconnaissance, initial access, persistence, privilege escalation, and exfiltration',
      difficulty: 'expert',
      category: 'apt',
      attackChain: [
        {
          id: 'step_001',
          sequence: 1,
          name: 'Reconnaissance',
          description: 'Gather information about target',
          technique: 'Active Scanning',
          mitreTactic: 'Reconnaissance',
          mitreId: 'TA0043',
          subtechniques: ['T1595.002', 'T1595.003'],
          commands: [
            {
              tool: 'nmap',
              command: 'nmap -sV -sC target.com',
              platform: 'linux',
              args: { target: 'target.com', timeout: '300' },
              expectedOutput: 'Nmap scan report',
              detectionSignals: ['port_scan_detected', 'network_reconnaissance'],
            },
          ],
          indicators: ['DNS queries', 'Network scanning traffic'],
          detection: [
            {
              source: 'network',
              rule: 'Port Scanning Detected',
              signature: 'port_scan_signature',
              confidence: 0.95,
              expectedTriggerTime: 60,
            },
          ],
          estimatedDuration: 300,
        },
        {
          id: 'step_002',
          sequence: 2,
          name: 'Initial Access',
          description: 'Gain initial access via phishing',
          technique: 'Phishing',
          mitreTactic: 'Initial Access',
          mitreId: 'TA0001',
          subtechniques: ['T1566.001', 'T1566.002'],
          commands: [
            {
              tool: 'gophish',
              command: 'phish campaign --target users.txt',
              platform: 'linux',
              args: { template: 'office365_phishing' },
              expectedOutput: 'Campaign started',
              detectionSignals: ['malicious_email', 'phishing_link_clicked'],
            },
          ],
          indicators: ['Suspicious email attachment', 'Credential submission to fake page'],
          detection: [
            {
              source: 'email',
              rule: 'Phishing Email Detected',
              signature: 'phishing_signature',
              confidence: 0.9,
              expectedTriggerTime: 30,
            },
            {
              source: 'endpoint',
              rule: 'Malware Execution',
              signature: 'malware_behavior',
              confidence: 0.85,
              expectedTriggerTime: 120,
            },
          ],
          estimatedDuration: 600,
        },
        {
          id: 'step_003',
          sequence: 3,
          name: 'Execution',
          description: 'Execute malware payload',
          technique: 'User Execution',
          mitreTactic: 'Execution',
          mitreId: 'TA0002',
          subtechniques: ['T1204.002'],
          commands: [
            {
              tool: 'cmd.exe',
              command: 'powershell -NoP -NonI -W Hidden -Exec Bypass IEX',
              platform: 'windows',
              args: { scriptPath: 'beacon.ps1' },
              expectedOutput: 'Beacon initialized',
              detectionSignals: ['powershell_suspicious_behavior', 'process_injection'],
            },
          ],
          indicators: ['PowerShell execution', 'Process injection'],
          detection: [
            {
              source: 'endpoint',
              rule: 'Suspicious PowerShell',
              signature: 'powershell_signature',
              confidence: 0.92,
              expectedTriggerTime: 15,
            },
          ],
          estimatedDuration: 30,
        },
      ],
      expectedDetections: [
        {
          technique: 'Active Scanning',
          expectedDetectionTime: 60,
          sources: ['network'],
          confidence: 0.95,
          alternativeDetections: ['IDS alert', 'Network behavior analysis'],
        },
        {
          technique: 'Phishing',
          expectedDetectionTime: 120,
          sources: ['email', 'endpoint'],
          confidence: 0.85,
          alternativeDetections: ['Email gateway detection', 'User reporting'],
        },
      ],
      prerequisites: ['Test environment setup', 'Team training completed'],
      estimatedDuration: 240,
      objectives: [
        'Test detection capabilities for APT techniques',
        'Identify coverage gaps',
        'Validate response procedures',
        'Train SOC team',
      ],
      restrictions: ['No impact on production systems', 'Limited to test environment'],
      createdAt: new Date(),
      lastModified: new Date(),
    };

    this.exercises.set(aptExercise.id, aptExercise);
    this.exerciseLibrary.push(aptExercise);
  }

  /**
   * Get exercise by ID
   */
  getExercise(exerciseId: string): PurpleTeamExercise | null {
    return this.exercises.get(exerciseId) || null;
  }

  /**
   * Start exercise execution
   */
  startExecution(exerciseId: string, teamMembers: string[]): ExerciseExecution {
    const exercise = this.getExercise(exerciseId);
    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    const execution: ExerciseExecution = {
      id: `exec_${Date.now()}`,
      exerciseId,
      startTime: new Date(),
      status: 'running',
      teamMembers,
      executedSteps: exercise.attackChain.map((step) => ({
        stepId: step.id,
        executionOrder: step.sequence,
        status: 'pending',
        startTime: new Date(),
        commandsExecuted: 0,
        detectionTriggered: false,
        artifacts: [],
        notes: '',
      })),
      detectionResults: [],
      overallScore: 0,
      metrics: {
        totalTechniques: exercise.attackChain.length,
        techniquesDetected: 0,
        detectionRate: 0,
        avgDetectionTime: 0,
        falsePositiveRate: 0,
        avgResponseTime: 0,
        coverageScore: 0,
        effectivenessScore: 0,
      },
      report: {
        summary: '',
        findings: [],
        gaps: [],
        recommendations: [],
        metrics: {
          totalTechniques: 0,
          techniquesDetected: 0,
          detectionRate: 0,
          avgDetectionTime: 0,
          falsePositiveRate: 0,
          avgResponseTime: 0,
          coverageScore: 0,
          effectivenessScore: 0,
        },
        detectionTimeline: [],
        lessons: [],
        nextSteps: [],
      },
      logs: [],
    };

    this.executions.set(execution.id, execution);
    this.detectionMonitor.startMonitoring(exerciseId, execution.id);

    return execution;
  }

  /**
   * Execute attack step
   */
  async executeStep(executionId: string, stepId: string): Promise<ExecutedStep> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const exercise = this.getExercise(execution.exerciseId);
    if (!exercise) {
      throw new Error(`Exercise not found`);
    }

    const step = exercise.attackChain.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    const executedStep = execution.executedSteps.find((s) => s.stepId === stepId);
    if (!executedStep) {
      throw new Error(`Executed step not found`);
    }

    executedStep.status = 'executing';
    executedStep.startTime = new Date();

    try {
      // Execute commands
      for (const command of step.commands) {
        await this.executeCommand(command, execution, executedStep);
        executedStep.commandsExecuted++;
      }

      // Monitor for detections
      const detections = await this.detectionMonitor.checkDetections(
        step.id,
        step.detection
      );

      execution.detectionResults.push(...detections);

      if (detections.length > 0) {
        executedStep.detectionTriggered = true;
        execution.metrics.techniquesDetected++;
      }

      executedStep.status = 'completed';
    } catch (error) {
      executedStep.status = 'failed';
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Step execution failed: ${error}`,
        stepId,
        context: {},
      });
    }

    executedStep.endTime = new Date();
    return executedStep;
  }

  /**
   * Execute command
   */
  private async executeCommand(
    command: AttackCommand,
    execution: ExerciseExecution,
    executedStep: ExecutedStep
  ): Promise<void> {
    // In production, this would execute actual commands in test environment
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Executing: ${command.command}`,
      stepId: executedStep.stepId,
      context: { tool: command.tool, platform: command.platform },
    });
  }

  /**
   * Complete exercise execution
   */
  completeExecution(executionId: string): ExerciseReport {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = 'completed';
    execution.endTime = new Date();

    // Calculate metrics
    execution.metrics.detectionRate =
      execution.metrics.techniquesDetected / execution.metrics.totalTechniques;
    execution.metrics.avgDetectionTime =
      execution.detectionResults.length > 0
        ? execution.detectionResults.reduce((sum, d) => sum + d.responseTime, 0) /
          execution.detectionResults.length
        : 0;

    execution.metrics.coverageScore =
      execution.metrics.detectionRate * 100;
    execution.metrics.effectivenessScore =
      (execution.metrics.coverageScore * 0.7 +
        (1 - execution.metrics.falsePositiveRate) * 0.3) *
      100;

    // Generate report
    execution.report = this.generateReport(execution);
    execution.overallScore = execution.metrics.effectivenessScore;

    return execution.report;
  }

  /**
   * Generate exercise report
   */
  private generateReport(execution: ExerciseExecution): ExerciseReport {
    const findings: Finding[] = [];
    const gaps: DefenseGap[] = [];

    // Analyze detection results
    execution.detectionResults.forEach((result) => {
      if (result.detectionTriggered) {
        findings.push({
          id: `f_${Date.now()}`,
          title: `${result.technique} Detected`,
          severity: result.severity,
          description: `Detection rule: ${result.rule}`,
          technique: result.technique,
          detectionStatus: 'detected',
          detectionTime: result.responseTime,
          recommendation: 'Verify detection accuracy and tune rules as needed',
          affectedControls: [result.detectionSource],
        });
      }
    });

    // Identify gaps
    const exercise = this.getExercise(execution.exerciseId);
    if (exercise) {
      exercise.attackChain.forEach((step) => {
        const stepExecution = execution.executedSteps.find((s) => s.stepId === step.id);
        if (stepExecution && !stepExecution.detectionTriggered) {
          gaps.push({
            id: `gap_${Date.now()}`,
            technique: step.technique,
            tactic: step.mitreTactic,
            gapType: 'coverage',
            severity: 'high',
            currentState: 'Not detected',
            requiredState: 'Detected within SLA',
            effort: 'medium',
            timeline: '30 days',
          });
        }
      });
    }

    return {
      summary: `Exercise completed with ${execution.metrics.coverageScore.toFixed(0)}% detection coverage`,
      findings,
      gaps,
      recommendations: [
        'Update detection rules for undetected techniques',
        'Improve SOC response time',
        'Conduct team training on gaps',
      ],
      metrics: execution.metrics,
      detectionTimeline: execution.detectionResults.map((d) => ({
        timestamp: d.timestamp,
        event: `${d.technique} detected`,
        source: d.detectionSource,
        severity: d.severity === 'critical' ? 5 : d.severity === 'high' ? 4 : d.severity === 'medium' ? 3 : 2,
      })),
      lessons: [
        {
          title: 'Improve Detection',
          description: 'Several techniques were not detected',
          actionItem: 'Implement additional detection rules',
          priority: 'high',
        },
      ],
      nextSteps: [
        'Review and address identified gaps',
        'Update incident response procedures',
        'Schedule follow-up exercise in 60 days',
      ],
    };
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): ExerciseExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * List exercises
   */
  listExercises(difficulty?: string): PurpleTeamExercise[] {
    if (difficulty) {
      return this.exerciseLibrary.filter((e) => e.difficulty === difficulty);
    }
    return this.exerciseLibrary;
  }

  /**
   * Create custom exercise
   */
  createExercise(exercise: PurpleTeamExercise): void {
    this.exercises.set(exercise.id, exercise);
    this.exerciseLibrary.push(exercise);
  }
}

/**
 * Detection Monitor
 */
class DetectionMonitor {
  private monitoring: Map<string, DetectionMonitoringSession>;

  constructor() {
    this.monitoring = new Map();
  }

  startMonitoring(exerciseId: string, executionId: string): void {
    this.monitoring.set(executionId, {
      exerciseId,
      executionId,
      detections: [],
      startTime: Date.now(),
    });
  }

  async checkDetections(
    stepId: string,
    expectedDetections: DetectionMethod[]
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    // Simulate detection checking
    for (const detection of expectedDetections) {
      if (Math.random() > 0.1) {
        // 90% detection rate
        results.push({
          id: `det_${Date.now()}`,
          timestamp: new Date(),
          technique: stepId,
          detectionSource: detection.source,
          rule: detection.rule,
          severity: 'high',
          confidence: detection.confidence,
          falsePositive: false,
          responseTime: Math.random() * 60000,
          artifacts: [],
          correlations: [],
        });
      }
    }

    return results;
  }
}

interface DetectionMonitoringSession {
  exerciseId: string;
  executionId: string;
  detections: DetectionResult[];
  startTime: number;
}

export const purpleTeamEngine = new PurpleTeamEngine();
