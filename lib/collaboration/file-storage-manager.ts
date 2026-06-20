import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { COLLABORATION_CONFIG } from './constants';
import { CollaborationUtils } from './utils';
import { WebSocketManager } from './websocket-manager';

interface StoredFile {
  id: string;
  incidentId: string;
  evidenceId: string;
  filename: string;
  size: number;
  mimeType: string;
  hash: string;
  uploadedBy: string;
  uploadedAt: Date;
  storagePath: string;
}

export class FileStorageManager extends EventEmitter {
  private baseStoragePath: string;
  private fileIndex: Map<string, StoredFile> = new Map();
  private wsManager: WebSocketManager;
  private fileAccessLog: Array<{ fileId: string; userId: string; action: string; timestamp: Date }> = [];

  constructor(userId: string, baseStoragePath: string = '/var/blockstop/collaboration/storage') {
    super();
    this.baseStoragePath = baseStoragePath;
    this.wsManager = new WebSocketManager(userId);
  }

  async initialize(wsUrl: string): Promise<void> {
    try {
      await this.ensureStorageDirectories();
      await this.wsManager.connect(wsUrl);
    } catch (error) {
      console.error('Failed to initialize file storage manager:', error);
      throw error;
    }
  }

  private async ensureStorageDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.baseStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
      throw error;
    }
  }

  async uploadFile(
    incidentId: string,
    evidenceId: string,
    filename: string,
    fileBuffer: Buffer,
    mimeType: string,
    uploadedBy: string,
  ): Promise<StoredFile> {
    if (fileBuffer.length > COLLABORATION_CONFIG.MAX_FILE_SIZE) {
      throw new Error('File exceeds maximum size limit');
    }

    const fileId = CollaborationUtils.generateEvidenceId();
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const storagePath = path.join(this.baseStoragePath, incidentId, fileId);

    try {
      await fs.mkdir(path.dirname(storagePath), { recursive: true });
      await fs.writeFile(storagePath, fileBuffer);

      const storedFile: StoredFile = {
        id: fileId,
        incidentId,
        evidenceId,
        filename,
        size: fileBuffer.length,
        mimeType,
        hash,
        uploadedBy,
        uploadedAt: new Date(),
        storagePath,
      };

      this.fileIndex.set(fileId, storedFile);
      this.logFileAccess(fileId, uploadedBy, 'upload');
      this.emit('file:uploaded', storedFile);

      return storedFile;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string, userId: string): Promise<Buffer> {
    const file = this.fileIndex.get(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    try {
      const fileBuffer = await fs.readFile(file.storagePath);
      this.logFileAccess(fileId, userId, 'download');
      this.emit('file:downloaded', { fileId, userId });
      return fileBuffer;
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = this.fileIndex.get(fileId);
    if (!file) {
      return false;
    }

    try {
      await fs.unlink(file.storagePath);
      this.fileIndex.delete(fileId);
      this.logFileAccess(fileId, userId, 'delete');
      this.emit('file:deleted', { fileId });
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  getFile(fileId: string): StoredFile | undefined {
    return this.fileIndex.get(fileId);
  }

  getIncidentFiles(incidentId: string): StoredFile[] {
    return Array.from(this.fileIndex.values()).filter((f) => f.incidentId === incidentId);
  }

  getEvidenceFiles(evidenceId: string): StoredFile[] {
    return Array.from(this.fileIndex.values()).filter((f) => f.evidenceId === evidenceId);
  }

  async verifyFileIntegrity(fileId: string): Promise<boolean> {
    const file = this.fileIndex.get(fileId);
    if (!file) return false;

    try {
      const fileBuffer = await fs.readFile(file.storagePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      return hash === file.hash;
    } catch (error) {
      return false;
    }
  }

  private logFileAccess(fileId: string, userId: string, action: string): void {
    this.fileAccessLog.push({
      fileId,
      userId,
      action,
      timestamp: new Date(),
    });
  }

  getFileAccessLog(fileId: string, limit: number = 50): Array<any> {
    return this.fileAccessLog.filter((log) => log.fileId === fileId).slice(-limit);
  }

  getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    byIncident: Record<string, { count: number; size: number }>;
  } {
    const files = Array.from(this.fileIndex.values());
    const byIncident: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;

    files.forEach((f) => {
      if (!byIncident[f.incidentId]) {
        byIncident[f.incidentId] = { count: 0, size: 0 };
      }
      byIncident[f.incidentId].count++;
      byIncident[f.incidentId].size += f.size;
      totalSize += f.size;
    });

    return {
      totalFiles: files.length,
      totalSize,
      byIncident,
    };
  }

  async cleanupOldFiles(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filesToDelete: string[] = [];
    this.fileIndex.forEach((file, id) => {
      if (file.uploadedAt < cutoffDate) {
        filesToDelete.push(id);
      }
    });

    for (const fileId of filesToDelete) {
      await this.deleteFile(fileId, 'system');
    }

    this.emit('files:cleaned', { removed: filesToDelete.length });
    return filesToDelete.length;
  }

  getAllFiles(): StoredFile[] {
    return Array.from(this.fileIndex.values());
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }
}
