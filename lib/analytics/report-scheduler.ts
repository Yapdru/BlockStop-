import { query } from '@/lib/db';
import crypto from 'crypto';

export interface ScheduledReport {
  reportId: string;
  name: string;
  description?: string;
  schedule: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'html';
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'paused' | 'failed';
  config?: Record<string, any>;
}

export class ReportScheduler {
  /**
   * Schedule a new report
   */
  async scheduleReport(
    report: Partial<ScheduledReport>
  ): Promise<ScheduledReport> {
    try {
      const reportId = crypto.randomUUID();
      const now = new Date();

      // Calculate next run time based on schedule
      const nextRun = this.calculateNextRunTime(report.schedule || 'daily');

      const result = await query(
        `INSERT INTO scheduled_reports (
          report_id, name, description, schedule, recipients, format,
          next_run, status, config, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          reportId,
          report.name,
          report.description || null,
          report.schedule || 'daily',
          JSON.stringify(report.recipients || []),
          report.format || 'pdf',
          nextRun,
          'active',
          JSON.stringify(report.config || {}),
        ]
      );

      const row = result.rows[0];
      return {
        reportId: row.report_id,
        name: row.name,
        description: row.description,
        schedule: row.schedule,
        recipients: JSON.parse(row.recipients),
        format: row.format,
        createdAt: new Date(row.created_at),
        nextRun: new Date(row.next_run),
        status: row.status,
        config: row.config,
      };
    } catch (error) {
      console.error('Report scheduling error:', error);
      throw error;
    }
  }

  /**
   * Generate a report
   */
  async generateReport(reportId: string): Promise<Buffer> {
    try {
      const reportResult = await query(
        `SELECT * FROM scheduled_reports WHERE report_id = $1`,
        [reportId]
      );

      if (reportResult.rows.length === 0) {
        throw new Error(`Report ${reportId} not found`);
      }

      const report = reportResult.rows[0];

      // Generate report based on format
      let reportBuffer: Buffer;

      switch (report.format) {
        case 'pdf':
          reportBuffer = await this.generatePDFReport(report);
          break;
        case 'excel':
          reportBuffer = await this.generateExcelReport(report);
          break;
        case 'html':
          reportBuffer = await this.generateHTMLReport(report);
          break;
        default:
          throw new Error(`Unsupported format: ${report.format}`);
      }

      // Update last run time
      await query(
        `UPDATE scheduled_reports SET last_run = NOW() WHERE report_id = $1`,
        [reportId]
      );

      return reportBuffer;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  /**
   * Send a report to recipients
   */
  async sendReport(reportId: string): Promise<{ sent: number; failed: number }> {
    try {
      const reportResult = await query(
        `SELECT * FROM scheduled_reports WHERE report_id = $1`,
        [reportId]
      );

      if (reportResult.rows.length === 0) {
        return { sent: 0, failed: 0 };
      }

      const report = reportResult.rows[0];
      const recipients = JSON.parse(report.recipients);

      // Generate report
      const reportBuffer = await this.generateReport(reportId);

      let sent = 0;
      let failed = 0;

      // Send to each recipient
      for (const recipient of recipients) {
        try {
          // Mock email sending
          console.log(`Sending report to ${recipient}`);
          sent++;
        } catch (error) {
          console.error(`Failed to send report to ${recipient}:`, error);
          failed++;
        }
      }

      // Log report send event
      await query(
        `INSERT INTO report_send_log (report_id, sent_count, failed_count, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [reportId, sent, failed]
      );

      return { sent, failed };
    } catch (error) {
      console.error('Report sending error:', error);
      return { sent: 0, failed: 1 };
    }
  }

  /**
   * List all scheduled reports
   */
  async listScheduledReports(): Promise<ScheduledReport[]> {
    try {
      const result = await query(
        `SELECT * FROM scheduled_reports ORDER BY created_at DESC`,
        []
      );

      return result.rows.map((row: any) => ({
        reportId: row.report_id,
        name: row.name,
        description: row.description,
        schedule: row.schedule,
        recipients: JSON.parse(row.recipients),
        format: row.format,
        createdAt: new Date(row.created_at),
        lastRun: row.last_run ? new Date(row.last_run) : undefined,
        nextRun: row.next_run ? new Date(row.next_run) : undefined,
        status: row.status,
        config: row.config,
      }));
    } catch (error) {
      console.error('Report listing error:', error);
      return [];
    }
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(reportId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM scheduled_reports WHERE report_id = $1`,
        [reportId]
      );

      // Clean up send logs
      await query(
        `DELETE FROM report_send_log WHERE report_id = $1`,
        [reportId]
      );
    } catch (error) {
      console.error('Report deletion error:', error);
      throw error;
    }
  }

  /**
   * Pause a scheduled report
   */
  async pauseReport(reportId: string): Promise<void> {
    try {
      await query(
        `UPDATE scheduled_reports SET status = 'paused' WHERE report_id = $1`,
        [reportId]
      );
    } catch (error) {
      console.error('Report pause error:', error);
      throw error;
    }
  }

  /**
   * Resume a scheduled report
   */
  async resumeReport(reportId: string): Promise<void> {
    try {
      const nextRun = this.calculateNextRunTime('daily');
      await query(
        `UPDATE scheduled_reports SET status = 'active', next_run = $1 WHERE report_id = $2`,
        [nextRun, reportId]
      );
    } catch (error) {
      console.error('Report resume error:', error);
      throw error;
    }
  }

  /**
   * Get reports due for execution
   */
  async getDueReports(): Promise<ScheduledReport[]> {
    try {
      const result = await query(
        `SELECT * FROM scheduled_reports
         WHERE status = 'active' AND next_run <= NOW()
         ORDER BY next_run ASC`,
        []
      );

      return result.rows.map((row: any) => ({
        reportId: row.report_id,
        name: row.name,
        schedule: row.schedule,
        recipients: JSON.parse(row.recipients),
        format: row.format,
        createdAt: new Date(row.created_at),
        nextRun: new Date(row.next_run),
        status: row.status,
      }));
    } catch (error) {
      console.error('Due reports retrieval error:', error);
      return [];
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<{
    totalReports: number;
    activeReports: number;
    pausedReports: number;
    totalSent: number;
    totalFailed: number;
  }> {
    try {
      const reportStats = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused
         FROM scheduled_reports`,
        []
      );

      const sendStats = await query(
        `SELECT
          SUM(sent_count) as total_sent,
          SUM(failed_count) as total_failed
         FROM report_send_log`,
        []
      );

      const reports = reportStats.rows[0] || {};
      const sends = sendStats.rows[0] || {};

      return {
        totalReports: reports.total || 0,
        activeReports: reports.active || 0,
        pausedReports: reports.paused || 0,
        totalSent: sends.total_sent || 0,
        totalFailed: sends.total_failed || 0,
      };
    } catch (error) {
      console.error('Report stats error:', error);
      return {
        totalReports: 0,
        activeReports: 0,
        pausedReports: 0,
        totalSent: 0,
        totalFailed: 0,
      };
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRunTime(schedule: string): Date {
    const now = new Date();
    const next = new Date(now);

    switch (schedule) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        next.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(report: any): Promise<Buffer> {
    // Mock PDF generation
    const pdfContent = `Report: ${report.name}\nGenerated: ${new Date()}\n`;
    return Buffer.from(pdfContent);
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(report: any): Promise<Buffer> {
    // Mock Excel generation
    const excelContent = `Report\t${report.name}\nDate\t${new Date()}\n`;
    return Buffer.from(excelContent);
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(report: any): Promise<Buffer> {
    const html = `
      <html>
        <head><title>${report.name}</title></head>
        <body>
          <h1>${report.name}</h1>
          <p>Generated: ${new Date()}</p>
        </body>
      </html>
    `;
    return Buffer.from(html);
  }
}

export const reportScheduler = new ReportScheduler();
