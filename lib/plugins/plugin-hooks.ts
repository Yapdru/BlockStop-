/**
 * Plugin Hook System
 * Manages plugin hooks and event-driven architecture
 */

import { Hook, HookType, PluginError } from './plugin-types';

interface HookHandler {
  id: string;
  type: HookType;
  handler: (data: unknown) => Promise<void>;
  priority: number;
  pluginId: string;
}

interface HookResult {
  success: boolean;
  data?: unknown;
  errors: HookError[];
}

interface HookError {
  pluginId: string;
  error: string;
  stack?: string;
}

export class HookSystem {
  private hooks: Map<HookType, HookHandler[]> = new Map();
  private hookHistory: Array<{
    type: HookType;
    timestamp: Date;
    pluginId: string;
    duration: number;
    success: boolean;
  }> = [];
  private readonly maxHistorySize = 1000;

  public registerHook(
    pluginId: string,
    type: HookType,
    handler: (data: unknown) => Promise<void>,
    priority: number = 0
  ): string {
    const hookId = `${pluginId}-${type}-${Date.now()}`;

    const hookHandler: HookHandler = {
      id: hookId,
      type,
      handler,
      priority,
      pluginId,
    };

    if (!this.hooks.has(type)) {
      this.hooks.set(type, []);
    }

    const handlers = this.hooks.get(type)!;
    handlers.push(hookHandler);

    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);

    return hookId;
  }

  public unregisterHook(hookId: string): boolean {
    for (const [type, handlers] of this.hooks.entries()) {
      const index = handlers.findIndex(h => h.id === hookId);
      if (index !== -1) {
        handlers.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  public unregisterPluginHooks(pluginId: string): number {
    let count = 0;

    for (const [type, handlers] of this.hooks.entries()) {
      const before = handlers.length;
      const filtered = handlers.filter(h => h.pluginId !== pluginId);
      this.hooks.set(type, filtered);
      count += before - filtered.length;
    }

    return count;
  }

  public async executeHook(
    type: HookType,
    data?: unknown
  ): Promise<HookResult> {
    const handlers = this.hooks.get(type) || [];
    const errors: HookError[] = [];
    const startTime = performance.now();

    for (const handler of handlers) {
      try {
        const handlerStart = performance.now();
        await Promise.race([
          handler.handler(data),
          this.createTimeout(30000), // 30s timeout per hook
        ]);
        const duration = performance.now() - handlerStart;

        this.recordHookExecution(type, handler.pluginId, duration, true);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        errors.push({
          pluginId: handler.pluginId,
          error: errorMsg,
          stack,
        });

        this.recordHookExecution(type, handler.pluginId, 0, false);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  public async executeHookSequential(
    type: HookType,
    data?: unknown
  ): Promise<HookResult> {
    const handlers = this.hooks.get(type) || [];
    const errors: HookError[] = [];
    let currentData = data;

    for (const handler of handlers) {
      try {
        const startTime = performance.now();
        const result = await Promise.race([
          handler.handler(currentData),
          this.createTimeout(30000),
        ]);
        const duration = performance.now() - startTime;

        this.recordHookExecution(type, handler.pluginId, duration, true);

        if (result instanceof Object && 'data' in result) {
          currentData = (result as { data: unknown }).data;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        errors.push({
          pluginId: handler.pluginId,
          error: errorMsg,
          stack,
        });

        this.recordHookExecution(type, handler.pluginId, 0, false);

        // Stop execution on error in sequential mode
        break;
      }
    }

    return {
      success: errors.length === 0,
      data: currentData,
      errors,
    };
  }

  public getHooksForType(type: HookType): Hook[] {
    const handlers = this.hooks.get(type) || [];
    return handlers.map(h => ({
      id: h.id,
      type: h.type,
      handler: h.handler,
      priority: h.priority,
    }));
  }

  public getHooksByPlugin(pluginId: string): Hook[] {
    const hooks: Hook[] = [];

    for (const [type, handlers] of this.hooks.entries()) {
      for (const handler of handlers) {
        if (handler.pluginId === pluginId) {
          hooks.push({
            id: handler.id,
            type,
            handler: handler.handler,
            priority: handler.priority,
          });
        }
      }
    }

    return hooks;
  }

  public getAllHooks(): Map<HookType, Hook[]> {
    const result = new Map<HookType, Hook[]>();

    for (const [type, handlers] of this.hooks.entries()) {
      result.set(
        type,
        handlers.map(h => ({
          id: h.id,
          type: h.type,
          handler: h.handler,
          priority: h.priority,
        }))
      );
    }

    return result;
  }

  public getHookCount(): number {
    let count = 0;
    for (const handlers of this.hooks.values()) {
      count += handlers.length;
    }
    return count;
  }

  public getHookCountByType(type: HookType): number {
    return (this.hooks.get(type) || []).length;
  }

  public getHookHistory(
    limit: number = 100
  ): Array<{
    type: HookType;
    timestamp: Date;
    pluginId: string;
    duration: number;
    success: boolean;
  }> {
    return this.hookHistory.slice(-limit);
  }

  public clearHookHistory(): void {
    this.hookHistory = [];
  }

  private recordHookExecution(
    type: HookType,
    pluginId: string,
    duration: number,
    success: boolean
  ): void {
    this.hookHistory.push({
      type,
      timestamp: new Date(),
      pluginId,
      duration,
      success,
    });

    // Keep history size manageable
    if (this.hookHistory.length > this.maxHistorySize) {
      this.hookHistory = this.hookHistory.slice(-this.maxHistorySize);
    }
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Hook execution timeout after ${ms}ms`));
      }, ms);
    });
  }
}

export class HookBuilder {
  private type?: HookType;
  private handler?: (data: unknown) => Promise<void>;
  private priority: number = 0;
  private pluginId?: string;

  public setType(type: HookType): this {
    this.type = type;
    return this;
  }

  public setHandler(handler: (data: unknown) => Promise<void>): this {
    this.handler = handler;
    return this;
  }

  public setPriority(priority: number): this {
    this.priority = priority;
    return this;
  }

  public setPluginId(pluginId: string): this {
    this.pluginId = pluginId;
    return this;
  }

  public build(): {
    type: HookType;
    handler: (data: unknown) => Promise<void>;
    priority: number;
    pluginId: string;
  } {
    if (!this.type || !this.handler || !this.pluginId) {
      throw new Error(
        'Missing required hook properties: type, handler, pluginId'
      );
    }

    return {
      type: this.type,
      handler: this.handler,
      priority: this.priority,
      pluginId: this.pluginId,
    };
  }
}
