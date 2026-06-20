// Request Validator with OpenAPI Schema Validation
import { ValidationError } from './error-handler';

export interface SchemaProperty {
  type: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  minimum?: number;
  maximum?: number;
  format?: string;
}

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, SchemaProperty>;
  additionalProperties?: boolean;
}

export class RequestValidator {
  static validateBody(body: any, schema: ValidationSchema): void {
    const errors: Record<string, string[]> = {};

    if (schema.type === 'object' && typeof body !== 'object') {
      throw new ValidationError('Request body must be an object', {
        expected: 'object',
        received: typeof body,
      });
    }

    if (schema.properties) {
      // Check required fields
      const requiredFields = schema.required || [];
      for (const field of requiredFields) {
        if (!(field in body)) {
          errors[field] = [`Missing required field: ${field}`];
        }
      }

      // Validate each property
      for (const [key, value] of Object.entries(body)) {
        if (key in schema.properties) {
          const fieldErrors = this.validateProperty(
            key,
            value,
            schema.properties[key]
          );
          if (fieldErrors.length > 0) {
            errors[key] = fieldErrors;
          }
        } else if (schema.additionalProperties === false) {
          errors[key] = [`Unknown property: ${key}`];
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  static validateQuery(query: Record<string, any>, schema: ValidationSchema): void {
    const errors: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(query)) {
      if (schema.properties && key in schema.properties) {
        const fieldErrors = this.validateProperty(
          key,
          value,
          schema.properties[key]
        );
        if (fieldErrors.length > 0) {
          errors[key] = fieldErrors;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Query validation failed', errors);
    }
  }

  static validateParams(params: Record<string, any>, schema: ValidationSchema): void {
    const errors: Record<string, string[]> = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in params) {
          const fieldErrors = this.validateProperty(
            key,
            params[key],
            propSchema
          );
          if (fieldErrors.length > 0) {
            errors[key] = fieldErrors;
          }
        } else if ((schema.required || []).includes(key)) {
          errors[key] = [`Missing required parameter: ${key}`];
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Parameter validation failed', errors);
    }
  }

  private static validateProperty(
    name: string,
    value: any,
    schema: SchemaProperty
  ): string[] {
    const errors: string[] = [];

    // Type validation
    if (!this.validateType(value, schema.type)) {
      errors.push(`Invalid type for ${name}: expected ${schema.type}, got ${typeof value}`);
      return errors;
    }

    // String validation
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && (value as string).length < schema.minLength) {
        errors.push(`${name} must be at least ${schema.minLength} characters`);
      }
      if (schema.maxLength !== undefined && (value as string).length > schema.maxLength) {
        errors.push(`${name} must be at most ${schema.maxLength} characters`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${name} does not match required pattern`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${name} must be one of: ${schema.enum.join(', ')}`);
      }
      if (schema.format) {
        if (!this.validateFormat(value, schema.format)) {
          errors.push(`${name} is not a valid ${schema.format}`);
        }
      }
    }

    // Number validation
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${name} must be at least ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${name} must be at most ${schema.maximum}`);
      }
    }

    // Array validation
    if (schema.type === 'array' && Array.isArray(value) && schema.items) {
      for (let i = 0; i < value.length; i++) {
        const itemErrors = this.validateProperty(
          `${name}[${i}]`,
          value[i],
          schema.items
        );
        errors.push(...itemErrors);
      }
    }

    return errors;
  }

  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private static validateFormat(value: string, format: string): boolean {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      case 'date-time':
        return !isNaN(Date.parse(value));
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'ipv4':
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) &&
          value.split('.').every(octet => parseInt(octet) <= 255);
      case 'ipv6':
        return /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(value);
      default:
        return true;
    }
  }
}

// Schema definitions
export const ValidationSchemas = {
  // Threat schemas
  threatCreate: {
    type: 'object' as const,
    required: ['name', 'type', 'severity'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
      },
      type: {
        type: 'string',
        enum: ['malware', 'phishing', 'exploit', 'ransomware', 'trojan', 'other'],
      },
      severity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
      },
      description: {
        type: 'string',
        maxLength: 2000,
      },
      indicators: {
        type: 'array',
        items: { type: 'string' },
      },
      metadata: {
        type: 'object',
      },
    },
  },

  // Scan schemas
  scanCreate: {
    type: 'object' as const,
    required: ['type', 'target'],
    properties: {
      type: {
        type: 'string',
        enum: ['email', 'file', 'domain', 'ip', 'url'],
      },
      target: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
      },
      options: {
        type: 'object',
      },
    },
  },

  // Organization schemas
  orgCreate: {
    type: 'object' as const,
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
      },
      description: {
        type: 'string',
        maxLength: 2000,
      },
      website: {
        type: 'string',
        format: 'url',
      },
      industry: {
        type: 'string',
        maxLength: 100,
      },
      metadata: {
        type: 'object',
      },
    },
  },

  // Team schemas
  teamCreate: {
    type: 'object' as const,
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
      },
      description: {
        type: 'string',
        maxLength: 2000,
      },
      maxMembers: {
        type: 'number',
        minimum: 1,
      },
    },
  },

  // Pagination schema
  pagination: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
      },
      offset: {
        type: 'number',
        minimum: 0,
      },
      cursor: {
        type: 'string',
      },
      sort: {
        type: 'string',
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
      },
    },
  },
};
