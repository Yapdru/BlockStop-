import { GraphQLError } from 'graphql';
import {
  Organization,
  Team,
  CreateOrganizationInput,
  Role,
} from '../types/generated-types';
import { ApolloContext } from '../apollo-server';
import { GraphQLAuthMiddleware } from '../middleware/auth';

/**
 * Organization Query and Mutation Resolvers
 */
export const organizationResolvers = {
  Query: {
    /**
     * Get organization by ID
     */
    async organization(
      _: any,
      { id }: { id: string },
      context: ApolloContext
    ): Promise<Organization | null> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      try {
        const org = await this.fetchOrganization(id);

        if (org && context.auth.organizationId !== id) {
          // Check if user has access to this organization
          const hasAccess = await this.checkOrganizationAccess(
            context.auth.userId,
            id
          );
          if (!hasAccess) {
            throw new GraphQLError('Access denied to organization', {
              extensions: { code: 'FORBIDDEN' },
            });
          }
        }

        return org;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to fetch organization', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get all organizations
     */
    async organizations(
      _: any,
      { pagination }: { pagination?: any },
      context: ApolloContext
    ): Promise<Organization[]> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      const limit = pagination?.first || 50;

      try {
        // In production, get orgs where user has access
        const orgs = await this.fetchUserOrganizations(
          context.auth.userId,
          limit
        );
        return orgs;
      } catch (error) {
        throw new GraphQLError('Failed to fetch organizations', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get current organization
     */
    async currentOrganization(
      _: any,
      __: any,
      context: ApolloContext
    ): Promise<Organization | null> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      if (!context.auth.organizationId) {
        return null;
      }

      try {
        return await this.fetchOrganization(context.auth.organizationId);
      } catch (error) {
        throw new GraphQLError('Failed to fetch current organization', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Get organization teams
     */
    async organizationTeams(
      _: any,
      { organizationId }: { organizationId: string },
      context: ApolloContext
    ): Promise<Team[]> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, organizationId);

      try {
        return await this.fetchOrganizationTeams(organizationId);
      } catch (error) {
        throw new GraphQLError('Failed to fetch organization teams', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    /**
     * Create organization
     */
    async createOrganization(
      _: any,
      { input }: { input: CreateOrganizationInput },
      context: ApolloContext
    ): Promise<Organization> {
      GraphQLAuthMiddleware.requireAuth(context.auth);

      // Only admins or system can create orgs
      if (context.auth.user?.role !== 'admin') {
        throw new GraphQLError('Insufficient permissions to create organization', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Validate input
      if (!input.name || input.name.trim().length === 0) {
        throw new GraphQLError('Organization name is required', {
          extensions: { code: 'BAD_REQUEST', field: 'name' },
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        throw new GraphQLError('Invalid email address', {
          extensions: { code: 'BAD_REQUEST', field: 'email' },
        });
      }

      try {
        const organization: Organization = {
          id: `org-${Date.now()}`,
          name: input.name,
          email: input.email,
          tier: input.tier || 'free',
          seats: input.tier === 'pro' ? 50 : 5,
          usedSeats: 1,
          features: this.getFeaturesForTier(input.tier || 'free'),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          apiKeysCount: 0,
          webhooksCount: 0,
        };

        // In production, save to database
        await this.saveOrganization(organization);

        return organization;
      } catch (error) {
        console.error('Organization creation error:', error);
        throw new GraphQLError('Failed to create organization', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Update organization
     */
    async updateOrganization(
      _: any,
      {
        id,
        name,
        email,
        tier,
      }: { id: string; name?: string; email?: string; tier?: string },
      context: ApolloContext
    ): Promise<Organization> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, id);

      try {
        const org = await this.fetchOrganization(id);
        if (!org) {
          throw new GraphQLError('Organization not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const updated: Organization = {
          ...org,
          name: name || org.name,
          email: email || org.email,
          tier: tier || org.tier,
          features: tier ? this.getFeaturesForTier(tier) : org.features,
          updatedAt: new Date(),
        };

        // In production, update in database
        await this.updateOrganizationDb(updated);

        return updated;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError('Failed to update organization', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * Delete organization
     */
    async deleteOrganization(
      _: any,
      { id }: { id: string },
      context: ApolloContext
    ): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
      GraphQLAuthMiddleware.requireOrganization(context.auth, id);

      // Only admins
      if (context.auth.user?.role !== 'admin') {
        throw new GraphQLError('Insufficient permissions to delete organization', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        // In production, soft delete and clean up resources
        await this.deleteOrganizationDb(id);

        return {
          success: true,
          message: `Organization ${id} deleted`,
        };
      } catch (error) {
        throw new GraphQLError('Failed to delete organization', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // Helper methods
  fetchOrganization: async (id: string): Promise<Organization | null> => {
    // Mock - replace with database query
    return null;
  },

  fetchUserOrganizations: async (
    userId: string | undefined,
    limit: number
  ): Promise<Organization[]> => {
    // Mock - replace with database query
    return [];
  },

  fetchOrganizationTeams: async (organizationId: string): Promise<Team[]> => {
    // Mock - replace with database query
    return [];
  },

  checkOrganizationAccess: async (
    userId: string | undefined,
    organizationId: string
  ): Promise<boolean> => {
    // Mock - replace with database query
    return false;
  },

  saveOrganization: async (org: Organization): Promise<void> => {
    // Mock - replace with database save
    console.log(`[DB] Saved organization: ${org.id}`);
  },

  updateOrganizationDb: async (org: Organization): Promise<void> => {
    // Mock - replace with database update
    console.log(`[DB] Updated organization: ${org.id}`);
  },

  deleteOrganizationDb: async (id: string): Promise<void> => {
    // Mock - replace with database delete
    console.log(`[DB] Deleted organization: ${id}`);
  },

  getFeaturesForTier: (tier: string): string[] => {
    const features: Record<string, string[]> = {
      free: [
        'basic_scanning',
        'email_security',
        'basic_reporting',
        'community_support',
      ],
      pro: [
        'basic_scanning',
        'email_security',
        'file_security',
        'advanced_reporting',
        'api_access',
        'integrations',
        'webhooks',
        'custom_rules',
        'priority_support',
      ],
    };
    return features[tier] || features.free;
  },
};
