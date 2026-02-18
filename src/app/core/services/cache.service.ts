import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

interface AcademyCacheDB extends DBSchema {
  apiCache: {
    key: string;
    value: CacheEntry;
    indexes: { 'by-expiry': number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private dbPromise: Promise<IDBPDatabase<AcademyCacheDB>> | null = null;
  private readonly DB_NAME = 'academy-cache';
  private readonly STORE_NAME = 'apiCache';
  private readonly DB_VERSION = 1;

  // Default cache durations (in milliseconds)
  readonly CACHE_DURATIONS = {
    SHORT: 1 * 60 * 1000,      // 1 minute - for frequently changing data
    MEDIUM: 5 * 60 * 1000,     // 5 minutes - for moderately changing data
    LONG: 30 * 60 * 1000,      // 30 minutes - for rarely changing data
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for static data
  };

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<AcademyCacheDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<AcademyCacheDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          const store = db.createObjectStore('apiCache', { keyPath: 'key' });
          store.createIndex('by-expiry', 'expiresAt');
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Get cached data if valid
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      const entry = await db.get(this.STORE_NAME, key);
      
      if (!entry) return null;
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }
      
      return entry.data as T;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  async set(key: string, data: unknown, ttlMs: number = this.CACHE_DURATIONS.MEDIUM): Promise<void> {
    try {
      const db = await this.initDB();
      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
      };
      await db.put(this.STORE_NAME, entry);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      await db.delete(this.STORE_NAME, key);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  /**
   * Delete all cache entries matching a prefix
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      
      let cursor = await store.openCursor();
      while (cursor) {
        if (cursor.key.toString().startsWith(prefix)) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      
      await tx.done;
    } catch (error) {
      console.warn('Cache deleteByPrefix error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      await db.clear(this.STORE_NAME);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const index = tx.objectStore(this.STORE_NAME).index('by-expiry');
      
      const now = Date.now();
      let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
      
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
      
      await tx.done;
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{ count: number; oldestTimestamp: number | null }> {
    try {
      const db = await this.initDB();
      const count = await db.count(this.STORE_NAME);
      
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const cursor = await store.openCursor();
      
      return {
        count,
        oldestTimestamp: cursor?.value.timestamp || null,
      };
    } catch {
      return { count: 0, oldestTimestamp: null };
    }
  }
}
