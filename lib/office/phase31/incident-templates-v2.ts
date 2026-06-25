/**
 * Incident Templates v2 - Healthcare-specific response plans and playbooks
 * Provides comprehensive incident response templates for various threat types
 */

import {
  IncidentTemplateV2,
  IncidentType,
  IncidentSeverity,
  RiskProfile,
  RiskLevel,
  ResponsePlaybook,
  IncidentPhase,
  PhaseAction,
  Checkpoint,
  DecisionTree,
  Runbook,
  RunbookStep,
  RollbackProcedure,
  CommunicationPlan,
  TechnicalResponse,
  LegalComplianceSteps,
  HealthcareIncidentSteps,
  PatientNotification,
  PostIncidentReviewTemplate,
  ReviewAgendaItem,
} from '@/types/office-phase31';

/**
 * Incident Template Library
 * Provides healthcare-specific incident response templates
 */
export class IncidentTemplateLibrary {
  private templates: Map<string, IncidentTemplateV2> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Get template by incident type
   */
  public getTemplate(incidentType: IncidentType): IncidentTemplateV2 | null {
    return this.templates.get(incidentType) || null;
  }

  /**
   * Create a ransomware incident template
   */
  public createRansomwareTemplate(): IncidentTemplateV2 {
    const template: IncidentTemplateV2 = {
      id: 'template-ransomware-healthcare',
      name: 'Healthcare Ransomware Incident Response',
      incidentType: 'ransomware',
      severity: 'critical',
      applicableRegions: ['US', 'UK', 'EU'],
      applicableIndustries: ['healthcare', 'hospital_systems', 'medical_practices'],
      description:
        'Comprehensive response plan for ransomware attacks targeting healthcare organizations with patient data exposure',

      riskProfile: {
        dataExposureRisk: 'critical',
        systemAvailabilityRisk: 'critical',
        complianceRisk: 'critical',
        reputationalRisk: 'high',
        financialRisk: 'critical',
        affectedPatientRecords: '0-500,000+',
        estimatedDowntime: '24-72 hours without backups',
      },

      responsePlaybook: this.createRansomwarePlaybook(),

      communicationPlan: {
        id: 'complan-ransomware',
        internalCommunication: [
          {
            order: 1,
            when: 'Upon detection',
            recipient: 'Executive team, Board members',
            messageTemplate: 'RANSOMWARE_DETECTED_EXECUTIVE',
            method: 'Email + phone call',
            frequency: 'Hourly updates',
          },
          {
            order: 2,
            when: 'Upon detection',
            recipient: 'All clinical staff',
            messageTemplate: 'RANSOMWARE_DETECTED_STAFF',
            method: 'Email + broadcast system',
            frequency: 'Initial + every 2 hours',
          },
          {
            order: 3,
            when: 'If patient impact',
            recipient: 'Privacy officer, Legal',
            messageTemplate: 'HIPAA_BREACH_NOTIFICATION',
            method: 'Email',
            frequency: 'Initial notification',
          },
        ],
        externalCommunication: {
          notificationRequirements: [
            {
              audience: 'Patients (if PHI exposed)',
              timeframe: 'Without unreasonable delay (60 days typical)',
              content: [
                'Nature of breach',
                'Types of information involved',
                'Steps being taken',
                'Credit monitoring offer',
                'Contact information',
              ],
              approvalRequired: true,
            },
            {
              audience: 'HHS Office for Civil Rights',
              timeframe: 'Same day if 500+ affected individuals',
              content: ['Incident details', 'Affected individuals', 'Remediation steps'],
              approvalRequired: true,
            },
            {
              audience: 'Media (if material news)',
              timeframe: 'Within 24 hours of notification',
              content: ['Incident overview', 'Remediation efforts', 'Patient assurances'],
              approvalRequired: true,
            },
          ],
          messageTemplates: [
            {
              id: 'template-patient-notification',
              purpose: 'Notify patients of potential data breach',
              template: `Dear [PATIENT_NAME], We are writing to inform you of a security incident affecting [ORGANIZATION].
                        On [DATE], we detected unauthorized access to systems containing your personal health information.
                        We have contained the incident and are working with law enforcement and cyber security experts.
                        Please monitor your credit and follow the enclosed guidance.`,
              variables: ['PATIENT_NAME', 'ORGANIZATION', 'DATE', 'PHI_TYPES'],
              reviews: 3,
            },
          ],
          channelStrategy: [
            { channel: 'Direct mail', priority: 1, frequency: 'One-time' },
            { channel: 'Email', priority: 2, frequency: 'One-time' },
            { channel: 'Phone call', priority: 3, frequency: 'As requested' },
            { channel: 'Credit monitoring service', priority: 1, frequency: 'Continuous' },
          ],
        },
        mediaResponseStrategy: {
          mediaMonitoring: true,
          responseApproach: 'Transparent with measured updates',
          keyMessages: [
            'Patient safety is our top priority',
            'We have contained the incident',
            'We are cooperating with authorities',
            'We are offering free credit monitoring',
          ],
          spokesPerson: 'Chief Communications Officer',
          approvalProcess: 'Board-level approval for all external statements',
        },
        stakeholderNotification: [
          {
            stakeholderType: 'Business Associates',
            notificationTime: 'Within 12 hours',
            content: [
              'Incident overview',
              'Systems affected',
              'Required actions',
              'Notification timeline',
            ],
            owner: 'Compliance Officer',
          },
          {
            stakeholderType: 'Insurance provider',
            notificationTime: 'Within 24 hours',
            content: ['Incident details', 'Estimated costs', 'Coverage questions'],
            owner: 'Risk Manager',
          },
        ],
      },

      technicalResponses: [
        {
          id: 'tech-resp-001',
          systemType: 'EHR Systems',
          detectionMethods: [
            'File hash monitoring alerts',
            'Ransomware-specific EDR signals',
            'Abnormal file activity patterns',
            'Encryption key generation detection',
          ],
          containmentActions: [
            {
              order: 1,
              action: 'Isolate affected servers from network',
              systemsAffected: ['EHR_primary', 'EHR_backup'],
              expectedResult: 'Ransomware spread halted',
              riskOfAction: 'Temporary loss of EHR access',
              alternativeAction: 'Fail-over to secondary EHR instance',
            },
            {
              order: 2,
              action: 'Disconnect all network shares and external storage',
              systemsAffected: ['All file servers', 'Network storage'],
              expectedResult: 'Ransom notes removed, no further encryption',
              riskOfAction: 'Loss of file server access',
              alternativeAction: 'Read-only access maintained',
            },
            {
              order: 3,
              action: 'Shut down affected backup systems',
              systemsAffected: ['Backup systems'],
              expectedResult: 'Backups protected from encryption',
              riskOfAction: 'No new backups during incident',
              alternativeAction: 'Immutable backups unaffected',
            },
          ],
          investigationTools: [
            'EDR agent logs',
            'SIEM analysis',
            'Forensic imaging tools',
            'Yara rules for ransomware family',
            'Network packet analysis',
          ],
          preservationRequirements: [
            'Preserve affected system memory dump',
            'Preserve system disk images',
            'Preserve network logs for 30 days minimum',
            'Preserve email and file access logs',
            'Preserve backup tape for forensics',
          ],
          remediationSteps: [
            {
              order: 1,
              step: 'Identify ransomware family using file samples',
              prerequisites: ['Secured infected system', 'Sample collection complete'],
              validation: 'Ransomware family identified via threat intelligence',
              rollbackPlan: 'N/A',
              estimatedTime: 30,
            },
            {
              order: 2,
              step: 'Restore from clean backups',
              prerequisites: ['Backups verified clean', 'Restoration environment prepared'],
              validation: 'All systems restored to pre-infection state',
              rollbackPlan: 'Use alternative backups if primary backup compromised',
              estimatedTime: 480,
            },
            {
              order: 3,
              step: 'Patch and harden systems',
              prerequisites: ['Systems fully restored', 'Patches available'],
              validation: 'All security patches applied',
              rollbackPlan: 'Revert to pre-patch state if issues detected',
              estimatedTime: 240,
            },
          ],
          validationChecks: [
            'No suspicious processes running',
            'File signatures match baseline',
            'No outbound C2 communications',
            'EDR clean bill of health',
            'Backup systems operational',
          ],
        },
      ],

      legalCompliance: {
        notificationAuthority: 'HHS Office for Civil Rights',
        regulatiesInvolved: [
          'HIPAA Breach Notification Rule',
          'State breach notification laws',
          'LGPD (if EU patients)',
        ],
        documentationRequirements: [
          'Incident detection logs',
          'Containment actions taken',
          'Breach notification records',
          'Individual notification documentation',
          'Media notification documentation',
          'Regulatory report copies',
        ],
        legalHold: true,
        externalCounselNeeded: true,
        complianceDeadlines: [
          {
            regulation: 'HIPAA Breach Notification',
            deadline: '60 days from discovery',
            requirement: 'Notify all affected individuals',
            owner: 'Privacy Officer',
          },
          {
            regulation: 'HHS OCR Notification',
            deadline: 'Same day if 500+ affected',
            requirement: 'Notify HHS OCR',
            owner: 'Compliance Officer',
          },
          {
            regulation: 'Media notification',
            deadline: 'Same day as individuals if 500+',
            requirement: 'Notify prominent media outlets',
            owner: 'Communications',
          },
        ],
      },

      healthcareSpecific: {
        baaNotificationRequired: true,
        businessAssociatesAffected: ['Cloud EHR provider', 'Backup provider', 'Email provider'],
        patientNotificationRequirements: [
          {
            method: 'U.S. mail',
            timing: '60 days from discovery',
            contentRequirements: [
              'Description of what happened',
              'Types of information involved',
              'Steps they should take',
              'What organization is doing',
              'Contact information',
            ],
          },
          {
            method: 'Credit monitoring service',
            timing: 'Offered immediately',
            contentRequirements: ['Enrollment information', 'Duration of service', 'Contact details'],
          },
        ],
        regulatoryReports: [
          'HHS OCR Breach Notification Report',
          'State AG reports (if applicable)',
          'FBI/IC3 report',
        ],
        hipaaBreachThreshold: 500,
        breachReportingDeadline: '60 days from discovery',
        mediaNotificationThreshold: 500,
        mseCtContacts: [
          'FBI Cyber Division',
          'US-CERT',
          'HHS-ISAC',
          'Information Sharing Organization',
        ],
      },

      postIncidentReview: {
        id: 'pir-ransomware',
        reviewSchedule: '5 business days post-resolution',
        participants: [
          'IR team lead',
          'System owners',
          'Security team',
          'Executive team',
          'Board representative',
        ],
        agenda: [
          {
            order: 1,
            topic: 'Timeline and incident flow',
            owner: 'IR Lead',
            timebox: 30,
            questions: [
              'When was incident detected?',
              'What was response time?',
              'Were escalation procedures followed?',
            ],
          },
          {
            order: 2,
            topic: 'What went well',
            owner: 'IR Lead',
            timebox: 20,
            questions: [
              'Detection and response speed',
              'Backup effectiveness',
              'Communication execution',
            ],
          },
          {
            order: 3,
            topic: 'Areas for improvement',
            owner: 'IR Lead',
            timebox: 30,
            questions: [
              'Detection gaps',
              'Containment delays',
              'Communication issues',
              'Recovery challenges',
            ],
          },
          {
            order: 4,
            topic: 'Action items and remediation',
            owner: 'Security Director',
            timebox: 20,
            questions: [
              'What preventive measures needed?',
              'Timeline for implementation',
              'Responsibility assignments',
            ],
          },
        ],
        reportingRequirements: [
          'Written incident report',
          'Timeline diagram',
          'Action items tracker',
          'Board presentation',
        ],
        actionItemTracking: true,
      },

      estimatedResolutionTime: 1440, // 24 hours
      requiredSkills: [
        'Forensic analysis',
        'Incident response',
        'System administration',
        'Network security',
        'Legal compliance',
        'Crisis communication',
      ],
      requiredTools: [
        'EDR platform',
        'SIEM system',
        'Forensic toolkit',
        'Backup management system',
        'Communication platform',
      ],
      successMetrics: [
        'Ransomware contained within 1 hour',
        'All systems restored within 24 hours',
        'No additional systems encrypted',
        'All backups intact',
        'Patient notification completed within 60 days',
      ],
      lessons: [
        'Regular backup testing is critical',
        'Immutable backups are essential',
        'Network segmentation limits spread',
        'EDR detection is invaluable',
        'Communication planning prevents chaos',
      ],
      relatedTemplates: ['template-data-breach', 'template-system-failure'],
    };

    this.templates.set('ransomware', template);
    return template;
  }

  /**
   * Create a data breach incident template
   */
  public createDataBreachTemplate(): IncidentTemplateV2 {
    const template: IncidentTemplateV2 = {
      id: 'template-data-breach-healthcare',
      name: 'Healthcare Data Breach Response',
      incidentType: 'data_breach',
      severity: 'critical',
      applicableRegions: ['US', 'UK', 'EU'],
      applicableIndustries: ['healthcare', 'hospital_systems'],
      description:
        'Comprehensive response for unauthorized access to protected health information',

      riskProfile: {
        dataExposureRisk: 'critical',
        systemAvailabilityRisk: 'low',
        complianceRisk: 'critical',
        reputationalRisk: 'critical',
        financialRisk: 'critical',
        affectedPatientRecords: '0-1,000,000+',
        estimatedDowntime: 'Systems remain operational',
      },

      responsePlaybook: this.createDataBreachPlaybook(),

      communicationPlan: this.createDataBreachCommunicationPlan(),

      technicalResponses: [
        {
          id: 'tech-resp-breach',
          systemType: 'Database Systems',
          detectionMethods: [
            'Unauthorized access logs',
            'Data exfiltration monitoring',
            'DLP alerts',
            'Query logging analysis',
          ],
          containmentActions: [
            {
              order: 1,
              action: 'Disable compromised user accounts',
              systemsAffected: ['All systems'],
              expectedResult: 'No further unauthorized access',
              riskOfAction: 'User disruption',
              alternativeAction: 'Reset passwords instead',
            },
          ],
          investigationTools: [
            'Database audit logs',
            'DLP logs',
            'Network IDS logs',
            'EDR agent logs',
          ],
          preservationRequirements: [
            'Preserve database transaction logs',
            'Preserve all access logs',
            'Preserve network monitoring data',
            'Preserve user activity logs',
          ],
          remediationSteps: [
            {
              order: 1,
              step: 'Identify scope of breach',
              prerequisites: ['Logs collected', 'Database access verified'],
              validation: 'Number of affected records determined',
              rollbackPlan: 'N/A',
              estimatedTime: 120,
            },
          ],
          validationChecks: [
            'No unauthorized database access',
            'All user accounts secured',
            'Data integrity verified',
            'Monitoring in place',
          ],
        },
      ],

      legalCompliance: {
        notificationAuthority: 'HHS Office for Civil Rights',
        regulatiesInvolved: ['HIPAA', 'State laws', 'GDPR if EU residents affected'],
        documentationRequirements: [
          'Breach discovery documentation',
          'Investigation findings',
          'Notification records',
          'Legal review notes',
        ],
        legalHold: true,
        externalCounselNeeded: true,
        complianceDeadlines: [
          {
            regulation: 'HIPAA',
            deadline: '60 days',
            requirement: 'Individual notification',
            owner: 'Privacy Officer',
          },
        ],
      },

      healthcareSpecific: {
        baaNotificationRequired: true,
        businessAssociatesAffected: ['Cloud providers', 'Email services'],
        patientNotificationRequirements: [
          {
            method: 'First-class mail',
            timing: '60 days',
            contentRequirements: ['Full breach description', 'Records affected', 'Preventive steps'],
          },
        ],
        regulatoryReports: ['HHS OCR Report'],
        hipaaBreachThreshold: 500,
        breachReportingDeadline: '60 days',
        mediaNotificationThreshold: 500,
        mseCtContacts: ['FBI', 'State AG'],
      },

      postIncidentReview: this.createPostIncidentReview(),

      estimatedResolutionTime: 2880, // 48 hours for investigation
      requiredSkills: ['Database administration', 'Forensics', 'Legal', 'Communications'],
      requiredTools: ['Database audit tools', 'Forensic analysis', 'DLP platform'],
      successMetrics: [
        'Breach scope determined within 24 hours',
        'All affected individuals notified within 60 days',
        'Regulatory reports filed on time',
        'Root cause identified and remediated',
      ],
      lessons: [
        'Early detection is critical',
        'Document everything',
        'Customer communication is vital',
        'Legal involvement from start',
      ],
      relatedTemplates: ['template-ransomware', 'template-insider-threat'],
    };

    this.templates.set('data_breach', template);
    return template;
  }

  // ========== Template helper methods ==========

  private createRansomwarePlaybook(): ResponsePlaybook {
    return {
      id: 'playbook-ransomware',
      phases: [
        {
          order: 1,
          name: 'Detection & Analysis',
          duration: '0-2 hours',
          objectives: [
            'Confirm ransomware infection',
            'Identify affected systems',
            'Determine ransomware family',
          ],
          actions: [
            {
              id: 'action-001',
              title: 'Confirm ransomware',
              owner: 'SOC Analyst',
              description: 'Verify ransomware infection through multiple indicators',
              steps: [
                'Review EDR alerts and system logs',
                'Identify ransom notes or file extensions',
                'Document initial discovery time and method',
              ],
              expectedOutcome: 'Ransomware confirmed with family identified',
              backoutStep: 'Continue monitoring if false positive',
            },
          ],
          checkpoints: [
            {
              id: 'cp-001',
              name: 'Infection confirmed',
              successCriteria: ['Ransom note found', 'File hashes matched to known family'],
              verification: 'Analyst confirmation with threat intel correlation',
            },
          ],
          goNoGoDecision: 'Proceed to containment if confirmed',
        },
        {
          order: 2,
          name: 'Containment',
          duration: '1-4 hours',
          objectives: [
            'Stop ransomware spread',
            'Isolate affected systems',
            'Preserve evidence',
          ],
          actions: [
            {
              id: 'action-002',
              title: 'Isolate systems',
              owner: 'System Administrator',
              description: 'Disconnect infected systems from network',
              steps: [
                'Identify all affected systems',
                'Disconnect network cables',
                'Disable wireless connectivity',
                'Document all actions',
              ],
              expectedOutcome: 'Systems isolated, spread halted',
              backoutStep: 'Reconnect if incorrect isolation',
            },
          ],
          checkpoints: [
            {
              id: 'cp-002',
              name: 'Systems isolated',
              successCriteria: ['Network disconnected', 'No further encryption detected'],
              verification: 'Network monitoring confirms no outbound traffic',
            },
          ],
          goNoGoDecision: 'Proceed to eradication if no spread detected',
        },
        {
          order: 3,
          name: 'Eradication & Recovery',
          duration: '4-24 hours',
          objectives: [
            'Remove ransomware',
            'Restore from backups',
            'Verify system integrity',
          ],
          actions: [
            {
              id: 'action-003',
              title: 'Restore systems',
              owner: 'System Administrator',
              description: 'Restore systems from clean backups',
              steps: [
                'Verify backup integrity',
                'Begin restoration process',
                'Validate restored data',
              ],
              expectedOutcome: 'All systems restored to pre-infection state',
              backoutStep: 'Use alternative backup if current fails',
            },
          ],
          checkpoints: [
            {
              id: 'cp-003',
              name: 'Restoration complete',
              successCriteria: ['All systems restored', 'Data integrity verified'],
              verification: 'Checksum validation and functionality testing',
            },
          ],
        },
      ],
      decisionTrees: [],
      runbooks: [],
      escalationCriteria: [
        'Multiple departments affected',
        'Critical infrastructure impacted',
        'Patient care affected',
      ],
      rollbackProcedures: [
        {
          id: 'rollback-001',
          fromState: 'System isolated',
          toState: 'System operational',
          steps: [
            'Reconnect network cables',
            'Verify no ransomware activity',
            'Resume normal operations',
          ],
          estimatedTime: 15,
          owner: 'System Administrator',
          riskLevel: 'medium',
        },
      ],
    };
  }

  private createDataBreachPlaybook(): ResponsePlaybook {
    return {
      id: 'playbook-data-breach',
      phases: [
        {
          order: 1,
          name: 'Detection & Scope',
          duration: '0-4 hours',
          objectives: [
            'Confirm breach',
            'Identify affected data',
            'Determine scale',
          ],
          actions: [],
          checkpoints: [],
        },
      ],
      decisionTrees: [],
      runbooks: [],
      escalationCriteria: ['500+ individuals affected', 'Sensitive data exposed'],
      rollbackProcedures: [],
    };
  }

  private createDataBreachCommunicationPlan(): CommunicationPlan {
    return {
      id: 'complan-breach',
      internalCommunication: [],
      externalCommunication: {
        notificationRequirements: [],
        messageTemplates: [],
        channelStrategy: [],
      },
      mediaResponseStrategy: {
        mediaMonitoring: true,
        responseApproach: 'Transparent',
        keyMessages: [],
        spokesPerson: 'CEO',
        approvalProcess: 'Board approval',
      },
      stakeholderNotification: [],
    };
  }

  private createPostIncidentReview(): PostIncidentReviewTemplate {
    return {
      id: 'pir-template',
      reviewSchedule: '5 business days',
      participants: ['IR Team', 'Executive', 'Board'],
      agenda: [
        {
          order: 1,
          topic: 'Timeline',
          owner: 'IR Lead',
          timebox: 30,
          questions: ['Detection time?', 'Response time?'],
        },
      ],
      reportingRequirements: ['Written report', 'Board presentation'],
      actionItemTracking: true,
    };
  }

  private initializeTemplates(): void {
    this.createRansomwareTemplate();
    this.createDataBreachTemplate();
  }

  public getAllTemplates(): IncidentTemplateV2[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesByRegion(region: string): IncidentTemplateV2[] {
    return Array.from(this.templates.values()).filter((t) =>
      t.applicableRegions.includes(region)
    );
  }
}

export default IncidentTemplateLibrary;
