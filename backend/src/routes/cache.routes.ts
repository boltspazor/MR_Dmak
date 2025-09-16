import express from 'express';
import cacheController from '../controllers/cache.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Cache statistics
router.get('/stats', authenticateToken, cacheController.getStats);

// Basic cache operations
router.post('/set', authenticateToken, cacheController.setCache);
router.get('/get/:key', authenticateToken, cacheController.getCache);
router.delete('/delete/:key', authenticateToken, cacheController.deleteCache);
router.delete('/clear', authenticateToken, cacheController.clearCache);
router.post('/invalidate-pattern', authenticateToken, cacheController.invalidatePattern);

// Specific data caching
router.post('/mrs', authenticateToken, cacheController.cacheMRs);
router.get('/mrs', authenticateToken, cacheController.getCachedMRs);
router.post('/campaigns', authenticateToken, cacheController.cacheCampaigns);
router.get('/campaigns', authenticateToken, cacheController.getCachedCampaigns);

export default router;
