import { GraphQLError } from 'graphql';
import {
  Threat,
  ThreatConnection,
  ThreatFilterInput,
  PaginationInput,
  UpdateThreatInput,
  ThreatSeverity,
  ThreatStatus,
} from '../types/generated-types';
import { ApolloContext } from '../apollo-server';
import { GraphQLAuthMiddleware } from '../middleware/auth';

/**
 * Threat Query and Mutation Resolvers
 */
export const threatResolvers = {
  Query: {
    /**
     * Get single threat by ID
     */
    async threat(
      _: any,
      { id }: { id: string },
      context: ApolloContext
    ): Promise<Threat | null> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        // Use DataLoader for batching
        const threat = await context.dataloaders.threatLoader.load(id);

        // Check organization access
        if (threat && context.auth.organizationId) {
          GraphQLAuthMiddleware.requireOrganization(
            context.auth,
            threat.organizationId
          );
        }

        return threat;
      } catch (error) {
        throw new GraphQLError('Failed to fetch threat', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get threats with filtering and pagination
     */
    async threats(
      _: any,
      {
        filter,
        pagination,
        sortBy = 'detectedAt',
        sortOrder = 'DESC',
      }: {
        filter?: ThreatFilterInput;
        pagination?: PaginationInput;
        sortBy?: string;
        sortOrder?: string;
      },
      context: ApolloContext
    ): Promise<ThreatConnection> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      const limit = pagination?.first || pagination?.last || 20;
      if (limit > 100) {
        throw new GraphQLError('Maximum limit is 100', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      try {
        // Build query
        const query: Record<string, any> = {};

        if (filter) {
          if (filter.severity?.length) {
            query.severity = { $in: filter.severity };
          }
          if (filter.status?.length) {
            query.status = { $in: filter.status };
          }
          if (filter.type?.length) {
            query.type = { $in: filter.type };
          }
          if (filter.source) {
            query.source = filter.source;
          }
          if (filter.searchTerm) {
            query.$or = [
              { subject: { $regex: filter.searchTerm, $options: 'i' } },
              { senderEmail: { $regex: filter.searchTerm, $options: 'i' } },
              { 'indicators.value': filter.searchTerm },
            ];
          }
          if (filter.dateRange) {
            query.detectedAt = {
              $gte: filter.dateRange.startDate,
              $lte: filter.dateRange.endDate,
            };
          }
        }

        // Add organization filter
        if (context.auth.organizationId) {
          query.organizationId = context.auth.organizationId;
        }

        // Mock data - in production, query actual database
        const threats = await this.fetchThreats(query, limit, pagination);
        const total = await this.countThreats(query);

        const edges = threats.map((threat, index) => ({
          node: threat,
          cursor: Buffer.from(`${pagination?.after || 0 + index}`).toString(
            'base64'
          ),
        }));

        const hasMore = total > limit + (pagination?.after ? 1 : 0);
        const endCursor =
          edges.length > 0
            ? edges[edges.length - 1].cursor
            : undefined;

        return {
          edges,
          pageInfo: {
            hasNextPage: hasMore,
            hasPreviousPage: !!pagination?.after,
            endCursor,
            startCursor: edges[0]?.cursor,
          },
          totalCount: total,
        };
      } catch (error) {
        console.error('Threat query error:', error);
        throw new GraphQLError('Failed to fetch threats', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get threats by source
     */
    async threatsBySource(
      _: any,
      { source, pagination }: { source: string; pagination?: PaginationInput },
      context: ApolloContext
    ): Promise<ThreatConnection> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      const limit = pagination?.first || 50;

      try {
        const threats = await this.fetchThreats(
          { source, organizationId: context.auth.organizationId },
          limit
        );
        const total = await this.countThreats({ source });

        return {
          edges: threats.map((threat) => ({
            node: threat,
            cursor: Buffer.from(threat.id).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: total > limit,
            hasPreviousPage: false,
          },
          totalCount: total,
        };
      } catch (error) {
        throw new GraphQLError('Failed to fetch threats by source', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get recent threats
     */
    async recentThreats(
      _: any,
      { limit }: { limit: number },
      context: ApolloContext
    ): Promise<Threat[]> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      const finalLimit = Math.min(limit, 100);

      try {
        const threats = await this.fetchThreats(
          { organizationId: context.auth.organizationId },
          finalLimit,
          undefined,
          'detectedAt',
          'DESC'
        );
        return threats;
      } catch (error) {
        throw new GraphQLError('Failed to fetch recent threats', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get critical threats
     */
    async criticalThreats(
      _: any,
      { organizationId }: { organizationId: string },
      context: ApolloContext
    ): Promise<Threat[]> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      try {
        const threats = await this.fetchThreats(
          {
            organizationId,
            severity: { $in: ['CRITICAL', 'HIGH'] },
            status: 'OPEN',
          },
          50
        );
        return threats;
      } catch (error) {
        throw new GraphQLError('Failed to fetch critical threats', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get threat statistics
     */
    async threatStats(
      _: any,
      { organizationId, dateRange }: any,
      context: ApolloContext
    ): Promise<Record<string, any>> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      try {
        const query = {
          organizationId,
          detectedAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        };

        const total = await this.countThreats(query);
        const byType = await this.aggregateThreats(query, 'type');
        const bySeverity = await this.aggregateThreats(query, 'severity');
        const byStatus = await this.aggregateThreats(query, 'status');

        const remediated = await this.countThreats({
          ...query,
          status: 'REMEDIATED',
        });

        return {
          total,
          remediated,
          remediationRate: total > 0 ? (remediated / total) * 100 : 0,
          byType,
          bySeverity,
          byStatus,
          period: {
            start: dateRange.startDate,
            end: dateRange.endDate,
          },
        };
      } catch (error) {
        throw new GraphQLError('Failed to fetch threat statistics', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * Update threat
     */
    async updateThreat(
      _: any,
      { input }: { input: UpdateThreatInput },
      context: ApolloContext
    ): Promise<Threat> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const threat = await context.dataloaders.threatLoader.load(input.id);
        if (!threat) {
          throw new GraphQLError('Threat not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          threat.organizationId
        );

        // Update threat (mock implementation)
        const updated = {
          ...threat,
          status: input.status || threat.status,
          severity: input.severity || threat.severity,
          tags: input.tags || threat.tags,
        };

        // In production, save to database
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to update threat', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Resolve threat
     */
    async resolveThreat(
      _: any,
      { threatId, notes }: { threatId: string; notes?: string },
      context: ApolloContext
    ): Promise<Threat> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const threat = await context.dataloaders.threatLoader.load(threatId);
        if (!threat) {
          throw new GraphQLError('Threat not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          threat.organizationId
        );

        return {
          ...threat,
          status: 'REMEDIATED' as ThreatStatus,
          actions: [
            ...threat.actions,
            {
              id: `action-${Date.now()}`,
              type: 'remediation',
              status: 'completed',
              timestamp: new Date(),
              details: { notes },
              performedBy: context.auth.userId,
            },
          ],
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to resolve threat', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Mark threat as false positive
     */
    async markThreatAsFalsePositive(
      _: any,
      { threatId, reason }: { threatId: string; reason?: string },
      context: ApolloContext
    ): Promise<Threat> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const threat = await context.dataloaders.threatLoader.load(threatId);
        if (!threat) {
          throw new GraphQLError('Threat not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return {
          ...threat,
          status: 'FALSE_POSITIVE' as ThreatStatus,
          actions: [
            ...threat.actions,
            {
              id: `action-${Date.now()}`,
              type: 'false_positive_marking',
              status: 'completed',
              timestamp: new Date(),
              details: { reason },
              performedBy: context.auth.userId,
            },
          ],
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to mark threat as false positive', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Bulk update threats
     */
    async bulkUpdateThreats(
      _: any,
      { threatIds, status }: { threatIds: string[]; status: ThreatStatus },
      context: ApolloContext
    ): Promise<Threat[]> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      if (threatIds.length > 1000) {
        throw new GraphQLError('Cannot update more than 1000 threats at once', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      try {
        const threats = await Promise.all(
          threatIds.map((id) => context.dataloaders.threatLoader.load(id))
        );

        return threats
          .filter((t) => t !== null)
          .map((threat) => ({
            ...threat,
            status,
          }));
      } catch (error) {
        throw new GraphQLError('Failed to bulk update threats', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // Helper methods
  fetchThreats: async (
    query: Record<string, any>,
    limit: number,
    pagination?: PaginationInput,
    sortBy: string = 'detectedAt',
    sortOrder: string = 'DESC'
  ): Promise<Threat[]> => {
    // Mock implementation - replace with actual database query
    return [];
  },

  countThreats: async (query: Record<string, any>): Promise<number> => {
    // Mock implementation - replace with actual database count
    return 0;
  },

  aggregateThreats: async (
    query: Record<string, any>,
    field: string
  ): Promise<Record<string, number>> => {
    // Mock implementation - replace with actual database aggregation
    return {};
  },
};
