import crypto from 'crypto';
import { EventEmitter } from 'events';
import { EncryptionKey } from './types';
import { ENCRYPTION_ALGORITHMS } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

export class EncryptionManager extends EventEmitter {
  private keys: Map<string, EncryptionKey> = new Map();
  private wsManager: WebSocketManager;
  private publicKeys: Map<string, string> = new Map(); // userId -> publicKey
  private masterKey: Buffer | null = null;

  constructor(userId: string) {
    super();
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string, masterKey: Buffer): Promise<void> {
    try {
      this.masterKey = masterKey;
      await this.wsManager.connect(wsUrl);
      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize encryption manager:', error);
      throw error;
    }
  }

  private setupHandlers(): void {
    this.wsManager.on('encryption:key_shared', (payload) => this.handleKeyShared(payload));
    this.wsManager.on('encryption:key_rotated', (payload) => this.handleKeyRotated(payload));
  }

  generateIncidentKey(incidentId: string, algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' = 'AES-256-GCM'): EncryptionKey {
    const id = CollaborationUtils.generateId('key');
    const keyData = crypto.randomBytes(algorithm === 'AES-256-GCM' ? 32 : 32);

    const encKey: EncryptionKey = {
      id,
      incidentId,
      algorithm,
      publicKey: keyData.toString('hex'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.keys.set(id, encKey);
    this.emit('key:generated', encKey);

    return encKey;
  }

  encryptMessage(message: string, incidentId: string): { encryptedData: string; iv: string } {
    const key = Array.from(this.keys.values()).find((k) => k.incidentId === incidentId);
    if (!key) {
      throw new Error('Encryption key not found for incident');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key.publicKey!, 'hex'), iv);

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted + authTag.toString('hex'),
      iv: iv.toString('hex'),
    };
  }

  decryptMessage(encryptedData: string, iv: string, incidentId: string): string {
    const key = Array.from(this.keys.values()).find((k) => k.incidentId === incidentId);
    if (!key) {
      throw new Error('Encryption key not found for incident');
    }

    const authTag = Buffer.from(encryptedData.slice(-32), 'hex');
    const encData = encryptedData.slice(0, -32);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key.publicKey!, 'hex'),
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  encryptData(data: any, incidentId: string): { encrypted: string; iv: string } {
    const jsonString = JSON.stringify(data);
    return this.encryptMessage(jsonString, incidentId);
  }

  decryptData(encrypted: string, iv: string, incidentId: string): any {
    const decrypted = this.decryptMessage(encrypted, iv, incidentId);
    return JSON.parse(decrypted);
  }

  rotateKey(incidentId: string): EncryptionKey {
    const oldKey = Array.from(this.keys.values()).find((k) => k.incidentId === incidentId);
    if (oldKey) {
      oldKey.rotatedAt = new Date();
    }

    const newKey = this.generateIncidentKey(incidentId);
    this.wsManager.broadcast('encryption:key_rotated', { incidentId, oldKeyId: oldKey?.id, newKeyId: newKey.id });
    this.emit('key:rotated', newKey);

    return newKey;
  }

  sharePublicKey(userId: string, publicKey: string): void {
    this.publicKeys.set(userId, publicKey);
    this.wsManager.broadcast('encryption:public_key_shared', { userId, publicKey });
  }

  getPublicKey(userId: string): string | undefined {
    return this.publicKeys.get(userId);
  }

  getIncidentKey(incidentId: string): EncryptionKey | undefined {
    return Array.from(this.keys.values()).find((k) => k.incidentId === incidentId);
  }

  isKeyValid(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (!key) return false;
    return key.expiresAt > new Date();
  }

  isIncidentKeyValid(incidentId: string): boolean {
    const key = this.getIncidentKey(incidentId);
    if (!key) return false;
    return key.expiresAt > new Date();
  }

  encryptFile(fileBuffer: Buffer, incidentId: string): { encrypted: string; iv: string } {
    const key = Array.from(this.keys.values()).find((k) => k.incidentId === incidentId);
    if (!key) {
      throw new Error('Encryption key not found for incident');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key.publicKey!, 'hex'), iv);

    let encrypted = cipher.update(fileBuffer, undefined, 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted + authTag.toString('hex'),
      iv: iv.toString('hex'),
    };
  }

  decryptFile(encryptedData: string, iv: string, incidentId: string): Buffer {
    const key = Array.from(this.keys.values()).find((k) => k.incidentId === incidentId);
    if (!key) {
      throw new Error('Encryption key not found for incident');
    }

    const authTag = Buffer.from(encryptedData.slice(-32), 'hex');
    const encData = encryptedData.slice(0, -32);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key.publicKey!, 'hex'),
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encData, 'hex'), decipher.final()]);
  }

  private handleKeyShared(payload: any): void {
    this.publicKeys.set(payload.userId, payload.publicKey);
    this.emit('public_key:received', payload);
  }

  private handleKeyRotated(payload: any): void {
    const oldKey = this.keys.get(payload.oldKeyId);
    if (oldKey) {
      oldKey.rotatedAt = new Date();
    }
    this.emit('key:rotated_remote', payload);
  }

  getKeyStats(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    publicKeysShared: number;
  } {
    const allKeys = Array.from(this.keys.values());
    const now = new Date();
    const activeKeys = allKeys.filter((k) => k.expiresAt > now).length;
    const expiredKeys = allKeys.filter((k) => k.expiresAt <= now).length;

    return {
      totalKeys: allKeys.length,
      activeKeys,
      expiredKeys,
      publicKeysShared: this.publicKeys.size,
    };
  }

  cleanupExpiredKeys(): void {
    const now = new Date();
    const expiredIds: string[] = [];

    this.keys.forEach((key, id) => {
      if (key.expiresAt <= now) {
        expiredIds.push(id);
      }
    });

    expiredIds.forEach((id) => {
      this.keys.delete(id);
    });

    this.emit('keys:cleaned', { removed: expiredIds.length });
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
