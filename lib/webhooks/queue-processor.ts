// Queue Processor - Bull Queue Worker for Processing Webhook Deliveries
import { PayloadSigner } from './payload-signer';
import { RetryHandler, RetryConfig } from './retry-handler';
import { eventPublisher, QueueJob } from './event-publisher';
import crypto from 'crypto';

export interface ProcessingConfig {
  concurrency: number;
  processIntervalMs: number;
  requestTimeoutMs: number;
  retryConfig: Partial<RetryConfig>;
  dlqMaxSize: number;
}

export interface DeliveryResult {
  jobId: string;
  webhookId: string;
  eventId: string;
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  nextRetryAt?: Date;
  shouldRetry: boolean;
}

export class QueueProcessor {
  private config: ProcessingConfig;
  private isProcessing = false;
  private deadLetterQueue: Map<string, QueueJob> = new Map();
  private processingStats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
    dlqd: 0,
  };

  private static readonly DEFAULT_CONFIG: ProcessingConfig = {
    concurrency: 5,
    processIntervalMs: 1000,
    requestTimeoutMs: 30000,
    retryConfig: {
      maxRetries: 7,
      initialDelayMs: 1000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
      jitterFactor: 0.1,
    },
    dlqMaxSize: 10000,
  };

  constructor(config?: Partial<ProcessingConfig>) {
    this.config = {
      ...QueueProcessor.DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Start processing queue
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      console.warn('Queue processor already running');
      return;
    }

    this.isProcessing = true;
    console.log('Queue processor started');

    this.processLoop();
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    this.isProcessing = false;
    console.log('Queue processor stopped');
  }

  /**
   * Main processing loop
   */
  private async processLoop(): Promise<void> {
    while (this.isProcessing) {
      try {
        // Process multiple jobs concurrently
        const jobs: Promise<void>[] = [];
        for (let i = 0; i < this.config.concurrency; i++) {
          const job = eventPublisher.getNextJob();
          if (!job) break;

          jobs.push(this.processJob(job));
        }

        if (jobs.length > 0) {
          await Promise.allSettled(jobs);
        }

        // Wait before next batch
        await this.sleep(this.config.processIntervalMs);
      } catch (error) {
        console.error('Error in queue processing loop:', error);
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: QueueJob): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      job.attempts++;

      // Fetch webhook configuration (mock - would query database)
      const webhookSecret = this.getWebhookSecret(job.data.webhookId);
      if (!webhookSecret) {
        return this.createDeliveryResult(
          job,
          false,
          undefined,
          'Webhook not found',
          false
        );
      }

      // Prepare delivery payload
      const headers = PayloadSigner.generateSignatureHeaders(
        job.data.payload,
        webhookSecret
      );

      // Deliver webhook
      const response = await this.deliverWebhook(
        job.data.webhookId,
        job.data.payload,
        headers
      );

      const responseTime = Date.now() - startTime;

      // Check if delivery was successful
      if (response.success) {
        this.processingStats.succeeded++;
        return this.createDeliveryResult(
          job,
          true,
          response.statusCode,
          undefined,
          false,
          responseTime
        );
      }

      // Determine if should retry
      const retryContext = {
        statusCode: response.statusCode,
        error: response.error,
        isRetryable:
          response.statusCode !== undefined
            ? RetryHandler.isRetryable({
                statusCode: response.statusCode,
                isRetryable: false,
              })
            : false,
      };

      const shouldRetry =
        job.attempts < job.maxAttempts &&
        RetryHandler.isRetryable(retryContext);

      if (shouldRetry) {
        this.processingStats.retried++;
        const retryAttempt = RetryHandler.getRetryAttempt(
          job.attempts,
          this.config.retryConfig
        );
        return this.createDeliveryResult(
          job,
          false,
          response.statusCode,
          response.error,
          true,
          responseTime,
          retryAttempt.nextRetryAt
        );
      }

      // Move to DLQ if max retries exceeded
      if (job.attempts >= job.maxAttempts) {
        this.processingStats.dlqd++;
        if (this.deadLetterQueue.size < this.config.dlqMaxSize) {
          this.deadLetterQueue.set(job.id, job);
        }
      } else {
        this.processingStats.failed++;
      }

      return this.createDeliveryResult(
        job,
        false,
        response.statusCode,
        response.error,
        false,
        responseTime
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.processingStats.failed++;

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createDeliveryResult(
        job,
        false,
        undefined,
        errorMessage,
        false,
        responseTime
      );
    }
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(
    webhookId: string,
    payload: string,
    headers: Record<string, string>
  ): Promise<{
    success: boolean;
    statusCode?: number;
    error?: string;
  }> {
    try {
      // Mock webhook endpoint - would be actual fetch call
      const webhookUrl = this.getWebhookUrl(webhookId);
      if (!webhookUrl) {
        return {
          success: false,
          error: 'Webhook URL not found',
        };
      }

      // In production, replace with actual fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.requestTimeoutMs
      );

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: payload,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const success = response.ok;
        return {
          success,
          statusCode: response.status,
          error: !success ? `HTTP ${response.status}` : undefined,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            statusCode: 408,
            error: 'Request timeout',
          };
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create delivery result object
   */
  private createDeliveryResult(
    job: QueueJob,
    success: boolean,
    statusCode?: number,
    error?: string,
    shouldRetry: boolean = false,
    responseTime?: number,
    nextRetryAt?: Date
  ): DeliveryResult {
    this.processingStats.processed++;

    return {
      jobId: job.id,
      webhookId: job.data.webhookId,
      eventId: job.data.eventId,
      success,
      statusCode,
      responseTime,
      error,
      nextRetryAt,
      shouldRetry,
    };
  }

  /**
   * Get webhook secret (mock - would query database)
   */
  private getWebhookSecret(webhookId: string): string | null {
    // In production, would fetch from database
    // For now, return a mock secret
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get webhook URL (mock - would query database)
   */
  private getWebhookUrl(webhookId: string): string | null {
    // In production, would fetch from database
    // For now, return null for mock
    return null;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get DLQ events
   */
  getDLQEvents(limit: number = 100): QueueJob[] {
    return Array.from(this.deadLetterQueue.values()).slice(0, limit);
  }

  /**
   * Get DLQ size
   */
  getDLQSize(): number {
    return this.deadLetterQueue.size;
  }

  /**
   * Replay DLQ event
   */
  replayDLQEvent(jobId: string): boolean {
    const job = this.deadLetterQueue.get(jobId);
    if (!job) return false;

    // Reset attempts for replay
    job.attempts = 0;

    // Re-queue the job
    const newJob: QueueJob = {
      ...job,
      id: `job_${crypto.randomBytes(8).toString('hex')}`,
    };

    // In production, would push back to queue
    this.deadLetterQueue.delete(jobId);
    return true;
  }

  /**
   * Get processing statistics
   */
  getStats(): typeof this.processingStats & { dlqSize: number; isRunning: boolean } {
    return {
      ...this.processingStats,
      dlqSize: this.deadLetterQueue.size,
      isRunning: this.isProcessing,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.processingStats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
      dlqd: 0,
    };
  }

  /**
   * Health check
   */
  getHealth(): {
    healthy: boolean;
    isRunning: boolean;
    successRate: number;
    dlqSize: number;
  } {
    const total =
      this.processingStats.processed || 1;
    const successRate =
      (this.processingStats.succeeded / total) * 100;

    return {
      healthy:
        this.isProcessing && successRate >= 95 && this.deadLetterQueue.size < 100,
      isRunning: this.isProcessing,
      successRate: Math.round(successRate * 100) / 100,
      dlqSize: this.deadLetterQueue.size,
    };
  }
}

// Export singleton instance
export const queueProcessor = new QueueProcessor();
