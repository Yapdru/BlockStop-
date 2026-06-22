/**
 * BlockStop Phase 29.5 - Compliance Training
 * GDPR, HIPAA, SOC2, PCI-DSS training and tracking
 */

import { EventEmitter } from 'events';

export interface ComplianceTrainingModule {
  moduleId: string;
  framework: 'gdpr' | 'hipaa' | 'soc2' | 'pci-dss' | 'iso27001';
  title: string;
  description: string;
  requiredHours: number;
  completionRequired: boolean;
  renewalPeriod: number; // months
  content: ComplianceContent[];
  assessments: ComplianceAssessment[];
}

export interface ComplianceContent {
  contentId: string;
  type: 'video' | 'document' | 'quiz' | 'interactive';
  title: string;
  duration: number;
  url?: string;
}

export interface ComplianceAssessment {
  assessmentId: string;
  type: 'quiz' | 'exam' | 'practical';
  passingScore: number;
  maxAttempts: number;
  questions?: number;
}

export interface ComplianceProgress {
  progressId: string;
  studentId: string;
  moduleId: string;
  framework: string;
  startDate: Date;
  completionDate?: Date;
  hours: number;
  assessmentScore?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
  expiresAt?: Date;
}

export interface ComplianceReport {
  reportId: string;
  organizationId: string;
  framework: string;
  reportDate: Date;
  totalEmployees: number;
  completedTraining: number;
  inProgressTraining: number;
  notStartedTraining: number;
  compliancePercentage: number;
  expiredCertifications: number;
  expiringCertifications: number;
  recommendations: string[];
}

export class ComplianceTrainingManager extends EventEmitter {
  private modules: Map<string, ComplianceTrainingModule> = new Map();
  private progress: Map<string, ComplianceProgress> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();

  constructor() {
    super();
    this.initializeModules();
  }

  private initializeModules(): void {
    const frameworks = [
      {
        name: 'gdpr',
        title: 'GDPR Compliance Training',
        modules: [
          { id: 'gdpr-01', title: 'GDPR Fundamentals', hours: 2 },
          { id: 'gdpr-02', title: 'Data Privacy Rights', hours: 2 },
          { id: 'gdpr-03', title: 'Breach Notification', hours: 1.5 }
        ]
      },
      {
        name: 'hipaa',
        title: 'HIPAA Security & Privacy',
        modules: [
          { id: 'hipaa-01', title: 'HIPAA Overview', hours: 2 },
          { id: 'hipaa-02', title: 'PHI Protection', hours: 3 },
          { id: 'hipaa-03', title: 'Breach Management', hours: 1.5 }
        ]
      },
      {
        name: 'soc2',
        title: 'SOC 2 Compliance',
        modules: [
          { id: 'soc2-01', title: 'SOC 2 Framework', hours: 3 },
          { id: 'soc2-02', title: 'Control Implementation', hours: 4 },
          { id: 'soc2-03', title: 'Audit Preparation', hours: 2 }
        ]
      },
      {
        name: 'pci-dss',
        title: 'PCI-DSS Compliance',
        modules: [
          { id: 'pci-01', title: 'PCI-DSS Requirements', hours: 2 },
          { id: 'pci-02', title: 'Data Security', hours: 3 },
          { id: 'pci-03', title: 'Compliance Validation', hours: 2 }
        ]
      },
      {
        name: 'iso27001',
        title: 'ISO 27001 ISMS',
        modules: [
          { id: 'iso-01', title: 'ISO 27001 Standard', hours: 3 },
          { id: 'iso-02', title: 'ISMS Implementation', hours: 4 },
          { id: 'iso-03', title: 'Certification Audit', hours: 2 }
        ]
      }
    ];

    frameworks.forEach(fw => {
      fw.modules.forEach((mod, idx) => {
        const module: ComplianceTrainingModule = {
          moduleId: mod.id,
          framework: fw.name as any,
          title: mod.title,
          description: `${mod.title} module for ${fw.title}`,
          requiredHours: mod.hours,
          completionRequired: true,
          renewalPeriod: 12,
          content: [
            {
              contentId: `content-${mod.id}-1`,
              type: 'video',
              title: `${mod.title} Video Lecture`,
              duration: mod.hours * 30
            },
            {
              contentId: `content-${mod.id}-2`,
              type: 'document',
              title: `${mod.title} Guide`,
              duration: 0
            }
          ],
          assessments: [
            {
              assessmentId: `assess-${mod.id}`,
              type: 'quiz',
              passingScore: 80,
              maxAttempts: 3,
              questions: 20
            }
          ]
        };

        this.modules.set(module.moduleId, module);
      });
    });
  }

  getModule(moduleId: string): ComplianceTrainingModule | undefined {
    return this.modules.get(moduleId);
  }

  getModulesByFramework(framework: string): ComplianceTrainingModule[] {
    return Array.from(this.modules.values()).filter(m => m.framework === framework);
  }

  recordProgress(
    studentId: string,
    moduleId: string,
    hours: number,
    assessmentScore?: number
  ): ComplianceProgress {
    const module = this.modules.get(moduleId);
    if (!module) throw new Error(`Module not found: ${moduleId}`);

    const key = `${studentId}-${moduleId}`;
    let progress = this.progress.get(key);

    if (!progress) {
      progress = {
        progressId: `prog-${Date.now()}`,
        studentId,
        moduleId,
        framework: module.framework,
        startDate: new Date(),
        hours: 0,
        status: 'in-progress'
      };

      this.progress.set(key, progress);
    }

    progress.hours += hours;
    if (assessmentScore) progress.assessmentScore = assessmentScore;

    if (progress.hours >= module.requiredHours && (assessmentScore || 0) >= 80) {
      progress.status = 'completed';
      progress.completionDate = new Date();
      progress.expiresAt = new Date(Date.now() + module.renewalPeriod * 30 * 24 * 60 * 60 * 1000);

      this.emit('compliance-training-completed', progress);
    }

    return progress;
  }

  getStudentProgress(studentId: string): ComplianceProgress[] {
    return Array.from(this.progress.values()).filter(p => p.studentId === studentId);
  }

  getOrganizationReport(organizationId: string): ComplianceReport {
    const report: ComplianceReport = {
      reportId: `report-${Date.now()}`,
      organizationId,
      framework: 'all',
      reportDate: new Date(),
      totalEmployees: 100,
      completedTraining: 75,
      inProgressTraining: 15,
      notStartedTraining: 10,
      compliancePercentage: 75,
      expiredCertifications: 5,
      expiringCertifications: 8,
      recommendations: [
        'Enroll 10 employees not yet started',
        'Renew 5 expired certifications',
        'Review expiring certifications'
      ]
    };

    this.reports.set(report.reportId, report);
    return report;
  }

  getStatistics(): Record<string, any> {
    return {
      totalModules: this.modules.size,
      frameworks: ['gdpr', 'hipaa', 'soc2', 'pci-dss', 'iso27001'],
      completedTrainings: Array.from(this.progress.values()).filter(p => p.status === 'completed').length
    };
  }
}

export default ComplianceTrainingManager;
