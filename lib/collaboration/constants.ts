export const COLLABORATION_CONFIG = {
  WEBSOCKET_TIMEOUT: 30000,
  HEARTBEAT_INTERVAL: 30000,
  SYNC_DEBOUNCE_MS: 300,
  MAX_PARTICIPANTS: 50,
  MAX_MESSAGE_SIZE: 1048576, // 1MB
  MAX_FILE_SIZE: 104857600, // 100MB
  ACTIVITY_RETENTION_DAYS: 90,
  AUDIT_LOG_RETENTION_DAYS: 365,
  CACHE_TTL_MS: 3600000, // 1 hour
  PRESENCE_TIMEOUT_MS: 300000, // 5 minutes
  CONFLICT_RESOLUTION_TIMEOUT_MS: 60000,
};

export const WEBSOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  HEARTBEAT: 'heartbeat',

  // Sync
  SYNC_REQUEST: 'sync:request',
  SYNC_RESPONSE: 'sync:response',
  SYNC_COMPLETE: 'sync:complete',

  // Evidence
  EVIDENCE_ADDED: 'evidence:added',
  EVIDENCE_UPDATED: 'evidence:updated',
  EVIDENCE_DELETED: 'evidence:deleted',
  EVIDENCE_SHARED: 'evidence:shared',

  // Annotation
  ANNOTATION_ADDED: 'annotation:added',
  ANNOTATION_UPDATED: 'annotation:updated',
  ANNOTATION_DELETED: 'annotation:deleted',

  // Activity
  ACTIVITY_RECORDED: 'activity:recorded',
  ACTIVITY_TIMELINE_UPDATED: 'activity:timeline:updated',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',

  // Messages
  MESSAGE_SENT: 'message:sent',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACTION: 'message:reaction',

  // Assignments
  ASSIGNMENT_CREATED: 'assignment:created',
  ASSIGNMENT_UPDATED: 'assignment:updated',
  ASSIGNMENT_COMPLETED: 'assignment:completed',

  // Notifications
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_READ: 'notification:read',

  // Errors
  ERROR: 'error',
  CONFLICT_DETECTED: 'conflict:detected',
};

export const ACTIVITY_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  DOWNLOAD: 'download',
  SHARE: 'share',
  ASSIGN: 'assign',
  COMMENT: 'comment',
  ANNOTATE: 'annotate',
  MENTION: 'mention',
};

export const RESOURCE_TYPES = {
  INCIDENT: 'incident',
  EVIDENCE: 'evidence',
  ANNOTATION: 'annotation',
  MESSAGE: 'message',
  ASSIGNMENT: 'assignment',
  ATTACHMENT: 'attachment',
  WAR_ROOM: 'war_room',
};

export const ENCRYPTION_ALGORITHMS = {
  AES_256_GCM: 'AES-256-GCM',
  CHACHA20_POLY1305: 'ChaCha20-Poly1305',
};

export const NOTIFICATION_TYPES = {
  MENTION: 'mention',
  ASSIGNMENT: 'assignment',
  UPDATE: 'update',
  COMMENT: 'comment',
  EVIDENCE_SHARED: 'evidence_shared',
  INCIDENT_UPDATED: 'incident_updated',
  PARTICIPANT_JOINED: 'participant_joined',
};

export const ROLE_PERMISSIONS = {
  admin: {
    canModerate: true,
    canDeleteContent: true,
    canManageParticipants: true,
    canEncrypt: true,
    canAudit: true,
  },
  investigator: {
    canModerate: false,
    canDeleteContent: true,
    canManageParticipants: false,
    canEncrypt: true,
    canAudit: false,
  },
  analyst: {
    canModerate: false,
    canDeleteContent: false,
    canManageParticipants: false,
    canEncrypt: false,
    canAudit: false,
  },
  viewer: {
    canModerate: false,
    canDeleteContent: false,
    canManageParticipants: false,
    canEncrypt: false,
    canAudit: false,
  },
};

export const CONFLICT_RESOLUTION_STRATEGIES = {
  MANUAL: 'manual',
  AUTO_LATEST: 'auto_latest',
  AUTO_MAJORITY: 'auto_majority',
  MERGE: 'merge',
};

export const SYNC_STATUS = {
  SYNCING: 'syncing',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  ERROR: 'error',
  OFFLINE: 'offline',
};

export const MESSAGE_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};
