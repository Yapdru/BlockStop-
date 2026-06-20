export interface Participant {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'investigator' | 'analyst' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  isOnline: boolean;
}

export interface IncidentCollaborationData {
  incidentId: string;
  participants: Participant[];
  status: 'active' | 'archived' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface SyncMessage {
  id: string;
  type: 'update' | 'delete' | 'create' | 'annotation';
  resourceId: string;
  resourceType: string;
  payload: any;
  timestamp: number;
  version: number;
  userId: string;
}

export interface Evidence {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  type: 'file' | 'image' | 'log' | 'network' | 'external';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata: EvidenceMetadata;
  annotations: Annotation[];
}

export interface EvidenceMetadata {
  size?: number;
  mimeType?: string;
  duration?: number;
  resolution?: string;
  tags: string[];
  chain_of_custody: ChainOfCustody[];
}

export interface ChainOfCustody {
  userId: string;
  username: string;
  action: string;
  timestamp: Date;
  notes?: string;
}

export interface Annotation {
  id: string;
  evidenceId: string;
  type: 'highlight' | 'comment' | 'flag' | 'redaction';
  content: string;
  position?: { x: number; y: number; width?: number; height?: number };
  createdBy: string;
  createdAt: Date;
  resolved: boolean;
}

export interface ActivityEvent {
  id: string;
  incidentId: string;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface TeamAssignment {
  id: string;
  incidentId: string;
  userId: string;
  username: string;
  role: 'lead' | 'investigator' | 'analyst' | 'viewer';
  assignedAt: Date;
  assignedBy: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'reassigned';
}

export interface CommunicationMessage {
  id: string;
  incidentId: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  contentEncrypted: boolean;
  mentions: string[];
  attachments: string[];
  createdAt: Date;
  editedAt?: Date;
  reactions: Record<string, string[]>;
  threadId?: string;
  replyCount: number;
}

export interface PresenceState {
  userId: string;
  username: string;
  status: 'active' | 'away' | 'offline';
  location: string;
  viewingResource?: {
    type: string;
    id: string;
  };
  cursorPosition?: { x: number; y: number };
  lastUpdate: Date;
}

export interface ConflictResolution {
  id: string;
  resourceId: string;
  conflicts: Conflict[];
  resolution: 'manual' | 'auto_latest' | 'auto_majority' | 'merge';
  resolvedAt: Date;
  resolvedBy: string;
  mergedValue?: any;
}

export interface Conflict {
  userId: string;
  version: number;
  value: any;
  timestamp: Date;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'update' | 'comment' | 'evidence_shared';
  title: string;
  description: string;
  resourceId: string;
  resourceType: string;
  read: boolean;
  createdAt: Date;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId: string;
  sessionId: string;
}

export interface AuditLog {
  id: string;
  incidentId: string;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: {
    before: any;
    after: any;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export interface EncryptionKey {
  id: string;
  incidentId: string;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  publicKey?: string;
  createdAt: Date;
  expiresAt: Date;
  rotatedAt?: Date;
}
