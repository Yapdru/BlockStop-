/**
 * Healthcare Threat Trending - Ransomware, compliance violations by region
 * Analyzes and tracks healthcare threat trends
 */

import {
  HealthcareThreatTrending,
  ThreatTrend,
  HealthcareThreatType,
  TrendPoint,
  RansomwareCampaignTrend,
  ComplianceThreat,
  RegionalThreatAnalysis,
  ThreatType,
  IndustryBenchmark,
  ThreatPrediction,
  PredictedThreat,
} from '@/types/office-phase31';

/**
 * Healthcare Threat Trending Manager
 * Analyzes healthcare threat trends and patterns
 */
export class HealthcareThreatTrendingManager {
  private trending: HealthcareThreatTrending;

  constructor(organizationId: string) {
    this.trending = {
      id: `trending-${organizationId}`,
      organizationId,
      threats: [],
      ransomwareCampaigns: [],
      complianceThreats: [],
      regionalAnalysis: [],
      industryBenchmarks: [],
      predictions: [],
    };

    this.initializeData();
  }

  /**
   * Track threat trend
   */
  public trackThreatTrend(
    threatType: HealthcareThreatType,
    period: { startDate: Date; endDate: Date },
    frequency: number,
    affectedOrganizations: number
  ): ThreatTrend {
    const timeline: TrendPoint[] = this.generateTimeline(period, frequency);

    const trend: ThreatTrend = {
      threatType,
      period,
      frequency,
      trendDirection: this.calculateTrendDirection(timeline),
      percentageChange: this.calculatePercentageChange(timeline),
      affectedOrganizations,
      sectorImpact: `${affectedOrganizations} healthcare organizations`,
      geographicDistribution: this.generateGeographicDistribution(),
      targetedSystems: this.getTargetedSystems(threatType),
      timeline,
    };

    this.trending.threats.push(trend);
    return trend;
  }

  /**
   * Track ransomware campaign
   */
  public trackRansomwareCampaign(
    campaignName: string,
    operator: string,
    targetedCountries: string[],
    victimCount: number,
    averageRansom: number
  ): RansomwareCampaignTrend {
    const campaign: RansomwareCampaignTrend = {
      id: `campaign-${Date.now()}`,
      campaignName,
      operator,
      firstObservedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      lastObservedDate: new Date(),
      targetedIndustries: ['healthcare', 'hospital_systems', 'medical_devices'],
      targetedCountries,
      victimCount,
      averageRansomDemand: averageRansom,
      currency: 'USD',
      paymentMethods: ['Bitcoin', 'Monero', 'cryptocurrency'],
      toolsUsed: ['Cobalt Strike', 'PSExec', 'Process Hollowing'],
      vulnerabilitiesExploited: ['CVE-2023-44477', 'CVE-2024-21683', 'RDP-brute-force'],
      timelineData: this.generateCampaignTimeline(victimCount),
      status: 'active',
      intelligence: [
        'Campaign targets backup systems',
        'Uses double encryption tactic',
        'Specializes in healthcare sector',
        'Professional negotiators',
      ],
    };

    this.trending.ransomwareCampaigns.push(campaign);
    return campaign;
  }

  /**
   * Record compliance threat
   */
  public recordComplianceThreat(
    threatType: string,
    regulation: string,
    affectedSectors: string[],
    affectedRegions: string[],
    frequency: number,
    commonCauses: string[]
  ): ComplianceThreat {
    const threat: ComplianceThreat = {
      id: `compliance-threat-${Date.now()}`,
      threatType,
      regulation,
      affectedSectors,
      affectedRegions,
      frequency,
      severity: frequency > 100 ? 'critical' : frequency > 50 ? 'high' : 'medium',
      commonCauses,
      remediation: this.getRemediationSteps(threatType, regulation),
      regulatoryActionsTaken: this.getRegulartyActions(regulation),
      recentIncidents: this.generateIncidentReferences(),
    };

    this.trending.complianceThreats.push(threat);
    return threat;
  }

  /**
   * Analyze regional threats
   */
  public analyzeRegionalThreats(region: string): RegionalThreatAnalysis {
    const analysis: RegionalThreatAnalysis = {
      region,
      threatProfile: ['ransomware', 'phishing', 'insider', 'supply_chain'],
      dominantThreats: this.getDominantThreatsForRegion(region),
      yearOverYearChange: this.calculateYoYChange(region),
      prevalentMalware: this.getPrevalentMalware(region),
      commonVulnerabilities: this.getCommonVulnerabilities(region),
      regulatoryFocus: this.getRegulartyFocus(region),
    };

    this.trending.regionalAnalysis.push(analysis);
    return analysis;
  }

  /**
   * Get industry benchmarks
   */
  public getIndustryBenchmarks(period: {
    startDate: Date;
    endDate: Date;
  }): IndustryBenchmark {
    const benchmark: IndustryBenchmark = {
      industry: 'healthcare',
      period,
      averageIncidentsPerOrganization: 12.5,
      averageTimeToDetect: 206, // minutes
      averageTimeToResolve: 48, // hours
      percentageWithIncidents: 89,
      commonThreats: [
        'ransomware',
        'phishing',
        'supply_chain_compromise',
        'insider_threat',
      ],
      averageCost: 2100000, // dollars
      topVulnerabilities: [
        'Unpatched systems',
        'Weak access controls',
        'Lack of segmentation',
        'Inadequate monitoring',
      ],
    };

    this.trending.industryBenchmarks.push(benchmark);
    return benchmark;
  }

  /**
   * Generate threat predictions
   */
  public generatePredictions(
    timeframe: string = '30 days'
  ): ThreatPrediction {
    const predictions: PredictedThreat[] = [
      {
        threatType: 'Ransomware',
        likelihood: 'high',
        expectedImpact: 'Potential operational disruption lasting 24-72 hours',
        targetedSectors: ['hospitals', 'imaging_centers', 'surgical_suites'],
        targetedRegions: ['US', 'EU'],
        suggestedPreparations: [
          'Verify backup integrity',
          'Test restoration procedures',
          'Review incident response plan',
          'Ensure EDR is functioning',
        ],
      },
      {
        threatType: 'Phishing Campaign',
        likelihood: 'high',
        expectedImpact: 'Potential credential compromise and lateral movement',
        targetedSectors: ['all_healthcare'],
        targetedRegions: ['North America'],
        suggestedPreparations: [
          'Conduct phishing simulation',
          'Review email security rules',
          'Remind users of security awareness',
        ],
      },
      {
        threatType: 'Supply Chain Attack',
        likelihood: 'medium',
        expectedImpact: 'Compromise of healthcare software or device firmware',
        targetedSectors: ['medical_device_manufacturers', 'ehrs'],
        targetedRegions: ['Global'],
        suggestedPreparations: [
          'Review vendor security assessments',
          'Monitor for suspicious updates',
          'Implement software restriction policies',
        ],
      },
      {
        threatType: 'HIPAA Violations',
        likelihood: 'medium',
        expectedImpact: 'Regulatory fines and reputational damage',
        targetedSectors: ['all_healthcare'],
        targetedRegions: ['US'],
        suggestedPreparations: [
          'Conduct HIPAA compliance audit',
          'Update BAAs',
          'Review access controls',
        ],
      },
    ];

    const prediction: ThreatPrediction = {
      id: `prediction-${Date.now()}`,
      date: new Date(),
      predictedThreats: predictions,
      confidence: 78,
      methodology: 'Machine learning analysis of historical threat data and current indicators',
      timePeriod: timeframe,
    };

    this.trending.predictions.push(prediction);
    return prediction;
  }

  /**
   * Get threat summary report
   */
  public getThreatSummaryReport(
    startDate: Date,
    endDate: Date
  ): {
    period: { start: Date; end: Date };
    ransomwareTrends: { active: number; spread: number; totalDamage: string };
    phishingTrends: { detections: number; successRate: number };
    complianceTrends: { violations: number; topViolations: string[] };
    regionalHotspots: string[];
    emergingThreats: string[];
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    const activeCampaigns = this.trending.ransomwareCampaigns.filter(
      (c) => c.status === 'active'
    ).length;

    const totalVictims = this.trending.ransomwareCampaigns.reduce(
      (sum, c) => sum + c.victimCount,
      0
    );

    const phishingDetections = this.trending.threats
      .filter((t) => t.threatType === 'phishing')
      .reduce((sum, t) => sum + t.frequency, 0);

    const complianceViolations = this.trending.complianceThreats
      .filter((t) => t.severity !== 'low')
      .reduce((sum, t) => sum + t.frequency, 0);

    const topViolations = this.trending.complianceThreats
      .slice(0, 3)
      .map((t) => t.threatType);

    const hotspots = Array.from(
      new Set(
        this.trending.regionalAnalysis
          .filter((r) => r.yearOverYearChange > 20)
          .map((r) => r.region)
      )
    );

    return {
      period: { start: startDate, end: endDate },
      ransomwareTrends: {
        active: activeCampaigns,
        spread: totalVictims,
        totalDamage: `$${(totalVictims * 2000000).toLocaleString()}+`,
      },
      phishingTrends: {
        detections: phishingDetections,
        successRate: 8.5,
      },
      complianceTrends: {
        violations: complianceViolations,
        topViolations,
      },
      regionalHotspots: hotspots,
      emergingThreats: [
        'Healthcare IoT device compromise',
        'AI-powered social engineering',
        'Quantum computing readiness gaps',
      ],
      riskLevel: activeCampaigns > 5 ? 'critical' : activeCampaigns > 2 ? 'high' : 'medium',
      recommendations: [
        'Enhance network segmentation for critical systems',
        'Implement advanced threat protection on all endpoints',
        'Conduct quarterly security awareness training',
        'Establish threat intelligence sharing program',
        'Develop ransomware recovery playbook',
      ],
    };
  }

  // ========== Private helper methods ==========

  private initializeData(): void {
    // Initialize with sample threat data
    this.trackThreatTrend('ransomware', { startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), endDate: new Date() }, 45, 125);

    this.trackRansomwareCampaign(
      'LockBit Ransomware',
      'LockBit Cartel',
      ['US', 'UK', 'EU'],
      28,
      2000000
    );

    this.recordComplianceThreat(
      'Data Breach via Misconfiguration',
      'HIPAA',
      ['hospitals', 'imaging_centers'],
      ['US'],
      34,
      ['Cloud misconfiguration', 'Lack of monitoring']
    );

    this.analyzeRegionalThreats('US');
    this.getIndustryBenchmarks({
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
  }

  private generateTimeline(period: { startDate: Date; endDate: Date }, baseFrequency: number): TrendPoint[] {
    const timeline: TrendPoint[] = [];
    const daysInPeriod = Math.ceil(
      (period.endDate.getTime() - period.startDate.getTime()) / (1000 * 24 * 60 * 60)
    );

    for (let i = 0; i < daysInPeriod; i += Math.max(1, Math.floor(daysInPeriod / 10))) {
      const variation = baseFrequency * (0.8 + Math.random() * 0.4);
      timeline.push({
        date: new Date(period.startDate.getTime() + i * 24 * 60 * 60 * 1000),
        value: Math.floor(variation),
        annotations: ['Significant activity observed'],
      });
    }

    return timeline;
  }

  private calculateTrendDirection(
    timeline: TrendPoint[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (timeline.length < 2) return 'stable';

    const firstQuarter = timeline.slice(0, Math.floor(timeline.length / 4));
    const lastQuarter = timeline.slice(Math.floor((timeline.length * 3) / 4));

    const firstAvg = firstQuarter.reduce((sum, p) => sum + p.value, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, p) => sum + p.value, 0) / lastQuarter.length;

    if (lastAvg > firstAvg * 1.1) return 'increasing';
    if (lastAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private calculatePercentageChange(timeline: TrendPoint[]): number {
    if (timeline.length < 2) return 0;

    const firstValue = timeline[0].value;
    const lastValue = timeline[timeline.length - 1].value;

    return ((lastValue - firstValue) / firstValue) * 100;
  }

  private generateGeographicDistribution(): Record<string, number> {
    return {
      'US': 40,
      'EU': 35,
      'Asia-Pacific': 15,
      'Other': 10,
    };
  }

  private getTargetedSystems(threatType: HealthcareThreatType): string[] {
    const systems: Record<HealthcareThreatType, string[]> = {
      ransomware: ['EHR', 'medical_imaging', 'PACS', 'laboratory_systems'],
      phishing: ['email', 'vpn_portals', 'admin_consoles'],
      supply_chain: ['medical_devices', 'software_updates', 'cloud_services'],
      insider_threat: ['patient_databases', 'financial_systems', 'research_data'],
      iot_vulnerability: ['medical_devices', 'network_infrastructure'],
      compliance_threat: ['data_storage', 'access_controls'],
      data_exfiltration: ['databases', 'file_shares', 'backups'],
      denial_of_service: ['public_websites', 'vpn_portals', 'api_endpoints'],
    };

    return systems[threatType] || [];
  }

  private generateCampaignTimeline(initialVictims: number): TrendPoint[] {
    const timeline: TrendPoint[] = [];
    const months = 12;

    for (let i = 0; i < months; i++) {
      timeline.push({
        date: new Date(Date.now() - (months - i) * 30 * 24 * 60 * 60 * 1000),
        value: Math.floor(initialVictims * (0.3 + (i / months) * 0.7)),
        annotations: [],
      });
    }

    return timeline;
  }

  private getDominantThreatsForRegion(region: string): string[] {
    const threats: Record<string, string[]> = {
      US: ['ransomware', 'phishing', 'insider_threat'],
      EU: ['GDPR_violations', 'phishing', 'ransomware'],
      'Asia-Pacific': ['supply_chain', 'insider_threat', 'ransomware'],
    };

    return threats[region] || ['ransomware', 'phishing'];
  }

  private calculateYoYChange(region: string): number {
    return Math.random() * 60 - 10; // Range: -10 to 50%
  }

  private getPrevalentMalware(region: string): string[] {
    return ['LockBit', 'BlackCat', 'Cl0p', 'Play Ransomware'];
  }

  private getCommonVulnerabilities(region: string): string[] {
    return [
      'Unpatched systems',
      'Weak authentication',
      'Insufficient network segmentation',
      'Inadequate backup systems',
    ];
  }

  private getRegulartyFocus(region: string): string[] {
    const focus: Record<string, string[]> = {
      US: ['HIPAA', 'HITECH'],
      EU: ['GDPR'],
      BR: ['LGPD'],
    };

    return focus[region] || [];
  }

  private getRemediationSteps(threatType: string, regulation: string): string[] {
    return [
      `Implement ${regulation} controls`,
      'Conduct security assessment',
      'Update policies and procedures',
      'Train staff on compliance requirements',
    ];
  }

  private getRegulartyActions(regulation: string): string[] {
    return [
      `${regulation} enforcement actions issued`,
      'Settlements reached',
      'Fines imposed on non-compliant organizations',
    ];
  }

  private generateIncidentReferences() {
    return [
      {
        organizationName: 'Healthcare System A',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        penalty: 500000,
        description: 'Unauthorized access to patient records',
      },
    ];
  }

  public getTrendingData(): HealthcareThreatTrending {
    return this.trending;
  }
}

export default HealthcareThreatTrendingManager;
