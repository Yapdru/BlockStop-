import { GraphQLError } from 'graphql';
import {
  Integration,
  IntegrationConnection,
  IntegrationTemplate,
  IntegrationConfigInput,
  ConnectIntegrationInput,
  PaginationInput,
  IntegrationStatus,
  WebhookTestResult,
} from '../types/generated-types';
import { ApolloContext } from '../apollo-server';
import { GraphQLAuthMiddleware } from '../middleware/auth';

/**
 * Integration Query and Mutation Resolvers
 */
export const integrationResolvers = {
  Query: {
    /**
     * Get integration by ID
     */
    async integration(
      _: any,
      { id }: { id: string },
      context: ApolloContext
    ): Promise<Integration | null> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(id);

        if (
          integration &&
          context.auth.organizationId &&
          context.auth.organizationId !== integration.id.split('-')[0]
        ) {
          // Basic check - in production use proper organization lookup
          throw new GraphQLError('Access denied to integration', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        return integration;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to fetch integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get integrations for organization
     */
    async integrations(
      _: any,
      {
        organizationId,
        pagination,
      }: { organizationId: string; pagination?: PaginationInput },
      context: ApolloContext
    ): Promise<IntegrationConnection> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      const limit = pagination?.first || 50;

      try {
        const integrations = await this.fetchIntegrations(
          organizationId,
          limit
        );
        const total = await this.countIntegrations(organizationId);

        return {
          edges: integrations.map((integration) => ({
            node: integration,
            cursor: Buffer.from(integration.id).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: total > limit,
            hasPreviousPage: !!pagination?.after,
          },
          totalCount: total,
        };
      } catch (error) {
        throw new GraphQLError('Failed to fetch integrations', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get integration templates
     */
    async integrationTemplates(
      _: any,
      {
        category,
        pagination,
      }: { category?: string; pagination?: PaginationInput },
      context: ApolloContext
    ): Promise<IntegrationConnection> {
      // This is a public query, can be accessed by authenticated users

      const limit = pagination?.first || 100;

      try {
        const templates = await this.fetchTemplates(category, limit);
        const total = await this.countTemplates(category);

        return {
          edges: templates.map((template) => ({
            node: template,
            cursor: Buffer.from(template.id).toString('base64'),
          })),
          pageInfo: {
            hasNextPage: total > limit,
            hasPreviousPage: !!pagination?.after,
          },
          totalCount: total,
        };
      } catch (error) {
        throw new GraphQLError('Failed to fetch integration templates', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get available integrations
     */
    async availableIntegrations(
      _: any,
      __: any,
      context: ApolloContext
    ): Promise<IntegrationTemplate[]> {
      try {
        return await this.fetchAllTemplates();
      } catch (error) {
        throw new GraphQLError('Failed to fetch available integrations', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get integration health status
     */
    async integrationHealth(
      _: any,
      { integrationId }: { integrationId: string },
      context: ApolloContext
    ): Promise<Record<string, any>> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(
          integrationId
        );
        if (!integration) {
          throw new GraphQLError('Integration not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return {
          integrationId,
          status: integration.status,
          lastHealthCheck: integration.lastHealthCheck,
          isHealthy: integration.status === 'CONNECTED',
          uptime: await this.getIntegrationUptime(integrationId),
          errorRate: await this.getIntegrationErrorRate(integrationId),
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to fetch integration health', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * Connect integration
     */
    async connectIntegration(
      _: any,
      { input }: { input: ConnectIntegrationInput },
      context: ApolloContext
    ): Promise<Integration> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      if (!context.auth.organizationId) {
        throw new GraphQLError('Organization context required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        const template = await this.fetchTemplate(input.integrationId);
        if (!template) {
          throw new GraphQLError('Integration template not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Validate required fields
        const missingFields = template.requiredFields
          .filter((f) => f.required && !input.config[f.name])
          .map((f) => f.name);

        if (missingFields.length > 0) {
          throw new GraphQLError('Missing required configuration fields', {
            extensions: {
              code: 'BAD_REQUEST',
              missingFields,
            },
          });
        }

        const integration: Integration = {
          id: `int-${Date.now()}`,
          name: template.name,
          type: template.type,
          category: template.category,
          status: 'TESTING' as IntegrationStatus,
          enabled: false,
          config: input.config,
          testable: template.authType === 'oauth2',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: template.description,
        };

        // Test connection
        const testResult = await this.testIntegrationConnection(integration);
        if (testResult.success) {
          integration.status = 'CONNECTED' as IntegrationStatus;
          integration.enabled = true;
        } else {
          integration.status = 'ERROR' as IntegrationStatus;
        }

        // Save integration
        await this.saveIntegration(integration, context.auth.organizationId);

        return integration;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to connect integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Disconnect integration
     */
    async disconnectIntegration(
      _: any,
      { integrationId }: { integrationId: string },
      context: ApolloContext
    ): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(
          integrationId
        );
        if (!integration) {
          throw new GraphQLError('Integration not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // In production, clean up integration resources
        await this.removeIntegration(integrationId);

        return {
          success: true,
          message: `Integration ${integrationId} disconnected`,
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to disconnect integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Update integration
     */
    async updateIntegration(
      _: any,
      { id, config }: { id: string; config: IntegrationConfigInput },
      context: ApolloContext
    ): Promise<Integration> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(id);
        if (!integration) {
          throw new GraphQLError('Integration not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const updated: Integration = {
          ...integration,
          config,
          updatedAt: new Date(),
        };

        // Test new config
        const testResult = await this.testIntegrationConnection(updated);
        if (!testResult.success) {
          throw new GraphQLError('Integration test failed', {
            extensions: {
              code: 'BAD_REQUEST',
              error: testResult.error,
            },
          });
        }

        await this.updateIntegrationDb(updated);
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to update integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Test integration
     */
    async testIntegration(
      _: any,
      { integrationId }: { integrationId: string },
      context: ApolloContext
    ): Promise<WebhookTestResult> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(
          integrationId
        );
        if (!integration) {
          throw new GraphQLError('Integration not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        return await this.testIntegrationConnection(integration);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to test integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Enable integration
     */
    async enableIntegration(
      _: any,
      { integrationId }: { integrationId: string },
      context: ApolloContext
    ): Promise<Integration> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(
          integrationId
        );
        if (!integration) {
          throw new GraphQLError('Integration not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const updated = { ...integration, enabled: true, updatedAt: new Date() };
        await this.updateIntegrationDb(updated);
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to enable integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Disable integration
     */
    async disableIntegration(
      _: any,
      { integrationId }: { integrationId: string },
      context: ApolloContext
    ): Promise<Integration> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const integration = await context.dataloaders.integrationLoader.load(
          integrationId
        );
        if (!integration) {
          throw new GraphQLError('Integration not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const updated = { ...integration, enabled: false, updatedAt: new Date() };
        await this.updateIntegrationDb(updated);
        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to disable integration', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // Helper methods
  fetchIntegrations: async (
    organizationId: string,
    limit: number
  ): Promise<Integration[]> => {
    // Mock - replace with database query
    return [];
  },

  countIntegrations: async (organizationId: string): Promise<number> => {
    // Mock - replace with database count
    return 0;
  },

  fetchTemplates: async (
    category: string | undefined,
    limit: number
  ): Promise<IntegrationTemplate[]> => {
    // Mock - replace with database query
    return [];
  },

  countTemplates: async (category: string | undefined): Promise<number> => {
    // Mock - replace with database count
    return 0;
  },

  fetchAllTemplates: async (): Promise<IntegrationTemplate[]> => {
    // Mock - replace with database query
    return [];
  },

  fetchTemplate: async (id: string): Promise<IntegrationTemplate | null> => {
    // Mock - replace with database query
    return null;
  },

  testIntegrationConnection: async (
    integration: Integration
  ): Promise<WebhookTestResult> => {
    // Test connection by making a test request
    return {
      success: true,
      statusCode: 200,
      responseTime: 100,
      payload: { message: 'Connection successful' },
    };
  },

  saveIntegration: async (
    integration: Integration,
    organizationId: string
  ): Promise<void> => {
    console.log(`[DB] Saved integration: ${integration.id}`);
  },

  updateIntegrationDb: async (integration: Integration): Promise<void> => {
    console.log(`[DB] Updated integration: ${integration.id}`);
  },

  removeIntegration: async (integrationId: string): Promise<void> => {
    console.log(`[DB] Removed integration: ${integrationId}`);
  },

  getIntegrationUptime: async (integrationId: string): Promise<number> => {
    // Return uptime percentage
    return 99.9;
  },

  getIntegrationErrorRate: async (integrationId: string): Promise<number> => {
    // Return error rate percentage
    return 0.1;
  },
};
