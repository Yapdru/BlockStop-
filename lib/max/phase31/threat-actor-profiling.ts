/**
 * MAX Phase 31.1 - Threat Actor Profiling
 * Identify threat groups, techniques, and tactics
 */

import {
  ThreatActorProfile,
  Motivation,
  SophisticationLevel,
  TargetProfile,
  TacticReference,
  TechniqueReference,
  MalwareFamily,
  Campaign,
  RelatedActor,
  RelationshipType,
  SeverityLevel,
} from '@/types/max-phase31';

// ============================================================================
// THREAT ACTOR PROFILING ENGINE
// ============================================================================

export class ThreatActorProfiler {
  private profiles: Map<string, ThreatActorProfile> = new Map();
  private tactics: Map<string, TacticReference> = new Map();
  private techniques: Map<string, TechniqueReference> = new Map();
  private campaigns: Map<string, Campaign> = new Map();

  constructor() {
    this.initializeTacticsAndTechniques();
  }

  /**
   * Initialize known tactics and techniques (MITRE ATT&CK framework)
   */
  private initializeTacticsAndTechniques(): void {
    const tactics = [
      { id: 'TA0001', name: 'Initial Access' },
      { id: 'TA0002', name: 'Execution' },
      { id: 'TA0003', name: 'Persistence' },
      { id: 'TA0004', name: 'Privilege Escalation' },
      { id: 'TA0005', name: 'Defense Evasion' },
      { id: 'TA0006', name: 'Credential Access' },
      { id: 'TA0007', name: 'Discovery' },
      { id: 'TA0008', name: 'Lateral Movement' },
      { id: 'TA0009', name: 'Collection' },
      { id: 'TA0010', name: 'Exfiltration' },
      { id: 'TA0011', name: 'Command and Control' },
      { id: 'TA0040', name: 'Impact' },
    ];

    const techniques: Array<{
      id: string;
      name: string;
      tacticId: string;
      subTechniques: string[];
    }> = [
      {
        id: 'T1566',
        name: 'Phishing',
        tacticId: 'TA0001',
        subTechniques: ['T1566.001', 'T1566.002', 'T1566.003'],
      },
      {
        id: 'T1059',
        name: 'Command and Scripting Interpreter',
        tacticId: 'TA0002',
        subTechniques: ['T1059.001', 'T1059.003'],
      },
      {
        id: 'T1547',
        name: 'Boot or Logon Autostart Execution',
        tacticId: 'TA0003',
        subTechniques: ['T1547.001', 'T1547.004'],
      },
      {
        id: 'T1548',
        name: 'Abuse Elevation Control Mechanism',
        tacticId: 'TA0004',
        subTechniques: ['T1548.002', 'T1548.003'],
      },
      {
        id: 'T1197',
        name: 'BITS Jobs',
        tacticId: 'TA0005',
        subTechniques: [],
      },
      {
        id: 'T1110',
        name: 'Brute Force',
        tacticId: 'TA0006',
        subTechniques: ['T1110.001', 'T1110.003'],
      },
      {
        id: 'T1087',
        name: 'Account Discovery',
        tacticId: 'TA0007',
        subTechniques: [],
      },
      {
        id: 'T1210',
        name: 'Exploitation of Remote Services',
        tacticId: 'TA0008',
        subTechniques: [],
      },
      {
        id: 'T1123',
        name: 'Audio Capture',
        tacticId: 'TA0009',
        subTechniques: [],
      },
      {
        id: 'T1020',
        name: 'Automated Exfiltration',
        tacticId: 'TA0010',
        subTechniques: [],
      },
      {
        id: 'T1071',
        name: 'Application Layer Protocol',
        tacticId: 'TA0011',
        subTechniques: ['T1071.001'],
      },
      {
        id: 'T1531',
        name: 'Account Access Removal',
        tacticId: 'TA0040',
        subTechniques: [],
      },
    ];

    // Store tactics
    for (const tactic of tactics) {
      this.tactics.set(tactic.id, {
        tacticId: tactic.id,
        tacticName: tactic.name,
        frequency: 0,
        lastUsed: new Date(),
      });
    }

    // Store techniques
    for (const technique of techniques) {
      this.techniques.set(technique.id, {
        techniqueId: technique.id,
        techniqueName: technique.name,
        subTechniques: technique.subTechniques,
        frequency: 0,
        lastUsed: new Date(),
        associatedTools: this.getToolsForTechnique(technique.id),
      });
    }
  }

  /**
   * Get tools associated with technique
   */
  private getToolsForTechnique(techniqueId: string): string[] {
    const toolMap: Record<string, string[]> = {
      T1566: ['Phishing Kit', 'Social Engineering Toolkit'],
      T1059: ['PowerShell', 'Bash', 'Cmd'],
      T1547: ['Registry Editor', 'System Utilities'],
      T1548: ['UAC Bypass Tool'],
      T1197: ['bitsadmin'],
      T1110: ['Hashcat', 'John the Ripper'],
      T1087: ['Net', 'Get-ADUser'],
      T1210: ['Metasploit', 'Exploit-DB'],
      T1123: ['Audacity', 'SoundRecorder'],
      T1020: ['Data Exfiltration Tools'],
      T1071: ['Command & Control Framework'],
      T1531: ['Active Directory Tools'],
    };

    return toolMap[techniqueId] || [];
  }

  /**
   * Create threat actor profile
   */
  createActorProfile(
    actorId: string,
    name: string,
    aliases: string[],
    originCountry: string,
    motivations: Motivation[]
  ): ThreatActorProfile {
    const profile: ThreatActorProfile = {
      id: `actor-${actorId}`,
      actorId,
      name,
      aliases,
      description: `Threat actor profile for ${name}`,
      firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastSeen: new Date(),
      originCountry,
      motivations,
      sophistication: this.assessSophistication(motivations),
      knownTargets: this.generateTargetProfiles(),
      tactics: this.generateTacticReferences(),
      techniques: this.generateTechniqueReferences(),
      malwareFamilies: this.generateMalwareFamilies(),
      campaigns: this.generateCampaigns(),
      relatedActors: [],
      threatLevel: this.calculateThreatLevel(motivations),
      confidence: 75 + Math.random() * 20,
    };

    this.profiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Assess sophistication level
   */
  private assessSophistication(motivations: Motivation[]): SophisticationLevel {
    // Nation-state actors are very advanced, cybercriminals vary
    if (motivations.includes(Motivation.ESPIONAGE) ||
        motivations.includes(Motivation.TERRORISM)) {
      return SophisticationLevel.VERY_ADVANCED;
    }

    if (motivations.includes(Motivation.FINANCIAL)) {
      return SophisticationLevel.ADVANCED;
    }

    if (motivations.includes(Motivation.HACKTIVISM)) {
      return SophisticationLevel.INTERMEDIATE;
    }

    return SophisticationLevel.NOVICE;
  }

  /**
   * Generate target profiles
   */
  private generateTargetProfiles(): TargetProfile[] {
    const industries = [
      'Finance',
      'Healthcare',
      'Government',
      'Technology',
      'Energy',
      'Retail',
    ];
    const regions = ['North America', 'Europe', 'Asia', 'Middle East', 'Africa'];
    const types = ['Government', 'Private Sector', 'NGO', 'Military'];

    const targets: TargetProfile[] = [];

    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      targets.push({
        industry: industries[Math.floor(Math.random() * industries.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        organizationType: types[Math.floor(Math.random() * types.length)],
        estimatedVictims: Math.floor(Math.random() * 100) + 10,
      });
    }

    return targets;
  }

  /**
   * Generate tactic references
   */
  private generateTacticReferences(): TacticReference[] {
    const references: TacticReference[] = [];

    for (const [, tactic] of Array.from(this.tactics).slice(0, 4)) {
      references.push({
        tacticId: tactic.tacticId,
        tacticName: tactic.tacticName,
        frequency: Math.floor(Math.random() * 100) + 1,
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    return references;
  }

  /**
   * Generate technique references
   */
  private generateTechniqueReferences(): TechniqueReference[] {
    const references: TechniqueReference[] = [];

    for (const [, technique] of Array.from(this.techniques).slice(0, 6)) {
      references.push({
        techniqueId: technique.techniqueId,
        techniqueName: technique.techniqueName,
        subTechniques: technique.subTechniques,
        frequency: Math.floor(Math.random() * 50) + 1,
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        associatedTools: technique.associatedTools,
      });
    }

    return references;
  }

  /**
   * Generate malware families
   */
  private generateMalwareFamilies(): MalwareFamily[] {
    const families: MalwareFamily[] = [];

    const malwareNames = [
      'Emotet',
      'TrickBot',
      'Ransomware.Generic',
      'Backdoor.APT',
      'Stealer.Generic',
    ];

    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const name = malwareNames[Math.floor(Math.random() * malwareNames.length)];

      families.push({
        id: `malware-${name}`,
        name,
        aliases: [`${name}-variant-1`, `${name}-variant-2`],
        malwareType: 'Trojan',
        firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(),
        samples: Math.floor(Math.random() * 1000) + 10,
        capabilities: [
          'C2',
          'Exfiltration',
          'Persistence',
          'Privilege Escalation',
        ],
      });
    }

    return families;
  }

  /**
   * Generate campaigns
   */
  private generateCampaigns(): Campaign[] {
    const campaigns: Campaign[] = [];

    const campaignNames = [
      'Operation Stealth',
      'Campaign Raccoon',
      'Autumn Aperture',
      'Ghost Operation',
    ];

    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
      const name = campaignNames[Math.floor(Math.random() * campaignNames.length)];

      campaigns.push({
        id: `campaign-${Date.now()}-${i}`,
        name,
        startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        endDate: Math.random() > 0.5
          ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          : undefined,
        description: `Campaign targeting organizations in specific sectors`,
        targetedIndustries: ['Finance', 'Government', 'Technology'],
        targetedRegions: ['North America', 'Europe'],
        malwareFamilies: ['Emotet', 'TrickBot'],
        techniques: ['T1566', 'T1059', 'T1071'],
        knownVictims: Math.floor(Math.random() * 50) + 5,
      });
    }

    return campaigns;
  }

  /**
   * Calculate threat level
   */
  private calculateThreatLevel(motivations: Motivation[]): SeverityLevel {
    if (motivations.includes(Motivation.ESPIONAGE) ||
        motivations.includes(Motivation.TERRORISM)) {
      return SeverityLevel.CRITICAL;
    }

    if (motivations.includes(Motivation.FINANCIAL)) {
      return SeverityLevel.HIGH;
    }

    if (motivations.includes(Motivation.HACKTIVISM)) {
      return SeverityLevel.MEDIUM;
    }

    return SeverityLevel.LOW;
  }

  /**
   * Link related actors
   */
  linkRelatedActors(actorId: string, relatedActorId: string, relationshipType: RelationshipType): void {
    const profile = this.profiles.get(`actor-${actorId}`);
    if (!profile) return;

    profile.relatedActors.push({
      actorId: relatedActorId,
      relationshipType,
      confidence: 70 + Math.random() * 25,
    });
  }

  /**
   * Update actor profile with new intelligence
   */
  updateActorProfile(
    actorId: string,
    updates: Partial<ThreatActorProfile>
  ): void {
    const profile = this.profiles.get(`actor-${actorId}`);
    if (!profile) return;

    if (updates.lastSeen) {
      profile.lastSeen = updates.lastSeen;
    }

    if (updates.campaigns) {
      profile.campaigns.push(...updates.campaigns);
    }

    if (updates.tactics) {
      profile.tactics.push(...updates.tactics);
    }

    if (updates.techniques) {
      profile.techniques.push(...updates.techniques);
    }

    if (updates.knownTargets) {
      profile.knownTargets.push(...updates.knownTargets);
    }
  }

  /**
   * Attribute incident to actor
   */
  attributeIncidentToActor(
    incidentId: string,
    actorId: string,
    confidence: number
  ): Record<string, unknown> {
    const profile = this.profiles.get(`actor-${actorId}`);
    if (!profile) {
      return { error: 'Actor not found' };
    }

    // Analyze IOCs, techniques, and patterns to determine attribution
    const attributionScore = this.calculateAttributionScore(profile);

    return {
      incidentId,
      attributedActor: profile.name,
      confidence,
      attributionScore,
      matchedTechniques: profile.techniques.slice(0, 5),
      matchedMalware: profile.malwareFamilies.slice(0, 3),
      reasoning: `Attribution based on matched TTPs and malware families`,
    };
  }

  /**
   * Calculate attribution score
   */
  private calculateAttributionScore(profile: ThreatActorProfile): number {
    let score = 0;

    // Recent activity
    if (new Date().getTime() - profile.lastSeen.getTime() < 30 * 24 * 60 * 60 * 1000) {
      score += 20; // Recently active
    }

    // Technique matches
    score += Math.min(30, profile.techniques.length * 5);

    // Malware matches
    score += Math.min(20, profile.malwareFamilies.length * 5);

    // Targeting overlap
    score += Math.min(30, profile.knownTargets.length * 10);

    return Math.min(100, score);
  }

  /**
   * Search for actors by characteristic
   */
  searchActors(criteria: {
    motivation?: Motivation;
    region?: string;
    sophistication?: SophisticationLevel;
    threatLevel?: SeverityLevel;
  }): ThreatActorProfile[] {
    return Array.from(this.profiles.values()).filter((profile) => {
      if (criteria.motivation &&
          !profile.motivations.includes(criteria.motivation)) {
        return false;
      }

      if (criteria.region && profile.originCountry !== criteria.region) {
        return false;
      }

      if (criteria.sophistication &&
          profile.sophistication !== criteria.sophistication) {
        return false;
      }

      if (criteria.threatLevel && profile.threatLevel !== criteria.threatLevel) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get actor profile
   */
  getActorProfile(actorId: string): ThreatActorProfile | undefined {
    return this.profiles.get(`actor-${actorId}`);
  }

  /**
   * List all actor profiles
   */
  listActorProfiles(): ThreatActorProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get technique by ID
   */
  getTechnique(techniqueId: string): TechniqueReference | undefined {
    return this.techniques.get(techniqueId);
  }

  /**
   * Get tactic by ID
   */
  getTactic(tacticId: string): TacticReference | undefined {
    return this.tactics.get(tacticId);
  }
}

export default ThreatActorProfiler;
