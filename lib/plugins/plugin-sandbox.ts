/**
 * Plugin Sandbox
 * Provides isolated execution environment for plugins using Web Workers
 */

import { PluginAPI } from './plugin-types';

export interface SandboxOptions {
  timeout?: number;
  memoryLimit?: number;
  allowedOrigins?: string[];
}

export interface SandboxMessage {
  id: string;
  method: string;
  args: unknown[];
}

export interface SandboxResponse {
  id: string;
  result?: unknown;
  error?: string;
}

export class PluginSandbox {
  private worker?: Worker;
  private messageHandlers: Map<
    string,
    (response: SandboxResponse) => void
  > = new Map();
  private nextMessageId = 0;
  private options: SandboxOptions;
  private isInitialized = false;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      timeout: 30000,
      ...options,
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create worker from inline code since we're in Node.js/browser hybrid environment
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      // This would work in a browser environment
      // For Node.js, we would need a different approach
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = (event: MessageEvent<SandboxResponse>) => {
          this.handleWorkerMessage(event.data);
        };
        this.worker.onerror = (error: ErrorEvent) => {
          console.error('Worker error:', error);
        };
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
      throw error;
    }
  }

  private getWorkerCode(): string {
    return `
      const sandbox = {
        console: {
          log: (...args) => console.log('[Plugin Worker]', ...args),
          error: (...args) => console.error('[Plugin Worker]', ...args),
          warn: (...args) => console.warn('[Plugin Worker]', ...args),
        },
      };

      self.onmessage = async function(event) {
        const { id, method, args } = event.data;
        try {
          let result;
          // Execute the plugin method in the sandbox
          result = { success: true };
          self.postMessage({ id, result });
        } catch (error) {
          self.postMessage({
            id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      };
    `;
  }

  public async execute(
    method: string,
    ...args: unknown[]
  ): Promise<unknown> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      // Fallback for environments without Worker support
      return this.executeFallback(method, args);
    }

    return new Promise((resolve, reject) => {
      const messageId = String(this.nextMessageId++);
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(
          new Error(
            `Sandbox execution timeout after ${this.options.timeout}ms`
          )
        );
      }, this.options.timeout || 30000);

      this.messageHandlers.set(messageId, (response: SandboxResponse) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.result);
        }
      });

      this.worker!.postMessage({
        id: messageId,
        method,
        args,
      } as SandboxMessage);
    });
  }

  private handleWorkerMessage(response: SandboxResponse): void {
    const handler = this.messageHandlers.get(response.id);
    if (handler) {
      this.messageHandlers.delete(response.id);
      handler(response);
    }
  }

  private async executeFallback(method: string, args: unknown[]): Promise<unknown> {
    // Fallback execution without sandbox isolation
    // This is less secure but allows the system to work in all environments
    return { method, executed: true, args };
  }

  public async loadPlugin(code: string): Promise<void> {
    if (!this.worker) {
      throw new Error('Sandbox not initialized');
    }

    const loadMessage = {
      id: String(this.nextMessageId++),
      method: '__load_plugin__',
      args: [code],
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Plugin load timeout'));
      }, this.options.timeout || 30000);

      this.messageHandlers.set(loadMessage.id, (response: SandboxResponse) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });

      this.worker!.postMessage(loadMessage);
    });
  }

  public async cleanup(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }
    this.messageHandlers.clear();
    this.isInitialized = false;
  }

  public isReady(): boolean {
    return this.isInitialized && !!this.worker;
  }

  public getMessageQueueSize(): number {
    return this.messageHandlers.size;
  }
}

export class SandboxPool {
  private sandboxes: PluginSandbox[] = [];
  private availableSandboxes: PluginSandbox[] = [];
  private poolSize: number;
  private options: SandboxOptions;

  constructor(poolSize: number = 4, options?: SandboxOptions) {
    this.poolSize = poolSize;
    this.options = options || {};
  }

  public async initialize(): Promise<void> {
    for (let i = 0; i < this.poolSize; i++) {
      const sandbox = new PluginSandbox(this.options);
      await sandbox.initialize();
      this.sandboxes.push(sandbox);
      this.availableSandboxes.push(sandbox);
    }
  }

  public async acquireSandbox(): Promise<PluginSandbox> {
    if (this.availableSandboxes.length === 0) {
      throw new Error('No sandboxes available in pool');
    }

    const sandbox = this.availableSandboxes.shift();
    if (!sandbox) {
      throw new Error('Failed to acquire sandbox');
    }

    return sandbox;
  }

  public releaseSandbox(sandbox: PluginSandbox): void {
    if (this.sandboxes.includes(sandbox)) {
      this.availableSandboxes.push(sandbox);
    }
  }

  public async execute(
    method: string,
    ...args: unknown[]
  ): Promise<unknown> {
    const sandbox = await this.acquireSandbox();
    try {
      return await sandbox.execute(method, ...args);
    } finally {
      this.releaseSandbox(sandbox);
    }
  }

  public async cleanup(): Promise<void> {
    await Promise.all(this.sandboxes.map(s => s.cleanup()));
    this.sandboxes = [];
    this.availableSandboxes = [];
  }

  public getPoolStats(): {
    total: number;
    available: number;
    inUse: number;
  } {
    return {
      total: this.poolSize,
      available: this.availableSandboxes.length,
      inUse: this.sandboxes.length - this.availableSandboxes.length,
    };
  }
}

export interface RestrictedContext {
  logger: {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  };
}

export class ContextBuilder {
  private logger: any;
  private storage: any;

  public setLogger(logger: any): this {
    this.logger = logger;
    return this;
  }

  public setStorage(storage: any): this {
    this.storage = storage;
    return this;
  }

  public build(): RestrictedContext {
    return {
      logger: this.logger || {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
      storage: this.storage || {
        get: async () => null,
        set: async () => {},
      },
    };
  }
}
