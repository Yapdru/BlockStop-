import { EventEmitter } from 'events';
import { PresenceState } from './types';
import { COLLABORATION_CONFIG, WEBSOCKET_EVENTS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class PresenceManager extends EventEmitter {
  private presenceMap: Map<string, PresenceState> = new Map();
  private wsManager: WebSocketManager;
  private updateInterval: NodeJS.Timer | null = null;
  private presenceTimeout: Map<string, NodeJS.Timer> = new Map();

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
      this.startPresenceHeartbeat();
    } catch (error) {
      console.error('Failed to initialize presence manager:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.PRESENCE_UPDATE, (payload) => this.handlePresenceUpdate(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.PRESENCE_JOINED, (payload) => this.handlePresenceJoined(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.PRESENCE_LEFT, (payload) => this.handlePresenceLeft(payload));
  }

  updatePresence(userId: string, status: 'active' | 'away' | 'offline', location: string): PresenceState {
    let presence = this.presenceMap.get(userId);

    if (!presence) {
      presence = {
        userId,
        username: userId,
        status,
        location,
        lastUpdate: new Date(),
      };
    } else {
      presence.status = status;
      presence.location = location;
      presence.lastUpdate = new Date();
    }

    this.presenceMap.set(userId, presence);

    if (this.presenceTimeout.has(userId)) {
      clearTimeout(this.presenceTimeout.get(userId)!);
    }

    if (status !== 'offline') {
      const timeout = setTimeout(() => {
        this.setOffline(userId);
      }, COLLABORATION_CONFIG.PRESENCE_TIMEOUT_MS);
      this.presenceTimeout.set(userId, timeout);
    }

    this.wsManager.broadcast(WEBSOCKET_EVENTS.PRESENCE_UPDATE, presence);
    this.emit('presence:updated', presence);

    return presence;
  }

  updateViewingResource(userId: string, resourceType: string, resourceId: string): PresenceState | undefined {
    const presence = this.presenceMap.get(userId);
    if (!presence) return undefined;

    presence.viewingResource = { type: resourceType, id: resourceId };
    this.wsManager.broadcast(WEBSOCKET_EVENTS.PRESENCE_UPDATE, presence);
    this.emit('presence:updated', presence);

    return presence;
  }

  updateCursorPosition(userId: string, x: number, y: number): PresenceState | undefined {
    const presence = this.presenceMap.get(userId);
    if (!presence) return undefined;

    presence.cursorPosition = { x, y };
    this.wsManager.broadcast(WEBSOCKET_EVENTS.PRESENCE_UPDATE, presence);

    return presence;
  }

  setActive(userId: string, location: string): PresenceState {
    return this.updatePresence(userId, 'active', location);
  }

  setAway(userId: string, location: string): PresenceState {
    return this.updatePresence(userId, 'away', location);
  }

  setOffline(userId: string): void {
    const presence = this.presenceMap.get(userId);
    if (presence) {
      presence.status = 'offline';
      this.wsManager.broadcast(WEBSOCKET_EVENTS.PRESENCE_LEFT, { userId });
      this.emit('presence:left', { userId });
    }

    if (this.presenceTimeout.has(userId)) {
      clearTimeout(this.presenceTimeout.get(userId)!);
      this.presenceTimeout.delete(userId);
    }
  }

  getPresence(userId: string): PresenceState | undefined {
    return this.presenceMap.get(userId);
  }

  getAllPresence(): PresenceState[] {
    return Array.from(this.presenceMap.values());
  }

  getActiveUsers(): PresenceState[] {
    return Array.from(this.presenceMap.values()).filter((p) => p.status === 'active');
  }

  getAwayUsers(): PresenceState[] {
    return Array.from(this.presenceMap.values()).filter((p) => p.status === 'away');
  }

  getOnlineUsers(): PresenceState[] {
    return Array.from(this.presenceMap.values()).filter((p) => p.status !== 'offline');
  }

  getUsersViewingResource(resourceType: string, resourceId: string): PresenceState[] {
    return Array.from(this.presenceMap.values()).filter(
      (p) => p.viewingResource && p.viewingResource.type === resourceType && p.viewingResource.id === resourceId,
    );
  }

  getUserLocationDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    Array.from(this.presenceMap.values()).forEach((p) => {
      if (p.status !== 'offline') {
        distribution[p.location] = (distribution[p.location] || 0) + 1;
      }
    });
    return distribution;
  }

  getPresenceStats(): {
    totalUsers: number;
    activeUsers: number;
    awayUsers: number;
    offlineUsers: number;
    locationCount: number;
  } {
    const all = this.getAllPresence();
    const active = this.getActiveUsers();
    const away = this.getAwayUsers();
    const offline = all.filter((p) => p.status === 'offline');
    const locations = new Set(all.map((p) => p.location));

    return {
      totalUsers: all.length,
      activeUsers: active.length,
      awayUsers: away.length,
      offlineUsers: offline.length,
      locationCount: locations.size,
    };
  }

  private startPresenceHeartbeat(): void {
    this.updateInterval = setInterval(() => {
      Array.from(this.presenceMap.values()).forEach((presence) => {
        if (presence.status !== 'offline') {
          this.wsManager.send(WEBSOCKET_EVENTS.PRESENCE_UPDATE, {
            userId: presence.userId,
            status: presence.status,
            timestamp: new Date(),
          });
        }
      });
    }, 15000);
  }

  private handlePresenceUpdate(payload: any): void {
    const presence = payload as PresenceState;
    this.presenceMap.set(presence.userId, presence);
  }

  private handlePresenceJoined(payload: any): void {
    const presence = payload as PresenceState;
    this.presenceMap.set(presence.userId, presence);
    this.emit('user:joined', presence);
  }

  private handlePresenceLeft(payload: any): void {
    this.presenceMap.delete(payload.userId);
    this.emit('user:left', payload);
  }

  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.presenceTimeout.forEach((timer) => clearTimeout(timer));
    this.presenceTimeout.clear();
    this.wsManager.disconnect();
  }
}
