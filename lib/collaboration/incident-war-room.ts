import { EventEmitter } from 'events';
import {
  IncidentCollaborationData,
  Participant,
  Evidence,
  CommunicationMessage,
  TeamAssignment,
  ActivityEvent,
} from './types';
import { COLLABORATION_CONFIG, WEBSOCKET_EVENTS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class IncidentWarRoom extends EventEmitter {
  private incidentId: string;
  private participants: Map<string, Participant> = new Map();
  private evidence: Map<string, Evidence> = new Map();
  private messages: Map<string, CommunicationMessage> = new Map();
  private assignments: Map<string, TeamAssignment> = new Map();
  private activityLog: ActivityEvent[] = [];
  private wsManager: WebSocketManager;
  private createdAt: Date;
  private updatedAt: Date;
  private status: 'active' | 'archived' | 'closed' = 'active';

  constructor(incidentId: string, userId: string) {
    super();
    this.incidentId = incidentId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.wsManager = new WebSocketManager(userId);
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.EVIDENCE_ADDED, (payload) => this.handleEvidenceAdded(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.MESSAGE_SENT, (payload) => this.handleMessageSent(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.PRESENCE_JOINED, (payload) => this.handleParticipantJoined(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.PRESENCE_LEFT, (payload) => this.handleParticipantLeft(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.ASSIGNMENT_CREATED, (payload) => this.handleAssignmentCreated(payload));
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize war room:', error);
      throw error;
    }
  }

  addParticipant(participant: Participant): void {
    if (this.participants.size >= COLLABORATION_CONFIG.MAX_PARTICIPANTS) {
      throw new Error('Maximum participants reached');
    }
    this.participants.set(participant.id, { ...participant, lastActive: new Date() });
    this.wsManager.broadcast(WEBSOCKET_EVENTS.PRESENCE_JOINED, participant);
    this.updatedAt = new Date();
  }

  removeParticipant(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      this.participants.delete(participantId);
      this.wsManager.broadcast(WEBSOCKET_EVENTS.PRESENCE_LEFT, { participantId });
      this.updatedAt = new Date();
    }
  }

  updateParticipantActivity(participantId: string): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      participant.lastActive = new Date();
      this.wsManager.send(WEBSOCKET_EVENTS.PRESENCE_UPDATE, {
        participantId,
        lastActive: participant.lastActive,
      });
    }
  }

  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  getActiveParticipants(): Participant[] {
    return this.getParticipants().filter((p) => p.isOnline);
  }

  getParticipantCount(): number {
    return this.participants.size;
  }

  addEvidence(evidence: Evidence): void {
    this.evidence.set(evidence.id, evidence);
    this.recordActivity({
      action: 'create',
      resourceType: 'evidence',
      resourceId: evidence.id,
      userId: evidence.uploadedBy,
    });
    this.wsManager.broadcast(WEBSOCKET_EVENTS.EVIDENCE_ADDED, evidence);
    this.updatedAt = new Date();
  }

  getEvidence(evidenceId: string): Evidence | undefined {
    return this.evidence.get(evidenceId);
  }

  getAllEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }

  removeEvidence(evidenceId: string, userId: string): void {
    const evidence = this.evidence.get(evidenceId);
    if (evidence) {
      this.evidence.delete(evidenceId);
      this.recordActivity({
        action: 'delete',
        resourceType: 'evidence',
        resourceId: evidenceId,
        userId,
      });
      this.wsManager.broadcast(WEBSOCKET_EVENTS.EVIDENCE_DELETED, { evidenceId });
      this.updatedAt = new Date();
    }
  }

  addMessage(message: CommunicationMessage): void {
    if (JSON.stringify(message).length > COLLABORATION_CONFIG.MAX_MESSAGE_SIZE) {
      throw new Error('Message exceeds maximum size');
    }
    this.messages.set(message.id, message);
    this.recordActivity({
      action: 'create',
      resourceType: 'message',
      resourceId: message.id,
      userId: message.userId,
    });
    this.wsManager.broadcast(WEBSOCKET_EVENTS.MESSAGE_SENT, message);
    this.updatedAt = new Date();
  }

  getMessages(channelId?: string): CommunicationMessage[] {
    const msgs = Array.from(this.messages.values());
    return channelId ? msgs.filter((m) => m.channelId === channelId) : msgs;
  }

  createAssignment(assignment: TeamAssignment): void {
    this.assignments.set(assignment.id, assignment);
    this.recordActivity({
      action: 'create',
      resourceType: 'assignment',
      resourceId: assignment.id,
      userId: assignment.assignedBy,
    });
    this.wsManager.broadcast(WEBSOCKET_EVENTS.ASSIGNMENT_CREATED, assignment);
    this.updatedAt = new Date();
  }

  getAssignments(userId?: string): TeamAssignment[] {
    const assigns = Array.from(this.assignments.values());
    return userId ? assigns.filter((a) => a.userId === userId) : assigns;
  }

  updateAssignmentStatus(assignmentId: string, status: string, userId: string): void {
    const assignment = this.assignments.get(assignmentId);
    if (assignment) {
      assignment.status = status as any;
      this.recordActivity({
        action: 'update',
        resourceType: 'assignment',
        resourceId: assignmentId,
        userId,
        newValue: { status },
      });
      this.wsManager.broadcast(WEBSOCKET_EVENTS.ASSIGNMENT_UPDATED, assignment);
      this.updatedAt = new Date();
    }
  }

  private recordActivity(data: Partial<ActivityEvent>): void {
    const activity: ActivityEvent = {
      id: CollaborationUtils.generateActivityId(),
      incidentId: this.incidentId,
      userId: data.userId || '',
      username: data.userId || '',
      action: data.action || '',
      resourceType: data.resourceType || '',
      resourceId: data.resourceId || '',
      oldValue: data.oldValue,
      newValue: data.newValue,
      timestamp: new Date(),
      metadata: {},
    };
    this.activityLog.push(activity);
    this.wsManager.broadcast(WEBSOCKET_EVENTS.ACTIVITY_RECORDED, activity);
  }

  getActivityLog(limit: number = 50): ActivityEvent[] {
    return this.activityLog.slice(-limit);
  }

  getCollaborationData(): IncidentCollaborationData {
    return {
      incidentId: this.incidentId,
      participants: this.getParticipants(),
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        participantCount: this.participants.size,
        evidenceCount: this.evidence.size,
        messageCount: this.messages.size,
        assignmentCount: this.assignments.size,
      },
    };
  }

  private handleEvidenceAdded(payload: any): void {
    this.evidence.set(payload.id, payload);
    this.updatedAt = new Date();
    this.emit('evidence:added', payload);
  }

  private handleMessageSent(payload: any): void {
    this.messages.set(payload.id, payload);
    this.updatedAt = new Date();
    this.emit('message:sent', payload);
  }

  private handleParticipantJoined(payload: any): void {
    this.addParticipant(payload);
    this.emit('participant:joined', payload);
  }

  private handleParticipantLeft(payload: any): void {
    this.removeParticipant(payload.participantId);
    this.emit('participant:left', payload);
  }

  private handleAssignmentCreated(payload: any): void {
    this.assignments.set(payload.id, payload);
    this.updatedAt = new Date();
    this.emit('assignment:created', payload);
  }

  setStatus(status: 'active' | 'archived' | 'closed'): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }

  isOnline(): boolean {
    return this.wsManager.isOnline();
  }
}
