import { EventEmitter } from 'events';
import { CommunicationMessage } from './types';
import { WEBSOCKET_EVENTS, COLLABORATION_CONFIG } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class CommunicationChannel extends EventEmitter {
  private channelId: string;
  private messages: Map<string, CommunicationMessage> = new Map();
  private wsManager: WebSocketManager;
  private threads: Map<string, string[]> = new Map(); // messageId -> replyIds
  private typingUsers: Set<string> = new Set();
  private messageIndex: Map<string, CommunicationMessage[]> = new Map(); // userId -> messages

  constructor(channelId: string, userId: string) {
    super();
    this.channelId = channelId;
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize communication channel:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on(WEBSOCKET_EVENTS.MESSAGE_SENT, (payload) => this.handleMessageSent(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.MESSAGE_EDITED, (payload) => this.handleMessageEdited(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.MESSAGE_DELETED, (payload) => this.handleMessageDeleted(payload));
    this.wsManager.on(WEBSOCKET_EVENTS.MESSAGE_REACTION, (payload) => this.handleMessageReaction(payload));
  }

  sendMessage(message: Omit<CommunicationMessage, 'id' | 'createdAt' | 'editedAt' | 'reactions' | 'replyCount'>): CommunicationMessage {
    const id = CollaborationUtils.generateMessageId();
    const fullMessage: CommunicationMessage = {
      ...message,
      id,
      createdAt: new Date(),
      reactions: {},
      replyCount: 0,
    };

    this.messages.set(id, fullMessage);

    if (!this.messageIndex.has(message.userId)) {
      this.messageIndex.set(message.userId, []);
    }
    this.messageIndex.get(message.userId)!.push(fullMessage);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.MESSAGE_SENT, fullMessage);
    this.emit('message:sent', fullMessage);

    return fullMessage;
  }

  editMessage(messageId: string, newContent: string): CommunicationMessage | undefined {
    const message = this.messages.get(messageId);
    if (!message) return undefined;

    message.content = newContent;
    message.editedAt = new Date();

    this.wsManager.broadcast(WEBSOCKET_EVENTS.MESSAGE_EDITED, message);
    this.emit('message:edited', message);

    return message;
  }

  deleteMessage(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    this.messages.delete(messageId);

    if (this.messageIndex.has(message.userId)) {
      const idx = this.messageIndex.get(message.userId)!.findIndex((m) => m.id === messageId);
      if (idx !== -1) this.messageIndex.get(message.userId)!.splice(idx, 1);
    }

    this.threads.delete(messageId);

    this.wsManager.broadcast(WEBSOCKET_EVENTS.MESSAGE_DELETED, { messageId });
    this.emit('message:deleted', { messageId });

    return true;
  }

  getMessage(messageId: string): CommunicationMessage | undefined {
    return this.messages.get(messageId);
  }

  getMessages(limit: number = 100): CommunicationMessage[] {
    return Array.from(this.messages.values()).slice(-limit);
  }

  getMessagesByUser(userId: string, limit: number = 50): CommunicationMessage[] {
    return (this.messageIndex.get(userId) || []).slice(-limit);
  }

  getMessageRange(startDate: Date, endDate: Date): CommunicationMessage[] {
    return Array.from(this.messages.values()).filter((m) => m.createdAt >= startDate && m.createdAt <= endDate);
  }

  searchMessages(query: string): CommunicationMessage[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.messages.values()).filter(
      (m) =>
        m.content.toLowerCase().includes(lowerQuery) ||
        m.username.toLowerCase().includes(lowerQuery) ||
        m.mentions.some((mention) => mention.toLowerCase().includes(lowerQuery)),
    );
  }

  addReaction(messageId: string, userId: string, emoji: string): CommunicationMessage | undefined {
    const message = this.messages.get(messageId);
    if (!message) return undefined;

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }

    if (!message.reactions[emoji].includes(userId)) {
      message.reactions[emoji].push(userId);
    }

    this.wsManager.broadcast(WEBSOCKET_EVENTS.MESSAGE_REACTION, {
      messageId,
      userId,
      emoji,
      action: 'add',
    });

    this.emit('reaction:added', { messageId, emoji, userId });

    return message;
  }

  removeReaction(messageId: string, userId: string, emoji: string): CommunicationMessage | undefined {
    const message = this.messages.get(messageId);
    if (!message) return undefined;

    if (message.reactions[emoji]) {
      const idx = message.reactions[emoji].indexOf(userId);
      if (idx !== -1) {
        message.reactions[emoji].splice(idx, 1);
      }

      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    }

    this.wsManager.broadcast(WEBSOCKET_EVENTS.MESSAGE_REACTION, {
      messageId,
      userId,
      emoji,
      action: 'remove',
    });

    this.emit('reaction:removed', { messageId, emoji, userId });

    return message;
  }

  createThread(parentMessageId: string): string {
    if (!this.threads.has(parentMessageId)) {
      this.threads.set(parentMessageId, []);
    }
    return parentMessageId;
  }

  getThread(parentMessageId: string): CommunicationMessage[] {
    const replyIds = this.threads.get(parentMessageId) || [];
    return replyIds
      .map((id) => this.messages.get(id))
      .filter((m) => m !== undefined) as CommunicationMessage[];
  }

  addReplyToThread(parentMessageId: string, replyId: string): void {
    if (!this.threads.has(parentMessageId)) {
      this.threads.set(parentMessageId, []);
    }
    this.threads.get(parentMessageId)!.push(replyId);

    const parent = this.messages.get(parentMessageId);
    if (parent) {
      parent.replyCount++;
    }
  }

  setTyping(userId: string): void {
    this.typingUsers.add(userId);
    setTimeout(() => {
      this.typingUsers.delete(userId);
    }, 3000);
    this.emit('users:typing', Array.from(this.typingUsers));
  }

  getTypingUsers(): string[] {
    return Array.from(this.typingUsers);
  }

  private handleMessageSent(payload: any): void {
    if (payload.channelId === this.channelId) {
      const message = payload as CommunicationMessage;
      this.messages.set(message.id, message);

      if (!this.messageIndex.has(message.userId)) {
        this.messageIndex.set(message.userId, []);
      }
      this.messageIndex.get(message.userId)!.push(message);
    }
  }

  private handleMessageEdited(payload: any): void {
    if (this.messages.has(payload.id)) {
      this.messages.set(payload.id, payload);
    }
  }

  private handleMessageDeleted(payload: any): void {
    this.messages.delete(payload.messageId);
  }

  private handleMessageReaction(payload: any): void {
    const message = this.messages.get(payload.messageId);
    if (!message) return;

    if (payload.action === 'add') {
      if (!message.reactions[payload.emoji]) {
        message.reactions[payload.emoji] = [];
      }
      message.reactions[payload.emoji].push(payload.userId);
    } else if (payload.action === 'remove') {
      if (message.reactions[payload.emoji]) {
        const idx = message.reactions[payload.emoji].indexOf(payload.userId);
        if (idx !== -1) {
          message.reactions[payload.emoji].splice(idx, 1);
        }
      }
    }
  }

  getChannelStats(): {
    messageCount: number;
    userCount: number;
    threadCount: number;
    averageMessagesPerUser: number;
  } {
    return {
      messageCount: this.messages.size,
      userCount: this.messageIndex.size,
      threadCount: this.threads.size,
      averageMessagesPerUser: this.messages.size / Math.max(this.messageIndex.size, 1),
    };
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
