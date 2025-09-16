interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private storage: Storage;
  private prefix: string;

  constructor(useSessionStorage: boolean = false) {
    this.storage = useSessionStorage ? sessionStorage : localStorage;
    this.prefix = 'mr_app_cache';
  }

  // Set cache with TTL (Time To Live) in seconds
  set<T>(key: string, value: T, ttlSeconds: number = 3600): boolean {
    try {
      const cacheItem: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds * 1000, // Convert to milliseconds
      };

      const cacheKey = `${this.prefix}:${key}`;
      this.storage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      console.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cached value
  get<T>(key: string): T | null {
    try {
      const cacheKey = `${this.prefix}:${key}`;
      const item = this.storage.getItem(cacheKey);
      
      if (!item) {
        console.debug(`Cache miss: ${key}`);
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        console.debug(`Cache expired: ${key}`);
        this.delete(key);
        return null;
      }

      console.debug(`Cache hit: ${key}`);
      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache entry
  delete(key: string): boolean {
    try {
      const cacheKey = `${this.prefix}:${key}`;
      this.storage.removeItem(cacheKey);
      console.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists and is not expired
  exists(key: string): boolean {
    return this.get(key) !== null;
  }

  // Get remaining TTL in seconds
  getTTL(key: string): number {
    try {
      const cacheKey = `${this.prefix}:${key}`;
      const item = this.storage.getItem(cacheKey);
      
      if (!item) return -1;

      const cacheItem: CacheItem<any> = JSON.parse(item);
      const remaining = cacheItem.ttl - (Date.now() - cacheItem.timestamp);
      
      return Math.max(0, Math.floor(remaining / 1000));
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Clear all cache entries
  clear(): boolean {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.storage.removeItem(key));
      console.info(`Cache cleared (${keysToRemove.length} entries)`);
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  getStats(): { keys: number; size: number; storage: string } {
    try {
      let keys = 0;
      let size = 0;
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys++;
          const item = this.storage.getItem(key);
          if (item) {
            size += item.length;
          }
        }
      }
      
      return {
        keys,
        size,
        storage: this.storage === localStorage ? 'localStorage' : 'sessionStorage'
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, size: 0, storage: 'unknown' };
    }
  }

  // Cache with automatic key generation
  cacheWithKey<T>(
    prefix: string,
    identifier: string,
    data: T,
    ttlSeconds: number = 3600
  ): boolean {
    const key = `${prefix}:${identifier}`;
    return this.set(key, data, ttlSeconds);
  }

  // Get cached data with automatic key generation
  getCachedData<T>(prefix: string, identifier: string): T | null {
    const key = `${prefix}:${identifier}`;
    return this.get<T>(key);
  }

  // Invalidate cache by prefix
  invalidateByPrefix(prefix: string): number {
    let deletedCount = 0;
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(`${this.prefix}:${prefix}:`)) {
          this.storage.removeItem(key);
          deletedCount++;
        }
      }
      
      console.debug(`Cache pattern deleted: ${prefix} (${deletedCount} keys)`);
    } catch (error) {
      console.error('Cache invalidate by prefix error:', error);
    }
    
    return deletedCount;
  }

  // Clean expired entries
  cleanExpired(): number {
    let cleanedCount = 0;
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const item = this.storage.getItem(key);
          if (item) {
            try {
              const cacheItem: CacheItem<any> = JSON.parse(item);
              if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
                this.storage.removeItem(key);
                cleanedCount++;
              }
            } catch (parseError) {
              // Remove invalid entries
              this.storage.removeItem(key);
              cleanedCount++;
            }
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.debug(`Cleaned ${cleanedCount} expired cache entries`);
      }
    } catch (error) {
      console.error('Cache clean expired error:', error);
    }
    
    return cleanedCount;
  }
}

// Export singleton instances
export const localCache = new CacheService(false); // localStorage
export const sessionCache = new CacheService(true); // sessionStorage
export default localCache;
