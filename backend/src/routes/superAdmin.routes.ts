import { Router } from 'express';
import { SuperAdminController } from '../controllers/superAdmin.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { isSuperAdmin } from '../middleware/role.middleware';

const router = Router();
const superAdminController = new SuperAdminController();

// All routes require super admin authentication
router.use(authenticateToken);
router.use(isSuperAdmin);

// System overview
router.get('/stats', superAdminController.getSystemStats);
router.get('/performance', superAdminController.getPerformanceMetrics);

// Marketing manager management
router.get('/marketing-managers', superAdminController.getMarketingManagers);
router.post('/marketing-managers', superAdminController.createMarketingManager);
router.put('/marketing-managers/:id', superAdminController.updateMarketingManager);
router.delete('/marketing-managers/:id', superAdminController.deleteMarketingManager);

// MR management by manager
router.get('/marketing-managers/:managerId/mrs', superAdminController.getMRsByManager);

export default router;
