/**
 * Multi-Office Coordination - Synchronized incident response across offices
 * Handles cross-office incident management and communication
 */

import {
  MultiOfficeCoordination,
  OfficeInfo,
  ContactInfo,
  OperatingHours,
  CoordinatedIncident,
  CoordinationType,
  SyncIncident,
  CommunicationEntry,
  TimelineEvent,
  SharedEvidence,
  CoordinationDecision,
  CommunicationChannel,
  AccessLogEntry,
  CoordinationPlaybook,
  PlaybookStep,
  CrossOfficeMetrics,
  OfficeMetrics,
  IncidentStatus,
  IncidentSeverity,
} from '@/types/office-phase31';

/**
 * Multi-Office Coordination Manager
 * Manages synchronized incident response across multiple offices
 */
export class MultiOfficeCoordinationManager {
  private coordination: MultiOfficeCoordination;
  private communicationChannels: Map<string, CommunicationChannel> = new Map();
  private playbookIndex: Map<string, CoordinationPlaybook> = new Map();

  constructor(organizationId: string) {
    this.coordination = {
      id: `multi-office-${organizationId}`,
      organizationId,
      offices: this.initializeOffices(),
      coordinatedIncidents: [],
      crossOfficeMetrics: this.initializeMetrics(),
      communicationChannels: [],
      playbooks: this.initializePlaybooks(),
    };
  }

  /**
   * Register office location
   */
  public registerOffice(
    name: string,
    location: string,
    country: string,
    timezone: string,
    contactPerson: ContactInfo,
    operatingHours: OperatingHours
  ): OfficeInfo {
    const office: OfficeInfo = {
      id: `office-${Date.now()}`,
      name,
      location,
      country,
      timezone,
      securityTeadSize: 0,
      incidentResponseCapabilities: [],
      backupOffices: [],
      contactPerson,
      operatingHours,
      dataResidencyRequirements: [`data_must_reside_in_${country}`],
    };

    this.coordination.offices.push(office);
    return office;
  }

  /**
   * Create a coordinated incident across offices
   */
  public createCoordinatedIncident(
    primaryIncidentId: string,
    affectedOffices: string[],
    coordinationType: CoordinationType,
    owner: string
  ): CoordinatedIncident {
    const incident: CoordinatedIncident = {
      id: `coord-incident-${Date.now()}`,
      primaryIncidentId,
      officesInvolved: affectedOffices,
      coordinationType,
      startTime: new Date(),
      status: 'detected',
      synchronizedIncidents: [],
      communicationLog: [],
      coordinationTimeline: [],
      sharedEvidence: [],
      decisions: [],
      owner,
    };

    // Initialize communication channels for involved offices
    this.setupCommunicationChannels(affectedOffices);

    // Log timeline event
    incident.coordinationTimeline.push({
      order: 1,
      timestamp: new Date(),
      officeId: affectedOffices[0],
      eventType: 'incident_initiated',
      description: 'Coordinated incident initiated',
      actor: owner,
      impact: 'Multiple offices affected',
    });

    this.coordination.coordinatedIncidents.push(incident);

    // Activate appropriate playbook
    this.activatePlaybook(incident, coordinationType);

    return incident;
  }

  /**
   * Register incident in office
   */
  public registerOfficeIncident(
    coordinatedIncidentId: string,
    officeId: string,
    incidentId: string,
    severity: IncidentSeverity,
    affectedSystems: string[]
  ): void {
    const coordIncident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!coordIncident) return;

    const syncIncident: SyncIncident = {
      officeId,
      incidentId,
      severity,
      affectedSystems,
      status: 'detected',
      lastUpdated: new Date(),
    };

    coordIncident.synchronizedIncidents.push(syncIncident);

    // Add to timeline
    coordIncident.coordinationTimeline.push({
      order: coordIncident.coordinationTimeline.length + 1,
      timestamp: new Date(),
      officeId,
      eventType: 'incident_registered',
      description: `Incident registered with severity ${severity}`,
      actor: 'system',
      impact: `${affectedSystems.length} systems affected`,
    });
  }

  /**
   * Send coordination message
   */
  public sendMessage(
    coordinatedIncidentId: string,
    fromOfficeId: string,
    channelId: string,
    content: string,
    priority: 'urgent' | 'high' | 'normal'
  ): CommunicationEntry | null {
    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!incident) return null;

    const entry: CommunicationEntry = {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      from: fromOfficeId,
      officeId: fromOfficeId,
      channel: channelId,
      content,
      attachments: [],
      readBy: [],
      priority,
    };

    incident.communicationLog.push(entry);

    // Log in communication channel
    const channel = this.communicationChannels.get(channelId);
    if (channel) {
      channel.accessLog.push({
        userId: fromOfficeId,
        timestamp: new Date(),
        action: 'posted',
        details: content.substring(0, 100),
      });
    }

    return entry;
  }

  /**
   * Mark message as read
   */
  public markMessageRead(coordinatedIncidentId: string, messageId: string, readBy: string): void {
    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!incident) return;

    const message = incident.communicationLog.find((m) => m.id === messageId);
    if (message && !message.readBy.includes(readBy)) {
      message.readBy.push(readBy);
    }
  }

  /**
   * Share evidence across offices
   */
  public shareEvidence(
    coordinatedIncidentId: string,
    evidenceId: string,
    uploadedBy: string,
    fileType: string,
    fileSize: number,
    accessibleOffices: string[]
  ): SharedEvidence {
    const evidence: SharedEvidence = {
      id: `evidence-${Date.now()}`,
      evidenceId,
      uploadedBy,
      uploadedDate: new Date(),
      fileType,
      fileSize,
      accessibleTo: accessibleOffices,
    };

    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (incident) {
      incident.sharedEvidence.push(evidence);

      // Log access for audit
      incident.communicationLog.push({
        id: `audit-${Date.now()}`,
        timestamp: new Date(),
        from: uploadedBy,
        officeId: uploadedBy,
        channel: 'audit_log',
        content: `Evidence shared: ${evidenceId}`,
        attachments: [],
        readBy: [],
        priority: 'normal',
      });
    }

    return evidence;
  }

  /**
   * Record coordination decision
   */
  public recordDecision(
    coordinatedIncidentId: string,
    decisionType: string,
    content: string,
    rationale: string,
    affectsOffices: string[],
    implementationDeadline: Date,
    decidedBy: string
  ): CoordinationDecision {
    const decision: CoordinationDecision = {
      id: `decision-${Date.now()}`,
      timestamp: new Date(),
      decidedBy,
      decisionType,
      affectsOffices,
      content,
      rationale,
      implementationDeadline,
      status: 'pending',
    };

    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (incident) {
      incident.decisions.push(decision);

      // Notify affected offices
      affectsOffices.forEach((officeId) => {
        this.sendMessage(
          coordinatedIncidentId,
          'decision_system',
          'decisions',
          `Decision: ${content}`,
          'urgent'
        );
      });
    }

    return decision;
  }

  /**
   * Update incident status
   */
  public updateIncidentStatus(
    coordinatedIncidentId: string,
    officeId: string,
    newStatus: IncidentStatus
  ): void {
    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!incident) return;

    // Update all incidents in that office
    incident.synchronizedIncidents.forEach((syncIncident) => {
      if (syncIncident.officeId === officeId) {
        syncIncident.status = newStatus;
        syncIncident.lastUpdated = new Date();
      }
    });

    // Add timeline event
    incident.coordinationTimeline.push({
      order: incident.coordinationTimeline.length + 1,
      timestamp: new Date(),
      officeId,
      eventType: 'status_change',
      description: `Status changed to ${newStatus}`,
      actor: officeId,
      impact: `Incident in ${officeId} now ${newStatus}`,
    });

    // Check if all offices have reached final status
    const allResolved = incident.synchronizedIncidents.every(
      (s) => s.status === 'recovered' || s.status === 'closed'
    );

    if (allResolved && incident.status !== 'closed') {
      incident.status = 'closed';
      incident.endTime = new Date();
    }
  }

  /**
   * Get coordination communication channels
   */
  public getCommunicationChannels(coordinatedIncidentId: string): CommunicationChannel[] {
    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!incident) return [];

    const channelIds = new Set<string>();
    incident.communicationLog.forEach((msg) => channelIds.add(msg.channel));

    const channels: CommunicationChannel[] = [];
    channelIds.forEach((id) => {
      const channel = this.communicationChannels.get(id);
      if (channel) channels.push(channel);
    });

    return channels;
  }

  /**
   * Get coordination status summary
   */
  public getCoordinationStatus(
    coordinatedIncidentId: string
  ): {
    id: string;
    status: IncidentStatus;
    officesInvolved: number;
    systemsAffected: number;
    messagesExchanged: number;
    decisionsRecorded: number;
    timeline: TimelineEvent[];
  } | null {
    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!incident) return null;

    const totalSystems = incident.synchronizedIncidents.reduce(
      (sum, s) => sum + s.affectedSystems.length,
      0
    );

    return {
      id: incident.id,
      status: incident.status,
      officesInvolved: incident.officesInvolved.length,
      systemsAffected: totalSystems,
      messagesExchanged: incident.communicationLog.length,
      decisionsRecorded: incident.decisions.length,
      timeline: incident.coordinationTimeline,
    };
  }

  /**
   * Calculate cross-office metrics
   */
  public calculateCrossOfficeMetrics(startDate: Date, endDate: Date): CrossOfficeMetrics {
    const incidentsInPeriod = this.coordination.coordinatedIncidents.filter(
      (i) => i.startTime >= startDate && i.startTime <= endDate
    );

    const metrics: CrossOfficeMetrics = {
      period: { startDate, endDate },
      coordinatedIncidents: incidentsInPeriod.length,
      averageResolutionTime: 0,
      officeParticipation: {},
      communicationVolume: 0,
      escalationsRequired: 0,
      playbookActivations: incidentsInPeriod.length,
    };

    // Calculate average resolution time
    const resolvingIncidents = incidentsInPeriod.filter((i) => i.endTime);
    if (resolvingIncidents.length > 0) {
      const totalTime = resolvingIncidents.reduce((sum, i) => {
        return sum + (i.endTime!.getTime() - i.startTime.getTime());
      }, 0);
      metrics.averageResolutionTime = totalTime / resolvingIncidents.length / (1000 * 60); // minutes
    }

    // Count messages
    incidentsInPeriod.forEach((i) => {
      metrics.communicationVolume += i.communicationLog.length;
    });

    // Count escalations
    incidentsInPeriod.forEach((i) => {
      const escalatedDecisions = i.decisions.filter((d) => d.status === 'approved');
      metrics.escalationsRequired += escalatedDecisions.length;
    });

    // Office participation
    this.coordination.offices.forEach((office) => {
      const participation = incidentsInPeriod.filter((i) =>
        i.officesInvolved.includes(office.id)
      );

      metrics.officeParticipation[office.id] = {
        officeId: office.id,
        incidentsInvolved: participation.length,
        averageResponseTime: 0,
        resourcesContributed: 0,
        escalationsInitiated: 0,
      };
    });

    this.coordination.crossOfficeMetrics = metrics;
    return metrics;
  }

  /**
   * Get incident coordination report
   */
  public getCoordinationReport(coordinatedIncidentId: string): {
    incidentId: string;
    duration: number;
    offices: number;
    systemsAffected: number;
    timeline: TimelineEvent[];
    decisions: CoordinationDecision[];
    evidence: SharedEvidence[];
    communicationSummary: { totalMessages: number; byChannel: Record<string, number> };
  } | null {
    const incident = this.coordination.coordinatedIncidents.find(
      (i) => i.id === coordinatedIncidentId
    );

    if (!incident) return null;

    const duration = incident.endTime
      ? (incident.endTime.getTime() - incident.startTime.getTime()) / (1000 * 60) // minutes
      : (new Date().getTime() - incident.startTime.getTime()) / (1000 * 60);

    const channelCounts: Record<string, number> = {};
    incident.communicationLog.forEach((msg) => {
      channelCounts[msg.channel] = (channelCounts[msg.channel] || 0) + 1;
    });

    const totalSystems = incident.synchronizedIncidents.reduce(
      (sum, s) => sum + s.affectedSystems.length,
      0
    );

    return {
      incidentId: incident.id,
      duration,
      offices: incident.officesInvolved.length,
      systemsAffected: totalSystems,
      timeline: incident.coordinationTimeline,
      decisions: incident.decisions,
      evidence: incident.sharedEvidence,
      communicationSummary: {
        totalMessages: incident.communicationLog.length,
        byChannel: channelCounts,
      },
    };
  }

  // ========== Private helper methods ==========

  private initializeOffices(): OfficeInfo[] {
    return [
      {
        id: 'office-us-east',
        name: 'US East Coast',
        location: 'New York, NY',
        country: 'USA',
        timezone: 'America/New_York',
        securityTeadSize: 8,
        incidentResponseCapabilities: ['full_incident_response', 'forensics', 'edr_management'],
        backupOffices: ['office-us-central'],
        contactPerson: {
          name: 'John Smith',
          email: 'john.smith@healthcare.org',
          phone: '+1-212-555-0100',
          role: 'Security Director',
          escalationLevel: 1,
        },
        operatingHours: {
          timezone: 'America/New_York',
          mondayFriday: { startTime: '08:00', endTime: '18:00' },
          weekend: { startTime: '09:00', endTime: '17:00' },
          holidays: [],
        },
        dataResidencyRequirements: ['data_must_reside_in_USA'],
      },
    ];
  }

  private setupCommunicationChannels(officeIds: string[]): void {
    const channelId = `channel-${Date.now()}`;

    const channel: CommunicationChannel = {
      id: channelId,
      name: `Incident Response - ${officeIds.join(', ')}`,
      type: 'slack',
      members: officeIds,
      encryptionRequired: true,
      accessLog: [],
    };

    this.communicationChannels.set(channelId, channel);
    this.coordination.communicationChannels.push(channel);
  }

  private activatePlaybook(incident: CoordinatedIncident, coordinationType: CoordinationType): void {
    const playbookId = `playbook-${coordinationType}`;
    const playbook = this.playbookIndex.get(playbookId);

    if (playbook) {
      incident.communicationLog.push({
        id: `pb-${Date.now()}`,
        timestamp: new Date(),
        from: 'system',
        officeId: incident.officesInvolved[0],
        channel: 'decisions',
        content: `Playbook activated: ${playbook.name}`,
        attachments: [],
        readBy: [],
        priority: 'urgent',
      });
    }
  }

  private initializePlaybooks(): CoordinationPlaybook[] {
    return [
      {
        id: 'playbook-sequential',
        name: 'Sequential Incident Response',
        triggerConditions: ['single_primary_office', 'cascading_impact'],
        steps: [
          {
            order: 1,
            title: 'Acknowledge and Assess',
            description: 'Acknowledge incident and assess impact',
            owner: 'Primary Office',
            expectedDuration: 15,
            successCriteria: ['Impact assessed', 'Severity determined'],
            alternativeActions: [],
            dependsOn: [],
          },
          {
            order: 2,
            title: 'Notify Secondary Offices',
            description: 'Notify secondary offices of potential impact',
            owner: 'Primary Office',
            expectedDuration: 10,
            successCriteria: ['Notifications sent', 'Acknowledgment received'],
            alternativeActions: [],
            dependsOn: [1],
          },
          {
            order: 3,
            title: 'Coordinate Response',
            description: 'Coordinate incident response across offices',
            owner: 'Incident Coordinator',
            expectedDuration: 60,
            successCriteria: ['Response plans coordinated', 'Resources allocated'],
            alternativeActions: [],
            dependsOn: [2],
          },
        ],
        officesInvolved: [],
        estimatedDuration: 85,
        owner: 'Security Team',
        lastTestedDate: new Date(),
        nextTestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  private initializeMetrics(): CrossOfficeMetrics {
    return {
      period: { startDate: new Date(), endDate: new Date() },
      coordinatedIncidents: 0,
      averageResolutionTime: 0,
      officeParticipation: {},
      communicationVolume: 0,
      escalationsRequired: 0,
      playbookActivations: 0,
    };
  }

  public getCoordinationData(): MultiOfficeCoordination {
    return this.coordination;
  }
}

export default MultiOfficeCoordinationManager;
