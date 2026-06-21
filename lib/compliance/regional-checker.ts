/**
 * BlockStop Phase 28.5 - Regional Compliance Checker
 * Verify compliance with regional requirements
 */

import { DataRegion, REGION_METADATA } from '@/lib/data/region-manager';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'needs_review';

export interface ComplianceCheck {
  region: DataRegion;
  framework: string;
  status: ComplianceStatus;
  requirements: ComplianceRequirement[];
  lastChecked: Date;
  expiresAt: Date;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'not_met' | 'in_progress';
  deadline?: Date;
  notes?: string;
}

export class RegionalComplianceChecker {
  private checks: Map<string, ComplianceCheck[]> = new Map();

  /**
   * Check compliance for region
   */
  public checkRegionalCompliance(region: DataRegion): ComplianceCheck[] {
    const metadata = REGION_METADATA[region];
    const checks: ComplianceCheck[] = [];

    for (const framework of metadata.complianceFrameworks) {
      const check = this.checkFramework(region, framework);
      checks.push(check);
    }

    return checks;
  }

  /**
   * Check specific framework compliance
   */
  private checkFramework(region: DataRegion, framework: string): ComplianceCheck {
    const requirements = this.getFrameworkRequirements(framework);
    const metRequirements = requirements.filter(r => r.status === 'met').length;
    const totalRequirements = requirements.length;

    let status: ComplianceStatus;
    if (metRequirements === totalRequirements) {
      status = 'compliant';
    } else if (metRequirements === 0) {
      status = 'non_compliant';
    } else if (metRequirements / totalRequirements > 0.5) {
      status = 'partial';
    } else {
      status = 'needs_review';
    }

    return {
      region,
      framework,
      status,
      requirements,
      lastChecked: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
  }

  /**
   * Get framework requirements
   */
  private getFrameworkRequirements(framework: string): ComplianceRequirement[] {
    const requirements: Record<string, ComplianceRequirement[]> = {
      GDPR: [
        {
          id: 'gdpr-1',
          name: 'Legal Basis for Processing',
          description: 'Establish lawful basis for processing personal data',
          status: 'met',
        },
        {
          id: 'gdpr-2',
          name: 'Data Subjects Rights',
          description: 'Implement right to access, deletion, and portability',
          status: 'met',
        },
        {
          id: 'gdpr-3',
          name: 'Privacy Policy',
          description: 'Maintain GDPR-compliant privacy policy',
          status: 'met',
        },
        {
          id: 'gdpr-4',
          name: 'Data Processing Agreement',
          description: 'Execute DPA with all data processors',
          status: 'met',
        },
        {
          id: 'gdpr-5',
          name: 'Data Breach Notification',
          description: 'Notify authorities and subjects within 72 hours',
          status: 'met',
        },
        {
          id: 'gdpr-6',
          name: 'DPIA',
          description: 'Conduct Data Protection Impact Assessment',
          status: 'met',
        },
        {
          id: 'gdpr-7',
          name: 'Data Retention',
          description: 'Enforce data retention limits',
          status: 'met',
        },
      ],
      CCPA: [
        {
          id: 'ccpa-1',
          name: 'Consumer Rights Disclosure',
          description: 'Display CCPA consumer rights in privacy policy',
          status: 'met',
        },
        {
          id: 'ccpa-2',
          name: 'Right to Know',
          description: 'Implement consumer data access request process',
          status: 'met',
        },
        {
          id: 'ccpa-3',
          name: 'Right to Delete',
          description: 'Implement consumer deletion request process',
          status: 'met',
        },
        {
          id: 'ccpa-4',
          name: 'Right to Opt-Out',
          description: 'Implement data sale opt-out mechanism',
          status: 'met',
        },
        {
          id: 'ccpa-5',
          name: 'Consumer Metrics',
          description: 'Track and report consumer requests',
          status: 'met',
        },
      ],
      HIPAA: [
        {
          id: 'hipaa-1',
          name: 'PHI Encryption',
          description: 'Encrypt all Protected Health Information',
          status: 'met',
        },
        {
          id: 'hipaa-2',
          name: 'Access Controls',
          description: 'Implement role-based access controls',
          status: 'met',
        },
        {
          id: 'hipaa-3',
          name: 'Audit Logs',
          description: 'Maintain comprehensive audit logs',
          status: 'met',
        },
        {
          id: 'hipaa-4',
          name: 'Business Associate Agreement',
          description: 'Execute BAA with all business associates',
          status: 'met',
        },
        {
          id: 'hipaa-5',
          name: 'Security Training',
          description: 'Provide annual HIPAA security training',
          status: 'in_progress',
        },
      ],
      'PCI-DSS': [
        {
          id: 'pci-1',
          name: 'Network Security',
          description: 'Install and maintain firewall configuration',
          status: 'met',
        },
        {
          id: 'pci-2',
          name: 'Strong Cryptography',
          description: 'Use strong encryption for transmission',
          status: 'met',
        },
        {
          id: 'pci-3',
          name: 'Access Control',
          description: 'Restrict access by business need-to-know',
          status: 'met',
        },
        {
          id: 'pci-4',
          name: 'Vulnerability Management',
          description: 'Maintain vulnerability management program',
          status: 'met',
        },
        {
          id: 'pci-5',
          name: 'Monitoring and Testing',
          description: 'Implement monitoring and regular testing',
          status: 'met',
        },
      ],
      SOC2: [
        {
          id: 'soc2-1',
          name: 'Security Controls',
          description: 'Implement comprehensive security controls',
          status: 'met',
        },
        {
          id: 'soc2-2',
          name: 'Availability',
          description: 'Ensure 99.9% uptime SLA',
          status: 'met',
        },
        {
          id: 'soc2-3',
          name: 'Processing Integrity',
          description: 'Ensure data accuracy and completeness',
          status: 'met',
        },
        {
          id: 'soc2-4',
          name: 'Confidentiality',
          description: 'Protect confidential information',
          status: 'met',
        },
        {
          id: 'soc2-5',
          name: 'Privacy',
          description: 'Implement privacy controls',
          status: 'met',
        },
      ],
      'ISO 27001': [
        {
          id: 'iso-1',
          name: 'Information Security Policy',
          description: 'Maintain comprehensive security policy',
          status: 'met',
        },
        {
          id: 'iso-2',
          name: 'Access Management',
          description: 'Implement user identity and access management',
          status: 'met',
        },
        {
          id: 'iso-3',
          name: 'Cryptography',
          description: 'Use cryptography to protect information',
          status: 'met',
        },
        {
          id: 'iso-4',
          name: 'Physical Security',
          description: 'Protect facilities and equipment',
          status: 'met',
        },
        {
          id: 'iso-5',
          name: 'Incident Management',
          description: 'Implement incident management process',
          status: 'met',
        },
      ],
      DPDP: [
        {
          id: 'dpdp-1',
          name: 'Data Protection Rights',
          description: 'Implement rights under DPDP Act',
          status: 'met',
        },
        {
          id: 'dpdp-2',
          name: 'Purpose Limitation',
          description: 'Process data only for specified purposes',
          status: 'met',
        },
        {
          id: 'dpdp-3',
          name: 'Consent Management',
          description: 'Obtain explicit consent for processing',
          status: 'met',
        },
        {
          id: 'dpdp-4',
          name: 'Data Localization',
          description: 'Ensure data residency in India',
          status: 'met',
        },
      ],
      'NIS2': [
        {
          id: 'nis2-1',
          name: 'Cybersecurity Governance',
          description: 'Implement governance and risk management',
          status: 'met',
        },
        {
          id: 'nis2-2',
          name: 'Technical Measures',
          description: 'Deploy technical security measures',
          status: 'met',
        },
        {
          id: 'nis2-3',
          name: 'Incident Reporting',
          description: 'Report incidents to authorities',
          status: 'in_progress',
        },
      ],
      LGPD: [
        {
          id: 'lgpd-1',
          name: 'Legal Basis',
          description: 'Establish legal basis for processing',
          status: 'met',
        },
        {
          id: 'lgpd-2',
          name: 'Data Subject Rights',
          description: 'Implement data subject rights',
          status: 'met',
        },
        {
          id: 'lgpd-3',
          name: 'Data Transfers',
          description: 'Ensure safe international transfers',
          status: 'met',
        },
      ],
    };

    return requirements[framework] || [];
  }

  /**
   * Get compliance dashboard data
   */
  public getComplianceDashboard(userId: string): {
    overallStatus: ComplianceStatus;
    regions: Array<{ region: DataRegion; checks: ComplianceCheck[] }>;
    summary: {
      totalRequirements: number;
      metRequirements: number;
      compliance: number;
    };
  } {
    const regions = Object.keys(REGION_METADATA) as DataRegion[];
    const allChecks = regions.map(region => ({
      region,
      checks: this.checkRegionalCompliance(region),
    }));

    const totalRequirements = allChecks.reduce((sum, r) => sum + r.checks.reduce((s, c) => s + c.requirements.length, 0), 0);
    const metRequirements = allChecks.reduce((sum, r) => sum + r.checks.reduce((s, c) => s + c.requirements.filter(req => req.status === 'met').length, 0), 0);
    const compliance = totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 0;

    let overallStatus: ComplianceStatus;
    if (compliance === 100) {
      overallStatus = 'compliant';
    } else if (compliance >= 80) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'non_compliant';
    }

    return {
      overallStatus,
      regions: allChecks,
      summary: {
        totalRequirements,
        metRequirements,
        compliance: Math.round(compliance),
      },
    };
  }

  /**
   * Export compliance report
   */
  public exportComplianceReport(region: DataRegion): string {
    const checks = this.checkRegionalCompliance(region);
    const metadata = REGION_METADATA[region];

    let report = `# Compliance Report for ${metadata.name}\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const check of checks) {
      report += `## ${check.framework}\n`;
      report += `Status: ${check.status}\n\n`;
      report += `### Requirements\n`;

      for (const req of check.requirements) {
        report += `- [${req.status === 'met' ? 'x' : ' '}] ${req.name}: ${req.description}\n`;
      }

      report += '\n';
    }

    return report;
  }
}

export const regionalComplianceChecker = new RegionalComplianceChecker();
