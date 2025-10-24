/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user information
 *     responses:
 *       200:
 *         description: Successfully retrieved user data
 */
import 'swagger-jsdoc';
import { Router } from 'express';
import { SuperAdminController } from '../../controllers/backend/super-admin.controller';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();
const superAdminController = new SuperAdminController();

// Public setup routes
router.post('/create', superAdminController.createOrUpdateSuperAdmin);
router.get('/info', superAdminController.getSuperAdminInfo);
router.post('/reset-password', superAdminController.resetSuperAdminPassword);
router.get('/credentials', superAdminController.getSuperAdminCredentials);

// Protected admin routes
router.use(authenticateToken, requireRole(['super-admin']));
router.get('/stats', superAdminController.getStats);
router.get('/performance', superAdminController.getPerformance);
router.get('/marketing-managers', superAdminController.getMarketingManagers);
router.post('/marketing-managers', superAdminController.createMarketingManager);
router.put('/marketing-managers/:id', superAdminController.updateMarketingManager);
router.delete('/marketing-managers/:id', superAdminController.deleteMarketingManager);

export default router;
