import { GraphQLError } from 'graphql';
import {
  Webhook,
  WebhookConnection,
  WebhookEvent,
  CreateWebhookInput,
  UpdateWebhookInput,
  PaginationInput,
  WebhookStatus,
  WebhookTestResult,
} from '../types/generated-types';
import { ApolloContext } from '../apollo-server';
import { GraphQLAuthMiddleware } from '../middleware/auth';
import * as crypto from 'crypto';

/**
 * Webhook Query and Mutation Resolvers
 */
export const webhookResolvers = {
  Query: {
    /**
     * Get webhook by ID
     */
    async webhook(
      _: any,
      { id }: { id: string },
      context: ApolloContext
    ): Promise<Webhook | null> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const webhook = await this.fetchWebhook(id);

        if (webhook && context.auth.organizationId !== webhook.organizationId) {
          throw new GraphQLError('Access denied to webhook', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        return webhook;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to fetch webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get webhooks for organization
     */
    async webhooks(
      _: any,
      {
        organizationId,
        pagination,
      }: { organizationId: string; pagination?: PaginationInput },
      context: ApolloContext
    ): Promise<WebhookConnection> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      const limit = pagination?.first || 50;

      try {
        const webhooks = await this.fetchWebhooks(organizationId, limit);
        const total = await this.countWebhooks(organizationId);

        return {
          edges: webhooks.map((webhook) => ({
            node: webhook,
            cursor: Buffer.from(webhook.id).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: total > limit,
            hasPreviousPage: !!pagination?.after,
          },
          totalCount: total,
        };
      } catch (error) {
        throw new GraphQLError('Failed to fetch webhooks', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get webhook events
     */
    async webhookEvents(
      _: any,
      {
        webhookId,
        pagination,
      }: { webhookId: string; pagination?: PaginationInput },
      context: ApolloContext
    ): Promise<WebhookEvent[]> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      const limit = pagination?.first || 50;

      try {
        const webhook = await this.fetchWebhook(webhookId);
        if (!webhook) {
          throw new GraphQLError('Webhook not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          webhook.organizationId
        );

        return await this.fetchWebhookEvents(webhookId, limit);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to fetch webhook events', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * Register webhook
     */
    async registerWebhook(
      _: any,
      { input }: { input: CreateWebhookInput },
      context: ApolloContext
    ): Promise<Webhook> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      if (!context.auth.organizationId) {
        throw new GraphQLError('Organization context required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Validate URL
      try {
        new URL(input.url);
      } catch (err) {
        throw new GraphQLError('Invalid webhook URL', {
          extensions: { code: 'BAD_REQUEST', field: 'url' },
        });
      }

      // Validate event types
      if (!input.eventTypes || input.eventTypes.length === 0) {
        throw new GraphQLError('At least one event type is required', {
          extensions: { code: 'BAD_REQUEST', field: 'eventTypes' },
        });
      }

      const validEventTypes = [
        'threat.detected',
        'scan.completed',
        'alert.triggered',
        'organization.created',
        'integration.connected',
        'api.rate_limit_exceeded',
        'security.breach_detected',
      ];

      const invalidEventTypes = input.eventTypes.filter(
        (e) => !validEventTypes.includes(e)
      );
      if (invalidEventTypes.length > 0) {
        throw new GraphQLError('Invalid event types', {
          extensions: {
            code: 'BAD_REQUEST',
            invalidEventTypes,
          },
        });
      }

      try {
        const webhook: Webhook = {
          id: `wh-${Date.now()}`,
          url: input.url,
          eventTypes: input.eventTypes,
          status: 'ACTIVE' as WebhookStatus,
          failureCount: 0,
          successCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: context.auth.organizationId,
        };

        // Generate secret if provided
        if (input.secret) {
          // In production, hash and store securely
          webhook.id = `${webhook.id}:${crypto
            .createHash('sha256')
            .update(input.secret)
            .digest('hex')}`;
        }

        // Test webhook
        const testResult = await this.testWebhookConnection(webhook);
        if (!testResult.success) {
          webhook.status = 'FAILED' as WebhookStatus;
          webhook.lastError = testResult.error;
        }

        // Save webhook
        await this.saveWebhook(webhook);

        return webhook;
      } catch (error) {
        console.error('Webhook registration error:', error);
        throw new GraphQLError('Failed to register webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Update webhook
     */
    async updateWebhook(
      _: any,
      { input }: { input: UpdateWebhookInput },
      context: ApolloContext
    ): Promise<Webhook> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const webhook = await this.fetchWebhook(input.id);
        if (!webhook) {
          throw new GraphQLError('Webhook not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          webhook.organizationId
        );

        // Validate URL if updating
        if (input.url) {
          try {
            new URL(input.url);
          } catch (err) {
            throw new GraphQLError('Invalid webhook URL', {
              extensions: { code: 'BAD_REQUEST', field: 'url' },
            });
          }
        }

        const updated: Webhook = {
          ...webhook,
          url: input.url || webhook.url,
          eventTypes: input.eventTypes || webhook.eventTypes,
          status: input.active !== undefined
            ? input.active ? 'ACTIVE' : 'INACTIVE'
            : webhook.status,
          updatedAt: new Date(),
        };

        // Test new configuration
        const testResult = await this.testWebhookConnection(updated);
        if (!testResult.success) {
          updated.lastError = testResult.error;
        }

        await this.updateWebhookDb(updated);
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to update webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Delete webhook
     */
    async deleteWebhook(
      _: any,
      { webhookId }: { webhookId: string },
      context: ApolloContext
    ): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const webhook = await this.fetchWebhook(webhookId);
        if (!webhook) {
          throw new GraphQLError('Webhook not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          webhook.organizationId
        );

        await this.removeWebhook(webhookId);

        return {
          success: true,
          message: `Webhook ${webhookId} deleted`,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to delete webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Test webhook
     */
    async testWebhook(
      _: any,
      { webhookId }: { webhookId: string },
      context: ApolloContext
    ): Promise<WebhookTestResult> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const webhook = await this.fetchWebhook(webhookId);
        if (!webhook) {
          throw new GraphQLError('Webhook not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          webhook.organizationId
        );

        return await this.testWebhookConnection(webhook);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to test webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Replay webhook event
     */
    async replayWebhookEvent(
      _: any,
      { webhookEventId }: { webhookEventId: string },
      context: ApolloContext
    ): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const event = await this.fetchWebhookEvent(webhookEventId);
        if (!event) {
          throw new GraphQLError('Webhook event not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Queue for retry
        await this.queueWebhookForRetry(event);

        return {
          success: true,
          message: `Event ${webhookEventId} queued for replay`,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to replay webhook event', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Suspend webhook
     */
    async suspendWebhook(
      _: any,
      { webhookId, reason }: { webhookId: string; reason?: string },
      context: ApolloContext
    ): Promise<Webhook> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const webhook = await this.fetchWebhook(webhookId);
        if (!webhook) {
          throw new GraphQLError('Webhook not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          webhook.organizationId
        );

        const updated: Webhook = {
          ...webhook,
          status: 'SUSPENDED' as WebhookStatus,
          updatedAt: new Date(),
          lastError: reason || 'Manually suspended',
        };

        await this.updateWebhookDb(updated);
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to suspend webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Resume webhook
     */
    async resumeWebhook(
      _: any,
      { webhookId }: { webhookId: string },
      context: ApolloContext
    ): Promise<Webhook> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const webhook = await this.fetchWebhook(webhookId);
        if (!webhook) {
          throw new GraphQLError('Webhook not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        GraphQLAuthMiddleware.requireOrganization(
          context.auth,
          webhook.organizationId
        );

        const updated: Webhook = {
          ...webhook,
          status: 'ACTIVE' as WebhookStatus,
          updatedAt: new Date(),
          failureCount: 0,
        };

        await this.updateWebhookDb(updated);
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to resume webhook', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // Helper methods
  fetchWebhook: async (id: string): Promise<Webhook | null> => {
    // Mock - replace with database query
    return null;
  },

  fetchWebhooks: async (
    organizationId: string,
    limit: number
  ): Promise<Webhook[]> => {
    // Mock - replace with database query
    return [];
  },

  countWebhooks: async (organizationId: string): Promise<number> => {
    // Mock - replace with database count
    return 0;
  },

  fetchWebhookEvent: async (id: string): Promise<WebhookEvent | null> => {
    // Mock - replace with database query
    return null;
  },

  fetchWebhookEvents: async (
    webhookId: string,
    limit: number
  ): Promise<WebhookEvent[]> => {
    // Mock - replace with database query
    return [];
  },

  testWebhookConnection: async (
    webhook: Webhook
  ): Promise<WebhookTestResult> => {
    try {
      const startTime = Date.now();
      // In production, make actual HTTP request
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        statusCode: 200,
        responseTime,
        payload: { message: 'Webhook test successful' },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        responseTime: 0,
        error: String(error),
      };
    }
  },

  saveWebhook: async (webhook: Webhook): Promise<void> => {
    console.log(`[DB] Saved webhook: ${webhook.id}`);
  },

  updateWebhookDb: async (webhook: Webhook): Promise<void> => {
    console.log(`[DB] Updated webhook: ${webhook.id}`);
  },

  removeWebhook: async (webhookId: string): Promise<void> => {
    console.log(`[DB] Removed webhook: ${webhookId}`);
  },

  queueWebhookForRetry: async (event: WebhookEvent): Promise<void> => {
    console.log(`[Queue] Queued webhook event for retry: ${event.id}`);
  },
};
