/**
 * Plugin SDK Validation Utilities
 * Helpers for validating data in plugins
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class Validator {
  public static required(value: unknown, fieldName: string): ValidationError | null {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return { field: fieldName, message: `${fieldName} is required`, value };
    }
    return null;
  }

  public static email(value: string, fieldName: string = 'email'): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        value,
      };
    }
    return null;
  }

  public static minLength(
    value: string | any[],
    min: number,
    fieldName: string
  ): ValidationError | null {
    if (value.length < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters long`,
        value,
      };
    }
    return null;
  }

  public static maxLength(
    value: string | any[],
    max: number,
    fieldName: string
  ): ValidationError | null {
    if (value.length > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be at most ${max} characters long`,
        value,
      };
    }
    return null;
  }

  public static minValue(
    value: number,
    min: number,
    fieldName: string
  ): ValidationError | null {
    if (value < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        value,
      };
    }
    return null;
  }

  public static maxValue(
    value: number,
    max: number,
    fieldName: string
  ): ValidationError | null {
    if (value > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
        value,
      };
    }
    return null;
  }

  public static isType(
    value: unknown,
    type: string,
    fieldName: string
  ): ValidationError | null {
    if (typeof value !== type) {
      return {
        field: fieldName,
        message: `${fieldName} must be of type ${type}`,
        value,
      };
    }
    return null;
  }

  public static isArray(value: unknown, fieldName: string): ValidationError | null {
    if (!Array.isArray(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be an array`,
        value,
      };
    }
    return null;
  }

  public static isNumber(value: unknown, fieldName: string): ValidationError | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a number`,
        value,
      };
    }
    return null;
  }

  public static isString(value: unknown, fieldName: string): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field: fieldName,
        message: `${fieldName} must be a string`,
        value,
      };
    }
    return null;
  }

  public static isBoolean(value: unknown, fieldName: string): ValidationError | null {
    if (typeof value !== 'boolean') {
      return {
        field: fieldName,
        message: `${fieldName} must be a boolean`,
        value,
      };
    }
    return null;
  }

  public static pattern(
    value: string,
    pattern: RegExp,
    fieldName: string
  ): ValidationError | null {
    if (!pattern.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} does not match required pattern: ${pattern}`,
        value,
      };
    }
    return null;
  }

  public static custom(
    value: unknown,
    validatorFn: (v: unknown) => boolean,
    fieldName: string,
    message: string
  ): ValidationError | null {
    if (!validatorFn(value)) {
      return { field: fieldName, message, value };
    }
    return null;
  }

  public static oneOf(
    value: unknown,
    allowedValues: unknown[],
    fieldName: string
  ): ValidationError | null {
    if (!allowedValues.includes(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        value,
      };
    }
    return null;
  }
}

export class SchemaValidator {
  private schema: Record<string, ((value: unknown) => ValidationError | null)[]> = {};

  public addRule(
    fieldName: string,
    rule: (value: unknown) => ValidationError | null
  ): this {
    if (!this.schema[fieldName]) {
      this.schema[fieldName] = [];
    }
    this.schema[fieldName].push(rule);
    return this;
  }

  public required(fieldName: string): this {
    return this.addRule(fieldName, value =>
      Validator.required(value, fieldName)
    );
  }

  public email(fieldName: string): this {
    return this.addRule(fieldName, value =>
      Validator.email(value as string, fieldName)
    );
  }

  public minLength(fieldName: string, min: number): this {
    return this.addRule(fieldName, value =>
      Validator.minLength(value as string | any[], min, fieldName)
    );
  }

  public maxLength(fieldName: string, max: number): this {
    return this.addRule(fieldName, value =>
      Validator.maxLength(value as string | any[], max, fieldName)
    );
  }

  public minValue(fieldName: string, min: number): this {
    return this.addRule(fieldName, value =>
      Validator.minValue(value as number, min, fieldName)
    );
  }

  public maxValue(fieldName: string, max: number): this {
    return this.addRule(fieldName, value =>
      Validator.maxValue(value as number, max, fieldName)
    );
  }

  public type(fieldName: string, type: string): this {
    return this.addRule(fieldName, value =>
      Validator.isType(value, type, fieldName)
    );
  }

  public array(fieldName: string): this {
    return this.addRule(fieldName, value =>
      Validator.isArray(value, fieldName)
    );
  }

  public number(fieldName: string): this {
    return this.addRule(fieldName, value =>
      Validator.isNumber(value, fieldName)
    );
  }

  public string(fieldName: string): this {
    return this.addRule(fieldName, value =>
      Validator.isString(value, fieldName)
    );
  }

  public boolean(fieldName: string): this {
    return this.addRule(fieldName, value =>
      Validator.isBoolean(value, fieldName)
    );
  }

  public pattern(fieldName: string, pattern: RegExp): this {
    return this.addRule(fieldName, value =>
      Validator.pattern(value as string, pattern, fieldName)
    );
  }

  public validate(data: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, rules] of Object.entries(this.schema)) {
      const value = data[fieldName];

      for (const rule of rules) {
        const error = rule(value);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public clear(): this {
    this.schema = {};
    return this;
  }
}

export function createValidator(): SchemaValidator {
  return new SchemaValidator();
}
