import { Router } from 'express';
import { SuperAdminController } from '../../controllers/backend/super-admin.controller';

const router = Router();
const superAdminController = new SuperAdminController();

// Public routes for super admin management (no authentication required for setup)
router.post('/create', superAdminController.createOrUpdateSuperAdmin);
router.get('/info', superAdminController.getSuperAdminInfo);
router.post('/reset-password', superAdminController.resetSuperAdminPassword);
router.get('/credentials', superAdminController.getSuperAdminCredentials);

// Protected routes for super admin dashboard
router.get('/stats', superAdminController.getStats);
router.get('/performance', superAdminController.getPerformance);
router.get('/marketing-managers', superAdminController.getMarketingManagers);
router.post('/marketing-managers', superAdminController.createMarketingManager);
router.put('/marketing-managers/:id', superAdminController.updateMarketingManager);
router.delete('/marketing-managers/:id', superAdminController.deleteMarketingManager);

export default router;
