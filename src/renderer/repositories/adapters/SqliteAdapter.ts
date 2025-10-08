// SQLite implementation stub of IStorageAdapter
// Future storage solution for better performance and querying
// TODO: Implement when migrating from localStorage to SQLite

import type { IStorageAdapter } from '../interfaces/IStorageAdapter';

export class SqliteAdapter implements IStorageAdapter {
  private db: any; // Will be better-sqlite3 or similar

  constructor(dbPath?: string) {
    // TODO: Initialize SQLite database
    // Example:
    // const Database = require('better-sqlite3');
    // this.db = new Database(dbPath || './electoral.db');
    // this.initTables();
    throw new Error('SqliteAdapter not yet implemented. Use LocalStorageAdapter instead.');
  }

  // TODO: Create tables on initialization
  // private initTables() {
  //   this.db.exec(`
  //     CREATE TABLE IF NOT EXISTS storage (
  //       key TEXT PRIMARY KEY,
  //       value TEXT NOT NULL,
  //       updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  //     )
  //   `);
  // }

  async get<T>(key: string): Promise<T | null> {
    // TODO: SELECT value FROM storage WHERE key = ?
    throw new Error('SqliteAdapter.get() not implemented');
  }

  async set<T>(key: string, value: T): Promise<void> {
    // TODO: INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?)
    throw new Error('SqliteAdapter.set() not implemented');
  }

  async remove(key: string): Promise<void> {
    // TODO: DELETE FROM storage WHERE key = ?
    throw new Error('SqliteAdapter.remove() not implemented');
  }

  async clear(): Promise<void> {
    // TODO: DELETE FROM storage
    throw new Error('SqliteAdapter.clear() not implemented');
  }

  async getAllKeys(): Promise<string[]> {
    // TODO: SELECT key FROM storage
    throw new Error('SqliteAdapter.getAllKeys() not implemented');
  }
}
