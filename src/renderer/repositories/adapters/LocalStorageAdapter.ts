// LocalStorage implementation of IStorageAdapter
// Current storage solution using browser's localStorage

import type { IStorageAdapter } from '../interfaces/IStorageAdapter';

export class LocalStorageAdapter implements IStorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error reading key "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error writing key "${key}":`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error removing key "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[LocalStorageAdapter] Error clearing storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error getting all keys:', error);
      return [];
    }
  }
}
