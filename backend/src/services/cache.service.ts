import Redis from 'ioredis';
import logger from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        logger.info('✅ Redis cache connected');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.warn('Redis cache error:', error.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis cache connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.redis.ping();
      logger.info('✅ Redis cache service initialized');
    } catch (error) {
      logger.warn('Redis not available, using memory cache fallback');
      this.redis = null;
      this.isConnected = false;
    }
  }

  // Set cache with TTL (Time To Live) in seconds
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      if (!this.isConnected || !this.redis) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serializedValue);
      logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected || !this.redis) {
        return null;
      }

      const value = await this.redis.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache entry
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.redis) {
        return false;
      }

      await this.redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple keys with pattern
  async deletePattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected || !this.redis) {
        return 0;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cache pattern deleted: ${pattern} (${keys.length} keys)`);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.redis) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Get TTL for a key
  async getTTL(key: string): Promise<number> {
    try {
      if (!this.isConnected || !this.redis) {
        return -1;
      }

      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Clear all cache
  async clear(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.redis) {
        return false;
      }

      await this.redis.flushdb();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats(): Promise<any> {
    try {
      if (!this.isConnected || !this.redis) {
        return {
          connected: false,
          keys: 0,
          memory: 'N/A'
        };
      }

      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();
      
      return {
        connected: true,
        keys,
        memory: info
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        connected: false,
        keys: 0,
        memory: 'N/A'
      };
    }
  }

  // Cache with automatic key generation
  async cacheWithKey<T>(
    prefix: string,
    identifier: string,
    data: T,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    const key = `${prefix}:${identifier}`;
    return this.set(key, data, ttlSeconds);
  }

  // Get cached data with automatic key generation
  async getCachedData<T>(
    prefix: string,
    identifier: string
  ): Promise<T | null> {
    const key = `${prefix}:${identifier}`;
    return this.get<T>(key);
  }

  // Invalidate cache by prefix
  async invalidateByPrefix(prefix: string): Promise<number> {
    return this.deletePattern(`${prefix}:*`);
  }
}

export default new CacheService();
