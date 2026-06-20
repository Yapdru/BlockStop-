import { EventEmitter } from 'events';
import { IncidentCollaborationData, Participant } from './types';
import { COLLABORATION_CONFIG } from './constants';
import { CollaborationUtils } from './utils';
import { IncidentWarRoom } from './incident-war-room';
import { RealTimeSyncEngine } from './real-time-sync';
import { EvidenceSharingEngine } from './evidence-sharing';
import { AnnotationEngine } from './annotation-engine';
import { ActivityTimeline } from './activity-timeline';
import { TeamAssignmentManager } from './team-assignments';
import { CommunicationChannel } from './communication-channel';
import { PresenceManager } from './presence-manager';
import { NotificationManager } from './notification-manager';
import { AuditLogger } from './audit-logger';
import { ConflictResolver } from './conflict-resolver';
import { EncryptionManager } from './encryption-manager';
import { FileStorageManager } from './file-storage-manager';
import crypto from 'crypto';

export class IncidentCollaborationEngine extends EventEmitter {
  private incidentId: string;
  private userId: string;
  private wsUrl: string;
  private masterKey: Buffer;

  private warRoom: IncidentWarRoom | null = null;
  private syncEngine: RealTimeSyncEngine | null = null;
  private evidenceSharing: EvidenceSharingEngine | null = null;
  private annotationEngine: AnnotationEngine | null = null;
  private activityTimeline: ActivityTimeline | null = null;
  private teamAssignments: TeamAssignmentManager | null = null;
  private communicationChannels: Map<string, CommunicationChannel> = new Map();
  private presenceManager: PresenceManager | null = null;
  private notificationManager: NotificationManager | null = null;
  private auditLogger: AuditLogger | null = null;
  private conflictResolver: ConflictResolver | null = null;
  private encryptionManager: EncryptionManager | null = null;
  private fileStorageManager: FileStorageManager | null = null;

  private initialized: boolean = false;

  constructor(incidentId: string, userId: string, wsUrl: string, masterKeyInput?: string | Buffer) {
    super();
    this.incidentId = incidentId;
    this.userId = userId;
    this.wsUrl = wsUrl;
    this.masterKey =
      typeof masterKeyInput === 'string'
        ? crypto.pbkdf2Sync(masterKeyInput, incidentId, 100000, 32, 'sha256')
        : masterKeyInput || crypto.randomBytes(32);
  }

  async initialize(): Promise<void> {
    try {
      this.warRoom = new IncidentWarRoom(this.incidentId, this.userId);
      await this.warRoom.initialize(this.wsUrl);

      this.syncEngine = new RealTimeSyncEngine(this.userId);
      await this.syncEngine.initialize(this.wsUrl);

      this.evidenceSharing = new EvidenceSharingEngine(this.userId);
      await this.evidenceSharing.initialize(this.wsUrl);

      this.annotationEngine = new AnnotationEngine(this.userId);
      await this.annotationEngine.initialize(this.wsUrl);

      this.activityTimeline = new ActivityTimeline(this.userId);
      await this.activityTimeline.initialize(this.wsUrl);

      this.teamAssignments = new TeamAssignmentManager(this.userId);
      await this.teamAssignments.initialize(this.wsUrl);

      this.presenceManager = new PresenceManager(this.userId);
      await this.presenceManager.initialize(this.wsUrl);

      this.notificationManager = new NotificationManager(this.userId);
      await this.notificationManager.initialize(this.wsUrl);

      this.auditLogger = new AuditLogger(this.userId);
      await this.auditLogger.initialize(this.wsUrl);

      this.conflictResolver = new ConflictResolver(this.userId);
      await this.conflictResolver.initialize(this.wsUrl);

      this.encryptionManager = new EncryptionManager(this.userId);
      await this.encryptionManager.initialize(this.wsUrl, this.masterKey);

      this.fileStorageManager = new FileStorageManager(this.userId);
      await this.fileStorageManager.initialize(this.wsUrl);

      this.setupChannelHandlers();
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize incident collaboration engine:', error);
      throw error;
    }
  }

  private setupChannelHandlers(): void {
    if (this.warRoom && this.warRoom.isOnline()) {
      this.warRoom.on('evidence:added', (e) => this.evidenceSharing?.uploadEvidence(e));
      this.warRoom.on('participant:joined', (p) => this.presenceManager?.setActive(p.userId, 'war_room'));
      this.warRoom.on('participant:left', (p) => this.presenceManager?.setOffline(p.userId));
    }
  }

  createCommunicationChannel(channelId: string): CommunicationChannel {
    if (!this.communicationChannels.has(channelId)) {
      const channel = new CommunicationChannel(channelId, this.userId);
      this.communicationChannels.set(channelId, channel);
    }
    return this.communicationChannels.get(channelId)!;
  }

  getCommunicationChannel(channelId: string): CommunicationChannel | undefined {
    return this.communicationChannels.get(channelId);
  }

  getWarRoom(): IncidentWarRoom | null {
    return this.warRoom;
  }

  getSyncEngine(): RealTimeSyncEngine | null {
    return this.syncEngine;
  }

  getEvidenceSharing(): EvidenceSharingEngine | null {
    return this.evidenceSharing;
  }

  getAnnotationEngine(): AnnotationEngine | null {
    return this.annotationEngine;
  }

  getActivityTimeline(): ActivityTimeline | null {
    return this.activityTimeline;
  }

  getTeamAssignments(): TeamAssignmentManager | null {
    return this.teamAssignments;
  }

  getPresenceManager(): PresenceManager | null {
    return this.presenceManager;
  }

  getNotificationManager(): NotificationManager | null {
    return this.notificationManager;
  }

  getAuditLogger(): AuditLogger | null {
    return this.auditLogger;
  }

  getConflictResolver(): ConflictResolver | null {
    return this.conflictResolver;
  }

  getEncryptionManager(): EncryptionManager | null {
    return this.encryptionManager;
  }

  getFileStorageManager(): FileStorageManager | null {
    return this.fileStorageManager;
  }

  getCollaborationStatus(): {
    initialized: boolean;
    incidentId: string;
    warRoomOnline: boolean;
    activeParticipants: number;
    syncStatus: string;
    conflictCount: number;
  } {
    return {
      initialized: this.initialized,
      incidentId: this.incidentId,
      warRoomOnline: this.warRoom?.isOnline() || false,
      activeParticipants: this.warRoom?.getActiveParticipants().length || 0,
      syncStatus: this.syncEngine?.getStatus() || 'unknown',
      conflictCount: this.conflictResolver?.getPendingConflictCount() || 0,
    };
  }

  async disconnect(): Promise<void> {
    this.warRoom?.disconnect();
    this.syncEngine?.disconnect();
    this.evidenceSharing?.disconnect();
    this.annotationEngine?.disconnect();
    this.activityTimeline?.disconnect();
    this.teamAssignments?.disconnect();
    this.presenceManager?.disconnect();
    this.notificationManager?.disconnect();
    this.auditLogger?.disconnect();
    this.conflictResolver?.disconnect();
    this.encryptionManager?.disconnect();
    this.fileStorageManager?.disconnect();

    this.communicationChannels.forEach((channel) => channel.disconnect());
    this.communicationChannels.clear();

    this.initialized = false;
    this.emit('disconnected');
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
