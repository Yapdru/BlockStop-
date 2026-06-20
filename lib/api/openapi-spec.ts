// OpenAPI/Swagger Specification
export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'BlockStop Enterprise API',
    description:
      'Comprehensive REST API for threat detection and incident response',
    version: '1.0.0',
    contact: {
      name: 'BlockStop Support',
      url: 'https://blockstop.io/support',
      email: 'api@blockstop.io',
    },
    license: {
      name: 'Commercial',
      url: 'https://blockstop.io/license',
    },
  },
  servers: [
    {
      url: 'https://api.blockstop.io/v1',
      description: 'Production API',
    },
    {
      url: 'https://staging-api.blockstop.io/v1',
      description: 'Staging API',
    },
  ],
  paths: {
    '/threats': {
      get: {
        summary: 'List threats',
        tags: ['Threats'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 },
          },
          {
            name: 'severity',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'info'],
            },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['open', 'investigating', 'remediated', 'false_positive'],
            },
          },
        ],
        security: [{ BearerAuth: ['threats:read'] }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedThreats',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/TooManyRequestsError' },
        },
      },
      post: {
        summary: 'Create threat',
        tags: ['Threats'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateThreatRequest' },
            },
          },
        },
        security: [{ BearerAuth: ['threats:write'] }],
        responses: {
          '201': {
            description: 'Threat created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Threat' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequestError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/threats/{id}': {
      get: {
        summary: 'Get threat',
        tags: ['Threats'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        security: [{ BearerAuth: ['threats:read'] }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Threat' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFoundError' },
        },
      },
      put: {
        summary: 'Update threat',
        tags: ['Threats'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateThreatRequest' },
            },
          },
        },
        security: [{ BearerAuth: ['threats:write'] }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Threat' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete threat',
        tags: ['Threats'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        security: [{ BearerAuth: ['threats:delete'] }],
        responses: {
          '204': { description: 'Deleted' },
        },
      },
    },
    '/webhooks': {
      get: {
        summary: 'List webhooks',
        tags: ['Webhooks'],
        security: [{ BearerAuth: ['webhooks:read'] }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Webhook' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create webhook',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateWebhookRequest' },
            },
          },
        },
        security: [{ BearerAuth: ['webhooks:write'] }],
        responses: {
          '201': {
            description: 'Webhook created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Webhook' },
              },
            },
          },
        },
      },
    },
    '/integrations': {
      get: {
        summary: 'List integrations',
        tags: ['Integrations'],
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'siem',
                'edr',
                'soar',
                'ticketing',
                'communication',
                'threat_intel',
              ],
            },
          },
        ],
        security: [{ BearerAuth: ['integrations:read'] }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Integration' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api-keys': {
      get: {
        summary: 'List API keys',
        tags: ['API Keys'],
        security: [{ BearerAuth: ['api-keys:read'] }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/APIKey' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create API key',
        tags: ['API Keys'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAPIKeyRequest' },
            },
          },
        },
        security: [{ BearerAuth: ['api-keys:write'] }],
        responses: {
          '201': {
            description: 'API key created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/APIKey' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Use API key with Bearer scheme',
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      BadRequestError: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFoundError: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      TooManyRequestsError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    schemas: {
      Threat: {
        type: 'object',
        required: ['id', 'type', 'severity', 'status'],
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: [
              'phishing',
              'malware',
              'ransomware',
              'bec',
              'spam',
              'dlp_violation',
            ],
          },
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low', 'info'],
          },
          status: {
            type: 'string',
            enum: ['open', 'investigating', 'remediated', 'false_positive'],
          },
          source: { type: 'string' },
          subject: { type: 'string' },
          indicators: { type: 'array', items: { type: 'string' } },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      CreateThreatRequest: {
        type: 'object',
        required: ['type', 'source'],
        properties: {
          type: { type: 'string' },
          source: { type: 'string' },
          subject: { type: 'string' },
          indicators: { type: 'array', items: { type: 'string' } },
        },
      },
      UpdateThreatRequest: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          severity: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      Webhook: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          eventTypes: { type: 'array', items: { type: 'string' } },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateWebhookRequest: {
        type: 'object',
        required: ['url', 'eventTypes'],
        properties: {
          url: { type: 'string', format: 'uri' },
          eventTypes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      Integration: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          enabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      APIKey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' } },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateAPIKeyRequest: {
        type: 'object',
        required: ['name', 'scopes'],
        properties: {
          name: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' } },
        },
      },
      PaginatedThreats: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Threat' } },
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              statusCode: { type: 'integer' },
            },
          },
        },
      },
    },
  },
};
