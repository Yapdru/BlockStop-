// Threat Simulation Engine - Generate Synthetic Attacks & Purple Team Exercises
// MITRE ATT&CK Scenarios, Payload Generation, Defense Effectiveness Testing

import * as crypto from 'crypto';

/**
 * MITRE ATT&CK Framework Integration
 */
export interface MITREATTACKTechnique {
  id: string; // T1234
  name: string;
  description: string;
  tactics: string[]; // initial-access, execution, persistence, etc.
  platforms: string[]; // Windows, Linux, macOS
  severity: number; // 1-10
  detectability: number; // 1-10 (higher = easier to detect)
}

export interface AttackScenario {
  scenarioId: string;
  name: string;
  description: string;
  techniques: MITREATTACKTechnique[];
  kill_chain: {
    stage: string;
    techniques: string[];
    payloads: string[];
  }[];
  expectedDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetEnvironment: 'windows' | 'linux' | 'macos' | 'multi';
  objectives: string[];
}

export interface SyntheticPayload {
  payloadId: string;
  name: string;
  type: 'executable' | 'script' | 'macro' | 'shellcode' | 'dll' | 'pdf' | 'docx';
  technique: string; // T1234
  signature: string; // detection signature
  hashes: {
    md5: string;
    sha1: string;
    sha256: string;
  };
  detectionRate: number; // % of AV engines that detect it
  evasionTechniques: string[];
  fileSize: number;
  createdAt: Date;
  lastUsed?: Date;
}

export interface PurpleTeamExercise {
  exerciseId: string;
  name: string;
  description: string;
  scenarioId: string;
  startTime: Date;
  endTime?: Date;
  status: 'planning' | 'running' | 'completed' | 'paused';
  targetSystems: string[];
  blueteamScore: number; // detection/response effectiveness 0-100
  redteamScore: number; // attack success rate 0-100
  events: {
    timestamp: Date;
    stage: string;
    technique: string;
    action: string;
    success: boolean;
    detected: boolean;
    responseTime?: number; // milliseconds
  }[];
  metrics: {
    totalAttacks: number;
    successfulAttacks: number;
    detectedAttacks: number;
    avgDetectionTime: number;
    avgResponseTime: number;
    defenseScore: number; // 0-100
  };
}

export interface DefenseEffectivenessTest {
  testId: string;
  name: string;
  defense: string; // e.g., "EDR Agent", "Network Segmentation"
  payloads: SyntheticPayload[];
  results: {
    blocked: number;
    detected: number;
    prevented: number;
    evaded: number;
  };
  effectiveness: number; // 0-100
  recommendations: string[];
  timestamp: Date;
}

export interface SimulationMetrics {
  metricsId: string;
  simulationId: string;
  timestamp: Date;
  metrics: {
    attacksGenerated: number;
    attacksSuccessful: number;
    successRate: number;
    avgTTK: number; // Time To Kill (seconds)
    avgTTD: number; // Time To Detection (seconds)
    avgTTR: number; // Time To Response (seconds)
    detectionRate: number;
    responseRate: number;
    evasionRate: number;
  };
}

/**
 * MITRE ATT&CK Technique Database
 */
const MITRE_TECHNIQUES: Record<string, MITREATTACKTechnique> = {
  'T1566': {
    id: 'T1566',
    name: 'Phishing',
    description: 'Send phishing emails with malicious attachments or links',
    tactics: ['initial-access'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 9,
    detectability: 6,
  },
  'T1059': {
    id: 'T1059',
    name: 'Command and Scripting Interpreter',
    description: 'Execute commands via shell, PowerShell, Bash, etc.',
    tactics: ['execution'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 10,
    detectability: 7,
  },
  'T1547': {
    id: 'T1547',
    name: 'Boot or Logon Autostart Execution',
    description: 'Achieve persistence via registry keys, startup folders',
    tactics: ['persistence', 'privilege-escalation'],
    platforms: ['Windows'],
    severity: 8,
    detectability: 7,
  },
  'T1021': {
    id: 'T1021',
    name: 'Remote Services',
    description: 'Use RDP, SSH, WinRM for lateral movement',
    tactics: ['lateral-movement'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 9,
    detectability: 8,
  },
  'T1055': {
    id: 'T1055',
    name: 'Process Injection',
    description: 'Inject code into running processes',
    tactics: ['defense-evasion', 'execution'],
    platforms: ['Windows', 'Linux'],
    severity: 9,
    detectability: 7,
  },
  'T1098': {
    id: 'T1098',
    name: 'Account Manipulation',
    description: 'Create backdoor accounts or modify permissions',
    tactics: ['persistence'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 8,
    detectability: 7,
  },
  'T1036': {
    id: 'T1036',
    name: 'Masquerading',
    description: 'Hide presence by masquerading as legitimate files',
    tactics: ['defense-evasion'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 7,
    detectability: 6,
  },
  'T1027': {
    id: 'T1027',
    name: 'Obfuscated Files or Information',
    description: 'Encrypt, encode, or obfuscate payloads',
    tactics: ['defense-evasion'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 7,
    detectability: 5,
  },
  'T1005': {
    id: 'T1005',
    name: 'Data from Local System',
    description: 'Exfiltrate data from the compromised system',
    tactics: ['collection'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 8,
    detectability: 6,
  },
  'T1041': {
    id: 'T1041',
    name: 'Exfiltration Over C2 Channel',
    description: 'Send stolen data over command and control channel',
    tactics: ['exfiltration'],
    platforms: ['Windows', 'Linux', 'macOS'],
    severity: 9,
    detectability: 7,
  },
};

/**
 * Threat Simulator Engine
 */
export class ThreatSimulator {
  private payloads: Map<string, SyntheticPayload> = new Map();
  private exercises: Map<string, PurpleTeamExercise> = new Map();
  private defenseTests: Map<string, DefenseEffectivenessTest> = new Map();
  private simulationMetrics: SimulationMetrics[] = [];
  private scenarioTemplates: Record<string, AttackScenario> = {};

  constructor() {
    this.initializeScenarioTemplates();
  }

  /**
   * Initialize predefined attack scenarios
   */
  private initializeScenarioTemplates(): void {
    // Ransomware Campaign Scenario
    this.scenarioTemplates['ransomware_campaign'] = {
      scenarioId: 'scenario-ransomware-001',
      name: 'Ransomware Campaign - Emotet Distribution',
      description: 'Simulates a multi-stage ransomware attack using phishing and lateral movement',
      techniques: [
        MITRE_TECHNIQUES['T1566'],
        MITRE_TECHNIQUES['T1059'],
        MITRE_TECHNIQUES['T1547'],
        MITRE_TECHNIQUES['T1021'],
      ],
      kill_chain: [
        {
          stage: 'Initial Access',
          techniques: ['T1566'],
          payloads: ['emotet-loader'],
        },
        {
          stage: 'Execution',
          techniques: ['T1059'],
          payloads: ['powershell-downloader'],
        },
        {
          stage: 'Persistence',
          techniques: ['T1547'],
          payloads: ['registry-persistence'],
        },
        {
          stage: 'Lateral Movement',
          techniques: ['T1021'],
          payloads: ['psexec-lateral'],
        },
        {
          stage: 'Impact',
          techniques: ['T1490'],
          payloads: ['ransomware-encryptor'],
        },
      ],
      expectedDuration: 120,
      difficulty: 'advanced',
      targetEnvironment: 'windows',
      objectives: [
        'Gain initial access via phishing',
        'Execute loader malware',
        'Establish persistence',
        'Move laterally to other systems',
        'Encrypt user data',
      ],
    };

    // APT-style Intrusion Scenario
    this.scenarioTemplates['apt_intrusion'] = {
      scenarioId: 'scenario-apt-001',
      name: 'APT-Style Intrusion - Multi-Month Dwelling',
      description: 'Simulates advanced persistent threat behavior with stealth and data exfiltration',
      techniques: [
        MITRE_TECHNIQUES['T1566'],
        MITRE_TECHNIQUES['T1021'],
        MITRE_TECHNIQUES['T1036'],
        MITRE_TECHNIQUES['T1005'],
        MITRE_TECHNIQUES['T1041'],
      ],
      kill_chain: [
        {
          stage: 'Initial Access',
          techniques: ['T1566'],
          payloads: ['spear-phishing'],
        },
        {
          stage: 'Establish Foothold',
          techniques: ['T1098'],
          payloads: ['backdoor-account'],
        },
        {
          stage: 'Lateral Movement',
          techniques: ['T1021'],
          payloads: ['remote-access-tool'],
        },
        {
          stage: 'Hide Presence',
          techniques: ['T1036', 'T1027'],
          payloads: ['obfuscated-implant'],
        },
        {
          stage: 'Collect Intelligence',
          techniques: ['T1005'],
          payloads: ['reconnaissance-tool'],
        },
        {
          stage: 'Exfiltrate Data',
          techniques: ['T1041'],
          payloads: ['data-exfil-tool'],
        },
      ],
      expectedDuration: 300,
      difficulty: 'expert',
      targetEnvironment: 'multi',
      objectives: [
        'Maintain undetected presence',
        'Escalate privileges',
        'Discover sensitive data locations',
        'Exfiltrate data over extended period',
        'Maintain long-term access',
      ],
    };

    // Supply Chain Attack
    this.scenarioTemplates['supply_chain'] = {
      scenarioId: 'scenario-supply-chain-001',
      name: 'Supply Chain Attack - Compromised Vendor',
      description: 'Simulates compromise through third-party software vendor',
      techniques: [
        MITRE_TECHNIQUES['T1036'],
        MITRE_TECHNIQUES['T1547'],
        MITRE_TECHNIQUES['T1005'],
      ],
      kill_chain: [
        {
          stage: 'Initial Distribution',
          techniques: ['T1195'],
          payloads: ['trojanized-installer'],
        },
        {
          stage: 'Execution',
          techniques: ['T1059'],
          payloads: ['legitimate-looking-process'],
        },
        {
          stage: 'Persistence',
          techniques: ['T1547'],
          payloads: ['registry-backdoor'],
        },
      ],
      expectedDuration: 60,
      difficulty: 'expert',
      targetEnvironment: 'windows',
      objectives: [
        'Distribute trojanized software',
        'Establish hidden persistence',
        'Gain information about victims',
      ],
    };

    // Insider Threat Scenario
    this.scenarioTemplates['insider_threat'] = {
      scenarioId: 'scenario-insider-001',
      name: 'Insider Threat - Data Exfiltration',
      description: 'Simulates malicious insider stealing sensitive data',
      techniques: [
        MITRE_TECHNIQUES['T1005'],
        MITRE_TECHNIQUES['T1041'],
        MITRE_TECHNIQUES['T1020'],
      ],
      kill_chain: [
        {
          stage: 'Reconnaissance',
          techniques: ['T1087'],
          payloads: ['directory-search'],
        },
        {
          stage: 'Collection',
          techniques: ['T1005'],
          payloads: ['file-gatherer'],
        },
        {
          stage: 'Exfiltration',
          techniques: ['T1048'],
          payloads: ['cloud-upload-tool'],
        },
      ],
      expectedDuration: 30,
      difficulty: 'intermediate',
      targetEnvironment: 'multi',
      objectives: [
        'Identify sensitive data',
        'Download files in bulk',
        'Exfiltrate to external cloud storage',
      ],
    };
  }

  /**
   * Generate synthetic attack payload
   */
  generatePayload(
    technique: string,
    type: 'executable' | 'script' | 'macro' | 'shellcode' | 'dll' | 'pdf' | 'docx',
    evasionLevel: 'low' | 'medium' | 'high' | 'extreme' = 'high'
  ): SyntheticPayload {
    const payloadId = `payload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate realistic hashes
    const baseContent = `${technique}:${type}:${evasionLevel}:${payloadId}`;
    const md5Hash = crypto.createHash('md5').update(baseContent).digest('hex');
    const sha1Hash = crypto.createHash('sha1').update(baseContent).digest('hex');
    const sha256Hash = crypto.createHash('sha256').update(baseContent).digest('hex');

    // Determine file size based on type
    let fileSize = 0;
    switch (type) {
      case 'executable':
        fileSize = 200000 + Math.random() * 500000; // 200KB-700KB
        break;
      case 'dll':
        fileSize = 100000 + Math.random() * 300000; // 100KB-400KB
        break;
      case 'script':
        fileSize = 5000 + Math.random() * 50000; // 5KB-55KB
        break;
      case 'shellcode':
        fileSize = 1000 + Math.random() * 10000; // 1KB-11KB
        break;
      case 'macro':
        fileSize = 10000 + Math.random() * 50000; // 10KB-60KB
        break;
      case 'pdf':
      case 'docx':
        fileSize = 500000 + Math.random() * 2000000; // 500KB-2.5MB
        break;
    }

    // Evasion techniques based on level
    const evasionMap: Record<string, string[]> = {
      low: ['basic-obfuscation'],
      medium: ['code-obfuscation', 'string-encryption', 'api-hashing'],
      high: [
        'polymorphic-engine',
        'string-encryption',
        'api-hashing',
        'anti-vm',
        'anti-debug',
        'process-hollowing',
      ],
      extreme: [
        'polymorphic-engine',
        'string-encryption',
        'api-hashing',
        'anti-vm',
        'anti-debug',
        'process-hollowing',
        'code-signing-bypass',
        'behavioral-evasion',
        'kernel-mode-evasion',
      ],
    };

    // Calculate detection rate based on evasion
    const baseDetectionRate = 75; // % of AV vendors detect unobfuscated
    let detectionRate = baseDetectionRate;
    switch (evasionLevel) {
      case 'low':
        detectionRate = 70 + Math.random() * 10;
        break;
      case 'medium':
        detectionRate = 40 + Math.random() * 20;
        break;
      case 'high':
        detectionRate = 15 + Math.random() * 20;
        break;
      case 'extreme':
        detectionRate = 2 + Math.random() * 8;
        break;
    }

    const payload: SyntheticPayload = {
      payloadId,
      name: `${technique}-${type}-${evasionLevel}`,
      type,
      technique,
      signature: this.generateSignature(technique, type),
      hashes: {
        md5: md5Hash,
        sha1: sha1Hash,
        sha256: sha256Hash,
      },
      detectionRate: Math.round(detectionRate),
      evasionTechniques: evasionMap[evasionLevel],
      fileSize: Math.round(fileSize),
      createdAt: new Date(),
    };

    this.payloads.set(payloadId, payload);
    return payload;
  }

  /**
   * Generate YARA/detection signature for payload
   */
  private generateSignature(technique: string, type: string): string {
    const patterns = [
      'powershell -windowstyle hidden',
      'cmd.exe /c',
      'WinExec',
      'CreateRemoteThread',
      'SetWindowsHookEx',
      'EnumSystemLocales',
      'AdjustTokenPrivileges',
      'DuplicateToken',
      'GetAsyncKeyState',
      'FindFirstFileA',
    ];

    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    return `YARA_${technique}_${type.toUpperCase()}_${Buffer.from(randomPattern).toString('base64')}`;
  }

  /**
   * Create and start purple team exercise
   */
  launchPurpleTeamExercise(
    scenarioName: 'ransomware_campaign' | 'apt_intrusion' | 'supply_chain' | 'insider_threat',
    targetSystems: string[]
  ): PurpleTeamExercise {
    const scenario = this.scenarioTemplates[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    const exerciseId = `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const exercise: PurpleTeamExercise = {
      exerciseId,
      name: scenario.name,
      description: scenario.description,
      scenarioId: scenario.scenarioId,
      startTime: new Date(),
      status: 'running',
      targetSystems,
      blueteamScore: 0,
      redteamScore: 0,
      events: [],
      metrics: {
        totalAttacks: 0,
        successfulAttacks: 0,
        detectedAttacks: 0,
        avgDetectionTime: 0,
        avgResponseTime: 0,
        defenseScore: 0,
      },
    };

    // Simulate attack progression
    this.simulateAttackProgression(exercise, scenario);

    this.exercises.set(exerciseId, exercise);
    return exercise;
  }

  /**
   * Simulate attack progression through kill chain
   */
  private simulateAttackProgression(exercise: PurpleTeamExercise, scenario: AttackScenario): void {
    let currentTime = Date.now();
    const events = [];

    for (const stage of scenario.kill_chain) {
      // Simulate each attack in the kill chain
      for (const technique of stage.techniques) {
        const techniqueData = Object.values(MITRE_TECHNIQUES).find(t => t.id === technique);
        if (!techniqueData) continue;

        // Random attack success (affected by detection)
        const attackSuccess = Math.random() > 0.3; // 70% base success rate
        const detected = Math.random() > (technique === 'T1566' ? 0.4 : 0.6); // phishing easier to detect

        const detectionTime = detected ? Math.random() * 300000 : null; // 0-5 minutes
        const responseTime = detected ? Math.random() * 600000 : null; // 0-10 minutes

        events.push({
          timestamp: new Date(currentTime),
          stage: stage.stage,
          technique: technique,
          action: `Execute ${techniqueData.name}`,
          success: attackSuccess,
          detected,
          responseTime: responseTime || undefined,
        });

        exercise.metrics.totalAttacks++;
        if (attackSuccess) exercise.metrics.successfulAttacks++;
        if (detected) exercise.metrics.detectedAttacks++;

        currentTime += Math.random() * 60000 + 10000; // Advance 10-70 seconds per attack
      }
    }

    exercise.events = events;

    // Calculate metrics
    exercise.metrics.avgDetectionTime =
      events
        .filter(e => e.detected && e.timestamp)
        .reduce((sum, e) => sum + (e.responseTime || 0), 0) /
        Math.max(events.filter(e => e.detected).length, 1) || 0;

    exercise.metrics.avgResponseTime =
      events
        .filter(e => e.responseTime)
        .reduce((sum, e) => sum + (e.responseTime || 0), 0) /
        Math.max(events.filter(e => e.responseTime).length, 1) || 0;

    // Calculate scores (0-100)
    const detectionRate =
      (exercise.metrics.detectedAttacks / Math.max(exercise.metrics.totalAttacks, 1)) * 100;
    const responseEffectiveness = 100 - Math.min(exercise.metrics.avgResponseTime / 1000, 100); // Faster is better

    exercise.blueteamScore = Math.round(detectionRate * 0.6 + responseEffectiveness * 0.4);
    exercise.redteamScore = Math.round(
      ((exercise.metrics.successfulAttacks / Math.max(exercise.metrics.totalAttacks, 1)) * 100) *
        0.5 +
        (100 - exercise.blueteamScore) * 0.5
    );

    exercise.metrics.defenseScore = exercise.blueteamScore;
  }

  /**
   * Test defense effectiveness against payloads
   */
  testDefenseEffectiveness(
    defenseName: string,
    payloads: SyntheticPayload[],
    defenseCapabilities: {
      staticAnalysis: boolean;
      dynamicAnalysis: boolean;
      sandboxing: boolean;
      aiDetection: boolean;
      signatureMatching: boolean;
    }
  ): DefenseEffectivenessTest {
    const testId = `test-${Date.now()}`;
    const results = {
      blocked: 0,
      detected: 0,
      prevented: 0,
      evaded: 0,
    };

    const recommendations: string[] = [];

    for (const payload of payloads) {
      let isDetected = false;
      let isBlocked = false;

      // Signature matching
      if (defenseCapabilities.signatureMatching && Math.random() > payload.detectionRate / 100) {
        isDetected = true;
      }

      // AI-based detection
      if (defenseCapabilities.aiDetection && Math.random() > 0.25) {
        // AI catches 75% of what signatures miss
        isDetected = true;
      }

      // Sandbox dynamic analysis
      if (
        defenseCapabilities.sandboxing &&
        payload.type !== 'shellcode' &&
        Math.random() > 0.15
      ) {
        isDetected = true;
      }

      // Static analysis
      if (
        defenseCapabilities.staticAnalysis &&
        !payload.evasionTechniques.includes('obfuscation') &&
        Math.random() > 0.3
      ) {
        isDetected = true;
      }

      if (isDetected) {
        results.detected++;
        if (Math.random() > 0.2) {
          // 80% of detected are blocked
          results.blocked++;
          isBlocked = true;
        }
      }

      if (!isDetected && !isBlocked) {
        results.evaded++;
      }

      if (isDetected && isBlocked) {
        results.prevented++;
      }
    }

    // Calculate effectiveness
    const effectiveness = Math.round(
      ((results.detected + results.prevented) / Math.max(payloads.length, 1)) * 100
    );

    // Generate recommendations
    if (results.evaded > payloads.length * 0.3) {
      recommendations.push('Implement advanced behavioral analysis');
      recommendations.push('Enable AI-powered threat detection');
    }

    if (!defenseCapabilities.sandboxing) {
      recommendations.push('Deploy sandbox for dynamic malware analysis');
    }

    if (!defenseCapabilities.aiDetection) {
      recommendations.push('Integrate machine learning-based detection');
    }

    if (results.prevented / results.detected < 0.5) {
      recommendations.push('Improve containment and blocking mechanisms');
    }

    const test: DefenseEffectivenessTest = {
      testId,
      name: `${defenseName} - Effectiveness Test`,
      defense: defenseName,
      payloads,
      results,
      effectiveness,
      recommendations,
      timestamp: new Date(),
    };

    this.defenseTests.set(testId, test);
    return test;
  }

  /**
   * Get MITRE ATT&CK technique by ID
   */
  getMITRETechnique(techniqueId: string): MITREATTACKTechnique | undefined {
    return MITRE_TECHNIQUES[techniqueId];
  }

  /**
   * Get all MITRE ATT&CK techniques
   */
  getAllMITRETechniques(): MITREATTACKTechnique[] {
    return Object.values(MITRE_TECHNIQUES);
  }

  /**
   * Get scenario template
   */
  getScenario(scenarioName: string): AttackScenario | undefined {
    return this.scenarioTemplates[scenarioName];
  }

  /**
   * Get all available scenarios
   */
  getAvailableScenarios(): AttackScenario[] {
    return Object.values(this.scenarioTemplates);
  }

  /**
   * Get exercise details
   */
  getExercise(exerciseId: string): PurpleTeamExercise | undefined {
    return this.exercises.get(exerciseId);
  }

  /**
   * Get all exercises
   */
  getAllExercises(): PurpleTeamExercise[] {
    return Array.from(this.exercises.values());
  }

  /**
   * Get defense test results
   */
  getDefenseTest(testId: string): DefenseEffectivenessTest | undefined {
    return this.defenseTests.get(testId);
  }

  /**
   * Get all defense tests
   */
  getAllDefenseTests(): DefenseEffectivenessTest[] {
    return Array.from(this.defenseTests.values());
  }

  /**
   * End exercise and finalize metrics
   */
  endExercise(exerciseId: string): PurpleTeamExercise | null {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise) return null;

    exercise.status = 'completed';
    exercise.endTime = new Date();

    // Record simulation metrics
    const metrics: SimulationMetrics = {
      metricsId: `metrics-${Date.now()}`,
      simulationId: exerciseId,
      timestamp: new Date(),
      metrics: {
        attacksGenerated: exercise.metrics.totalAttacks,
        attacksSuccessful: exercise.metrics.successfulAttacks,
        successRate:
          (exercise.metrics.successfulAttacks / Math.max(exercise.metrics.totalAttacks, 1)) *
          100,
        avgTTK: 0, // Time to kill would be calculated from actual response
        avgTTD: exercise.metrics.avgDetectionTime / 1000, // Convert to seconds
        avgTTR: exercise.metrics.avgResponseTime / 1000, // Convert to seconds
        detectionRate:
          (exercise.metrics.detectedAttacks / Math.max(exercise.metrics.totalAttacks, 1)) * 100,
        responseRate: (exercise.metrics.detectedAttacks / Math.max(exercise.metrics.totalAttacks, 1)) * 100,
        evasionRate:
          100 -
          (exercise.metrics.detectedAttacks / Math.max(exercise.metrics.totalAttacks, 1)) * 100,
      },
    };

    this.simulationMetrics.push(metrics);
    return exercise;
  }

  /**
   * Get simulation metrics
   */
  getSimulationMetrics(): SimulationMetrics[] {
    return [...this.simulationMetrics];
  }

  /**
   * Generate attack payload with behavioral evasion
   */
  generateBehavioralEvasionPayload(
    evasionTypes: string[]
  ): SyntheticPayload {
    const technique = 'T1027'; // Obfuscated Files
    const payload = this.generatePayload(technique, 'executable', 'extreme');

    // Add behavioral evasion characteristics
    if (evasionTypes.includes('timing-based')) {
      // Payload executes only at specific times
      payload.evasionTechniques.push('timing-based-execution');
    }

    if (evasionTypes.includes('entropy-analysis')) {
      // High entropy to avoid statistical analysis
      payload.evasionTechniques.push('high-entropy-packing');
    }

    if (evasionTypes.includes('sandbox-detection')) {
      // Detects and avoids sandbox environments
      payload.evasionTechniques.push('sandbox-detection-evasion');
    }

    return payload;
  }

  /**
   * Generate attack variants (polymorphic)
   */
  generatePayloadVariants(basePayload: SyntheticPayload, variantCount: number): SyntheticPayload[] {
    const variants: SyntheticPayload[] = [];

    for (let i = 0; i < variantCount; i++) {
      const variantId = `${basePayload.payloadId}-variant-${i}`;
      const newHash = crypto
        .createHash('sha256')
        .update(`${basePayload.payloadId}:${i}:${Math.random()}`)
        .digest('hex');

      const variant: SyntheticPayload = {
        ...basePayload,
        payloadId: variantId,
        name: `${basePayload.name}-variant-${i}`,
        hashes: {
          md5: crypto.createHash('md5').update(newHash).digest('hex'),
          sha1: crypto.createHash('sha1').update(newHash).digest('hex'),
          sha256: newHash,
        },
        detectionRate: basePayload.detectionRate - Math.random() * 10, // Variants evade better
      };

      variants.push(variant);
      this.payloads.set(variantId, variant);
    }

    return variants;
  }
};

export const threatSimulator = new ThreatSimulator();
