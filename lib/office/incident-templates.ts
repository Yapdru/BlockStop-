/**
 * BlockStop OFFICE Tier - Incident Response Templates and Management
 * Professional incident templates, role assignments, communication plans
 */

import { v4 as uuidv4 } from 'uuid';
import {
  IncidentTemplate,
  IncidentCategory,
  IncidentSeverity,
  IncidentStep,
  RoleAssignment,
  CommunicationPlan,
  EscalationContact,
  PostIncidentConfig,
} from '@/types/office-tier';

export class IncidentTemplateManager {
  private templates: Map<string, IncidentTemplate> = new Map();
  private instances: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default incident templates
   */
  private initializeDefaultTemplates(): void {
    // Ransomware Template
    this.createTemplate({
      id: `template-${uuidv4()}`,
      organizationId: 'default',
      name: 'Ransomware Incident Response',
      category: 'ransomware',
      description: 'Structured response plan for ransomware attacks',
      severity: 'critical',
      steps: [
        {
          order: 1,
          action: 'Isolate affected systems immediately',
          responsibility: ['analyst', 'manager'],
          estimatedTime: 15,
          checklist: [
            'Disconnect systems from network',
            'Document disconnection time',
            'Preserve logs and evidence',
          ],
          documentation: 'Isolation procedures in runbook',
          escalationPath: 'Notify Director immediately',
        },
        {
          order: 2,
          action: 'Identify ransomware variant',
          responsibility: ['analyst'],
          estimatedTime: 30,
          checklist: [
            'Collect ransom note',
            'Analyze file extensions',
            'Check threat intelligence databases',
          ],
          documentation: 'Ransomware identification matrix',
        },
        {
          order: 3,
          action: 'Assess scope and impact',
          responsibility: ['manager', 'analyst'],
          estimatedTime: 45,
          checklist: [
            'Identify compromised systems',
            'Assess data exposure',
            'Estimate recovery time',
          ],
          documentation: 'Impact assessment template',
        },
        {
          order: 4,
          action: 'Initiate recovery from backups',
          responsibility: ['analyst', 'manager'],
          estimatedTime: 120,
          checklist: [
            'Verify backup integrity',
            'Restore to clean systems',
            'Validate restoration',
          ],
          documentation: 'Disaster recovery plan',
          escalationPath: 'Update executive stakeholders hourly',
        },
        {
          order: 5,
          action: 'Root cause analysis',
          responsibility: ['analyst', 'manager'],
          estimatedTime: 480,
          checklist: [
            'Analyze entry point',
            'Review access logs',
            'Document findings',
          ],
          documentation: 'Forensics report template',
        },
      ],
      roles: [
        {
          role: 'director',
          responsibilities: [
            'Executive decision making',
            'Stakeholder communication',
            'Incident approval',
          ],
          authority: 'Final approval on all decisions',
          escalationRules: ['Critical decisions require board notification'],
        },
        {
          role: 'manager',
          responsibilities: [
            'Incident coordination',
            'Team management',
            'Status updates',
          ],
          authority: 'Operational decisions within authority',
          escalationRules: ['Escalate financial impact > $100k to director'],
        },
        {
          role: 'analyst',
          responsibilities: [
            'Technical investigation',
            'System isolation',
            'Evidence collection',
          ],
          authority: 'Execute technical procedures',
          escalationRules: ['Report critical findings immediately'],
        },
      ],
      communicationPlan: {
        internalNotification: true,
        externalNotification: true,
        stakeholders: ['Finance', 'Legal', 'Communications', 'Board of Directors'],
        notificationTemplate: 'ransomware_notification',
        escalationContacts: [
          {
            name: 'Chief Information Security Officer',
            title: 'CISO',
            email: 'ciso@organization.com',
            phone: '+1-555-0100',
            triggers: ['System compromise', 'Data exfiltration'],
          },
          {
            name: 'Chief Financial Officer',
            title: 'CFO',
            email: 'cfo@organization.com',
            phone: '+1-555-0200',
            triggers: ['Financial impact > $50k', 'Operational disruption'],
          },
        ],
      },
      documentation: {
        initialReport: {
          name: 'Initial Incident Report',
          sections: ['Overview', 'Scope', 'Immediate Actions', 'Next Steps'],
          requiredFields: ['Incident ID', 'Detection Time', 'Systems Affected'],
        },
        progressReports: [
          {
            name: 'Hourly Status Update',
            sections: ['Current Status', 'Completed Actions', 'Ongoing Actions', 'Blockers'],
            requiredFields: ['Report Time', 'Affected Systems', 'ETA to Resolution'],
          },
        ],
        closureReport: {
          name: 'Incident Closure Report',
          sections: ['Summary', 'Timeline', 'Resolution Steps', 'Recommendations'],
          requiredFields: ['Closure Date', 'Total Duration', 'Impact Assessment'],
        },
        postIncidentReview: {
          name: 'Post-Incident Review Meeting Notes',
          sections: ['Root Cause', 'Lessons Learned', 'Action Items', 'Prevention'],
          requiredFields: ['Attendees', 'Key Findings', 'Preventive Measures'],
        },
      },
      post_incident: {
        reviewDelay: 24,
        attendees: ['director', 'manager', 'analyst'],
        focusAreas: ['Root cause analysis', 'Response effectiveness', 'Future prevention'],
        documentationRequired: true,
        lessonsLearned: true,
        preventiveMeasures: true,
      },
    });

    // Data Breach Template
    this.createTemplate({
      id: `template-${uuidv4()}`,
      organizationId: 'default',
      name: 'Data Breach Response',
      category: 'data_breach',
      description: 'Response plan for unauthorized data access or disclosure',
      severity: 'critical',
      steps: [
        {
          order: 1,
          action: 'Confirm data breach occurrence',
          responsibility: ['analyst', 'manager'],
          estimatedTime: 30,
          checklist: [
            'Verify unauthorized access',
            'Confirm data types accessed',
            'Document evidence',
          ],
          documentation: 'Breach confirmation checklist',
        },
        {
          order: 2,
          action: 'Determine scope of exposure',
          responsibility: ['analyst', 'manager'],
          estimatedTime: 60,
          checklist: [
            'Identify affected records',
            'Count individuals impacted',
            'Determine data sensitivity',
          ],
          documentation: 'Data exposure assessment',
        },
        {
          order: 3,
          action: 'Initiate breach notification process',
          responsibility: ['manager', 'director'],
          estimatedTime: 90,
          checklist: [
            'Engage legal counsel',
            'Prepare notification templates',
            'Identify notification recipients',
          ],
          documentation: 'Breach notification procedures',
          escalationPath: 'Legal team engagement required',
        },
        {
          order: 4,
          action: 'Contain and remediate',
          responsibility: ['analyst'],
          estimatedTime: 240,
          checklist: [
            'Stop unauthorized access',
            'Secure compromised systems',
            'Implement controls',
          ],
          documentation: 'Remediation plan',
        },
      ],
      roles: [
        {
          role: 'director',
          responsibilities: ['Regulatory notification', 'Stakeholder management', 'Legal guidance'],
          authority: 'Final authority on notification decisions',
          escalationRules: ['All breaches >= 500 records require director approval'],
        },
        {
          role: 'manager',
          responsibilities: ['Coordination', 'Timeline management', 'Status reporting'],
          authority: 'Coordinate response activities',
          escalationRules: ['Escalate if unable to meet notification deadlines'],
        },
        {
          role: 'analyst',
          responsibilities: ['Technical investigation', 'Evidence preservation', 'Remediation'],
          authority: 'Execute technical response',
          escalationRules: ['Report ongoing breaches immediately'],
        },
      ],
      communicationPlan: {
        internalNotification: true,
        externalNotification: true,
        stakeholders: ['Legal', 'Compliance', 'Public Relations', 'Affected Individuals'],
        notificationTemplate: 'breach_notification',
        escalationContacts: [
          {
            name: 'Chief Legal Officer',
            title: 'CLO',
            email: 'clo@organization.com',
            triggers: ['Any data breach', 'Legal implications'],
          },
          {
            name: 'Compliance Officer',
            title: 'Chief Compliance Officer',
            email: 'compliance@organization.com',
            triggers: ['HIPAA breach', 'Regulatory breach'],
          },
        ],
      },
      documentation: {
        initialReport: {
          name: 'Breach Incident Report',
          sections: ['Breach Details', 'Data Classification', 'Individuals Affected'],
          requiredFields: ['Data Types', 'Access Methods', 'Timeline'],
        },
        progressReports: [
          {
            name: 'Investigation Update',
            sections: ['Progress', 'Findings', 'Next Steps'],
            requiredFields: ['Investigation Status', 'Scope Update'],
          },
        ],
        closureReport: {
          name: 'Breach Closure Report',
          sections: ['Summary', 'Root Cause', 'Remediation', 'Prevention'],
          requiredFields: ['Final Count', 'Notification Status'],
        },
        postIncidentReview: {
          name: 'Breach Review Notes',
          sections: ['Prevention', 'Detection', 'Response', 'Recovery'],
          requiredFields: ['Key Lessons', 'Action Items'],
        },
      },
      post_incident: {
        reviewDelay: 48,
        attendees: ['director', 'manager', 'analyst'],
        focusAreas: ['Prevention', 'Detection improvements', 'Response efficiency'],
        documentationRequired: true,
        lessonsLearned: true,
        preventiveMeasures: true,
      },
    });

    // Malware Template
    this.createTemplate({
      id: `template-${uuidv4()}`,
      organizationId: 'default',
      name: 'Malware Incident Response',
      category: 'malware',
      description: 'Response plan for malware detection and removal',
      severity: 'high',
      steps: [
        {
          order: 1,
          action: 'Identify and isolate infected systems',
          responsibility: ['analyst'],
          estimatedTime: 20,
          checklist: [
            'Confirm malware detection',
            'Isolate system from network',
            'Prevent lateral movement',
          ],
          documentation: 'Isolation procedures',
        },
        {
          order: 2,
          action: 'Analyze malware',
          responsibility: ['analyst'],
          estimatedTime: 120,
          checklist: [
            'Collect malware samples',
            'Analyze behavior',
            'Identify capabilities',
          ],
          documentation: 'Malware analysis report',
        },
        {
          order: 3,
          action: 'Eradicate malware',
          responsibility: ['analyst', 'manager'],
          estimatedTime: 240,
          checklist: [
            'Remove malware',
            'Verify clean state',
            'Patch vulnerabilities',
          ],
          documentation: 'Eradication procedures',
        },
        {
          order: 4,
          action: 'Restore and monitor',
          responsibility: ['analyst'],
          estimatedTime: 480,
          checklist: [
            'Restore from backup',
            'Re-harden systems',
            'Monitor for reinfection',
          ],
          documentation: 'Monitoring procedures',
        },
      ],
      roles: [
        {
          role: 'analyst',
          responsibilities: ['Analysis', 'Eradication', 'System restoration'],
          authority: 'Execute technical response',
          escalationRules: ['Escalate if widespread infection suspected'],
        },
        {
          role: 'manager',
          responsibilities: ['Coordination', 'Resource allocation', 'Status updates'],
          authority: 'Manage incident timeline',
          escalationRules: ['Escalate critical/widespread infections'],
        },
      ],
      communicationPlan: {
        internalNotification: true,
        externalNotification: false,
        stakeholders: ['IT Team', 'Affected Users'],
        notificationTemplate: 'malware_notification',
        escalationContacts: [],
      },
      documentation: {
        initialReport: {
          name: 'Malware Detection Report',
          sections: ['Detection', 'Scope', 'Initial Response'],
          requiredFields: ['Malware Type', 'Systems Affected'],
        },
        progressReports: [
          {
            name: 'Analysis Progress',
            sections: ['Analysis Results', 'Actions Taken'],
            requiredFields: ['Malware Behavior', 'Remediation Status'],
          },
        ],
        closureReport: {
          name: 'Incident Resolution Report',
          sections: ['Resolution', 'Prevention'],
          requiredFields: ['Eradication Verification', 'Timeline'],
        },
        postIncidentReview: {
          name: 'Review Notes',
          sections: ['Lessons', 'Improvements'],
          requiredFields: ['Root Cause', 'Preventive Measures'],
        },
      },
      post_incident: {
        reviewDelay: 24,
        attendees: ['manager', 'analyst'],
        focusAreas: ['Prevention', 'Detection'],
        documentationRequired: true,
        lessonsLearned: true,
        preventiveMeasures: true,
      },
    });
  }

  /**
   * Create incident template
   */
  public createTemplate(template: IncidentTemplate): IncidentTemplate {
    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): IncidentTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(
    organizationId: string,
    category: IncidentCategory
  ): IncidentTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => (t.organizationId === organizationId || t.organizationId === 'default') && t.category === category
    );
  }

  /**
   * Get all templates for organization
   */
  public getOrganizationTemplates(organizationId: string): IncidentTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.organizationId === organizationId || t.organizationId === 'default'
    );
  }

  /**
   * Create incident from template
   */
  public createIncidentFromTemplate(
    organizationId: string,
    templateId: string,
    incidentDetails: any
  ): any {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const incident = {
      id: `incident-${uuidv4()}`,
      organizationId,
      templateId,
      title: incidentDetails.title || template.name,
      category: template.category,
      severity: incidentDetails.severity || template.severity,
      createdAt: new Date(),
      status: 'open',
      steps: template.steps.map((s) => ({
        ...s,
        completed: false,
        startedAt: null,
        completedAt: null,
      })),
      currentStep: 0,
      assignedToRole: 'analyst',
      roles: template.roles,
      communicationPlan: template.communicationPlan,
      documentation: template.documentation,
      postIncident: template.post_incident,
      timeline: [],
      artifacts: [],
    };

    this.instances.set(incident.id, incident);
    return incident;
  }

  /**
   * Get incident instance
   */
  public getIncident(incidentId: string): any {
    return this.instances.get(incidentId) || null;
  }

  /**
   * Update incident step
   */
  public completeStep(incidentId: string, stepOrder: number): void {
    const incident = this.instances.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const step = incident.steps.find((s: any) => s.order === stepOrder);
    if (!step) {
      throw new Error(`Step ${stepOrder} not found`);
    }

    step.completed = true;
    step.completedAt = new Date();
    incident.currentStep = stepOrder;

    // Add to timeline
    incident.timeline.push({
      timestamp: new Date(),
      action: `Completed: ${step.action}`,
      details: `Took ${step.estimatedTime} minutes`,
    });
  }

  /**
   * Get incident checklist
   */
  public getIncidentChecklist(incidentId: string): Array<{
    step: number;
    action: string;
    items: string[];
    completed: boolean;
  }> {
    const incident = this.instances.get(incidentId);
    if (!incident) return [];

    return incident.steps.map((s: any) => ({
      step: s.order,
      action: s.action,
      items: s.checklist,
      completed: s.completed,
    }));
  }

  /**
   * Notify escalation contacts
   */
  public notifyEscalationContacts(incidentId: string): void {
    const incident = this.instances.get(incidentId);
    if (!incident) return;

    const contacts = incident.communicationPlan.escalationContacts;
    for (const contact of contacts) {
      // In production, send actual notifications via email/SMS
      console.log(`Notifying ${contact.name} (${contact.email}) - Incident: ${incident.title}`);
    }
  }

  /**
   * Generate incident timeline
   */
  public getIncidentTimeline(incidentId: string): Array<{
    timestamp: Date;
    action: string;
    details?: string;
  }> {
    const incident = this.instances.get(incidentId);
    if (!incident) return [];

    return incident.timeline;
  }

  /**
   * Close incident
   */
  public closeIncident(incidentId: string, closureNotes: string): void {
    const incident = this.instances.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    incident.status = 'closed';
    incident.closedAt = new Date();
    incident.closureNotes = closureNotes;

    // Schedule post-incident review
    incident.postIncidentReviewScheduled = new Date(
      Date.now() + incident.postIncident.reviewDelay * 60 * 60 * 1000
    );
  }

  /**
   * Get post-incident review details
   */
  public getPostIncidentReviewDetails(incidentId: string): any {
    const incident = this.instances.get(incidentId);
    if (!incident) return null;

    return {
      incidentId,
      title: incident.title,
      duration: incident.closedAt
        ? Math.round((incident.closedAt.getTime() - incident.createdAt.getTime()) / 1000 / 60)
        : 0,
      reviewScheduled: incident.postIncidentReviewScheduled,
      attendees: incident.postIncident.attendees,
      focusAreas: incident.postIncident.focusAreas,
      timeline: incident.timeline,
    };
  }

  /**
   * Update incident with post-incident findings
   */
  public addPostIncidentFindings(
    incidentId: string,
    findings: {
      rootCause: string;
      lessonsLearned: string[];
      preventiveMeasures: string[];
    }
  ): void {
    const incident = this.instances.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    incident.postIncidentFindings = findings;
    incident.postIncidentReviewCompleted = true;
  }
}
