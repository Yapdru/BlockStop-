import { EventEmitter } from 'events';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';
import { WEBSOCKET_EVENTS } from './constants';

interface EditSession {
  id: string;
  userId: string;
  resourceId: string;
  startTime: Date;
  lastActivity: Date;
  version: number;
}

interface EditOperation {
  id: string;
  sessionId: string;
  userId: string;
  resourceId: string;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
  version: number;
}

export class ConcurrentEditingEngine extends EventEmitter {
  private sessions: Map<string, EditSession> = new Map();
  private operations: EditOperation[] = [];
  private resourceVersions: Map<string, number> = new Map();
  private activeEditors: Map<string, Set<string>> = new Map(); // resourceId -> Set of userIds
  private wsManager: WebSocketManager;
  private operationBuffer: Map<string, EditOperation[]> = new Map(); // sessionId -> operations

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize concurrent editing:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on('edit:operation', (payload) => this.handleRemoteOperation(payload));
    this.wsManager.on('edit:session_start', (payload) => this.handleSessionStart(payload));
    this.wsManager.on('edit:session_end', (payload) => this.handleSessionEnd(payload));
  }

  startEditSession(userId: string, resourceId: string): EditSession {
    const sessionId = CollaborationUtils.generateId('session');
    const session: EditSession = {
      id: sessionId,
      userId,
      resourceId,
      startTime: new Date(),
      lastActivity: new Date(),
      version: this.resourceVersions.get(resourceId) || 0,
    };

    this.sessions.set(sessionId, session);
    this.operationBuffer.set(sessionId, []);

    if (!this.activeEditors.has(resourceId)) {
      this.activeEditors.set(resourceId, new Set());
    }
    this.activeEditors.get(resourceId)!.add(userId);

    this.wsManager.broadcast('edit:session_start', { sessionId, userId, resourceId });
    this.emit('session:started', session);

    return session;
  }

  endEditSession(sessionId: string): EditSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    this.sessions.delete(sessionId);
    this.operationBuffer.delete(sessionId);

    if (this.activeEditors.has(session.resourceId)) {
      this.activeEditors.get(session.resourceId)!.delete(session.userId);
    }

    this.wsManager.broadcast('edit:session_end', { sessionId, userId: session.userId, resourceId: session.resourceId });
    this.emit('session:ended', session);

    return session;
  }

  recordOperation(sessionId: string, operation: Omit<EditOperation, 'id' | 'timestamp' | 'version' | 'sessionId'>): EditOperation {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const opId = CollaborationUtils.generateId('op');
    const resourceVersion = (this.resourceVersions.get(operation.resourceId) || 0) + 1;
    this.resourceVersions.set(operation.resourceId, resourceVersion);

    const fullOp: EditOperation = {
      ...operation,
      id: opId,
      sessionId,
      timestamp: new Date(),
      version: resourceVersion,
    };

    this.operations.push(fullOp);
    session.lastActivity = new Date();
    session.version = resourceVersion;

    const buffer = this.operationBuffer.get(sessionId);
    if (buffer) {
      buffer.push(fullOp);
    }

    this.wsManager.broadcast('edit:operation', fullOp);
    this.emit('operation:recorded', fullOp);

    return fullOp;
  }

  getActiveEditors(resourceId: string): string[] {
    return Array.from(this.activeEditors.get(resourceId) || new Set());
  }

  getResourceOperations(resourceId: string, fromVersion?: number): EditOperation[] {
    let ops = this.operations.filter((o) => o.resourceId === resourceId);
    if (fromVersion !== undefined) {
      ops = ops.filter((o) => o.version > fromVersion);
    }
    return ops;
  }

  getSessionOperations(sessionId: string): EditOperation[] {
    return this.operationBuffer.get(sessionId) || [];
  }

  applyOperationTransform(op1: EditOperation, op2: EditOperation): EditOperation {
    if (op1.timestamp < op2.timestamp) {
      return this.transformOperation(op1, op2);
    } else {
      return this.transformOperation(op2, op1);
    }
  }

  private transformOperation(baseOp: EditOperation, incomingOp: EditOperation): EditOperation {
    const transformed = { ...baseOp };

    if (incomingOp.operation === 'insert') {
      if (incomingOp.position <= transformed.position) {
        transformed.position += incomingOp.content?.length || 0;
      }
    } else if (incomingOp.operation === 'delete') {
      if (incomingOp.position < transformed.position) {
        transformed.position = Math.max(incomingOp.position, transformed.position - (incomingOp.length || 0));
      }
    }

    return transformed;
  }

  handleConflict(op1: EditOperation, op2: EditOperation): EditOperation {
    if (op1.userId < op2.userId) {
      return op1;
    } else if (op1.userId > op2.userId) {
      return op2;
    } else {
      return op1.timestamp < op2.timestamp ? op1 : op2;
    }
  }

  private handleRemoteOperation(payload: any): void {
    const operation = payload as EditOperation;
    if (!this.operations.find((o) => o.id === operation.id)) {
      this.operations.push(operation);
      this.resourceVersions.set(operation.resourceId, Math.max(this.resourceVersions.get(operation.resourceId) || 0, operation.version));
      this.emit('remote:operation', operation);
    }
  }

  private handleSessionStart(payload: any): void {
    const session = payload as EditSession;
    if (!this.activeEditors.has(session.resourceId)) {
      this.activeEditors.set(session.resourceId, new Set());
    }
    this.activeEditors.get(session.resourceId)!.add(session.userId);
  }

  private handleSessionEnd(payload: any): void {
    if (this.activeEditors.has(payload.resourceId)) {
      this.activeEditors.get(payload.resourceId)!.delete(payload.userId);
    }
  }

  getEditingStats(resourceId: string): {
    activeEditors: number;
    operationCount: number;
    currentVersion: number;
    lastModified: Date | null;
  } {
    const editors = this.getActiveEditors(resourceId);
    const ops = this.getResourceOperations(resourceId);
    const lastOp = ops[ops.length - 1];

    return {
      activeEditors: editors.length,
      operationCount: ops.length,
      currentVersion: this.resourceVersions.get(resourceId) || 0,
      lastModified: lastOp?.timestamp || null,
    };
  }

  getOperationHistory(resourceId: string, limit: number = 100): EditOperation[] {
    return this.getResourceOperations(resourceId).slice(-limit);
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
