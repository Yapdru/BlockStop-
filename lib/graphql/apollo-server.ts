import { ApolloServer } from 'apollo-server-express';
import { Express } from 'express';
import DataLoader from 'dataloader';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { GraphQLAuthMiddleware, AuthContext } from './middleware/auth';
import { complexityCheckMiddleware, ComplexityBudget } from './middleware/complexity';
import { ThreatLoader, ScanLoader, IntegrationLoader } from './dataloaders';

export interface ApolloContext {
  auth: AuthContext;
  dataloaders: {
    threatLoader: DataLoader<string, any>;
    scanLoader: DataLoader<string, any>;
    integrationLoader: DataLoader<string, any>;
  };
  complexityBudget: ComplexityBudget;
}

/**
 * Setup Apollo Server with all middleware and plugins
 */
export async function setupApolloServer(app: Express): Promise<ApolloServer> {
  const complexityBudget = new ComplexityBudget();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }): Promise<ApolloContext> => {
      const auth = await GraphQLAuthMiddleware.authenticate(req as any);

      return {
        auth,
        dataloaders: {
          threatLoader: new ThreatLoader(),
          scanLoader: new ScanLoader(),
          integrationLoader: new IntegrationLoader(),
        },
        complexityBudget,
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production',
    plugins: [
      {
        // Check complexity before operation
        async didResolveOperation({ request, document, context }: any) {
          const complexity = calculateComplexity(
            document.definitions[0].selectionSet.selections,
            request.variables
          );

          const rateLimitKey = GraphQLAuthMiddleware.getRateLimitKey(
            (context as ApolloContext).auth
          );

          if (!complexityBudget.checkBudget(rateLimitKey, complexity)) {
            throw new Error(
              `Query complexity budget exceeded. Remaining: ${complexityBudget.getRemaining(
                rateLimitKey
              )}`
            );
          }

          if (process.env.DEBUG_COMPLEXITY === 'true') {
            console.log(`[GraphQL] Query complexity: ${complexity}`, {
              operation: document.definitions[0].name?.value,
              remaining: complexityBudget.getRemaining(rateLimitKey),
            });
          }
        },
      },
      {
        // Error handling
        async didEncounterErrors({ errors, context }: any) {
          const rateLimitKey = GraphQLAuthMiddleware.getRateLimitKey(
            (context as ApolloContext).auth
          );

          errors.forEach((error: any) => {
            console.error('[GraphQL Error]', {
              message: error.message,
              code: error.extensions?.code,
              path: error.path,
              user: rateLimitKey,
            });

            // Refund complexity budget on error
            if (error.extensions?.complexity) {
              complexityBudget.refund(
                rateLimitKey,
                error.extensions.complexity
              );
            }
          });
        },
      },
      {
        // Performance monitoring
        async willSendResponse({ request, response, context }: any) {
          const startTime = (request as any).startTime || Date.now();
          const duration = Date.now() - startTime;

          if (duration > 1000) {
            console.warn('[GraphQL Performance]', {
              operation: (request as any).operationName,
              duration: `${duration}ms`,
              user: GraphQLAuthMiddleware.getRateLimitKey(
                (context as ApolloContext).auth
              ),
            });
          }
        },
      },
    ],
    formatError: (error: any) => {
      // Format errors for client
      const formatted = {
        message: error.message,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          ...error.extensions,
        },
      };

      // Hide internal details in production
      if (process.env.NODE_ENV === 'production') {
        delete formatted.extensions.stacktrace;
      }

      return formatted;
    },
  });

  return server;
}

/**
 * Setup subscription server for WebSocket support
 */
export async function setupSubscriptionServer(server: ApolloServer): Promise<void> {
  // WebSocket setup would happen here
  // Implementation depends on express version and websocket library
  // This is a placeholder for proper subscription setup
}

/**
 * Merge Apollo Server with Express app
 */
export async function mergeApolloWithExpress(
  app: Express,
  server: ApolloServer
): Promise<void> {
  // This would be implemented based on Apollo Server version and Express integration
  // middleware setup, etc.
}

/**
 * Calculate query complexity (simplified version)
 */
function calculateComplexity(
  selections: any[],
  variables: Record<string, any>,
  depth: number = 0
): number {
  if (depth > 10) return 1000; // Max depth exceeded
  if (!selections) return 0;

  let complexity = 0;

  for (const selection of selections) {
    if (selection.kind === 'Field') {
      const fieldComplexity = getFieldComplexity(selection.name.value);
      const multiplier = getMultiplier(selection, variables);
      complexity += fieldComplexity * multiplier;

      if (selection.selectionSet) {
        complexity += calculateComplexity(
          selection.selectionSet.selections,
          variables,
          depth + 1
        );
      }
    } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
      complexity += calculateComplexity(
        selection.selectionSet.selections,
        variables,
        depth
      );
    }
  }

  return complexity;
}

/**
 * Get base complexity for field
 */
function getFieldComplexity(fieldName: string): number {
  const complexities: Record<string, number> = {
    threats: 5,
    scans: 5,
    organizations: 5,
    alerts: 5,
    webhooks: 3,
    threatStats: 10,
    threatTrends: 10,
  };
  return complexities[fieldName] || 1;
}

/**
 * Get multiplier based on pagination args
 */
function getMultiplier(selection: any, variables: Record<string, any>): number {
  if (!selection.arguments) return 1;

  for (const arg of selection.arguments) {
    if (arg.name.value === 'limit' || arg.name.value === 'first') {
      if (arg.value.kind === 'IntValue') {
        return Math.min(parseInt(arg.value.value, 10), 100);
      }
      if (arg.value.kind === 'Variable') {
        return Math.min(variables[arg.value.name.value] || 10, 100);
      }
    }
  }

  return 10;
}

/**
 * Development tools setup
 */
export function setupDevelopmentTools(
  server: ApolloServer,
  app: Express
): void {
  if (process.env.NODE_ENV === 'development') {
    // Setup Apollo Studio for development
    app.get('/graphql/complexity-check', (req, res) => {
      res.json({
        maxComplexity: 1000,
        estimatedForCurrentUser: 'See request logs',
        documentation: 'Query complexity is calculated per request',
      });
    });

    // Health check endpoint
    app.get('/graphql/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }
}
