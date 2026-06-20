import { EventEmitter } from 'events';
import { Annotation, Evidence } from './types';
import { WEBSOCKET_EVENTS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class AnnotationEngine extends EventEmitter {
  private annotations: Map<string, Annotation> = new Map();
  private evidenceAnnotations: Map<string, Annotation[]> = new Map();
  private wsManager: WebSocketManager;
  private annotationThreads: Map<string, string[]> = new Map(); // annotationId -> replies

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize annotation engine:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.ANNOTATION_ADDED, (payload) => this.handleAnnotationAdded(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.ANNOTATION_UPDATED, (payload) => this.handleAnnotationUpdated(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.ANNOTATION_DELETED, (payload) => this.handleAnnotationDeleted(payload));
  }

  addAnnotation(evidence: Evidence, annotation: Omit<Annotation, 'id' | 'createdAt'>): Annotation {
    const id = CollaborationUtils.generateAnnotationId();
    const fullAnnotation: Annotation = {
      ...annotation,
      id,
      createdAt: new Date(),
    };

    this.annotations.set(id, fullAnnotation);

    if (!this.evidenceAnnotations.has(evidence.id)) {
      this.evidenceAnnotations.set(evidence.id, []);
    }
    this.evidenceAnnotations.get(evidence.id)!.push(fullAnnotation);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ANNOTATION_ADDED, fullAnnotation);
    this.emit('annotation:added', fullAnnotation);

    return fullAnnotation;
  }

  updateAnnotation(annotationId: string, updates: Partial<Annotation>): Annotation | undefined {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return undefined;

    const updated = { ...annotation, ...updates };
    this.annotations.set(annotationId, updated);

    const evidenceList = Array.from(this.evidenceAnnotations.values());
    evidenceList.forEach((list) => {
      const idx = list.findIndex((a) => a.id === annotationId);
      if (idx !== -1) {
        list[idx] = updated;
      }
    });

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ANNOTATION_UPDATED, updated);
    this.emit('annotation:updated', updated);

    return updated;
  }

  deleteAnnotation(annotationId: string): boolean {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return false;

    this.annotations.delete(annotationId);

    const evidenceList = Array.from(this.evidenceAnnotations.values());
    evidenceList.forEach((list) => {
      const idx = list.findIndex((a) => a.id === annotationId);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    });

    this.annotationThreads.delete(annotationId);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ANNOTATION_DELETED, { annotationId });
    this.emit('annotation:deleted', { annotationId });

    return true;
  }

  getAnnotationsForEvidence(evidenceId: string): Annotation[] {
    return this.evidenceAnnotations.get(evidenceId) || [];
  }

  getAnnotation(annotationId: string): Annotation | undefined {
    return this.annotations.get(annotationId);
  }

  getAllAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  getAnnotationsByType(type: 'highlight' | 'comment' | 'flag' | 'redaction'): Annotation[] {
    return Array.from(this.annotations.values()).filter((a) => a.type === type);
  }

  getAnnotationsByUser(userId: string): Annotation[] {
    return Array.from(this.annotations.values()).filter((a) => a.createdBy === userId);
  }

  resolveAnnotation(annotationId: string): Annotation | undefined {
    const annotation = this.annotations.get(annotationId);
    if (annotation) {
      annotation.resolved = true;
      this.updateAnnotation(annotationId, { resolved: true });
      this.emit('annotation:resolved', annotation);
    }
    return annotation;
  }

  getUnresolvedAnnotations(): Annotation[] {
    return Array.from(this.annotations.values()).filter((a) => !a.resolved);
  }

  addReplyToAnnotation(annotationId: string, replyId: string): void {
    if (!this.annotationThreads.has(annotationId)) {
      this.annotationThreads.set(annotationId, []);
    }
    this.annotationThreads.get(annotationId)!.push(replyId);
  }

  getAnnotationThread(annotationId: string): Annotation[] {
    const replyIds = this.annotationThreads.get(annotationId) || [];
    return replyIds
      .map((id) => this.annotations.get(id))
      .filter((a) => a !== undefined) as Annotation[];
  }

  createRedaction(evidenceId: string, position: { x: number; y: number; width: number; height: number }, userId: string): Annotation {
    return this.addAnnotation({ id: evidenceId } as Evidence, {
      evidenceId,
      type: 'redaction',
      content: 'Redacted content',
      position,
      createdBy: userId,
      resolved: false,
    });
  }

  createHighlight(
    evidenceId: string,
    position: { x: number; y: number; width: number; height: number },
    content: string,
    userId: string,
  ): Annotation {
    return this.addAnnotation({ id: evidenceId } as Evidence, {
      evidenceId,
      type: 'highlight',
      content,
      position,
      createdBy: userId,
      resolved: false,
    });
  }

  createComment(evidenceId: string, content: string, userId: string): Annotation {
    return this.addAnnotation({ id: evidenceId } as Evidence, {
      evidenceId,
      type: 'comment',
      content,
      createdBy: userId,
      resolved: false,
    });
  }

  createFlag(evidenceId: string, content: string, userId: string): Annotation {
    return this.addAnnotation({ id: evidenceId } as Evidence, {
      evidenceId,
      type: 'flag',
      content,
      createdBy: userId,
      resolved: false,
    });
  }

  private handleAnnotationAdded(payload: any): void {
    this.annotations.set(payload.id, payload);
    if (!this.evidenceAnnotations.has(payload.evidenceId)) {
      this.evidenceAnnotations.set(payload.evidenceId, []);
    }
    this.evidenceAnnotations.get(payload.evidenceId)!.push(payload);
    this.emit('annotation:added', payload);
  }

  private handleAnnotationUpdated(payload: any): void {
    this.annotations.set(payload.id, payload);
    this.emit('annotation:updated', payload);
  }

  private handleAnnotationDeleted(payload: any): void {
    this.annotations.delete(payload.annotationId);
    this.emit('annotation:deleted', payload);
  }

  getAnnotationStats(evidenceId: string): {
    total: number;
    byType: Record<string, number>;
    resolved: number;
    unresolved: number;
  } {
    const annotations = this.getAnnotationsForEvidence(evidenceId);
    const byType: Record<string, number> = {};
    let resolved = 0;
    let unresolved = 0;

    annotations.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
      if (a.resolved) resolved++;
      else unresolved++;
    });

    return {
      total: annotations.length,
      byType,
      resolved,
      unresolved,
    };
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
