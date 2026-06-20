import { GraphQLError } from 'graphql';
import {
  Scan,
  ScanConnection,
  ScanFilterInput,
  PaginationInput,
  CreateScanInput,
  ScanStatus,
  ScanType,
  ScanStartResult,
} from '../types/generated-types';
import { ApolloContext } from '../apollo-server';
import { GraphQLAuthMiddleware } from '../middleware/auth';

/**
 * Scan Query and Mutation Resolvers
 */
export const scanResolvers = {
  Query: {
    /**
     * Get single scan by ID
     */
    async scan(
      _: any,
      { id }: { id: string },
      context: ApolloContext
    ): Promise<Scan | null> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const scan = await context.dataloaders.scanLoader.load(id);

        if (scan && context.auth.organizationId) {
          GraphQLAuthMiddleware.requireOrganization(
            context.auth,
            scan.organizationId
          );
        }

        return scan;
      } catch (error) {
        throw new GraphQLError('Failed to fetch scan', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get scans with filtering and pagination
     */
    async scans(
      _: any,
      {
        filter,
        pagination,
        sortBy = 'startedAt',
      }: {
        filter?: ScanFilterInput;
        pagination?: PaginationInput;
        sortBy?: string;
      },
      context: ApolloContext
    ): Promise<ScanConnection> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      const limit = pagination?.first || pagination?.last || 20;
      if (limit > 100) {
        throw new GraphQLError('Maximum limit is 100', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      try {
        const query: Record<string, any> = {};

        if (filter) {
          if (filter.status?.length) {
            query.status = { $in: filter.status };
          }
          if (filter.type?.length) {
            query.type = { $in: filter.type };
          }
          if (filter.dateRange) {
            query.startedAt = {
              $gte: filter.dateRange.startDate,
              $lte: filter.dateRange.endDate,
            };
          }
        }

        if (context.auth.organizationId) {
          query.organizationId = context.auth.organizationId;
        }

        const scans = await this.fetchScans(query, limit, pagination);
        const total = await this.countScans(query);

        const edges = scans.map((scan, index) => ({
          node: scan,
          cursor: Buffer.from(`${pagination?.after || 0 + index}`).toString(
            'base64'
          ),
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage: total > limit + (pagination?.after ? 1 : 0),
            hasPreviousPage: !!pagination?.after,
            endCursor: edges[edges.length - 1]?.cursor,
            startCursor: edges[0]?.cursor,
          },
          totalCount: total,
        };
      } catch (error) {
        console.error('Scan query error:', error);
        throw new GraphQLError('Failed to fetch scans', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get scans by organization
     */
    async scansByOrganization(
      _: any,
      {
        organizationId,
        pagination,
        filter,
      }: {
        organizationId: string;
        pagination?: PaginationInput;
        filter?: ScanFilterInput;
      },
      context: ApolloContext
    ): Promise<ScanConnection> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      const limit = pagination?.first || 20;

      try {
        const query: Record<string, any> = { organizationId };

        if (filter) {
          if (filter.status?.length) {
            query.status = { $in: filter.status };
          }
          if (filter.type?.length) {
            query.type = { $in: filter.type };
          }
        }

        const scans = await this.fetchScans(query, limit, pagination);
        const total = await this.countScans(query);

        return {
          edges: scans.map((scan) => ({
            node: scan,
            cursor: Buffer.from(scan.id).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: total > limit,
            hasPreviousPage: !!pagination?.after,
          },
          totalCount: total,
        };
      } catch (error) {
        throw new GraphQLError('Failed to fetch scans by organization', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get recent scans
     */
    async recentScans(
      _: any,
      { organizationId, limit }: { organizationId: string; limit: number },
      context: ApolloContext
    ): Promise<Scan[]> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      const finalLimit = Math.min(limit, 100);

      try {
        const scans = await this.fetchScans(
          { organizationId },
          finalLimit,
          undefined,
          'startedAt',
          'DESC'
        );
        return scans;
      } catch (error) {
        throw new GraphQLError('Failed to fetch recent scans', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get scan history
     */
    async scanHistory(
      _: any,
      { organizationId, limit }: { organizationId: string; limit: number },
      context: ApolloContext
    ): Promise<Scan[]> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      const finalLimit = Math.min(limit, 100);

      try {
        const scans = await this.fetchScans(
          { organizationId },
          finalLimit,
          undefined,
          'completedAt',
          'DESC'
        );
        return scans.filter((s) => s.completedAt);
      } catch (error) {
        throw new GraphQLError('Failed to fetch scan history', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * Create and start a new scan
     */
    async createScan(
      _: any,
      { input }: { input: CreateScanInput },
      context: ApolloContext
    ): Promise<ScanStartResult> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      if (!context.auth.organizationId) {
        throw new GraphQLError('Organization context required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Validate input
      if (!input.target || input.target.trim().length === 0) {
        throw new GraphQLError('Target is required', {
          extensions: { code: 'BAD_REQUEST', field: 'target' },
        });
      }

      try {
        const scanId = `scan-${Date.now()}`;
        const now = new Date();

        // In production, create scan in database and trigger scanning process
        const scan: Scan = {
          id: scanId,
          type: input.type,
          target: input.target,
          status: 'PENDING' as ScanStatus,
          startedAt: now,
          organizationId: context.auth.organizationId,
          initiatedBy: context.auth.userId || 'api-key',
          priority: input.priority || 'normal',
          metadata: input.metadata,
          threats: [],
        };

        // Queue scan for processing
        await this.queueScan(scan);

        return {
          scanId,
          status: 'PENDING' as ScanStatus,
          createdAt: now,
        };
      } catch (error) {
        console.error('Scan creation error:', error);
        throw new GraphQLError('Failed to create scan', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Cancel a scan
     */
    async cancelScan(
      _: any,
      { scanId }: { scanId: string },
      context: ApolloContext
    ): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const scan = await context.dataloaders.scanLoader.load(scanId);
        if (!scan) {
          throw new GraphQLError('Scan not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          scan.organizationId
        );

        if (scan.status === 'COMPLETED' || scan.status === 'FAILED') {
          throw new GraphQLError('Cannot cancel completed or failed scans', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }

        // In production, update scan status and cancel processing
        return {
          success: true,
          message: `Scan ${scanId} cancelled`,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to cancel scan', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Retry a failed scan
     */
    async retryScan(
      _: any,
      { scanId }: { scanId: string },
      context: ApolloContext
    ): Promise<ScanStartResult> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const originalScan = await context.dataloaders.scanLoader.load(scanId);
        if (!originalScan) {
          throw new GraphQLError('Scan not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          originalScan.organizationId
        );

        if (originalScan.status !== 'FAILED') {
          throw new GraphQLError('Can only retry failed scans', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }

        const newScanId = `scan-${Date.now()}`;
        const now = new Date();

        const newScan: Scan = {
          ...originalScan,
          id: newScanId,
          status: 'PENDING' as ScanStatus,
          startedAt: now,
          completedAt: undefined,
          result: undefined,
          threats: [],
        };

        await this.queueScan(newScan);

        return {
          scanId: newScanId,
          status: 'PENDING' as ScanStatus,
          createdAt: now,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to retry scan', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Delete a scan
     */
    async deleteScan(
      _: any,
      { scanId }: { scanId: string },
      context: ApolloContext
    ): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const scan = await context.dataloaders.scanLoader.load(scanId);
        if (!scan) {
          throw new GraphQLError('Scan not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          scan.organizationId
        );

        // In production, soft delete or archive scan
        return {
          success: true,
          message: `Scan ${scanId} deleted`,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to delete scan', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // Helper methods
  fetchScans: async (
    query: Record<string, any>,
    limit: number,
    pagination?: PaginationInput,
    sortBy: string = 'startedAt',
    sortOrder: string = 'DESC'
  ): Promise<Scan[]> => {
    // Mock implementation - replace with actual database query
    return [];
  },

  countScans: async (query: Record<string, any>): Promise<number> => {
    // Mock implementation - replace with actual database count
    return 0;
  },

  queueScan: async (scan: Scan): Promise<void> => {
    // In production, queue the scan for processing
    // This could use Bull, RabbitMQ, or similar
    console.log(`[Scan Queue] Queued scan: ${scan.id}`);
  },
};
