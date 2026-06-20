import { EventEmitter } from 'events';
import { WebSocketMessage, Participant } from './types';
import { WEBSOCKET_EVENTS, COLLABORATION_CONFIG } from './constants';
import { CollaborationUtils } from './utils';

export class WebSocketManager extends EventEmitter {
  private socket: WebSocket | null = null;
  private sessionId: string;
  private userId: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: NodeJS.Timer | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected: boolean = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(userId: string) {
    super();
    this.sessionId = CollaborationUtils.generateId('session');
    this.userId = userId;
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit(WEBSOCKET_EVENTS.ERROR, error);
          reject(error);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.handleDisconnection();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => handler(message.payload));
      }
      this.emit(message.type, message.payload);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleDisconnection(): void {
    this.stopHeartbeat();
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => {
        this.emit(WEBSOCKET_EVENTS.RECONNECT);
      }, delay);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send(WEBSOCKET_EVENTS.HEARTBEAT, { timestamp: CollaborationUtils.getTimestamp() });
      }
    }, COLLABORATION_CONFIG.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(type: string, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: CollaborationUtils.getTimestamp(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.socket && this.isConnected) {
        try {
          this.socket.send(JSON.stringify(message));
        } catch (error) {
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  subscribe(eventType: string, handler: Function): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  broadcast(eventType: string, payload: any): void {
    this.send(eventType, {
      action: 'broadcast',
      payload,
    });
  }

  acknowledge(messageId: string, status: 'success' | 'error', data?: any): void {
    this.send('ack', {
      messageId,
      status,
      data,
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  getConnectionStats(): {
    connected: boolean;
    queuedMessages: number;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
