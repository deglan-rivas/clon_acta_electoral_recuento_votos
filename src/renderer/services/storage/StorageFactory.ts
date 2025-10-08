// Storage Factory - Easy switching between storage implementations
// Change storage type in one place to migrate entire application

import type { IStorageAdapter } from '../../repositories/interfaces/IStorageAdapter';
import { LocalStorageAdapter } from '../../repositories/adapters/LocalStorageAdapter';
import { SqliteAdapter } from '../../repositories/adapters/SqliteAdapter';

export type StorageType = 'localStorage' | 'sqlite';

export class StorageFactory {
  private static instance: IStorageAdapter | null = null;

  static getAdapter(type: StorageType = 'localStorage'): IStorageAdapter {
    // Singleton pattern - reuse existing adapter
    if (this.instance) {
      return this.instance;
    }

    switch (type) {
      case 'localStorage':
        this.instance = new LocalStorageAdapter();
        break;
      case 'sqlite':
        this.instance = new SqliteAdapter();
        break;
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }

    return this.instance;
  }

  static resetAdapter(): void {
    this.instance = null;
  }
}
