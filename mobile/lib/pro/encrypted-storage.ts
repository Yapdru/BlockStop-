/**
 * Encrypted Storage for Mobile Pro
 * Provides secure local storage for forensics and sensitive data
 */

import crypto from 'crypto';

export interface EncryptedData {
  id: string;
  dataType: 'forensics' | 'evidence' | 'config' | 'findings';
  encrypted: Buffer;
  iv: Buffer;
  tag: Buffer;
  createdAt: Date;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

export class EncryptedStorageService {
  private masterKey: Buffer;
  private encryptedStore: Map<string, EncryptedData> = new Map();
  private algorithm = 'aes-256-gcm';

  constructor(masterKeyPhrase: string) {
    // Derive key from passphrase
    this.masterKey = crypto.pbkdf2Sync(masterKeyPhrase, 'blockstop-salt', 100000, 32, 'sha256');
  }

  async storeForensicsData(
    dataType: 'forensics' | 'evidence' | 'config' | 'findings',
    data: Buffer,
    metadata: Record<string, unknown>,
    expiresAt?: Date
  ): Promise<string> {
    const id = this.generateStorageId();
    const encrypted = this.encryptData(data);

    const storageRecord: EncryptedData = {
      id,
      dataType,
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
      tag: encrypted.tag,
      createdAt: new Date(),
      expiresAt,
      metadata,
    };

    this.encryptedStore.set(id, storageRecord);
    return id;
  }

  async retrieveForensicsData(id: string): Promise<Buffer | null> {
    const record = this.encryptedStore.get(id);

    if (!record) {
      return null;
    }

    if (record.expiresAt && new Date() > record.expiresAt) {
      this.encryptedStore.delete(id);
      return null;
    }

    return this.decryptData(record.encrypted, record.iv, record.tag);
  }

  async deleteForensicsData(id: string): Promise<boolean> {
    return this.encryptedStore.delete(id);
  }

  async listStoredData(
    dataType?: 'forensics' | 'evidence' | 'config' | 'findings'
  ): Promise<Array<{ id: string; dataType: string; createdAt: Date; size: number }>> {
    const items: Array<{ id: string; dataType: string; createdAt: Date; size: number }> = [];

    for (const [, record] of this.encryptedStore) {
      if (dataType && record.dataType !== dataType) {
        continue;
      }

      if (record.expiresAt && new Date() > record.expiresAt) {
        continue;
      }

      items.push({
        id: record.id,
        dataType: record.dataType,
        createdAt: record.createdAt,
        size: record.encrypted.length,
      });
    }

    return items;
  }

  async getStorageStats(): Promise<{
    totalItems: number;
    totalSize: number;
    itemsByType: Record<string, number>;
    oldestItem: Date | null;
    newestItem: Date | null;
  }> {
    let totalSize = 0;
    const itemsByType: Record<string, number> = {};
    let oldestItem: Date | null = null;
    let newestItem: Date | null = null;

    for (const [, record] of this.encryptedStore) {
      if (record.expiresAt && new Date() > record.expiresAt) {
        continue;
      }

      totalSize += record.encrypted.length;
      itemsByType[record.dataType] = (itemsByType[record.dataType] || 0) + 1;

      if (!oldestItem || record.createdAt < oldestItem) {
        oldestItem = record.createdAt;
      }

      if (!newestItem || record.createdAt > newestItem) {
        newestItem = record.createdAt;
      }
    }

    return {
      totalItems: this.encryptedStore.size,
      totalSize,
      itemsByType,
      oldestItem,
      newestItem,
    };
  }

  async pruneExpiredData(): Promise<number> {
    let pruned = 0;
    const now = new Date();

    for (const [id, record] of this.encryptedStore) {
      if (record.expiresAt && now > record.expiresAt) {
        this.encryptedStore.delete(id);
        pruned++;
      }
    }

    return pruned;
  }

  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<boolean> {
    // Verify old passphrase
    const oldKey = crypto.pbkdf2Sync(oldPassphrase, 'blockstop-salt', 100000, 32, 'sha256');

    if (!oldKey.equals(this.masterKey)) {
      return false;
    }

    // Re-encrypt all data with new passphrase
    const newKey = crypto.pbkdf2Sync(newPassphrase, 'blockstop-salt', 100000, 32, 'sha256');
    this.masterKey = newKey;

    // Note: In production, need to re-encrypt all stored items
    return true;
  }

  private encryptData(data: Buffer): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    return { encrypted, iv, tag };
  }

  private decryptData(encrypted: Buffer, iv: Buffer, tag: Buffer): Buffer {
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  private generateStorageId(): string {
    return `storage-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }
}

export const encryptedStorage = new EncryptedStorageService('blockstop-default-key');
