/**
 * Plugin SDK Hook Helpers
 * Utilities for working with BlockStop hooks
 */

import { HookType } from './types';

export interface Hook {
  id: string;
  type: HookType;
  handler: (data: unknown) => Promise<void>;
  priority?: number;
}

export interface HookContext {
  pluginId: string;
  hooks: Map<HookType, Hook[]>;
}

export class HookManager {
  private context: HookContext;

  constructor(pluginId: string) {
    this.context = {
      pluginId,
      hooks: new Map(),
    };
  }

  public registerHook(
    type: HookType,
    handler: (data: unknown) => Promise<void>,
    priority: number = 0
  ): string {
    const hookId = `${this.context.pluginId}-${type}-${Date.now()}`;

    if (!this.context.hooks.has(type)) {
      this.context.hooks.set(type, []);
    }

    const hook: Hook = {
      id: hookId,
      type,
      handler,
      priority,
    };

    const hooks = this.context.hooks.get(type)!;
    hooks.push(hook);
    hooks.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return hookId;
  }

  public unregisterHook(hookId: string): boolean {
    for (const hooks of this.context.hooks.values()) {
      const index = hooks.findIndex(h => h.id === hookId);
      if (index !== -1) {
        hooks.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  public getHooks(type?: HookType): Hook[] {
    if (type) {
      return this.context.hooks.get(type) || [];
    }

    const allHooks: Hook[] = [];
    for (const hooks of this.context.hooks.values()) {
      allHooks.push(...hooks);
    }
    return allHooks;
  }

  public async executeHook(type: HookType, data?: unknown): Promise<void> {
    const hooks = this.context.hooks.get(type) || [];

    for (const hook of hooks) {
      try {
        await hook.handler(data);
      } catch (error) {
        console.error(`Error in hook ${hook.id}:`, error);
      }
    }
  }

  public clearHooks(type?: HookType): void {
    if (type) {
      this.context.hooks.delete(type);
    } else {
      this.context.hooks.clear();
    }
  }
}

export function createHookManager(pluginId: string): HookManager {
  return new HookManager(pluginId);
}

export function onThreatDetected(
  manager: HookManager,
  handler: (threat: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.ON_THREAT_DETECTED, handler, priority);
}

export function beforeThreatScan(
  manager: HookManager,
  handler: (data: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.BEFORE_THREAT_SCAN, handler, priority);
}

export function afterThreatScan(
  manager: HookManager,
  handler: (result: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.AFTER_THREAT_SCAN, handler, priority);
}

export function beforeDataProcess(
  manager: HookManager,
  handler: (data: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.BEFORE_DATA_PROCESS, handler, priority);
}

export function afterDataProcess(
  manager: HookManager,
  handler: (result: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.AFTER_DATA_PROCESS, handler, priority);
}

export function onPluginEnable(
  manager: HookManager,
  handler: (data: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.ON_PLUGIN_ENABLED, handler, priority);
}

export function onPluginDisable(
  manager: HookManager,
  handler: (data: any) => Promise<void>,
  priority?: number
): string {
  return manager.registerHook(HookType.ON_PLUGIN_DISABLED, handler, priority);
}
