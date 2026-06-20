/**
 * Sync Queue Manager
 * FIFO queue with priority support, retry logic, and persistence
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { QueuedChange, SyncConfig } from './sync-types';

export interface QueuePersistence {
  save(changes: QueuedChange[]): Promise<void>;
  load(): Promise<QueuedChange[]>;
  clear(): Promise<void>;
}

export class SyncQueue extends EventEmitter {
  private queue: QueuedChange[] = [];
  private maxQueueSize: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private persistence?: QueuePersistence;
  private isProcessing = false;

  constructor(
    config: SyncConfig,
    persistence?: QueuePersistence
  ) {
    super();
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 5000;
    this.persistence = persistence;
  }

  /**
   * Initialize queue from storage
   */
  async initialize(): Promise<void> {
    try {
      if (this.persistence) {
        const changes = await this.persistence.load();
        this.queue = changes.sort((a, b) => b.priority - a.priority);
      }
      this.emit('initialized', { size: this.queue.length });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Add a change to the queue
   */
  async enqueue(change: Omit<QueuedChange, 'id' | 'retries' | 'timestamp'>): Promise<string> {
    try {
      if (this.queue.length >= this.maxQueueSize) {
        throw new Error(`Queue is full (max: ${this.maxQueueSize})`);
      }

      const queuedChange: QueuedChange = {
        ...change,
        id: uuidv4(),
        retries: 0,
        timestamp: Date.now(),
      };

      // Insert based on priority (higher priority comes first)
      let insertIndex = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].priority < queuedChange.priority) {
          insertIndex = i;
          break;
        }
      }

      this.queue.splice(insertIndex, 0, queuedChange);

      // Persist if enabled
      if (this.persistence) {
        await this.persistence.save(this.queue);
      }

      this.emit('change:queued', {
        id: queuedChange.id,
        size: this.queue.length,
      });

      return queuedChange.id;
    } catch (error) {
      this.emit('error', { error, context: 'enqueue' });
      throw error;
    }
  }

  /**
   * Get next change to process
   */
  getNext(): QueuedChange | null {
    if (this.queue.length === 0) return null;
    return this.queue[0];
  }

  /**
   * Peek at next N changes without removing
   */
  peek(count: number = 10): QueuedChange[] {
    return this.queue.slice(0, count);
  }

  /**
   * Mark change as successfully synced and remove from queue
   */
  async markSuccess(id: string): Promise<void> {
    try {
      const index = this.queue.findIndex((c) => c.id === id);
      if (index >= 0) {
        this.queue.splice(index, 1);

        if (this.persistence) {
          await this.persistence.save(this.queue);
        }

        this.emit('change:success', {
          id,
          remaining: this.queue.length,
        });
      }
    } catch (error) {
      this.emit('error', { error, context: 'markSuccess' });
      throw error;
    }
  }

  /**
   * Mark change as failed and retry if under limit
   */
  async markFailed(id: string, error: Error): Promise<boolean> {
    try {
      const change = this.queue.find((c) => c.id === id);
      if (!change) return false;

      change.retries++;
      change.lastAttempt = Date.now();
      change.error = error.message;

      if (change.retries >= this.maxRetries) {
        this.emit('change:failed', {
          id,
          error: error.message,
          retries: change.retries,
        });
        return false;
      }

      // Move to end of queue for retry
      const index = this.queue.indexOf(change);
      if (index >= 0) {
        this.queue.splice(index, 1);
        this.queue.push(change);
      }

      if (this.persistence) {
        await this.persistence.save(this.queue);
      }

      this.emit('change:retry', {
        id,
        retry: change.retries,
        maxRetries: this.maxRetries,
      });

      return true;
    } catch (error) {
      this.emit('error', { error, context: 'markFailed' });
      return false;
    }
  }

  /**
   * Remove a specific change from queue
   */
  async remove(id: string): Promise<void> {
    try {
      const index = this.queue.findIndex((c) => c.id === id);
      if (index >= 0) {
        this.queue.splice(index, 1);

        if (this.persistence) {
          await this.persistence.save(this.queue);
        }

        this.emit('change:removed', {
          id,
          remaining: this.queue.length,
        });
      }
    } catch (error) {
      this.emit('error', { error, context: 'remove' });
      throw error;
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    failed: number;
    avgRetries: number;
  } {
    const failed = this.queue.filter((c) => c.retries > 0).length;
    const avgRetries = failed > 0
      ? this.queue.reduce((sum, c) => sum + c.retries, 0) / failed
      : 0;

    return {
      total: this.queue.length,
      pending: this.queue.filter((c) => c.retries === 0).length,
      failed,
      avgRetries,
    };
  }

  /**
   * Get all queued changes
   */
  getAll(): QueuedChange[] {
    return [...this.queue];
  }

  /**
   * Clear the queue
   */
  async clear(): Promise<void> {
    try {
      this.queue = [];

      if (this.persistence) {
        await this.persistence.clear();
      }

      this.emit('queue:cleared');
    } catch (error) {
      this.emit('error', { error, context: 'clear' });
      throw error;
    }
  }

  /**
   * Get changes by resource type
   */
  getByResource(resource: string): QueuedChange[] {
    return this.queue.filter((c) => c.resource === resource);
  }

  /**
   * Get changes by resource ID
   */
  getByResourceId(resourceId: string): QueuedChange[] {
    return this.queue.filter((c) => c.resourceId === resourceId);
  }

  /**
   * Remove duplicate operations (e.g., multiple updates to same resource)
   */
  async deduplicateUpdates(): Promise<number> {
    try {
      const seen = new Map<string, QueuedChange>();
      const toRemove: string[] = [];

      // Process in reverse order (keep newest)
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const change = this.queue[i];
        const key = `${change.resource}:${change.resourceId}`;

        if (seen.has(key)) {
          // Keep the newer one, remove the older
          const existing = seen.get(key)!;
          if (existing.timestamp > change.timestamp) {
            toRemove.push(change.id);
          } else {
            toRemove.push(existing.id);
            seen.set(key, change);
          }
        } else {
          seen.set(key, change);
        }
      }

      // Remove duplicates
      for (const id of toRemove) {
        await this.remove(id);
      }

      if (toRemove.length > 0 && this.persistence) {
        await this.persistence.save(this.queue);
      }

      this.emit('deduplication:complete', { removed: toRemove.length });
      return toRemove.length;
    } catch (error) {
      this.emit('error', { error, context: 'deduplicateUpdates' });
      return 0;
    }
  }
}
