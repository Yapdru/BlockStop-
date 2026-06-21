import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: require('winston').format.json(),
  transports: [
    new require('winston').transports.File({ filename: '/var/log/blockstop/backups.log' }),
    new require('winston').transports.Console(),
  ],
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  database: string;
  size: number;
  duration: number; // in seconds
  status: 'success' | 'failed' | 'in-progress';
  location: string; // S3 path
  checksum: string; // SHA256 hash
}

export class BackupManager {
  private backupDir: string = '/var/lib/blockstop/backups';
  private s3Bucket: string;
  private s3Prefix: string;
  private databaseUrl: string;

  constructor(databaseUrl: string, s3Bucket: string, s3Prefix: string = 'database-backups') {
    this.databaseUrl = databaseUrl;
    this.s3Bucket = s3Bucket;
    this.s3Prefix = s3Prefix;

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create database backup
   */
  async createBackup(): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}`;
    const backupFile = path.join(this.backupDir, `${backupId}.sql.gz`);
    const startTime = Date.now();

    try {
      logger.info(`Starting backup: ${backupId}`);

      // Extract database connection details
      const dbUrl = new URL(this.databaseUrl);
      const database = dbUrl.pathname.slice(1);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Create backup
      const env = { ...process.env, PGPASSWORD: password };
      const command = `pg_dump -h ${host} -p ${port} -U ${username} ${database} | gzip > ${backupFile}`;

      execSync(command, { env });

      // Calculate checksum
      const fileBuffer = fs.readFileSync(backupFile);
      const checksum = require('crypto')
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      const stats = fs.statSync(backupFile);
      const duration = (Date.now() - startTime) / 1000;

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        database,
        size: stats.size,
        duration,
        status: 'success',
        location: `s3://${this.s3Bucket}/${this.s3Prefix}/${backupId}.sql.gz`,
        checksum,
      };

      logger.info(`Backup created successfully: ${backupId}`, metadata);
      return metadata;
    } catch (error) {
      logger.error(`Backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Upload backup to S3
   */
  async uploadBackupToS3(backupFile: string, metadata: BackupMetadata): Promise<void> {
    try {
      const fileContent = fs.readFileSync(backupFile);
      const key = `${this.s3Prefix}/${path.basename(backupFile)}`;

      const params = {
        Bucket: this.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/gzip',
        ServerSideEncryption: 'aws:kms',
        Metadata: {
          'backup-id': metadata.id,
          'timestamp': metadata.timestamp.toISOString(),
          'database': metadata.database,
          'checksum': metadata.checksum,
        },
      };

      logger.info(`Uploading backup to S3: ${key}`);
      await s3.upload(params).promise();
      logger.info(`Backup uploaded successfully: ${key}`);

      // Clean up local backup file after successful upload
      fs.unlinkSync(backupFile);
      logger.info(`Local backup file deleted: ${backupFile}`);
    } catch (error) {
      logger.error('S3 upload failed', error);
      throw error;
    }
  }

  /**
   * Create daily automated backup
   */
  async createDailyBackup(): Promise<void> {
    try {
      const backup = await this.createBackup();
      const backupFile = path.join(this.backupDir, `${backup.id}.sql.gz`);
      await this.uploadBackupToS3(backupFile, backup);
      logger.info('Daily backup completed successfully');
    } catch (error) {
      logger.error('Daily backup failed', error);
      throw error;
    }
  }

  /**
   * List backups from S3
   */
  async listBackups(): Promise<AWS.S3.ObjectList> {
    try {
      const params = {
        Bucket: this.s3Bucket,
        Prefix: this.s3Prefix,
      };

      const response = await s3.listObjectsV2(params).promise();
      logger.info(`Found ${response.Contents?.length || 0} backups`);
      return response.Contents || [];
    } catch (error) {
      logger.error('Failed to list backups', error);
      throw error;
    }
  }

  /**
   * Delete old backups (retention policy)
   */
  async deleteOldBackups(retentionDays: number = 30): Promise<void> {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

      for (const backup of backups) {
        if (backup.LastModified && backup.LastModified < cutoffDate) {
          logger.info(`Deleting old backup: ${backup.Key}`);
          await s3.deleteObject({
            Bucket: this.s3Bucket,
            Key: backup.Key!,
          }).promise();
        }
      }

      logger.info('Old backup cleanup completed');
    } catch (error) {
      logger.error('Failed to delete old backups', error);
      throw error;
    }
  }

  /**
   * Enable cross-region replication
   */
  async enableCrossRegionReplication(sourceRegion: string, targetRegion: string): Promise<void> {
    try {
      const sourceS3 = new AWS.S3({ region: sourceRegion });
      const replicationConfig = {
        Role: `arn:aws:iam::${await this.getAccountId()}:role/s3-replication-role`,
        Rules: [
          {
            Status: 'Enabled',
            Priority: 1,
            Destination: {
              Bucket: `arn:aws:s3:::${this.s3Bucket}-${targetRegion}`,
              ReplicationTime: {
                Status: 'Enabled',
                Time: { Minutes: 15 },
              },
            },
            Filter: { Prefix: this.s3Prefix },
          },
        ],
      };

      await sourceS3.putBucketReplication({
        Bucket: this.s3Bucket,
        ReplicationConfiguration: replicationConfig,
      }).promise();

      logger.info(`Cross-region replication enabled: ${sourceRegion} -> ${targetRegion}`);
    } catch (error) {
      logger.error('Failed to enable cross-region replication', error);
      throw error;
    }
  }

  /**
   * Get AWS Account ID
   */
  private async getAccountId(): Promise<string> {
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity({}).promise();
    return identity.Account!;
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  }> {
    try {
      const backups = await this.listBackups();

      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, b) => sum + (b.Size || 0), 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].LastModified || null : null,
        newestBackup: backups.length > 0 ? backups[0].LastModified || null : null,
      };

      logger.info('Backup statistics', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get backup statistics', error);
      throw error;
    }
  }
}

/**
 * CLI Entry point for backups
 */
if (require.main === module) {
  const command = process.argv[2];
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost/blockstop';
  const s3Bucket = process.env.S3_BACKUP_BUCKET || 'blockstop-backups';

  const manager = new BackupManager(databaseUrl, s3Bucket);

  (async () => {
    try {
      switch (command) {
        case 'create':
          const backup = await manager.createBackup();
          console.log('Backup created:', backup);
          break;
        case 'upload':
          await manager.createDailyBackup();
          console.log('Backup uploaded to S3');
          break;
        case 'cleanup':
          const retentionDays = parseInt(process.argv[3] || '30');
          await manager.deleteOldBackups(retentionDays);
          console.log(`Old backups deleted (retention: ${retentionDays} days)`);
          break;
        case 'list':
          const backups = await manager.listBackups();
          console.log('Backups:', backups);
          break;
        case 'stats':
          const stats = await manager.getBackupStats();
          console.log('Backup statistics:', stats);
          break;
        default:
          console.log('Usage: npm run backup [create|upload|cleanup|list|stats]');
      }
    } catch (error) {
      logger.error('Backup error', error);
      process.exit(1);
    }
  })();
}
