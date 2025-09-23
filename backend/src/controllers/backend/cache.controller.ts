import { Request, Response } from 'express';
import cacheService from '../../services/cache.service';
import logger from '../../utils/logger';

export class CacheController {
  // Get cache statistics
  async getStats(req: Request, res: Response) {
    try {
      const stats = await cacheService.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Cache stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cache statistics'
      });
    }
  }

  // Set cache value
  async setCache(req: Request, res: Response) {
    try {
      const { key, value, ttl } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Key and value are required'
        });
      }

      const success = await cacheService.set(key, value, ttl || 3600);
      
      return res.json({
        success,
        message: success ? 'Cache set successfully' : 'Failed to set cache'
      });
    } catch (error: any) {
      logger.error('Cache set error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to set cache'
      });
    }
  }

  // Get cache value
  async getCache(req: Request, res: Response) {
    try {
      const { key } = req.params;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Key is required'
        });
      }

      const value = await cacheService.get(key);
      
      return res.json({
        success: true,
        data: value,
        found: value !== null
      });
    } catch (error: any) {
      logger.error('Cache get error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cache'
      });
    }
  }

  // Delete cache value
  async deleteCache(req: Request, res: Response) {
    try {
      const { key } = req.params;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Key is required'
        });
      }

      const success = await cacheService.delete(key);
      
      return res.json({
        success,
        message: success ? 'Cache deleted successfully' : 'Failed to delete cache'
      });
    } catch (error: any) {
      logger.error('Cache delete error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete cache'
      });
    }
  }

  // Clear all cache
  async clearCache(req: Request, res: Response) {
    try {
      const success = await cacheService.clear();
      
      return res.json({
        success,
        message: success ? 'Cache cleared successfully' : 'Failed to clear cache'
      });
    } catch (error: any) {
      logger.error('Cache clear error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }

  // Invalidate cache by pattern
  async invalidatePattern(req: Request, res: Response) {
    try {
      const { pattern } = req.body;

      if (!pattern) {
        return res.status(400).json({
          success: false,
          error: 'Pattern is required'
        });
      }

      const deletedCount = await cacheService.deletePattern(pattern);
      
      return res.json({
        success: true,
        message: `Deleted ${deletedCount} cache entries`,
        deletedCount
      });
    } catch (error: any) {
      logger.error('Cache invalidate pattern error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to invalidate cache pattern'
      });
    }
  }

  // Cache MRs data
  async cacheMRs(req: Request, res: Response) {
    try {
      const { mrs, ttl = 1800 } = req.body; // Default 30 minutes

      if (!mrs || !Array.isArray(mrs)) {
        return res.status(400).json({
          success: false,
          error: 'MRs data is required'
        });
      }

      const success = await cacheService.cacheWithKey('mrs', 'all', mrs, ttl);
      
      return res.json({
        success,
        message: success ? 'MRs cached successfully' : 'Failed to cache MRs'
      });
    } catch (error: any) {
      logger.error('Cache MRs error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cache MRs'
      });
    }
  }

  // Get cached MRs
  async getCachedMRs(req: Request, res: Response) {
    try {
      const mrs = await cacheService.getCachedData('mrs', 'all');
      
      return res.json({
        success: true,
        data: mrs,
        found: mrs !== null
      });
    } catch (error: any) {
      logger.error('Get cached MRs error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cached MRs'
      });
    }
  }

  // Cache campaigns data
  async cacheCampaigns(req: Request, res: Response) {
    try {
      const { campaigns, ttl = 1800 } = req.body; // Default 30 minutes

      if (!campaigns || !Array.isArray(campaigns)) {
        return res.status(400).json({
          success: false,
          error: 'Campaigns data is required'
        });
      }

      const success = await cacheService.cacheWithKey('campaigns', 'all', campaigns, ttl);
      
      return res.json({
        success,
        message: success ? 'Campaigns cached successfully' : 'Failed to cache campaigns'
      });
    } catch (error: any) {
      logger.error('Cache campaigns error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cache campaigns'
      });
    }
  }

  // Get cached campaigns
  async getCachedCampaigns(req: Request, res: Response) {
    try {
      const campaigns = await cacheService.getCachedData('campaigns', 'all');
      
      return res.json({
        success: true,
        data: campaigns,
        found: campaigns !== null
      });
    } catch (error: any) {
      logger.error('Get cached campaigns error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cached campaigns'
      });
    }
  }
}

export default new CacheController();
