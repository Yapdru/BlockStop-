import { EventEmitter } from 'events';
import { TeamAssignment, Participant } from './types';
import { WEBSOCKET_EVENTS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class TeamAssignmentManager extends EventEmitter {
  private assignments: Map<string, TeamAssignment> = new Map();
  private userAssignments: Map<string, TeamAssignment[]> = new Map();
  private incidentAssignments: Map<string, TeamAssignment[]> = new Map();
  private wsManager: WebSocketManager;

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize team assignments:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.ASSIGNMENT_CREATED, (payload) => this.handleAssignmentCreated(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.ASSIGNMENT_UPDATED, (payload) => this.handleAssignmentUpdated(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.ASSIGNMENT_COMPLETED, (payload) => this.handleAssignmentCompleted(payload));
  }

  createAssignment(assignment: Omit<TeamAssignment, 'id' | 'assignedAt'>): TeamAssignment {
    const id = CollaborationUtils.generateId('assign');
    const fullAssignment: TeamAssignment = {
      ...assignment,
      id,
      assignedAt: new Date(),
    };

    this.assignments.set(id, fullAssignment);

    if (!this.userAssignments.has(assignment.userId)) {
      this.userAssignments.set(assignment.userId, []);
    }
    this.userAssignments.get(assignment.userId)!.push(fullAssignment);

    if (!this.incidentAssignments.has(assignment.incidentId)) {
      this.incidentAssignments.set(assignment.incidentId, []);
    }
    this.incidentAssignments.get(assignment.incidentId)!.push(fullAssignment);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ASSIGNMENT_CREATED, fullAssignment);
    this.emit('assignment:created', fullAssignment);

    return fullAssignment;
  }

  updateAssignment(assignmentId: string, updates: Partial<TeamAssignment>): TeamAssignment | undefined {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return undefined;

    const updated = { ...assignment, ...updates };
    this.assignments.set(assignmentId, updated);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ASSIGNMENT_UPDATED, updated);
    this.emit('assignment:updated', updated);

    return updated;
  }

  completeAssignment(assignmentId: string, userId: string): TeamAssignment | undefined {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return undefined;

    const updated = { ...assignment, status: 'completed' as const };
    this.assignments.set(assignmentId, updated);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ASSIGNMENT_COMPLETED, updated);
    this.emit('assignment:completed', updated);

    return updated;
  }

  reassignAssignment(assignmentId: string, newUserId: string, reassignedBy: string): TeamAssignment | undefined {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return undefined;

    const oldUserId = assignment.userId;
    const reassigned = { ...assignment, userId: newUserId, status: 'active' as const };
    this.assignments.set(assignmentId, reassigned);

    if (this.userAssignments.has(oldUserId)) {
      const oldList = this.userAssignments.get(oldUserId)!;
      const idx = oldList.findIndex((a) => a.id === assignmentId);
      if (idx !== -1) oldList.splice(idx, 1);
    }

    if (!this.userAssignments.has(newUserId)) {
      this.userAssignments.set(newUserId, []);
    }
    this.userAssignments.get(newUserId)!.push(reassigned);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.ASSIGNMENT_UPDATED, reassigned);
    this.emit('assignment:reassigned', { assignmentId, from: oldUserId, to: newUserId });

    return reassigned;
  }

  getAssignment(assignmentId: string): TeamAssignment | undefined {
    return this.assignments.get(assignmentId);
  }

  getUserAssignments(userId: string): TeamAssignment[] {
    return this.userAssignments.get(userId) || [];
  }

  getUserActiveAssignments(userId: string): TeamAssignment[] {
    return (this.userAssignments.get(userId) || []).filter((a) => a.status === 'active');
  }

  getIncidentAssignments(incidentId: string): TeamAssignment[] {
    return this.incidentAssignments.get(incidentId) || [];
  }

  getIncidentActiveAssignments(incidentId: string): TeamAssignment[] {
    return (this.incidentAssignments.get(incidentId) || []).filter((a) => a.status === 'active');
  }

  getAssignmentsByPriority(incidentId: string): Record<string, TeamAssignment[]> {
    const assignments = this.getIncidentAssignments(incidentId);
    const byPriority: Record<string, TeamAssignment[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    assignments.forEach((a) => {
      byPriority[a.priority].push(a);
    });

    return byPriority;
  }

  getAssignmentsByRole(incidentId: string): Record<string, TeamAssignment[]> {
    const assignments = this.getIncidentAssignments(incidentId);
    const byRole: Record<string, TeamAssignment[]> = {
      lead: [],
      investigator: [],
      analyst: [],
      viewer: [],
    };

    assignments.forEach((a) => {
      byRole[a.role].push(a);
    });

    return byRole;
  }

  getTeamLead(incidentId: string): TeamAssignment | undefined {
    const assignments = this.getIncidentAssignments(incidentId);
    return assignments.find((a) => a.role === 'lead' && a.status === 'active');
  }

  getTeamForIncident(incidentId: string): TeamAssignment[] {
    return this.getIncidentActiveAssignments(incidentId);
  }

  getTeamMemberCount(incidentId: string): number {
    return this.getTeamForIncident(incidentId).length;
  }

  getWorkload(incidentId: string): Array<{ userId: string; assignmentCount: number; workload: 'low' | 'medium' | 'high' }> {
    const assignments = this.getIncidentActiveAssignments(incidentId);
    const workloadMap: Record<string, number> = {};

    assignments.forEach((a) => {
      workloadMap[a.userId] = (workloadMap[a.userId] || 0) + 1;
    });

    return Object.entries(workloadMap).map(([userId, count]) => ({
      userId,
      assignmentCount: count,
      workload: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
    }));
  }

  recommendAssignment(incidentId: string, priority: 'critical' | 'high' | 'medium' | 'low'): string | undefined {
    const workload = this.getWorkload(incidentId);
    const candidates = workload.filter((w) => w.workload === 'low').sort((a, b) => a.assignmentCount - b.assignmentCount);

    return candidates.length > 0 ? candidates[0].userId : undefined;
  }

  private handleAssignmentCreated(payload: any): void {
    const assignment = payload as TeamAssignment;
    this.assignments.set(assignment.id, assignment);

    if (!this.userAssignments.has(assignment.userId)) {
      this.userAssignments.set(assignment.userId, []);
    }
    this.userAssignments.get(assignment.userId)!.push(assignment);

    if (!this.incidentAssignments.has(assignment.incidentId)) {
      this.incidentAssignments.set(assignment.incidentId, []);
    }
    this.incidentAssignments.get(assignment.incidentId)!.push(assignment);
  }

  private handleAssignmentUpdated(payload: any): void {
    const assignment = payload as TeamAssignment;
    this.assignments.set(assignment.id, assignment);
  }

  private handleAssignmentCompleted(payload: any): void {
    const assignment = payload as TeamAssignment;
    this.assignments.set(assignment.id, assignment);
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
