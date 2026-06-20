/**
 * Batch Processor
 * Handles concurrent processing of multiple items (files, emails)
 * Features: worker pool, queue management, progress tracking, backpressure
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export enum BatchStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface BatchItem<T> {
  id: string;
  data: T;
  priority?: number;
  retries?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface BatchConfig {
  maxConcurrent?: number; // Default: 3
  maxRetries?: number; // Default: 2
  backpressureThreshold?: number; // Default: 100
  timeoutMs?: number; // Default: 30000
  autoStart?: boolean; // Default: true
}

export interface BatchProgress {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  itemsPerSecond: number;
}

export interface ProcessingResult<T> {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  duration: number;
  results: Array<{
    itemId: string;
    data: T;
    result?: any;
    error?: string;
  }>;
}

export class BatchProcessor<T> extends EventEmitter {
  private batchId: string;
  private items: Map<string, BatchItem<T>> = new Map();
  private config: Required<BatchConfig>;
  private status: BatchStatus = BatchStatus.IDLE;
  private queue: string[] = [];
  private processing: Set<string> = new Set();
  private timings: {
    startTime?: number;
    itemStartTimes: Map<string, number>;
  } = {
    itemStartTimes: new Map(),
  };
  private processor?: (item: T) => Promise<any>;
  private currentWorkerPool: Promise<void>[] = [];

  constructor(config: BatchConfig = {}) {
    super();
    this.batchId = uuidv4();
    this.config = {
      maxConcurrent: config.maxConcurrent || 3,
      maxRetries: config.maxRetries || 2,
      backpressureThreshold: config.backpressureThreshold || 100,
      timeoutMs: config.timeoutMs || 30000,
      autoStart: config.autoStart !== false,
    };
  }

  /**
   * Set the processor function
   */
  setProcessor(processor: (item: T) => Promise<any>): void {
    this.processor = processor;
  }

  /**
   * Add items to the batch
   */
  async addItems(items: T[]): Promise<void> {
    try {
      // Check backpressure
      const queueSize = this.queue.length + this.processing.size;
      if (queueSize + items.length > this.config.backpressureThreshold) {
        this.emit('warn', {
          message: 'Backpressure threshold exceeded',
          queueSize: queueSize + items.length,
          threshold: this.config.backpressureThreshold,
        });
      }

      // Add items to queue
      for (const data of items) {
        const id = uuidv4();
        const item: BatchItem<T> = {
          id,
          data,
          priority: 0,
          retries: 0,
          status: 'pending',
        };

        this.items.set(id, item);
        this.queue.push(id);
      }

      this.emit('items:added', {
        count: items.length,
        queueSize: this.queue.length,
      });

      // Auto-start processing if configured
      if (this.config.autoStart && this.status === BatchStatus.IDLE) {
        this.start();
      }
    } catch (error) {
      this.emit('error', { error, context: 'addItems' });
    }
  }

  /**
   * Start processing the batch
   */
  async start(): Promise<void> {
    if (this.status === BatchStatus.PROCESSING) {
      return;
    }

    if (!this.processor) {
      throw new Error('Processor function not set');
    }

    this.status = BatchStatus.PROCESSING;
    this.timings.startTime = Date.now();
    this.emit('processing:start', { batchId: this.batchId });

    // Start worker pool
    this.processWorkerPool();
  }

  /**
   * Pause processing
   */
  pause(): void {
    if (this.status === BatchStatus.PROCESSING) {
      this.status = BatchStatus.PAUSED;
      this.emit('processing:paused', { batchId: this.batchId });
    }
  }

  /**
   * Resume processing
   */
  async resume(): Promise<void> {
    if (this.status === BatchStatus.PAUSED) {
      this.status = BatchStatus.PROCESSING;
      this.emit('processing:resumed', { batchId: this.batchId });
      this.processWorkerPool();
    }
  }

  /**
   * Cancel all processing
   */
  async cancel(): Promise<void> {
    this.status = BatchStatus.CANCELLED;
    this.queue = [];
    this.processing.clear();
    this.currentWorkerPool = [];
    this.emit('processing:cancelled', { batchId: this.batchId });
  }

  /**
   * Get current progress
   */
  getProgress(): BatchProgress {
    const completed = Array.from(this.items.values()).filter(
      (i) => i.status === 'completed'
    ).length;
    const failed = Array.from(this.items.values()).filter(
      (i) => i.status === 'failed'
    ).length;
    const inProgress = this.processing.size;
    const total = this.items.size;

    const elapsed = this.timings.startTime ? Date.now() - this.timings.startTime : 0;
    const itemsPerSecond = elapsed > 0 ? (completed / elapsed) * 1000 : 0;

    let estimatedTimeRemaining: number | undefined;
    if (itemsPerSecond > 0 && completed < total) {
      const remaining = total - completed - failed;
      estimatedTimeRemaining = (remaining / itemsPerSecond) * 1000;
    }

    return {
      batchId: this.batchId,
      total,
      completed,
      failed,
      inProgress,
      percentComplete: total > 0 ? (completed / total) * 100 : 0,
      estimatedTimeRemaining,
      itemsPerSecond,
    };
  }

  /**
   * Get batch results
   */
  getResults(): ProcessingResult<T> {
    const items = Array.from(this.items.values());
    const completed = items.filter((i) => i.status === 'completed');
    const failed = items.filter((i) => i.status === 'failed');
    const duration = this.timings.startTime ? Date.now() - this.timings.startTime : 0;

    return {
      success: failed.length === 0,
      itemsProcessed: completed.length,
      itemsFailed: failed.length,
      duration,
      results: items.map((item) => ({
        itemId: item.id,
        data: item.data,
        result: item.result,
        error: item.error,
      })),
    };
  }

  /**
   * Get an item's status
   */
  getItemStatus(itemId: string): BatchItem<T> | null {
    return this.items.get(itemId) || null;
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    const failed = Array.from(this.items.values()).filter((i) => i.status === 'failed');

    for (const item of failed) {
      item.status = 'pending';
      item.retries = 0;
      item.error = undefined;
      item.result = undefined;
      this.queue.unshift(item.id); // Add to front of queue
    }

    this.emit('retry:started', { failedCount: failed.length });

    if (this.status !== BatchStatus.PROCESSING) {
      await this.start();
    } else {
      this.processWorkerPool();
    }
  }

  /**
   * Private: Worker pool processor
   */
  private async processWorkerPool(): Promise<void> {
    try {
      // Spawn workers up to maxConcurrent
      while (this.processing.size < this.config.maxConcurrent && this.queue.length > 0) {
        if (this.status !== BatchStatus.PROCESSING) {
          break;
        }

        const itemId = this.queue.shift();
        if (!itemId) break;

        const worker = this.processItem(itemId);
        this.currentWorkerPool.push(worker);

        // Clean up completed workers
        Promise.resolve(worker).finally(() => {
          this.currentWorkerPool = this.currentWorkerPool.filter((p) => p !== worker);
        });
      }

      // Check if processing is complete
      if (
        this.queue.length === 0 &&
        this.processing.size === 0 &&
        this.currentWorkerPool.length === 0
      ) {
        this.status = BatchStatus.COMPLETED;
        const result = this.getResults();
        this.emit('processing:complete', result);
      }
    } catch (error) {
      this.emit('error', { error, context: 'processWorkerPool' });
    }
  }

  /**
   * Private: Process a single item
   */
  private async processItem(itemId: string): Promise<void> {
    try {
      const item = this.items.get(itemId);
      if (!item || !this.processor) return;

      this.processing.add(itemId);
      item.status = 'processing';
      item.startTime = Date.now();
      this.timings.itemStartTimes.set(itemId, Date.now());

      try {
        const result = await Promise.race([
          this.processor(item.data),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Processing timeout')), this.config.timeoutMs)
          ),
        ]);

        item.result = result;
        item.status = 'completed';

        this.emit('item:completed', {
          itemId,
          duration: Date.now() - item.startTime!,
        });
      } catch (error) {
        const errorMessage = (error as Error).message;
        item.error = errorMessage;

        // Retry if under limit
        if (item.retries! < this.config.maxRetries) {
          item.retries!++;
          item.status = 'pending';
          this.queue.push(itemId); // Re-queue

          this.emit('item:retry', {
            itemId,
            attempt: item.retries,
            maxRetries: this.config.maxRetries,
          });
        } else {
          item.status = 'failed';

          this.emit('item:failed', {
            itemId,
            error: errorMessage,
            retries: item.retries,
          });
        }
      }

      item.endTime = Date.now();
      this.processing.delete(itemId);

      // Emit progress update
      this.emit('progress', this.getProgress());

      // Continue processing
      if (this.status === BatchStatus.PROCESSING) {
        this.processWorkerPool();
      }
    } catch (error) {
      this.emit('error', { error, context: 'processItem', itemId });
    }
  }

  /**
   * Get batch statistics
   */
  getStats() {
    const items = Array.from(this.items.values());
    const completed = items.filter((i) => i.status === 'completed');
    const totalTime = completed.reduce((sum, i) => sum + (i.endTime! - i.startTime! || 0), 0);
    const avgTime = completed.length > 0 ? totalTime / completed.length : 0;

    return {
      totalItems: items.length,
      completed: completed.length,
      failed: items.filter((i) => i.status === 'failed').length,
      pending: items.filter((i) => i.status === 'pending').length,
      processing: this.processing.size,
      averageProcessingTime: avgTime,
      totalTime: this.timings.startTime ? Date.now() - this.timings.startTime : 0,
    };
  }

  /**
   * Clear the batch
   */
  clear(): void {
    this.items.clear();
    this.queue = [];
    this.processing.clear();
    this.timings.itemStartTimes.clear();
    this.status = BatchStatus.IDLE;
    this.emit('batch:cleared');
  }
}
