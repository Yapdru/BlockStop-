/**
 * Plugin SDK Storage API
 * Client-side storage management for plugins
 */

export interface StorageBackend {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryStorage implements StorageBackend {
  private data: Map<string, unknown> = new Map();

  async get<T = unknown>(key: string): Promise<T | null> {
    return (this.data.get(key) as T) || null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}

export class LocalStorageAdapter implements StorageBackend {
  private prefix: string;

  constructor(prefix: string = 'blockstop-plugin') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(this.getKey(key));
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      throw new Error(`Failed to set storage: ${error}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch {
      // Ignore errors
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Ignore errors
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${this.prefix}:`)) {
          keys.push(key.replace(`${this.prefix}:`, ''));
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
}

export class PluginStorage {
  private backend: StorageBackend;
  private namespace: string;

  constructor(namespace: string, backend?: StorageBackend) {
    this.namespace = namespace;
    this.backend = backend || new MemoryStorage();
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    return this.backend.get<T>(this.getKey(key));
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    return this.backend.set(this.getKey(key), value);
  }

  async delete(key: string): Promise<void> {
    return this.backend.delete(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keys = await this.backend.keys();
    const namespaceKeys = keys.filter(k => k.startsWith(`${this.namespace}:`));
    for (const key of namespaceKeys) {
      await this.backend.delete(key);
    }
  }

  async keys(): Promise<string[]> {
    const keys = await this.backend.keys();
    return keys
      .filter(k => k.startsWith(`${this.namespace}:`))
      .map(k => k.replace(`${this.namespace}:`, ''));
  }

  async getJSON<T = unknown>(key: string): Promise<T | null> {
    const value = await this.get<string>(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJSON<T = unknown>(key: string, value: T): Promise<void> {
    return this.set(key, JSON.stringify(value));
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current || 0) + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    return this.increment(key, -amount);
  }

  async append<T = unknown>(key: string, value: T): Promise<void> {
    const current = await this.get<T[]>(key);
    const array = current || [];
    array.push(value);
    await this.set(key, array);
  }

  async getSize(): Promise<number> {
    const keys = await this.keys();
    let size = 0;
    for (const key of keys) {
      const value = await this.get(key);
      if (value) {
        size += JSON.stringify(value).length;
      }
    }
    return size;
  }

  async getAllData(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    const keys = await this.keys();
    for (const key of keys) {
      data[key] = await this.get(key);
    }
    return data;
  }

  setBackend(backend: StorageBackend): void {
    this.backend = backend;
  }
}

export function createStorage(
  namespace: string,
  backend?: StorageBackend
): PluginStorage {
  return new PluginStorage(namespace, backend);
}

export function createLocalStorage(namespace: string): PluginStorage {
  return new PluginStorage(
    namespace,
    new LocalStorageAdapter(namespace)
  );
}
