import { query } from '@/lib/db';
import crypto from 'crypto';

export interface ETLJob {
  jobId: string;
  source: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  rowsProcessed: number;
  errors: string[];
}

export interface ETLJobConfig {
  source: string;
  target: string;
  schedule?: string;
  transformFunction?: string;
  batchSize?: number;
  retryCount?: number;
}

export class ETLPipeline {
  private jobs: Map<string, ETLJob> = new Map();

  /**
   * Create a new ETL job
   */
  async createJob(jobConfig: ETLJobConfig): Promise<ETLJob> {
    const jobId = crypto.randomUUID();

    const job: ETLJob = {
      jobId,
      source: jobConfig.source,
      target: jobConfig.target,
      status: 'pending',
      rowsProcessed: 0,
      errors: [],
    };

    // Store job in database
    try {
      await query(
        `INSERT INTO etl_jobs (job_id, source, target, schedule, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [jobId, jobConfig.source, jobConfig.target, jobConfig.schedule || null, 'pending']
      );
    } catch (error) {
      console.error('Failed to create ETL job:', error);
      job.errors.push(`Database error: ${String(error)}`);
    }

    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Run an ETL job
   */
  async runJob(jobId: string): Promise<ETLJob> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'running';
    job.startTime = new Date();
    job.rowsProcessed = 0;
    job.errors = [];

    try {
      // Update job status in database
      await query(
        `UPDATE etl_jobs SET status = $1, started_at = NOW() WHERE job_id = $2`,
        ['running', jobId]
      );

      // Execute data transfer
      const result = await query(
        `INSERT INTO ${job.target} SELECT * FROM ${job.source}`,
        []
      );

      job.rowsProcessed = result.rowCount || 0;
      job.status = 'completed';
      job.endTime = new Date();

      // Update job completion in database
      await query(
        `UPDATE etl_jobs SET status = $1, rows_processed = $2, ended_at = NOW() WHERE job_id = $3`,
        ['completed', job.rowsProcessed, jobId]
      );
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      const errorMsg = String(error);
      job.errors.push(errorMsg);

      // Update job failure in database
      await query(
        `UPDATE etl_jobs SET status = $1, error_message = $2, ended_at = NOW() WHERE job_id = $3`,
        ['failed', errorMsg, jobId]
      );

      console.error(`ETL Job ${jobId} failed:`, error);
    }

    return job;
  }

  /**
   * Get the status of an ETL job
   */
  async getJobStatus(jobId: string): Promise<ETLJob> {
    const cachedJob = this.jobs.get(jobId);

    if (cachedJob) {
      return cachedJob;
    }

    try {
      const result = await query(
        `SELECT job_id, source, target, status, started_at, ended_at, rows_processed, error_message
         FROM etl_jobs WHERE job_id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const row = result.rows[0];
      const job: ETLJob = {
        jobId: row.job_id,
        source: row.source,
        target: row.target,
        status: row.status,
        startTime: row.started_at ? new Date(row.started_at) : undefined,
        endTime: row.ended_at ? new Date(row.ended_at) : undefined,
        rowsProcessed: row.rows_processed || 0,
        errors: row.error_message ? [row.error_message] : [],
      };

      this.jobs.set(jobId, job);
      return job;
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * List all ETL jobs
   */
  async listJobs(): Promise<ETLJob[]> {
    try {
      const result = await query(
        `SELECT job_id, source, target, status, started_at, ended_at, rows_processed
         FROM etl_jobs
         ORDER BY created_at DESC
         LIMIT 100`,
        []
      );

      return result.rows.map((row: any) => ({
        jobId: row.job_id,
        source: row.source,
        target: row.target,
        status: row.status,
        startTime: row.started_at ? new Date(row.started_at) : undefined,
        endTime: row.ended_at ? new Date(row.ended_at) : undefined,
        rowsProcessed: row.rows_processed || 0,
        errors: [],
      }));
    } catch (error) {
      console.error('Failed to list jobs:', error);
      return [];
    }
  }

  /**
   * Transform data using a provided transformation function
   */
  async transformData(sourceData: any[], transformFn: Function): Promise<any[]> {
    try {
      return sourceData.map((row) => {
        try {
          return transformFn(row);
        } catch (error) {
          console.error('Transform error for row:', error);
          return null;
        }
      }).filter((row) => row !== null);
    } catch (error) {
      console.error('Data transformation error:', error);
      throw error;
    }
  }

  /**
   * Load data into target table
   */
  async loadData(data: any[], targetTable: string): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    try {
      // Get column names from first row
      const columns = Object.keys(data[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.join(', ');

      let totalLoaded = 0;

      // Load in batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        for (const row of batch) {
          const values = columns.map((col) => row[col]);

          try {
            const result = await query(
              `INSERT INTO ${targetTable} (${columnNames}) VALUES (${placeholders})`,
              values
            );
            totalLoaded += result.rowCount || 0;
          } catch (error) {
            console.error('Failed to insert row:', error);
          }
        }
      }

      return totalLoaded;
    } catch (error) {
      console.error('Data load error:', error);
      throw error;
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      await query('DELETE FROM etl_jobs WHERE job_id = $1', [jobId]);
      this.jobs.delete(jobId);
    } catch (error) {
      console.error('Failed to delete job:', error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStatistics(): Promise<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
    totalRowsProcessed: number;
  }> {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(COALESCE(rows_processed, 0)) as total_rows_processed
         FROM etl_jobs`,
        []
      );

      const stats = result.rows[0] || {};
      return {
        total: parseInt(stats.total, 10) || 0,
        completed: parseInt(stats.completed, 10) || 0,
        failed: parseInt(stats.failed, 10) || 0,
        running: parseInt(stats.running, 10) || 0,
        pending: parseInt(stats.pending, 10) || 0,
        totalRowsProcessed: parseInt(stats.total_rows_processed, 10) || 0,
      };
    } catch (error) {
      console.error('Failed to get job statistics:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        pending: 0,
        totalRowsProcessed: 0,
      };
    }
  }
}

export const etlPipeline = new ETLPipeline();
